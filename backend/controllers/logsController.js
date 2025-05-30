'use strict';

/**
 * Logs Controller
 * ---------------
 * Handles fetching backend logs for the admin dashboard.
 * All actions are logged and errors are returned as JSON.
 */

const logsService = require('../services/logsService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('LogsController');

/**
 * Get the backend logs.
 *
 * @route GET /admin/api/logs
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with logs
 * @returns {Object} 500 - JSON error object
 */
const getLogs = async (req, res) => {
    try {
        const logs = await logsService.getLogs();
        logger.info('Logs fetched successfully');
        res.json({ logs });
    } catch (err) {
        logger.error('Log fetch failed', { error: err });
        res.status(500).json({ error: 'Log fetch failed', details: err.message });
    }
};

module.exports = { getLogs };
