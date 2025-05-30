'use strict';

/**
 * Dependency Utilities
 * -------------------
 * Provides functions to check and retrieve system and application dependencies
 * for the admin dashboard. Used to verify required binaries and their versions.
 *
 * @module utils/dependencyUtils
 */

const { execSync } = require('child_process');
const config = require('../config');

const ALL_DEPENDENCIES = [
    { name: 'git', cmd: 'git --version', local: ['git'] },
    { name: 'node', cmd: 'node --version', local: ['node'] },
    { name: 'npm', cmd: 'npm --version', local: ['npm'] },
    {
        name: 'gcc',
        cmd: 'gcc --version | head -n 1',
        local: ['gcc', '--version'],
    },
    {
        name: 'gpp',
        cmd: 'g++ --version | head -n 1',
        local: ['g++', '--version'],
    },
    {
        name: 'make',
        cmd: 'make --version | head -n 1',
        local: ['make', '--version'],
    },
    {
        name: 'python3',
        cmd: 'python3 --version',
        local: ['python3', '--version'],
    },
    { name: 'pip3', cmd: 'pip3 --version', local: ['pip3', '--version'] },
    {
        name: 'ffmpeg',
        cmd: 'ffmpeg -version | head -n 1',
        local: ['ffmpeg', '-version'],
    },
    {
        name: 'certbot',
        cmd: 'certbot --version',
        local: ['certbot', '--version'],
    },
    {
        name: 'nginx',
        cmd: 'nginx -v 2>&1 | grep -o "[0-9.]\\+"',
        local: ['nginx', '-v', (out) => out.replace(/^nginx version: /, '')],
    },
    {
        name: 'apache2',
        cmd: 'apache2 -v 2>&1 | grep "Server version"',
        local: ['apache2', '-v', (out) => out.split('\n')[0]],
    },
    { name: 'docker', cmd: 'docker --version', local: ['docker'] },
    {
        name: 'docker-compose',
        cmd: 'docker-compose --version 2>/dev/null | grep -o "[0-9.]\\+" || docker compose version 2>/dev/null | grep -o "[0-9.]\\+"',
        local: ['docker-compose'],
    },
    { name: 'pm2', cmd: 'pm2 --version', local: ['pm2'] },
];

/**
 * Get app dependencies from config.
 * @returns {Array} Array of dependency objects required by the current app.
 */
function getAppDependencies() {
    return ALL_DEPENDENCIES.filter((dep) => (config.APP_DEFAULTS.dep || []).includes(dep.name));
}

/**
 * Check if a system dependency is installed and get its version.
 * Only works locally.
 * @param {string} cmd - The command to check (e.g., 'node').
 * @param {string} [versionArg='--version'] - The argument to get the version.
 * @param {Function} [parseVersion] - Optional function to parse the version output.
 * @returns {Object} Object with installed (boolean) and version (string|null).
 */
function checkDependency(cmd, versionArg = '--version', parseVersion = (out) => out.split('\n')[0]) {
    try {
        const output = execSync(`${cmd} ${versionArg}`, {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
        return { installed: true, version: parseVersion(output) };
    } catch {
        return { installed: false, version: null };
    }
}

module.exports = { getAppDependencies, checkDependency, ALL_DEPENDENCIES };
