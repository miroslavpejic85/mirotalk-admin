'use strict';

/**
 * Config Service
 * --------------
 * Provides functions to read and write the application configuration file
 * for the admin dashboard. Uses the current app's config path from APP_DEFAULTS.
 *
 * @module services/configService
 */

const path = require('path');
const config = require('../config');
const { readFile, writeFile } = require('../utils');

/**
 * Resolve the template path next to the current config file
 * (e.g. app/src/config.js -> app/src/config.template.js).
 * @returns {string} The template file path.
 * @throws {Error} If the config path is not set.
 */
function getConfigTemplatePath() {
    if (!config.APP_DEFAULTS.config) {
        throw new Error('Config path not set for current app');
    }
    const { dir, name, ext } = path.posix.parse(config.APP_DEFAULTS.config);
    return path.posix.join(dir, `${name}.template${ext}`);
}

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

/**
 * Get the configuration template content shipped with the installed app version.
 * @returns {Promise<string>} The content of the configuration template file.
 * @throws {Error} If the config path is not set or the template cannot be read.
 */
async function getConfigTemplate() {
    return await readFile(getConfigTemplatePath());
}

module.exports = { getConfig, saveConfig, getConfigTemplate };
