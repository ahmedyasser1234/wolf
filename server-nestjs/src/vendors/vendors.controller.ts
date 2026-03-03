import { Controller, Get, Req, UnauthorizedException, Query, Patch, Param, Body, UseInterceptors, UploadedFiles, NotFoundException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VendorsService } from './vendors.service';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';
import { COOKIE_NAME } from '../common/constants';

@Controller('vendors')
export class VendorsController {
    constructor(
        private vendorsService: VendorsService,
        private authService: AuthService,
    ) { }

    private async getUserId(req: Request): Promise<number> {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException('No token found');

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException('Invalid session');

        // Look up user ID from openId in payload
        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException('User not found');

        return user.id;
    }

    private async getUser(req: Request) {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException('No token found');

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException('Invalid session');

        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException('User not found');

        return user;
    }

    @Get('pending')
    async getPending(@Req() req: Request) {
        const user = await this.getUser(req);
        if (user.role !== 'admin') throw new UnauthorizedException('Admin access required');
        return this.vendorsService.findAllPending();
    }

    @Patch(':id/status')
    async updateStatus(
        @Req() req: Request,
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        const user = await this.getUser(req);
        if (user.role !== 'admin') throw new UnauthorizedException('Admin access required');
        return this.vendorsService.updateStatus(+id, status);
    }

    @Get()
    async findAll() {
        return this.vendorsService.findAll();
    }

    @Get('dashboard')
    async getDashboard(@Req() req: Request) {
        const userId = await this.getUserId(req);
        const vendor = await this.vendorsService.findByUserId(userId);

        if (!vendor) {
            throw new UnauthorizedException('Vendor profile not found');
        }

        const stats = await this.vendorsService.getStats(vendor.id);
        const recentOrders = await this.vendorsService.getRecentOrders(vendor.id);

        return {
            vendor,
            stats,
            recentOrders,
        };
    }

    @Get('orders')
    async getOrders(@Req() req: Request, @Query('page') page?: string) {
        const userId = await this.getUserId(req);
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) throw new UnauthorizedException();
        return this.vendorsService.getOrders(vendor.id, page ? +page : 1);
    }

    @Get('customers')
    async getCustomers(@Req() req: Request) {
        const userId = await this.getUserId(req);
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) throw new UnauthorizedException();
        return this.vendorsService.getCustomers(vendor.id);
    }

    @Get('customers/:customerId')
    async getCustomerDetails(@Req() req: Request, @Param('customerId') customerId: string) {
        const userId = await this.getUserId(req);
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) throw new UnauthorizedException();
        return this.vendorsService.getCustomerDetails(vendor.id, +customerId);
    }

    @Get('analytics')
    async getAnalytics(@Req() req: Request) {
        const userId = await this.getUserId(req);
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) throw new UnauthorizedException();
        return this.vendorsService.getAnalytics(vendor.id);
    }

    @Get(':idOrSlug')
    async getOne(@Param('idOrSlug') idOrSlug: string) {
        const vendor = await this.vendorsService.findOne(idOrSlug);
        if (!vendor) throw new NotFoundException('Vendor not found');
        return vendor;
    }

    @Patch(':id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'logo', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
        { name: 'gallery', maxCount: 10 }
    ]))
    async update(
        @Param('id') id: string,
        @Body() updateVendorDto: any,
        @UploadedFiles() files: { logo?: Express.Multer.File[], banner?: Express.Multer.File[], coverImage?: Express.Multer.File[], gallery?: Express.Multer.File[] }
    ) {
        return this.vendorsService.update(+id, updateVendorDto, files);
    }
}
