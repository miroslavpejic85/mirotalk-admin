/**
 * Dashboard Data Module
 * ---------------------
 * Loads all dashboard data (system info, status, logs, env, config, version, server update)
 * in parallel and exposes the loader on the global Dashboard object.
 *
 * @module dashboard/data
 */
(function () {
    'use strict';

    /**
     * Load all dashboard data in parallel and hide loader when done.
     */
    async function loadDashboardData() {
        showLoader();
        try {
            await Promise.all([
                window.Dashboard.loadSystemInfo(),
                window.Dashboard.loadStatus(),
                window.Dashboard.loadLogs(),
                window.Dashboard.loadEnv(),
                window.Dashboard.loadConfig(),
                window.Dashboard.checkVersion(),
                window.Dashboard.checkServerUpdate(),
            ]);
        } finally {
            hideLoader();
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadDashboardData = loadDashboardData;
})();
