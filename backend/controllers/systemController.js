'use strict';

/**
 * System Controller
 * -----------------
 * Handles fetching system information for the admin dashboard.
 * All actions are logged and errors are returned as JSON.
 */

const systemService = require('../services/systemService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('SystemController');

/**
 * Get system information.
 *
 * @route GET /admin/api/system
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with system information
 * @returns {Object} 500 - JSON error object
 */
const getSystem = async (req, res) => {
    try {
        logger.debug('Fetching system info');
        const systemInfo = await systemService.getSystem();
        logger.info('System info fetched successfully');
        res.json(systemInfo);
    } catch (err) {
        logger.error('Failed to fetch system info', { error: err });
        res.status(500).json({ error: 'Failed to fetch system info', details: err.message });
    }
};

module.exports = { getSystem };
