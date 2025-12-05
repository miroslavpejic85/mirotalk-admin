'use strict';

/**
 * Stream Helpers
 * --------------
 * Provides utility functions for piping process or SSH streams to socket.io events.
 * Used to stream real-time command output from backend processes to the admin dashboard.
 *
 * @module helpers/streamHelpers
 */

/**
 * Clean and format update output for better readability.
 * Filters out Docker progress bars, redundant messages, and npm progress.
 * Handles both Docker and PM2 output formats.
 *
 * @param {string} text - Raw output text
 * @returns {string} - Cleaned and formatted text
 */
function cleanUpdateOutput(text) {
    const lines = text.split('\n');
    const cleanedLines = [];

    for (const line of lines) {
        // Skip Docker progress bars (contain bracket progress indicators)
        if (line.includes('Downloading [') || line.includes('Extracting [')) {
            continue;
        }

        // Skip Docker redundant status messages
        if (
            line.includes('Already exists') ||
            line.includes('Waiting') ||
            line.includes('Pulling fs layer') ||
            line.includes('Verifying Checksum') ||
            line.includes('Download complete')
        ) {
            continue;
        }

        // Skip npm progress bars (contain block characters)
        if (line.includes('░') || line.includes('█') || line.includes('▓')) {
            continue;
        }

        // Skip percentage progress lines
        if (line.trim().match(/^\d+%$/)) {
            continue;
        }

        // Keep important Docker status lines
        if (
            line.includes('Pull complete') ||
            line.includes('Pulled') ||
            line.includes('Container') ||
            line.includes('Total reclaimed space') ||
            line.includes('Deleted Images') ||
            line.includes('Image')
        ) {
            cleanedLines.push(line);
            continue;
        }

        // Keep Git operation lines
        if (
            line.includes('From https://') ||
            line.includes('From git://') ||
            line.includes('Updating') ||
            line.includes('Fast-forward') ||
            line.includes('files changed') ||
            line.includes('insertions(+)') ||
            line.includes('deletions(-)') ||
            line.trim().startsWith('create mode') ||
            line.trim().startsWith('delete mode') ||
            line.trim().startsWith('rename ')
        ) {
            cleanedLines.push(line);
            continue;
        }

        // Keep PM2 status lines
        if (
            line.includes('[PM2]') ||
            line.includes('pm2') ||
            line.includes('stopping') ||
            line.includes('starting') ||
            line.includes('restarting') ||
            line.includes('online') ||
            line.includes('stopped') ||
            line.includes('✓') ||
            line.includes('✗')
        ) {
            cleanedLines.push(line);
            continue;
        }

        // Keep npm summary lines (but not progress)
        if (
            line.includes('npm') &&
            (line.includes('added') ||
                line.includes('removed') ||
                line.includes('updated') ||
                line.includes('audited') ||
                line.includes('packages'))
        ) {
            cleanedLines.push(line);
            continue;
        }

        // Keep error and warning messages
        if (
            line.toLowerCase().includes('error') ||
            line.toLowerCase().includes('warning') ||
            line.toLowerCase().includes('failed')
        ) {
            cleanedLines.push(line);
            continue;
        }

        // Keep other meaningful lines (not empty and not just whitespace)
        if (line.trim().length > 0) {
            // Filter out lines that are just special characters or progress indicators
            if (!line.match(/^[\s\-\=\*\.]+$/)) {
                cleanedLines.push(line);
            }
        }
    }

    return cleanedLines.join('\n');
}

/**
 * Determine if output should be filtered based on event type
 * @param {string} eventType - The type of event (e.g., 'updateOutput', 'logsOutput')
 * @returns {boolean} - Whether to apply filtering
 */
function shouldFilterOutput(eventType) {
    // Apply filtering only for update events
    return eventType.includes('update') || eventType.includes('Update');
}

/**
 * Pipes data from a readable stream (and optionally stderr) to socket.io events.
 * Optionally filters output for update events to remove progress bars and redundant messages.
 *
 * @param {import('socket.io').Socket} socket - The socket.io socket instance
 * @param {import('stream').Readable} stream - The main readable stream (stdout or SSH stream)
 * @param {import('stream').Readable} [stderrStream] - Optional stderr stream
 * @param {string} outputEvent - Name of the socket event for output data
 * @param {string} doneEvent - Name of the socket event for stream/process completion
 */
function streamToSocket(socket, stream, stderrStream, outputEvent, doneEvent) {
    const applyFilter = shouldFilterOutput(outputEvent);

    if (stream) {
        stream.on('data', (chunk) => {
            let data = chunk.toString();
            if (applyFilter) {
                data = cleanUpdateOutput(data);
            }
            if (data.trim()) {
                socket.emit(outputEvent, data);
            }
        });
        stream.on('close', (code) => socket.emit(doneEvent, code));
    }

    if (stderrStream) {
        stderrStream.on('data', (chunk) => {
            let data = chunk.toString();
            if (applyFilter) {
                data = cleanUpdateOutput(data);
            }
            if (data.trim()) {
                socket.emit(outputEvent, data);
            }
        });
    } else if (stream && stream.stderr) {
        stream.stderr.on('data', (chunk) => {
            let data = chunk.toString();
            if (applyFilter) {
                data = cleanUpdateOutput(data);
            }
            if (data.trim()) {
                socket.emit(outputEvent, data);
            }
        });
    }
}

module.exports = { streamToSocket, cleanUpdateOutput };
