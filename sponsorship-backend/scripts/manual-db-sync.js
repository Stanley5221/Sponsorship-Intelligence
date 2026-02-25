const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function sync() {
    const client = await pool.connect();
    try {
        console.log('Starting manual database sync...');

        // 1. Create ApplicationStatus Enum
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'NO_RESPONSE', 'WITHDRAWN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        console.log('✓ Enum ApplicationStatus checked/created');

        // 2. Update Company table
        await client.query(`
      ALTER TABLE "Company" 
      ADD COLUMN IF NOT EXISTS "industry" TEXT,
      ADD COLUMN IF NOT EXISTS "website" TEXT,
      ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "createdBy" INTEGER,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);
        console.log('✓ Company table updated');

        // 3. Update Application table
        // Handle renames and type changes carefully

        // Rename jobRole to role
        const resRole = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='Application' AND column_name='jobRole'`);
        if (resRole.rows.length > 0) {
            await client.query(`ALTER TABLE "Application" RENAME COLUMN "jobRole" TO "role"`);
            console.log('✓ Application: jobRole -> role');
        }

        // Rename dateApplied to appliedDate
        const resDate = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='Application' AND column_name='dateApplied'`);
        if (resDate.rows.length > 0) {
            await client.query(`ALTER TABLE "Application" RENAME COLUMN "dateApplied" TO "appliedDate"`);
            console.log('✓ Application: dateApplied -> appliedDate');
        }

        // Change status type from String to Enum
        const resStatus = await client.query(`SELECT data_type FROM information_schema.columns WHERE table_name='Application' AND column_name='status'`);
        if (resStatus.rows.length > 0 && resStatus.rows[0].data_type === 'text') {
            await client.query(`
         ALTER TABLE "Application" 
         ALTER COLUMN "status" TYPE "ApplicationStatus" 
         USING (
           CASE 
             WHEN "status" = 'Applied' THEN 'APPLIED'::"ApplicationStatus"
             WHEN "status" = 'Interviewing' THEN 'INTERVIEW'::"ApplicationStatus"
             WHEN "status" = 'Offer' THEN 'OFFER'::"ApplicationStatus"
             WHEN "status" = 'Rejected' THEN 'REJECTED'::"ApplicationStatus"
             ELSE 'APPLIED'::"ApplicationStatus"
           END
         )
       `);
            console.log('✓ Application status column converted to enum');
        }

        // Add remaining columns to Application
        await client.query(`
      ALTER TABLE "Application"
      ADD COLUMN IF NOT EXISTS "followUpCompleted" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "salary" TEXT,
      ADD COLUMN IF NOT EXISTS "externalWebsite" TEXT,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    `);

        // Ensure userId is non-nullable if needed (Prisma schema says non-nullable now)
        const userRes = await client.query('SELECT id FROM "User" LIMIT 1');
        if (userRes.rows.length > 0) {
            const firstUserId = userRes.rows[0].id;
            await client.query(`UPDATE "Application" SET "userId" = $1 WHERE "userId" IS NULL`, [firstUserId]);
            await client.query(`ALTER TABLE "Application" ALTER COLUMN "userId" SET NOT NULL`);
            console.log(`✓ Application table updated (userIds linked to user ${firstUserId})`);
        } else {
            console.log('⚠️ No users found in User table. Skipping NOT NULL constraint on Application.userId for now.');
        }

        // 4. Create ApplicationUpdate table
        await client.query(`
      CREATE TABLE IF NOT EXISTS "ApplicationUpdate" (
        "id" SERIAL PRIMARY KEY,
        "applicationId" INTEGER NOT NULL,
        "note" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ApplicationUpdate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
        console.log('✓ ApplicationUpdate table created');

        console.log('Database sync completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

sync();
