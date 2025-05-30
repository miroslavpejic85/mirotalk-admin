/**
 * Views Module
 * ------------
 * Handles loading HTML views and modal content into the dashboard UI.
 * Exposes view loader functions on the global Dashboard object.
 *
 * @module dashboard/views
 */
(function () {
    'use strict';

    /**
     * Load an HTML view into a specified container element.
     * @param {string} url - The URL of the HTML view to load.
     * @param {string} containerId - The ID of the container element to inject HTML into.
     * @param {string} [errorMsg='Failed to load view.'] - Error message to show on failure.
     */
    async function loadHtmlView(url, containerId, errorMsg = 'Failed to load view.') {
        try {
            const res = await fetch(url);
            const html = await res.text();
            $(containerId).innerHTML = html;
        } catch (error) {
            handleError(error, errorMsg);
        }
    }

    /**
     * Load the main dashboard view into the dashboard container.
     */
    async function loadDashboardView() {
        await loadHtmlView('views/dashboard.html', 'dashboard-container', 'Failed to load dashboard view.');
    }

    /**
     * Load the dashboard modal HTML into the modal container.
     */
    async function loadDashboardModal() {
        await loadHtmlView('views/modal.html', 'dashboard-modal', 'Failed to load dashboard modal view.');
    }

    /**
     * Load the login view into the login container.
     */
    async function loadDashboardLogin() {
        await loadHtmlView('views/login.html', 'dashboard-login', 'Failed to load dashboard login view.');
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadHtmlView = loadHtmlView;
    window.Dashboard.loadDashboardView = loadDashboardView;
    window.Dashboard.loadDashboardModal = loadDashboardModal;
    window.Dashboard.loadDashboardLogin = loadDashboardLogin;
})();
