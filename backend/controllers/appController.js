'use strict';

/**
 * App Controller
 * --------------
 * Handles application-level actions for the admin dashboard,
 * such as retrieving available app names and setting the active app.
 * All actions are logged and errors are returned as JSON.
 */

const appService = require('../services/appService');
const utils = require('../utils');
const Logs = utils.Logs;
const logger = new Logs('AppController');

/**
 * Get the list of available application names.
 *
 * @route GET /admin/api/getAppNames
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with appNames array
 * @returns {Object} 500 - JSON error object
 */
const getAppNames = (req, res) => {
    try {
        const appNames = appService.getAppNames();
        logger.info('Getting app names:', { appNames });
        res.json({ appNames });
    } catch (error) {
        logger.error('Failed to get app names', { error });
        res.status(500).json({ error: 'Failed to get app names', details: error.message });
    }
};

/**
 * Set the current application name.
 *
 * @route POST /admin/api/setAppName
 * @param {express.Request} req - Express request object (expects { appName } in body)
 * @param {express.Response} res - Express response object
 * @returns {Object} 200 - JSON object with success and appName
 * @returns {Object} 500 - JSON error object
 */
const setAppName = (req, res) => {
    try {
        const { appName } = req.body;

        // Validate app name against allowed list
        const allowedApps = appService.getAppNames();
        utils.validateAppName(appName, allowedApps);

        const appNameSettings = appService.setAppName(appName);
        logger.info('Setting app name:', { appNameSettings });
        res.json({ success: true, appName });
    } catch (error) {
        logger.error('Failed to set app name', { error });
        res.status(500).json({ error: 'Failed to set app name', details: error.message });
    }
};

module.exports = { getAppNames, setAppName };
