import {
    pgTable,
    text,
    integer,
    doublePrecision,
    timestamp,
    uniqueIndex,
    index,
    serial,
    boolean,
    jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    openId: text("openId").notNull().unique(),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    address: text("address"),
    country: text("country"),
    password: text("password"),
    loginMethod: text("loginMethod"),
    status: text("status").default("active").notNull(), // active, blocked, deactivated
    role: text("role").default("customer").notNull(),
    avatar: text("avatar"),
    measurements: jsonb("measurements").$type<any>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
    isDuplicate: boolean("isDuplicate").default(false).notNull(), // Feature 5
    isVerified: boolean("isVerified").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const vendors = pgTable(
    "vendors",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId").notNull(),
        status: text("status").default("pending").notNull(), // pending, approved, rejected
        storeNameAr: text("storeNameAr"),
        storeNameEn: text("storeNameEn"),
        storeSlug: text("storeSlug").notNull().unique(),
        descriptionAr: text("descriptionAr"),
        descriptionEn: text("descriptionEn"),
        logo: text("logo"),
        banner: text("banner"),
        coverImage: text("coverImage"),
        email: text("email").notNull(),
        phone: text("phone"),
        addressAr: text("addressAr"),
        addressEn: text("addressEn"),
        cityAr: text("cityAr"),
        cityEn: text("cityEn"),
        countryAr: text("countryAr"),
        countryEn: text("countryEn"),
        zipCode: text("zipCode"),
        website: text("website"),
        socialLinks: jsonb("socialLinks").$type<{
            instagram?: string;
            facebook?: string;
            twitter?: string;
            tiktok?: string;
            whatsapp?: string;
        }>(),
        gallery: text("gallery").array(),
        isVerified: boolean("isVerified").default(false),
        isActive: boolean("isActive").default(true),
        commissionRate: doublePrecision("commissionRate").default(10),
        rating: doublePrecision("rating").default(0),
        totalReviews: integer("totalReviews").default(0),
        shippingCost: doublePrecision("shippingCost").default(0).notNull(),
        hasFreeShipping: boolean("hasFreeShipping").default(false).notNull(),
        freeShippingThreshold: doublePrecision("freeShippingThreshold").default(0),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: uniqueIndex("vendors_userId_idx").on(table.userId),
        storeSlugIdx: uniqueIndex("vendors_storeSlug_idx").on(table.storeSlug),
    })
);

export type Vendor = typeof vendors.$inferSelect;


export const collections = pgTable(
    "collections",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId"),
        nameAr: text("nameAr").notNull(),
        nameEn: text("nameEn").notNull(),
        slug: text("slug").notNull(),
        description: text("description"),
        coverImage: text("coverImage"),
        categoryId: integer("categoryId"), // Linked Category (Nullable for backward compat)
        downPaymentPercentage: doublePrecision("downPaymentPercentage").default(0).notNull(), // New field
        isActive: boolean("isActive").default(true),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("collections_vendorId_idx").on(table.vendorId),
        categoryIdIdx: index("collections_categoryId_idx").on(table.categoryId), // Index for performance
        vendorSlugIdx: uniqueIndex("collections_vendor_slug_idx").on(table.vendorId, table.slug),
    })
);

export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    nameAr: text("nameAr").notNull(),
    nameEn: text("nameEn").notNull(),
    slug: text("slug").notNull().unique(),
    descriptionAr: text("descriptionAr"),
    descriptionEn: text("descriptionEn"),
    image: text("image"),
    parentId: integer("parentId"),
    isActive: boolean("isActive").default(true),
    displayOrder: integer("displayOrder").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const products = pgTable(
    "products",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId"),
        collectionId: integer("collectionId"), // Strict logic handled in service
        categoryId: integer("categoryId"),
        brandId: integer("brandId"),
        nameAr: text("nameAr").notNull(),
        nameEn: text("nameEn").notNull(),
        slug: text("slug").notNull(),
        descriptionAr: text("descriptionAr"),
        descriptionEn: text("descriptionEn"),
        sizes: jsonb("sizes").$type<{ size: string; quantity: number }[]>(),
        shortDescription: text("shortDescription"),
        vendorPrice: doublePrecision("vendorPrice"), // The price set by the vendor
        vendorOriginalPrice: doublePrecision("vendorOriginalPrice"), // The original price set by the vendor (before discount)
        price: doublePrecision("price").notNull(), // The final price (Vendor Price + Commission)
        originalPrice: doublePrecision("originalPrice"),
        discount: doublePrecision("discount").default(0),
        sku: text("sku"),
        stock: integer("stock").default(0),
        images: jsonb("images").$type<string[]>(),
        specifications: jsonb("specifications").$type<Record<string, string>>(),
        cutType: text("cutType"),
        bodyShape: text("bodyShape"),
        impression: text("impression"),
        occasion: text("occasion"),
        silhouette: text("silhouette"),
        rating: doublePrecision("rating").default(0),
        reviewCount: integer("reviewCount").default(0),
        isActive: boolean("isActive").default(true),
        isFeatured: boolean("isFeatured").default(false),
        aiQualifiedImage: text("aiQualifiedImage"),
        tags: jsonb("tags").$type<string[]>(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("products_vendorId_idx").on(table.vendorId),
        categoryIdIdx: index("products_categoryId_idx").on(table.categoryId),
        slugIdx: uniqueIndex("products_slug_idx").on(table.slug),
    })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;



export const productColors = pgTable(
    "productColors",
    {
        id: serial("id").primaryKey(),
        productId: integer("productId").notNull(),
        colorName: text("colorName").notNull(),
        colorCode: text("colorCode").notNull(), // Hex code like "#FF0000"
        images: jsonb("images").$type<string[]>(),
        quantity: integer("quantity").notNull().default(0), // Quantity specific to this color
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        productIdIdx: index("productColors_productId_idx").on(table.productId),
    })
);

export type ProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = typeof productColors.$inferInsert;

export const reviews = pgTable(
    "reviews",
    {
        id: serial("id").primaryKey(),
        productId: integer("productId").notNull(),
        customerId: integer("customerId").notNull(),
        rating: integer("rating").notNull(),
        title: text("title"),
        comment: text("comment"),
        images: jsonb("images").$type<string[]>(),
        isVerifiedPurchase: boolean("isVerifiedPurchase").default(false),
        helpful: integer("helpful").default(0),
        unhelpful: integer("unhelpful").default(0),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        productIdIdx: index("reviews_productId_idx").on(table.productId),
        customerIdIdx: index("reviews_customerId_idx").on(table.customerId),
    })
);

export const cartItems = pgTable(
    "cartItems",
    {
        id: serial("id").primaryKey(),
        customerId: integer("customerId").notNull(),
        productId: integer("productId").notNull(),
        quantity: integer("quantity").notNull().default(1),
        size: text("size"),
        color: text("color"), // Added color column
        addedAt: timestamp("addedAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        customerIdIdx: index("cartItems_customerId_idx").on(table.customerId),
        productIdIdx: index("cartItems_productId_idx").on(table.productId),
    })
);

export const orders = pgTable(
    "orders",
    {
        id: serial("id").primaryKey(),
        orderNumber: text("orderNumber").notNull().unique(),
        customerId: integer("customerId").notNull(),
        vendorId: integer("vendorId"),
        status: text("status").default("pending").notNull(),
        subtotal: doublePrecision("subtotal").notNull(),
        shippingCost: doublePrecision("shippingCost").default(0),
        tax: doublePrecision("tax").default(0),
        discount: doublePrecision("discount").default(0),
        commission: doublePrecision("commission").default(0),
        total: doublePrecision("total").notNull(),
        shippingAddress: jsonb("shippingAddress").$type<{
            name: string;
            phone: string;
            address: string;
            city: string;
            country: string;
            zipCode: string;
        }>(),
        billingAddress: jsonb("billingAddress").$type<{
            name: string;
            phone: string;
            address: string;
            city: string;
            country: string;
            zipCode: string;
        }>(),
        paymentMethod: text("paymentMethod"),
        paymentStatus: text("paymentStatus").default("pending").notNull(),
        depositAmount: doublePrecision("depositAmount").default(0),
        depositPaymentMethod: text("depositPaymentMethod"), // 'wallet' | 'card' | 'gift_card'
        stripePaymentId: text("stripePaymentId"),
        installmentPlanId: integer("installmentPlanId"), // Link to installment plan if chosen
        kycData: jsonb("kycData").$type<{
            faceIdImage: string;
            residencyImage: string;
            passportImage: string;
            idNumber?: string;
            passportNumber?: string;
            dob?: string;
            residentialAddress?: string;
        }>(),
        trackingNumber: text("trackingNumber"),
        notes: text("notes"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        customerIdIdx: index("orders_customerId_idx").on(table.customerId),
        vendorIdIdx: index("orders_vendorId_idx").on(table.vendorId),
        orderNumberIdx: uniqueIndex("orders_orderNumber_idx").on(table.orderNumber),
        installmentPlanIdIdx: index("orders_installmentPlanId_idx").on(table.installmentPlanId),
    })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = pgTable(
    "orderItems",
    {
        id: serial("id").primaryKey(),
        orderId: integer("orderId").notNull(),
        productId: integer("productId").notNull(),
        vendorId: integer("vendorId"),
        quantity: integer("quantity").notNull(),
        price: doublePrecision("price").notNull(),
        total: doublePrecision("total").notNull(),
        size: text("size"),
        color: text("color"), // Added color column
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        orderIdIdx: index("orderItems_orderId_idx").on(table.orderId),
        productIdIdx: index("orderItems_productId_idx").on(table.productId),
        vendorIdIdx: index("orderItems_vendorId_idx").on(table.vendorId),
    })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const notifications = pgTable(
    "notifications",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId").notNull(),
        type: text("type").notNull(),
        title: text("title").notNull(),
        message: text("message"),
        relatedId: integer("relatedId"),
        isRead: boolean("isRead").default(false),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("notifications_userId_idx").on(table.userId),
    })
);

export const vendorReviews = pgTable(
    "vendorReviews",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId").notNull(),
        customerId: integer("customerId").notNull(),
        rating: integer("rating").notNull(),
        comment: text("comment"),
        isVerifiedPurchase: boolean("isVerifiedPurchase").default(false),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("vendorReviews_vendorId_idx").on(table.vendorId),
        customerIdIdx: index("vendorReviews_customerId_idx").on(table.customerId),
    })
);

export const storeReviews = pgTable(
    "storeReviews",
    {
        id: serial("id").primaryKey(),
        customerId: integer("customerId"), // Nullable for guest reviews if allowed, or linked to user
        guestName: text("guestName"), // For display name
        city: text("city"),
        rating: integer("rating").notNull(),
        comment: text("comment"),
        isApproved: boolean("isApproved").default(true), // Default true for immediate feedback per user preference
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        customerIdIdx: index("storeReviews_customerId_idx").on(table.customerId),
    })
);

export const wishlist = pgTable(
    "wishlist",
    {
        id: serial("id").primaryKey(),
        customerId: integer("customerId").notNull(),
        productId: integer("productId").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        customerIdIdx: index("wishlist_customerId_idx").on(table.customerId),
        productIdIdx: index("wishlist_productId_idx").on(table.productId),
    })
);

export const vendorPayouts = pgTable(
    "vendorPayouts",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId"),
        amount: doublePrecision("amount").notNull(),
        status: text("status").default("pending").notNull(),
        period: text("period"),
        stripePayoutId: text("stripePayoutId"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("vendorPayouts_vendorId_idx").on(table.vendorId),
    })
);

export const coupons = pgTable(
    "coupons",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId"),
        code: text("code").notNull().unique(),
        type: text("type").default("percentage").notNull(), // 'percentage' | 'fixed'
        discountPercent: integer("discountPercent"),
        discountAmount: doublePrecision("discountAmount"),
        maxUses: integer("maxUses"),
        usedCount: integer("usedCount").default(0),
        expiresAt: timestamp("expiresAt"),
        isActive: boolean("isActive").default(true),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("coupons_vendorId_idx").on(table.vendorId),
        codeIdx: uniqueIndex("coupons_code_idx").on(table.code),
    })
);

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

export const shipping = pgTable(
    "shipping",
    {
        id: serial("id").primaryKey(),
        productId: integer("productId").notNull(),
        vendorId: integer("vendorId"),
        shippingCost: doublePrecision("shippingCost").notNull().default(0),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        productIdIdx: uniqueIndex("shipping_productId_idx").on(table.productId),
        vendorIdIdx: index("shipping_vendorId_idx").on(table.vendorId),
    })
);

export type Shipping = typeof shipping.$inferSelect;
export type InsertShipping = typeof shipping.$inferInsert;

// --- Offers System ---

export const offers = pgTable(
    "offers",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId").notNull(),
        nameAr: text("nameAr").notNull(),
        nameEn: text("nameEn").notNull(),
        discountPercent: integer("discountPercent").notNull(),
        startDate: timestamp("startDate").notNull(),
        endDate: timestamp("endDate").notNull(),
        usageLimit: integer("usageLimit"), // Max number of products/orders this can be applied to
        minQuantity: integer("minQuantity").default(1), // Min quantity required in cart to apply offer
        usedCount: integer("usedCount").default(0),
        isActive: boolean("isActive").default(true),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("offers_vendorId_idx").on(table.vendorId),
    })
);

export const offerItems = pgTable(
    "offerItems",
    {
        id: serial("id").primaryKey(),
        offerId: integer("offerId").notNull(),
        productId: integer("productId").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        offerIdIdx: index("offerItems_offerId_idx").on(table.offerId),
        productIdIdx: index("offerItems_productId_idx").on(table.productId),
        uniqueOfferItem: uniqueIndex("offerItems_unique_idx").on(table.offerId, table.productId),
    })
);

export type Offer = typeof offers.$inferSelect;
// --- Chat System ---

export const conversations = pgTable(
    "conversations",
    {
        id: serial("id").primaryKey(),
        customerId: integer("customerId").notNull(),
        vendorId: integer("vendorId"),
        lastMessageId: integer("lastMessageId"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        customerIdIdx: index("conversations_customerId_idx").on(table.customerId),
        vendorIdIdx: index("conversations_vendorId_idx").on(table.vendorId),
        uniqueConversation: uniqueIndex("conversations_unique_idx").on(table.customerId, table.vendorId),
    })
);

export const messages = pgTable(
    "messages",
    {
        id: serial("id").primaryKey(),
        conversationId: integer("conversationId").notNull(),
        senderId: integer("senderId").notNull(), // User Name
        senderRole: text("senderRole").notNull(), // 'customer' or 'vendor'
        content: text("content").notNull(),
        isRead: boolean("isRead").default(false),
        status: text("status").default("sent").notNull(), // 'sent', 'delivered', 'read'
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
    })
);

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const contentItems = pgTable(
    "contentItems",
    {
        id: serial("id").primaryKey(),
        type: text("type").notNull(), // 'testimonial', 'social_feed'
        data: jsonb("data").$type<any>().notNull(),
        isActive: boolean("isActive").default(true),
        displayOrder: integer("displayOrder").default(0),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        typeIdx: index("contentItems_type_idx").on(table.type),
    })
);

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;

// --- Financial System ---

export const vendorWallets = pgTable(
    "vendorWallets",
    {
        id: serial("id").primaryKey(),
        vendorId: integer("vendorId").unique(),
        availableBalance: doublePrecision("availableBalance").default(0).notNull(),
        pendingBalance: doublePrecision("pendingBalance").default(0).notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        vendorIdIdx: index("vendorWallets_vendorId_idx").on(table.vendorId),
    })
);

export const walletTransactions = pgTable(
    "walletTransactions",
    {
        id: serial("id").primaryKey(),
        walletId: integer("walletId").notNull(),
        amount: doublePrecision("amount").notNull(),
        type: text("type").notNull(), // funding, payment, refund, withdrawal
        status: text("status").default("completed").notNull(), // pending, completed, failed
        referenceId: text("referenceId"), // stripe session id
        relatedId: integer("relatedId"), // order id
        description: text("description"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        walletIdIdx: index("walletTransactions_walletId_idx").on(table.walletId),
    })
);

// --- Loyalty & Rewards ---

export const userPoints = pgTable(
    "userPoints",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId").notNull().unique(),
        points: integer("points").default(0).notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("userPoints_userId_idx").on(table.userId),
    })
);

export const pointsTransactions = pgTable(
    "pointsTransactions",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId").notNull(),
        amount: integer("amount").notNull(),
        type: text("type").notNull(), // 'earn', 'spend', 'refund'
        description: text("description"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("pointsTransactions_userId_idx").on(table.userId),
    })
);

// --- Social Wishlist ---

export const wishlistSettings = pgTable(
    "wishlistSettings",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId").notNull().unique(),
        isPublic: boolean("isPublic").default(false).notNull(),
        shareToken: text("shareToken").unique(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("wishlistSettings_userId_idx").on(table.userId),
    })
);

export const paymentGateways = pgTable("paymentGateways", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // stripe, tap, etc
    displayNameAr: text("displayNameAr").notNull(),
    displayNameEn: text("displayNameEn").notNull(),
    logo: text("logo"),
    isActive: boolean("isActive").default(true),
    isTestMode: boolean("isTestMode").default(true),
    publishableKey: text("publishableKey"),
    secretKey: text("secretKey"),
    merchantId: text("merchantId"),
    config: jsonb("config").$type<any>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const giftCards = pgTable("giftCards", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    amount: doublePrecision("amount").notNull(),
    senderName: text("senderName"),
    senderEmail: text("senderEmail"),
    recipientName: text("recipientName"),
    recipientEmail: text("recipientEmail"),
    message: text("message"),
    style: text("style"), // card design theme
    isRead: boolean("isRead").default(false),
    isRedeemed: boolean("isRedeemed").default(false),
    redeemedByUserId: integer("redeemedByUserId"),
    redeemedAt: timestamp("redeemedAt"),
    paymentMethod: text("paymentMethod"), // 'wallet', 'card'
    paymentStatus: text("paymentStatus").default('pending'), // 'pending', 'paid', 'failed'
    isActive: boolean("isActive").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const installments = pgTable("installments", {
    id: serial("id").primaryKey(),
    orderId: integer("orderId").notNull(),
    totalAmount: doublePrecision("totalAmount").notNull(),
    remainingAmount: doublePrecision("remainingAmount").notNull(),
    installmentsCount: integer("installmentsCount").notNull(),
    nextPaymentDate: timestamp("nextPaymentDate"),
    status: text("status").default("active").notNull(), // active, completed, overdue
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const customerWallets = pgTable("customerWallets", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique(),
    balance: doublePrecision("balance").default(0).notNull(),
    currency: text("currency").default("SAR").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const installmentPlans = pgTable("installmentPlans", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    collectionId: integer("collectionId"), // Link to specific collection (brand) - Deprecated in favor of collectionIds
    collectionIds: integer("collectionIds").array(), // Supports multiple collections
    months: integer("months").notNull(),
    interestRate: doublePrecision("interestRate").default(0).notNull(),
    downPaymentPercentage: doublePrecision("downPaymentPercentage").default(0).notNull(),
    minQuantity: integer("minQuantity").default(1).notNull(), // Default to at least 1
    maxQuantity: integer("maxQuantity").default(0).notNull(), // 0 = unlimited
    minAmount: doublePrecision("minAmount").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
    collectionIdIdx: index("installment_plans_collectionId_idx").on(table.collectionId),
}));

export const accountStatusLogs = pgTable("accountStatusLogs", {
    id: serial("id").primaryKey(),
    customerId: integer("customerId").notNull(),
    adminId: integer("adminId").notNull(),
    oldStatus: text("oldStatus").notNull(),
    newStatus: text("newStatus").notNull(),
    changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => ({
    customerIdIdx: index("accountStatusLogs_customerId_idx").on(table.customerId),
}));

export const installmentPayments = pgTable("installmentPayments", {
    id: serial("id").primaryKey(),
    installmentId: integer("installmentId").notNull(), // Links to installments table
    orderId: integer("orderId").notNull(),
    customerId: integer("customerId").notNull(),
    dueDate: timestamp("dueDate").notNull(),
    amount: doublePrecision("amount").notNull(),
    status: text("status").default("pending").notNull(), // pending, paid, overdue
    paymentDate: timestamp("paymentDate"),
    paymentMethod: text("paymentMethod"),
    transactionId: text("transactionId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
    installmentIdIdx: index("installment_payments_installmentId_idx").on(table.installmentId),
    orderIdIdx: index("installment_payments_orderId_idx").on(table.orderId),
    customerIdIdx: index("installment_payments_customerId_idx").on(table.customerId),
    dueDateIdx: index("installment_payments_dueDate_idx").on(table.dueDate),
}));

export type InstallmentPayment = typeof installmentPayments.$inferSelect;
export type InsertInstallmentPayment = typeof installmentPayments.$inferInsert;
