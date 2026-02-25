require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const cron = require('node-cron');
const importCSV = require('./scripts/import_csv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateJWT, JWT_SECRET } = require('./middleware/authMiddleware');
const app = express();

// Security Headers
app.use(helmet());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});

// Apply rate limiter to all API routes
app.use("/api/", limiter);

// Prisma 7 setup with PostgreSQL adapter
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const port = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean).map(o => o.replace(/\/$/, ""));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, "");

        // Match specific origins or any Vercel preview domain for this project
        const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
            (normalizedOrigin.startsWith('https://sponsorship-intelligence') &&
                normalizedOrigin.endsWith('.vercel.app'));

        if (isAllowed) {
            callback(null, true);
        } else {
            console.error(`[CORS REJECTED] Origin: ${origin}. Allowed: [${allowedOrigins.join(', ')}]`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Schedule CSV update: 1st of every month at midnight
cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly CSV update...');
    const csvPath = path.join(__dirname, 'UKVI.csv');
    try {
        await importCSV(csvPath);
        console.log('Monthly update successful');
    } catch (error) {
        console.error('Monthly update failed:', error);
    }
});

// confirm the server is running
app.get("/", (req, res) => {
    res.send("Sponsorship Intelligence API Running");
});

// AUTH ROUTES
app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword }
        });
        res.status(201).json({ message: "User registered successfully", userId: user.id });
    } catch (error) {
        console.error("Registration Error:", error);
        if (error.code === 'P2002') return res.status(400).json({ error: "Email already exists" });
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// API Endpoint to get companies with filters
app.get("/api/companies", async (req, res) => {
    const { town, route, rating, page = 1, limit = 50 } = req.query;

    const where = {};
    if (town) where.town = { contains: town, mode: "insensitive" };
    if (route) where.route = { contains: route, mode: "insensitive" };
    if (rating) where.rating = rating;

    try {
        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: { name: "asc" },
            }),
            prisma.company.count({ where }),
        ]);

        res.json({
            companies,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to fetch companies" });
    }
});

const { body, validationResult } = require("express-validator");

// CREATE Application
app.post(
    "/api/applications",
    authenticateJWT,
    [
        body("companyId").optional().isInt(),
        body("isExternalCompany").optional().isBoolean(),
        body("companyData").optional().isObject(),
        body("role").notEmpty().trim(),
        body("status").isIn(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'NO_RESPONSE', 'WITHDRAWN']),
        body("appliedDate").optional().isISO8601(),
        body("followUpDate").optional({ checkFalsy: true }).isISO8601(),
        body("salary").optional().trim(),
        body("externalWebsite").optional().trim(),
        body("notes").optional().trim(),
        body("cvVersion").optional().trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            let companyId = req.body.companyId;

            // Handle External Company Creation
            if (req.body.isExternalCompany && req.body.companyData) {
                const newCompany = await prisma.company.create({
                    data: {
                        name: req.body.companyData.name,
                        town: req.body.companyData.town,
                        industry: req.body.companyData.industry,
                        website: req.body.companyData.website,
                        logoUrl: req.body.companyData.logoUrl,
                        isExternal: true,
                        createdBy: req.user.id
                    }
                });
                companyId = newCompany.id;
            }

            if (!companyId) return res.status(400).json({ error: "Company ID or external company data required" });

            const application = await prisma.application.create({
                data: {
                    company: { connect: { id: companyId } },
                    user: { connect: { id: req.user.id } },
                    role: req.body.role,
                    status: req.body.status || 'APPLIED',
                    appliedDate: req.body.appliedDate ? new Date(req.body.appliedDate) : new Date(),
                    followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : null,
                    salary: req.body.salary,
                    externalWebsite: req.body.externalWebsite,
                    notes: req.body.notes,
                    cvVersion: req.body.cvVersion,
                },
                include: { company: true }
            });

            // Add initial timeline update if notes exist
            if (req.body.notes) {
                await prisma.applicationUpdate.create({
                    data: {
                        applicationId: application.id,
                        note: `Initial Note: ${req.body.notes}`
                    }
                });
            }

            res.status(201).json(application);
        } catch (error) {
            console.error("Create Application Error:", error);
            res.status(500).json({ error: "Failed to create application", details: error.message });
        }
    }
);

// PREDICT Outcome
app.get("/api/predict/:companyId", authenticateJWT, async (req, res) => {
    const companyId = parseInt(req.params.companyId);

    try {
        // 1. Get company details to factoring in its rating
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(404).json({ error: "Company not found" });

        // 2. Get historical platform data (Simple heuristic for demo)
        const allApps = await prisma.application.findMany({
            where: { userId: req.user.id }
        });
        const totalApps = allApps.length;

        // Default probabilities
        let interviewProb = 0.15; // Base 15%
        let offerProb = 0.05;     // Base 5%

        if (totalApps > 0) {
            const interviewedCount = allApps.filter(a => ['Interviewing', 'Offer', 'Rejected'].includes(a.status)).length;
            const offeredCount = allApps.filter(a => a.status === 'Offer').length;

            // Update with real platform data
            interviewProb = interviewedCount / totalApps;
            offerProb = offeredCount / totalApps;
        }

        // 3. Apply Company Meta Weights (Heuristic)
        // A-rated companies might be more selective but also more active
        if (company.rating === 'A') {
            interviewProb *= 1.2;
            offerProb *= 1.1;
        } else if (company.rating === 'B') {
            interviewProb *= 0.8;
            offerProb *= 0.7;
        }

        // Cap values between 0.01 and 0.99
        const clamp = (val) => Math.min(Math.max(val, 0.01), 0.99);

        res.json({
            interviewProbability: parseFloat(clamp(interviewProb).toFixed(2)),
            offerProbability: parseFloat(clamp(offerProb).toFixed(2)),
            sampleSize: totalApps
        });
    } catch (error) {
        console.error("Prediction Error:", error);
        res.status(500).json({ error: "Prediction calculation failed" });
    }
});

// LIST All Applications (User-specific)
app.get("/api/applications", authenticateJWT, async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            where: { userId: req.user.id },
            include: { company: true },
            orderBy: { appliedDate: "desc" },
        });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// GET Upcoming Follow-ups
app.get("/api/applications/followups/upcoming", authenticateJWT, async (req, res) => {
    try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const followups = await prisma.application.findMany({
            where: {
                userId: req.user.id,
                followUpDate: {
                    not: null,
                    lte: sevenDaysFromNow
                },
                followUpCompleted: false
            },
            include: { company: true },
            orderBy: { followUpDate: "asc" }
        });
        res.json(followups);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch follow-ups" });
    }
});

// MAP Endpoint (Optimized for coordinates)
app.get("/api/companies/map", async (req, res) => {
    try {
        const { town, rating } = req.query;
        const where = {};
        if (town) where.town = { contains: town, mode: 'insensitive' };
        if (rating) where.rating = rating;

        // Only return companies that have coordinates
        where.latitude = { not: null };

        const companies = await prisma.company.findMany({
            where,
            select: {
                id: true,
                name: true,
                town: true,
                rating: true,
                latitude: true,
                longitude: true
            },
            take: 5000 // Cap for performance
        });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch map data" });
    }
});

// Helper to bridge the gap: Populate some coordinates for common UK cities
app.post("/api/admin/populate-geo", async (req, res) => {
    const geoMap = {
        'London': { lat: 51.5074, lng: -0.1278 },
        'LONDON': { lat: 51.5074, lng: -0.1278 },
        'Manchester': { lat: 53.4808, lng: -2.2426 },
        'Birmingham': { lat: 52.4862, lng: -1.8904 },
        'Leeds': { lat: 53.8008, lng: -1.5491 },
        'Glasgow': { lat: 55.8642, lng: -4.2518 },
        'Edinburgh': { lat: 55.9533, lng: -3.1883 },
        'Liverpool': { lat: 53.4084, lng: -2.9916 },
        'Bristol': { lat: 51.4545, lng: -2.5879 },
        'Sheffield': { lat: 53.3811, lng: -1.4701 },
        'Belfast': { lat: 54.5973, lng: -5.9301 },
        'Ballymena': { lat: 54.8639, lng: -6.2763 }
    };

    try {
        let updatedCount = 0;
        for (const [town, coords] of Object.entries(geoMap)) {
            const result = await prisma.company.updateMany({
                where: { town: { equals: town, mode: 'insensitive' }, latitude: null },
                data: { latitude: coords.lat, longitude: coords.lng }
            });
            updatedCount += result.count;
        }
        res.json({ message: `Populated ${updatedCount} companies with geo data.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET One Application
app.get("/api/applications/:id", authenticateJWT, async (req, res) => {
    try {
        const application = await prisma.application.findFirst({
            where: {
                id: parseInt(req.params.id),
                userId: req.user.id
            },
            include: {
                company: true,
                updates: { orderBy: { createdAt: 'desc' } }
            },
        });
        if (!application) return res.status(404).json({ error: "Application not found" });
        res.json(application);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch application" });
    }
});

// UPDATE Application
app.put("/api/applications/:id", authenticateJWT, async (req, res) => {
    try {
        // First check ownership
        const existing = await prisma.application.findFirst({
            where: { id: parseInt(req.params.id), userId: req.user.id }
        });
        if (!existing) return res.status(403).json({ error: "Unauthorized or not found" });

        const application = await prisma.application.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status: req.body.status,
                notes: req.body.notes,
                followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined,
                followUpCompleted: req.body.followUpCompleted,
                role: req.body.role,
                salary: req.body.salary,
                cvVersion: req.body.cvVersion,
            },
        });

        // Add to timeline if status changed
        if (req.body.status && req.body.status !== existing.status) {
            await prisma.applicationUpdate.create({
                data: {
                    applicationId: application.id,
                    note: `Status updated to ${req.body.status}`
                }
            });
        }

        res.json(application);
    } catch (error) {
        res.status(500).json({ error: "Failed to update application" });
    }
});

// ADD Timeline Update
app.post("/api/applications/:id/updates", authenticateJWT, async (req, res) => {
    try {
        const { note } = req.body;
        if (!note) return res.status(400).json({ error: "Note is required" });

        const appId = parseInt(req.params.id);
        const application = await prisma.application.findFirst({
            where: { id: appId, userId: req.user.id }
        });
        if (!application) return res.status(404).json({ error: "Application not found" });

        const update = await prisma.applicationUpdate.create({
            data: {
                applicationId: appId,
                note
            }
        });
        res.status(201).json(update);
    } catch (error) {
        res.status(500).json({ error: "Failed to add update" });
    }
});

// GET Timeline Updates
app.get("/api/applications/:id/updates", authenticateJWT, async (req, res) => {
    try {
        const appId = parseInt(req.params.id);
        const updates = await prisma.applicationUpdate.findMany({
            where: {
                applicationId: appId,
                application: { userId: req.user.id }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(updates);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch updates" });
    }
});

// DELETE Application
app.delete("/api/applications/:id", authenticateJWT, async (req, res) => {
    try {
        // Check ownership
        const existing = await prisma.application.findFirst({
            where: { id: parseInt(req.params.id), userId: req.user.id }
        });
        if (!existing) return res.status(403).json({ error: "Unauthorized or not found" });

        await prisma.application.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ message: "Application deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete application" });
    }
});

// Health check and root
app.get("/", (req, res) => {
    res.json({ status: "Sponsorship Intelligence API Running", timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    // Log the full error on the server
    console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);

    const statusCode = err.status || 500;

    // Customize response based on error type if needed
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database constraint violation',
            timestamp: new Date()
        });
    }

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : err.message,
        timestamp: new Date()
    });
});

app.listen(port, async () => {
    console.log(`🚀 Server running on port ${port}`);

    // Initial Data Seed Check
    try {
        const count = await prisma.company.count();
        if (count === 0) {
            console.log('🌱 Database is empty. Starting initial seed in background...');
            const csvPath = path.join(__dirname, 'UKVI.csv');
            // Run in background so we don't block server readiness
            importCSV(csvPath).catch(err => {
                console.error('❌ Background seeding failed:', err);
            });
        } else {
            console.log(`📊 Database already contains ${count} companies.`);
        }
    } catch (err) {
        console.error('⚠️ Could not check database status:', err.message);
    }
});
