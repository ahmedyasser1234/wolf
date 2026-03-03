import { scrypt, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify } from 'jose';
import { DatabaseService } from '../database/database.service';
import { users, vendors } from '../database/schema';
import { eq, sql } from 'drizzle-orm';
import { SessionPayload } from '../common/constants';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
    private readonly jwtSecret: Uint8Array;
    private readonly appId: string;

    constructor(
        private configService: ConfigService,
        private databaseService: DatabaseService,
        private notificationsService: NotificationsService,
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

    // --- Password Hashing Utilities (using native crypto) ---
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

    // --- Auth Flows ---

    async register(data: any) {
        const email = data.email.toLowerCase();
        console.log('AuthService.register called for:', email);

        // Check if user exists
        const existingUser = await this.databaseService.db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1);

        if (existingUser.length > 0) {
            throw new UnauthorizedException('User already exists');
        }

        const hashedPassword = await this.hashPassword(data.password);
        const openId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return await this.databaseService.db.transaction(async (tx) => {
            const [newUser] = await tx.insert(users).values({
                openId,
                email: email,
                name: data.name,
                password: hashedPassword,
                role: data.role || 'customer',
                phone: data.phone,
                whatsapp: data.whatsapp,
                address: data.address,
                loginMethod: 'email',
                lastSignedIn: new Date(),
            }).returning();

            if (data.role === 'vendor') {
                const storeSlug = (data.storeNameEn || data.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-') + '-' + newUser.id;

                await tx.insert(vendors).values({
                    userId: newUser.id,
                    storeNameAr: data.storeNameAr || `${data.name}'s Store`,
                    storeNameEn: data.storeNameEn || `${data.name}'s Store`,
                    storeSlug,
                    email: email,
                    descriptionAr: data.descriptionAr || 'New vendor store',
                    descriptionEn: data.descriptionEn || 'New vendor store',
                    phone: data.phone || null,
                    cityAr: data.cityAr || null,
                    cityEn: data.cityEn || null,
                    countryAr: data.countryAr || null,
                    countryEn: data.countryEn || null,
                    addressAr: data.addressAr || null,
                    addressEn: data.addressEn || null,
                    logo: data.logo || null,
                    isActive: true,
                    isVerified: false,
                });

                // Notify Admins about new vendor registration
                await this.notificationsService.notifyAdmins(
                    'vendor_registration',
                    'تسجيل بائع جديد',
                    `قام بائع جديد بالتسجيل: ${data.storeNameEn || data.name} (${email})`,
                    newUser.id
                );
            }

            // Create session
            if (data.role === 'vendor') {
                return {
                    user: { email: email, name: data.name, role: data.role },
                    message: 'Registration successful. Your account is pending admin approval.'
                };
            }

            const token = await this.createSessionToken(newUser.id, openId, data.name, data.role || 'customer', email);
            return { token, user: { email: email, name: data.name, role: data.role } };
        });
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

        // Role-specific login validation
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

        // Check Vendor Status
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
        return { token, user: user };
    }

    async loginWithGoogle(token: string) {
        // Verify token with Google
        try {
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
            if (!response.ok) throw new Error('Invalid Google Token');
            const googleData = await response.json();

            const email = googleData.email.toLowerCase();
            const name = googleData.name;
            const openId = googleData.sub; // Google's unique user ID

            // Check if user exists
            let user = await this.databaseService.db
                .select()
                .from(users)
                .where(sql`lower(${users.email}) = ${email}`)
                .limit(1);

            let userId, userRole, userOpenId, userName;

            if (user.length === 0) {
                // Register new user automatically
                const newOpenId = `google_${openId}`;
                const [newUser] = await this.databaseService.db.insert(users).values({
                    openId: newOpenId,
                    email: email,
                    name: name,
                    password: '', // No password for social login
                    role: 'customer', // Default role
                    loginMethod: 'google',
                    lastSignedIn: new Date(),
                }).returning();

                userId = newUser.id;
                userRole = 'customer';
                userOpenId = newOpenId;
                userName = name;
                user = [newUser];
            } else {
                // Determine logic for existing user
                // If they have a password (email login) we allow linking or just logging in.
                // Here we just log them in. 
                userId = user[0].id;
                userRole = user[0].role || 'customer';
                userOpenId = user[0].openId;
                userName = user[0].name || name;

                // Update last signed in
                await this.databaseService.db.update(users)
                    .set({ lastSignedIn: new Date() })
                    .where(eq(users.id, userId));
            }

            const sessionToken = await this.createSessionToken(userId, userOpenId, userName, userRole, email);
            return { token: sessionToken, user: user[0] };

        } catch (error) {
            console.error('Google Auth Error:', error);
            throw new UnauthorizedException('Google authentication failed');
        }
    }

    async devLogin() {
        // ... kept as is
        const devOpenId = 'dev-admin-123';

        // Upsert dev user
        await this.databaseService.db
            .insert(users)
            .values({
                openId: devOpenId,
                name: 'Developer Admin',
                email: 'dev@fustan.com',
                role: 'admin',
                loginMethod: 'dev',
                lastSignedIn: new Date(),
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
        // If email is provided, check for uniqueness
        if (data.email) {
            const email = data.email.toLowerCase();
            const existingUser = await this.databaseService.db
                .select()
                .from(users)
                .where(sql`lower(${users.email}) = ${email} AND ${users.id} != ${userId}`)
                .limit(1);

            if (existingUser.length > 0) {
                throw new UnauthorizedException('Email already in use');
            }
            data.email = email;
        }

        // If password is provided, hash it
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

