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

const app = express();

app.use(
    cors({
        methods: ['GET', 'POST'],
    })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
routes(app);

module.exports = app;
