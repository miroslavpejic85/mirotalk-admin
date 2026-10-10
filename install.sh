#!/usr/bin/env bash

# MiroTalk Admin installer for Ubuntu 22.04 and 24.04.
# Run from the repository root with: sudo ./install.sh

set -Eeuo pipefail

readonly NODE_MAJOR=24
readonly CONFIG_FILE='backend/config/index.js'
readonly CONFIG_TEMPLATE='backend/config/index.template.js'
readonly ENV_FILE='.env'
readonly ENV_TEMPLATE='.env.template'
readonly DEFAULT_ADMIN_PASSWORD_HASH='$2b$10$h5m4gYHTowNMAAAgqT1rO.kOkFBwrKIG1sYCyDp2HPPjkhEKLFxWy'
readonly DEFAULT_ADMIN_JWT_SECRET='supersecret'
readonly DEFAULT_SSH_HOST_FINGERPRINT='SHA256:***'

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
        openssh-client \
        python3 \
        make \
        g++
}

warn() {
    log "WARNING: $*"
}

trim_wrapping_quotes() {
    local value="$1"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
    fi
    printf '%s' "$value"
}

get_env_value() {
    local key="$1"
    local line
    line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 || true)"
    if [[ -z "$line" ]]; then
        return 1
    fi
    printf '%s' "${line#*=}"
}

escape_sed_replacement() {
    printf '%s' "$1" | sed -e 's/[&|\\]/\\&/g'
}

set_env_value() {
    local key="$1"
    local value="$2"
    local escaped_value
    escaped_value="$(escape_sed_replacement "$value")"

    if grep -qE "^${key}=" "$ENV_FILE"; then
        sed -i -E "s|^${key}=.*$|${key}=${escaped_value}|" "$ENV_FILE"
    else
        printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    fi
}

generate_admin_jwt_secret_if_default() {
    local raw_current
    local current
    raw_current="$(get_env_value 'ADMIN_JWT_SECRET' || true)"
    current="$(trim_wrapping_quotes "$raw_current")"

    if [[ -n "$current" && "$current" != "$DEFAULT_ADMIN_JWT_SECRET" ]]; then
        log 'Keeping existing ADMIN_JWT_SECRET'
        return
    fi

    local jwt_secret
    jwt_secret="$(run_as_project_user node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
    set_env_value 'ADMIN_JWT_SECRET' "$jwt_secret"
    log 'Generated ADMIN_JWT_SECRET'
}

choose_admin_password() {
    if [[ -t 0 ]]; then
        local first_input
        local second_input

        while true; do
            read -r -s -p 'Enter admin dashboard password: ' first_input
            printf '\n'
            read -r -s -p 'Confirm admin dashboard password: ' second_input
            printf '\n'

            [[ -n "$first_input" ]] || {
                warn 'Password cannot be empty. Try again.'
                continue
            }
            [[ "$first_input" == "$second_input" ]] || {
                warn 'Passwords do not match. Try again.'
                continue
            }

            printf '%s' "$first_input"
            return
        done
    fi

    run_as_project_user node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
}

generate_admin_password_hash_if_default() {
    local raw_current
    local current
    raw_current="$(get_env_value 'ADMIN_PASSWORD_HASH' || true)"
    current="$(trim_wrapping_quotes "$raw_current")"

    if [[ -n "$current" && "$current" != "$DEFAULT_ADMIN_PASSWORD_HASH" ]]; then
        log 'Keeping existing ADMIN_PASSWORD_HASH'
        return
    fi

    local admin_password
    local admin_password_hash
    admin_password="$(choose_admin_password)"
    admin_password_hash="$(run_as_project_user env ADMIN_PLAIN_PASSWORD="$admin_password" \
        node -e "const bcrypt=require('bcrypt'); console.log(bcrypt.hashSync(process.env.ADMIN_PLAIN_PASSWORD, 10));")"

    set_env_value 'ADMIN_PASSWORD_HASH' "'$admin_password_hash'"
    log 'Generated ADMIN_PASSWORD_HASH'

    if [[ -t 0 ]]; then
        log 'Admin password hash updated from your provided password.'
    else
        warn "Non-interactive shell detected. Generated admin password: ${admin_password}"
        warn 'Save this password now; it is not shown again.'
    fi
}

generate_ssh_host_fingerprint_if_needed() {
    local raw_manage_mode
    local manage_mode
    raw_manage_mode="$(get_env_value 'APP_MANAGE_MODE' || true)"
    manage_mode="$(trim_wrapping_quotes "$raw_manage_mode")"

    if [[ "$manage_mode" != 'ssh' ]]; then
        log 'Skipping SSH host fingerprint generation (APP_MANAGE_MODE is not ssh).'
        return
    fi

    local raw_current
    local current
    raw_current="$(get_env_value 'SSH_HOST_FINGERPRINT_SHA256' || true)"
    current="$(trim_wrapping_quotes "$raw_current")"
    if [[ -n "$current" && "$current" != "$DEFAULT_SSH_HOST_FINGERPRINT" ]]; then
        log 'Keeping existing SSH_HOST_FINGERPRINT_SHA256'
        return
    fi

    local raw_host raw_port ssh_host ssh_port fingerprint_line fingerprint_value
    raw_host="$(get_env_value 'SSH_HOST' || true)"
    raw_port="$(get_env_value 'SSH_PORT' || true)"
    ssh_host="$(trim_wrapping_quotes "$raw_host")"
    ssh_port="$(trim_wrapping_quotes "$raw_port")"
    ssh_port="${ssh_port:-22}"

    if [[ -z "$ssh_host" ]]; then
        warn 'SSH_HOST is empty; cannot auto-generate SSH_HOST_FINGERPRINT_SHA256.'
        return
    fi

    if ! [[ "$ssh_port" =~ ^[0-9]+$ ]] || ((ssh_port < 1 || ssh_port > 65535)); then
        warn "SSH_PORT '${ssh_port}' is invalid; cannot auto-generate SSH_HOST_FINGERPRINT_SHA256."
        return
    fi

    fingerprint_line="$(
        bash backend/scripts/getSshHostFingerprint.sh "$ssh_host" "$ssh_port" 2>/dev/null \
            | grep '^SSH_HOST_FINGERPRINT_SHA256=' \
            | tail -n1 || true
    )"
    fingerprint_value="${fingerprint_line#SSH_HOST_FINGERPRINT_SHA256=}"

    if [[ -z "$fingerprint_value" ]]; then
        warn "Unable to auto-generate SSH_HOST_FINGERPRINT_SHA256 from ${ssh_host}:${ssh_port}."
        warn 'Set SSH_HOST/SSH_PORT correctly, then run backend/scripts/getSshHostFingerprint.sh manually.'
        return
    fi

    set_env_value 'SSH_HOST_FINGERPRINT_SHA256' "$fingerprint_value"
    log "Generated SSH_HOST_FINGERPRINT_SHA256 for ${ssh_host}:${ssh_port}"
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
generate_admin_password_hash_if_default
generate_admin_jwt_secret_if_default
generate_ssh_host_fingerprint_if_needed

log 'Starting MiroTalk Admin (press Ctrl+C to stop)'
run_as_project_user npm start