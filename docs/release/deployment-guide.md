# MobiMatch VPS Deployment Guide

This guide outlines how to deploy the MobiMatch backend API, PostgreSQL database, and Redis cache onto a single low-cost VPS (Ubuntu 22.04/24.04 LTS).

---

## 1. Server Sizing & Prerequisites

- **CPU / RAM**: Minimum 1 vCPU, 2 GB RAM (4 GB recommended).
- **Storage**: 25 GB+ SSD.
- **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS.
- **Domain**: A registered domain or subdomain pointing to the server IP (e.g. `api.mobimatch.example.com`).

---

## 2. Server Hardening & Firewall

Connect via SSH and configure UFW firewall to expose only SSH and web ports:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw curl git gzip

# Allow SSH and Web traffic
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

*Note: PostgreSQL (5432) and Redis (6379) must never be opened in UFW.*

---

## 3. Install Docker & Docker Compose

```bash
# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker on boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 4. Deploy MobiMatch Application

```bash
# Clone repository
git clone <your-git-repository-url> /opt/mobimatch
cd /opt/mobimatch

# Create production environment file
cp .env.example .env
nano .env
```

### Production `.env` Settings:
- `PORT=3000`
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://postgres:<STRONG_DB_PASSWORD>@postgres:5432/mobimatch`
- `POSTGRES_PASSWORD=<STRONG_DB_PASSWORD>`
- `REDIS_URL=redis://redis:6379`
- `JWT_ACCESS_SECRET=<SECURE_RANDOM_STRING_MIN_32_CHARS>`
- `JWT_REFRESH_SECRET=<SECURE_RANDOM_STRING_MIN_32_CHARS>`
- `INITIAL_ADMIN_EMAIL=owner@example.com`
- `GOOGLE_CLIENT_IDS=<ANDROID_CLIENT_ID>,<WEB_CLIENT_ID>`
- `DEV_MOCK_AUTH=false`
- `USER_APP_UPDATE_URL=https://play.google.com/store/apps/details?id=com.mobimatch.app`
- `TERMS_URL=https://api.mobimatch.example.com/terms`
- `PRIVACY_POLICY_URL=https://api.mobimatch.example.com/privacy`
- `ACCOUNT_DELETION_URL=https://api.mobimatch.example.com/account-deletion`

Start containers:
```bash
docker compose up -d --build
```

---

## 5. Reverse Proxy with Automated TLS (Caddy)

Caddy provides zero-configuration automated HTTPS certificates via Let's Encrypt:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Edit `/etc/caddy/Caddyfile`:
```caddy
api.mobimatch.example.com {
    reverse_proxy localhost:3000
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## 6. Daily Automated Backups

Configure cron to run the 7-day rolling backup script every night at 02:00 AM:

```bash
chmod +x /opt/mobimatch/backend/scripts/backup.sh
sudo crontab -e
```
Add the line:
```text
0 2 * * * /opt/mobimatch/backend/scripts/backup.sh >> /var/log/mobimatch-backup.log 2>&1
```

---

## 7. Verification

Verify live deployment:
```bash
curl -I https://api.mobimatch.example.com/health/live
curl https://api.mobimatch.example.com/health/ready
curl https://api.mobimatch.example.com/v1/app-config
```
Expected output: HTTP 200 with JSON status `ready`.

