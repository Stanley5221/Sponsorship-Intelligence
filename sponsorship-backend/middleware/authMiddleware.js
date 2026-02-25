const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV;

if (!JWT_SECRET && NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: JWT_SECRET is missing in production environment!');
}

const SECRET = JWT_SECRET || 'dev-secret-key-only';

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Token is invalid or expired' });
            }

            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Authorization header is missing' });
    }
};

module.exports = { authenticateJWT, JWT_SECRET: SECRET };
