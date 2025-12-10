'use strict';

/**
 * Password Hashing Utility
 * ------------------------
 * A simple script to hash a password using bcrypt for secure storage.
 * Run this script in the backend environment to generate a hashed password
 * for use in the ADMIN_PASSWORD_HASH environment variable.
 *
 * Usage: node backend/scripts/hashPassword.js
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Enter password to hash: ', async (password) => {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('\nGenerated hash:');
        console.log(hash);
        console.log('\n➡️ Copy and set this in your .env file as:');
        console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    } catch (error) {
        console.error('Error hashing password:', error);
    } finally {
        rl.close();
    }
});
