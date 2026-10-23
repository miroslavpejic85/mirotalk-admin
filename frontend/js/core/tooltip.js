'use strict';

/**
 * Tooltip Module
 * --------------
 * Replaces slow native `title` tooltips with Bootstrap tooltips for every element
 * that has a `title` attribute, including dynamically rendered views. Titles changed
 * at runtime (e.g. "Show password" -> "Hide password") are picked up on next hover.
 * Sidebar items only show tooltips while the sidebar is collapsed (labels hidden).
 *
 * @module core/tooltip
 */
(function () {
    if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const TITLE_ATTR = 'data-bs-original-title';

    /**
     * Move a native `title` into the Bootstrap attribute so the browser tooltip never shows.
     * @param {Element} el - Element with a title attribute.
     */
    function adoptTitle(el) {
        const title = el.getAttribute('title');
        if (title === null) return;
        el.removeAttribute('title');
        if (!title.trim()) return;
        el.setAttribute(TITLE_ATTR, title);
        // Keep an accessible name for icon-only controls.
        if (el.dataset.tooltipAria === 'true' || (!el.getAttribute('aria-label') && !el.textContent.trim())) {
            el.setAttribute('aria-label', title);
            el.dataset.tooltipAria = 'true';
        }
    }

    function onPointerEnter(event) {
        const el = event.target instanceof Element ? event.target.closest('[title]') : null;
        if (el) adoptTitle(el);
    }

    /**
     * Hide every visible tooltip (e.g. after a click or a section change).
     */
    function hideAllTooltips() {
        document.querySelectorAll(`[${TITLE_ATTR}][aria-describedby]`).forEach((el) => {
            const instance = bootstrap.Tooltip.getInstance(el);
            if (instance) instance.hide();
        });
    }

    function init() {
        document.addEventListener('mouseover', onPointerEnter, true);
        document.addEventListener('mousedown', hideAllTooltips, true);
        document.addEventListener('keydown', (event) => event.key === 'Escape' && hideAllTooltips());

        document.addEventListener('show.bs.tooltip', (event) => {
            const sidebar = event.target.closest('#sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) event.preventDefault();
        });

        new bootstrap.Tooltip(document.body, {
            selector: `[${TITLE_ATTR}]`,
            trigger: 'hover',
            container: 'body',
            delay: { show: 120, hide: 0 },
            placement: (instance, tip, el) => (el.closest('#sidebar') ? 'right' : 'top'),
            fallbackPlacements: ['top', 'bottom', 'right', 'left'],
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
