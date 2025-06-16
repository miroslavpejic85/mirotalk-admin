'use strict';

class DashboardTerminal {
    constructor(container, socket, token) {
        this.term = new Terminal({ theme: { background: '#1e1e1e' } });
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
        const charWidth = 9;
        const charHeight = 18;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const cols = Math.floor(width / charWidth);
        const rows = Math.floor(height / charHeight);
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
