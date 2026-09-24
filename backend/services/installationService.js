'use strict';

const { getInstallationStatusCommand, runCommand } = require('../utils');

async function getStatus(product) {
    const status = (await runCommand(getInstallationStatusCommand(product))).trim();
    return { product: String(product).toLowerCase(), status };
}

module.exports = { getStatus };
