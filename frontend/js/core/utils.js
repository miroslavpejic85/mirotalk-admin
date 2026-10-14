'use strict';

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Download a file with the given content and filename.
 * @param {string} content - The file content.
 * @param {string} filename - The name for the downloaded file.
 * @param {string} [mimeType='text/plain'] - The MIME type of the file.
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Remove ANSI escape codes from a string.
 * @param {string} str - The string to clean.
 * @returns {string} - The cleaned string.
 */
function stripAnsiCodes(str) {
    return str.replace(/\x1b\[[0-9;]*m|\[\d{1,2}m|\x1b\[.*?m/g, '');
}

/**
 * Highlight all occurrences of a search term in logs.
 * @param {string} logs - The log string.
 * @param {string} searchTerm - The term to highlight.
 * @returns {string} - The HTML string with highlights.
 */
function highlightSearchTerm(logs, searchTerm) {
    if (!searchTerm) return escapeHtml(logs);
    // Escape the search term to prevent regex injection
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    // Escape HTML first, then highlight
    const escapedLogs = escapeHtml(logs);
    return escapedLogs.replace(regex, '<span class="highlight">$1</span>');
}

/**
 * Show a confirmation modal with a message.
 * @param {string} message - The message to display in the modal.
 * @param {Object} [options] - Optional presentation settings.
 * @param {string} [options.title='Please Confirm'] - Modal title.
 * @param {string} [options.confirmText='Confirm'] - Label of the confirm button.
 * @param {boolean} [options.danger=false] - Style the confirmation as a destructive action.
 * @returns {Promise<boolean>} Resolves true if OK, false if cancelled.
 */
async function showConfirmModal(message, options = {}) {
    const { title = 'Please Confirm', confirmText = 'Confirm', danger = false } = options;
    return new Promise((resolve) => {
        $('confirmModalBody').textContent = message;
        $('confirmModalLabel').textContent = title;
        const icon = $('confirmModalIcon');
        if (icon) {
            icon.className = `icon-chip${danger ? ' is-danger' : ''}`;
            icon.innerHTML = `<i class="fas ${danger ? 'fa-exclamation-triangle' : 'fa-question'}"></i>`;
        }
        const modal = new bootstrap.Modal($('confirmModal'));
        const okBtn = $('confirmModalOk');
        okBtn.textContent = confirmText;
        okBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
        function cleanup(result) {
            okBtn.removeEventListener('click', onOk);
            $('confirmModal').removeEventListener('hidden.bs.modal', onCancel);
            resolve(result);
        }
        function onOk() {
            modal.hide();
            cleanup(true);
        }
        function onCancel() {
            cleanup(false);
        }
        okBtn.addEventListener('click', onOk);
        $('confirmModal').addEventListener('hidden.bs.modal', onCancel);
        modal.show();
    });
}

const TOAST_ICONS = {
    success: 'fa-check-circle',
    danger: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
};

/**
 * Show a toast notification with a message and type.
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of toast ('success', 'danger', 'warning', 'info').
 */
function showToast(message, type = 'success') {
    const variant = TOAST_ICONS[type] ? type : 'info';
    const container = $('dashboard-toast') || document.body;
    const toastEl = document.createElement('div');
    toastEl.className = `app-toast app-toast-${variant}`;
    toastEl.setAttribute('role', variant === 'danger' ? 'alert' : 'status');
    toastEl.setAttribute('aria-live', variant === 'danger' ? 'assertive' : 'polite');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
        <span class="app-toast-icon"><i class="fas ${TOAST_ICONS[variant]}"></i></span>
        <div class="app-toast-body"></div>
        <button type="button" class="app-toast-close" aria-label="Close"><i class="fas fa-times"></i></button>
    `;
    toastEl.querySelector('.app-toast-body').textContent = message;
    const dismiss = () => {
        if (toastEl.classList.contains('is-leaving')) return;
        toastEl.classList.add('is-leaving');
        setTimeout(() => toastEl.remove(), 250);
    };
    toastEl.querySelector('.app-toast-close').addEventListener('click', dismiss);
    container.appendChild(toastEl);
    setTimeout(dismiss, 5000);
}

/**
 * Handle an error by logging it and showing a toast notification.
 * @param {Error} error - The error object.
 * @param {string} [userMessage='An unexpected error occurred'] - The message to show to the user.
 */
function handleError(error, userMessage = 'An unexpected error occurred') {
    console.error(error);
    showToast(userMessage, 'danger');
}

/**
 * Show the dashboard loader (waiting spinner).
 */
function showLoader() {
    $('dashboard-loader').classList.remove('hidden');
}

/**
 * Hide the dashboard loader (waiting spinner).
 */
function hideLoader() {
    $('dashboard-loader').classList.add('hidden');
}

/**
 * Show the configuration warning alert for a specified number of seconds.
 * @param {number} [seconds=3] - Number of seconds to show the alert.
 */
function showConfigWarningAlert(seconds = 6) {
    const alert = $('config-warning-alert');
    if (!alert) return;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), seconds * 1000);
}

/**
 * Show the combined configuration and environment warning alert for a specified number of seconds.
 * @param {number} [seconds=3] - Number of seconds to show the alert.
 */
function showConfigEnvWarningAlert(seconds = 6) {
    const alert = $('config-env-warning-alert');
    if (!alert) return;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), seconds * 1000);
}

/**
 * Bind event listeners to elements based on an array of bindings.
 * @param {Array} bindings - Array of objects with type, id, and handler properties.
 */
function bindEvents(bindings) {
    bindings.forEach(({ type, id, handler }) => {
        const el = $(id);
        if (el) el.addEventListener(type, handler);
    });
}
