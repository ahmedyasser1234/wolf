CREATE TABLE IF NOT EXISTS "cartItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"size" text,
	"color" text,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"nameAr" text NOT NULL,
	"nameEn" text NOT NULL,
	"slug" text NOT NULL,
	"descriptionAr" text,
	"descriptionEn" text,
	"image" text,
	"parentId" integer,
	"isActive" boolean DEFAULT true,
	"displayOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"nameAr" text NOT NULL,
	"nameEn" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"coverImage" text,
	"categoryId" integer,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contentItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"isActive" boolean DEFAULT true,
	"displayOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"lastMessageId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discountPercent" integer NOT NULL,
	"maxUses" integer,
	"usedCount" integer DEFAULT 0,
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"senderRole" text NOT NULL,
	"content" text NOT NULL,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"relatedId" integer,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offerItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"offerId" integer NOT NULL,
	"productId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"nameAr" text NOT NULL,
	"nameEn" text NOT NULL,
	"discountPercent" integer NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"usageLimit" integer,
	"minQuantity" integer DEFAULT 1,
	"usedCount" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" double precision NOT NULL,
	"total" double precision NOT NULL,
	"size" text,
	"color" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" text NOT NULL,
	"customerId" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" double precision NOT NULL,
	"shippingCost" double precision DEFAULT 0,
	"tax" double precision DEFAULT 0,
	"discount" double precision DEFAULT 0,
	"total" double precision NOT NULL,
	"shippingAddress" jsonb,
	"billingAddress" jsonb,
	"paymentMethod" text,
	"paymentStatus" text DEFAULT 'pending' NOT NULL,
	"stripePaymentId" text,
	"trackingNumber" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pointsTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productColors" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"colorName" text NOT NULL,
	"colorCode" text NOT NULL,
	"images" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"collectionId" integer,
	"categoryId" integer,
	"brandId" integer,
	"nameAr" text NOT NULL,
	"nameEn" text NOT NULL,
	"slug" text NOT NULL,
	"descriptionAr" text,
	"descriptionEn" text,
	"sizes" jsonb,
	"shortDescription" text,
	"price" double precision NOT NULL,
	"originalPrice" double precision,
	"discount" double precision DEFAULT 0,
	"sku" text,
	"stock" integer DEFAULT 0,
	"images" jsonb,
	"specifications" jsonb,
	"cutType" text,
	"bodyShape" text,
	"impression" text,
	"occasion" text,
	"silhouette" text,
	"rating" double precision DEFAULT 0,
	"reviewCount" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"isFeatured" boolean DEFAULT false,
	"aiQualifiedImage" text,
	"tags" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"customerId" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"images" jsonb,
	"isVerifiedPurchase" boolean DEFAULT false,
	"helpful" integer DEFAULT 0,
	"unhelpful" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipping" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"shippingCost" double precision DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storeReviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer,
	"guestName" text,
	"city" text,
	"rating" integer NOT NULL,
	"comment" text,
	"isApproved" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userPoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userPoints_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"address" text,
	"password" text,
	"loginMethod" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"avatar" text,
	"measurements" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "walletTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"walletId" integer NOT NULL,
	"amount" double precision NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"description" text,
	"relatedId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"productId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlistSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"shareToken" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlistSettings_userId_unique" UNIQUE("userId"),
	CONSTRAINT "wishlistSettings_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cartItems_customerId_idx" ON "cartItems" ("customerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cartItems_productId_idx" ON "cartItems" ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collections_categoryId_idx" ON "collections" ("categoryId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_idx" ON "collections" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contentItems_type_idx" ON "contentItems" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_customerId_idx" ON "conversations" ("customerId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages" ("conversationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offerItems_offerId_idx" ON "offerItems" ("offerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offerItems_productId_idx" ON "offerItems" ("productId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "offerItems_unique_idx" ON "offerItems" ("offerId","productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orderItems_orderId_idx" ON "orderItems" ("orderId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orderItems_productId_idx" ON "orderItems" ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_customerId_idx" ON "orders" ("customerId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_idx" ON "orders" ("orderNumber");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pointsTransactions_userId_idx" ON "pointsTransactions" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "productColors_productId_idx" ON "productColors" ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products" ("categoryId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_productId_idx" ON "reviews" ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_customerId_idx" ON "reviews" ("customerId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shipping_productId_idx" ON "shipping" ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storeReviews_customerId_idx" ON "storeReviews" ("customerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "userPoints_userId_idx" ON "userPoints" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "walletTransactions_walletId_idx" ON "walletTransactions" ("walletId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_customerId_idx" ON "wishlist" ("customerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_productId_idx" ON "wishlist" ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlistSettings_userId_idx" ON "wishlistSettings" ("userId");