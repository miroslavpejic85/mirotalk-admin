'use strict';

/**
 * Validation Utilities
 * --------------------
 * Provides input validation and sanitization functions
 * to protect against injection attacks and invalid data.
 *
 * @module utils/validationUtils
 */

/**
 * Validate username input
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        throw new Error('Username is required and must be a string');
    }

    if (username.length < 3 || username.length > 50) {
        throw new Error('Username must be between 3 and 50 characters');
    }

    // Allow alphanumeric, underscore, hyphen, dot
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
        throw new Error('Username contains invalid characters');
    }

    return true;
}

/**
 * Validate password input
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password is required and must be a string');
    }

    if (password.length < 1 || password.length > 100) {
        throw new Error('Password must be between 1 and 100 characters');
    }

    return true;
}

/**
 * Validate app name against allowed list
 * @param {string} appName - Application name to validate
 * @param {Array<string>|string} allowedApps - Array of allowed app names or comma-separated string
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateAppName(appName, allowedApps) {
    if (!appName || typeof appName !== 'string') {
        throw new Error('App name is required and must be a string');
    }

    if (!allowedApps) {
        throw new Error('Allowed apps list is not configured');
    }

    // Convert to array if it's a comma-separated string
    let appList = allowedApps;
    if (typeof allowedApps === 'string') {
        appList = allowedApps.split(',').map((app) => app.trim());
    }

    if (!Array.isArray(appList)) {
        throw new Error('Allowed apps list format is invalid');
    }

    if (!appList.includes(appName)) {
        throw new Error('Invalid app name. Must be one of: ' + appList.join(', '));
    }

    return true;
}

/**
 * Validate file content (config, env files)
 * @param {string} content - File content to validate
 * @param {number} maxSize - Maximum size in bytes (default 100KB)
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateFileContent(content, maxSize = 100000) {
    if (content === undefined || content === null) {
        throw new Error('Content is required');
    }

    if (typeof content !== 'string') {
        throw new Error('Content must be a string');
    }

    const contentSize = Buffer.byteLength(content, 'utf8');
    if (contentSize > maxSize) {
        throw new Error(`Content too large. Maximum size is ${maxSize} bytes`);
    }

    // Check for null bytes (potential injection)
    if (content.includes('\0')) {
        throw new Error('Content contains invalid null bytes');
    }

    return true;
}

module.exports = {
    validateUsername,
    validatePassword,
    validateAppName,
    validateFileContent,
};
