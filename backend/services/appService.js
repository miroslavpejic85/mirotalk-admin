'use strict';

/**
 * App Service
 * -----------
 * Provides functions to get available app names and set the active app
 * for the admin dashboard. Updates configuration accordingly.
 *
 * @module services/appService
 */

const config = require('../config');

/**
 * Get the list of available application names.
 * @returns {string[]|string} Array of app names or a single app name string.
 */
function getAppNames() {
    return config.APP_NAMES || 'mirotalksfu';
}

/**
 * Set the current application name and update defaults.
 * @param {string} appName - The name of the app to set as active.
 * @returns {Object} The new app defaults.
 * @throws {Error} If the app name is invalid.
 */
function setAppName(appName) {
    const { APP_CONFIG } = config;
    if (!APP_CONFIG[appName]) {
        const err = new Error('Invalid app name');
        err.status = 400;
        throw err;
    }
    config.APP_NAME = appName;
    config.APP_DEFAULTS = APP_CONFIG[appName];
    return config.APP_DEFAULTS;
}

module.exports = { getAppNames, setAppName };
