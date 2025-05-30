/**
 * Terminal Module
 * ---------------
 * Handles initialization and management of the interactive terminal
 * (local or remote) in the admin dashboard. Exposes initTerminal on the global Dashboard object.
 *
 * @module dashboard/terminal
 */
(function () {
    'use strict';

    /**
     * Initialize the dashboard terminal (local or remote) based on user selection.
     * Disposes any existing terminal instance, stops previous terminal session,
     * and creates a new DashboardTerminal instance.
     */
    function initTerminal() {
        const token = getToken();
        if (!token) {
            showToast('Authentication token missing. Please log in again.', 'danger');
            return;
        }
        socket.emit('stopTerminal', { token });
        if (window.Dashboard.dashboardTerminal) {
            window.Dashboard.dashboardTerminal.dispose();
            window.Dashboard.dashboardTerminal = null;
        }
        const terminalContainer = $('terminal-container');
        if (!terminalContainer) {
            showToast('Terminal container not found in DOM.', 'danger');
            return;
        }
        const type = $('terminal-type-select').value === 'remote' ? 'remote' : 'local';
        window.Dashboard.dashboardTerminal = new DashboardTerminal(terminalContainer, socket, token, type);
        window.Dashboard.dashboardTerminal._setTerminalSize(terminalContainer);
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.initTerminal = initTerminal;
})();
