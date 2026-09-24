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
const INSTALLATION_SCRIPT_BASE_URL = 'https://docs.mirotalk.com/scripts';
const INSTALLATION_PRODUCTS = new Set(['sfu', 'p2p', 'c2c', 'bro', 'web', 'cme', 'coturn', 'whisper']);
const INSTALLATION_ACTIONS = new Set(['install', 'update', 'uninstall']);
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const USERNAME_PATTERN = /^[a-z0-9_.-]{1,64}$/i;
const WHISPER_PROFILES = new Set(['cpu', 'gpu']);
const WHISPER_MODELS = new Set(['tiny', 'base', 'small', 'medium', 'large-v3']);

function shellQuote(value) {
    return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function getInstallationMarkers() {
    return {
        sfu: config.APP_CONFIG.mirotalksfu.packagePath,
        p2p: config.APP_CONFIG.mirotalk.packagePath,
        c2c: config.APP_CONFIG.mirotalkc2c.packagePath,
        bro: config.APP_CONFIG.mirotalkbro.packagePath,
        web: config.APP_CONFIG.mirotalkwebrtc.packagePath,
        cme: config.APP_CONFIG.callme.packagePath,
        coturn: config.SERVICE_CONFIG.coturn.markerPath,
        whisper: config.SERVICE_CONFIG.whisper.markerPath,
    };
}

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
            'updates_msg=$(grep -m1 "updates can be applied immediately" /var/run/motd.dynamic 2>/dev/null || true)',
            `if [ -n "$updates_msg" ]; then
    echo "$updates_msg"
    echo "$updates_msg" | grep -oE "^\\d+" || true
else
    apt-get -s upgrade | grep -E "^\\d+ upgraded" || echo "0 upgraded, 0 newly installed, 0 to remove, 0 not upgraded."
fi`,
        ].join(' ; '),
    serverUpdate: () =>
        ['sudo apt-get update -y', 'sudo apt-get upgrade -y', 'sudo apt-get dist-upgrade -y', 'lsb_release -a'].join(
            ' && '
        ),
    serverReboot: () => 'sudo shutdown -r now || exit $?',
};

/**
 * Build a command for an approved MiroTalk installation script.
 * @param {string} product - Supported product identifier.
 * @param {string} action - install, update, or uninstall.
 * @returns {string} A shell command containing only validated values.
 */
function getInstallationCommand(product, action) {
    const normalizedProduct = String(product).toLowerCase();
    const normalizedAction = String(action).toLowerCase();

    if (!INSTALLATION_PRODUCTS.has(normalizedProduct)) throw new Error('Unsupported installation product');
    if (!INSTALLATION_ACTIONS.has(normalizedAction)) throw new Error('Unsupported installation action');

    const scriptName = `${normalizedProduct}-${normalizedAction}.sh`;
    const scriptUrl = `${INSTALLATION_SCRIPT_BASE_URL}/${normalizedProduct}/${scriptName}`;

    return [
        `[ "$(id -u)" -eq 0 ] || { echo 'Installation operations require root access.' >&2; exit 1; }`,
        'tmp_script=$(mktemp)',
        `trap 'rm -f "$tmp_script"' EXIT`,
        `curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 '${scriptUrl}' --output "$tmp_script"`,
        'chmod 700 "$tmp_script"',
        '"$tmp_script"',
    ].join(' && ');
}

function validateLine(value, label, { required = true, maxLength = 256 } = {}) {
    const normalized = String(value ?? '').trim();
    if (required && !normalized) throw new Error(`${label} is required`);
    if (normalized.length > maxLength || /[\r\n\0]/.test(normalized)) throw new Error(`${label} is invalid`);
    return normalized;
}

/**
 * Validate and serialize answers for an approved installation script.
 * @param {string} product - Supported product identifier.
 * @param {string} action - install, update, or uninstall.
 * @param {Object} [answers] - Product-specific installer answers.
 * @returns {string} Newline-delimited answers written directly to process stdin.
 */
function getInstallationInput(product, action, answers = {}) {
    const normalizedProduct = String(product).toLowerCase();
    const normalizedAction = String(action).toLowerCase();
    if (!INSTALLATION_PRODUCTS.has(normalizedProduct)) throw new Error('Unsupported installation product');
    if (!INSTALLATION_ACTIONS.has(normalizedAction)) throw new Error('Unsupported installation action');
    if (normalizedAction !== 'install') return '';

    const domain = validateLine(answers.domain, 'Domain').toLowerCase();
    if (!DOMAIN_PATTERN.test(domain)) throw new Error('A valid domain is required for installation');

    const values = [domain];
    if (normalizedProduct === 'coturn') {
        const username = validateLine(answers.username, 'Coturn username', { maxLength: 64 });
        if (!USERNAME_PATTERN.test(username)) throw new Error('Coturn username is invalid');
        const password = validateLine(answers.password, 'Coturn password', { maxLength: 128 });
        if (
            password.length < 12 ||
            !/[a-z]/.test(password) ||
            !/[A-Z]/.test(password) ||
            !/\d/.test(password) ||
            !/[^a-zA-Z0-9]/.test(password)
        ) {
            throw new Error('Coturn password must be at least 12 characters with upper, lower, number, and symbol');
        }
        values.push(username, password);
    }

    if (normalizedProduct === 'whisper') {
        const apiKey = validateLine(answers.apiKey, 'Whisper API key', { required: false });
        const profile = validateLine(answers.profile || 'cpu', 'Whisper profile').toLowerCase();
        const modelSize = validateLine(answers.modelSize || 'small', 'Whisper model').toLowerCase();
        if (!WHISPER_PROFILES.has(profile)) throw new Error('Whisper profile must be cpu or gpu');
        if (!WHISPER_MODELS.has(modelSize)) throw new Error('Unsupported Whisper model');
        values.push(apiKey, profile, modelSize);
    }

    return `${values.join('\n')}\n`;
}

/**
 * Build a read-only command that checks an approved installation marker.
 * @param {string} product - Supported product identifier.
 * @returns {string} A shell command that prints installed or not-installed.
 */
function getInstallationStatusCommand(product) {
    const normalizedProduct = String(product).toLowerCase();
    if (!INSTALLATION_PRODUCTS.has(normalizedProduct)) throw new Error('Unsupported installation product');

    const marker = shellQuote(getInstallationMarkers()[normalizedProduct]);
    return `[ -f ${marker} ] && printf 'installed' || printf 'not-installed'`;
}

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

module.exports = {
    getCommand,
    getInstallationCommand,
    getInstallationInput,
    getInstallationStatusCommand,
    runCommand,
};
