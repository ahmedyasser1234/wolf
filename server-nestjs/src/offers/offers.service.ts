import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { offers, offerItems, products } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class OffersService {
    constructor(private databaseService: DatabaseService) { }

    async create(vendorId: number, data: any) {
        // 1. Create Offer
        const [createdOffer] = await this.databaseService.db
            .insert(offers)
            .values({
                vendorId,
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                discountPercent: data.discountPercent,
                usageLimit: data.usageLimit,
                minQuantity: data.minQuantity || 1,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isActive: true,
            })
            .returning();

        // 2. Link Products (if any)
        if (data.productIds && data.productIds.length > 0) {
            const items = data.productIds.map((productId: number) => ({
                offerId: createdOffer.id,
                productId,
            }));
            await this.databaseService.db.insert(offerItems).values(items);
        }

        return createdOffer;
    }

    async findAll(vendorId?: number) {
        // Get offers
        const query = this.databaseService.db
            .select()
            .from(offers);

        const offersList = vendorId
            ? await query.where(eq(offers.vendorId, vendorId)).orderBy(desc(offers.createdAt))
            : await query.orderBy(desc(offers.createdAt));

        // attach productIds to each offer
        // This is N+1, but for small number of offers/products it is fine.
        // Better way: Join in one query or fetch all relations.
        const result = await Promise.all(offersList.map(async (offer) => {
            const items = await this.databaseService.db
                .select({ productId: offerItems.productId })
                .from(offerItems)
                .where(eq(offerItems.offerId, offer.id));
            return { ...offer, productIds: items.map(i => i.productId) };
        }));

        return result;
    }

    async findOne(id: number) {
        const [offer] = await this.databaseService.db
            .select()
            .from(offers)
            .where(eq(offers.id, id));

        if (!offer) return null;

        // Get associated product IDs
        const items = await this.databaseService.db
            .select({ productId: offerItems.productId })
            .from(offerItems)
            .where(eq(offerItems.offerId, id));

        return { ...offer, productIds: items.map(i => i.productId) };
    }

    async update(id: number, data: any) {
        // 1. Update Offer Details
        const [updatedOffer] = await this.databaseService.db
            .update(offers)
            .set({
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                discountPercent: data.discountPercent,
                usageLimit: data.usageLimit,
                minQuantity: data.minQuantity || 1,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                updatedAt: new Date(),
            })
            .where(eq(offers.id, id))
            .returning();

        // 2. Update Product Links (Delete all, then re-insert)
        // This is a simple strategy. For huge datasets, diffing would be better.
        if (data.productIds) {
            await this.databaseService.db
                .delete(offerItems)
                .where(eq(offerItems.offerId, id));

            if (data.productIds.length > 0) {
                const items = data.productIds.map((productId: number) => ({
                    offerId: id,
                    productId,
                }));
                await this.databaseService.db.insert(offerItems).values(items);
            }
        }

        return updatedOffer;
    }

    async delete(id: number) {
        // Cascade delete (or manual due to foreign keys if not set to cascade in DB)
        // Drizzle schema usually handles foreign keys if defined, but here we can manually clean up
        await this.databaseService.db.delete(offerItems).where(eq(offerItems.offerId, id));
        await this.databaseService.db.delete(offers).where(eq(offers.id, id));
        return { success: true };
    }
}
