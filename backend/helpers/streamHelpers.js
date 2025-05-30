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
 * Pipes data from a readable stream (and optionally stderr) to socket.io events.
 *
 * @param {import('socket.io').Socket} socket - The socket.io socket instance
 * @param {import('stream').Readable} stream - The main readable stream (stdout or SSH stream)
 * @param {import('stream').Readable} [stderrStream] - Optional stderr stream
 * @param {string} outputEvent - Name of the socket event for output data
 * @param {string} doneEvent - Name of the socket event for stream/process completion
 */
function streamToSocket(socket, stream, stderrStream, outputEvent, doneEvent) {
    if (stream) {
        stream.on('data', (chunk) => socket.emit(outputEvent, chunk.toString()));
        stream.on('close', (code) => socket.emit(doneEvent, code));
    }
    if (stderrStream) {
        stderrStream.on('data', (chunk) => socket.emit(outputEvent, chunk.toString()));
    } else if (stream && stream.stderr) {
        stream.stderr.on('data', (chunk) => socket.emit(outputEvent, chunk.toString()));
    }
}

module.exports = { streamToSocket };
