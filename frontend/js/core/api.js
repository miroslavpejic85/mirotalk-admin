'use strict';

/**
 * API Utilities
 * -------------
 * Provides functions to make authenticated API requests to the backend,
 * handle session expiration, and expose helpers for all admin dashboard endpoints.
 *
 * @module frontend/js/core/api
 */

/**
 * Make an authenticated API request to the backend.
 * Adds Authorization header if token is set.
 * Handles session expiration and error responses.
 * @param {string} url - The endpoint URL.
 * @param {Object} [options] - Request options.
 * @param {string} [options.method='GET'] - HTTP method.
 * @param {Object|null} [options.body=null] - Request body (will be JSON.stringified).
 * @param {Object} [options.headers={}] - Additional headers.
 * @returns {Promise<Object|string>} - Resolves with the response JSON or text.
 * @throws {Error} - If the response is not ok or session expired.
 */
async function apiRequest(url, { method = 'GET', body = null, headers = {} } = {}) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: 'Bearer ' + token }),
            ...headers,
        },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);

    // Handle token/session expiration
    if (res.status === 403) {
        showToast('Session expired. Please log in again.', 'danger');
        setToken('');
        window.location.reload();
        throw new Error('Token expired');
    }

    if (!res.ok) throw new Error(`${method} ${url} failed: ${res.status} ${res.statusText}`);
    return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

// --- API-specific helpers ---

/**
 * Get the list of available app names.
 * @returns {Promise<Object>} - Resolves with { appNames }
 */
async function apiGetAppNames() {
    return apiRequest('/admin/api/getAppNames');
}

/**
 * Set the current app name.
 * @param {string} appName - The app name to set.
 * @returns {Promise<Object>} - Resolves with the API response.
 */
async function apiSetAppName(appName) {
    return apiRequest('/admin/api/setAppName', {
        method: 'POST',
        body: { appName },
    });
}

/**
 * Get system information.
 * @returns {Promise<Object>} - Resolves with system info.
 */
async function apiGetSystemInfo() {
    return apiRequest('/admin/api/system');
}

/**
 * Get the current status.
 * @returns {Promise<Object>} - Resolves with status info.
 */
async function apiGetStatus() {
    return apiRequest('/admin/api/status');
}

/**
 * Get environment variables.
 * @returns {Promise<Object>} - Resolves with env content.
 */
async function apiGetEnv() {
    return apiRequest('/admin/api/env');
}

/**
 * Save environment variables.
 * @param {string} content - The .env file content.
 * @returns {Promise<Object>} - Resolves with the API response.
 */
async function apiSaveEnv(content) {
    return apiRequest('/admin/api/env', { method: 'POST', body: { content } });
}

/**
 * Get configuration file.
 * @returns {Promise<Object>} - Resolves with config content.
 */
async function apiGetConfig() {
    return apiRequest('/admin/api/config');
}

/**
 * Save configuration file.
 * @param {string} content - The config file content.
 * @returns {Promise<Object>} - Resolves with the API response.
 */
async function apiSaveConfig(content) {
    return apiRequest('/admin/api/config', { method: 'POST', body: { content } });
}

/**
 * Get application logs.
 * @returns {Promise<Object>} - Resolves with logs.
 */
async function apiGetLogs() {
    return apiRequest('/admin/api/logs');
}

/**
 * Get version information.
 * @returns {Promise<Object>} - Resolves with version info.
 */
async function apiGetVersion() {
    return apiRequest('/admin/api/version');
}

/**
 * Restart the application instance.
 * @returns {Promise<Object>} - Resolves with the API response.
 */
async function apiRestartInstance() {
    return apiRequest('/admin/api/restart', { method: 'POST' });
}

/**
 * Check for server update availability.
 * @returns {Promise<Object>} - Resolves with update info.
 */
async function apiCheckForServerUpdate() {
    return apiRequest('/admin/api/checkForServerUpdate');
}

/**
 * Reboot the server.
 * @returns {Promise<Object>} - Resolves with the API response.
 */
async function apiServerReboot() {
    return apiRequest('/admin/api/serverReboot', { method: 'POST' });
}
