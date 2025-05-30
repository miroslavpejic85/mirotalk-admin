'use strict';

/**
 * Config Service
 * --------------
 * Provides functions to read and write the application configuration file
 * for the admin dashboard. Uses the current app's config path from APP_DEFAULTS.
 *
 * @module services/configService
 */

const config = require('../config');
const { readFile, writeFile } = require('../utils');

/**
 * Get the configuration file content.
 * @returns {Promise<string>} The content of the configuration file.
 * @throws {Error} If the config path is not set.
 */
async function getConfig() {
    if (!config.APP_DEFAULTS.config) {
        throw new Error('Config path not set for current app');
    }
    return await readFile(config.APP_DEFAULTS.config);
}

/**
 * Save the configuration file content.
 * @param {string} content - The new content to write to the configuration file.
 * @returns {Promise<void>}
 * @throws {Error} If the config path is not set.
 */
async function saveConfig(content) {
    if (!config.APP_DEFAULTS.config) {
        throw new Error('Config path not set for current app');
    }
    await writeFile(config.APP_DEFAULTS.config, content);
}

module.exports = { getConfig, saveConfig };
