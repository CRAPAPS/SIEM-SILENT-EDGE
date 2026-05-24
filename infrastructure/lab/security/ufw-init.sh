#!/bin/bash
# Silent Edge Tactical Lab — UFW + Fail2Ban initialisation
# Run once on KVM 4 as root AFTER both compose stacks are up.
# Requires: ufw fail2ban
#
# Lab subnet:        172.30.0.0/16  (lab-net)
# Production subnet: 172.28.0.0/16  (silent-edge)

set -e

echo "[*] Configuring UFW lab isolation rules..."

# Block lab containers from reaching any production service directly
ufw insert 1 deny from 172.30.0.0/16 to 172.28.0.0/16 \
  comment "lab-to-prod-block"

# Ensure lab gateway port is only reachable from the production subnet
# (the gateway is attached to silent-edge network at a 172.28.x.x address)
ufw allow from 172.28.0.0/16 to any port 9100 proto tcp \
  comment "studio-to-lab-gateway"

# Block lab → gateway port from general internet
ufw deny from any to any port 9100 proto tcp \
  comment "deny-external-lab-gateway"

# Allow lab containers to reach the internet for OSINT (outbound only)
# Drop inbound connections initiated externally to lab subnet
ufw deny in from any to 172.30.0.0/16 \
  comment "block-external-to-lab"

ufw reload
echo "[+] UFW rules applied."

# ── Fail2Ban config ──────────────────────────────────────────

FAIL2BAN_JAIL=/etc/fail2ban/jail.d/lab.conf

cat > "$FAIL2BAN_JAIL" << 'EOF'
[lab-ssh-flood]
enabled  = true
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
findtime = 300
bantime  = 3600
# Extra: if lab IP range floods SSH, block immediately
ignoreip = 127.0.0.1/8 172.28.0.0/16

[lab-scan-flood]
enabled  = true
filter   = lab-scan
logpath  = /var/log/syslog
maxretry = 3
findtime = 60
bantime  = 1800
EOF

# Lab scan filter (matches kernel NFLOG or custom log from iptables)
cat > /etc/fail2ban/filter.d/lab-scan.conf << 'EOF'
[Definition]
failregex = SRC=172\.30\.\d+\.\d+ .*DPT=22
ignoreregex =
EOF

systemctl restart fail2ban 2>/dev/null || service fail2ban restart
echo "[+] Fail2Ban lab jail configured."
echo "[*] Done. Run 'ufw status numbered' to verify."
