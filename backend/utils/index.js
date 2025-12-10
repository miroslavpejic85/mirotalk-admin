'use strict';

/**
 * Utils Index
 * -----------
 * Aggregates and exports all utility modules for the admin dashboard backend.
 * This allows for easy and centralized importing of utilities in services, controllers, and middleware.
 *
 * @module utils
 */

const { readFile, writeFile } = require('./fileUtils');
const { getCommand, runCommand } = require('./commandUtils');
const { getAppDependencies, checkDependency, ALL_DEPENDENCIES } = require('./dependencyUtils');
const { getSystemInfo } = require('./systemInfoUtils');
const { getIP } = require('./networkUtils');
const { sshExec, sshExecStream, sshReadFile, sshWriteFile, getSSHConfig, Client } = require('./sshUtils');
const { parseProcessStatus } = require('./processUtils');
const { compareVersions } = require('./versionUtils');
const Logs = require('./logsUtils');
const { validateUsername, validatePassword, validateAppName, validateFileContent } = require('./validationUtils');
const { getCorsOptions } = require('./corsUtilis');

module.exports = {
    getCommand,
    runCommand,
    readFile,
    writeFile,
    getSSHConfig,
    sshExec,
    sshExecStream,
    sshReadFile,
    sshWriteFile,
    parseProcessStatus,
    compareVersions,
    getSystemInfo,
    getIP,
    Client,
    Logs,
    getAppDependencies,
    checkDependency,
    ALL_DEPENDENCIES,
    validateUsername,
    validatePassword,
    validateAppName,
    validateFileContent,
    getCorsOptions,
};
