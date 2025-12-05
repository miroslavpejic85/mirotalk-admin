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

const utils = require('../utils');
const { getIP } = utils;

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

    // Validate that the trust proxy setting is configured correctly
    validate: {
        trustProxy: false, // Disable the trust proxy validation
        xForwardedForHeader: false, // We handle it manually
    },

    // Use the default key generator which properly handles IPv6
    // Just ensure req.ip is set correctly
    keyGenerator: (req, res) => {
        // Get the client IP
        const ip = getIP(req);
        // Return the IP directly - express-rate-limit will handle IPv6 normalization
        return ip;
    },

    // Custom handler for rate limit exceeded
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many login attempts from this IP. Please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },

    // Skip rate limiting for specific IPs (optional)
    skip: (req) => {
        // You can add whitelisted IPs here if needed
        // const whitelistedIPs = ['127.0.0.1', '::1'];
        // const clientIp = getIP(req);
        // return whitelistedIPs.includes(clientIp);
        return false;
    },
});

/**
 * General API rate limiter for all other endpoints.
 * More permissive than login limiter.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,

    validate: {
        trustProxy: false,
        xForwardedForHeader: false,
    },

    keyGenerator: (req, res) => {
        return getIP(req);
    },
});

/**
 * Strict rate limiter for sensitive operations.
 * Very restrictive for actions like password reset, etc.
 */
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: { error: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,

    validate: {
        trustProxy: false,
        xForwardedForHeader: false,
    },

    keyGenerator: (req, res) => {
        return getIP(req);
    },

    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded. Please try again in an hour.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});

module.exports = {
    loginLimiter,
    apiLimiter,
    strictLimiter,
};
