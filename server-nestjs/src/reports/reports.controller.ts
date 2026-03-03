import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';
import { COOKIE_NAME } from '../common/constants';

@Controller('admin/reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly authService: AuthService
    ) { }

    private async isAdmin(req: Request): Promise<boolean> {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) return false;

        const payload = await this.authService.verifySession(token);
        if (!payload) return false;

        return payload.role === 'admin';
    }

    @Get('commissions')
    async getCommissions(@Req() req: Request) {
        const isAdmin = await this.isAdmin(req);
        if (!isAdmin) throw new UnauthorizedException('Admin access required');

        return await this.reportsService.getVendorCommissions();
    }

    @Get('analytics')
    async getAnalytics(@Req() req: Request) {
        try {
            const isAdmin = await this.isAdmin(req);
            if (!isAdmin) throw new UnauthorizedException('Admin access required');

            return await this.reportsService.getDashboardAnalytics();
        } catch (error) {
            console.error('Error in getAnalytics:', error);
            throw error;
        }
    }
}
