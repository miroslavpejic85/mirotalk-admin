'use strict';

/**
 * Auth Middleware
 * --------------
 * Provides JWT authentication middleware for Express routes and
 * token validation for Socket.IO connections in the admin dashboard.
 * All actions are logged and errors are returned as HTTP or socket responses.
 *
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const utils = require('../utils');
const { getIP, Logs } = utils;
const logger = new Logs('AuthMiddleware');
const { ADMIN_JWT_SECRET } = config;

/**
 * JWT authentication middleware for Express routes.
 *
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authenticateToken(req, res, next) {
    const ip = getIP(req);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        logger.warn('No JWT token provided', { ip, url: req.originalUrl });
        return res.sendStatus(401);
    }
    jwt.verify(token, ADMIN_JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid JWT token', { ip, url: req.originalUrl });
            return res.sendStatus(403);
        }
        req.user = user;
        logger.debug('JWT token authenticated', {
            user: user.username,
            ip,
            url: req.originalUrl,
        });
        next();
    });
}

/**
 * Checks if a JWT token is valid for a Socket.IO connection.
 *
 * @param {string} token - JWT token string
 * @param {import('socket.io').Socket} socket - The socket.io socket instance
 * @param {string} outputEvent - Name of the socket event for output data
 * @param {string} doneEvent - Name of the socket event for completion
 * @returns {boolean} True if token is valid, false otherwise (emits error events)
 */
function isSocketValidToken(token, socket, outputEvent, doneEvent) {
    try {
        jwt.verify(token, ADMIN_JWT_SECRET);
        return true;
    } catch (err) {
        socket.emit(outputEvent, 'Invalid or expired token.\n');
        socket.emit(doneEvent, 1);
        return false;
    }
}

module.exports = { authenticateToken, isSocketValidToken };
