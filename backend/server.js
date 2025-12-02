'use strict';

/**
 * Main Server Entry
 * -----------------
 * Starts the HTTPS server for the MiroTalk Admin Dashboard backend,
 * loads configuration, and attaches Socket.IO handlers.
 *
 * @module server
 */

const path = require('path');
const fs = require('fs');
const app = require('./app');
const config = require('./config');
const Logs = require('./utils/logsUtils');
const logger = new Logs('AdminServer');

logger.info('Loaded config', config);

const { ADMIN_PORT } = config;

// Define paths to the SSL key and certificate files
const keyPath = path.join(__dirname, 'ssl/key.pem');
const certPath = path.join(__dirname, 'ssl/cert.pem');

// Read SSL key and certificate files securely
const options = {
    key: fs.readFileSync(keyPath, 'utf-8'),
    cert: fs.readFileSync(certPath, 'utf-8'),
};

// Serve both http and https and attach Socket.IO
const server = require('httpolyglot').createServer(options, app);
const { Server } = require('socket.io');
const io = new Server(server, {
    transports: ['websocket'],
    cors: { origin: '*' },
});

// Import and use the socket handlers
const { attachSocketHandlers } = require('./handlers');
attachSocketHandlers(io);

server.listen(ADMIN_PORT, () => logger.info(`Dashboard with auth running on https://localhost:${ADMIN_PORT}/admin`));
