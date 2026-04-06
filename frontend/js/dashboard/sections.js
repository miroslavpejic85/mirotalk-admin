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

    /**
     * Toggle the visibility of the sidebar and update the toggle button icon accordingly.
     */
    function toggleSidebar() {
        const sidebar = $('sidebar');
        sidebar.classList.toggle('hidden');
        const isHidden = sidebar.classList.contains('hidden');
        const btn = $('sidebar-toggle-btn');
        btn.innerHTML = isHidden ? '<i class="fas fa-angle-right"></i>' : '<i class="fas fa-angle-left"></i>';
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.setSectionVisible = setSectionVisible;
    window.Dashboard.toggleSidebar = toggleSidebar;
})();
