'use strict';

/**
 * Rate Limiter Middleware
 * -----------------------
 * Provides rate limiting for sensitive endpoints (e.g., login) to prevent brute-force attacks.
 * Limits repeated login attempts from the same IP address.
 *
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware for login endpoint.
 * Limits repeated login attempts to prevent brute-force attacks.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;
