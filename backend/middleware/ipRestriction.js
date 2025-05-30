'use strict';

/**
 * IP Restriction Middleware
 * ------------------------
 * Middleware to restrict access to allowed IP addresses for the admin dashboard.
 * If ADMIN_ALLOWED_IPS is empty, all IPs are allowed.
 * Logs all access attempts and denies requests from unauthorized IPs.
 *
 * @module middleware/ipRestriction
 */

const config = require('../config');
const utils = require('../utils');
const { getIP, Logs } = utils;
const { ADMIN_ALLOWED_IPS } = config;
const logger = new Logs('IPRestrictionMiddleware');

/**
 * Middleware to restrict access to allowed IP addresses.
 *
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const restrictAllowedIPs = (req, res, next) => {
    if (ADMIN_ALLOWED_IPS.length === 0) return next();
    const ip = getIP(req);
    if (!ip) {
        logger.warn('IP not found', { url: req.originalUrl });
        return res.status(403).json({ error: 'Access denied' });
    }
    if (!ADMIN_ALLOWED_IPS.includes('*') && !ADMIN_ALLOWED_IPS.includes(ip)) {
        logger.warn('IP not allowed', { ip, url: req.originalUrl });
        return res.status(403).json({ error: 'Access denied' });
    }
    logger.debug('IP allowed', { ip, url: req.originalUrl });
    next();
};

module.exports = restrictAllowedIPs;
