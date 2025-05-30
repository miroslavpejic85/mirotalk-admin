'use strict';

/**
 * Command Stream Handler
 * ---------------------
 * Handles execution of shell or SSH commands and streams their output to a socket.
 * Used for real-time log, status, and update events in the admin dashboard.
 * All actions are logged and errors are returned via socket events.
 *
 * @module handlers/commandStreamHandler
 */

const utils = require('../utils');
const { spawn } = require('child_process');
const { sshExecStream, Logs } = utils;
const { streamToSocket } = require('../helpers/streamHelpers');
const logger = new Logs('handleCommandStream');

/**
 * Handles command execution and streams output to socket.
 *
 * @param {Object} params
 * @param {import('socket.io').Socket} params.socket - The socket.io socket instance
 * @param {string} params.token - Authentication token
 * @param {string} params.eventType - Event type (e.g., 'logs', 'update')
 * @param {Function} params.getCmd - Function that returns the command string to execute
 * @param {string} params.manageMode - 'ssh' or other (local)
 * @param {Function} params.isSocketValidToken - Function to validate the token for the socket
 */
function handleCommandStream({ socket, token, eventType, getCmd, manageMode, isSocketValidToken }) {
    const outputEvent = eventType + 'Output';
    const doneEvent = eventType + 'Done';
    if (!isSocketValidToken(token, socket, outputEvent, doneEvent)) return;

    logger.info(`Received ${eventType} event`);
    const cmd = getCmd();
    if (manageMode === 'ssh') {
        sshExecStream(cmd)
            .then((stream) => streamToSocket(socket, stream, null, outputEvent, doneEvent))
            .catch((err) => {
                socket.emit(outputEvent, `SSH error: ${err.message}\n`);
                socket.emit(doneEvent, 1);
            });
    } else {
        const child = spawn(cmd, { shell: true });
        if (eventType === 'logs') socket._logsProcess = child;
        streamToSocket(socket, child.stdout, child.stderr, outputEvent, doneEvent);
    }
}

module.exports = { handleCommandStream };
