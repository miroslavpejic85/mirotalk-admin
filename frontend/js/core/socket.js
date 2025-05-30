'use strict';

// Connect to Socket.IO
const socket = io();

/**
 * Append text to a <pre> element and scroll to bottom.
 * @param {string} id - The element ID of the <pre> element.
 * @param {string} text - The text to append.
 * @param {boolean} [highlight=false] - Whether to highlight syntax using highlight.js.
 */
function appendToPre(id, text, highlight = false) {
    const pre = $(id);
    if (pre) {
        pre.textContent += text;
        pre.parentElement.scrollTop = pre.parentElement.scrollHeight;
        if (highlight) hljs.highlightElement(pre);
    }
}

/**
 * Listen for real-time update output and append to update logs.
 * @event updateOutput
 * @param {string} data - Output chunk from update process.
 */
socket.on('updateOutput', (data) => {
    appendToPre('update-realtime-logs-pre', data);
});

/**
 * Listen for update completion and append status to update logs.
 * @event updateDone
 * @param {number} code - Exit code of the update process.
 */
socket.on('updateDone', (code) => {
    appendToPre('update-realtime-logs-pre', `\nUpdate finished with code: ${code}\n`);
    checkVersion();
});

/**
 * Listen for real-time logs output and append to logs.
 * @event logsOutput
 * @param {string} data - Output chunk from logs process.
 */
socket.on('logsOutput', (data) => {
    appendToPre('logs', stripAnsiCodes(data), true);
});

/**
 * Listen for logs completion and append status to logs.
 * @event logsDone
 * @param {number} code - Exit code of the logs process.
 */
socket.on('logsDone', (code) => {
    appendToPre('logs', `\nLogs finished with code: ${code}\n`, true);
});

/**
 * Listen for real-time server update output and append to server logs.
 * @event serverUpdateOutput
 * @param {string} data - Output chunk from server update process.
 */
socket.on('serverUpdateOutput', (data) => {
    appendToPre('server-logs', data, true);
});

/**
 * Listen for server update completion and append status to server logs.
 * @event serverUpdateDone
 * @param {number} code - Exit code of the server update process.
 */
socket.on('serverUpdateDone', (code) => {
    appendToPre('server-logs', `\nServer update finished with code: ${code}\n`);
});
