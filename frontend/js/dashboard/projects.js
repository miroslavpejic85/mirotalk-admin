/**
 * Projects Module
 * ---------------
 * Handles loading and selecting available project/app names in the admin dashboard.
 * Exposes related functions on the global Dashboard object.
 *
 * @module dashboard/projects
 */
(function () {
    'use strict';

    /**
     * Load available app/project names, update the UI, and handle selection.
     * Sets the current project in sessionStorage and updates project cards.
     */
    async function loadAppNameSelect() {
        let currentAppName;
        try {
            const res = await apiGetAppNames();
            const appNamesRaw = sessionStorage.getItem('appNames') || res.appNames || '';
            const appNames = appNamesRaw
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean);
            currentAppName = sessionStorage.getItem('currentAppName') || appNames[0] || '';
            sessionStorage.setItem('appNames', appNames.join(','));
            sessionStorage.setItem('currentAppName', currentAppName);
            document.querySelectorAll('.project-card').forEach((card) => {
                const cardValue = card.getAttribute('data-value');
                card.classList.toggle('d-none', !appNames.includes(cardValue));
            });
        } catch (err) {
            currentAppName = sessionStorage.getItem('currentAppName');
        }
        document.querySelectorAll('.project-card').forEach((card) => {
            card.addEventListener('click', async function () {
                document
                    .querySelectorAll('.project-card')
                    .forEach((c) => c.classList.remove('selected', 'border-primary'));
                this.classList.add('selected', 'border-primary');
                const appName = this.getAttribute('data-value');
                showLoader();
                try {
                    await apiSetAppName(appName);
                    showToast('Project name: ' + appName);
                    sessionStorage.setItem('currentAppName', appName);
                } catch (err) {
                    handleError(err, 'Failed to change project.');
                } finally {
                    hideLoader();
                }
            });
        });
        if (currentAppName) {
            const selectedCard = document.querySelector(`.project-card[data-value="${currentAppName}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected', 'border-primary');
                selectedCard.click();
            } else {
                showToast('No project selected', 'warning');
            }
        }
    }

    /**
     * Get the current selected project/app name from sessionStorage.
     * @returns {string} The current project name.
     */
    function getCurrentProjectName() {
        return sessionStorage.getItem('currentAppName') || 'mirotalksfu';
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadAppNameSelect = loadAppNameSelect;
    window.Dashboard.getCurrentProjectName = getCurrentProjectName;
})();
