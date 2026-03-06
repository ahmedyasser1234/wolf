import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrateInstallmentGroups() {
    try {
        console.log('--- Migrating Installment Plans to Multiple Groups ---');

        // 1. Add the new collectionIds array column
        await sql`ALTER TABLE "installmentPlans" ADD COLUMN IF NOT EXISTS "collectionIds" INTEGER[]`;
        console.log('✅ Column "collectionIds" (INTEGER ARRAY) added');

        // 2. Migrate existing data from collectionId to collectionIds array
        // We wrap the existing ID in an array if it exists
        await sql`
            UPDATE "installmentPlans" 
            SET "collectionIds" = ARRAY["collectionId"] 
            WHERE "collectionId" IS NOT NULL AND "collectionIds" IS NULL
        `;
        console.log('✅ Existing collectionId data migrated to collectionIds array');

        console.log('🚀 Migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Error during migration:', error.message);
    } finally {
        await sql.end();
    }
}

migrateInstallmentGroups();
