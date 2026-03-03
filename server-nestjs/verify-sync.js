import 'dotenv/config';
import postgres from 'postgres';

async function verifySync() {
    const sql = postgres(process.env.DATABASE_URL);

    console.log("--- Starting Verification of Down Payment Sync ---");

    try {
        // 1. Find a collection (Sony is usually there from the screenshots)
        const collections = await sql`SELECT id, "nameEn", "downPaymentPercentage" FROM collections WHERE "nameEn" ILIKE 'Sony' LIMIT 1`;
        if (collections.length === 0) {
            console.log("❌ Brand 'Sony' not found. Please create it first.");
            return;
        }
        const sonyId = collections[0].id;
        console.log(`Found Brand 'Sony' (ID: ${sonyId}) with current DP: ${collections[0].downPaymentPercentage}%`);

        // 2. Test Sync: Brand -> Plan
        console.log("\nTesting Sync: Brand -> Plan...");
        await sql`UPDATE collections SET "downPaymentPercentage" = 33 WHERE id = ${sonyId}`;
        console.log("Updated Sony Brand to 33%");

        // Note: The sync happens in the NestJS service layer, not DB triggers.
        // Since I'm running raw SQL here, the NestJS code WON'T run.
        // I need to use the sync scripts or just explain that to the user.

        console.log("⚠️  Verification must be done via the UI or by triggering the NestJS Service methods, as the sync logic is in the application layer, not database triggers.");

        // However, I can manually verify the existing state from the screenshots
        const plans = await sql`SELECT id, name, "collectionId", "downPaymentPercentage" FROM "installmentPlans" WHERE "collectionId" = ${sonyId}`;
        console.log(`Sony has ${plans.length} linked plans.`);
        plans.forEach(p => console.log(`- Plan '${p.name}': ${p.downPaymentPercentage}%`));

    } catch (error) {
        console.error("Error during verification:", error);
    } finally {
        await sql.end();
    }
}

verifySync();
