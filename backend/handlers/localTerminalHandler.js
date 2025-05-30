'use strict';

/**
 * Local Terminal Handler
 * ---------------------
 * Handles a local terminal session for a socket using node-pty.
 * Provides real-time shell access for the admin dashboard terminal feature.
 * All actions are authenticated and events are streamed via socket.io.
 *
 * @module handlers/localTerminalHandler
 */

const pty = require('node-pty');

/**
 * Handles a local terminal session for a socket.
 *
 * @param {import('socket.io').Socket} socket - The socket.io socket instance
 * @param {Object} data - Data object (expects { token })
 * @param {Function} isSocketValidToken - Function to validate the token for the socket
 */
function handleLocalTerminalSession(socket, data = {}, isSocketValidToken) {
    if (!isSocketValidToken(data.token, socket, 'terminalOutput', 'terminalDone')) return;
    if (socket._terminalProcess) return;

    const shell = process.env.SHELL || '/bin/sh';
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
    });
    socket._terminalProcess = ptyProcess;

    ptyProcess.on('data', (data) => socket.emit('terminalOutput', data));
    ptyProcess.on('exit', () => {
        socket.emit('terminalOutput', '\n[Process exited]\n');
        socket._terminalProcess = null;
        socket.emit('terminalDone', 0);
    });

    socket.removeAllListeners('terminalInput');
    socket.removeAllListeners('stopTerminal');
    socket.removeAllListeners('terminalResize');

    socket.on('terminalInput', ({ token, input }) => {
        if (!isSocketValidToken(token, socket, 'terminalOutput', 'terminalDone')) return;
        if (socket._terminalProcess) socket._terminalProcess.write(input);
    });

    socket.on('terminalResize', ({ token, cols, rows }) => {
        if (!isSocketValidToken(token, socket, 'terminalOutput', 'terminalDone')) return;
        if (socket._terminalProcess) socket._terminalProcess.resize(cols, rows);
    });

    socket.on('stopTerminal', ({ token }) => {
        if (!isSocketValidToken(token, socket, 'terminalOutput', 'terminalDone')) return;
        if (socket._terminalProcess) {
            socket._terminalProcess.kill();
            socket._terminalProcess = null;
        }
    });
}

module.exports = { handleLocalTerminalSession };
