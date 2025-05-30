'use strict';

/**
 * Logs Service
 * ------------
 * Provides a function to fetch backend logs for the admin dashboard.
 *
 * @module services/logsService
 */

const utils = require('../utils');
const { getCommand, runCommand } = utils;

/**
 * Get the backend logs.
 * @returns {Promise<string>} The logs output as a string.
 */
async function getLogs() {
    return await runCommand(getCommand('logs'));
}

module.exports = { getLogs };
