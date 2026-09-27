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

    const mobileNavigation = window.matchMedia('(max-width: 768px)');
    const wideDesktopNavigation = window.matchMedia('(min-width: 1024px)');
    let navigationInitialized = false;
    let navigationLayout = '';

    function updateSidebarControls(isOpen) {
        const btn = $('sidebar-toggle-btn');
        btn.setAttribute('aria-expanded', String(isOpen));
        btn.innerHTML = isOpen ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
        $('sidebar-backdrop').classList.toggle('visible', mobileNavigation.matches && isOpen);
    }

    function closeMobileSidebar() {
        if (!mobileNavigation.matches) return;
        $('sidebar').classList.add('hidden');
        updateSidebarControls(false);
    }

    /**
     * Show the specified dashboard section and update sidebar menu state.
     * Hides all other sections and deactivates other menu items.
     * @param {string} sectionId - The section ID to show (e.g., 'system', 'logs').
     */
    function setSectionVisible(sectionId) {
        document.querySelectorAll('#content > div').forEach((section) => section.classList.add('hidden'));
        document.querySelectorAll('#sidebar .menu-item').forEach((item) => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });
        const sectionEl = $(`${sectionId}-section`);
        if (sectionEl) sectionEl.classList.remove('hidden');
        const menuEl = $(`menu-${sectionId}`);
        if (menuEl) {
            menuEl.classList.add('active');
            menuEl.setAttribute('aria-current', 'page');
            $('current-section-label').textContent = menuEl.querySelector('.menu-text').textContent;
        }
        sessionStorage.setItem('mirotalk_admin_section', sectionId);
        closeMobileSidebar();
        if (sectionId !== 'logs') {
            if ($('auto-log-switch')) $('auto-log-switch').checked = false;
        }
    }

    /**
     * Toggle the visibility of the sidebar and update the toggle button icon accordingly.
     */
    function toggleSidebar() {
        const sidebar = $('sidebar');
        if (mobileNavigation.matches) {
            sidebar.classList.toggle('hidden');
            updateSidebarControls(!sidebar.classList.contains('hidden'));
            return;
        }
        sidebar.classList.toggle('collapsed');
        const isExpanded = !sidebar.classList.contains('collapsed');
        localStorage.setItem('mirotalk_admin_sidebar_expanded', String(isExpanded));
        updateSidebarControls(isExpanded);
    }

    function applyNavigationLayout() {
        const sidebar = $('sidebar');
        navigationLayout = mobileNavigation.matches ? 'mobile' : wideDesktopNavigation.matches ? 'desktop' : 'tablet';
        if (mobileNavigation.matches) {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('collapsed');
            updateSidebarControls(false);
        } else if (!wideDesktopNavigation.matches) {
            sidebar.classList.remove('hidden');
            sidebar.classList.add('collapsed');
            updateSidebarControls(false);
        } else {
            const savedPreference = localStorage.getItem('mirotalk_admin_sidebar_expanded');
            const isExpanded = savedPreference === null || savedPreference === 'true';
            sidebar.classList.remove('hidden');
            sidebar.classList.toggle('collapsed', !isExpanded);
            updateSidebarControls(isExpanded);
        }
    }

    function handleNavigationViewportChange() {
        const nextLayout = mobileNavigation.matches ? 'mobile' : wideDesktopNavigation.matches ? 'desktop' : 'tablet';
        if (nextLayout !== navigationLayout) applyNavigationLayout();
    }

    function initializeNavigation() {
        applyNavigationLayout();

        if (navigationInitialized) return;
        navigationInitialized = true;

        $('sidebar-backdrop').addEventListener('click', closeMobileSidebar);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMobileSidebar();
        });
        mobileNavigation.addEventListener('change', handleNavigationViewportChange);
        wideDesktopNavigation.addEventListener('change', handleNavigationViewportChange);
        window.addEventListener('resize', handleNavigationViewportChange);
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.setSectionVisible = setSectionVisible;
    window.Dashboard.toggleSidebar = toggleSidebar;
    window.Dashboard.initializeNavigation = initializeNavigation;
})();
