'use strict';

/**
 * Instance Controller
 * -------------------
 * Handles instance-level actions for the admin dashboard,
 * such as retrieving status/version, restarting, and updating the app instance.
 * All actions are logged and errors are returned as JSON.
 */

const instanceService = require('../services/instanceService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('InstanceController');

/**
 * Get the current status of the application instance.
 *
 * @route GET /admin/api/status
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with status info
 * @returns {Object} 500 - JSON error object
 */
const getStatus = async (req, res) => {
    try {
        const result = await instanceService.getStatus();
        logger.info('Status fetched successfully');
        res.json(result);
    } catch (err) {
        logger.error('Status check failed', { error: err });
        res.status(500).json({ error: 'Status check failed', details: err.message });
    }
};

/**
 * Get the current and remote version of the application.
 *
 * @route GET /admin/api/version
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with version info
 * @returns {Object} 500 - JSON error object
 */
const getVersion = async (req, res) => {
    try {
        const result = await instanceService.getVersion();
        logger.info('Version comparison successful');
        res.json(result);
    } catch (error) {
        logger.error('Failed to compare versions', { error });
        res.status(500).json({ error: 'Failed to compare versions', details: error.message });
    }
};

/**
 * Restart the application instance.
 *
 * @route POST /admin/api/restart
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with restart message and output
 * @returns {Object} 500 - JSON error object
 */
const restart = async (req, res) => {
    try {
        const output = await instanceService.restart();
        logger.info('Instance restarted successfully');
        res.json({
            message: 'Instance restarted successfully!',
            output: output.trim(),
        });
    } catch (err) {
        logger.error('Restart error', { error: err.message });
        res.status(500).json({ error: err.message });
    }
};

/**
 * Update the application instance.
 *
 * @route POST /admin/api/update
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with update message and logs
 * @returns {Object} 500 - JSON error object
 */
const update = async (req, res) => {
    try {
        const logs = await instanceService.update();
        logger.info('MiroTalk updated and restarted');
        res.json({ message: 'MiroTalk updated and restarted', logs });
    } catch (err) {
        logger.error('Update error', { error: err.message });
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getStatus, getVersion, restart, update };
