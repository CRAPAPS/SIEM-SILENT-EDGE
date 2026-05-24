#!/bin/bash
# Run once on KVM 4 as root before starting docker-compose.lab.yml
# Creates the bind-mount host directories for lab persistent volumes

set -e

LAB_ROOT="/opt/silent-edge/lab"

mkdir -p \
  "$LAB_ROOT/osint/maltego" \
  "$LAB_ROOT/osint/spiderfoot" \
  "$LAB_ROOT/osint/output" \
  "$LAB_ROOT/redteam/msf4" \
  "$LAB_ROOT/redteam/output"

chmod -R 755 "$LAB_ROOT"

echo "[+] Lab directories initialised at $LAB_ROOT"
echo ""
echo "Next steps:"
echo "  1. Generate lab secret:  openssl rand -hex 32"
echo "  2. Set in .env.local:    LAB_GATEWAY_SECRET=<output>"
echo "  3. Start lab compose:    docker compose -f docker-compose.yml -f docker-compose.lab.yml up -d"
echo "  4. Apply UFW rules:      bash infrastructure/lab/security/ufw-init.sh"
