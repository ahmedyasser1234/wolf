import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { userPoints, pointsTransactions } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { WalletsService } from '../wallets/wallets.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class PointsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly walletsService: WalletsService
    ) { }

    // 1 Point for every 1 AED spent
    private readonly POINTS_PER_CURRENCY = 1;
    private readonly REDEMPTION_THRESHOLD = 20000;
    private readonly REDEMPTION_VALUE = 100;

    async getOrCreatePoints(userId: number) {
        let [pointsRecord] = await this.databaseService.db
            .select()
            .from(userPoints)
            .where(eq(userPoints.userId, userId))
            .limit(1);

        if (!pointsRecord) {
            [pointsRecord] = await this.databaseService.db
                .insert(userPoints)
                .values({
                    userId,
                    points: 0,
                })
                .returning();
        }

        return pointsRecord;
    }

    async getHistory(userId: number) {
        return await this.databaseService.db
            .select()
            .from(pointsTransactions)
            .where(eq(pointsTransactions.userId, userId))
            .orderBy(desc(pointsTransactions.createdAt));
    }

    async earnPoints(userId: number, orderTotal: number, orderId: number) {
        const pointsToEarn = Math.floor(orderTotal * this.POINTS_PER_CURRENCY);
        if (pointsToEarn <= 0) return;

        const current = await this.getOrCreatePoints(userId);

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(userPoints)
                .set({
                    points: current.points + pointsToEarn,
                    updatedAt: new Date(),
                })
                .where(eq(userPoints.id, current.id));

            await tx.insert(pointsTransactions).values({
                userId,
                amount: pointsToEarn,
                type: 'earn',
                description: `نقاط مكافأة للطلب رقم #${orderId}`,
            });
        });
    }

    async reversePoints(userId: number, orderTotal: number, orderId: number) {
        const pointsToReverse = Math.floor(orderTotal * this.POINTS_PER_CURRENCY);
        if (pointsToReverse <= 0) return;

        const current = await this.getOrCreatePoints(userId);

        // Prevent negative points balance if they already spent them
        const actualDeduction = Math.min(pointsToReverse, current.points);
        if (actualDeduction <= 0) return;

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(userPoints)
                .set({
                    points: current.points - actualDeduction,
                    updatedAt: new Date(),
                })
                .where(eq(userPoints.id, current.id));

            await tx.insert(pointsTransactions).values({
                userId,
                amount: -actualDeduction,
                type: 'spend',
                description: `إلغاء نقاط مكافأة لاسترجاع الطلب رقم #${orderId}`,
            });
        });
    }

    async spendPoints(userId: number, amount: number, description: string) {
        const current = await this.getOrCreatePoints(userId);
        if (current.points < amount) {
            throw new BadRequestException('نقاط غير كافية');
        }

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(userPoints)
                .set({
                    points: current.points - amount,
                    updatedAt: new Date(),
                })
                .where(eq(userPoints.id, current.id));

            await tx.insert(pointsTransactions).values({
                userId,
                amount: -amount,
                type: 'spend',
                description: description,
            });
        });
    }

    async redeemPoints(userId: number) {
        const current = await this.getOrCreatePoints(userId);
        if (current.points < this.REDEMPTION_THRESHOLD) {
            throw new BadRequestException(`تحتاج إلى ${this.REDEMPTION_THRESHOLD} نقطة على الأقل للاستبدال`);
        }

        return await this.databaseService.db.transaction(async (tx) => {
            // 1. Deduct Points
            await tx.update(userPoints)
                .set({
                    points: current.points - this.REDEMPTION_THRESHOLD,
                    updatedAt: new Date(),
                })
                .where(eq(userPoints.id, current.id));

            // 2. Record Points Transaction
            await tx.insert(pointsTransactions).values({
                userId,
                amount: -this.REDEMPTION_THRESHOLD,
                type: 'spend',
                description: `استبدال ${this.REDEMPTION_THRESHOLD} نقطة بـ ${this.REDEMPTION_VALUE} درهم في المحفظة`,
            });

            // 3. Add to Wallet
            await this.walletsService.topUpBalance(userId, this.REDEMPTION_VALUE, `points-redeem-${Date.now()}`);
        });
    }
}
