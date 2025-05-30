'use strict';

/**
 * Env Controller
 * -------------
 * Handles reading and saving the environment (.env) file
 * for the admin dashboard. All actions are logged and errors
 * are returned as JSON.
 */

const envService = require('../services/envService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('EnvController');

/**
 * Get the environment file content.
 *
 * @route GET /admin/api/env
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with env file content
 * @returns {Object} 500 - JSON error object
 */
const getEnv = async (req, res) => {
    try {
        const content = await envService.getEnv();
        logger.info('Env file read successfully');
        res.json({ content });
    } catch (err) {
        logger.error('Failed to read .env file', { error: err });
        res.status(500).json({ error: 'Failed to read .env file', details: err.message });
    }
};

/**
 * Save the environment file content.
 *
 * @route POST /admin/api/env
 * @param {express.Request} req - Express request object (expects { content } in body)
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with success message
 * @returns {Object} 500 - JSON error object
 */
const saveEnv = async (req, res) => {
    try {
        await envService.saveEnv(req.body.content);
        logger.info('.env file updated successfully');
        res.json({ message: '.env file updated successfully' });
    } catch (err) {
        logger.error('Failed to write to .env file', { error: err });
        res.status(500).json({ error: 'Failed to write to .env file', details: err.message });
    }
};

module.exports = { getEnv, saveEnv };
