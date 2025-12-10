'use strict';

/**
 * Config Controller
 * -----------------
 * Handles reading and saving the application configuration file
 * for the admin dashboard. All actions are logged and errors
 * are returned as JSON.
 */

const configService = require('../services/configService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('ConfigController');

/**
 * Get the configuration file content.
 *
 * @route GET /admin/api/config
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with config content
 * @returns {Object} 500 - JSON error object
 */
const getConfig = async (req, res) => {
    try {
        const content = await configService.getConfig();
        logger.info('Config read successfully');
        res.json({ content });
    } catch (err) {
        logger.error('Config read failed', { error: err });
        res.status(500).json({ error: 'Config read failed', details: err.message });
    }
};

/**
 * Save the configuration file content.
 *
 * @route POST /admin/api/config
 * @param {express.Request} req - Express request object (expects { content } in body)
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with success message
 * @returns {Object} 500 - JSON error object
 */
const saveConfig = async (req, res) => {
    try {
        const { content } = req.body;

        // Validate content
        utils.validateFileContent(content);

        await configService.saveConfig(content);
        logger.info('Config saved');
        res.json({ message: 'Config saved' });
    } catch (err) {
        logger.error('Write failed', { error: err });
        res.status(500).json({ error: 'Write failed', details: err.message });
    }
};

module.exports = { getConfig, saveConfig };
