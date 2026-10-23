'use strict';

/**
 * Config Module
 * -------------
 * Handles loading, saving, backing up, and validating the configuration file
 * in the admin dashboard. Exposes related functions on the global Dashboard object.
 *
 * @module dashboard/config
 */
(function () {
    /**
     * Load the configuration file and set the editor value.
     */
    async function loadConfig() {
        if (window.Dashboard.hasConfig === false) return;
        showLoader();
        try {
            const json = await apiGetConfig();
            window.Dashboard.setEditorValue(window.Dashboard.configEditor, json.content);
        } catch (error) {
            window.Dashboard.setEditorValue(window.Dashboard.configEditor, '');
            handleError(error, 'Failed to load configuration. Please try again.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Save the configuration file after validation.
     */
    async function saveConfig() {
        showLoader();
        try {
            const configContent = window.Dashboard.configEditor.getValue();
            if (!validateConfig()) throw new Error('Invalid Config file');
            await apiSaveConfig(configContent);
            showConfigWarningAlert();
            showToast('Configuration saved successfully');
            window.Dashboard.restartInstance();
        } catch (error) {
            handleError(error, 'Failed to save configuration. Please check the content and try again.');
        } finally {
            hideLoader();
        }
    }

    /**
     * Download a backup of the current configuration file.
     */
    function backupConfig() {
        const config = window.Dashboard.configEditor.getValue();
        if (!validateConfig()) {
            showToast('Invalid Config file', 'danger');
            return;
        }
        downloadFile(
            config,
            `${window.Dashboard.getCurrentProjectName()}-config-${new Date().toISOString().split('T')[0]}.js`,
            'text/javascript'
        );
        showToast('Configuration backup downloaded');
    }

    /**
     * Validate the configuration file by attempting to execute it in a sandboxed function.
     * Comments out require statements for validation.
     * @returns {boolean} True if valid, false otherwise.
     */
    function validateConfig() {
        let code = window.Dashboard.configEditor.getValue();
        code = code.replace(/^\s*(const|let|var)?\s*\w*\s*=\s*require\((['"`].+?['"`])\);?/gm, '// $&');
        code = code.replace(/^\s*module\.exports\s*=\s*/, '');
        code = code.trim();
        if (code.startsWith('{') && code.endsWith('}')) {
            code = '(' + code + ')';
        }
        try {
            const fn = new Function('return ' + code);
            fn();
            showToast('Config is valid', 'success');
            return true;
        } catch (error) {
            if (error.message.includes('require') || error.message.includes('module')) return true;
            showToast('Config error: ' + error.message, 'danger');
            console.error('Code validation error:', error);
            const doc = window.Dashboard.configEditor.getDoc();
            doc.setCursor({ line: 0, ch: 0 });
            window.Dashboard.configEditor.focus();
            return false;
        }
    }

    /**
     * Replace the editor content with the installed app's config template.
     * Downloads a backup of the current content first; changes are applied only after Save.
     */
    async function syncConfigTemplate() {
        if (window.Dashboard.hasConfig === false) return;
        const confirmed = await showConfirmModal(
            'This will replace the current configuration with the default config.template.js of the installed version. ' +
                'All your custom changes will be overwritten. A backup of the current configuration will be downloaded first. ' +
                'The template is only loaded into the editor: review it and click "Save Config" to apply.',
            { title: 'Sync config template', confirmText: 'Overwrite', danger: true }
        );
        if (!confirmed) return;
        showLoader();
        try {
            const { content } = await apiGetConfigTemplate();
            if (!content || !content.trim()) throw new Error('Config template is empty');
            downloadFile(
                window.Dashboard.configEditor.getValue(),
                `${window.Dashboard.getCurrentProjectName()}-config-before-sync-${new Date().toISOString().split('T')[0]}.js`,
                'text/javascript'
            );
            window.Dashboard.setEditorValue(window.Dashboard.configEditor, content);
            showToast('Template loaded and backup downloaded. Review it and click "Save Config" to apply.', 'warning');
        } catch (error) {
            handleError(error, 'Failed to load the configuration template.');
        } finally {
            hideLoader();
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadConfig = loadConfig;
    window.Dashboard.saveConfig = saveConfig;
    window.Dashboard.backupConfig = backupConfig;
    window.Dashboard.validateConfig = validateConfig;
    window.Dashboard.syncConfigTemplate = syncConfigTemplate;
})();
