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

    // List of available projects (value-label pairs)
    const PROJECTS = [
        { value: 'mirotalksfu', label: 'mirotalk-sfu' },
        { value: 'mirotalk', label: 'mirotalk-p2p' },
        { value: 'mirotalkc2c', label: 'mirotalk-c2c' },
        { value: 'mirotalkbro', label: 'mirotalk-bro' },
        { value: 'mirotalkwebrtc', label: 'mirotalk-web' },
        { value: 'mirotalkadmin', label: 'mirotalk-adm' },
    ];

    /**
     * Load available app/project names, update the UI, and handle selection.
     * Sets the current project in sessionStorage and updates project cards.
     */
    async function loadAppNameSelect() {
        let currentAppName = '';
        let appNames = [];
        try {
            const res = await apiGetAppNames();
            const appNamesRaw = sessionStorage.getItem('appNames') || res.appNames || '';
            appNames = appNamesRaw
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean);
            currentAppName =
                localStorage.getItem('mirotalk_admin_project') ||
                sessionStorage.getItem('currentAppName') ||
                appNames[0] ||
                '';
            sessionStorage.setItem('appNames', appNames.join(','));
            sessionStorage.setItem('currentAppName', currentAppName);
        } catch (err) {
            currentAppName = localStorage.getItem('mirotalk_admin_project') || sessionStorage.getItem('currentAppName');
        }

        // Update the selectbox with readable labels from PROJECTS
        const select = document.getElementById('project-select');
        if (select) {
            select.innerHTML = '';
            appNames.forEach((name) => {
                const project = PROJECTS.find((p) => p.value === name);
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = project ? project.label : name;
                select.appendChild(opt);
            });
            select.value = currentAppName;
            select.onchange = async function () {
                const appName = select.value;
                localStorage.setItem('mirotalk_admin_project', appName);
                sessionStorage.setItem('currentAppName', appName);
                showLoader();
                try {
                    await apiSetAppName(appName);
                    showToast('Project changed to ' + select.options[select.selectedIndex].text, 'success');

                    // Find the currently visible section
                    const visibleSection = document.querySelector('#content > div:not(.hidden)');
                    if (visibleSection) {
                        const sectionId = visibleSection.id.replace('-section', '');
                        switch (sectionId) {
                            case 'system':
                                await window.Dashboard.loadSystemInfo();
                                break;
                            case 'env':
                                await window.Dashboard.loadEnv();
                                break;
                            case 'config':
                                await window.Dashboard.loadConfig();
                                break;
                            case 'logs':
                                await window.Dashboard.loadLogs();
                                break;
                            case 'status':
                                await window.Dashboard.loadStatus();
                                break;
                            case 'instance':
                                await window.Dashboard.checkVersion();
                                break;
                            default:
                                // No action
                                break;
                        }
                    }
                } catch (err) {
                    handleError(err, 'Failed to change project.');
                } finally {
                    hideLoader();
                }
            };
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
