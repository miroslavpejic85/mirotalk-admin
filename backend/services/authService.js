'use strict';

/**
 * Auth Service
 * ------------
 * Provides authentication logic for the admin dashboard.
 * Validates admin credentials and issues JWT tokens.
 *
 * @module services/authService
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { ADMIN_JWT_SECRET, ADMIN_JWT_EXPIRES_IN, ADMIN_USERNAME, ADMIN_PASSWORD } = config;

/**
 * Authenticate user and return JWT token if valid.
 *
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to authenticate
 * @returns {string} JWT token if credentials are valid
 * @throws {Error} If credentials are invalid
 */
function authenticate(username, password) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return jwt.sign({ username }, ADMIN_JWT_SECRET, {
            expiresIn: ADMIN_JWT_EXPIRES_IN,
        });
    }
    const err = new Error('Invalid credentials');
    err.status = 403;
    throw err;
}

module.exports = { authenticate };
