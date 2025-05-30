'use strict';

/**
 * Server Controller
 * -----------------
 * Handles server-level actions for the admin dashboard,
 * such as rebooting the server and checking for system updates.
 * All actions are logged and errors are returned as JSON.
 */

const serverService = require('../services/serverService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('ServerController');

/**
 * Reboot the server via API.
 *
 * @route POST /admin/api/serverReboot
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with reboot message and output
 * @returns {Object} 500 - JSON error object
 */
const serverReboot = async (req, res) => {
    try {
        const output = await serverService.serverReboot();
        logger.info('Server rebooted successfully');
        res.json({
            message: 'Server rebooted successfully!',
            output: output.trim(),
        });
    } catch (err) {
        logger.error('Reboot error', { error: err.message });
        res.status(500).json({ error: err.message });
    }
};

/**
 * Check if system updates are available (apt packages).
 *
 * @route GET /admin/api/checkForServerUpdate
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with update status/info
 * @returns {Object} 500 - JSON error object
 */
const checkForServerUpdate = async (req, res) => {
    try {
        const result = await serverService.checkForServerUpdate();
        res.json(result);
    } catch (error) {
        logger.error('Failed to check for system update', { error });
        res.status(500).json({
            error: 'Failed to check for system update',
            details: error.message,
        });
    }
};

module.exports = { serverReboot, checkForServerUpdate };
