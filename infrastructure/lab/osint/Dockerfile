FROM kalilinux/kali-rolling:latest

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip git nmap curl wget \
    theharvester amass dnsutils whois \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# SpiderFoot OSINT automation framework
RUN git clone --depth=1 https://github.com/smicallef/spiderfoot.git /opt/spiderfoot \
    && pip3 install -r /opt/spiderfoot/requirements.txt \
       --break-system-packages --quiet

# Create persistent data directories
RUN mkdir -p /root/.spiderfoot /output/spiderfoot /output/maltego /output/scans

# Maltego CE: persistent config volume (user populates via VNC/GUI connection)
# The /root/.maltego volume preserves license + transforms between container restarts
VOLUME ["/root/.spiderfoot", "/root/.maltego", "/output"]

WORKDIR /opt/spiderfoot

# SpiderFoot REST API + web interface
EXPOSE 5001

CMD ["python3", "sf.py", "-l", "0.0.0.0:5001", "-d", "/root/.spiderfoot"]
