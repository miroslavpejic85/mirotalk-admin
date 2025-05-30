/**
 * System Module
 * -------------
 * Handles loading and displaying system information (OS, CPU, memory, disk, network, dependencies)
 * in the admin dashboard. Exposes loadSystemInfo on the global Dashboard object.
 *
 * @module dashboard/system
 */
(function () {
    'use strict';

    /**
     * Load system information from the backend and update the UI.
     * Populates OS, CPU, memory, disk, network, and dependency info.
     */
    async function loadSystemInfo() {
        showLoader();
        try {
            const info = await apiGetSystemInfo();
            $('sys-os-type').textContent = info.os.type;
            $('sys-os-arch').textContent = info.os.arch;
            $('sys-cpu-model').textContent = info.cpu.model;
            $('sys-cpu-cores').textContent = info.cpu.cores;
            if (info.memory) {
                $('sys-mem-total').textContent = info.memory.total;
                $('sys-swap-total').textContent = info.memory.swap;
                $('sys-swap-free').textContent = info.memory.swapFree;
            }
            if (info.system) {
                $('sys-time').textContent = info.system.time;
                $('sys-uptime').textContent = info.system.uptime;
                $('sys-load').textContent = info.system.load;
            }
            if (info.disk) {
                $('sys-disk-total').textContent = info.disk.total;
                $('sys-disk-free').textContent = info.disk.free;
                $('sys-disk-used').textContent = info.disk.used;
            }
            $('sys-network-body').innerHTML = '';
            $('sys-network-body').innerHTML = Object.entries(info.network)
                .map(([iface, addrs]) =>
                    addrs
                        .map(
                            (addr) => `
                        <tr>
                            <td>${iface}</td>
                            <td>${addr.address}</td>
                            <td>${addr.family}</td>
                            <td>${addr.internal ? 'Yes' : 'No'}</td>
                        </tr>
                    `
                        )
                        .join('')
                )
                .join('');
            if (info.dependencies) {
                $('sys-dependencies-body').innerHTML = '';
                $('sys-dependencies-body').innerHTML = Object.entries(info.dependencies)
                    .map(
                        ([dep, val]) => `
                        <tr>
                            <td>${dep}</td>
                            <td>
                                ${val.installed ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-danger">No</span>'}
                            </td>
                            <td>${val.version ? val.version : '-'}</td>
                        </tr>
                    `
                    )
                    .join('');
            }
        } catch (error) {
            handleError(error, 'Failed to load system info.');
        } finally {
            hideLoader();
        }
    }

    window.Dashboard = window.Dashboard || {};
    window.Dashboard.loadSystemInfo = loadSystemInfo;
})();
