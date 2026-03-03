import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

const sql = postgres(databaseUrl);

async function syncCollectionsColumn() {
    try {
        console.log('--- Synchronizing Collections Table (collections) ---');

        // Add downPaymentPercentage column if it doesn't exist
        await sql`ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "downPaymentPercentage" DOUBLE PRECISION DEFAULT 0 NOT NULL`;
        console.log('✅ Column "downPaymentPercentage" verified in table "collections"');

        console.log('🚀 Database synchronization successful!');
    } catch (error) {
        console.error('❌ Error during synchronization:', error.message);
    } finally {
        await sql.end();
    }
}

syncCollectionsColumn();
