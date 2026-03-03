import 'dotenv/config';
import postgres from 'postgres';

async function syncAll() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL is not defined in .env');
        process.exit(1);
    }

    const sql = postgres(databaseUrl);
    console.log("--- Syncing Brands and Installment Plans ---");

    try {
        // Update all installment plans that have a collectionId (Brand)
        // to match the down payment percentage of their Parent Brand
        const updatedPlans = await sql`
            UPDATE "installmentPlans" p
            SET "downPaymentPercentage" = c."downPaymentPercentage"
            FROM collections c
            WHERE p."collectionId" = c.id
            RETURNING p.id, p.name, c."nameEn", c."downPaymentPercentage";
        `;

        console.log(`✅ Successfully aligned ${updatedPlans.length} plans with their brand's down payment.`);
        updatedPlans.forEach(p => {
            console.log(` - Plan '${p.name}' (Brand: ${p.nameEn}) synced to ${p.downPaymentPercentage}%`);
        });

        if (updatedPlans.length === 0) {
            console.log("No brand-specific plans found to sync.");
        }

    } catch (error) {
        console.error("❌ Sync Error:", error);
    } finally {
        await sql.end();
    }
}

syncAll();
