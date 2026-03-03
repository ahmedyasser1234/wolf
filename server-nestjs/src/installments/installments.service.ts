import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { installmentPlans, collections } from '../database/schema';
import { eq, or, isNull, sql } from 'drizzle-orm';

@Injectable()
export class InstallmentsService {
    constructor(private readonly databaseService: DatabaseService) { }

    async findAll() {
        return await this.databaseService.db
            .select({
                id: installmentPlans.id,
                name: installmentPlans.name,
                collectionId: installmentPlans.collectionId,
                collectionName: collections.nameEn, // Or Ar based on lang, but usually En is safe for ID
                months: installmentPlans.months,
                interestRate: installmentPlans.interestRate,
                downPaymentPercentage: installmentPlans.downPaymentPercentage,
                minQuantity: installmentPlans.minQuantity,
                maxQuantity: installmentPlans.maxQuantity,
                minAmount: installmentPlans.minAmount,
                isActive: installmentPlans.isActive,
                createdAt: installmentPlans.createdAt,
                updatedAt: installmentPlans.updatedAt,
            })
            .from(installmentPlans)
            .leftJoin(collections, eq(installmentPlans.collectionId, collections.id));
    }

    async findActive(collectionId?: number) {
        let query = this.databaseService.db
            .select({
                id: installmentPlans.id,
                name: installmentPlans.name,
                collectionId: installmentPlans.collectionId,
                months: installmentPlans.months,
                interestRate: installmentPlans.interestRate,
                downPaymentPercentage: installmentPlans.downPaymentPercentage,
                minQuantity: installmentPlans.minQuantity,
                maxQuantity: installmentPlans.maxQuantity,
                minAmount: installmentPlans.minAmount,
                isActive: installmentPlans.isActive,
            })
            .from(installmentPlans)
            .where(eq(installmentPlans.isActive, true));

        if (collectionId) {
            // Show global plans AND plans for this specific collection
            return await this.databaseService.db
                .select()
                .from(installmentPlans)
                .where(
                    sql`${installmentPlans.isActive} = true AND (${installmentPlans.collectionId} IS NULL OR ${installmentPlans.collectionId} = ${collectionId})`
                );
        }

        return await query;
    }

    async findOne(id: number) {
        const [plan] = await this.databaseService.db
            .select()
            .from(installmentPlans)
            .where(eq(installmentPlans.id, id))
            .limit(1);

        if (!plan) {
            throw new NotFoundException(`Installment plan with ID ${id} not found`);
        }
        return plan;
    }

    async create(data: any) {
        const [newPlan] = await this.databaseService.db
            .insert(installmentPlans)
            .values({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        // SYNC: If plan is for a collection, update collection down payment
        if (newPlan.collectionId && newPlan.downPaymentPercentage !== undefined) {
            await this.databaseService.db
                .update(collections)
                .set({ downPaymentPercentage: newPlan.downPaymentPercentage, updatedAt: new Date() })
                .where(eq(collections.id, newPlan.collectionId));
        }

        return newPlan;
    }

    async update(id: number, data: any) {
        const [updatedPlan] = await this.databaseService.db
            .update(installmentPlans)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(installmentPlans.id, id))
            .returning();

        // SYNC: If plan is for a collection, update collection down payment
        if (updatedPlan.collectionId && updatedPlan.downPaymentPercentage !== undefined) {
            await this.databaseService.db
                .update(collections)
                .set({ downPaymentPercentage: updatedPlan.downPaymentPercentage, updatedAt: new Date() })
                .where(eq(collections.id, updatedPlan.collectionId));
        }

        return updatedPlan;
    }

    async delete(id: number) {
        return await this.databaseService.db
            .delete(installmentPlans)
            .where(eq(installmentPlans.id, id))
            .returning();
    }
}
