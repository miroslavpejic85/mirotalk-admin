/**
 * Section Loaders Module
 * ----------------------
 * Maps dashboard section IDs to their corresponding loader functions and
 * provides a showSection helper to display and refresh sections as needed.
 * Exposes sectionLoaders and showSection on the global Dashboard object.
 *
 * @module dashboard/sectionLoaders
 */
(function () {
    'use strict';

    // Map section IDs to their loader functions
    window.Dashboard = window.Dashboard || {};
    window.Dashboard.sectionLoaders = {
        system: window.Dashboard.loadSystemInfo,
        server: window.Dashboard.checkServerUpdate,
        status: window.Dashboard.loadStatus,
        env: window.Dashboard.loadEnv,
        config: window.Dashboard.loadConfig,
        logs: window.Dashboard.loadLogs,
        instance: window.Dashboard.checkVersion,
        terminal: window.Dashboard.initTerminal,
    };

    /**
     * Show a dashboard section by ID, run its loader, and refresh editors if needed.
     * @param {string} sectionId - The section to display and load.
     */
    window.Dashboard.showSection = function (sectionId) {
        window.Dashboard.setSectionVisible(sectionId);
        const loader = window.Dashboard.sectionLoaders[sectionId];
        if (loader) loader();
        if (sectionId === 'config' && window.Dashboard.configEditor) window.Dashboard.configEditor.refresh();
        if (sectionId === 'env' && window.Dashboard.envEditor) window.Dashboard.envEditor.refresh();
    };
})();
