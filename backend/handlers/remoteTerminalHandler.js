'use strict';

/**
 * Remote Terminal Handler
 * ----------------------
 * Handles a remote (SSH) terminal session for a socket using ssh2.
 * Provides real-time SSH shell access for the admin dashboard terminal feature.
 * All actions are authenticated and events are streamed via socket.io.
 *
 * @module handlers/remoteTerminalHandler
 */

const { Client, getSSHConfig } = require('../utils');

/**
 * Handles a remote (SSH) terminal session for a socket.
 *
 * @param {import('socket.io').Socket} socket - The socket.io socket instance
 * @param {Object} data - Data object (expects { token })
 * @param {Function} isSocketValidToken - Function to validate the token for the socket
 */
function handleRemoteTerminalSession(socket, data = {}, isSocketValidToken) {
    if (!isSocketValidToken(data.token, socket, 'terminalOutput', 'terminalDone')) return;

    const conn = new Client();
    conn.on('ready', () => {
        conn.shell({ term: 'xterm-color', cols: 80, rows: 24 }, (err, stream) => {
            if (err) {
                socket.emit('terminalOutput', `SSH shell error: ${err.message}\n`);
                socket.emit('terminalDone', 1);
                conn.end();
                return;
            }
            socket._sshStream = stream;

            stream.on('data', (chunk) => socket.emit('terminalOutput', chunk.toString()));
            stream.on('close', () => {
                socket.emit('terminalOutput', '\n[SSH session closed]\n');
                socket.emit('terminalDone', 0);
                conn.end();
                socket._sshStream = null;
            });

            socket.removeAllListeners('terminalInput');
            socket.removeAllListeners('stopTerminal');
            socket.removeAllListeners('terminalResize');

            socket.on('terminalInput', ({ token, input }) => {
                if (!isSocketValidToken(token, socket, 'terminalOutput', 'terminalDone')) return;
                if (socket._sshStream) socket._sshStream.write(input);
            });

            socket.on('stopTerminal', ({ token }) => {
                if (!isSocketValidToken(token, socket, 'terminalOutput', 'terminalDone')) return;
                if (socket._sshStream) {
                    socket._sshStream.end();
                    socket._sshStream = null;
                }
                conn.end();
            });

            socket.on('terminalResize', ({ token, cols, rows }) => {
                if (!isSocketValidToken(token, socket, 'terminalOutput', 'terminalDone')) return;
                if (socket._sshStream) socket._sshStream.setWindow(rows, cols, 0, 0);
            });
        });
    })
        .on('error', (err) => {
            socket.emit('terminalOutput', `SSH connection error: ${err.message}\n`);
            socket.emit('terminalDone', 1);
        })
        .connect(getSSHConfig());
}

module.exports = { handleRemoteTerminalSession };
