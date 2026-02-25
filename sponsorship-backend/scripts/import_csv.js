const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    console.log(`🚀 Starting Optimized Import: ${filePath}`);

    // Check if table is already populated to avoid partial duplicate issues
    const count = await prisma.company.count();
    if (count > 0) {
        console.log(`Database already has ${count} records. Skipping initial full seed.`);
        return count;
    }

    let batch = [];
    let processedCount = 0;
    let newCount = 0;
    const BATCH_SIZE = 1000;

    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', async (row) => {
                const name = row['Organisation Name'];
                const town = row['Town/City'];
                const typeRating = row['Type & Rating'];
                const route = row['Route'];

                if (!name) return;

                const ratingMatch = typeRating?.match(/\(([A-B]) rating\)/);
                const rating = ratingMatch ? ratingMatch[1] : 'A';
                const coords = cityCoords[town] || { lat: null, lng: null };

                batch.push({
                    name,
                    town,
                    route,
                    rating,
                    fullRating: typeRating,
                    latitude: coords.lat,
                    longitude: coords.lng
                });

                if (batch.length >= BATCH_SIZE) {
                    stream.pause();
                    const currentBatch = [...batch];
                    batch = [];
                    try {
                        // Use createMany for high performance (supported by PostgreSQL)
                        await prisma.company.createMany({
                            data: currentBatch,
                            skipDuplicates: true
                        });
                        newCount += currentBatch.length;
                        processedCount += currentBatch.length;
                        console.log(`✅ Processed ${processedCount} records...`);
                        stream.resume();
                    } catch (err) {
                        console.error('Batch import error:', err);
                        stream.destroy(err);
                    }
                }
            })
            .on('end', async () => {
                try {
                    if (batch.length > 0) {
                        await prisma.company.createMany({
                            data: batch,
                            skipDuplicates: true
                        });
                        newCount += batch.length;
                    }

                    await prisma.importLog.create({
                        data: {
                            filename: filePath.split(/[\\/]/).pop(),
                            status: 'SUCCESS',
                            count: newCount
                        }
                    });

                    console.log(`🎉 Seed complete! ${newCount} total companies added.`);
                    resolve(newCount);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', reject);
    });
}

module.exports = importCSV;

if (require.main === module) {
    const csvPath = process.argv[2] || 'UKVI.csv';
    importCSV(csvPath).then(() => process.exit(0)).catch((err) => {
        console.error('FATAL:', err);
        process.exit(1);
    });
}
