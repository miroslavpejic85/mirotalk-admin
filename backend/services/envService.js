'use strict';

/**
 * Env Service
 * -----------
 * Provides functions to read and write the environment (.env) file
 * for the admin dashboard. Uses the current app's env path from APP_DEFAULTS.
 *
 * @module services/envService
 */

const config = require('../config');
const { readFile, writeFile } = require('../utils');

/**
 * Get the environment file content.
 * @returns {Promise<string>} The content of the environment file.
 * @throws {Error} If the env path is not set.
 */
async function getEnv() {
    if (!config.APP_DEFAULTS.env) {
        throw new Error('Env path not set for current app');
    }
    return await readFile(config.APP_DEFAULTS.env);
}

/**
 * Save the environment file content.
 * @param {string} content - The new content to write to the environment file.
 * @returns {Promise<void>}
 * @throws {Error} If the env path is not set.
 */
async function saveEnv(content) {
    if (!config.APP_DEFAULTS.env) {
        throw new Error('Env path not set for current app');
    }
    await writeFile(config.APP_DEFAULTS.env, content);
}

module.exports = { getEnv, saveEnv };
