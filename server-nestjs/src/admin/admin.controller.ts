import { Controller, Get, Post, Req, Res, UnauthorizedException, Param, Body, Patch, Delete, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import type { Request, Response } from 'express';
import { COOKIE_NAME } from '../common/constants';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private authService: AuthService
    ) { }

    @Get('stats')
    async getStats(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.getDashboardStats();
    }


    private async checkAdmin(req: Request) {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.[COOKIE_NAME];

        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : cookieToken;

        if (!token) {
            console.error('[AdminAuth] Manual check failed: No token found in headers or cookies');
            throw new UnauthorizedException('Authentication required (No token)');
        }

        try {
            const payload = await this.authService.verifySession(token);
            if (!payload || payload.role !== 'admin') {
                console.error(`[AdminAuth] Manual check failed: Invalid role or session. Payload: ${JSON.stringify(payload)}`);
                throw new UnauthorizedException('Not an admin or invalid session');
            }
            return payload;
        } catch (err) {
            console.error('[AdminAuth] Verification error:', err);
            throw new UnauthorizedException('Invalid token session');
        }
    }

    @Get('vendors')
    async getVendors(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.getAllVendors();
    }

    @Get('vendors/pending')
    async getPendingVendors(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.getPendingVendors();
    }

    @Post('vendors')
    async createVendor(@Req() req: Request, @Body() body: any) {
        await this.checkAdmin(req);
        return this.adminService.createVendor(body);
    }

    @Get('customers')
    async getCustomers(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.getAllCustomers();
    }

    @Patch('customers/:id/status')
    async updateCustomerStatus(
        @Req() req: Request,
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        const payload = await this.checkAdmin(req);
        const adminUser = await this.authService.findUserByOpenId(payload.openId);
        if (!adminUser) throw new UnauthorizedException('Admin not found');
        return this.adminService.updateCustomerStatus(+id, status, adminUser.id);
    }

    @Get('orders')
    async getOrders(
        @Req() req: Request,
        @Query('search') search?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('isInstallmentOnly') isInstallmentOnly?: string,
        @Query('status') status?: string
    ) {
        await this.checkAdmin(req);
        console.log(`🔍 [AdminController] getOrders - page: ${page}, limit: ${limit}, isInstallmentOnly: ${isInstallmentOnly}, status: ${status}`);
        const start = Date.now();
        const result = await this.adminService.getAllOrders(
            search,
            dateFrom,
            dateTo,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            isInstallmentOnly === 'true',
            status
        );
        console.log(`⏱️ [AdminController] getOrders took ${Date.now() - start}ms for ${result.orders.length} orders (Total: ${result.total})`);
        return result;
    }

    @Get('products')
    async getProducts(
        @Req() req: Request,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        await this.checkAdmin(req);
        return this.adminService.getAllProducts(
            search,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20
        );
    }

    @Get('conversations')
    async getConversations(@Req() req: Request) {
        const payload = await this.checkAdmin(req);
        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException('User not found');

        return this.adminService.getAllConversations(user.id);
    }

    @Patch('vendors/:id/email')
    async updateVendorEmail(@Req() req: Request, @Param('id') id: string, @Body('email') email: string) {
        await this.checkAdmin(req);
        return this.adminService.updateVendorEmail(+id, email);
    }

    @Delete('vendors/:id')
    async deleteVendor(@Req() req: Request, @Param('id') id: string) {
        await this.checkAdmin(req);
        return this.adminService.deleteVendor(+id);
    }

    @Patch('vendors/:id/commission')
    async updateVendorCommission(
        @Req() req: Request,
        @Param('id') id: string,
        @Body('commissionRate') commissionRate: number
    ) {
        await this.checkAdmin(req);
        return this.adminService.updateVendorCommission(+id, commissionRate);
    }

    @Patch('vendors/:id/status')
    async updateVendorStatus(
        @Req() req: Request,
        @Param('id') id: string,
        @Body('status') status: 'approved' | 'rejected'
    ) {
        await this.checkAdmin(req);
        if (!['approved', 'rejected'].includes(status)) {
            throw new UnauthorizedException('Invalid status');
        }
        return this.adminService.updateVendorStatus(+id, status);
    }

    @Get('customers/:id')
    async getCustomer(@Req() req: Request, @Param('id') id: string) {
        await this.checkAdmin(req);
        return this.adminService.getCustomerDetails(+id);
    }

    @Delete('customers/:id')
    async deleteCustomer(@Req() req: Request, @Param('id') id: string) {
        await this.checkAdmin(req);
        return this.adminService.deleteCustomer(+id);
    }

    @Get('customers/:id/status-logs')
    async getCustomerStatusLogs(@Req() req: Request, @Param('id') id: string) {
        await this.checkAdmin(req);
        return this.adminService.getCustomerStatusLogs(+id);
    }

    @Get('search')
    async search(@Req() req: Request, @Query('q') q: string) {
        await this.checkAdmin(req);
        return this.adminService.globalSearch(q);
    }

    // --- Payment Gateways Routes ---
    @Get('payment-gateways')
    async getPaymentGateways(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.getPaymentGateways();
    }

    @Patch('payment-gateways/:id/toggle')
    async toggleGateway(@Req() req: Request, @Param('id') id: string, @Body('isEnabled') isEnabled: boolean) {
        await this.checkAdmin(req);
        return this.adminService.updatePaymentGatewayToggle(+id, isEnabled);
    }

    @Patch('payment-gateways/:id/credentials')
    async updateCredentials(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
        await this.checkAdmin(req);
        return this.adminService.updatePaymentGatewayCredentials(
            +id,
            body.apiKey,
            body.publishableKey,
            body.merchantId,
            body.config
        );
    }

    @Get('payment-gateways/seed')
    async seedGateways(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.getPaymentGateways(); // Service auto-seeds if empty
    }

    // --- Excel Export/Import Routes ---
    @Get('export/customers')
    async exportCustomers(@Req() req: Request, @Res() res: Response) {
        await this.checkAdmin(req);
        const buffer = await this.adminService.exportCustomers();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
        res.send(buffer);
    }

    @Post('import/customers')
    async importCustomers(@Req() req: Request, @Body() body: any[]) {
        await this.checkAdmin(req);
        return this.adminService.importCustomers(body);
    }

    @Get('export/shipping')
    async exportShipping(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.exportShipping();
    }

    @Get('catalog/seed-tech')
    async seedTechCatalog(@Req() req: Request) {
        await this.checkAdmin(req);
        return this.adminService.seedProductsCatalog();
    }

    @Get('force-setup')
    async forceSetup() {
        return this.adminService.forceSetup();
    }
}
