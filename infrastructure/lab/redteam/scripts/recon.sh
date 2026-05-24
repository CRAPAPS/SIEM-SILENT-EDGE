#!/bin/bash
# SHEL INFOSEC — Defensive Recon Script
# Usage: recon.sh <target-ip-or-cidr>
# Runs a safe service + version scan and writes JSON to /output/redteam/recon_<ts>.json

TARGET="${1:?Usage: recon.sh <target>}"
OUTFILE="/output/redteam/recon_$(date +%s).json"

echo "[*] SHEL/INFOSEC Recon — target: $TARGET"
nmap -sV -sC -O --open -oJ "$OUTFILE" "$TARGET" 2>/dev/null || \
  nmap -sV --open -oN /dev/stdout "$TARGET" | tee "${OUTFILE%.json}.txt"

echo "[+] Results: $OUTFILE"
