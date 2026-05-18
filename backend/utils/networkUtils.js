'use strict';

/**
 * Network Utilities
 * -----------------
 * Provides utility functions for network-related operations,
 * such as retrieving the client IP address from a request.
 *
 * @module utils/networkUtils
 */

const config = require('../config');
const { TRUST_PROXY } = config;

/**
 * Get the client IP address from the request.
 *
 * Security: The X-Forwarded-For header is client-controlled and MUST NOT be
 * trusted unless the application is deployed behind a trusted reverse proxy.
 * When TRUST_PROXY is enabled, Express has already validated XFF against the
 * configured `trust proxy` setting and populated `req.ip` accordingly; we
 * rely on that value. Otherwise we use the transport-layer source address
 * and ignore any forwarding headers, which prevents header-spoofing attacks
 * against the IP allow-list and the login rate-limiter.
 *
 * @param {Object} req - Express request object
 * @returns {string} The client IP address.
 */
const getIP = (req) => {
    if (TRUST_PROXY === true) {
        // Express-handled requests already have a validated req.ip.
        if (req.ip) return req.ip;
        // Raw IncomingMessage (e.g. Socket.IO handshake) — Express middleware
        // did not run, so honor X-Forwarded-For only because the operator has
        // explicitly opted in via TRUST_PROXY and is responsible for ensuring
        // a real proxy terminates the connection in front of the admin port.
        const xff = req.headers && req.headers['x-forwarded-for'];
        if (xff) {
            const first = String(xff).split(',')[0].trim();
            if (first) return first;
        }
    }
    return (req.socket && req.socket.remoteAddress) || req.connection?.remoteAddress || '';
};

/**
 * Get the domain from the request.
 * @param {Object} req
 * @returns {string} The domain of the request.
 */
const getDomain = (req) => {
    return req.hostname || req.headers.host;
};

module.exports = { getIP, getDomain };
