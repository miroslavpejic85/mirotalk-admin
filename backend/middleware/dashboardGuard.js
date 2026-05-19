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
const { ADMIN_DASHBOARD_ENABLED, NODE_ENV } = config;

const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Middleware to check if the dashboard is enabled and, in production, to
 * enforce HTTPS. Because the server is started with httpolyglot (the same
 * port accepts both plaintext HTTP and TLS), an on-path attacker could
 * otherwise intercept the admin login and steal the JWT in cleartext.
 *
 * In production, any plaintext-HTTP request is rejected. GET/HEAD requests
 * are 301-redirected to the equivalent https:// URL so an operator who
 * typed http:// (or followed a bad link) still lands on the secure
 * endpoint; all other methods are refused with 403 to avoid silently
 * "fixing up" requests whose body has already been sent in cleartext.
 *
 * In non-production environments the check is a warning-only no-op so
 * local development against the self-signed cert is not disrupted.
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
    // `req.secure` is true when the request arrived over TLS directly, or
    // (when `trust proxy` is set) when a trusted upstream proxy set
    // X-Forwarded-Proto=https. Both cases are acceptable.
    if (!req.secure) {
        if (IS_PRODUCTION) {
            const host = req.headers.host;
            const safeUrl = { url: req.originalUrl, ip: req.ip };
            if ((req.method === 'GET' || req.method === 'HEAD') && host) {
                logger.warn('Redirecting plaintext HTTP request to HTTPS', safeUrl);
                return res.redirect(301, `https://${host}${req.originalUrl}`);
            }
            logger.warn('Rejecting plaintext HTTP request', { ...safeUrl, method: req.method });
            return res.status(403).json({ error: 'HTTPS required' });
        }
        logger.warn('Plaintext HTTP request accepted (non-production)', { url: req.originalUrl });
    }
    next();
};

module.exports = dashboardEnabledAndHttps;
