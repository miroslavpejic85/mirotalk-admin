/**
 * Events Module
 * -------------
 * Binds all UI event listeners for the admin dashboard, connecting UI elements
 * to their corresponding Dashboard actions and handlers.
 *
 * @module dashboard/events
 */
(function () {
    'use strict';

    /**
     * Bind all dashboard UI event listeners.
     * This function attaches event handlers to buttons, menu items, and controls
     * to trigger Dashboard actions (load, save, backup, search, etc).
     */
    function loadEventListeners() {
        const bindings = [
            {
                type: 'keypress',
                id: 'pass',
                handler: (e) => {
                    if (e.key === 'Enter') login();
                },
            },
            { type: 'click', id: 'login-btn', handler: login },
            { type: 'click', id: 'logout-btn', handler: logout },
            {
                type: 'click',
                id: 'menu-projects',
                handler: () => window.Dashboard.showSection('projects'),
            },
            {
                type: 'click',
                id: 'menu-system',
                handler: () => window.Dashboard.showSection('system'),
            },
            {
                type: 'click',
                id: 'menu-server',
                handler: () => window.Dashboard.showSection('server'),
            },
            {
                type: 'click',
                id: 'menu-status',
                handler: () => window.Dashboard.showSection('status'),
            },
            {
                type: 'click',
                id: 'menu-env',
                handler: () => window.Dashboard.showSection('env'),
            },
            {
                type: 'click',
                id: 'menu-config',
                handler: () => window.Dashboard.showSection('config'),
            },
            {
                type: 'click',
                id: 'menu-logs',
                handler: () => window.Dashboard.showSection('logs'),
            },
            {
                type: 'click',
                id: 'menu-instance',
                handler: () => window.Dashboard.showSection('instance'),
            },
            {
                type: 'click',
                id: 'menu-terminal',
                handler: () => window.Dashboard.showSection('terminal'),
            },
            {
                type: 'click',
                id: 'menu-self-hosting',
                handler: () => window.Dashboard.showSection('self-hosting'),
            },
            {
                type: 'click',
                id: 'sidebar-toggle-btn',
                handler: () => $('sidebar').classList.toggle('hidden'),
            },
            {
                type: 'mouseover',
                id: 'sidebar',
                handler: () => {
                    if (!$('sidebar').classList.contains('hidden')) {
                        $('sidebar').classList.remove('collapsed');
                    }
                },
            },
            {
                type: 'mouseout',
                id: 'sidebar',
                handler: () => {
                    if (!$('sidebar').classList.contains('hidden')) {
                        $('sidebar').classList.add('collapsed');
                    }
                },
            },
            {
                type: 'click',
                id: 'system-refresh-btn',
                handler: window.Dashboard.loadSystemInfo,
            },
            {
                type: 'click',
                id: 'status-refresh-btn',
                handler: window.Dashboard.loadStatus,
            },
            {
                type: 'click',
                id: 'env-reload-btn',
                handler: window.Dashboard.loadEnv,
            },
            {
                type: 'click',
                id: 'env-backup-btn',
                handler: window.Dashboard.backupEnv,
            },
            { type: 'click', id: 'env-save-btn', handler: window.Dashboard.saveEnv },
            {
                type: 'click',
                id: 'config-reload-btn',
                handler: window.Dashboard.loadConfig,
            },
            {
                type: 'click',
                id: 'config-backup-btn',
                handler: window.Dashboard.backupConfig,
            },
            {
                type: 'click',
                id: 'config-save-btn',
                handler: window.Dashboard.saveConfig,
            },
            {
                type: 'click',
                id: 'load-logs-btn',
                handler: window.Dashboard.loadLogs,
            },
            {
                type: 'click',
                id: 'clear-logs-btn',
                handler: window.Dashboard.clearLogs,
            },
            {
                type: 'click',
                id: 'log-search-btn',
                handler: window.Dashboard.searchLogs,
            },
            {
                type: 'change',
                id: 'auto-log-switch',
                handler: window.Dashboard.toggleAutoLogs,
            },
            { type: 'input', id: 'log-search', handler: window.Dashboard.searchLogs },
            {
                type: 'click',
                id: 'check-version-btn',
                handler: window.Dashboard.checkVersion,
            },
            {
                type: 'click',
                id: 'restart-instance-btn',
                handler: window.Dashboard.restartInstance,
            },
            {
                type: 'click',
                id: 'update-btn',
                handler: window.Dashboard.performUpdate,
            },
            {
                type: 'click',
                id: 'server-update-btn',
                handler: window.Dashboard.serverUpdate,
            },
            {
                type: 'click',
                id: 'server-reboot-btn',
                handler: window.Dashboard.serverReboot,
            },
            {
                type: 'click',
                id: 'server-logs-btn',
                handler: window.Dashboard.serverClearLogs,
            },
            {
                type: 'click',
                id: 'self-hosting-refresh-btn',
                handler: () => {
                    const iframe = $('self-hosting-iframe');
                    if (iframe) {
                        iframe.src = iframe.src;
                        showToast('Documentation refreshed', 'success');
                    }
                },
            },
        ];
        bindEvents(bindings);
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadEventListeners = loadEventListeners;
})();
