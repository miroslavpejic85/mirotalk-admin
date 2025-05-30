'use strict';

/**
 * Instance Service
 * ----------------
 * Provides functions to get status, compare versions, restart, and update
 * the backend application instance for the admin dashboard.
 *
 * @module services/instanceService
 */

const config = require('../config');
const utils = require('../utils');
const { getCommand, parseProcessStatus, compareVersions, runCommand } = utils;
const { APP_MANAGE_MODE, SSH_MANAGE_MODE } = config;

/**
 * Get the current status of the backend instance.
 * @returns {Promise<Object>} Status information for the instance.
 */
async function getStatus() {
    const stdout = await runCommand(getCommand('status'));
    const mode = APP_MANAGE_MODE === 'ssh' ? SSH_MANAGE_MODE : APP_MANAGE_MODE;
    return parseProcessStatus(mode, stdout);
}

/**
 * Compare local and remote versions and return version info.
 * @returns {Promise<Object>} Version comparison information.
 */
async function getVersion() {
    return await compareVersions();
}

/**
 * Restart the backend instance.
 * @returns {Promise<string>} Output from the restart command.
 */
async function restart() {
    return await runCommand(getCommand('restart'));
}

/**
 * Update the backend instance and restart.
 * @returns {Promise<string>} Output from the update command.
 */
async function update() {
    return await runCommand(getCommand('update'));
}

module.exports = { getStatus, getVersion, restart, update };
