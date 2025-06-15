'use strict';

/**
 * Version Utilities
 * -----------------
 * Provides functions to compare local and remote package.json versions
 * for the admin dashboard, supporting both local and SSH-managed modes.
 *
 * @module utils/versionUtils
 */

const fs = require('fs');
const { sshReadFile } = require('./sshUtils');
const config = require('../config');

/**
 * Compare local and remote package.json versions.
 * @returns {Promise<Object>} Object with localVersion, remoteVersion, and isUpToDate.
 */

async function compareVersions() {
    let localPackage, localVersion;
    // Read local package.json based on management mode
    const packageJson =
        config.APP_MANAGE_MODE === 'ssh'
            ? await sshReadFile(config.APP_DEFAULTS.packagePath)
            : fs.readFileSync(config.APP_DEFAULTS.packagePath, 'utf8');

    localPackage = JSON.parse(packageJson);
    localVersion = localPackage.version;

    const response = await fetch(config.APP_DEFAULTS.packageUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch remote package.json');
    }
    const remotePackage = await response.json();
    const remoteVersion = remotePackage.version;

    return {
        localVersion,
        remoteVersion,
        isUpToDate: localVersion === remoteVersion,
    };
}

module.exports = { compareVersions };
