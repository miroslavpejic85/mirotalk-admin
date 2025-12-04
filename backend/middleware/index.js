'use strict';

/**
 * Middleware Index
 * ----------------
 * Aggregates and exports all middleware modules for the admin dashboard backend.
 * This allows for easy and centralized importing of middleware in route definitions.
 *
 * @module middleware
 */

const { loginLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, isSocketValidToken } = require('./auth');
const restrictAllowedIPs = require('./ipRestriction');
const dashboardEnabledAndHttps = require('./dashboardGuard');

module.exports = {
    loginLimiter,
    authenticateToken,
    isSocketValidToken,
    restrictAllowedIPs,
    dashboardEnabledAndHttps,
};
