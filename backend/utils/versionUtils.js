'use strict';

/**
 * Version Utilities
 * -----------------
 * Provides functions to compare local and remote package.json versions
 * for the admin dashboard, supporting both local and SSH-managed modes.
 *
 * @module utils/versionUtils
 */

const { sshReadFile } = require('./sshUtils');
const config = require('../config');

/**
 * Compare local and remote package.json versions.
 * @returns {Promise<Object>} Object with localVersion, remoteVersion, and isUpToDate.
 */
async function compareVersions() {
    let localPackage, localVersion;

    const packageJson = await sshReadFile(config.APP_DEFAULTS.packagePath);
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
