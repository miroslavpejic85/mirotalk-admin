'use strict';

/**
 * Command Utilities
 * -----------------
 * Provides functions to generate and execute shell commands for managing
 * the backend application instance, supporting both PM2 and Docker modes.
 * Also provides generic commands for server updates and reboots.
 *
 * @module utils/commandUtils
 */

const { execSync } = require('child_process');
const { sshExec } = require('./sshUtils');
const config = require('../config');
const { APP_MANAGE_MODE, SSH_MANAGE_MODE } = config;

const LOGS_CHUNK_SIZE = 1000;
const REALTIME_LOGS_CHUNK_SIZE = 300;

const pm2Commands = {
    restart: (cfg) => `pm2 restart ${cfg.APP_NAME}`,
    logs: (cfg) => `pm2 logs ${cfg.APP_NAME} --lines ${LOGS_CHUNK_SIZE} --nostream`,
    realTimeLogs: (cfg) => `pm2 logs ${cfg.APP_NAME} --lines ${REALTIME_LOGS_CHUNK_SIZE}`,
    status: (cfg) => `pm2 show ${cfg.APP_NAME}`,
    update: (cfg) => [`cd ${cfg.APP_DEFAULTS.dir}`, 'git pull', 'npm ci', `pm2 restart ${cfg.APP_NAME}`].join(' && '),
};

const dockerCommands = {
    restart: (cfg) => `docker restart ${cfg.APP_NAME}`,
    logs: (cfg) => `docker logs --tail ${LOGS_CHUNK_SIZE} ${cfg.APP_NAME}`,
    realTimeLogs: (cfg) => `docker logs -f --tail ${REALTIME_LOGS_CHUNK_SIZE} ${cfg.APP_NAME}`,
    status: (cfg) => `docker inspect ${cfg.APP_NAME} --format "{{json .State}}"`,
    update: (cfg) =>
        [
            `cd ${cfg.APP_DEFAULTS.dir}`,
            'git pull',
            'docker-compose down',
            'docker-compose pull',
            'docker image prune -f',
            'docker-compose up -d',
        ].join(' && '),
};

const genericCommands = {
    checkServerUpdate: () =>
        [
            'sudo apt-get update -y',
            'apt-get -s upgrade | grep -E "^\\d+ upgraded" || echo "0 upgraded, 0 newly installed, 0 to remove, 0 not upgraded."',
        ].join(' && '),
    serverUpdate: () =>
        ['sudo apt-get update -y', 'sudo apt-get upgrade -y', 'sudo apt-get dist-upgrade -y', 'lsb_release -a'].join(
            ' && '
        ),
    serverReboot: () => 'sudo shutdown -r now || exit $?',
};

/**
 * Get the appropriate shell command for a given action type and management mode.
 * @param {string} type - The command type (e.g., 'restart', 'logs', 'update').
 * @param {string} [modeOverride] - Optional override for management mode.
 * @returns {string} The shell command string.
 */
function getCommand(type, modeOverride) {
    const mode = modeOverride || (APP_MANAGE_MODE === 'ssh' ? SSH_MANAGE_MODE : APP_MANAGE_MODE);
    if (genericCommands[type]) return genericCommands[type](config);
    if (mode === 'pm2' && pm2Commands[type]) return pm2Commands[type](config);
    if (mode === 'docker' && dockerCommands[type]) return dockerCommands[type](config);
    return '';
}

/**
 * Run a shell command locally or via SSH depending on mode.
 * @param {string} command - The shell command to execute.
 * @returns {Promise<string>} Resolves with command output.
 */
function runCommand(command) {
    if (APP_MANAGE_MODE === 'ssh') {
        return sshExec(command);
    }
    return Promise.resolve(execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString());
}

module.exports = { getCommand, runCommand };
