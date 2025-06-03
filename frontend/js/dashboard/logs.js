/**
 * Logs Module
 * -----------
 * Handles fetching, rendering, searching, and clearing logs
 * in the admin dashboard. Exposes related functions on the global Dashboard object.
 *
 * @module dashboard/logs
 */
(function () {
    'use strict';

    /**
     * Fetch logs from the backend and strip ANSI codes.
     * @returns {Promise<string>} Cleaned logs string.
     */
    async function fetchLogs() {
        showLoader();
        try {
            const json = await apiGetLogs();
            return stripAnsiCodes(json.logs);
        } finally {
            hideLoader();
        }
    }

    /**
     * Render logs to the logs element, highlighting search terms if provided.
     * @param {string} logs - The logs string.
     * @param {string} [searchTerm=''] - The term to highlight.
     */
    function renderLogs(logs, searchTerm = '') {
        const html = highlightSearchTerm(logs, searchTerm);
        const logsEl = $('logs');
        logsEl.innerHTML = html;
        hljs.highlightElement(logsEl);
    }

    /**
     * Load logs from the backend and render them.
     */
    async function loadLogs() {
        showLoader();
        try {
            const logs = await fetchLogs();
            renderLogs(logs, $('log-search').value.trim());
        } catch (error) {
            handleError(error, 'Failed to load logs. Please try again.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Clear the logs display.
     */
    function clearLogs() {
        $('logs').textContent = '';
        showToast('Logs cleared');
    }

    /**
     * Search and highlight terms in the logs.
     */
    function searchLogs() {
        const searchTerm = $('log-search').value.trim();
        const logsElement = $('logs');
        const logsContent = logsElement.textContent;
        logsElement.innerHTML = logsContent;
        if (!searchTerm) return;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedContent = logsContent.replace(regex, '<span class="highlight">$1</span>');
        logsElement.innerHTML = highlightedContent;
    }

    /**
     * Toggle real-time logs streaming on or off.
     */
    function toggleAutoLogs() {
        const token = getToken();
        if (!token) {
            showToast('Authentication token missing. Please log in again.', 'danger');
            return;
        }
        if ($('auto-log-switch') && $('auto-log-switch').checked) {
            socket.emit('performLogs', { token });
        } else {
            socket.emit('stopPerformLogs', { token });
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadLogs = loadLogs;
    window.Dashboard.clearLogs = clearLogs;
    window.Dashboard.searchLogs = searchLogs;
    window.Dashboard.toggleAutoLogs = toggleAutoLogs;
})();
