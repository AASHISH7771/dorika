# Deploying Dorika to Oracle Cloud Always Free

Target: a permanently-free Ubuntu VM running the existing Next.js app behind nginx,
with automatic TLS and a process manager that restarts on crash or reboot.

This is the "no sleep, no request caps, real CPU" option. It costs nothing forever,
but you own the machine: OS updates, disk space, and backups are yours to manage.

---

## 0. What you get

| Resource | Always Free allowance | What we use |
|---|---|---|
| Ampere A1 (ARM) | 3,000 OCPU-hours + 18,000 GB-hours / month | 1 VM, 4 OCPU / 24 GB, always on (~2,920 OCPU-hours) |
| Block storage | 200 GB total | 50–100 GB boot volume |
| Outbound transfer | 10 TB / month | plenty |

A single 4-core / 24 GB VM left running 24/7 lands just under the monthly OCPU
allowance. Do not also create a second A1 instance with the same profile — that
pushes you over and Oracle starts billing.

If ARM capacity is unavailable ("Out of host capacity"), either retry at a quiet
hour or create the AMD `VM.Standard.E2.1.Micro` (1 GB RAM, always available) and
add a 2 GB swap file — it is slower but adequate for 12 products.

---

## 1. Create the account and instance

1. Sign up at <https://signup.oraclecloud.com>. A card is required for identity
   verification; Always Free resources are not charged. Some regions refuse
   signup on certain cards — try a different one or a different home region.
2. Choose a home region near Nepal: **India West (Mumbai)** or **India South
   (Hyderabad)**. The home region cannot be changed later.
3. Console → **Compute → Instances → Create instance**
   - **Image:** Canonical Ubuntu 22.04
   - **Shape:** Ampere → `VM.Standard.A1.Flex`, 4 OCPU, 24 GB
   - **Boot volume:** 100 GB
   - **SSH keys:** upload your public key (generate with `ssh-keygen -t ed25519`
     if you don't have one)
4. After it boots, note the **public IP**.
5. **Networking → Virtual Cloud Networks → your VCN → Security Lists →
   Default Security List → Add Ingress Rules:**
   - Source `0.0.0.0/0`, protocol TCP, destination port `80`
   - Source `0.0.0.0/0`, protocol TCP, destination port `443`
   - Leave port 22 open (it is by default)

   The app itself never needs a public port — nginx proxies to it on localhost.

---

## 2. Connect and harden

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@YOUR_PUBLIC_IP
```

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ufw
```

Enable the firewall (Oracle's image ships one disabled):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

Install Node 20 from NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

If you took the 1 GB AMD shape, add swap before building — `next build` will
otherwise get OOM-killed:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## 3. Get the code and set secrets

```bash
sudo mkdir -p /var/www && sudo chown ubuntu:ubuntu /var/www
git clone https://github.com/AASHISH7771/dorika.git /var/www/dorika
cd /var/www/dorika
npm ci
```

Create the environment file. **Never commit this file** — it holds the Supabase
service-role key.

```bash
nano /var/www/dorika/.env.production
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://zijncihobkzeajbqxwzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<secret key>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ADMIN_EMAIL=shopdorika@gmail.com
NODE_ENV=production
```

Lock it down:

```bash
chmod 600 /var/www/dorika/.env.production
```

Build and smoke-test before wiring the proxy:

```bash
cd /var/www/dorika
npm run build
PORT=3000 npm start
```

Open a second terminal and check from the VM itself:

```bash
curl -s http://localhost:3000/api/health
```

Expect `{"ok":true,...}`. `Ctrl+C` the test server.

---

## 4. Keep it running

```bash
sudo npm i -g pm2
cd /var/www/dorika
pm2 start npm --name dorika -- start
pm2 save
pm2 startup            # run the command it prints
pm2 status
```

PM2 restarts the app on crash and on reboot. Useful commands:

```bash
pm2 logs dorika        # live logs
pm2 restart dorika     # after a deploy
pm2 monit              # CPU / memory
```

---

## 5. nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/dorika
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 15m;   # custom-art photo uploads

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dorika /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Visit `http://YOUR_PUBLIC_IP` — the site should load over plain HTTP. If it does
not, check `pm2 status` and `sudo tail -f /var/log/nginx/error.log`.

---

## 6. Domain and HTTPS

Point an `A` record for your domain at the VM's public IP. If you put Cloudflare
in front, use a proxied (orange cloud) record and set SSL mode to **Full (strict)**
once Certbot has issued a certificate.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot rewrites the nginx config for HTTPS and installs a renewal timer. Verify:

```bash
sudo certbot renew --dry-run
```

Then update the two places that must know the public URL:

1. `.env.production` → `NEXT_PUBLIC_SITE_URL=https://your-domain.com`, then
   `npm run build && pm2 restart dorika` (this value is baked in at build time).
2. Supabase → **Authentication → URL Configuration** → Site URL and
   `https://your-domain.com/account/auth/callback`.

---

## 7. Deploying changes later

```bash
cd /var/www/dorika
git pull
npm ci                    # only if package.json changed
npm run build
pm2 restart dorika
```

Wrap it once as `deploy.sh`:

```bash
#!/usr/bin/env bash
set -e
cd /var/www/dorika
git pull
npm ci
npm run build
pm2 restart dorika
echo "deployed $(git rev-parse --short HEAD)"
```

---

## 8. Backups

The database lives in Supabase, not on this VM — so the VM is disposable. What
you must not lose is `.env.production`; keep a copy in a password manager.

For the app itself, the GitHub repo is the backup. If the VM dies, rebuild it
with sections 2–5 and it is back.

Optional weekly database dump:

```bash
sudo apt install -y postgresql-client
# add to `crontab -e`, storing dumps somewhere you actually back up:
# 0 3 * * 0 pg_dump "$SUPABASE_DB_URL" | gzip > /var/backups/dorika-$(date +\%F).sql.gz
```

---

## 9. Migrating off this VM later

Nothing here is Oracle-specific except the instance itself. The same steps work
on any Ubuntu VPS (Hetzner, DigitalOcean, Contabo). Move by:

1. Create the new box, run sections 2–5.
2. Copy `.env.production` across.
3. Repoint the domain's A record.
4. Run Certbot on the new box.

Keep the old VM alive for a day in case DNS propagation is slow.

---

## Verification checklist

- [ ] `curl -s https://your-domain.com/api/health` returns `{"ok":true,...}`
- [ ] Storefront loads with product images (once `IMAGES_ENABLED` is back to `true`)
- [ ] `/admin/login` accepts the owner account and the dashboard renders
- [ ] A test order can be placed and appears in Admin → Orders
- [ ] A custom-art request uploads a photo and appears in Admin → Custom Requests
- [ ] `/track` finds that order by ID + phone
- [ ] `sudo reboot`, wait 90 s, site comes back with no manual intervention
- [ ] `pm2 status` shows `online` with a low restart count
