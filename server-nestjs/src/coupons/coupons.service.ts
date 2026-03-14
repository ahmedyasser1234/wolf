
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { coupons } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { MailService } from '../mail/mail.service';
import { users } from '../database/schema';

@Injectable()
export class CouponsService {
    constructor(
        private databaseService: DatabaseService,
        private mailService: MailService
    ) { }

    async create(data: {
        code: string;
        vendorId?: number;
        type?: string;
        discountPercent?: number;
        discountAmount?: number;
        maxUses?: number;
        isActive?: boolean;
    }) {
        // Check if code exists
        const existing = await this.databaseService.db
            .select()
            .from(coupons)
            .where(eq(coupons.code, data.code))
            .limit(1);

        if (existing.length > 0) {
            throw new BadRequestException('الكود مستخدم من قبل');
        }

        const [coupon] = await this.databaseService.db
            .insert(coupons)
            .values({
                code: data.code,
                vendorId: data.vendorId,
                type: data.type || 'percentage',
                discountPercent: data.discountPercent,
                discountAmount: data.discountAmount,
                maxUses: data.maxUses,
                isActive: data.isActive !== undefined ? data.isActive : true,
            })
            .returning();

        // Email broadcast removed as per requested by the user

        return coupon;
    }

    async findAll(vendorId?: number) {
        if (vendorId) {
            return await this.databaseService.db
                .select()
                .from(coupons)
                .where(eq(coupons.vendorId, vendorId));
        }
        return await this.databaseService.db.select().from(coupons);
    }

    async findByCode(code: string) {
        const result = await this.databaseService.db
            .select()
            .from(coupons)
            .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
            .limit(1);

        if (result.length === 0) {
            throw new NotFoundException('الكود غير صالح');
        }

        const coupon = result[0];
        if (coupon.maxUses !== null && (coupon.usedCount || 0) >= coupon.maxUses) {
            throw new BadRequestException('تم تجاوز حد استخدام الكود');
        }

        return coupon;
    }

    async remove(id: number) {
        await this.databaseService.db.delete(coupons).where(eq(coupons.id, id));
        return { success: true };
    }

    async update(id: number, data: {
        code?: string;
        type?: string;
        discountPercent?: number;
        discountAmount?: number;
        maxUses?: number;
        isActive?: boolean
    }) {
        // Check if code exists for other coupons (if code is being updated)
        if (data.code) {
            const existing = await this.databaseService.db
                .select()
                .from(coupons)
                .where(and(eq(coupons.code, data.code), sql`${coupons.id} != ${id}`))
                .limit(1);

            if (existing.length > 0) {
                throw new BadRequestException('الكود مستخدم من قبل');
            }
        }

        const [updatedCoupon] = await this.databaseService.db
            .update(coupons)
            .set(data)
            .where(eq(coupons.id, id))
            .returning();

        if (!updatedCoupon) {
            throw new NotFoundException('الكوبون غير موجود');
        }

        return updatedCoupon;
    }
}
