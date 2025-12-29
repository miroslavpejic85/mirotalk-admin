/**
 * Main Dashboard Loader
 * ---------------------
 * Initializes the admin dashboard UI, editors, event listeners, and default section.
 * Exposes the loadDashboard function on the global Dashboard object.
 *
 * @module dashboard/main
 */
(function () {
    'use strict';

    /**
     * Load and initialize the dashboard UI, editors, and event listeners.
     * Shows the login, loads the main view and modal, restores session, and displays the default section.
     */
    async function loadDashboard() {
        showLoader();
        try {
            await window.Dashboard.loadDashboardLogin();
            await window.Dashboard.loadDashboardView();
            await window.Dashboard.loadDashboardModal();
            await restoreSession();
            window.Dashboard.initEditors();
            window.Dashboard.loadEventListeners();
        } finally {
            hideLoader();
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadDashboard = loadDashboard;
})();
