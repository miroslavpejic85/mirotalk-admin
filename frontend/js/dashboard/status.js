/**
 * Status Module
 * -------------
 * Handles loading and displaying the current backend instance status
 * (uptime, status, start/finish times) in the admin dashboard.
 * Exposes loadStatus on the global Dashboard object.
 *
 * @module dashboard/status
 */
(function () {
    'use strict';

    /**
     * Load the current backend instance status and update the UI.
     */
    async function loadStatus() {
        showLoader();
        try {
            const json = await apiGetStatus();
            $('uptime').innerText = json.uptime;
            $('status').innerText = json.status;
            $('started').innerText = json.startedAt;
            $('finished').innerText = json.finishedAt;
        } catch (error) {
            handleError(error, 'Failed to load status.');
        } finally {
            hideLoader();
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadStatus = loadStatus;
})();
