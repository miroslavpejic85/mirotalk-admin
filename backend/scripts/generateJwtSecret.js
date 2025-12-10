'use strict';
/**
 * JWT Secret Generator
 * --------------------
 * Script to generate a secure random JWT secret for the admin dashboard.
 * Outputs a 128-character hexadecimal string to be used as ADMIN_JWT_SECRET.
 *
 * Usage: node backend/scripts/generateJwtSecret.js
 */

const crypto = require('crypto');

function generateJwtSecret() {
    return crypto.randomBytes(64).toString('hex'); // 64 bytes = 128 hex characters
}

const jwtSecret = generateJwtSecret();
console.log('Generated JWT Secret (128 hex characters):');
console.log(jwtSecret);
console.log('\n➡️ Copy and set this in your .env file as:');
console.log(`ADMIN_JWT_SECRET=${jwtSecret}`);
