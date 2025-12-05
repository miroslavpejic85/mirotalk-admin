'use strict';

/**
 * Network Utilities
 * -----------------
 * Provides utility functions for network-related operations,
 * such as retrieving the client IP address from a request.
 *
 * @module utils/networkUtils
 */

/**
 * Get the client IP address from the request.
 * @param {Object} req - Express request object
 * @returns {string} The client IP address.
 */
const getIP = (req) => {
    // Get IP from X-Forwarded-For header (set by nginx/proxy)
    const forwardedFor = req.headers['x-forwarded-for'];

    if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs, get the first one (client IP)
        const clientIp = forwardedFor.split(',')[0].trim();
        return clientIp;
    }
    // Fallback to req.ip (which Express sets based on trust proxy)
    return req.socket.remoteAddress || req.ip;
};

module.exports = { getIP };
