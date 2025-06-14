'use strict';

/**
 * SSH Utilities
 * -------------
 * Provides functions to execute commands and read/write files over SSH.
 * Used for remote management of the backend application and file operations.
 *
 * @module utils/sshUtils
 */

const { Client } = require('ssh2');
const config = require('../config');

const { SSH_HOST, SSH_PORT, SSH_USER, SSH_PASSWORD, SSH_PRIVATE_KEY } = config;

/**
 * Get SSH connection configuration from environment/config.
 * Uses private key if available, otherwise falls back to password.
 * @returns {Object} SSH connection config
 */
function getSSHConfig() {
    const configObj = {
        host: SSH_HOST,
        port: SSH_PORT,
        username: SSH_USER,
    };
    if (SSH_PASSWORD) {
        configObj.password = SSH_PASSWORD;
    } else if (SSH_PRIVATE_KEY) {
        configObj.privateKey = SSH_PRIVATE_KEY;
    } else {
        throw new Error('No SSH password or private key found for authentication.');
    }
    return configObj;
}

/**
 * Execute a command over SSH and resolve with its stdout.
 * Rejects on non-zero exit code or error.
 * @param {string} command - The shell command to execute remotely.
 * @returns {Promise<string>} - Resolves with stdout string.
 */
function sshExec(command) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) return reject(err);
                let stdout = '';
                let stderr = '';
                stream
                    .on('close', (code, signal) => {
                        conn.end();
                        if (code === 0) resolve(stdout);
                        else reject(new Error(stderr || `SSH exited with code ${code}`));
                    })
                    .on('data', (data) => {
                        stdout += data;
                    })
                    .stderr.on('data', (data) => {
                        stderr += data;
                    });
            });
        })
            .on('error', reject)
            .connect(getSSHConfig());
    });
}

/**
 * Read a remote file over SSH.
 * @param {string} remotePath - Path to the remote file.
 * @returns {Promise<string>} - Resolves with file content.
 */
function sshReadFile(remotePath) {
    return sshExec(`cat ${remotePath}`);
}

/**
 * Write content to a remote file over SSH using SFTP.
 * @param {string} remotePath - Path to the remote file.
 * @param {string} content - Content to write.
 * @returns {Promise<void>}
 */
function sshWriteFile(remotePath, content) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                const writeStream = sftp.createWriteStream(remotePath);
                writeStream.write(content);
                writeStream.end();
                writeStream.on('close', () => {
                    conn.end();
                    resolve();
                });
                writeStream.on('error', (e) => {
                    conn.end();
                    reject(e);
                });
            });
        })
            .on('error', reject)
            .connect(getSSHConfig());
    });
}

/**
 * Execute a command over SSH and return the stream for real-time output.
 * Allows listening to 'data', 'stderr', and 'close' events for live logs.
 * @param {string} command - The shell command to execute remotely.
 * @returns {Promise<stream>} - Resolves with the SSH stream (with .stderr).
 */
function sshExecStream(command) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                // When the stream closes, end the connection
                stream.on('close', () => conn.end());
                resolve(stream);
            });
        })
            .on('error', reject)
            .connect(getSSHConfig());
    });
}

module.exports = {
    sshExec,
    sshReadFile,
    sshWriteFile,
    sshExecStream,
    getSSHConfig,
    Client,
};
