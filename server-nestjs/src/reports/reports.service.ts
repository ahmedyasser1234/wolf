import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { orders, vendors, products, categories } from '../database/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';

@Injectable()
export class ReportsService {
    constructor(private readonly databaseService: DatabaseService) { }

    async getVendorCommissions() {
        return await this.databaseService.db
            .select({
                vendorId: vendors.id,
                storeNameAr: vendors.storeNameAr,
                storeNameEn: vendors.storeNameEn,
                storeSlug: vendors.storeSlug,
                totalOrders: sql<number>`count(${orders.id})`,
                totalSales: sql<number>`coalesce(sum(${orders.total}), 0)`,
                totalCommission: sql<number>`coalesce(sum(${orders.commission}), 0)`,
                // Net earnings = Total - Commission
                netEarnings: sql<number>`coalesce(sum(${orders.total} - ${orders.commission}), 0)`,
            })
            .from(vendors)
            .leftJoin(orders, eq(vendors.id, orders.vendorId))
            .where(eq(orders.paymentStatus, 'paid'))
            .groupBy(vendors.id, vendors.storeNameAr, vendors.storeNameEn, vendors.storeSlug)
            .orderBy(desc(sql`sum(${orders.commission})`));
    }

    async getDashboardAnalytics() {
        // 1. Sales History (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const salesHistory = await this.databaseService.db
            .select({
                month: sql<string>`to_char(${orders.createdAt}, 'Mon')`,
                total: sql<number>`coalesce(sum(${orders.total}), 0)`,
                commission: sql<number>`coalesce(sum(${orders.commission}), 0)`,
            })
            .from(orders)
            .where(gte(orders.createdAt, sixMonthsAgo))
            .groupBy(sql`to_char(${orders.createdAt}, 'Mon')`, sql`date_trunc('month', ${orders.createdAt})`)
            .orderBy(sql`date_trunc('month', ${orders.createdAt})`);

        // 2. Category Distribution
        const categoryDistribution = await this.databaseService.db
            .select({
                name: categories.nameAr,
                value: sql<number>`count(${products.id})`,
            })
            .from(categories)
            .leftJoin(products, eq(categories.id, products.categoryId))
            .groupBy(categories.id, categories.nameAr)
            .orderBy(desc(sql`count(${products.id})`))
            .limit(10);

        // 3. Top Vendors (all orders, not just paid ones)
        const topVendors = await this.databaseService.db
            .select({
                name: vendors.storeNameAr,
                revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
            })
            .from(vendors)
            .leftJoin(orders, eq(vendors.id, orders.vendorId))
            .groupBy(vendors.id, vendors.storeNameAr)
            .orderBy(desc(sql`coalesce(sum(${orders.total}), 0)`))
            .limit(5);

        return {
            salesHistory,
            categoryDistribution,
            topVendors,
        };
    }
}
