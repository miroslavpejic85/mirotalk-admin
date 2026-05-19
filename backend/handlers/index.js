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
const { Logs, getIP } = require('../utils');
const config = require('../config');
const logger = new Logs('AdminSocket');

const { ADMIN_DASHBOARD_ENABLED, ADMIN_ALLOWED_IPS, NODE_ENV } = config;

const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Socket.IO transport-level gate.
 *
 * Mirrors the HTTP middlewares `dashboardEnabledAndHttps` and `restrictAllowedIPs`
 * for websocket upgrades, which would otherwise bypass them entirely (Express
 * middleware does not run on Socket.IO handshakes). Without this, the
 * `ADMIN_DASHBOARD_ENABLED` kill-switch and the `ADMIN_ALLOWED_IPS` allow-list
 * documented in `.env.template` / README are silently inert for sockets.
 *
 * @param {import('socket.io').Socket} socket
 * @param {Function} next
 */
function socketAccessGate(socket, next) {
    if (!ADMIN_DASHBOARD_ENABLED) {
        logger.warn('Socket connection refused: dashboard disabled');
        return next(new Error('dashboard disabled'));
    }
    // Reject plaintext ws:// upgrades in production. httpolyglot accepts
    // both HTTP and HTTPS on the same port, so without this check an
    // attacker on the wire could open an unauthenticated WebSocket in the
    // clear and intercept the JWT used to upgrade it.
    if (IS_PRODUCTION) {
        const encrypted = Boolean(socket.request && socket.request.socket && socket.request.socket.encrypted);
        const xfProto = socket.request && socket.request.headers && socket.request.headers['x-forwarded-proto'];
        const viaTlsProxy = typeof xfProto === 'string' && xfProto.split(',')[0].trim().toLowerCase() === 'https';
        if (!encrypted && !viaTlsProxy) {
            logger.warn('Socket connection refused: plaintext transport');
            return next(new Error('https required'));
        }
    }
    const allowed = Array.isArray(ADMIN_ALLOWED_IPS) ? ADMIN_ALLOWED_IPS : [];
    if (allowed.length > 0 && !allowed.includes('*')) {
        const ip = getIP(socket.request);
        if (!ip || !allowed.includes(ip)) {
            logger.warn('Socket connection refused: IP not allowed', { ip });
            return next(new Error('ip not allowed'));
        }
    }
    next();
}

/**
 * Attach all socket event handlers to the Socket.IO server.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
function attachSocketHandlers(io) {
    const handlers = getSocketEventHandlers(isSocketValidToken);

    io.use(socketAccessGate);

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
