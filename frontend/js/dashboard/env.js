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
            window.Dashboard.restartInstance();
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

    /**
     * Collect env keys declared in content. Optionally includes commented-out keys (e.g. "# KEY=value").
     * @param {string} content - The .env content.
     * @param {boolean} includeCommented - Whether to treat commented-out keys as declared.
     * @returns {Set<string>} Declared keys.
     */
    function getEnvKeys(content, includeCommented) {
        const keys = new Set();
        const regex = includeCommented
            ? /^\s*(?:#\s*)?(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/
            : /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;
        for (const line of content.split('\n')) {
            const match = line.match(regex);
            if (match) keys.add(match[1]);
        }
        return keys;
    }

    /**
     * Find active template entries missing from the current content, keeping each one's leading comments.
     * Keys present in the current content (also commented-out ones) are never touched.
     * @param {string} current - The current .env content.
     * @param {string} template - The .env.template content.
     * @returns {{ keys: string[], block: string }} Missing keys and the text block to append.
     */
    function getMissingEnvEntries(current, template) {
        const existing = getEnvKeys(current, true);
        const keys = [];
        const blocks = [];
        let comments = [];
        for (const line of template.split('\n')) {
            const trimmed = line.trim();
            const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
            if (match) {
                if (!existing.has(match[1]) && !keys.includes(match[1])) {
                    keys.push(match[1]);
                    blocks.push([...comments, line.replace(/\s+$/, '')].join('\n'));
                }
                comments = [];
            } else if (trimmed.startsWith('#')) {
                comments.push(line.replace(/\s+$/, ''));
            } else {
                comments = [];
            }
        }
        return { keys, block: blocks.join('\n\n') };
    }

    /**
     * Add keys from the installed app's .env.template that are missing in the editor.
     * Existing keys and values are never changed; a backup is downloaded first and changes apply only after Save.
     */
    async function syncEnvTemplate() {
        showLoader();
        let template;
        try {
            ({ content: template } = await apiGetEnvTemplate());
        } catch (error) {
            handleError(error, 'Failed to load the environment template.');
            return;
        } finally {
            hideLoader();
        }

        const editor = window.Dashboard.envEditor;
        const current = editor.getValue();
        const { keys, block } = getMissingEnvEntries(current, template || '');
        if (keys.length === 0) {
            showToast('Env is already up to date with .env.template', 'info');
            return;
        }

        const projectName = window.Dashboard.getCurrentProjectName();
        const preview = keys.slice(0, 10).join(', ') + (keys.length > 10 ? `, … (+${keys.length - 10} more)` : '');
        const adminWarning =
            projectName === 'mirotalkadmin'
                ? ' Warning: this is the admin dashboard itself, wrong values may lock you out after restart.'
                : '';
        const confirmed = await showConfirmModal(
            `${keys.length} missing key(s) found in .env.template: ${preview}. ` +
                'They will be appended with their default template values. Existing keys and values are kept unchanged. ' +
                'A backup of the current env will be downloaded first. Review the new values (secrets, domains, ports) ' +
                `and click "Save Env" to apply.${adminWarning}`,
            { title: 'Sync env template', confirmText: 'Add missing keys', danger: true }
        );
        if (!confirmed) return;

        downloadFile(
            current,
            `${projectName}-env-before-sync-${new Date().toISOString().split('T')[0]}.env`,
            'text/plain'
        );
        const header = `# --- Added from .env.template on ${new Date().toISOString().split('T')[0]} (review before saving) ---`;
        const base = current.replace(/\s+$/, '');
        const merged = `${base}${base ? '\n\n' : ''}${header}\n\n${block}\n`;
        window.Dashboard.setEditorValue(editor, merged);
        const addedLine = base ? base.split('\n').length + 1 : 0;
        editor.setCursor({ line: addedLine, ch: 0 });
        editor.focus();
        showToast(
            `${keys.length} key(s) added and backup downloaded. Review and click "Save Env" to apply.`,
            'warning'
        );
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadEnv = loadEnv;
    window.Dashboard.saveEnv = saveEnv;
    window.Dashboard.backupEnv = backupEnv;
    window.Dashboard.validateEnv = validateEnv;
    window.Dashboard.syncEnvTemplate = syncEnvTemplate;
})();
