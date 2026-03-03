import { Controller, Get, Post, Delete, Body, Param, Req, UnauthorizedException, ParseIntPipe } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AuthService } from '../auth/auth.service';
import { VendorsService } from '../vendors/vendors.service';
import type { Request } from 'express';
import { COOKIE_NAME } from '../common/constants';

@Controller('shipping')
export class ShippingController {
    constructor(
        private shippingService: ShippingService,
        private authService: AuthService,
        private vendorsService: VendorsService,
    ) { }

    private async getVendorId(req: Request): Promise<number> {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException();

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException();

        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException();

        const vendor = await this.vendorsService.findByUserId(user.id);
        if (!vendor) throw new UnauthorizedException('Vendor not found');

        return vendor.id;
    }

    @Get()
    async findAll(@Req() req: Request) {
        const vendorId = await this.getVendorId(req);
        return this.shippingService.findAll(vendorId);
    }

    @Get('product/:productId')
    async findByProduct(@Param('productId', ParseIntPipe) productId: number) {
        return this.shippingService.findByProduct(productId);
    }

    @Post()
    async upsert(
        @Req() req: Request,
        @Body('productId') productId: number,
        @Body('shippingCost') shippingCost: number,
    ) {
        const vendorId = await this.getVendorId(req);
        return this.shippingService.upsert(vendorId, productId, shippingCost);
    }

    @Delete(':productId')
    async delete(@Param('productId', ParseIntPipe) productId: number) {
        return this.shippingService.delete(productId);
    }
}
