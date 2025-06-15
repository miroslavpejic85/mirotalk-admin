'use strict';

/**
 * Auth Controller
 * --------------
 * Handles authentication for the admin dashboard.
 * Provides login functionality and returns a JWT token on success.
 * All actions are logged and errors are returned as JSON.
 */

const authService = require('../services/authService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('AuthController');

/**
 * Authenticate admin user and return JWT token.
 *
 * @route POST /admin/api/login
 * @param {express.Request} req - Express request object (expects { username, password } in body)
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with JWT token
 * @returns {Object} 403 - JSON error object if authentication fails
 */
const login = (req, res) => {
    const { username, password } = req.body;
    logger.debug('Login attempt', { username: username, password: password });
    try {
        const token = authService.authenticate(username, password);
        logger.info('Login successful', { username });
        return res.json({ token });
    } catch (error) {
        logger.warn('Login error: Invalid credentials', { username });
        res.status(403).json({ error: error.message });
    }
};

module.exports = { login };
