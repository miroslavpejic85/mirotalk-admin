#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: backend/scripts/getSshHostFingerprint.sh <host> [port] [key_type]

Examples:
  backend/scripts/getSshHostFingerprint.sh example.com
  backend/scripts/getSshHostFingerprint.sh example.com 2222
  backend/scripts/getSshHostFingerprint.sh example.com 22 rsa

Arguments:
  host      SSH server hostname or IP
  port      SSH port (default: 22)
  key_type  Host key type for ssh-keyscan (default: ed25519)
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

if [[ $# -lt 1 || $# -gt 3 ]]; then
    usage >&2
    exit 1
fi

host="$1"
port="${2:-22}"
key_type="${3:-ed25519}"

if ! [[ "$port" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
    echo "Error: port must be a number between 1 and 65535." >&2
    exit 1
fi

if ! command -v ssh-keyscan >/dev/null 2>&1; then
    echo "Error: ssh-keyscan not found. Please install OpenSSH client tools." >&2
    exit 1
fi

if ! command -v ssh-keygen >/dev/null 2>&1; then
    echo "Error: ssh-keygen not found. Please install OpenSSH client tools." >&2
    exit 1
fi

scan_output="$(ssh-keyscan -p "$port" -t "$key_type" "$host" 2>/dev/null || true)"
if [[ -z "$scan_output" ]]; then
    echo "Error: unable to fetch host key from $host:$port with key type '$key_type'." >&2
    echo "Tip: verify host/port reachability and key type (ed25519, rsa, ecdsa)." >&2
    exit 1
fi

fingerprint_line="$(printf '%s\n' "$scan_output" | ssh-keygen -lf - -E sha256 | head -n1)"
fingerprint_value="$(printf '%s\n' "$fingerprint_line" | awk '{print $2}')"

if [[ -z "$fingerprint_value" ]]; then
    echo "Error: failed to extract SHA-256 fingerprint." >&2
    exit 1
fi

echo "SSH host fingerprint for $host:$port ($key_type):"
echo "$fingerprint_value"
echo
echo "Set this in your .env:"
echo "SSH_HOST_FINGERPRINT_SHA256=$fingerprint_value"
