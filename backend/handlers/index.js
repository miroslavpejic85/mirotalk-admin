'use strict';

/**
 * Socket Handlers Index
 * ---------------------
 * Attaches all socket event handlers to the Socket.IO server for the admin dashboard.
 * Centralizes the registration of real-time event handlers, using middleware for authentication.
 *
 * @module handlers/index
 */

const { isSocketValidToken } = require('../middleware');
const { getSocketEventHandlers } = require('./socketEventHandlers');
const { Logs } = require('../utils');
const logger = new Logs('AdminSocket');

/**
 * Attach all socket event handlers to the Socket.IO server.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
function attachSocketHandlers(io) {
    const handlers = getSocketEventHandlers(isSocketValidToken);

    io.on('connection', (socket) => {
        logger.info('Socket.IO client connected');
        Object.entries(handlers).forEach(([event, handler]) => {
            if (event === 'disconnect') {
                socket.on('disconnect', () => handler(socket));
            } else {
                socket.on(event, (data) => handler(socket, data));
            }
        });
    });
}

module.exports = { attachSocketHandlers };
