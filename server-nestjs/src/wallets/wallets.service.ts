import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { vendorWallets, walletTransactions, vendors, customerWallets } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WalletsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly paymentsService: PaymentsService
    ) { }

    // --- Vendor Wallets ---
    async getOrCreateWallet(vendorId: number) {
        let [wallet] = await this.databaseService.db
            .select()
            .from(vendorWallets)
            .where(eq(vendorWallets.vendorId, vendorId))
            .limit(1);

        if (!wallet) {
            [wallet] = await this.databaseService.db
                .insert(vendorWallets)
                .values({
                    vendorId,
                    availableBalance: 0,
                    pendingBalance: 0,
                })
                .returning();
        }

        return wallet;
    }

    async getTransactions(vendorId: number) {
        const wallet = await this.getOrCreateWallet(vendorId);

        return await this.databaseService.db
            .select()
            .from(walletTransactions)
            .where(eq(walletTransactions.walletId, wallet.id))
            .orderBy(desc(walletTransactions.createdAt));
    }

    async handleOrderPaid(vendorId: number, orderId: number, amount: number) {
        const wallet = await this.getOrCreateWallet(vendorId);

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(vendorWallets)
                .set({
                    pendingBalance: Number(wallet.pendingBalance) + amount,
                    updatedAt: new Date(),
                })
                .where(eq(vendorWallets.id, wallet.id));

            await tx.insert(walletTransactions).values({
                walletId: wallet.id,
                amount,
                type: 'credit',
                status: 'pending',
                relatedId: orderId,
                description: `الأرباح المعلقة للطلب الجديد رقم #${orderId}`,
            });
        });
    }

    async handleOrderDelivered(vendorId: number, orderId: number, amount: number) {
        const wallet = await this.getOrCreateWallet(vendorId);

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(vendorWallets)
                .set({
                    pendingBalance: Math.max(0, Number(wallet.pendingBalance) - amount),
                    availableBalance: Number(wallet.availableBalance) + amount,
                    updatedAt: new Date(),
                })
                .where(eq(vendorWallets.id, wallet.id));

            await tx.update(walletTransactions)
                .set({ status: 'completed' })
                .where(and(
                    eq(walletTransactions.walletId, wallet.id),
                    eq(walletTransactions.relatedId, orderId),
                    eq(walletTransactions.type, 'credit')
                ));
        });
    }

    // --- Customer Wallets ---
    async getOrCreateCustomerWallet(userId: number) {
        let [wallet] = await this.databaseService.db
            .select()
            .from(customerWallets)
            .where(eq(customerWallets.userId, userId))
            .limit(1);

        if (!wallet) {
            [wallet] = await this.databaseService.db
                .insert(customerWallets)
                .values({
                    userId,
                    balance: 0,
                })
                .returning();
        }
        return wallet;
    }

    async deductBalance(userId: number, amount: number, description: string) {
        const wallet = await this.getOrCreateCustomerWallet(userId);

        if (Number(wallet.balance) < amount) {
            throw new BadRequestException('رصيد المحفظة غير كافٍ');
        }

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(customerWallets)
                .set({
                    balance: Number(wallet.balance) - amount,
                    updatedAt: new Date(),
                })
                .where(eq(customerWallets.id, wallet.id));

            await tx.insert(walletTransactions).values({
                walletId: wallet.id,
                amount: -amount,
                type: 'payment',
                status: 'completed',
                description,
            });
        });
    }

    async topUpBalance(userId: number, amount: number, referenceId: string, description: string = 'شحن رصيد المحفظة') {
        const wallet = await this.getOrCreateCustomerWallet(userId);

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(customerWallets)
                .set({
                    balance: Number(wallet.balance) + amount,
                    updatedAt: new Date(),
                })
                .where(eq(customerWallets.id, wallet.id));

            await tx.insert(walletTransactions).values({
                walletId: wallet.id,
                amount,
                type: 'funding',
                status: 'completed',
                referenceId,
                description,
            });
        });
    }

    async getCustomerWallet(userId: number) {
        const wallet = await this.getOrCreateCustomerWallet(userId);
        const transactions = await this.databaseService.db
            .select()
            .from(walletTransactions)
            .where(eq(walletTransactions.walletId, wallet.id))
            .orderBy(desc(walletTransactions.createdAt));

        return { wallet, transactions };
    }

    async createTopUpSession(userId: number, userEmail: string, amount: number, gateway?: string) {
        let selectedGateway = gateway;
        if (!selectedGateway) {
            const activeGw = await this.paymentsService.getActiveCardGateway();
            if (!activeGw) {
                throw new BadRequestException('لا توجد بوابة دفع متاحة حالياً لشحن المحفظة');
            }
            selectedGateway = activeGw.name;
        }
        return this.paymentsService.createWalletTopUpSession(selectedGateway, userId, amount, userEmail);
    }
}
