/**
 * Env Module
 * ----------
 * Handles loading, saving, backing up, and validating the environment (.env) file
 * in the admin dashboard. Exposes related functions on the global Dashboard object.
 *
 * @module dashboard/env
 */
(function () {
    'use strict';

    /**
     * Load the environment file and set the editor value.
     */
    async function loadEnv() {
        showLoader();
        try {
            const json = await apiGetEnv();
            window.Dashboard.setEditorValue(window.Dashboard.envEditor, json.content);
        } catch (error) {
            window.Dashboard.setEditorValue(window.Dashboard.envEditor, '');
            handleError(error, 'Failed to load environment. Please try again.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Save the environment file after validation.
     */
    async function saveEnv() {
        showLoader();
        try {
            const envContent = window.Dashboard.envEditor.getValue();
            if (!validateEnv()) throw new Error('Invalid env file');
            await apiSaveEnv(envContent);
            showConfigEnvWarningAlert();
            showToast('Environment saved successfully');
        } catch (error) {
            handleError(error, 'Failed to save environment. Please check the content and try again.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Download a backup of the current environment file.
     */
    function backupEnv() {
        const envContent = window.Dashboard.envEditor.getValue();
        if (!validateEnv()) {
            showToast('Invalid env file', 'danger');
            return;
        }
        downloadFile(
            envContent,
            `${window.Dashboard.getCurrentProjectName()}-env-${new Date().toISOString().split('T')[0]}.env`,
            'text/plain'
        );
        showToast('Environment backup downloaded');
    }

    /**
     * Validate the environment file format.
     * @returns {boolean} True if valid, false otherwise.
     */
    function validateEnv() {
        const envContent = window.Dashboard.envEditor.getValue();
        const lines = envContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '' || line.startsWith('#') || /^[A-Za-z_][A-Za-z0-9_]*=/.test(line)) continue;
            showToast(`Invalid env format at line ${i + 1}: "${lines[i]}"`, 'danger');
            window.Dashboard.envEditor.setCursor({ line: i, ch: 0 });
            window.Dashboard.envEditor.focus();
            return false;
        }
        return true;
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadEnv = loadEnv;
    window.Dashboard.saveEnv = saveEnv;
    window.Dashboard.backupEnv = backupEnv;
    window.Dashboard.validateEnv = validateEnv;
})();
