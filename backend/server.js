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
const https = require('https');
const app = require('./app');
const config = require('./config');
const utils = require('./utils');
const Logs = require('./utils/logsUtils');
const logger = new Logs('AdminServer');

// logger.info('Loaded config', { config });

const { ADMIN_PORT } = config;

// Define paths to the SSL key and certificate files.
// In non-production environments, prefer `backend/ssl/dev/` if present
// (e.g. a locally-trusted cert issued via `mkcert`), so the browser does
// not show a self-signed-cert warning during day-to-day development.
// In production, always use the canonical `backend/ssl/` pair, which
// should hold a CA-issued certificate (Let's Encrypt, internal PKI, …)
// or be fronted by a TLS-terminating reverse proxy.
const IS_PRODUCTION = config.NODE_ENV === 'production';
const devKeyPath = path.join(__dirname, 'ssl/dev/key.pem');
const devCertPath = path.join(__dirname, 'ssl/dev/cert.pem');
const prodKeyPath = path.join(__dirname, 'ssl/key.pem');
const prodCertPath = path.join(__dirname, 'ssl/cert.pem');

const useDevCerts = !IS_PRODUCTION && fs.existsSync(devKeyPath) && fs.existsSync(devCertPath);
const keyPath = useDevCerts ? devKeyPath : prodKeyPath;
const certPath = useDevCerts ? devCertPath : prodCertPath;

if (useDevCerts) {
    logger.info('Using development SSL certificates from backend/ssl/dev/');
}

// Read SSL key and certificate files securely
const options = {
    key: fs.readFileSync(keyPath, 'utf-8'),
    cert: fs.readFileSync(certPath, 'utf-8'),
};

// HTTPS-only listener. Previously this used `httpolyglot`, which accepts
// both HTTP and HTTPS on the same port and made the dashboard reachable
// in cleartext (login + JWT). Using `https.createServer` makes plaintext
// access structurally impossible on this port.
const server = https.createServer(options, app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: utils.getCorsOptions(),
    transports: ['websocket'],
});

// Import and use the socket handlers
const { attachSocketHandlers } = require('./handlers');
attachSocketHandlers(io);

server.listen(ADMIN_PORT, () => logger.info(`Dashboard with auth running on https://localhost:${ADMIN_PORT}/admin`));

// Handle client errors (malformed/incomplete HTTP requests) gracefully
server.on('clientError', (err, socket) => {
    err.code === 'HPE_HEADER_OVERFLOW' || err.message === 'Parse Error'
        ? logger.warn('Client HTTP parse error', { error: err.message, code: err.code })
        : logger.warn('Client connection error', { error: err.message, code: err.code });
    if (socket && !socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
    }
});
