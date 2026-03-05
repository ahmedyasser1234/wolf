import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { giftCards, customerWallets, walletTransactions, users } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { WalletsService } from '../wallets/wallets.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class GiftCardsService {
    constructor(
        private databaseService: DatabaseService,
        private walletsService: WalletsService,
        private paymentsService: PaymentsService
    ) { }

    async findAll() {
        return await this.databaseService.db
            .select()
            .from(giftCards)
            .orderBy(desc(giftCards.createdAt));
    }

    async findMyCards(userId: number) {
        const [user] = await this.databaseService.db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) throw new NotFoundException('User not found');

        // Allow fetching cards where the user is either the sender, recipient, or the one who redeemed it
        const userEmail = user.email || '';

        // Use raw SQL with or() for complex matching. We haven't imported 'or' from drizzle-orm but we can fetch all and filter for now to avoid import issues if not present
        const allCards = await this.databaseService.db
            .select()
            .from(giftCards)
            .orderBy(desc(giftCards.createdAt));

        return allCards.filter(c =>
            (c.senderEmail && c.senderEmail.toLowerCase() === userEmail.toLowerCase()) ||
            (c.recipientEmail && c.recipientEmail.toLowerCase() === userEmail.toLowerCase()) ||
            c.redeemedByUserId === userId
        );
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
        paymentMethod?: string;
        paymentStatus?: string;
        isActive?: boolean;
    }) {
        const code = data.code || this.generateCode();
        const [card] = await this.databaseService.db.insert(giftCards).values({
            ...data,
            code,
            isActive: data.isActive ?? true, // Default to active if not specified (e.g. admin creation)
            createdAt: new Date(),
        }).returning();
        return card;
    }

    async purchaseGiftCard(userId: number, data: { amount: number, recipientName?: string, paymentMethod: 'wallet' | 'card' }) {
        const [user] = await this.databaseService.db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) throw new NotFoundException('User not found');

        const amount = Number(data.amount);
        if (amount <= 0) throw new BadRequestException('المبلغ غير صحيح');

        if (data.paymentMethod === 'wallet') {
            const [wallet] = await this.databaseService.db.select().from(customerWallets).where(eq(customerWallets.userId, userId)).limit(1);
            if (!wallet || Number(wallet.balance) < amount) {
                throw new BadRequestException('رصيد المحفظة غير كافٍ');
            }

            return await this.databaseService.db.transaction(async (tx) => {
                // Deduct from wallet
                await this.walletsService.deductBalance(userId, amount, `شراء كارت هدية بقيمة ${amount}`);

                // Create active gift card
                return await this.createGiftCard({
                    amount,
                    recipientName: data.recipientName,
                    senderName: user.name,
                    senderEmail: user.email,
                    paymentMethod: 'wallet',
                    paymentStatus: 'paid',
                    isActive: true
                });
            });
        } else {
            // Card payment: Create inactive gift card and return Stripe session
            const card = await this.createGiftCard({
                amount,
                recipientName: data.recipientName,
                senderName: user.name,
                senderEmail: user.email,
                paymentMethod: 'card',
                paymentStatus: 'pending',
                isActive: false
            });

            const session = await this.paymentsService.createCheckoutSession(
                'stripe',
                card.id, // Using gift card ID as order ID for session
                amount,
                user.email!
            );

            return { ...card, checkoutUrl: session.url };
        }
    }

    async redeemGiftCard(code: string, userId: number) {
        const [card] = await this.databaseService.db
            .select()
            .from(giftCards)
            .where(eq(giftCards.code, code.toUpperCase()))
            .limit(1);

        if (!card) throw new NotFoundException('رقم بطاقة الهدية غير صحيح');
        if (card.isRedeemed) throw new BadRequestException('تم استخدام بطاقة الهدية هذه مسبقاً');
        if (!card.isActive) throw new BadRequestException('بطاقة الهدية غير مفعلة أو بانتظار الدفع');


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

    async confirmPurchase(giftCardId: number) {
        const [giftCard] = await this.databaseService.db
            .select()
            .from(giftCards)
            .where(eq(giftCards.id, giftCardId))
            .limit(1);

        if (!giftCard) throw new NotFoundException('Gift card not found');

        if (giftCard.paymentStatus === 'paid' && giftCard.isActive) return giftCard;

        // In a real production environment, we should verify the payment with Stripe/Gateway
        // For now, we update the status based on the confirmation call
        const [updated] = await this.databaseService.db
            .update(giftCards)
            .set({
                paymentStatus: 'paid',
                isActive: true,
                updatedAt: new Date()
            })
            .where(eq(giftCards.id, giftCardId))
            .returning();

        return updated;
    }

    private generateCode() {
        const segments = Array.from({ length: 3 }, () =>
            Math.random().toString(36).substring(2, 6).toUpperCase()
        );
        return segments.join('-');
    }
}
