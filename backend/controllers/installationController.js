'use strict';

const installationService = require('../services/installationService');
const { Logs } = require('../utils');
const logger = new Logs('InstallationController');

const getStatus = async (req, res) => {
    try {
        const result = await installationService.getStatus(req.query.product);
        res.json(result);
    } catch (error) {
        logger.error('Installation status check failed', { error: error.message });
        const statusCode = error.message === 'Unsupported installation product' ? 400 : 500;
        res.status(statusCode).json({ error: 'Installation status check failed', details: error.message });
    }
};

module.exports = { getStatus };
