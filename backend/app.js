'use strict';

/**
 * Main Application Entry
 * ----------------------
 * Initializes the Express application, applies middleware, and registers all routes
 * for the MiroTalk Admin Dashboard backend.
 *
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const config = require('./config');
const utils = require('./utils');

const { TRUST_PROXY } = config;

const app = express();

// TRUST_PROXY is already coerced to a boolean by config; pass it through
// directly so Express correctly validates X-Forwarded-For when behind a
// reverse proxy and otherwise ignores client-supplied forwarding headers.
app.set('trust proxy', TRUST_PROXY === true);
app.use(cors(utils.getCorsOptions()));

app.use(helmet.noSniff());
// HTTP Strict Transport Security: instruct compliant browsers to only ever
// reach this origin over HTTPS for the next 2 years, mitigating the
// plaintext-HTTP fall-through that httpolyglot would otherwise allow on
// the same port.
app.use(
    helmet.hsts({
        maxAge: 63072000,
        includeSubDomains: true,
        preload: false,
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
routes(app);

module.exports = app;
