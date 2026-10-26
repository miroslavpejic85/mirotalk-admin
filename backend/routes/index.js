'use strict';

/**
 * Admin Dashboard Route Registration
 * ----------------------------------
 * Registers all routes and middleware for the MiroTalk Admin Dashboard.
 * Serves the frontend, applies security middleware, and exposes REST API endpoints
 * for system, server, instance, config, environment, logs, and app management.
 *
 * @module routes/index
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const packageJson = require('../../package.json');
const middleware = require('../middleware');
const controllers = require('../controllers');

const { restrictAllowedIPs, dashboardEnabledAndHttps, authenticateToken, loginLimiter } = middleware;

const {
    systemController,
    serverController,
    instanceController,
    authController,
    configController,
    envController,
    logsController,
    appController,
    installationController,
} = controllers;

const frontendPath = path.join(__dirname, '../../', 'frontend');
const index = path.join(frontendPath, 'index.html');
const loginView = path.join(frontendPath, 'views', 'login.html');
const APP_VERSION = `v${packageJson.version}`;

/**
 * Register all admin dashboard routes and middleware.
 * @param {express.Application} app - The Express application instance.
 */
module.exports = function (app) {
    // ###########################
    // Middleware
    // ###########################

    // Restrict access to allowed IPs. Registered BEFORE the static mount
    // so that ADMIN_ALLOWED_IPS protects the entire /admin/** surface
    // (HTML, JS, CSS, views) and not only the JSON API.
    app.use(restrictAllowedIPs);

    // Enforce dashboard enabled and HTTPS in production. Also registered
    // before the static mount so that ADMIN_DASHBOARD_ENABLED=false is a
    // real kill-switch (otherwise the login page and dashboard HTML
    // would still be served even with the dashboard administratively
    // disabled).
    app.use(dashboardEnabledAndHttps);

    /**
     * GET /admin/views/login.html
     * Serve the login view with the app version and current year injected.
     */
    app.get('/admin/views/login.html', async (req, res, next) => {
        try {
            const html = await fs.promises.readFile(loginView, 'utf8');
            res.type('html').send(
                html
                    .replace(/{{APP_VERSION}}/g, APP_VERSION)
                    .replace(/{{CURRENT_YEAR}}/g, String(new Date().getFullYear()))
            );
        } catch (error) {
            next(error);
        }
    });

    // Serve static frontend files for /admin (guarded by the two
    // middlewares above).
    app.use('/admin', express.static(frontendPath));

    // ###########################
    // Routes
    // ###########################

    /**
     * GET /admin
     * Serve the main dashboard HTML.
     */
    app.get('/admin', (req, res) => {
        res.sendFile(index);
    });

    /**
     * POST /admin/api/login
     * Admin login route with rate limiting.
     * Body: { username, password }
     * Response: { token }
     */
    app.post('/admin/api/login', loginLimiter, authController.login);

    // All routes below require authentication
    app.use('/admin/api', authenticateToken);

    // App
    app.get('/admin/api/getAppNames', appController.getAppNames);
    app.post('/admin/api/setAppName', appController.setAppName);

    // Installations
    app.get('/admin/api/installationStatus', installationController.getStatus);

    // System
    app.get('/admin/api/system', systemController.getSystem);

    // Server
    app.post('/admin/api/serverReboot', serverController.serverReboot);
    app.get('/admin/api/checkForServerUpdate', serverController.checkForServerUpdate);

    // Env
    app.get('/admin/api/env', envController.getEnv);
    app.post('/admin/api/env', envController.saveEnv);
    app.get('/admin/api/env/template', envController.getEnvTemplate);

    // Config
    app.get('/admin/api/config', configController.getConfig);
    app.post('/admin/api/config', configController.saveConfig);
    app.get('/admin/api/config/template', configController.getConfigTemplate);

    // Logs
    app.get('/admin/api/logs', logsController.getLogs);

    // Instance
    app.get('/admin/api/version', instanceController.getVersion);
    app.get('/admin/api/status', instanceController.getStatus);
    app.post('/admin/api/restart', instanceController.restart);
    app.post('/admin/api/update', instanceController.update);

    /**
     * 404 handler for unmatched routes.
     * Responds with JSON error message.
     */
    app.use((req, res) => {
        res.status(404).json({ error: 'Not found' });
    });
};
