'use strict';

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
    if (!searchTerm) return logs;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return logs.replace(regex, '<span class="highlight">$1</span>');
}

/**
 * Show a confirmation modal with a message.
 * @param {string} message - The message to display in the modal.
 * @returns {Promise<boolean>} Resolves true if OK, false if cancelled.
 */
async function showConfirmModal(message) {
    return new Promise((resolve) => {
        $('confirmModalBody').textContent = message;
        const modal = new bootstrap.Modal($('confirmModal'));
        const okBtn = $('confirmModalOk');
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

/**
 * Show a toast notification with a message and type.
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of toast ('success', 'danger', etc.).
 */
function showToast(message, type = 'success') {
    const toastEl = document.createElement('div');
    toastEl.className = `toast show align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    $('dashboard-toast').appendChild(toastEl);
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
    }, 5000);
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
    $('dashboard-loader').classList.remove('d-none');
}

/**
 * Hide the dashboard loader (waiting spinner).
 */
function hideLoader() {
    $('dashboard-loader').classList.add('d-none');
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
