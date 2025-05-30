'use strict';

/**
 * Main Entry Point
 * ----------------
 * Loads the dashboard view and initializes the admin dashboard app
 * after the DOM is fully loaded.
 *
 * @module main
 */

/**
 * Entry point: Load the dashboard view and initialize the app after DOM is ready.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.Dashboard.loadDashboard();
});
