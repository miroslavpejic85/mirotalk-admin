/**
 * Sections Module
 * ---------------
 * Handles showing/hiding dashboard sections and updating sidebar menu state.
 * Exposes setSectionVisible on the global Dashboard object.
 *
 * @module dashboard/sections
 */
(function () {
    'use strict';

    /**
     * Show the specified dashboard section and update sidebar menu state.
     * Hides all other sections and deactivates other menu items.
     * @param {string} sectionId - The section ID to show (e.g., 'system', 'logs').
     */
    function setSectionVisible(sectionId) {
        document.querySelectorAll('#content > div').forEach((section) => section.classList.add('hidden'));
        document.querySelectorAll('#sidebar .menu-item').forEach((item) => item.classList.remove('active'));
        const sectionEl = $(`${sectionId}-section`);
        if (sectionEl) sectionEl.classList.remove('hidden');
        const menuEl = $(`menu-${sectionId}`);
        if (menuEl) menuEl.classList.add('active');
        if (sectionId !== 'logs') {
            if ($('auto-log-switch')) $('auto-log-switch').checked = false;
        }
    }
    window.Dashboard = window.Dashboard || {};
    window.Dashboard.setSectionVisible = setSectionVisible;
})();
