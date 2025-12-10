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
const routes = require('./routes');
const helmet = require('helmet');

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.use(
    cors({
        methods: ['GET', 'POST'],
    })
);

app.use(helmet.noSniff());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
routes(app);

module.exports = app;
