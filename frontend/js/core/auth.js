'use strict';

/**
 * Stores the current JWT token for API requests.
 * @type {string}
 */
let token = '';

/**
 * Set the JWT token to be used in subsequent API requests.
 * Also saves the token in sessionStorage.
 * @param {string} newToken - The JWT token string.
 */
function setToken(newToken) {
    token = newToken;
    sessionStorage.setItem('mirotalk_admin_token', token);
}

/**
 * Retrieve the JWT token from sessionStorage.
 * @returns {string} The JWT token string, or empty string if not set.
 */
function getToken() {
    return sessionStorage.getItem('mirotalk_admin_token') || '';
}

/**
 * Handle user login: authenticate, store token, and load app.
 */
async function login() {
    try {
        const username = $('user').value;
        const password = $('pass').value;
        if (!username || !password) {
            showToast('Please enter both username and password', 'danger');
            return;
        }
        const data = await apiRequest('/admin/api/login', {
            method: 'POST',
            body: { username, password },
        });
        if (data.token) {
            setToken(data.token);
            $('login').classList.add('hidden');
            $('dashboard').classList.remove('hidden');
            await showDefaultSection();
            showToast('Login successful');
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        handleError(error, 'Login failed. Please check your credentials.');
    }
}

/**
 * Restore session from sessionStorage and load app if token exists.
 */
async function restoreSession() {
    const savedToken = sessionStorage.getItem('mirotalk_admin_token');
    if (savedToken) {
        token = savedToken;
        $('login').classList.add('hidden');
        $('dashboard').classList.remove('hidden');
        await showDefaultSection();
    }
}

/**
 * Show the default section of the dashboard.
 */
async function showDefaultSection() {
    await window.Dashboard.loadAppNameSelect();
    window.Dashboard.showSection('system');
}

/**
 * Logout the user, clear token, and reload the page.
 */
async function logout() {
    if (!(await showConfirmModal('Are you sure you want to logout?'))) return;
    setToken('');
    location.reload();
}
