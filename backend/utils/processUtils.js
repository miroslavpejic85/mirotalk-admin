'use strict';

/**
 * Process Utilities
 * -----------------
 * Provides functions to parse process status output for pm2 or docker.
 * Used to extract status, uptime, and timestamps for the admin dashboard.
 *
 * @module utils/processUtils
 */

/**
 * Base interface for process status parsers.
 * @typedef {Object} ProcessStatus
 * @property {string} status
 * @property {string} uptime
 * @property {string} startedAt
 * @property {string} finishedAt
 */

/**
 * PM2 process status parser.
 * @param {string} stdout
 * @returns {ProcessStatus}
 */
function parsePm2Status(stdout) {
    let status = 'unknown';
    let uptime = '00:00:00';
    let startedAt = 'n/a';
    let finishedAt = 'n/a';

    const lines = stdout.split('\n').map((line) => line.trim());
    const getValue = (keyword) => {
        const line = lines.find((line) => line.includes(`│ ${keyword}`));
        if (!line) return null;
        const parts = line.split('│').map((part) => part.trim());
        if (parts.length < 3) return null;
        return parts[2];
    };

    status = getValue('status') || status;
    startedAt = new Date(getValue('created at')).toLocaleString() || startedAt;

    if (startedAt) {
        const startedAtDate = new Date(startedAt);
        if (!isNaN(startedAtDate)) {
            const uptimeMs = Date.now() - startedAtDate.getTime();
            const uptimeDate = new Date(uptimeMs).toISOString();
            uptime = uptimeDate.slice(11, 19);
        }
    }

    finishedAt = startedAt;
    return { status, uptime, startedAt, finishedAt };
}

/**
 * Docker process status parser.
 * @param {string} stdout
 * @returns {ProcessStatus}
 */
function parseDockerStatus(stdout) {
    let status = 'unknown';
    let uptime = '00:00:00';
    let startedAt = 'n/a';
    let finishedAt = 'n/a';

    try {
        const state = JSON.parse(stdout);
        status = state.Status || status;
        startedAt = state.StartedAt ? new Date(state.StartedAt).toLocaleString() : startedAt;
        finishedAt = state.FinishedAt ? new Date(state.FinishedAt).toLocaleString() : startedAt;
        if (state.StartedAt) {
            const uptimeMs = new Date() - new Date(state.StartedAt);
            uptime = new Date(uptimeMs).toISOString().substr(11, 8);
        }
    } catch (e) {
        throw new Error('Failed to parse Docker status output');
    }
    return { status, uptime, startedAt, finishedAt };
}

/**
 * Strategy map for process status parsers.
 */
const statusParsers = {
    pm2: parsePm2Status,
    docker: parseDockerStatus,
};

/**
 * Parse process status output for pm2 or docker.
 * @param {string} mode - The process manager mode ('pm2' or 'docker').
 * @param {string} stdout - The output string from the process status command.
 * @returns {ProcessStatus}
 */
function parseProcessStatus(mode, stdout) {
    const parser = statusParsers[mode];
    if (!parser) throw new Error(`Unsupported process manager mode: ${mode}`);
    return parser(stdout);
}

module.exports = { parseProcessStatus };
