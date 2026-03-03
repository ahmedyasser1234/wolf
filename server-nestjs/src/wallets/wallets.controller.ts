import { Controller, Get, Post, Body, UseGuards, Request, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { DatabaseService } from '../database/database.service';
import { vendors } from '../database/schema';
import { eq } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
    constructor(
        private readonly walletsService: WalletsService,
        private readonly databaseService: DatabaseService
    ) { }

    @Get('my-wallet')
    async getMyWallet(@Request() req) {
        const userId = req.user.id;
        return this.walletsService.getCustomerWallet(userId);
    }

    @Post('top-up')
    async topUp(@Request() req, @Body('amount') amount: number, @Body('referenceId') referenceId: string) {
        const userId = req.user.id;
        return this.walletsService.topUpBalance(userId, amount, referenceId);
    }

    @Get('vendor-wallet')
    async getVendorWallet(@Request() req) {
        const userId = req.user.id;
        const [vendor] = await this.databaseService.db
            .select()
            .from(vendors)
            .where(eq(vendors.userId, userId))
            .limit(1);

        if (!vendor) throw new NotFoundException('Vendor profile not found');

        const wallet = await this.walletsService.getOrCreateWallet(vendor.id);
        const transactions = await this.walletsService.getTransactions(vendor.id);

        return { wallet, transactions };
    }
}
