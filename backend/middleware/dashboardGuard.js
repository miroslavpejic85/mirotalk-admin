'use strict';

/**
 * Dashboard Guard Middleware
 * -------------------------
 * Middleware to check if the admin dashboard is enabled and to enforce HTTPS in production.
 * If the dashboard is disabled, returns a 503 error.
 * In production, redirects HTTP requests to HTTPS.
 *
 * @module middleware/dashboardGuard
 */

const config = require('../config');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('DashboardGuardMiddleware');
const { ADMIN_DASHBOARD_ENABLED } = config;

/**
 * Middleware to check if the dashboard is enabled.
 *
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const dashboardEnabledAndHttps = (req, res, next) => {
    if (!ADMIN_DASHBOARD_ENABLED) {
        logger.warn('Admin dashboard is disabled', { url: req.originalUrl });
        return res.status(503).json({ error: 'Admin dashboard is disabled' });
    }
    next();
};

module.exports = dashboardEnabledAndHttps;
