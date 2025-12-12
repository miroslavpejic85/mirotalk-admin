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
    // Try to match the Ubuntu MOTD message (e.g., '27 updates can be applied immediately.')
    const motdMatch = output.match(/(\d+) updates can be applied immediately/);
    if (motdMatch) {
        const upgradableCount = parseInt(motdMatch[1], 10);
        return {
            updateAvailable: upgradableCount > 0,
            upgradableCount,
        };
    }
    // Fallback: Find the line with the apt-get upgrade summary
    const match = output.match(
        /(\d+)\s+upgraded,.*?(\d+)\s+newly installed,.*?(\d+)\s+to remove,.*?(\d+)\s+not upgraded\./
    );
    const upgradableCount = match ? parseInt(match[1], 10) : 0;
    return {
        updateAvailable: upgradableCount > 0,
        upgradableCount,
    };
}

module.exports = { serverReboot, checkForServerUpdate };
