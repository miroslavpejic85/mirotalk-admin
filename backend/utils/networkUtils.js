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
function getIP(req) {
    return req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'] || req.socket.remoteAddress || req.ip;
}

module.exports = { getIP };
