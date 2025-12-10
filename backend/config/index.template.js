'use strict';

const dotenv = require('dotenv').config();
const path = require('path');
const fs = require('fs');

/**
 * Default configuration for each supported MiroTalk version.
 * - dir: Application directory
 * - packageUrl: URL to the remote package.json
 * - packagePath: Local path to package.json
 * - config: Path to the main config file
 * - env: Path to the .env file
 * - dep: Array of dependencies to check for this version
 */
const defaultDeps = ['git', 'node', 'npm', 'certbot', 'nginx', 'apache2', 'docker', 'docker-compose', 'pm2'];
const mirotalksfuExtraDeps = ['gcc', 'gpp', 'make', 'python3', 'pip3', 'ffmpeg'];

function makeConfig({ dir, packageUrl, packagePath, config = '', env, dep = defaultDeps }) {
    return { dir, packageUrl, packagePath, config, env, dep };
}

// Application directories from environment variables or defaults
const MIROTALK_SFU_DIR = process.env.MIROTALK_SFU_DIR || '/root/mirotalksfu';
const MIROTALK_P2P_DIR = process.env.MIROTALK_P2P_DIR || '/root/mirotalk';
const MIROTALK_C2C_DIR = process.env.MIROTALK_C2C_DIR || '/root/mirotalkc2c';
const MIROTALK_BRO_DIR = process.env.MIROTALK_BRO_DIR || '/root/mirotalkbro';
const MIROTALK_WEB_DIR = process.env.MIROTALK_WEB_DIR || '/root/mirotalkwebrtc';
const MIROTALK_ADMIN_DIR = process.env.MIROTALK_ADMIN_DIR || '/root/mirotalk-admin';

// Edit this object to add or modify application configurations
const APP_CONFIG = {
    mirotalksfu: makeConfig({
        dir: MIROTALK_SFU_DIR,
        packageUrl: 'https://raw.githubusercontent.com/miroslavpejic85/mirotalksfu/main/package.json',
        packagePath: `${MIROTALK_SFU_DIR}/package.json`,
        config: `${MIROTALK_SFU_DIR}/app/src/config.js`,
        env: `${MIROTALK_SFU_DIR}/.env`,
        dep: [...defaultDeps, ...mirotalksfuExtraDeps],
    }),
    mirotalk: makeConfig({
        dir: MIROTALK_P2P_DIR,
        packageUrl: 'https://raw.githubusercontent.com/miroslavpejic85/mirotalk/master/package.json',
        packagePath: `${MIROTALK_P2P_DIR}/package.json`,
        config: `${MIROTALK_P2P_DIR}/app/src/config.js`,
        env: `${MIROTALK_P2P_DIR}/.env`,
        // dep omitted, uses defaultDeps
    }),
    mirotalkc2c: makeConfig({
        dir: MIROTALK_C2C_DIR,
        packageUrl: 'https://raw.githubusercontent.com/miroslavpejic85/mirotalkc2c/main/package.json',
        packagePath: `${MIROTALK_C2C_DIR}/package.json`,
        config: '',
        env: `${MIROTALK_C2C_DIR}/.env`,
    }),
    mirotalkbro: makeConfig({
        dir: MIROTALK_BRO_DIR,
        packageUrl: 'https://raw.githubusercontent.com/miroslavpejic85/mirotalkbro/main/package.json',
        packagePath: `${MIROTALK_BRO_DIR}/package.json`,
        config: `${MIROTALK_BRO_DIR}/public/js/config.js`,
        env: `${MIROTALK_BRO_DIR}/.env`,
    }),
    mirotalkwebrtc: makeConfig({
        dir: MIROTALK_WEB_DIR,
        packageUrl: 'https://raw.githubusercontent.com/miroslavpejic85/mirotalkwebrtc/master/package.json',
        packagePath: `${MIROTALK_WEB_DIR}/package.json`,
        config: `${MIROTALK_WEB_DIR}/backend/config.js`,
        env: `${MIROTALK_WEB_DIR}/.env`,
    }),
    mirotalkadmin: makeConfig({
        dir: MIROTALK_ADMIN_DIR,
        packageUrl: 'https://raw.githubusercontent.com/miroslavpejic85/mirotalk-admin/main/package.json',
        packagePath: `${MIROTALK_ADMIN_DIR}/package.json`,
        config: `${MIROTALK_ADMIN_DIR}/backend/config/index.js`,
        env: `${MIROTALK_ADMIN_DIR}/.env`,
    }),
};

// Get app name from env or default to mirotalksfu
let APP_NAME = (process.env.APP_NAME || 'mirotalksfu').split(',')[0].trim();
let APP_DEFAULTS = APP_CONFIG[APP_NAME] || APP_CONFIG['mirotalksfu'];

/**
 * Main configuration object for the admin-ssh backend.
 * All values can be overridden by environment variables.
 * - APP_DEFAULTS: The selected app's config object from APP_CONFIG
 * - APP_NAME: The selected app name
 * - APP_DIR: Application directory
 * - APP_PATH_CONFIG: Path to main config file
 * - APP_PATH_ENV: Path to .env file
 * - ADMIN_DASHBOARD_ENABLED: Enable/disable dashboard
 * - ADMIN_JWT_SECRET: JWT secret for admin auth
 * - ADMIN_JWT_EXPIRES_IN: JWT expiration
 * - ADMIN_USERNAME: Admin username
 * - ADMIN_PASSWORD_HASH: Hashed admin password
 * - ADMIN_ALLOWED_IPS: Allowed IPs for admin
 * - PACKAGE_URL: Remote package.json URL
 * - PACKAGE_PATH: Local package.json path
 * - APP_MANAGE_MODE: Application management mode
 * - SSH_MANAGE_MODE: SSH management mode
 * - SSH_HOST, SSH_PORT, SSH_USER, SSH_PASSWORD, SSH_PRIVATE_KEY_PATH, SSH_PRIVATE_KEY: SSH connection details
 */
module.exports = {
    // General settings
    NODE_ENV: process.env.NODE_ENV || 'development',
    TZ: process.env.TZ || 'UTC',
    LOGS_DEBUG: process.env.LOGS_DEBUG !== 'false',
    LOGS_COLORS: process.env.LOGS_COLORS !== 'false',
    LOGS_JSON: process.env.LOGS_JSON === 'true',
    LOGS_JSON_PRETTY: process.env.LOGS_JSON_PRETTY === 'true',

    ADMIN_PORT: process.env.ADMIN_PORT || 9999,

    // App version config
    APP_CONFIG,
    APP_DEFAULTS,
    APP_NAME,
    APP_NAMES: process.env.APP_NAME ? process.env.APP_NAME : ['mirotalksfu'],

    // Dashboard & Auth
    ADMIN_DASHBOARD_ENABLED: process.env.ADMIN_DASHBOARD_ENABLED === 'true',
    ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
    ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN || '1h',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    ADMIN_ALLOWED_IPS: process.env.ADMIN_ALLOWED_IPS ? process.env.ADMIN_ALLOWED_IPS.split(',') : ['*'],

    // SSH config
    APP_MANAGE_MODE: process.env.APP_MANAGE_MODE || 'ssh',
    SSH_MANAGE_MODE: process.env.SSH_MANAGE_MODE || 'docker',
    SSH_HOST: process.env.SSH_HOST,
    SSH_PORT: process.env.SSH_PORT || 22,
    SSH_USER: process.env.SSH_USER || 'root',
    SSH_PASSWORD: process.env.SSH_PASSWORD,
    SSH_PRIVATE_KEY_PATH: process.env.SSH_PRIVATE_KEY_PATH,
    SSH_PRIVATE_KEY: process.env.SSH_PRIVATE_KEY_PATH ? fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH) : undefined,
};
