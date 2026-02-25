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

async function checkPrisma() {
    try {
        console.log('Checking User count...');
        const count = await prisma.user.count();
        console.log(`Current users: ${count}`);

        console.log('Attempting to create a test user...');
        const email = `diag_${Date.now()}@test.com`;
        const testUser = await prisma.user.create({
            data: {
                email: email,
                password: 'test'
            }
        });
        console.log('Test user created:', testUser.id);

        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('Test user cleaned up.');
    } catch (error) {
        console.error('PRISMA DIAGNOSTIC FAILED:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkPrisma();
