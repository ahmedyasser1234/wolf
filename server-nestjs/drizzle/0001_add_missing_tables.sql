CREATE TABLE IF NOT EXISTS "paymentGateways" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"displayNameAr" text NOT NULL,
	"displayNameEn" text NOT NULL,
	"logo" text,
	"isActive" boolean DEFAULT true,
	"isTestMode" boolean DEFAULT true,
	"publishableKey" text,
	"secretKey" text,
	"merchantId" text,
	"config" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "giftCards" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"amount" double precision NOT NULL,
	"senderName" text,
	"senderEmail" text,
	"recipientName" text,
	"recipientEmail" text,
	"message" text,
	"style" text,
	"isRead" boolean DEFAULT false,
	"isRedeemed" boolean DEFAULT false,
	"redeemedByUserId" integer,
	"redeemedAt" timestamp,
	"paymentMethod" text,
	"paymentStatus" text DEFAULT 'pending',
	"isActive" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "giftCards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"totalAmount" double precision NOT NULL,
	"remainingAmount" double precision NOT NULL,
	"installmentsCount" integer NOT NULL,
	"nextPaymentDate" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customerWallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customerWallets_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installmentPlans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"collectionId" integer,
	"collectionIds" integer[],
	"months" integer NOT NULL,
	"interestRate" double precision DEFAULT 0 NOT NULL,
	"downPaymentPercentage" double precision DEFAULT 0 NOT NULL,
	"minQuantity" integer DEFAULT 1 NOT NULL,
	"maxQuantity" integer DEFAULT 0 NOT NULL,
	"minAmount" double precision DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accountStatusLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"adminId" integer NOT NULL,
	"oldStatus" text NOT NULL,
	"newStatus" text NOT NULL,
	"changedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installmentPayments" (
	"id" serial PRIMARY KEY NOT NULL,
	"installmentId" integer NOT NULL,
	"orderId" integer NOT NULL,
	"customerId" integer NOT NULL,
	"dueDate" timestamp NOT NULL,
	"amount" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paymentDate" timestamp,
	"paymentMethod" text,
	"transactionId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otpVerifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emailTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"nameAr" text NOT NULL,
	"nameEn" text NOT NULL,
	"subjectAr" text NOT NULL,
	"subjectEn" text NOT NULL,
	"bodyAr" text NOT NULL,
	"bodyEn" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emailTemplates_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installment_plans_collectionId_idx" ON "installmentPlans" ("collectionId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accountStatusLogs_customerId_idx" ON "accountStatusLogs" ("customerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installment_payments_installmentId_idx" ON "installmentPayments" ("installmentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installment_payments_orderId_idx" ON "installmentPayments" ("orderId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installment_payments_customerId_idx" ON "installmentPayments" ("customerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installment_payments_dueDate_idx" ON "installmentPayments" ("dueDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_email_idx" ON "otpVerifications" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_code_idx" ON "otpVerifications" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_type_idx" ON "otpVerifications" ("type");
