const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const cityCoords = {
    'London': { lat: 51.5074, lng: -0.1278 },
    'Birmingham': { lat: 52.4862, lng: -1.8904 },
    'Manchester': { lat: 53.4808, lng: -2.2426 },
    'Leeds': { lat: 53.8008, lng: -1.5491 },
    'Glasgow': { lat: 55.8642, lng: -4.2518 },
    'Sheffield': { lat: 53.3811, lng: -1.4701 },
    'Liverpool': { lat: 53.4084, lng: -2.9916 },
    'Bristol': { lat: 51.4545, lng: -2.5879 },
    'Edinburgh': { lat: 55.9533, lng: -3.1883 },
    'Leicester': { lat: 52.6369, lng: -1.1398 },
    'Coventry': { lat: 52.4068, lng: -1.5197 },
    'Cardiff': { lat: 51.4816, lng: -3.1791 },
    'Belfast': { lat: 54.5973, lng: -5.9301 },
    'Nottingham': { lat: 52.9548, lng: -1.1581 },
    'Newcastle upon Tyne': { lat: 54.9783, lng: -1.6178 },
    'Milton Keynes': { lat: 52.0406, lng: -0.7594 },
    'Reading': { lat: 51.4543, lng: -0.9781 },
    'Cambridge': { lat: 52.2053, lng: 0.1218 },
    'Oxford': { lat: 51.7520, lng: -1.2577 }
};

async function importCSV(filePath) {
    console.log(`🚀 Starting Memory-Safe Import: ${filePath}`);

    try {
        const count = await prisma.company.count();
        if (count > 0) {
            console.log(`📊 Database already has ${count} records. Skipping initial full seed.`);
            return count;
        }

        let batch = [];
        let processedCount = 0;
        let newCount = 0;
        const BATCH_SIZE = 500; // Smaller batches for tight memory limits

        const parser = fs.createReadStream(filePath).pipe(csv());

        // Using for await...of provides native backpressure
        // preventing OOM by waiting for the batch task to finish before reading more
        for await (const row of parser) {
            const name = row['Organisation Name'];
            const town = row['Town/City'];
            const typeRating = row['Type & Rating'];
            const route = row['Route'];

            if (!name) continue;

            const ratingMatch = typeRating?.match(/\(([A-B]) rating\)/);
            const rating = ratingMatch ? ratingMatch[1] : 'A';
            const coords = cityCoords[town] || { lat: null, lng: null };

            batch.push({
                name: name.trim(),
                town: town ? town.trim() : null,
                route: route ? route.trim() : null,
                rating,
                fullRating: typeRating,
                latitude: coords.lat,
                longitude: coords.lng
            });

            if (batch.length >= BATCH_SIZE) {
                try {
                    await prisma.company.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                    newCount += batch.length;
                    processedCount += batch.length;
                    console.log(`✅ Processed ${processedCount} records...`);

                    // Explicitly clear batch to encourage GC
                    batch = [];
                } catch (err) {
                    console.error('Batch import error:', err.message);
                }
            }
        }

        // Final remaining batch
        if (batch.length > 0) {
            await prisma.company.createMany({
                data: batch,
                skipDuplicates: true
            });
            newCount += batch.length;
            batch = null;
        }

        await prisma.importLog.create({
            data: {
                filename: filePath.split(/[\\/]/).pop(),
                status: 'SUCCESS',
                count: newCount
            }
        });

        console.log(`🎉 Seed complete! ${newCount} total companies added.`);
        return newCount;

    } catch (error) {
        console.error('FATAL Import failure:', error);
        try {
            await prisma.importLog.create({
                data: {
                    filename: filePath.split(/[\\/]/).pop(),
                    status: 'FAILED',
                    error: error.message
                }
            });
        } catch (logErr) {
            console.error('Could not write failure log:', logErr.message);
        }
        throw error;
    }
}

module.exports = importCSV;

if (require.main === module) {
    const csvPath = process.argv[2] || 'UKVI.csv';
    importCSV(csvPath).then(() => {
        console.log('Seeding process finished.');
        process.exit(0);
    }).catch((err) => {
        process.exit(1);
    });
}
