'use strict';

class DashboardTerminal {
    constructor(container, socket, token) {
        this.term = new Terminal({ theme: { background: '#0d1117' } });
        this.fitAddon = new window.FitAddon.FitAddon();
        this.term.loadAddon(this.fitAddon);
        this.term.open(container);
        this.fitAddon.fit();
        this.term.focus();
        this.socket = socket;
        this.token = token;

        this.term.onData((data) => {
            this.socket.emit('terminalInput', { token: this.token, input: data });
        });
        this.term.onResize(({ cols, rows }) => {
            this.socket.emit('terminalResize', { token: this.token, cols, rows });
        });
        this.socket.on('terminalOutput', (data) => {
            this.term.write(data);
        });
        this.socket.emit('startTerminal', { token: this.token });

        // --- Make terminal responsive to container/browser resize ---
        this._resizeObserver = new ResizeObserver(() => {
            this.fitAddon.fit();
            this._setTerminalSize(container);
        });
        this._resizeObserver.observe(container);
    }

    _setTerminalSize(container) {
        // Prefer the fit addon's real cell metrics; fall back to an estimate if unavailable
        const proposed = this.fitAddon.proposeDimensions();
        if (proposed && proposed.cols > 0 && proposed.rows > 0) {
            if (proposed.cols !== this.term.cols || proposed.rows !== this.term.rows) {
                this.term.resize(proposed.cols, proposed.rows);
            }
            return;
        }
        const charWidth = 9;
        const charHeight = 18;
        const cols = Math.max(2, Math.floor(container.clientWidth / charWidth));
        const rows = Math.max(1, Math.floor(container.clientHeight / charHeight));
        this.term.resize(cols, rows);
    }

    dispose() {
        this.term.dispose();
        this.socket.off('terminalOutput');
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }
}
