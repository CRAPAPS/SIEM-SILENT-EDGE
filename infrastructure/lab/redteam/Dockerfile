FROM kalilinux/kali-rolling:latest

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    metasploit-framework nmap nikto sqlmap \
    curl wget git python3 python3-pip \
    hydra john dirb gobuster \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Initialize Metasploit database (SQLite fallback if PostgreSQL unavailable)
RUN msfdb init || true

# Create output and persistence directories
RUN mkdir -p /root/.msf4 /output/redteam /opt/shel/scripts

# SHEL INFOSEC proprietary assessment scripts
COPY scripts/ /opt/shel/scripts/
RUN chmod +x /opt/shel/scripts/*.sh 2>/dev/null || true

VOLUME ["/root/.msf4", "/output"]

# Keep container alive — tasks are dispatched via docker exec
CMD ["/bin/bash", "-c", "while true; do sleep 3600; done"]
