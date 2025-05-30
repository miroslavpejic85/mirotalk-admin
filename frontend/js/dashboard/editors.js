/**
 * Editors Module
 * --------------
 * Initializes and manages CodeMirror editors for config and env files
 * in the admin dashboard. Exposes editor instances and helper functions
 * on the global Dashboard object.
 *
 * @module dashboard/editors
 */
(function () {
    'use strict';

    let configEditor, envEditor;

    /**
     * Initialize CodeMirror editors for config and env.
     */
    function initEditors() {
        configEditor = CodeMirror($('config-editor'), {
            mode: 'javascript',
            theme: 'material-darker',
            lineNumbers: true,
            tabSize: 4,
            indentWithTabs: true,
            extraKeys: {
                'Ctrl-S': window.Dashboard.saveConfig,
                'Cmd-S': window.Dashboard.saveConfig,
            },
        });
        envEditor = CodeMirror($('env-editor'), {
            mode: { name: 'javascript', json: false },
            theme: 'ayu-dark',
            lineNumbers: true,
            tabSize: 4,
            indentWithTabs: true,
            extraKeys: {
                'Ctrl-S': window.Dashboard.saveEnv,
                'Cmd-S': window.Dashboard.saveEnv,
            },
        });
        window.Dashboard.configEditor = configEditor;
        window.Dashboard.envEditor = envEditor;
    }

    /**
     * Set the value of a CodeMirror editor and focus it.
     * @param {CodeMirror.Editor} editorInstance
     * @param {string} value
     */
    function setEditorValue(editorInstance, value) {
        editorInstance.setValue(value);
        editorInstance.focus();
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.initEditors = initEditors;
    window.Dashboard.setEditorValue = setEditorValue;
})();
