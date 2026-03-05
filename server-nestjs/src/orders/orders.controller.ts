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
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.[COOKIE_NAME];

        console.log(`🔑 [OrdersController] Auth Check - Header: ${!!authHeader}, Cookie: ${!!cookieToken}`);

        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : cookieToken;

        if (!token) {
            console.log('❌ [OrdersController] No token found in request');
            throw new UnauthorizedException();
        }

        const payload = await this.authService.verifySession(token);
        if (!payload) {
            console.log('❌ [OrdersController] Invalid or expired token');
            throw new UnauthorizedException();
        }

        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) {
            console.log(`❌ [OrdersController] User not found for openId: ${payload.openId}`);
            throw new UnauthorizedException('User not found');
        }

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
        @Body('depositPaymentMethod') depositPaymentMethod?: 'wallet' | 'card' | 'gift_card',
        @Body('depositGiftCardCode') depositGiftCardCode?: string,
    ) {
        console.log('📩 [OrdersController] POST /api/orders RECEIVED');
        const userId = await this.getUserId(req);
        console.log(`📦 [OrdersController] Creating order for User: ${userId}`);
        console.log('   - Payload Summary:', {
            paymentMethod,
            couponCode,
            walletAmountUsed,
            installmentPlanId,
            depositPaymentMethod,
            hasKyc: !!kycData,
            hasAddress: !!shippingAddress
        });

        const language = (req.headers['x-language'] as string) || 'ar';
        return this.ordersService.create(
            userId,
            shippingAddress,
            paymentMethod,
            couponCode,
            walletAmountUsed || 0,
            installmentPlanId,
            kycData,
            depositPaymentMethod,
            depositGiftCardCode,
            language
        );
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

    @Post(':id/confirm-deposit')
    async confirmDepositPayment(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.[COOKIE_NAME];
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;
        if (!token) throw new UnauthorizedException();

        const payload = await this.authService.verifySession(token);
        if (!payload || payload.role !== 'admin') {
            throw new UnauthorizedException('Only admins can confirm deposit payments');
        }

        return this.ordersService.confirmDepositPayment(id, payload.id);
    }
}
