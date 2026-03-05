import { Controller, Post, Body, UseGuards, Request, Get, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gift-cards')
export class GiftCardsController {
    constructor(private readonly giftCardsService: GiftCardsService) { }

    // Admin: List all gift cards
    @Get()
    async findAll() {
        return this.giftCardsService.findAll();
    }

    // Admin: Create a new gift card (generates a code)
    @Post()
    async create(@Body() data: any) {
        return this.giftCardsService.createGiftCard(data);
    }

    // Admin: Delete a gift card
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.giftCardsService.deleteGiftCard(id);
    }

    // Customer: Redeem a gift card code to wallet
    @UseGuards(JwtAuthGuard)
    @Post('redeem')
    async redeem(@Request() req, @Body('code') code: string) {
        const userId = req.user.id;
        return this.giftCardsService.redeemGiftCard(code, userId);
    }

    // Customer: Purchase a new gift card
    @UseGuards(JwtAuthGuard)
    @Post('purchase')
    async purchase(@Request() req, @Body() data: { amount: number, recipientName?: string }) {
        // Here we just create the card directly. In a real app we'd likely verify payment first.
        // For now, this replicates the admin's create behavior but for a logged-in user.
        return this.giftCardsService.createGiftCard({
            amount: data.amount,
            recipientName: data.recipientName,
            senderName: req.user.name,
            senderEmail: req.user.email,
        });
    }
}
