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
const bcrypt = require('bcrypt');
const config = require('../config');

const { ADMIN_JWT_SECRET, ADMIN_JWT_EXPIRES_IN, ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = config;

/**
 * Authenticate user and return JWT token if valid.
 *
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to authenticate
 * @returns {string} JWT token if credentials are valid
 * @throws {Error} If credentials are invalid
 */
async function authenticate(username, password) {
    if (!ADMIN_JWT_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
        throw new Error('Authentication is not properly configured');
    }
    if (username === ADMIN_USERNAME && (await bcrypt.compare(password, ADMIN_PASSWORD_HASH))) {
        return jwt.sign({ username }, ADMIN_JWT_SECRET, {
            expiresIn: ADMIN_JWT_EXPIRES_IN,
        });
    }
    const err = new Error('Invalid credentials');
    err.status = 403;
    throw err;
}

module.exports = { authenticate };
