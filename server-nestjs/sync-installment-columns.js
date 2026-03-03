import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

const sql = postgres(databaseUrl);

async function syncInstallmentColumns() {
    try {
        console.log('--- Synchronizing Installment Plans Table (installmentPlans) ---');

        // Check columns one by one - using the correct camelCase table name from schema
        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "collectionId" INTEGER`;
        console.log('✅ Column "collectionId" verified');

        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "interestRate" DOUBLE PRECISION DEFAULT 0`;
        console.log('✅ Column "interestRate" verified');

        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "downPaymentPercentage" DOUBLE PRECISION DEFAULT 0`;
        console.log('✅ Column "downPaymentPercentage" verified');

        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "minQuantity" INTEGER DEFAULT 1`;
        console.log('✅ Column "minQuantity" verified');

        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "maxQuantity" INTEGER DEFAULT 0`;
        console.log('✅ Column "maxQuantity" verified');

        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "minAmount" DOUBLE PRECISION DEFAULT 0`;
        console.log('✅ Column "minAmount" verified');

        console.log('🚀 All columns are now synchronized successfully!');
    } catch (error) {
        console.error('❌ Error during synchronization:', error.message);
        if (error.message.includes('relation "installmentPlans" does not exist')) {
            console.error('👉 The table "installmentPlans" still could not be found. Please check your actual database table names.');
        }
    } finally {
        await sql.end();
    }
}

syncInstallmentColumns();
