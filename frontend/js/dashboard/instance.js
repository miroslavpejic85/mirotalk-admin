/**
 * Instance Module
 * ---------------
 * Handles version checking, instance restart, and update operations
 * for the admin dashboard. Exposes related functions on the global Dashboard object.
 *
 * @module dashboard/instance
 */
(function () {
    'use strict';

    /**
     * Check for the latest version and update the UI accordingly.
     */
    async function checkVersion() {
        try {
            showLoader();
            const json = await apiGetVersion();
            const dateNow = new Date().toLocaleString();
            $('last-check').textContent = dateNow;
            $('local-version').textContent = json.localVersion;
            $('remote-version').textContent = json.remoteVersion;
            if (!json.isUpToDate) {
                $('status-text').textContent = 'New version available!';
                $('status-text').className = 'text-success';
                $('update-btn').classList.remove('hidden');
            } else {
                $('status-text').textContent = 'Already up-to-date';
                $('status-text').className = 'text-info';
                $('update-btn').classList.add('hidden');
            }
            showToast('Check for update completed');
        } catch (error) {
            handleError(error, 'Failed to check version. Please try again.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Restart the backend instance after user confirmation.
     */
    async function restartInstance() {
        try {
            if (!(await showConfirmModal('Are you sure you want to restart the instance?'))) return;
            const json = await apiRestartInstance();
            showToast(json.message || 'Instance restarted successfully');
            window.Dashboard.loadStatus();
        } catch (error) {
            handleError(error, 'Failed to restart instance.');
        }
    }

    /**
     * Perform an update of the backend instance with real-time logs.
     */
    async function performUpdate() {
        try {
            if (!(await showConfirmModal('Are you sure you want to update MiroTalk?'))) return;
            const token = getToken();
            if (!token) {
                showToast('Authentication token missing. Please log in again.', 'danger');
                return;
            }
            showLoader();
            $('update-realtime-logs-pre').textContent = '';
            $('update-realtime-logs-pre').className = 'text-light';
            $('update-realtime-logs').classList.remove('hidden');
            socket.emit('performUpdate', { token });
            $('update-btn').classList.add('hidden');
            showToast('Update started. See real-time logs below.');
        } catch (error) {
            $('update-realtime-logs-pre').textContent = error.message;
            $('update-realtime-logs-pre').className = 'text-danger';
            $('update-realtime-logs').classList.add('hidden');
            $('update-btn').classList.remove('hidden');
            handleError(error, 'Failed to perform update. Please try again.');
        } finally {
            hideLoader();
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.checkVersion = checkVersion;
    window.Dashboard.restartInstance = restartInstance;
    window.Dashboard.performUpdate = performUpdate;
})();
