# Leadsetu Deployment Guide

This directory contains production deployment configurations for **both** hosting modes:

1. **Docker / Container Cloud (`Dockerfile` + `docker-compose.yml`)**
2. **Ubuntu VPS (`ecosystem.config.js` + `nginx/leadsetu.conf` + Certbot SSL)**

---

## Option A: Docker Compose (VPS / Staging / Cloud)

From `leadsetu-web/deploy`:

```bash
docker compose up -d --build
```

Verify both services:

```bash
curl -f http://localhost:3001/v1/health
curl -I http://localhost:3000/
```

For Railway / Render / ECS, build each service independently using:
- Backend: `leadsetu-api/Dockerfile` (exposes `3001`, healthcheck `/v1/health`)
- Frontend: `leadsetu-web/Dockerfile` (exposes `3000`, builds with `NEXT_STANDALONE=true`)

---

## Option B: Ubuntu VPS (PM2 + Nginx + Certbot)

1. Build both applications:
   ```bash
   cd /var/www/leadsetu-api && npm ci && npm run build
   cd /var/www/leadsetu-web && npm ci && npm run build
   ```
2. Start both processes with PM2:
   ```bash
   sudo mkdir -p /var/log/pm2 && sudo chown -R $USER:$USER /var/log/pm2
   LEADSETU_API_DIR=/var/www/leadsetu-api pm2 start /var/www/leadsetu-web/deploy/ecosystem.config.js
   pm2 save
   ```
3. Configure Nginx + SSL:
   - Copy `deploy/nginx/leadsetu.conf` to `/etc/nginx/sites-available/leadsetu`
   - Replace `app.yourdomain.com` with your domain
   - Symlink to `/etc/nginx/sites-enabled/leadsetu`, test with `sudo nginx -t`, and run:
     ```bash
     sudo certbot --nginx -d app.yourdomain.com
     sudo systemctl reload nginx
     ```
