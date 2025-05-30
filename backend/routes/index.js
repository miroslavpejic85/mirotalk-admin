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
const path = require('path');
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
} = controllers;

const frontendPath = path.join(__dirname, '../../', 'frontend');
const index = path.join(frontendPath, 'index.html');

/**
 * Register all admin dashboard routes and middleware.
 * @param {express.Application} app - The Express application instance.
 */
module.exports = function (app) {
    // ###########################
    // Middleware
    // ###########################

    // Serve static frontend files for /admin
    app.use('/admin', express.static(frontendPath));
    // Restrict access to allowed IPs
    app.use(restrictAllowedIPs);
    // Enforce dashboard enabled and HTTPS in production
    app.use(dashboardEnabledAndHttps);

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

    // System
    app.get('/admin/api/system', systemController.getSystem);

    // Server
    app.post('/admin/api/serverReboot', serverController.serverReboot);
    app.get('/admin/api/checkForServerUpdate', serverController.checkForServerUpdate);

    // Env
    app.get('/admin/api/env', envController.getEnv);
    app.post('/admin/api/env', envController.saveEnv);

    // Config
    app.get('/admin/api/config', configController.getConfig);
    app.post('/admin/api/config', configController.saveConfig);

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
