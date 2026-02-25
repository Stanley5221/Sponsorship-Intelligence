require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BATCH_SIZE = 1000;
const CSV_FILE = "UKVI.csv";

async function importCSV() {
    console.log("🚀 Starting CSV import...");
    const start = Date.now();
    let count = 0;
    let batch = [];

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        // Map CSV columns to Prisma model fields
        // "Organisation Name","Town/City","County","Type & Rating","Route"
        const company = {
            name: row["Organisation Name"],
            town: row["Town/City"] || null,
            county: row["County"] || null,
            fullRating: row["Type & Rating"] || null,
            rating: extractRating(row["Type & Rating"]),
            route: row["Route"] || null,
        };

        batch.push(company);

        if (batch.length === BATCH_SIZE) {
            await prisma.company.createMany({
                data: batch,
                skipDuplicates: true,
            });
            count += batch.length;
            console.log(`📦 Imported ${count} records...`);
            batch = [];
        }
    }

    // Insert remaining records
    if (batch.length > 0) {
        await prisma.company.createMany({
            data: batch,
            skipDuplicates: true,
        });
        count += batch.length;
    }

    const duration = (Date.now() - start) / 1000;
    console.log(`✅ Import complete! Total records: ${count}. Time taken: ${duration}s`);

    await prisma.$disconnect();
    await pool.end();
}

function extractRating(fullRating) {
    if (!fullRating) return null;
    if (fullRating.includes("(A rating)")) return "A";
    if (fullRating.includes("(B rating)")) return "B";
    return fullRating; // Fallback
}

importCSV().catch((err) => {
    console.error("❌ Import failed:", err);
    process.exit(1);
});
