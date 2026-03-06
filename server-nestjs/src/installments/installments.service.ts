import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { installmentPlans, collections } from '../database/schema';
import { eq, or, isNull, sql } from 'drizzle-orm';

@Injectable()
export class InstallmentsService {
    constructor(private readonly databaseService: DatabaseService) { }

    async findAll() {
        const plans = await this.databaseService.db
            .select()
            .from(installmentPlans);

        const allCollections = await this.databaseService.db
            .select()
            .from(collections);

        const collectionMap = new Map(allCollections.map(c => [c.id, c.nameEn]));

        return plans.map(plan => ({
            ...plan,
            collectionNames: plan.collectionIds && plan.collectionIds.length > 0
                ? plan.collectionIds.map(id => collectionMap.get(id)).filter(Boolean).join(', ')
                : 'Global'
        }));
    }

    async findActive(collectionId?: number) {
        if (collectionId) {
            // Show global plans AND plans for this specific collection
            return await this.databaseService.db
                .select()
                .from(installmentPlans)
                .where(
                    sql`${installmentPlans.isActive} = true AND (
                        ${installmentPlans.collectionIds} IS NULL OR 
                        array_length(${installmentPlans.collectionIds}, 1) IS NULL OR 
                        ${collectionId} = ANY(${installmentPlans.collectionIds}) OR 
                        ${installmentPlans.collectionId} = ${collectionId}
                    )`
                );
        }

        return await this.databaseService.db
            .select()
            .from(installmentPlans)
            .where(eq(installmentPlans.isActive, true));
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

        // SYNC: Update all collections in the array
        if (newPlan.collectionIds && newPlan.collectionIds.length > 0 && newPlan.downPaymentPercentage !== undefined) {
            for (const cId of newPlan.collectionIds) {
                await this.databaseService.db
                    .update(collections)
                    .set({ downPaymentPercentage: newPlan.downPaymentPercentage, updatedAt: new Date() })
                    .where(eq(collections.id, cId));
            }
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

        // SYNC: Update all collections in the array
        if (updatedPlan.collectionIds && updatedPlan.collectionIds.length > 0 && updatedPlan.downPaymentPercentage !== undefined) {
            for (const cId of updatedPlan.collectionIds) {
                await this.databaseService.db
                    .update(collections)
                    .set({ downPaymentPercentage: updatedPlan.downPaymentPercentage, updatedAt: new Date() })
                    .where(eq(collections.id, cId));
            }
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
