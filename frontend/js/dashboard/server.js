/**
 * Server Module
 * -------------
 * Handles server update checks, performing updates, rebooting, and clearing server logs
 * for the admin dashboard. Exposes related functions on the global Dashboard object.
 *
 * @module dashboard/server
 */
(function () {
    'use strict';

    /**
     * Check if a server update is available and update the UI accordingly.
     */
    async function checkServerUpdate() {
        try {
            showLoader();
            const json = await apiCheckForServerUpdate();
            if (json.updateAvailable) {
                $('server-update-btn').classList.remove('hidden');
                $('server-update-status').textContent = 'Update available';
                $('server-update-status').className = 'text-success';
            } else {
                $('server-update-btn').classList.add('hidden');
                $('server-update-status').textContent = 'No updates available';
                $('server-update-status').className = 'text-info';
            }
        } catch (error) {
            handleError(error, 'Failed to check for server update.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Perform a server update after user confirmation.
     */
    async function serverUpdate() {
        try {
            if (!(await showConfirmModal('Are you sure you want to update the server?'))) return;
            const token = getToken();
            if (!token) {
                showToast('Authentication token missing. Please log in again.', 'danger');
                return;
            }
            showLoader();
            socket.emit('performServerUpdate', { token });
            showToast('Server update started.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Reboot the server after user confirmation.
     */
    async function serverReboot() {
        try {
            if (!(await showConfirmModal('Are you sure you want to reboot the server?'))) return;
            showLoader();
            await apiServerReboot();
            showToast('Server rebooted successfully');
        } catch (error) {
            handleError(error, 'Failed to reboot server.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Clear the server logs display.
     */
    function serverClearLogs() {
        $('server-logs').textContent = '';
        showToast('Logs cleared');
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.checkServerUpdate = checkServerUpdate;
    window.Dashboard.serverUpdate = serverUpdate;
    window.Dashboard.serverReboot = serverReboot;
    window.Dashboard.serverClearLogs = serverClearLogs;
})();
