// Forced restart for Prisma Client update
const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const importCSV = require('./scripts/import_csv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateJWT, JWT_SECRET } = require('./middleware/authMiddleware');
const app = express();
require("dotenv").config();

// Prisma 7 setup with PostgreSQL adapter
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const port = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
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
        body("companyId").isInt(),
        body("jobRole").notEmpty().trim(),
        body("status").notEmpty().trim(),
        body("dateApplied").isISO8601(),
        body("followUpDate").optional({ checkFalsy: true }).isISO8601(),
        body("notes").optional().trim(),
        body("cvVersion").optional().trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const application = await prisma.application.create({
                data: {
                    company: { connect: { id: req.body.companyId } },
                    user: { connect: { id: req.user.id } },
                    jobRole: req.body.jobRole,
                    status: req.body.status,
                    dateApplied: new Date(req.body.dateApplied),
                    followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : null,
                    notes: req.body.notes,
                    cvVersion: req.body.cvVersion,
                },
            });
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

// LIST All Applications
app.get("/api/applications", authenticateJWT, async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            where: { userId: req.user.id },
            include: { company: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch applications" });
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
            include: { company: true },
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
                jobRole: req.body.jobRole,
                cvVersion: req.body.cvVersion,
            },
        });
        res.json(application);
    } catch (error) {
        res.status(500).json({ error: "Failed to update application" });
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
    console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : err.message,
        timestamp: new Date()
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
