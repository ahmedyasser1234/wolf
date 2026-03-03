import { scrypt, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { vendors, users, orders, products, categories, conversations, messages, cartItems, wishlist, notifications, productColors, reviews, shipping, offerItems, collections, coupons, offers, vendorReviews, vendorPayouts, vendorWallets, paymentGateways } from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

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

    async getAllOrders() {
        return await this.databaseService.db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                customerId: orders.customerId,
                customerName: users.name,
                total: orders.total,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .leftJoin(users, eq(orders.customerId, users.id))
            .orderBy(desc(orders.createdAt));
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
        // Admin acts as a user (customerId) when talking to vendors
        // or potentially as a vendor (vendorId) if they manage a store directly (though less common for super admin)

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
        // Check if email already exists
        const existingUser = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (existingUser.length > 0) {
            throw new UnauthorizedException('Email already exists');
        }

        // Generate unique storeSlug from English name
        const baseSlug = data.storeNameEn
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let storeSlug = baseSlug;
        let counter = 1;

        // Ensure slug is unique
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

        // Hash password
        const hashedPassword = await this.hashPassword(data.password);
        const openId = `vendor_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return await this.databaseService.db.transaction(async (tx) => {
            // Create user
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

            // Create vendor
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
                status: 'approved', // Auto-approve admin-created vendors
            }).returning();

            return { user: newUser, vendor: newVendor };
        });
    }

    async deleteVendor(vendorId: number) {
        // 1. Find vendor to get userId
        const vendor = await this.databaseService.db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (vendor.length === 0) return { success: false, message: 'Vendor not found' };

        const userId = vendor[0].userId;

        return await this.databaseService.db.transaction(async (tx) => {
            // --- A. DELETE PRODUCTS & RELATED ENTITIES ---
            const vendorProducts = await tx
                .select({ id: products.id })
                .from(products)
                .where(eq(products.vendorId, vendorId));

            const productIds = vendorProducts.map(p => p.id);

            if (productIds.length > 0) {
                // 1. Delete Product Colors
                await tx.delete(productColors).where(sql`${productColors.productId} IN ${productIds}`);

                // 2. Delete Product Reviews
                await tx.delete(reviews).where(sql`${reviews.productId} IN ${productIds}`);

                // 3. Delete Cart Items with these products
                await tx.delete(cartItems).where(sql`${cartItems.productId} IN ${productIds}`);

                // 4. Delete Wishlist items
                await tx.delete(wishlist).where(sql`${wishlist.productId} IN ${productIds}`);

                // 5. Delete Shipping rules for products
                await tx.delete(shipping).where(sql`${shipping.productId} IN ${productIds}`);

                // 6. Delete Offer Items
                await tx.delete(offerItems).where(sql`${offerItems.productId} IN ${productIds}`);

                // 7. FINALLY DELETE PRODUCTS
                await tx.delete(products).where(eq(products.vendorId, vendorId));
            }

            // --- B. DELETE COLLECTIONS ---
            await tx.delete(collections).where(eq(collections.vendorId, vendorId));

            // --- C. DELETE COUPONS ---
            await tx.delete(coupons).where(eq(coupons.vendorId, vendorId));

            // --- D. DELETE OFFERS ---
            // First delete offer items linked to vendor's offers (if not covered above)
            const vendorOffers = await tx.select({ id: offers.id }).from(offers).where(eq(offers.vendorId, vendorId));
            const offerIds = vendorOffers.map(o => o.id);
            if (offerIds.length > 0) {
                await tx.delete(offerItems).where(sql`${offerItems.offerId} IN ${offerIds}`);
                await tx.delete(offers).where(eq(offers.vendorId, vendorId));
            }

            // --- E. DELETE SHIPPING RULES (Vendor Level) ---
            await tx.delete(shipping).where(eq(shipping.vendorId, vendorId));

            // --- F. DELETE REVIEWS & RATINGS ---
            await tx.delete(vendorReviews).where(eq(vendorReviews.vendorId, vendorId));

            // --- G. DELETE WALLET & PAYOUTS ---
            await tx.delete(vendorPayouts).where(eq(vendorPayouts.vendorId, vendorId));
            // Wallet needs to be found first or deleted by vendorId if unique
            await tx.delete(vendorWallets).where(eq(vendorWallets.vendorId, vendorId));

            // --- H. DELETE CHAT CONVERSATIONS ---
            const vendorConversations = await tx
                .select({ id: conversations.id })
                .from(conversations)
                .where(eq(conversations.vendorId, vendorId));

            const conversationIds = vendorConversations.map(c => c.id);
            if (conversationIds.length > 0) {
                await tx.delete(messages).where(sql`${messages.conversationId} IN ${conversationIds}`);
                await tx.delete(conversations).where(eq(conversations.vendorId, vendorId));
            }

            // --- I. DELETE VENDOR PROFILE ---
            await tx.delete(vendors).where(eq(vendors.id, vendorId));

            // --- J. DELETE USER ACCOUNT ---
            await tx.delete(users).where(eq(users.id, userId));

            return { success: true, message: 'Vendor and all related data deleted successfully' };
        });
    }

    async updateVendorEmail(vendorId: number, newEmail: string) {
        const vendor = await this.databaseService.db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (vendor.length === 0) return { success: false, message: 'Vendor not found' };

        return await this.databaseService.db.transaction(async (tx) => {
            // Update vendor email
            await tx.update(vendors).set({ email: newEmail }).where(eq(vendors.id, vendorId));
            // Update user email as well
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

            // Recalculate all product prices for this vendor
            const rateMultiplier = 1 + commissionRate / 100;

            // We use sql helper for dynamic calculation in update
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

    async deleteCustomer(id: number, adminEmail: string) {
        // Strict check: Only main admin can delete
        // Hardcoded for now as per plan. 
        // In production, this should likely be an env var or a database flag 'isSuperAdmin'
        const MAIN_ADMIN_EMAIL = 'admin@fustan.com';

        if (adminEmail !== MAIN_ADMIN_EMAIL) {
            throw new UnauthorizedException('Only the main admin can delete customers.');
        }

        const customer = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (customer.length === 0) {
            // Return success even if not found to be idempotent, or throw error? 
            // Throwing error is better for UI feedback.
            throw new UnauthorizedException('Customer not found');
        }

        return await this.databaseService.db.transaction(async (tx) => {
            // 1. Delete Cart Items
            await tx.delete(cartItems).where(eq(cartItems.customerId, id));

            // 2. Delete Wishlist
            await tx.delete(wishlist).where(eq(wishlist.customerId, id));

            // 3. Delete Notifications
            await tx.delete(notifications).where(eq(notifications.userId, id));

            // 4. Delete Messages/Conversations logic?
            // Conversations have customerId. Messages have senderId.
            // If we delete the user, we should probably keep messages for record but they won't link to a name.
            // Or we delete them. Let's keep them for now as they might be relevant for vendors.
            // But we might want to anonymize? 
            // For now, simple deletion of the user record is requested. 
            // If there are foreign key constraints, this will fail. 
            // Schema shows 'customerId' integer but no explicit foreign keys defined in Drizzle schema for 'conversations', 'orders', etc.
            // So deletion of user row should usually work unless DB level constraints exist.

            // 5. Delete the User
            await tx.delete(users).where(eq(users.id, id));

            return { success: true, message: 'Customer deleted successfully' };
        });
    }

    async globalSearch(query: string) {
        // ... previous globalSearch implementation ...
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

    // --- Payment Gateways Logic ---
    async seedTechCatalog() {
        // 1. Create Categories
        const techCategories = [
            { nameAr: 'هواتف ذكية', nameEn: 'Smartphones', slug: 'smartphones' },
            { nameAr: 'لابتوبات', nameEn: 'Laptops', slug: 'laptops' },
            { nameAr: 'ساعات ذكية', nameEn: 'Smart Watches', slug: 'watches' },
            { nameAr: 'إكسسوارات', nameEn: 'Accessories', slug: 'accessories' },
        ];

        const insertedCategories = [];
        for (const cat of techCategories) {
            const [existing] = await this.databaseService.db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
            if (!existing) {
                const [newCat] = await this.databaseService.db.insert(categories).values({ ...cat, isActive: true }).returning();
                insertedCategories.push(newCat);
            } else {
                insertedCategories.push(existing);
            }
        }

        // 2. Identify a Vendor (or create one if none exists)
        let [vendor] = await this.databaseService.db.select().from(vendors).limit(1);

        if (!vendor) {
            console.log('[AdminService] No vendor found, creating a default one...');
            // Find the first admin user to own the vendor account
            const [adminUser] = await this.databaseService.db.select().from(users).where(eq(users.role, 'admin')).limit(1);
            if (!adminUser) throw new BadRequestException('يجب وجود مسؤول (Admin) واحد على الأقل لإنشاء التاجر التلقائي');

            [vendor] = await this.databaseService.db.insert(vendors).values({
                userId: adminUser.id,
                storeNameAr: 'متجر ولف تكنو',
                storeNameEn: 'Wolf Techno Store',
                storeSlug: 'wolf-techno-store',
                email: adminUser.email || 'admin@wolftechno.com',
                descriptionAr: 'المتجر الرسمي للأجهزة التقنية',
                descriptionEn: 'The official store for tech devices',
                status: 'approved',
                isActive: true,
                isVerified: true,
            }).returning();
        }

        // 3. Create Brands (Collections)
        const brands = [
            { nameAr: 'آبل', nameEn: 'Apple', slug: 'apple' },
            { nameAr: 'سامسونج', nameEn: 'Samsung', slug: 'samsung' },
            { nameAr: 'ديل', nameEn: 'Dell', slug: 'dell' },
            { nameAr: 'إتش بي', nameEn: 'HP', slug: 'hp' },
            { nameAr: 'سوني', nameEn: 'Sony', slug: 'sony' },
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

        // 4. Create Products
        const productsList = [
            {
                nameAr: 'آيفون 15 برو ماكس',
                nameEn: 'iPhone 15 Pro Max',
                slug: 'iphone-15-pro-max',
                price: 4500,
                stock: 50,
                brand: 'apple',
                category: 'smartphones',
                images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'أحدث هاتف من آبل مع كاميرا تيتانيوم',
                descEn: 'The latest iPhone from Apple with titanium camera and A17 Pro chip.'
            },
            {
                nameAr: 'سامسونج S24 ألترا',
                nameEn: 'Samsung S24 Ultra',
                slug: 'samsung-s24-ultra',
                price: 4200,
                stock: 40,
                brand: 'samsung',
                category: 'smartphones',
                images: ['https://images.unsplash.com/photo-1707248554228-21d3df74d9e0?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'هاتف سامسونج الرائد مع ميزات الذكاء الاصطناعي',
                descEn: 'Samsung flagship phone with Galaxy AI features and S Pen.'
            },
            {
                nameAr: 'ماك بوك إير M3',
                nameEn: 'MacBook Air M3',
                slug: 'macbook-air-m3',
                price: 5500,
                stock: 20,
                brand: 'apple',
                category: 'laptops',
                images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'لابتوب آبل النحيف والقوي بمعالج M3',
                descEn: 'The thin and powerful Apple laptop with M3 chip.'
            },
            {
                nameAr: 'ديل XPS 13',
                nameEn: 'Dell XPS 13',
                slug: 'dell-xps-13',
                price: 4800,
                stock: 15,
                brand: 'dell',
                category: 'laptops',
                images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'لابتوب ديل الرائد بشاشة إنفينيتي',
                descEn: 'Dell flagship laptop with InfinityEdge display.'
            },
            {
                nameAr: 'آيباد إير M2',
                nameEn: 'iPad Air M2',
                slug: 'ipad-air-m2',
                price: 2800,
                stock: 30,
                brand: 'apple',
                category: 'accessories',
                images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'جهاز آيباد إير الجديد كلياً بمعالج M2',
                descEn: 'The all-new iPad Air powered by the M2 chip.'
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
                nameAr: 'ساعة سامسونج ووتش 6',
                nameEn: 'Samsung Watch 6',
                slug: 'samsung-watch-6',
                price: 1200,
                stock: 45,
                brand: 'samsung',
                category: 'watches',
                images: ['https://images.unsplash.com/photo-1617042375876-a13e36732a04?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'ساعة سامسونج الذكية لمتابعة الصحة والنشاط',
                descEn: 'Samsung smart watch for health and fitness tracking.'
            },
            {
                nameAr: 'سماعة سوني XM5',
                nameEn: 'Sony WH-1000XM5',
                slug: 'sony-wh-1000xm5',
                price: 1400,
                stock: 60,
                brand: 'sony',
                category: 'accessories',
                images: ['https://images.unsplash.com/photo-1675243336718-4509772ee9a0?q=80&w=1000&auto=format&fit=crop'],
                descAr: 'أفضل سماعة عازلة للضوضاء من سوني',
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
        return await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.role, 'customer'));
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
