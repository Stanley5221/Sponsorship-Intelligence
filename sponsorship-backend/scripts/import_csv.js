const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to get coordinates for common UK cities (reused from populate-geo)
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
    console.log(`Starting import from: ${filePath}`);
    const results = [];
    let processedCount = 0;
    let newCount = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    for (const row of results) {
                        const name = row['Organisation Name'];
                        const town = row['Town/City'];
                        const typeRating = row['Type & Rating'];
                        const route = row['Route'];

                        if (!name) continue;

                        // Simple duplicate check: name + town
                        const existing = await prisma.company.findFirst({
                            where: {
                                name: name,
                                town: town || null
                            }
                        });

                        if (!existing) {
                            // Extract rating (usually A or B)
                            const ratingMatch = typeRating?.match(/\(([A-B]) rating\)/);
                            const rating = ratingMatch ? ratingMatch[1] : 'A';

                            // Get coordinates if town is known
                            const coords = cityCoords[town] || { lat: null, lng: null };

                            await prisma.company.create({
                                data: {
                                    name,
                                    town,
                                    route,
                                    rating,
                                    fullRating: typeRating,
                                    latitude: coords.lat,
                                    longitude: coords.lng
                                }
                            });
                            newCount++;
                        }
                        processedCount++;
                        if (processedCount % 1000 === 0) console.log(`Processed ${processedCount} rows...`);
                    }

                    // Log the success
                    await prisma.importLog.create({
                        data: {
                            filename: filePath.split(/[\\/]/).pop(),
                            status: 'SUCCESS',
                            count: newCount
                        }
                    });

                    console.log(`Import complete. ${newCount} new companies added.`);
                    resolve(newCount);
                } catch (error) {
                    console.error('Import failed:', error);
                    await prisma.importLog.create({
                        data: {
                            filename: filePath.split(/[\\/]/).pop(),
                            status: 'FAILED',
                            error: error.message
                        }
                    });
                    reject(error);
                }
            });
    });
}

module.exports = importCSV;

if (require.main === module) {
    const csvPath = process.argv[2] || 'UKVI.csv';
    importCSV(csvPath).then(() => process.exit(0)).catch(() => process.exit(1));
}
