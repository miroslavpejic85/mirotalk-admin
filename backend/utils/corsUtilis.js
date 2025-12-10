'use strict';

/**
 * CORS Utilities
 * -------------------------
 * Utility functions for configuring CORS settings.
 *
 * @module utils/corsUtils
 */

const config = require('../config');

const { CORS_ORIGIN, CORS_METHODS } = config;

// CORS options are already parsed in config/index.js
const corsOptions = {
    origin: CORS_ORIGIN,
    methods: CORS_METHODS,
};

/**
 * Get CORS options based on configuration.
 *
 * @returns {Object} CORS options
 */
const getCorsOptions = () => corsOptions;

module.exports = {
    getCorsOptions,
};
