import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, Req, UnauthorizedException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';
import { COOKIE_NAME } from '../common/constants';

@Controller('orders')
export class OrdersController {
    constructor(
        private ordersService: OrdersService,
        private authService: AuthService,
    ) { }

    private async getUserId(req: Request): Promise<number> {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException();

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException();

        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException('User not found');

        return user.id;
    }

    @Get()
    async findAll(@Req() req: Request) {
        const userId = await this.getUserId(req);
        return this.ordersService.findAll(userId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.findOne(id);
    }

    @Post()
    async create(
        @Req() req: Request,
        @Body('shippingAddress') shippingAddress: any,
        @Body('paymentMethod') paymentMethod?: string,
        @Body('couponCode') couponCode?: string,
        @Body('walletAmountUsed') walletAmountUsed?: number,
        @Body('installmentPlanId') installmentPlanId?: number,
        @Body('kycData') kycData?: any,
    ) {
        const userId = await this.getUserId(req);
        console.log('📦 Creating order with couponCode:', couponCode, 'WalletUsed:', walletAmountUsed, 'Installment:', installmentPlanId);
        return this.ordersService.create(userId, shippingAddress, paymentMethod, couponCode, walletAmountUsed || 0, installmentPlanId, kycData);
    }

    @Patch(':id/status')
    async updateStatus(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: string,
    ) {
        const userId = await this.getUserId(req);
        return this.ordersService.updateStatus(id, status, userId);
    }

    @Post(':id/kyc-review')
    async reviewKycRequest(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
        @Body('action') action: 'approve' | 'reject',
        @Body('reason') reason?: string,
    ) {
        const adminUserId = await this.getUserId(req);
        // Additional auth check for admin role ideally happens in service or via guard
        return this.ordersService.reviewKycRequest(id, action, adminUserId, reason);
    }

    @Post(':id/pay-installment-downpayment')
    async payDownPayment(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const userId = await this.getUserId(req);
        return this.ordersService.getDownPaymentCheckoutUrl(id, userId);
    }
}
