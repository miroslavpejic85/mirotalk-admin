'use strict';

/**
 * File Utilities
 * --------------
 * Provides functions to read and write files either locally or via SSH,
 * depending on the current management mode. Used for configuration and
 * environment file operations in the admin dashboard.
 *
 * @module utils/fileUtils
 */

const fs = require('fs');
const { sshReadFile, sshWriteFile } = require('./sshUtils');
const config = require('../config');
const { APP_MANAGE_MODE } = config;

/**
 * Read a file locally or via SSH depending on mode.
 * @param {string} path - The file path to read.
 * @returns {Promise<string>} The file content as a string.
 */
function readFile(path) {
    if (APP_MANAGE_MODE === 'ssh') {
        return sshReadFile(path);
    }
    return Promise.resolve(fs.readFileSync(path, 'utf8'));
}

/**
 * Write a file locally or via SSH depending on mode.
 * @param {string} path - The file path to write.
 * @param {string} content - The content to write to the file.
 * @returns {Promise<void>}
 */
function writeFile(path, content) {
    if (APP_MANAGE_MODE === 'ssh') {
        return sshWriteFile(path, content);
    }
    return Promise.resolve(fs.writeFileSync(path, content, 'utf8'));
}

module.exports = { readFile, writeFile };
