'use strict';

/**
 * Theme Module
 * ------------
 * Handles light/dark mode with system auto-detect and manual toggle.
 * Persists preference to localStorage.
 *
 * @module core/theme
 */
(function () {
    const STORAGE_KEY = 'mirotalk-admin-theme';

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function getEditorTheme() {
        return 'mirotalk-dark';
    }

    function getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
        updateIcon(theme);
    }

    function updateIcon(theme = getCurrentTheme()) {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        btn.innerHTML = `<i class="fas fa-${iconName}" id="theme-icon"></i>`;
        btn.title = label;
        btn.setAttribute('aria-label', label);
    }

    function toggleTheme() {
        const current = getCurrentTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }

    // Initialize on load
    const saved = getSavedTheme();
    applyTheme(saved || getSystemTheme());

    // Listen for system theme changes when no manual preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!getSavedTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Expose for event binding
    window.ThemeManager = { toggleTheme, getEditorTheme, syncIcon: () => updateIcon() };
})();
