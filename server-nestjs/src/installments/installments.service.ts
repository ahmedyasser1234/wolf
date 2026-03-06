import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { installmentPlans, collections, installmentPayments, orders, users } from '../database/schema';
import { eq, or, isNull, sql, and, gte, lte, desc } from 'drizzle-orm';

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

    async getPaymentsForAdmin(date: string, status?: string, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const whereClause = [];

        if (date && !isNaN(new Date(date).getTime())) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            whereClause.push(gte(installmentPayments.dueDate, startOfDay));
            whereClause.push(lte(installmentPayments.dueDate, endOfDay));
        }

        if (status) {
            whereClause.push(eq(installmentPayments.status, status));
        }

        const data = await this.databaseService.db
            .select({
                payment: installmentPayments,
                customer: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    phone: users.phone,
                    address: users.address
                },
                order: {
                    id: orders.id,
                    orderNumber: orders.orderNumber,
                    kycData: orders.kycData,
                    shippingAddress: orders.shippingAddress
                }
            })
            .from(installmentPayments)
            .innerJoin(users, eq(installmentPayments.customerId, users.id))
            .innerJoin(orders, eq(installmentPayments.orderId, orders.id))
            .where(and(...whereClause))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(installmentPayments.dueDate));

        const [totalCount] = await this.databaseService.db
            .select({ count: sql<number>`count(*)` })
            .from(installmentPayments)
            .where(and(...whereClause));

        return {
            data,
            meta: {
                total: Number(totalCount.count),
                page,
                limit,
                totalPages: Math.ceil(Number(totalCount.count) / limit)
            }
        };
    }

    async getPaymentsForCustomer(customerId: number) {
        return await this.databaseService.db
            .select({
                payment: installmentPayments,
                order: {
                    id: orders.id,
                    orderNumber: orders.orderNumber
                }
            })
            .from(installmentPayments)
            .innerJoin(orders, eq(installmentPayments.orderId, orders.id))
            .where(eq(installmentPayments.customerId, customerId))
            .orderBy(desc(installmentPayments.dueDate));
    }

    async payInstallment(paymentId: number, customerId: number, paymentMethod: string) {
        const [payment] = await this.databaseService.db
            .select()
            .from(installmentPayments)
            .where(and(eq(installmentPayments.id, paymentId), eq(installmentPayments.customerId, customerId)))
            .limit(1);

        if (!payment) throw new NotFoundException('Payment record not found');
        if (payment.status === 'paid') throw new Error('هذا القسط مدفوع بالفعل');

        // Update payment record
        const [updatedPayment] = await this.databaseService.db
            .update(installmentPayments)
            .set({
                status: 'paid',
                paymentDate: new Date(),
                paymentMethod: paymentMethod,
                updatedAt: new Date()
            })
            .where(eq(installmentPayments.id, paymentId))
            .returning();

        // Update main installment record remaining amount
        await this.databaseService.db.execute(
            sql`UPDATE installments SET "remainingAmount" = "remainingAmount" - ${payment.amount}, "updatedAt" = NOW() WHERE id = ${payment.installmentId}`
        );

        return updatedPayment;
    }

    async delete(id: number) {
        return await this.databaseService.db
            .delete(installmentPlans)
            .where(eq(installmentPlans.id, id))
            .returning();
    }
}
