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
                if (info.system.load) {
                    const loadText = info.system.load
                        .replace('1min=', 'Last 1 min: ')
                        .replace(', 5min=', ' | 5 min: ')
                        .replace(', 15min=', ' | 15 min: ');
                    $('sys-load').textContent = loadText;
                }
            }
            if (info.disk) {
                $('sys-disk-total').textContent = info.disk.total;
                $('sys-disk-free').textContent = info.disk.free;
                $('sys-disk-used').textContent = info.disk.used;
            }
            // Safely populate network interfaces table
            const networkBody = $('sys-network-body');
            networkBody.textContent = ''; // Clear existing content
            Object.entries(info.network).forEach(([iface, addrs]) => {
                addrs.forEach((addr) => {
                    const row = document.createElement('tr');

                    const ifaceCell = document.createElement('td');
                    ifaceCell.textContent = iface;
                    row.appendChild(ifaceCell);

                    const addressCell = document.createElement('td');
                    addressCell.textContent = addr.address;
                    row.appendChild(addressCell);

                    const familyCell = document.createElement('td');
                    familyCell.textContent = addr.family;
                    row.appendChild(familyCell);

                    const internalCell = document.createElement('td');
                    internalCell.textContent = addr.internal ? 'Yes' : 'No';
                    row.appendChild(internalCell);

                    networkBody.appendChild(row);
                });
            });
            if (info.dependencies) {
                // Safely populate dependencies table
                const depsBody = $('sys-dependencies-body');
                depsBody.textContent = ''; // Clear existing content
                Object.entries(info.dependencies).forEach(([dep, val]) => {
                    const row = document.createElement('tr');

                    const depCell = document.createElement('td');
                    depCell.textContent = dep;
                    row.appendChild(depCell);

                    const installedCell = document.createElement('td');
                    const badge = document.createElement('span');
                    badge.className = val.installed ? 'badge bg-success' : 'badge bg-danger';
                    badge.textContent = val.installed ? 'Yes' : 'No';
                    installedCell.appendChild(badge);
                    row.appendChild(installedCell);

                    const versionCell = document.createElement('td');
                    versionCell.textContent = val.version ? val.version : '-';
                    row.appendChild(versionCell);

                    depsBody.appendChild(row);
                });
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
