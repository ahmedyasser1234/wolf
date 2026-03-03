import { Controller, Get, Post, Res, Req, Body, UseInterceptors, UploadedFile, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { COOKIE_NAME, ONE_YEAR_MS } from '../common/constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../media/cloudinary.provider';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private readonly cloudinary: CloudinaryService
    ) { }

    @Get('dev-login')
    async devLogin(@Res({ passthrough: true }) res: Response) {
        try {
            const { token } = await this.authService.devLogin();

            res.cookie(COOKIE_NAME, token, {
                httpOnly: true,
                path: '/',
                sameSite: 'none',
                secure: true,
                maxAge: ONE_YEAR_MS,
            });

            return res.redirect('/');
        } catch (error) {
            console.error('Dev Login Error:', error);
            return res.status(500).json({ message: 'Dev login failed', error: String(error) });
        }
    }

    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @Post('login')
    async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
        const { token, user } = await this.authService.login(body);

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            path: '/',
            sameSite: 'none',
            secure: true,
            maxAge: ONE_YEAR_MS,
        });

        return { user, token };
    }

    @Post('google')
    async googleLogin(@Body('token') googleToken: string, @Res({ passthrough: true }) res: Response) {
        const { token, user } = await this.authService.loginWithGoogle(googleToken);

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            path: '/',
            sameSite: 'none',
            secure: true,
            maxAge: ONE_YEAR_MS,
        });

        return { user, token };
    }

    @Throttle({ auth: { limit: 3, ttl: 60000 } })
    @Post('register')
    @UseInterceptors(FileInterceptor('logo'))
    async register(
        @Body() body: any,
        @UploadedFile(new FileValidationPipe()) logo: Express.Multer.File,
        @Res({ passthrough: true }) res: Response
    ) {
        console.log('Register request received:', body);
        try {
            // If body is from FormData, some fields might need parsing if they are objects,
            // but for now we expect flat strings from the registration form.

            // Upload logo if present
            let logoUrl = null;
            if (logo) {
                const result = await this.cloudinary.uploadFile(logo);
                if ('secure_url' in result) {
                    logoUrl = result.secure_url;
                }
            }

            const { token, user } = await this.authService.register({ ...body, logo: logoUrl });
            console.log('Register success, token created');

            res.cookie(COOKIE_NAME, token, {
                httpOnly: true,
                path: '/',
                sameSite: 'none',
                secure: true,
                maxAge: ONE_YEAR_MS,
            });

            return { user, token };
        } catch (error) {
            console.error('Register Controller Error:', error);
            throw error;
        }
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            path: '/',
            sameSite: 'none',
            secure: true,
        });
        return { success: true };
    }

    @Get('me')
    async me(@Req() req: Request) {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) return null;

        const payload = await this.authService.verifySession(token);
        if (!payload) return null;

        const user = await this.authService.findUserByOpenId(payload.openId);
        return { user, token };
    }

    @Get('profile')
    async getProfile(@Req() req: Request) {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException();

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException();

        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException();

        return user;
    }

    @Post('profile')
    @UseInterceptors(FileInterceptor('avatar'))
    async updateProfile(
        @Req() req: Request,
        @Body() body: any,
        @UploadedFile(new FileValidationPipe()) avatar: Express.Multer.File
    ) {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException();

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException();

        const updateData = { ...body };

        if (avatar) {
            const result = await this.cloudinary.uploadFile(avatar);
            if ('secure_url' in result) {
                updateData.avatar = result.secure_url;
            }
        }

        return this.authService.updateProfile(payload.id, updateData);
    }
}
