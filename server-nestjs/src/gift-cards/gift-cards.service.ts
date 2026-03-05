import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { giftCards, customerWallets, walletTransactions } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class GiftCardsService {
    constructor(
        private databaseService: DatabaseService,
        private walletsService: WalletsService
    ) { }

    async findAll() {
        return await this.databaseService.db
            .select()
            .from(giftCards)
            .orderBy(desc(giftCards.createdAt));
    }

    async createGiftCard(data: {
        code?: string;
        amount: number;
        recipientName?: string;
        recipientEmail?: string;
        senderName?: string;
        senderEmail?: string;
        message?: string;
        style?: string;
    }) {
        const code = data.code || this.generateCode();
        const [card] = await this.databaseService.db.insert(giftCards).values({
            ...data,
            code,
            createdAt: new Date(),
        }).returning();
        return card;
    }

    async redeemGiftCard(code: string, userId: number) {
        const [card] = await this.databaseService.db
            .select()
            .from(giftCards)
            .where(and(eq(giftCards.code, code), eq(giftCards.isRedeemed, false)))
            .limit(1);

        if (!card) throw new NotFoundException('بطاقة الهدية غير صالحة أو تم استخدامها بالفعل');

        return await this.databaseService.db.transaction(async (tx) => {
            // Mark as redeemed
            await tx.update(giftCards)
                .set({
                    isRedeemed: true,
                    redeemedByUserId: userId,
                    redeemedAt: new Date()
                })
                .where(eq(giftCards.id, card.id));

            // Add amount to wallet
            await this.walletsService.topUpBalance(userId, Number(card.amount), `Redemption of Gift Card ${code}`);

            return { success: true, amount: card.amount };
        });
    }

    async deleteGiftCard(id: number) {
        const [deleted] = await this.databaseService.db
            .delete(giftCards)
            .where(eq(giftCards.id, id))
            .returning();
        if (!deleted) throw new NotFoundException('Gift card not found');
        return { success: true };
    }

    private generateCode() {
        const segments = Array.from({ length: 3 }, () =>
            Math.random().toString(36).substring(2, 6).toUpperCase()
        );
        return segments.join('-');
    }
}
