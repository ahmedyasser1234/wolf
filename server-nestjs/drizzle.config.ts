
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    schema: "./src/database/schema.ts",
    out: "./drizzle",
    driver: "pg" as any,
    dbCredentials: {
        connectionString: process.env.DATABASE_URL!,
    },
});
