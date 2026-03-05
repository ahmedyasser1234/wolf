import { scrypt, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { vendors, users, orders, products, categories, conversations, messages, cartItems, wishlist, notifications, productColors, reviews, shipping, offerItems, collections, coupons, offers, vendorReviews, vendorPayouts, vendorWallets, paymentGateways, installmentPlans, orderItems, accountStatusLogs } from '../database/schema';
import { eq, and, desc, sql, ne, inArray } from 'drizzle-orm';
import * as xlsx from 'xlsx';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
    constructor(
        private databaseService: DatabaseService,
        private notificationsService: NotificationsService
    ) { }

    // ... (rest of the file until updateVendorStatus)

    async updateVendorStatus(vendorId: number, status: 'approved' | 'rejected') {
        const vendor = await this.databaseService.db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (vendor.length === 0) return { success: false, message: 'Vendor not found' };

        return await this.databaseService.db.transaction(async (tx) => {
            const [updatedVendor] = await tx
                .update(vendors)
                .set({
                    status: status,
                    isActive: status === 'approved', // Only active if approved
                    isVerified: status === 'approved', // Verified if approved
                    updatedAt: new Date(),
                })
                .where(eq(vendors.id, vendorId))
                .returning();

            // Notify vendor
            if (status === 'approved') {
                await this.notificationsService.notify(
                    vendor[0].userId,
                    'vendor_status',
                    'تمت الموافقة على حسابك ✅',
                    'مبروك! تم تفعيل حساب البائع الخاص بك. يمكنك الآن الدخول إلى لوحة التحكم.',
                    vendorId
                );
            } else if (status === 'rejected') {
                await this.notificationsService.notify(
                    vendor[0].userId,
                    'vendor_status',
                    'تم رفض طلبك ❌',
                    'عذراً، لم يتم قبول طلبك للانضمام كبائع. يرجى التواصل مع الإدارة لمزيد من التفاصيل.',
                    vendorId
                );
            }

            return { success: true, vendor: updatedVendor };
        });
    }

    async getAllVendors() {
        return await this.databaseService.db
            .select()
            .from(vendors)
            .orderBy(desc(vendors.createdAt));
    }

    async getPendingVendors() {
        return await this.databaseService.db
            .select({
                id: vendors.id,
                userId: vendors.userId,
                status: vendors.status,
                storeNameAr: vendors.storeNameAr,
                storeNameEn: vendors.storeNameEn,
                storeSlug: vendors.storeSlug,
                email: vendors.email,
                phone: vendors.phone,
                createdAt: vendors.createdAt,
                user: {
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    role: users.role,
                    phone: users.phone,
                },
            })
            .from(vendors)
            .leftJoin(users, eq(vendors.userId, users.id))
            .where(eq(vendors.status, 'pending'))
            .orderBy(desc(vendors.createdAt));
    }

    async getAllCustomers() {
        return await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.role, 'customer'))
            .orderBy(desc(users.lastSignedIn));
    }

    async updateCustomerStatus(customerId: number, status: string, adminId: number) {
        if (!['active', 'blocked', 'deactivated'].includes(status)) {
            throw new BadRequestException('Invalid status');
        }

        // Get current status for audit log
        const [currentUser] = await this.databaseService.db
            .select({ status: users.status })
            .from(users)
            .where(eq(users.id, customerId));

        if (!currentUser) {
            throw new NotFoundException('Customer not found');
        }

        const [updatedUser] = await this.databaseService.db
            .update(users)
            .set({ status })
            .where(eq(users.id, customerId))
            .returning();

        // Write audit log
        await this.databaseService.db.insert(accountStatusLogs).values({
            customerId,
            adminId,
            oldStatus: currentUser.status,
            newStatus: status,
        });

        return { success: true, user: updatedUser };
    }


    async getCustomerStatusLogs(customerId: number) {
        return await this.databaseService.db
            .select({
                id: accountStatusLogs.id,
                oldStatus: accountStatusLogs.oldStatus,
                newStatus: accountStatusLogs.newStatus,
                changedAt: accountStatusLogs.changedAt,
                adminName: users.name,
                adminEmail: users.email,
            })
            .from(accountStatusLogs)
            .leftJoin(users, eq(accountStatusLogs.adminId, users.id))
            .where(eq(accountStatusLogs.customerId, customerId))
            .orderBy(desc(accountStatusLogs.changedAt));
    }

    async getAllOrders(
        search?: string,
        dateFrom?: string,
        dateTo?: string,
        page = 1,
        limit = 100,
        isInstallmentOnly = false
    ) {
        const offset = (page - 1) * limit;
        const conditions = [];

        if (search) {
            const searchPattern = `%${search.toLowerCase()}%`;
            conditions.push(
                sql`lower(${orders.orderNumber}) LIKE ${searchPattern} OR lower(${users.name}) LIKE ${searchPattern}`
            );
        }

        if (dateFrom) {
            conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
        }
        if (dateTo) {
            conditions.push(sql`${orders.createdAt} <= ${dateTo}::timestamp + interval '1 day'`);
        }
        if (isInstallmentOnly) {
            conditions.push(sql`${orders.installmentPlanId} IS NOT NULL`);
        }

        console.time(`⏱️ [AdminService] getAllOrders MainQuery - limit: ${limit}`);
        const query = this.databaseService.db
            .select({
                order: orders,
                customer: {
                    name: users.name,
                    phone: users.phone,
                    email: users.email,
                },
                installmentPlan: installmentPlans,
            })
            .from(orders)
            .leftJoin(users, eq(orders.customerId, users.id))
            .leftJoin(installmentPlans, eq(orders.installmentPlanId, installmentPlans.id))
            .where(and(...conditions));

        const rows = await query
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);
        console.timeEnd(`⏱️ [AdminService] getAllOrders MainQuery - limit: ${limit}`);

        if (rows.length === 0) return [];

        const orderIds = rows.map(r => r.order.id);

        console.time(`⏱️ [AdminService] getAllOrders ItemsQuery - count: ${orderIds.length}`);
        const allItems = await this.databaseService.db
            .select({
                item: orderItems,
                product: {
                    nameAr: products.nameAr,
                    nameEn: products.nameEn,
                    images: products.images,
                },
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(inArray(orderItems.orderId, orderIds));
        console.timeEnd(`⏱️ [AdminService] getAllOrders ItemsQuery - count: ${orderIds.length}`);

        // Efficient grouping by orderId
        const itemsMap = new Map<number, any[]>();
        for (const row of allItems) {
            if (!itemsMap.has(row.item.orderId)) {
                itemsMap.set(row.item.orderId, []);
            }
            itemsMap.get(row.item.orderId)!.push({
                ...row.item,
                product: row.product,
            });
        }

        return rows.map(r => ({
            ...r.order,
            customer: r.customer,
            installmentPlan: r.installmentPlan,
            items: itemsMap.get(r.order.id) || [],
        }));
    }

    async getDashboardStats() {
        const [customersTotal] = await this.databaseService.db
            .select({ count: sql`count(*)` })
            .from(users)
            .where(eq(users.role, 'customer'));

        const [productsTotal] = await this.databaseService.db
            .select({ count: sql`count(*)` })
            .from(products);

        const [paidOrdersCount] = await this.databaseService.db
            .select({ count: sql`count(*)` })
            .from(orders)
            .where(eq(orders.paymentStatus, 'paid'));

        const [revenueTotal] = await this.databaseService.db
            .select({ total: sql`sum(${orders.total})` })
            .from(orders)
            .where(eq(orders.paymentStatus, 'paid'));

        const [pendingKycReviews] = await this.databaseService.db
            .select({ count: sql`count(*)` })
            .from(orders)
            .where(and(
                sql`${orders.installmentPlanId} IS NOT NULL`,
                eq(orders.paymentStatus, 'pending_kyc_review')
            ));

        return {
            totalCustomers: Number(customersTotal?.count || 0),
            totalProducts: Number(productsTotal?.count || 0),
            totalPaidOrders: Number(paidOrdersCount?.count || 0),
            totalRevenue: Number(revenueTotal?.total || 0),
            pendingKycReviews: Number(pendingKycReviews?.count || 0),
        };
    }

    async getAllProducts(search?: string) {
        let query = this.databaseService.db
            .select()
            .from(products);

        if (search) {
            const searchPattern = `%${search.toLowerCase()}%`;
            query = query.where(
                sql`lower(${products.nameAr}) LIKE ${searchPattern} OR lower(${products.nameEn}) LIKE ${searchPattern}`
            ) as any;
        }

        return await query.orderBy(desc(products.createdAt));
    }

    async getAllConversations(adminId: number) {
        // Return only conversations where the admin is a participant
        console.log(`AdminService: getAllConversations called for adminId: ${adminId}`);

        const results = await this.databaseService.db
            .select({
                id: conversations.id,
                customerId: conversations.customerId,
                vendorId: conversations.vendorId,
                lastMessageTime: conversations.updatedAt,
                customerName: users.name,
                customerEmail: users.email,
                customerAvatar: users.avatar,
                storeNameAr: vendors.storeNameAr,
                storeNameEn: vendors.storeNameEn,
                storeSlug: vendors.storeSlug,
                storeLogo: vendors.logo,
                lastMessage: messages.content
            })
            .from(conversations)
            .leftJoin(messages, eq(conversations.lastMessageId, messages.id))
            .leftJoin(users, eq(conversations.customerId, users.id))
            .leftJoin(vendors, eq(conversations.vendorId, vendors.id))
            .where(
                sql`${conversations.customerId} = ${adminId} OR ${vendors.userId} = ${adminId} OR ${conversations.vendorId} = ${adminId}`
            )
            .orderBy(desc(conversations.updatedAt));

        return results;
    }

    private async hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const salt = randomBytes(16).toString('hex');
            scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) reject(err);
                resolve(`${salt}:${derivedKey.toString('hex')}`);
            });
        });
    }

    async createAdminAccount(email: string, password: string, name: string) {
        const hashedPassword = await this.hashPassword(password);
        const openId = `admin_${Date.now()}`;

        const [admin] = await this.databaseService.db.insert(users).values({
            openId,
            email,
            name,
            password: hashedPassword,
            role: 'admin',
            loginMethod: 'email',
            lastSignedIn: new Date(),
        }).returning();

        return admin;
    }

    async createVendor(data: {
        email: string;
        password: string;
        storeNameAr: string;
        storeNameEn: string;
        phone?: string;
        city?: string;
        commissionRate?: number;
    }) {
        const existingUser = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (existingUser.length > 0) {
            throw new UnauthorizedException('Email already exists');
        }

        const baseSlug = data.storeNameEn
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let storeSlug = baseSlug;
        let counter = 1;

        while (true) {
            const existingVendor = await this.databaseService.db
                .select()
                .from(vendors)
                .where(eq(vendors.storeSlug, storeSlug))
                .limit(1);

            if (existingVendor.length === 0) break;
            storeSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        const hashedPassword = await this.hashPassword(data.password);
        const openId = `vendor_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return await this.databaseService.db.transaction(async (tx) => {
            const [newUser] = await tx.insert(users).values({
                openId,
                email: data.email,
                name: data.storeNameEn,
                phone: data.phone,
                password: hashedPassword,
                role: 'vendor',
                loginMethod: 'email',
                lastSignedIn: new Date(),
            }).returning();

            const [newVendor] = await tx.insert(vendors).values({
                userId: newUser.id,
                storeNameAr: data.storeNameAr,
                storeNameEn: data.storeNameEn,
                storeSlug,
                email: data.email,
                phone: data.phone,
                cityAr: data.city,
                cityEn: data.city,
                commissionRate: data.commissionRate || 10,
                status: 'approved',
            }).returning();

            return { user: newUser, vendor: newVendor };
        });
    }

    async deleteVendor(vendorId: number) {
        const vendor = await this.databaseService.db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (vendor.length === 0) return { success: false, message: 'Vendor not found' };

        const userId = vendor[0].userId;

        return await this.databaseService.db.transaction(async (tx) => {
            const vendorProducts = await tx
                .select({ id: products.id })
                .from(products)
                .where(eq(products.vendorId, vendorId));

            const productIds = vendorProducts.map(p => p.id);

            if (productIds.length > 0) {
                await tx.delete(productColors).where(inArray(productColors.productId, productIds));
                await tx.delete(reviews).where(inArray(reviews.productId, productIds));
                await tx.delete(cartItems).where(inArray(cartItems.productId, productIds));
                await tx.delete(wishlist).where(inArray(wishlist.productId, productIds));
                await tx.delete(shipping).where(inArray(shipping.productId, productIds));
                await tx.delete(offerItems).where(inArray(offerItems.productId, productIds));
                await tx.delete(products).where(eq(products.vendorId, vendorId));
            }

            await tx.delete(collections).where(eq(collections.vendorId, vendorId));
            await tx.delete(coupons).where(eq(coupons.vendorId, vendorId));

            const vendorOffers = await tx.select({ id: offers.id }).from(offers).where(eq(offers.vendorId, vendorId));
            const offerIds = vendorOffers.map(o => o.id);
            if (offerIds.length > 0) {
                await tx.delete(offerItems).where(inArray(offerItems.offerId, offerIds));
                await tx.delete(offers).where(eq(offers.vendorId, vendorId));
            }

            await tx.delete(shipping).where(eq(shipping.vendorId, vendorId));
            await tx.delete(vendorReviews).where(eq(vendorReviews.vendorId, vendorId));
            await tx.delete(vendorPayouts).where(eq(vendorPayouts.vendorId, vendorId));
            await tx.delete(vendorWallets).where(eq(vendorWallets.vendorId, vendorId));

            const vendorConversations = await tx
                .select({ id: conversations.id })
                .from(conversations)
                .where(eq(conversations.vendorId, vendorId));

            const conversationIds = vendorConversations.map(c => c.id);
            if (conversationIds.length > 0) {
                await tx.delete(messages).where(inArray(messages.conversationId, conversationIds));
                await tx.delete(conversations).where(eq(conversations.vendorId, vendorId));
            }

            await tx.delete(vendors).where(eq(vendors.id, vendorId));
            await tx.delete(users).where(eq(users.id, userId));

            return { success: true, message: 'Vendor and all related data deleted successfully' };
        });
    }

    async updateVendorEmail(vendorId: number, newEmail: string) {
        const vendor = await this.databaseService.db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (vendor.length === 0) return { success: false, message: 'Vendor not found' };

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.update(vendors).set({ email: newEmail }).where(eq(vendors.id, vendorId));
            await tx.update(users).set({ email: newEmail }).where(eq(users.id, vendor[0].userId));
            return { success: true };
        });
    }

    async updateVendorCommission(vendorId: number, commissionRate: number) {
        return await this.databaseService.db.transaction(async (tx) => {
            const [updated] = await tx
                .update(vendors)
                .set({ commissionRate, updatedAt: new Date() })
                .where(eq(vendors.id, vendorId))
                .returning();

            const rateMultiplier = 1 + commissionRate / 100;

            await tx.execute(sql`
                UPDATE products 
                SET 
                    price = COALESCE("vendorPrice", price / ${rateMultiplier}) * ${rateMultiplier},
                    "originalPrice" = COALESCE("vendorOriginalPrice", "vendorPrice", "originalPrice" / ${rateMultiplier}) * ${rateMultiplier},
                    "updatedAt" = NOW()
                WHERE "vendorId" = ${vendorId}
            `);

            return updated;
        });
    }

    async getCustomerDetails(id: number) {
        const customer = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (customer.length === 0) {
            throw new UnauthorizedException('Customer not found');
        }

        const customerOrders = await this.databaseService.db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                total: orders.total,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .where(eq(orders.customerId, id))
            .orderBy(desc(orders.createdAt));

        return {
            ...customer[0],
            orders: customerOrders
        };
    }

    async deleteCustomer(id: number) {
        const customer = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (customer.length === 0) {
            throw new NotFoundException('Customer not found');
        }

        const activeOrders = await this.databaseService.db
            .select({ id: orders.id })
            .from(orders)
            .where(and(
                eq(orders.customerId, id),
                ne(orders.status, 'cancelled'),
                ne(orders.status, 'delivered'),
            ));

        if (activeOrders.length > 0) {
            throw new BadRequestException('Cannot delete customer with active orders');
        }

        return await this.databaseService.db.transaction(async (tx) => {
            await tx.delete(cartItems).where(eq(cartItems.customerId, id));
            await tx.delete(wishlist).where(eq(wishlist.customerId, id));
            await tx.delete(notifications).where(eq(notifications.userId, id));
            await tx.delete(users).where(eq(users.id, id));

            return { success: true, message: 'Customer deleted successfully' };
        });
    }

    async globalSearch(query: string) {
        const searchPattern = `%${query.toLowerCase()}%`;

        const [vendorsResults, productsResults, customersResults, ordersResults] = await Promise.all([
            this.databaseService.db
                .select()
                .from(vendors)
                .where(
                    sql`lower(${vendors.storeNameAr}) LIKE ${searchPattern} OR lower(${vendors.storeNameEn}) LIKE ${searchPattern} OR lower(${vendors.email}) LIKE ${searchPattern}`
                )
                .limit(5),
            this.databaseService.db
                .select()
                .from(products)
                .where(
                    sql`lower(${products.nameAr}) LIKE ${searchPattern} OR lower(${products.nameEn}) LIKE ${searchPattern}`
                )
                .limit(5),
            this.databaseService.db
                .select()
                .from(users)
                .where(
                    and(
                        eq(users.role, 'customer'),
                        sql`lower(${users.name}) LIKE ${searchPattern} OR lower(${users.email}) LIKE ${searchPattern}`
                    )
                )
                .limit(5),
            this.databaseService.db
                .select({
                    id: orders.id,
                    orderNumber: orders.orderNumber,
                    customerName: users.name,
                })
                .from(orders)
                .leftJoin(users, eq(orders.customerId, users.id))
                .where(
                    sql`CAST(${orders.id} AS TEXT) LIKE ${searchPattern} OR lower(${orders.orderNumber}) LIKE ${searchPattern}`
                )
                .limit(5)
        ]);

        return {
            vendors: vendorsResults,
            products: productsResults,
            customers: customersResults,
            orders: ordersResults
        };
    }

    async seedProductsCatalog() {
        const categoriesData = [
            { nameAr: 'إلكترونيات', nameEn: 'Electronics', slug: 'electronics' },
            { nameAr: 'عطور ومكياج', nameEn: 'Perfumes & Beauty', slug: 'beauty' },
            { nameAr: 'أجهزة منزلية', nameEn: 'Home Appliances', slug: 'home-appliances' },
            { nameAr: 'ساعات', nameEn: 'Watches', slug: 'watches' },
            { nameAr: 'أزياء وإكسسوارات', nameEn: 'Fashion & Accessories', slug: 'fashion' },
        ];

        const insertedCategories = [];
        for (const cat of categoriesData) {
            const [existing] = await this.databaseService.db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
            if (!existing) {
                const [newCat] = await this.databaseService.db.insert(categories).values({ ...cat, isActive: true }).returning();
                insertedCategories.push(newCat);
            } else {
                insertedCategories.push(existing);
            }
        }

        let [vendor] = await this.databaseService.db.select().from(vendors).limit(1);

        if (!vendor) {
            console.log('[AdminService] No vendor found, creating a default one...');
            const [adminUser] = await this.databaseService.db.select().from(users).where(eq(users.role, 'admin')).limit(1);
            if (!adminUser) throw new BadRequestException('يجب وجود مسؤول (Admin) واحد على الأقل لإنشاء التاجر التلقائي');

            [vendor] = await this.databaseService.db.insert(vendors).values({
                userId: adminUser.id,
                storeNameAr: 'متجر درهمي بلس',
                storeNameEn: 'Dirhami Plus Store',
                storeSlug: 'dirhami-plus-store',
                email: adminUser.email || 'admin@wolftechno.com',
                descriptionAr: 'المتجر الشامل لكل ما تحتاجه',
                descriptionEn: 'The comprehensive store for everything you need',
                status: 'approved',
                isActive: true,
                isVerified: true,
            }).returning();
        }

        const brands = [
            { nameAr: 'آبل', nameEn: 'Apple', slug: 'apple' },
            { nameAr: 'سامسونج', nameEn: 'Samsung', slug: 'samsung' },
            { nameAr: 'دايسون', nameEn: 'Dyson', slug: 'dyson' },
            { nameAr: 'ديور', nameEn: 'Dior', slug: 'dior' },
            { nameAr: 'سوني', nameEn: 'Sony', slug: 'sony' },
            { nameAr: 'نسبريسو', nameEn: 'Nespresso', slug: 'nespresso' },
            { nameAr: 'عناية وجمال', nameEn: 'Beauty Care', slug: 'beauty-care' },
        ];

        const insertedBrands = [];
        for (const brand of brands) {
            const [existing] = await this.databaseService.db.select().from(collections).where(and(eq(collections.vendorId, vendor.id), eq(collections.slug, brand.slug))).limit(1);
            if (!existing) {
                const [newBrand] = await this.databaseService.db.insert(collections).values({ ...brand, vendorId: vendor.id, isActive: true }).returning();
                insertedBrands.push(newBrand);
            } else {
                insertedBrands.push(existing);
            }
        }

        const productsList = [
            {
                nameAr: 'مصفف الشعر دايسون إير راب',
                nameEn: 'Dyson Airwrap Multi-Styler',
                slug: 'dyson-airwrap',
                price: 2200,
                stock: 30,
                brand: 'dyson',
                category: 'beauty',
                images: ['https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'مصفف الشعر الشهير من دايسون متعدد الاستخدامات',
                descEn: 'The famous Dyson Airwrap multi-styler.'
            },
            {
                nameAr: 'عطر ديور سوفاج 100 مل',
                nameEn: 'Dior Sauvage Eau de Parfum 100ml',
                slug: 'dior-sauvage',
                price: 550,
                stock: 100,
                brand: 'dior',
                category: 'beauty',
                images: ['https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'عطر ديور سوفاج الرجالي الأصلي طويل الأمد',
                descEn: 'Original long-lasting Dior Sauvage perfume for men.'
            },
            {
                nameAr: 'آلة قهوة نسبريسو فيرتو',
                nameEn: 'Nespresso Vertuo Coffee Machine',
                slug: 'nespresso-vertuo',
                price: 950,
                stock: 45,
                brand: 'nespresso',
                category: 'home-appliances',
                images: ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'أفضل آلة لصنع القهوة من نسبريسو بالكبسولات',
                descEn: 'Top coffee machine from Nespresso with capsules.'
            },
            {
                nameAr: 'آيفون 15 برو ماكس تيتانيوم',
                nameEn: 'iPhone 15 Pro Max Titanium',
                slug: 'iphone-15-pro-max',
                price: 4500,
                stock: 50,
                brand: 'apple',
                category: 'electronics',
                images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'أحدث هاتف من آبل مع كاميرا تيتانيوم',
                descEn: 'The latest iPhone from Apple with titanium camera and A17 Pro chip.'
            },
            {
                nameAr: 'بلايستيشن 5 مع ذراع التحكم',
                nameEn: 'PlayStation 5 Console with Controller',
                slug: 'playstation-5',
                price: 1950,
                stock: 20,
                brand: 'sony',
                category: 'electronics',
                images: ['https://images.unsplash.com/photo-1606144042857-e9de62e63577?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'جهاز ألعاب سوني بلايستيشن 5 الإصدار الأحدث',
                descEn: 'Sony PlayStation 5 console latest edition.'
            },
            {
                nameAr: 'ساعة آبل ألترا 2',
                nameEn: 'Apple Watch Ultra 2',
                slug: 'apple-watch-ultra-2',
                price: 3200,
                stock: 25,
                brand: 'apple',
                category: 'watches',
                images: ['https://images.unsplash.com/photo-1695673033502-364e7da3c683?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'أقوى ساعة من آبل للرياضات الشاقة',
                descEn: 'The most rugged and capable Apple Watch for harsh environments.'
            },
            {
                nameAr: 'حقيبة يد جلدية فاخرة',
                nameEn: 'Luxury Leather Handbag',
                slug: 'luxury-leather-bag',
                price: 850,
                stock: 15,
                brand: 'beauty-care',
                category: 'fashion',
                images: ['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'حقيبة يد نسائية مصنوعة من الجلد الفاخر',
                descEn: 'Women luxury leather handbag.'
            },
            {
                nameAr: 'سامسونج S24 ألترا',
                nameEn: 'Samsung S24 Ultra',
                slug: 'samsung-s24-ultra',
                price: 4200,
                stock: 40,
                brand: 'samsung',
                category: 'electronics',
                images: ['https://images.unsplash.com/photo-1707248554228-21d3df74d9e0?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'هاتف سامسونج الرائد مع ميزات الذكاء الاصطناعي',
                descEn: 'Samsung flagship phone with Galaxy AI features and S Pen.'
            }
        ];

        for (const p of productsList) {
            const cat = insertedCategories.find(c => c.slug === p.category);
            const brand = insertedBrands.find(b => b.slug === p.brand);

            const [existing] = await this.databaseService.db.select().from(products).where(eq(products.slug, p.slug)).limit(1);
            if (!existing) {
                await this.databaseService.db.insert(products).values({
                    vendorId: vendor.id,
                    categoryId: cat?.id,
                    collectionId: brand?.id,
                    nameAr: p.nameAr,
                    nameEn: p.nameEn,
                    slug: p.slug,
                    price: p.price,
                    stock: p.stock,
                    images: p.images,
                    descriptionAr: p.descAr,
                    descriptionEn: p.descEn,
                    isActive: true,
                });
            }
        }

        return { message: 'تم تحديث الكتالوج بنجاح' };
    }

    async getPaymentGateways() {
        const existing = await this.databaseService.db.select().from(paymentGateways);

        const defaultGateways = [
            {
                name: 'stripe',
                displayNameAr: 'سترايب',
                displayNameEn: 'Stripe',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
                isActive: true,
                isTestMode: true,
            },
            {
                name: 'cash_on_delivery',
                displayNameAr: 'الدفع عند الاستلام',
                displayNameEn: 'Cash on Delivery',
                logo: '',
                isActive: true,
                isTestMode: false,
            },
            {
                name: 'paymob',
                displayNameAr: 'باي موب',
                displayNameEn: 'Paymob',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'ccavenue',
                displayNameAr: 'سي سي أفينيو',
                displayNameEn: 'CCAvenue',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'tigerpay',
                displayNameAr: 'تايجر باي',
                displayNameEn: 'TigerPay',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'mamo',
                displayNameAr: 'مامو بيزنس',
                displayNameEn: 'Mamo Business',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'paymennt',
                displayNameAr: 'بايمنت',
                displayNameEn: 'Paymennt',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'utap',
                displayNameAr: 'يوتيب',
                displayNameEn: 'Utap',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'my_network',
                displayNameAr: 'ماي نتورك',
                displayNameEn: 'My Network',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'omnispay',
                displayNameAr: 'أومنيس باي',
                displayNameEn: 'Omnispay',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'vaultspay',
                displayNameAr: 'فولتس باي',
                displayNameEn: 'VaultsPay',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'afspro',
                displayNameAr: 'إي إف إس برو',
                displayNameEn: 'AFS PRO',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'payby',
                displayNameAr: 'باي باي',
                displayNameEn: 'PayBy',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'geidea',
                displayNameAr: 'جيديا',
                displayNameEn: 'Geidea',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'dpo_pay',
                displayNameAr: 'دي بي أو باي',
                displayNameEn: 'DPO Pay',
                logo: '',
                isActive: false,
                isTestMode: true,
            },
            {
                name: 'installments',
                displayNameAr: 'التقسيط',
                displayNameEn: 'Installments',
                logo: '',
                isActive: true,
                isTestMode: false,
            },
            {
                name: 'cash',
                displayNameAr: 'الدفع كاش',
                displayNameEn: 'Cash Payment',
                logo: '',
                isActive: true,
                isTestMode: false,
            }
        ];

        const missing = defaultGateways.filter(
            dw => !existing.find(eg => eg.name === dw.name)
        );

        if (missing.length > 0) {
            console.log(`[AdminService] Seeding ${missing.length} missing gateways...`);
            await this.databaseService.db.insert(paymentGateways).values(
                missing.map(m => ({
                    ...m,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }))
            );
            return await this.databaseService.db.select().from(paymentGateways);
        }

        return existing;
    }

    async updatePaymentGatewayToggle(id: number, isEnabled: boolean) {
        const [updated] = await this.databaseService.db
            .update(paymentGateways)
            .set({ isActive: isEnabled, updatedAt: new Date() })
            .where(eq(paymentGateways.id, id))
            .returning();
        return updated;
    }

    async updatePaymentGatewayCredentials(id: number, apiKey: string, publishableKey?: string, merchantId?: string, config?: any) {
        const [updated] = await this.databaseService.db
            .update(paymentGateways)
            .set({
                secretKey: apiKey,
                publishableKey: publishableKey || null,
                merchantId: merchantId || null,
                config: config || null,
                updatedAt: new Date()
            })
            .where(eq(paymentGateways.id, id))
            .returning();
        return updated;
    }

    // --- Excel Export/Import Logic ---
    async exportCustomers() {
        const customersList = await this.databaseService.db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                createdAt: users.createdAt,
                status: users.status,
                totalOrders: sql<number>`COUNT(DISTINCT CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.id} END)`.as('totalOrders'),
                totalSpent: sql<number>`SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total} ELSE 0 END)`.as('totalSpent'),
            })
            .from(users)
            .leftJoin(orders, eq(users.id, orders.customerId))
            .where(eq(users.role, 'customer'))
            .groupBy(users.id)
            .orderBy(desc(users.createdAt));

        const formattedData = customersList.map(c => ({
            'Name (الاسم)': c.name || '',
            'Email (البريد الإلكتروني)': c.email || '',
            'Phone (رقم الهاتف)': c.phone || '',
            'Join Date (تاريخ التسجيل)': new Date(c.createdAt).toLocaleDateString('en-AE'),
            'Total Orders (إجمالي الطلبات)': Number(c.totalOrders) || 0,
            'Total Spent (إجمالي المدفوعات)': Number(c.totalSpent) || 0,
            'Account Status (حالة الحساب)': c.status === 'active' ? 'نشط' : c.status === 'blocked' ? 'محظور' : 'معطل',
        }));

        const worksheet = xlsx.utils.json_to_sheet(formattedData);
        // Adjust column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Name
            { wch: 35 }, // Email
            { wch: 20 }, // Phone
            { wch: 25 }, // Join Date
            { wch: 25 }, // Total Orders
            { wch: 25 }, // Total Spent
            { wch: 25 }, // Account Status
        ];

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Customers');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }

    async importCustomers(data: any[]) {
        return await this.databaseService.db.transaction(async (tx) => {
            for (const row of data) {
                if (!row.email) continue;
                // Check if user exists
                const existing = await tx.select().from(users).where(eq(users.email, row.email)).limit(1);
                if (existing.length === 0) {
                    await tx.insert(users).values({
                        openId: `imported_${Date.now()}_${Math.random()}`,
                        email: row.email,
                        name: row.name || 'Imported User',
                        phone: row.phone,
                        role: 'customer',
                        loginMethod: 'email',
                    });
                }
            }
        });
    }

    async forceSetup() {
        const adminEmail = 'admin@wolf.com';
        const adminPassword = 'wolf1234';

        const [existingAdmin] = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.email, adminEmail))
            .limit(1);

        const hashedPassword = await this.hashPassword(adminPassword);
        let message = '';

        if (existingAdmin) {
            // Update password to ensure the user can log in
            await this.databaseService.db
                .update(users)
                .set({ password: hashedPassword, role: 'admin' })
                .where(eq(users.email, adminEmail));
            message = 'Admin account (admin@wolf.com) password reset to wolf1234 and products seeded.';
        } else {
            // Insert new admin
            await this.databaseService.db.insert(users).values({
                openId: `admin_${Date.now()}`,
                email: adminEmail,
                name: 'WOLF ADMIN',
                password: hashedPassword,
                role: 'admin',
                loginMethod: 'email',
            });
            message = 'Admin account created (admin@wolf.com / wolf1234) and products seeded!';
        }

        // Always Seed products
        try {
            await this.seedProductsCatalog();
        } catch (e) {
            console.error('Seeding catalog failed during forceSetup', e);
        }

        // Always Seed payment gateways (including installments)
        try {
            await this.getPaymentGateways();
        } catch (e) {
            console.error('Seeding payment gateways failed during forceSetup', e);
        }

        return {
            success: true,
            message: message
        };
    }

    async exportShipping() {
        return await this.databaseService.db
            .select({
                id: shipping.id,
                productId: shipping.productId,
                productName: products.nameEn,
                vendorId: shipping.vendorId,
                storeName: vendors.storeNameEn,
                shippingCost: shipping.shippingCost,
            })
            .from(shipping)
            .leftJoin(products, eq(shipping.productId, products.id))
            .leftJoin(vendors, eq(shipping.vendorId, vendors.id));
    }
}
