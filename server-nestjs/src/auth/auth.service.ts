import { scrypt, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify } from 'jose';
import { DatabaseService } from '../database/database.service';
import { users, vendors, otpVerifications } from '../database/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { SessionPayload } from '../common/constants';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    private readonly jwtSecret: Uint8Array;
    private readonly appId: string;

    constructor(
        private configService: ConfigService,
        private databaseService: DatabaseService,
        private notificationsService: NotificationsService,
        private mailService: MailService,
    ) {
        const secret = this.configService.get<string>('JWT_SECRET', 'dev-secret-123456');
        this.jwtSecret = new TextEncoder().encode(secret);
        this.appId = this.configService.get<string>('VITE_APP_ID', 'fustan-app');
    }

    async createSessionToken(id: number, openId: string, name: string, role: string, email?: string): Promise<string> {
        const payload: SessionPayload = {
            id,
            openId,
            appId: this.appId,
            name,
            role,
            email,
        };

        return await new SignJWT(payload as any)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('365d')
            .sign(this.jwtSecret);
    }

    async verifySession(token: string): Promise<SessionPayload | null> {
        try {
            const { payload } = await jwtVerify(token, this.jwtSecret);
            const sessionPayload = payload as unknown as SessionPayload;

            if (sessionPayload.appId !== this.appId) {
                return null;
            }

            return sessionPayload;
        } catch (error) {
            return null;
        }
    }

    private async hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const salt = randomBytes(16).toString('hex');
            scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(`${salt}:${derivedKey.toString('hex')}`);
            });
        });
    }

    private async validatePassword(password: string, hash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const [salt, key] = hash.split(':');
            scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(key === derivedKey.toString('hex'));
            });
        });
    }

    async register(data: any) {
        const email = data.email.toLowerCase();

        const existingUser = await this.databaseService.db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1);

        if (existingUser.length > 0) {
            throw new UnauthorizedException('User already exists');
        }

        let isDuplicate = false;
        if (data.phone) {
            const possibleDuplicatePhone = await this.databaseService.db
                .select()
                .from(users)
                .where(eq(users.phone, data.phone))
                .limit(1);
            if (possibleDuplicatePhone.length > 0) {
                isDuplicate = true;
            }
        }

        const hashedPassword = await this.hashPassword(data.password);
        const openId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60000);

        return await this.databaseService.db.transaction(async (tx) => {
            const [newUser] = await tx.insert(users).values({
                openId,
                email,
                name: data.name,
                password: hashedPassword,
                role: data.role || 'customer',
                phone: data.phone,
                whatsapp: data.whatsapp,
                address: data.address,
                loginMethod: 'email',
                lastSignedIn: new Date(),
                isDuplicate,
                isVerified: false,
            }).returning();

            await tx.insert(otpVerifications).values({
                email,
                code: otpCode,
                type: 'registration',
                expiresAt,
            });

            if (data.role === 'vendor') {
                const storeSlug = (data.storeNameEn || data.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-') + '-' + newUser.id;

                await tx.insert(vendors).values({
                    userId: newUser.id,
                    storeNameAr: data.storeNameAr || `${data.name}'s Store`,
                    storeNameEn: data.storeNameEn || `${data.name}'s Store`,
                    storeSlug,
                    email,
                    descriptionAr: data.descriptionAr || 'New vendor store',
                    descriptionEn: data.descriptionEn || 'New vendor store',
                    phone: data.phone || null,
                    isActive: true,
                    isVerified: false,
                });

                await this.notificationsService.notifyAdmins(
                    'vendor_registration',
                    'تسجيل بائع جديد',
                    `قام بائع جديد بالتسجيل: ${data.storeNameEn || data.name} (${email})`,
                    newUser.id
                );
            }

            await this.mailService.sendOTP(email, otpCode, 'registration');

            return {
                user: { email, name: data.name, role: data.role },
                requiresVerification: true,
                message: 'Please verify your email to continue.'
            };
        });
    }

    async verifyRegistrationOtp(email: string, code: string) {
        const emailLower = email.toLowerCase();
        const [otp] = await this.databaseService.db
            .select()
            .from(otpVerifications)
            .where(and(
                eq(otpVerifications.email, emailLower),
                eq(otpVerifications.code, code),
                eq(otpVerifications.type, 'registration'),
                gte(otpVerifications.expiresAt, new Date())
            ))
            .limit(1);

        if (!otp) {
            throw new UnauthorizedException('Invalid or expired verification code');
        }

        const [user] = await this.databaseService.db
            .update(users)
            .set({ isVerified: true })
            .where(eq(users.email, emailLower))
            .returning();

        await this.databaseService.db.delete(otpVerifications).where(eq(otpVerifications.id, otp.id));

        const token = await this.createSessionToken(user.id, user.openId!, user.name!, user.role, user.email || undefined);
        return { token, user };
    }

    async requestPasswordReset(email: string) {
        const emailLower = email.toLowerCase();
        const [user] = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.email, emailLower))
            .limit(1);

        if (!user) {
            return { message: 'If an account exists, a reset code has been sent.' };
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60000);

        await this.databaseService.db.insert(otpVerifications).values({
            email: emailLower,
            code: otpCode,
            type: 'password_reset',
            expiresAt,
        });

        await this.mailService.sendOTP(emailLower, otpCode, 'password_reset');
        return { message: 'Reset code sent.' };
    }

    async resetPassword(data: any) {
        const emailLower = data.email.toLowerCase();
        const [otp] = await this.databaseService.db
            .select()
            .from(otpVerifications)
            .where(and(
                eq(otpVerifications.email, emailLower),
                eq(otpVerifications.code, data.code),
                eq(otpVerifications.type, 'password_reset'),
                gte(otpVerifications.expiresAt, new Date())
            ))
            .limit(1);

        if (!otp) {
            throw new UnauthorizedException('Invalid or expired reset code');
        }

        const hashedPassword = await this.hashPassword(data.password);

        await this.databaseService.db
            .update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.email, emailLower));

        await this.databaseService.db.delete(otpVerifications).where(eq(otpVerifications.id, otp.id));

        return { message: 'Password reset successfully.' };
    }

    async resendOtp(email: string, type: 'registration' | 'password_reset') {
        const emailLower = email.toLowerCase();

        await this.databaseService.db.delete(otpVerifications).where(and(
            eq(otpVerifications.email, emailLower),
            eq(otpVerifications.type, type)
        ));

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60000);

        await this.databaseService.db.insert(otpVerifications).values({
            email: emailLower,
            code: otpCode,
            type,
            expiresAt,
        });

        await this.mailService.sendOTP(emailLower, otpCode, type);
        return { message: 'New code sent.' };
    }

    async login(data: { email: string; password: string; role?: string }) {
        const email = data.email.toLowerCase();
        const userData = await this.databaseService.db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1);

        if (userData.length === 0 || !userData[0].password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const user = userData[0];

        if (data.role && user.role !== data.role) {
            const roleLabels: any = {
                admin: 'Administrator',
                vendor: 'Vendor',
                customer: 'Customer'
            };
            const currentRole = roleLabels[user.role] || user.role;
            throw new UnauthorizedException(
                `This account is registered as a ${currentRole}. Please use the correct login page.`
            );
        }

        if (user.status === 'blocked') {
            throw new UnauthorizedException('This account has been blocked by the administrator.');
        }

        if (user.loginMethod === 'email' && !user.isVerified && user.role !== 'admin') {
            throw new UnauthorizedException('Your email is not verified. Please verify your email.');
        }

        if (user.role === 'vendor') {
            const vendor = await this.databaseService.db
                .select()
                .from(vendors)
                .where(eq(vendors.userId, user.id))
                .limit(1);

            if (vendor.length > 0) {
                if (vendor[0].status === 'pending') {
                    throw new UnauthorizedException('Your account is currently pending admin approval.');
                }
                if (vendor[0].status === 'rejected') {
                    throw new UnauthorizedException('Your account has been rejected by the administrator.');
                }
            }
        }

        const isValid = await this.validatePassword(data.password, user.password!);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = await this.createSessionToken(user.id, user.openId as string, (user.name || 'User') as string, (user.role || 'customer') as string, user.email || undefined);
        return { token, user };
    }

    async loginWithGoogle(token: string) {
        try {
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
            if (!response.ok) throw new Error('Invalid Google Token');
            const googleData = await response.json();

            const email = googleData.email.toLowerCase();
            const name = googleData.name;
            const openId = googleData.sub;

            let user = await this.databaseService.db
                .select()
                .from(users)
                .where(sql`lower(${users.email}) = ${email}`)
                .limit(1);

            let userId, userRole, userOpenId, userName;

            if (user.length === 0) {
                const newOpenId = `google_${openId}`;
                const [newUser] = await this.databaseService.db.insert(users).values({
                    openId: newOpenId,
                    email,
                    name,
                    password: '',
                    role: 'customer',
                    loginMethod: 'google',
                    lastSignedIn: new Date(),
                    isVerified: true, // Social login is pre-verified
                }).returning();

                userId = newUser.id;
                userRole = 'customer';
                userOpenId = newOpenId;
                userName = name;
                user = [newUser];
            } else {
                userId = user[0].id;
                userRole = user[0].role || 'customer';
                userOpenId = user[0].openId;
                userName = user[0].name || name;

                await this.databaseService.db.update(users)
                    .set({ lastSignedIn: new Date() })
                    .where(eq(users.id, userId));
            }

            if (user[0].status === 'blocked') {
                throw new UnauthorizedException('This account has been blocked by the administrator.');
            }

            const sessionToken = await this.createSessionToken(userId, userOpenId, userName, userRole, email);
            return { token: sessionToken, user: user[0] };

        } catch (error) {
            console.error('Google Auth Error:', error);
            throw new UnauthorizedException('Google authentication failed');
        }
    }

    async devLogin() {
        const devOpenId = 'dev-admin-123';

        await this.databaseService.db
            .insert(users)
            .values({
                openId: devOpenId,
                name: 'Developer Admin',
                email: 'dev@fustan.com',
                role: 'admin',
                loginMethod: 'dev',
                lastSignedIn: new Date(),
                isVerified: true,
            })
            .onConflictDoUpdate({
                target: users.openId,
                set: {
                    lastSignedIn: new Date(),
                    role: 'admin',
                },
            });

        const user = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.openId, devOpenId))
            .limit(1);

        const token = await this.createSessionToken(user[0].id, devOpenId, 'Developer Admin', 'admin', user[0].email || undefined);
        return { token, user: user[0] };
    }

    async updateProfile(userId: number, data: any) {
        if (data.email) {
            const email = data.email.toLowerCase();
            const [currentUser] = await this.databaseService.db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (currentUser && currentUser.email?.toLowerCase() !== email) {
                const existingUser = await this.databaseService.db
                    .select()
                    .from(users)
                    .where(sql`lower(${users.email}) = ${email} AND ${users.id} != ${userId}`)
                    .limit(1);

                if (existingUser.length > 0) {
                    throw new UnauthorizedException('Email already in use');
                }
            }
            data.email = email;
        }

        if (data.password) {
            data.password = await this.hashPassword(data.password);
        }

        const [updatedUser] = await this.databaseService.db
            .update(users)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

        return updatedUser;
    }

    async findUserByOpenId(openId: string) {
        const result = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.openId, openId))
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }
}
