/**
 * Installations Module
 * --------------------
 * Runs approved MiroTalk install, update, and uninstall scripts with live output.
 *
 * @module dashboard/installations
 */
(function () {
    'use strict';

    const PROJECT_PRODUCTS = {
        mirotalksfu: 'sfu',
        mirotalk: 'p2p',
        mirotalkc2c: 'c2c',
        mirotalkbro: 'bro',
        mirotalkwebrtc: 'web',
        callme: 'cme',
    };

    const STATUS_PRESENTATION = {
        checking: { text: 'Checking', icon: 'fa-spinner fa-spin', className: 'bg-secondary' },
        installed: { text: 'Installed', icon: 'fa-check', className: 'bg-success' },
        'not-installed': { text: 'Not installed', icon: 'fa-minus', className: 'bg-secondary' },
        unknown: { text: 'Unknown', icon: 'fa-question', className: 'bg-warning text-dark' },
    };

    let installationStatus = 'checking';
    let installationRunning = false;
    let statusRequestId = 0;

    async function loadInstallations() {
        const productSelect = $('installation-product');
        const selectedProduct = PROJECT_PRODUCTS[window.Dashboard.getCurrentProjectName()];
        if (productSelect && selectedProduct) productSelect.value = selectedProduct;
        updateInstallationFields();
        await refreshInstallationStatus();
    }

    function updateInstallationFields() {
        const product = $('installation-product').value;
        document.querySelectorAll('.installation-product-fields').forEach((element) => {
            element.classList.add('hidden');
        });
        const fields = $(`${product}-installation-fields`);
        if (fields) fields.classList.remove('hidden');
    }

    async function changeInstallationProduct() {
        updateInstallationFields();
        await refreshInstallationStatus();
    }

    function secureRandomIndex(length) {
        const limit = 256 - (256 % length);
        const randomByte = new Uint8Array(1);
        do {
            crypto.getRandomValues(randomByte);
        } while (randomByte[0] >= limit);
        return randomByte[0] % length;
    }

    function generateCoturnPassword() {
        if (!window.crypto?.getRandomValues) {
            showToast('Secure password generation is unavailable in this browser.', 'danger');
            return;
        }

        const characterGroups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*_-+='];
        const allCharacters = characterGroups.join('');
        const password = characterGroups.map((characters) => characters[secureRandomIndex(characters.length)]);
        while (password.length < 24) password.push(allCharacters[secureRandomIndex(allCharacters.length)]);
        for (let index = password.length - 1; index > 0; index -= 1) {
            const swapIndex = secureRandomIndex(index + 1);
            [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
        }

        $('installation-coturn-password').value = password.join('');
        showToast('Secure TURN password generated.', 'info');
    }

    function toggleCoturnPasswordVisibility() {
        const passwordInput = $('installation-coturn-password');
        const toggleButton = $('installation-coturn-password-toggle-btn');
        const showPassword = passwordInput.type === 'password';
        passwordInput.type = showPassword ? 'text' : 'password';
        toggleButton.title = showPassword ? 'Hide password' : 'Show password';
        toggleButton.setAttribute('aria-label', toggleButton.title);
        toggleButton.setAttribute('aria-pressed', String(showPassword));
        toggleButton.querySelector('[data-password-icon="show"]').classList.toggle('d-none', showPassword);
        toggleButton.querySelector('[data-password-icon="hide"]').classList.toggle('d-none', !showPassword);
    }

    function hideCoturnPassword() {
        const passwordInput = $('installation-coturn-password');
        const toggleButton = $('installation-coturn-password-toggle-btn');
        passwordInput.type = 'password';
        toggleButton.title = 'Show password';
        toggleButton.setAttribute('aria-label', 'Show password');
        toggleButton.setAttribute('aria-pressed', 'false');
        toggleButton.querySelector('[data-password-icon="show"]').classList.remove('d-none');
        toggleButton.querySelector('[data-password-icon="hide"]').classList.add('d-none');
    }

    function renderInstallationStatus(status) {
        installationStatus = STATUS_PRESENTATION[status] ? status : 'unknown';
        const presentation = STATUS_PRESENTATION[installationStatus];
        const badge = $('installation-status-badge');
        badge.className = `badge ${presentation.className}`;
        badge.innerHTML = `<i class="fas ${presentation.icon} me-1"></i>${presentation.text}`;

        if (installationRunning) return;
        $('installation-install-btn').disabled = installationStatus !== 'not-installed';
        $('installation-update-btn').disabled = installationStatus !== 'installed';
        $('installation-uninstall-btn').disabled = installationStatus !== 'installed';
    }

    async function refreshInstallationStatus() {
        const product = $('installation-product').value;
        const requestId = ++statusRequestId;
        renderInstallationStatus('checking');
        $('installation-status-refresh-btn').disabled = true;
        try {
            const result = await apiGetInstallationStatus(product);
            if (requestId !== statusRequestId) return;
            renderInstallationStatus(result.status);
        } catch (error) {
            if (requestId !== statusRequestId) return;
            renderInstallationStatus('unknown');
            console.error('Installation status check failed', error);
        } finally {
            if (requestId === statusRequestId) {
                $('installation-status-refresh-btn').disabled = installationRunning;
            }
        }
    }

    function setInstallationRunning(isRunning) {
        installationRunning = isRunning;
        document.querySelectorAll('.installation-action-btn').forEach((button) => {
            button.disabled = isRunning;
        });
        const productSelect = $('installation-product');
        const refreshButton = $('installation-status-refresh-btn');
        const passwordGenerateButton = $('installation-coturn-password-generate-btn');
        if (productSelect) productSelect.disabled = isRunning;
        document.querySelectorAll('#installations-section input, #installations-section select').forEach((input) => {
            input.disabled = isRunning;
        });
        if (refreshButton) refreshButton.disabled = isRunning;
        if (passwordGenerateButton) passwordGenerateButton.disabled = isRunning;
        if (!isRunning) renderInstallationStatus(installationStatus);
    }

    function getInstallationAnswers(product) {
        const answers = { domain: $('installation-domain').value.trim() };
        if (product === 'coturn') {
            answers.username = $('installation-coturn-username').value.trim();
            answers.password = $('installation-coturn-password').value;
        }
        if (product === 'whisper') {
            answers.apiKey = $('installation-whisper-api-key').value;
            answers.profile = $('installation-whisper-profile').value;
            answers.modelSize = $('installation-whisper-model').value;
        }
        return answers;
    }

    function validateInstallationFields(product) {
        const fields = [$('installation-domain')];
        if (product === 'coturn') {
            fields.push($('installation-coturn-username'), $('installation-coturn-password'));
        }
        return fields.every((field) => {
            if (field.checkValidity()) return true;
            field.reportValidity();
            return false;
        });
    }

    async function runInstallation(action) {
        const product = $('installation-product').value;
        const productLabel = $('installation-product').selectedOptions[0].textContent;
        const answers = getInstallationAnswers(product);

        if (action === 'install' && !validateInstallationFields(product)) return;

        const descriptions = {
            install: `install ${productLabel} for ${answers.domain}`,
            update: `update ${productLabel}`,
            uninstall: `uninstall ${productLabel} and remove its managed services`,
        };
        if (!(await showConfirmModal(`Are you sure you want to ${descriptions[action]}?`))) return;

        const token = getToken();
        if (!token) {
            showToast('Authentication token missing. Please log in again.', 'danger');
            return;
        }

        const output = $('installation-output');
        output.textContent = `Starting ${action} for ${productLabel}...\n\n`;
        $('installation-output-container').classList.remove('hidden');
        setInstallationRunning(true);
        socket.emit('performInstallation', { token, product, action, answers: action === 'install' ? answers : {} });
        $('installation-coturn-password').value = '';
        hideCoturnPassword();
        $('installation-whisper-api-key').value = '';
        showToast(`${productLabel} ${action} started.`, 'info');
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadInstallations = loadInstallations;
    window.Dashboard.changeInstallationProduct = changeInstallationProduct;
    window.Dashboard.generateCoturnPassword = generateCoturnPassword;
    window.Dashboard.toggleCoturnPasswordVisibility = toggleCoturnPasswordVisibility;
    window.Dashboard.refreshInstallationStatus = refreshInstallationStatus;
    window.Dashboard.runInstallation = runInstallation;
    window.Dashboard.setInstallationRunning = setInstallationRunning;
})();
