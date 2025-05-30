'use strict';

/**
 * Controllers Index
 * -----------------
 * Aggregates and exports all controller modules for the admin dashboard backend.
 * This allows for easy and centralized importing of controllers in route definitions.
 *
 * @module controllers
 */

const systemController = require('./systemController');
const serverController = require('./serverController');
const instanceController = require('./instanceController');
const authController = require('./authController');
const configController = require('./configController');
const envController = require('./envController');
const logsController = require('./logsController');
const appController = require('./appController');

module.exports = {
    systemController,
    serverController,
    instanceController,
    authController,
    configController,
    envController,
    logsController,
    appController,
};
