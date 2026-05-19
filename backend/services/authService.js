'use strict';

/**
 * Auth Service
 * ------------
 * Provides authentication logic for the admin dashboard.
 * Validates admin credentials and issues JWT tokens.
 *
 * @module services/authService
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

const { ADMIN_JWT_SECRET, ADMIN_JWT_EXPIRES_IN, ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = config;

/**
 * Fixed dummy bcrypt hash used to keep the cost of `authenticate()` constant
 * when the submitted username does not match `ADMIN_USERNAME`. Without this,
 * an invalid-username path short-circuits before bcrypt.compare runs and
 * responds ~15x faster than the valid-username path, leaking the configured
 * admin username via a trivial timing side-channel. Value is a real bcrypt
 * hash (cost factor 10) of a random throwaway string; it must never match
 * any real password input.
 */
const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8u9p3F0Q9rR5kqg3y2nQH2c8M8r3aS';

/**
 * Constant-time string comparison that does not leak the input length.
 * Both inputs are padded to a fixed buffer before being passed to
 * `crypto.timingSafeEqual` (which requires equal-length buffers).
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function constantTimeEqualStrings(a, b) {
    const fixed = 64;
    const ba = Buffer.alloc(fixed);
    const bb = Buffer.alloc(fixed);
    Buffer.from(String(a)).copy(ba, 0, 0, fixed);
    Buffer.from(String(b)).copy(bb, 0, 0, fixed);
    // Also factor in the true length so two distinct strings that share the
    // same first `fixed` bytes still compare as unequal.
    const lenEq = String(a).length === String(b).length;
    const bufEq = crypto.timingSafeEqual(ba, bb);
    return lenEq && bufEq;
}

/**
 * Authenticate user and return JWT token if valid.
 *
 * Security: always runs bcrypt.compare against either the real password hash
 * (when the username matches) or a dummy hash of equal cost (when it does
 * not), so the response time does not reveal whether `ADMIN_USERNAME` was
 * guessed correctly. The username comparison itself is also constant-time.
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
    const usernameOk = constantTimeEqualStrings(username, ADMIN_USERNAME);
    const hashToCheck = usernameOk ? ADMIN_PASSWORD_HASH : DUMMY_BCRYPT_HASH;
    // Always run bcrypt.compare so both branches take comparable time.
    const passwordOk = await bcrypt.compare(String(password ?? ''), hashToCheck);
    if (usernameOk && passwordOk) {
        return jwt.sign({ username: ADMIN_USERNAME }, ADMIN_JWT_SECRET, {
            expiresIn: ADMIN_JWT_EXPIRES_IN,
        });
    }
    const err = new Error('Invalid credentials');
    err.status = 403;
    throw err;
}

module.exports = { authenticate };
