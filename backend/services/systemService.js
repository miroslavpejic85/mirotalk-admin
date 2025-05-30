'use strict';

/**
 * System Service
 * --------------
 * Provides a function to fetch system information for the admin dashboard.
 *
 * @module services/systemService
 */

const utils = require('../utils');
const { getSystemInfo } = utils;

/**
 * Get system information.
 * @returns {Promise<Object>} System information object.
 */
async function getSystem() {
    return await getSystemInfo();
}

module.exports = { getSystem };
