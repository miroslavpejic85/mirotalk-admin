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

app.set('trust proxy', TRUST_PROXY === 'true');
app.use(cors(utils.getCorsOptions()));

app.use(helmet.noSniff());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
routes(app);

module.exports = app;
