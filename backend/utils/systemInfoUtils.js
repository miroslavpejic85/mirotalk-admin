'use strict';

/**
 * System Info Utilities
 * ---------------------
 * Provides functions to gather system information (OS, CPU, memory, disk, network, dependencies)
 * for the admin dashboard, both locally and via SSH.
 *
 * @module utils/systemInfoUtils
 */

const os = require('os');
const { execSync } = require('child_process');
const { getAppDependencies, checkDependency } = require('./dependencyUtils');
const { sshExec, sshReadFile } = require('./sshUtils');
const config = require('../config');
const { APP_MANAGE_MODE } = config;

/**
 * Format uptime in a human-readable way.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    return `up ${parts.join(', ')}`;
}

function getDiskInfo() {
    try {
        const output = execSync('df -h / | tail -1', {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
        const parts = output.split(/\s+/);
        if (parts.length >= 5) {
            return { total: parts[1], free: parts[3], used: parts[4] };
        }
    } catch (e) {}
    return { total: 'n/a', free: 'n/a', used: 'n/a' };
}

function getSwapInfo() {
    try {
        const output = execSync('free -g | grep Swap', {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
        const parts = output.split(/\s+/);
        if (parts.length >= 3) {
            return { total: parts[1] + 'G', free: parts[3] + 'G' };
        }
    } catch (e) {}
    return { total: 'n/a', free: 'n/a' };
}

/**
 * Get system info locally.
 * @returns {object}
 */
function getSystemInfoLocal() {
    const dependencies = {};
    getAppDependencies().forEach((dep) => {
        const [cmd, versionArg, parseVersion] = dep.local;
        dependencies[dep.name] = checkDependency(cmd, versionArg, parseVersion);
    });

    const disk = getDiskInfo();
    const swap = getSwapInfo();

    return {
        os: {
            type: os.platform() === 'darwin' ? 'Mac OS' : os.platform() === 'win32' ? 'Windows' : 'Linux',
            arch: os.arch(),
        },
        cpu: {
            cores: os.cpus().length,
            model: os.cpus()[0].model,
        },
        memory: {
            total: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            swap: swap.total,
            swapFree: swap.free,
        },
        system: {
            time: new Date().toLocaleString(),
            uptime: formatUptime(os.uptime()),
            load: os
                .loadavg()
                .map((n) => n.toFixed(2))
                .join(' '),
        },
        disk,
        network: os.networkInterfaces(),
        dependencies,
    };
}

/**
 * Parse SSH system info output into flat info and network object.
 * @param {string} output
 * @returns {{flat: object, network: object}}
 */
function parseSSHSystemInfo(output) {
    const flat = {};
    const network = {};
    output.split('\n').forEach((line) => {
        if (line.startsWith('network_iface:')) {
            const parts = line.split('|').reduce((acc, part) => {
                const [k, v] = part.split(':');
                acc[k] = v;
                return acc;
            }, {});
            if (!network[parts.network_iface]) network[parts.network_iface] = [];
            network[parts.network_iface].push({
                address: parts.address,
                family: parts.family === 'inet' ? 'IPv4' : parts.family === 'inet6' ? 'IPv6' : parts.family,
                internal: parts.internal === 'true',
            });
        } else {
            const [key, ...rest] = line.split(':');
            if (key && rest.length) flat[key.trim()] = rest.join(':').trim();
        }
    });
    return { flat, network };
}

/**
 * Get dependency versions via SSH in a parse-friendly way.
 * @returns {Promise<Object>}
 */
async function getSSHDependencies() {
    const nvmInit = 'export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; ';
    const shellInit = '. /etc/profile >/dev/null 2>&1; . ~/.profile >/dev/null 2>&1; . ~/.bashrc >/dev/null 2>&1; ';
    const checks = getAppDependencies()
        .map(
            (dep) =>
                `if command -v ${dep.name === 'gpp' ? 'g++' : dep.name} >/dev/null 2>&1; then echo "${dep.name}:installed:$(${dep.cmd} 2>/dev/null | tr -d '\\n')"; else echo "${dep.name}:not_installed:"; fi`
        )
        .join('; ');

    const script = nvmInit + shellInit + checks;

    const output = await sshExec(script);

    const dependencies = {};
    output.split('\n').forEach((line) => {
        if (!line.trim()) return;
        const [name, status, ...rest] = line.split(':');
        if (!name) return;
        const version = rest.join(':').trim();
        dependencies[name] = {
            installed: status === 'installed',
            version: status === 'installed' && version ? version : null,
        };
    });

    return dependencies;
}

/**
 * Get system info via SSH.
 * @returns {Promise<object>}
 */
async function getSystemInfoSSH() {
    const cmd = `
        echo "system_time:$(date)"
        echo "os_type:$(uname -s)"
        echo "os_arch:$(uname -m)"
        echo "cpu_cores:$(nproc)"
        echo "cpu_model:$(grep -m 1 'model name' /proc/cpuinfo | cut -d: -f2 | xargs)"
        echo "memory_total:$(free -h | awk '/^Mem:/ {print $2}')"
        echo "swap_total:$(free -g | awk '/^Swap:/ {print $2 "G"}')"
        echo "swap_free:$(free -g | awk '/^Swap:/ {print $4 "G"}')"
        echo "uptime:$(uptime -p)"
        echo "hostname:$(hostname)"
        echo "disk_total:$(df -h / | awk 'NR==2 {print $2}')"
        echo "disk_free:$(df -h / | awk 'NR==2 {print $4}')"
        echo "disk_used_percent:$(df -h / | awk 'NR==2 {print $5}')"
        echo "load_avg:1min=$(cat /proc/loadavg | awk '{print $1}'), 5min=$(cat /proc/loadavg | awk '{print $2}'), 15min=$(cat /proc/loadavg | awk '{print $3}')"
        ip -o addr | awk '
            {
                iface=$2; family=$3; addr=$4;
                internal=(iface=="lo")?"true":"false";
                split(addr, a, "/");
                printf "network_iface:%s|address:%s|family:%s|internal:%s\\n", iface, a[1], family, internal
            }
        '
    `;
    const output = await sshExec(cmd);
    const { flat, network } = parseSSHSystemInfo(output);

    if (!flat) {
        throw new Error('Failed to parse SSH system info');
    }

    return {
        os: {
            type: flat.os_type || 'n/a',
            arch: flat.os_arch || 'n/a',
        },
        cpu: {
            cores: flat.cpu_cores ? Number(flat.cpu_cores) : null,
            model: flat.cpu_model || 'n/a',
        },
        memory: {
            total: flat.memory_total || 'n/a',
            swap: flat.swap_total || 'n/a',
            swapFree: flat.swap_free || 'n/a',
        },
        disk: {
            total: flat.disk_total || 'n/a',
            free: flat.disk_free || 'n/a',
            used: flat.disk_used_percent || 'n/a',
        },
        system: {
            time: flat.system_time || 'n/a',
            uptime: flat.uptime || 'n/a',
            load: flat.load_avg || 'n/a',
        },
        network,
        dependencies: await getSSHDependencies(),
    };
}

/**
 * Get current system information (OS, CPU, memory, uptime, network, dependencies).
 * @returns {Promise<Object>}
 */
async function getSystemInfo() {
    if (APP_MANAGE_MODE === 'ssh') {
        return getSystemInfoSSH();
    }
    return getSystemInfoLocal();
}

module.exports = {
    getSystemInfo,
    getSystemInfoLocal,
    getSSHDependencies,
    formatUptime,
};
