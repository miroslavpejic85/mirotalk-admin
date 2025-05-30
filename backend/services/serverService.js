'use strict';

/**
 * Server Service
 * --------------
 * Provides functions to reboot the server and check for available system updates.
 *
 * @module services/serverService
 */

const utils = require('../utils');
const { getCommand, runCommand } = utils;

/**
 * Reboot the server.
 * @returns {Promise<string>} Output from the reboot command.
 */
async function serverReboot() {
    return await runCommand(getCommand('serverReboot'));
}

/**
 * Check if system updates are available (apt packages).
 * @returns {Promise<Object>} Object with updateAvailable (boolean) and upgradableCount (number).
 */
async function checkForServerUpdate() {
    const cmd = getCommand('checkServerUpdate');
    const output = await runCommand(cmd);
    const upgradableCount = parseInt(output.trim().split('\n').pop(), 10);
    return {
        updateAvailable: upgradableCount > 0,
        upgradableCount,
    };
}

module.exports = { serverReboot, checkForServerUpdate };
