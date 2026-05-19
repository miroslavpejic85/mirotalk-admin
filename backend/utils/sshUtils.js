'use strict';

/**
 * SSH Utilities
 * -------------
 * Provides functions to execute commands and read/write files over SSH.
 * Used for remote management of the backend application and file operations.
 *
 * @module utils/sshUtils
 */

const crypto = require('crypto');
const { Client } = require('ssh2');
const config = require('../config');

const { SSH_HOST, SSH_PORT, SSH_USER, SSH_PASSWORD, SSH_PRIVATE_KEY, SSH_HOST_FINGERPRINT_SHA256 } = config;

/**
 * Normalize an operator-supplied SHA-256 host-key fingerprint.
 *
 * Accepts any of the common representations:
 *   - `SHA256:<base64-nopad>`  (output of `ssh-keygen -lf - -E sha256`)
 *   - raw base64 (with or without padding)
 *   - hex (64 chars, with or without colons)
 *
 * @param {string} raw
 * @returns {{ kind: 'base64'|'hex', value: string }|null}
 */
function parseFingerprint(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let v = raw.trim();
    // Accept the full `ssh-keygen -lf - -E sha256` output, e.g.:
    //   "256 SHA256:abc...xyz user@host (ED25519)"
    // by extracting the `SHA256:<value>` token from anywhere in the string.
    const m = v.match(/SHA256:([A-Za-z0-9+/=]+)/i);
    if (m) return { kind: 'base64', value: m[1].replace(/=+$/, '') };
    const hex = v.replace(/:/g, '').replace(/\s+/g, '').toLowerCase();
    if (/^[0-9a-f]{64}$/.test(hex)) return { kind: 'hex', value: hex };
    // assume base64
    return { kind: 'base64', value: v.replace(/\s+/g, '').replace(/=+$/, '') };
}

/**
 * Constant-time comparison of two strings of equal length.
 * Returns false for any length mismatch without short-circuiting on contents.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeEqual(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

/**
 * Build a `hostVerifier` callback that pins the remote host key against the
 * operator-configured SHA-256 fingerprint.
 *
 * ssh2 invokes the verifier with the raw host-key Buffer (because we do NOT
 * set `hostHash`), so we compute sha256 ourselves and compare against the
 * configured value in constant time. Returning false rejects the connection.
 *
 * @param {{ kind: string, value: string }} expected
 * @returns {(key: Buffer) => boolean}
 */
function makeHostVerifier(expected) {
    return (key) => {
        if (!Buffer.isBuffer(key)) return false;
        const digest = crypto.createHash('sha256').update(key).digest();
        const got = expected.kind === 'hex' ? digest.toString('hex') : digest.toString('base64').replace(/=+$/, '');
        return safeEqual(got, expected.value);
    };
}

/**
 * Get SSH connection configuration from environment/config.
 * Uses private key if available, otherwise falls back to password.
 *
 * Security: this function REQUIRES `SSH_HOST_FINGERPRINT_SHA256` to be set
 * and verifies the remote host key on every connection via `hostVerifier`.
 * Without this, ssh2 silently accepts any host key, enabling a network
 * attacker to MITM the admin↔managed-host channel and harvest the
 * `SSH_PASSWORD` / rewrite executed commands. See CWE-322.
 *
 * @returns {Object} SSH connection config
 */
function getSSHConfig() {
    const expected = parseFingerprint(SSH_HOST_FINGERPRINT_SHA256);
    if (!expected) {
        throw new Error(
            'SSH_HOST_FINGERPRINT_SHA256 is required when APP_MANAGE_MODE=ssh. ' +
                'Obtain it with: ssh-keyscan -t ed25519 <host> | ssh-keygen -lf - -E sha256'
        );
    }
    const configObj = {
        host: SSH_HOST,
        port: SSH_PORT,
        username: SSH_USER,
        hostVerifier: makeHostVerifier(expected),
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
