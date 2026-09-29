#!/usr/bin/env bash

# MiroTalk Admin installer for Ubuntu 22.04 and 24.04.
# Run from the repository root with: sudo ./install.sh

set -Eeuo pipefail

readonly NODE_MAJOR=24
readonly CONFIG_FILE='backend/config/index.js'
readonly CONFIG_TEMPLATE='backend/config/index.template.js'
readonly ENV_FILE='.env'
readonly ENV_TEMPLATE='.env.template'

log() {
    printf '%s :: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
    log "$*" >&2
    exit 1
}

on_error() {
    local exit_code=$?
    die "Installation failed near line ${BASH_LINENO[0]} (exit ${exit_code})."
}

trap on_error ERR

copy_if_missing() {
    local source_file="$1"
    local destination_file="$2"

    if [[ -e "$destination_file" ]]; then
        log "Keeping existing ${destination_file}"
        return
    fi

    cp "$source_file" "$destination_file"
    if [[ -n "${SUDO_UID:-}" && -n "${SUDO_GID:-}" ]]; then
        chown "$SUDO_UID:$SUDO_GID" "$destination_file"
    fi
    log "Created ${destination_file} from ${source_file}"
}

run_as_project_user() {
    if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != 'root' ]]; then
        sudo -u "$SUDO_USER" -- "$@"
    else
        "$@"
    fi
}

install_dependencies() {
    log 'Installing system dependencies'
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        python3 \
        make \
        g++
}

install_nodejs() {
    local installed_major=0

    if command -v node >/dev/null 2>&1; then
        installed_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
    fi

    if (( installed_major >= NODE_MAJOR )); then
        log "Node.js $(node --version) already satisfies the requirement"
        return
    fi

    log "Installing Node.js ${NODE_MAJOR}.x"
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
    printf 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_%s.x nodistro main\n' "$NODE_MAJOR" \
        > /etc/apt/sources.list.d/nodesource.list
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
}

[[ "$(uname -s)" == 'Linux' ]] || die 'This installer supports Linux only.'
[[ "$EUID" -eq 0 ]] || die 'Run this installer as root: sudo ./install.sh'
[[ -r /etc/os-release ]] || die 'Unable to identify this Linux distribution.'

. /etc/os-release
[[ "${ID:-}" == 'ubuntu' ]] || die 'This installer currently supports Ubuntu only.'
[[ "${VERSION_ID:-}" == '22.04' || "${VERSION_ID:-}" == '24.04' ]] || \
    log "Ubuntu ${VERSION_ID:-unknown} has not been tested; continuing anyway."

cd "$(dirname "${BASH_SOURCE[0]}")"
[[ -f package.json && -f package-lock.json && -f "$CONFIG_TEMPLATE" && -f "$ENV_TEMPLATE" ]] || \
    die 'Run this script from a complete MiroTalk Admin checkout.'

log "MiroTalk Admin installer on Ubuntu ${VERSION_ID:-unknown}"
install_dependencies
install_nodejs

command -v node >/dev/null 2>&1 || die 'Node.js installation failed.'
command -v npm >/dev/null 2>&1 || die 'npm installation failed.'

copy_if_missing "$CONFIG_TEMPLATE" "$CONFIG_FILE"
copy_if_missing "$ENV_TEMPLATE" "$ENV_FILE"

log 'Installing npm dependencies from the lockfile'
run_as_project_user npm ci

log 'Starting MiroTalk Admin (press Ctrl+C to stop)'
run_as_project_user npm start