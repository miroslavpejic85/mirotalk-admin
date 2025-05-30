'use strict';

/**
 * Socket Event Handlers
 * ---------------------
 * Provides a map of all socket event handlers for the admin dashboard.
 * Handles real-time update, logs, server update, and terminal events.
 * Uses middleware for authentication and streams command output or terminal sessions.
 *
 * @module handlers/socketEventHandlers
 */

const { getCommand, Logs } = require('../utils');
const config = require('../config');
const { handleCommandStream } = require('./commandStreamHandler');
const { handleLocalTerminalSession } = require('./localTerminalHandler');
const { handleRemoteTerminalSession } = require('./remoteTerminalHandler');
const { APP_MANAGE_MODE } = config;
const logger = new Logs('AdminSocket');

/**
 * Returns a map of socket event handlers.
 *
 * @param {Function} isSocketValidToken - Function to validate the token for the socket
 * @returns {Object} Map of event names to handler functions
 */
function getSocketEventHandlers(isSocketValidToken) {
    return {
        performUpdate: (socket, data = {}) =>
            handleCommandStream({
                socket,
                token: data.token,
                eventType: 'update',
                getCmd: () => getCommand('update'),
                manageMode: APP_MANAGE_MODE,
                isSocketValidToken,
            }),
        performLogs: (socket, data = {}) =>
            handleCommandStream({
                socket,
                token: data.token,
                eventType: 'logs',
                getCmd: () => getCommand('realTimeLogs'),
                manageMode: APP_MANAGE_MODE,
                isSocketValidToken,
            }),
        performServerUpdate: (socket, data = {}) =>
            handleCommandStream({
                socket,
                token: data.token,
                eventType: 'serverUpdate',
                getCmd: () => getCommand('serverUpdate'),
                manageMode: APP_MANAGE_MODE,
                isSocketValidToken,
            }),
        stopPerformLogs: (socket) => {
            logger.info('Received stopPerformLogs event');
            if (socket._logsStream) {
                try {
                    socket._logsStream.close && socket._logsStream.close();
                } catch (e) {}
                try {
                    socket._logsStream.destroy && socket._logsStream.destroy();
                } catch (e) {}
                socket._logsStream = null;
            }
            if (socket._logsProcess) {
                try {
                    socket._logsProcess.kill();
                } catch (e) {}
                socket._logsProcess = null;
            }
            socket.emit('logsDone', 0);
        },
        startLocalTerminal: (socket, data = {}) => handleLocalTerminalSession(socket, data, isSocketValidToken),
        startRemoteTerminal: (socket, data = {}) => handleRemoteTerminalSession(socket, data, isSocketValidToken),
        disconnect: (socket) => {
            if (socket._logsStream) {
                try {
                    socket._logsStream.destroy && socket._logsStream.destroy();
                } catch (e) {}
                socket._logsStream = null;
            }
            if (socket._logsProcess) {
                try {
                    socket._logsProcess.kill();
                } catch (e) {}
                socket._logsProcess = null;
            }
        },
    };
}

module.exports = { getSocketEventHandlers };
