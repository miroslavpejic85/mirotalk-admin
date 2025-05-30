'use strict';

/**
 * Logs Utility
 * -----------
 * Enhanced logging utility for consistent, colorized, and timestamped logs.
 * Supports debug, info, warn, error, and trace levels with optional color output.
 * Used throughout the admin dashboard backend for structured logging.
 *
 * @module utils/logsUtils
 */

const util = require('util');
const colors = require('colors/safe');
const config = require('../config');

const { LOGS_DEBUG, LOGS_COLORS, TZ } = config;

if (LOGS_COLORS) colors.enable();
else colors.disable();

const options = {
    depth: null,
    colors: LOGS_COLORS,
};

/**
 * Enhanced logging utility for consistent, colorized, and timestamped logs.
 */
class Logs {
    /**
     * @param {string} appName - Name to display in log prefix.
     * @param {string} [level='debug'] - Minimum log level to output.
     */
    constructor(appName = 'MiroTalkAdmin', level = 'debug') {
        this.appName = LOGS_COLORS ? colors.yellow(appName) : appName;
        this.debugOn = LOGS_DEBUG;
        this.timeStart = Date.now();
        this.tzOptions = {
            timeZone: TZ || 'UTC',
            hour12: false,
        };
        this.level = level;
    }

    /**
     * Determine if a log should be output based on the current level.
     * @param {string} level
     * @returns {boolean}
     */
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }

    /**
     * Print a debug log if debug is enabled.
     * @param {string} msg - Message to log.
     * @param {object} [op] - Optional object to inspect.
     */
    debug(msg, op = '') {
        if (this.debugOn && this.shouldLog('debug')) {
            const timeElapsed = this._getElapsed();
            console.debug(`[${this._getDateTime()}] [${this.appName}] ${msg}`, util.inspect(op, options), timeElapsed);
        }
    }

    /**
     * Print a standard log.
     * @param {string} msg - Message to log.
     * @param {object} [op] - Optional object to inspect.
     */
    log(msg, op = '') {
        if (this.shouldLog('debug')) {
            console.log(`[${this._getDateTime()}] [${this.appName}] ${msg}`, util.inspect(op, options));
        }
    }

    /**
     * Print an info log (green).
     * @param {string} msg - Message to log.
     * @param {object} [op] - Optional object to inspect.
     */
    info(msg, op = '') {
        if (this.shouldLog('info')) {
            console.info(
                `[${this._getDateTime()}] [${this.appName}] ${LOGS_COLORS ? colors.green(msg) : msg}`,
                util.inspect(op, options)
            );
        }
    }

    /**
     * Print a warning log (yellow).
     * @param {string} msg - Message to log.
     * @param {object} [op] - Optional object to inspect.
     */
    warn(msg, op = '') {
        if (this.shouldLog('warn')) {
            console.warn(
                `[${this._getDateTime()}] [${this.appName}] ${LOGS_COLORS ? colors.yellow(msg) : msg}`,
                util.inspect(op, options)
            );
        }
    }

    /**
     * Print an error log (red).
     * @param {string} msg - Message to log.
     * @param {object} [op] - Optional object to inspect.
     */
    error(msg, op = '') {
        if (this.shouldLog('error')) {
            console.error(
                `[${this._getDateTime()}] [${this.appName}] ${LOGS_COLORS ? colors.red(msg) : msg}`,
                util.inspect(op, options)
            );
        }
    }

    /**
     * Print a trace log (gray) with stack trace.
     * @param {string} msg - Message to log.
     * @param {object} [op] - Optional object to inspect.
     */
    trace(msg, op = '') {
        if (this.shouldLog('debug')) {
            console.trace(
                `[${this._getDateTime()}] [${this.appName}] ${LOGS_COLORS ? colors.gray(msg) : msg}`,
                util.inspect(op, options)
            );
        }
    }

    /**
     * Get the current date/time string with milliseconds.
     * @returns {string}
     * @private
     */
    _getDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleString('en-US', this.tzOptions);
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return LOGS_COLORS ? colors.cyan(`${dateStr}:${ms}`) : `${dateStr}:${ms}`;
    }

    /**
     * Get formatted elapsed time since last log.
     * @returns {string}
     * @private
     */
    _getElapsed() {
        const now = Date.now();
        const ms = now - this.timeStart;
        this.timeStart = now;
        let time = ms;
        let unit = 'ms';
        if (ms >= 3600000) {
            time = (ms / 3600000).toFixed(2);
            unit = 'h';
        } else if (ms >= 60000) {
            time = (ms / 60000).toFixed(2);
            unit = 'm';
        } else if (ms >= 1000) {
            time = (ms / 1000).toFixed(2);
            unit = 's';
        }
        return LOGS_COLORS ? colors.magenta(`+${time}${unit}`) : `+${time}${unit}`;
    }
}

module.exports = Logs;
