# 🚀 Complete Jio Cloud Launch Guide - Production Ready in 7 Days

**Step-by-step guide to deploy your Loopync app on Jio Cloud infrastructure**

---

## 📋 Overview

This guide covers:
- Day 1: Jio Cloud setup + Server configuration
- Day 2: Database setup (MongoDB Atlas)
- Day 3: Backend deployment
- Day 4: Frontend deployment + Domain
- Day 5: SSL certificates + Security
- Day 6: Monitoring + Testing
- Day 7: GO LIVE! 🎉

**Total Cost:** ₹20,000-₹35,000/month (for 10K users)
**Timeline:** 7 days to production

---

# DAY 1: JIO CLOUD SETUP & SERVER CONFIGURATION

## Step 1.1: Create Jio Cloud Account (30 minutes)

### Sign Up for Jio Cloud

1. Visit: https://jiocloud.com or https://jiocloudservices.com
2. Click "Sign Up" / "Get Started"
3. Choose account type: **Business**
4. Fill in details:
   - Company Name: Your company/personal name
   - Email: Your business email
   - Phone: Your mobile number
   - GST Number: (if applicable)
5. Verify email and phone
6. Complete KYC:
   - Upload Aadhaar/PAN
   - Business registration (if company)
7. Wait for account activation (2-24 hours)

**Note:** If Jio Cloud web portal is not accessible, you can use **AWS Mumbai Region** as alternative (same steps apply).

---

## Step 1.2: Launch Virtual Machine (1 hour)

### Navigate to Compute/VM Section

1. Login to Jio Cloud Console
2. Go to: **Compute → Virtual Machines**
3. Click "Create Instance" / "Launch VM"

### Configure VM Instance

**Basic Configuration:**
- **Name:** loopync-production-server
- **Region:** Mumbai (for India users)
- **Availability Zone:** Any (default)

**Instance Type:**
Choose based on your needs:

| Users | Instance Type | vCPU | RAM | Storage | Cost/Month |
|-------|--------------|------|-----|---------|------------|
| 0-1K | Standard Small | 2 | 4GB | 80GB | ₹3,000 |
| 1K-10K | Standard Medium | 4 | 8GB | 100GB | ₹8,000 |
| 10K-50K | Standard Large | 8 | 16GB | 200GB | ₹18,000 |
| 50K+ | Standard XLarge | 16 | 32GB | 300GB | ₹35,000 |

**For testing/launch: Choose Standard Medium (4 vCPU, 8GB RAM)**

**Operating System:**
- **Image:** Ubuntu 22.04 LTS
- **Architecture:** 64-bit (x86_64)

**Storage:**
- **Boot Disk:** 100 GB SSD
- **Additional Storage:** None (for now)

**Network:**
- **VPC:** Create new VPC (loopync-vpc)
- **Subnet:** Create new subnet (10.0.1.0/24)
- **Public IP:** Enable (Required)
- **Firewall/Security Group:** Create new

### Configure Security Group (Firewall Rules)

Create security group: `loopync-security-group`

**Inbound Rules (Allow incoming traffic):**

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | 0.0.0.0/0 | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web |
| Custom | TCP | 8001 | 0.0.0.0/0 | Backend API |
| Custom | TCP | 3000 | 0.0.0.0/0 | Frontend (temp) |

**Outbound Rules:**
- Allow all outbound traffic (default)

### SSH Key Configuration

1. **Create SSH Key Pair**
2. Name: `loopync-server-key`
3. Download private key: `loopync-server-key.pem`
4. **SAVE THIS FILE SECURELY!**
5. Set permissions (on your computer):
   ```bash
   chmod 400 loopync-server-key.pem
   ```

### Review and Launch

1. Review all configurations
2. **Monthly Cost Estimate:** ~₹8,000
3. Click "Launch Instance"
4. Wait 2-5 minutes for VM to start
5. Note down **Public IP Address** (e.g., 203.0.113.45)

---

## Step 1.3: Connect to Server (10 minutes)

### SSH into Your Server

**From Mac/Linux:**
```bash
# Connect to server
ssh -i loopync-server-key.pem ubuntu@YOUR_PUBLIC_IP

# Example:
ssh -i loopync-server-key.pem ubuntu@203.0.113.45

# Type 'yes' when asked about authenticity
# You should now see: ubuntu@loopync-production-server:~$
```

**From Windows:**
Use PuTTY or Windows Terminal:
```powershell
# Convert .pem to .ppk using PuTTYgen (if using PuTTY)
# Or use Windows Terminal with WSL:
ssh -i loopync-server-key.pem ubuntu@YOUR_PUBLIC_IP
```

**✅ You're now connected to your production server!**

---

## Step 1.4: Initial Server Setup (30 minutes)

### Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# This takes 5-10 minutes
```

### Set Server Timezone

```bash
# Set to India Standard Time
sudo timedatectl set-timezone Asia/Kolkata

# Verify
date
# Should show IST time
```

### Create Swap File (for better memory management)

```bash
# Create 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
sudo swapon --show
free -h
```

### Install Essential Tools

```bash
# Install basic utilities
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    software-properties-common \
    build-essential

# Verify installations
git --version
curl --version
```

---

## Step 1.5: Install Application Dependencies (45 minutes)

### Install Python 3.11

```bash
# Add deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Verify installation
python3.11 --version
# Should show: Python 3.11.x
```

### Install Node.js 18 (for frontend build)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
# Should show: v18.x.x

npm --version
# Should show: 9.x.x
```

### Install Nginx (Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
# Should show: active (running)

# Test: Visit http://YOUR_PUBLIC_IP in browser
# You should see "Welcome to nginx!" page
```

### Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Configure PM2 to start on boot
pm2 startup
# Run the command it outputs (starts with 'sudo env...')
```

### Install Certbot (for SSL certificates - we'll use later)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Verify
certbot --version
```

**✅ All dependencies installed!**

---

# DAY 2: DATABASE SETUP (MONGODB ATLAS)

## Step 2.1: Create MongoDB Atlas Account (15 minutes)

1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Sign up with:
   - Email (business email preferred)
   - Password (strong password)
3. Verify email
4. Complete profile:
   - Name
   - Organization: Your company name
   - Project: Loopync Production

---

## Step 2.2: Create Database Cluster (20 minutes)

### Choose Deployment Option

1. Click "Build a Database"
2. Choose: **Shared** (Free tier for testing) or **Dedicated** (for production)

**For Production (Recommended):**
- Cluster Tier: **M10** (2GB RAM, 10GB Storage)
- Cost: ~₹5,000/month

**For Testing (Free):**
- Cluster Tier: **M0** (512MB RAM, 5GB Storage)
- Cost: FREE (upgrade later)

### Configure Cluster

1. **Cloud Provider:** AWS
2. **Region:** Mumbai (ap-south-1) - IMPORTANT for low latency
3. **Cluster Name:** loopync-production-cluster
4. Click "Create Cluster"
5. Wait 3-5 minutes for cluster to deploy

---

## Step 2.3: Configure Database Access (10 minutes)

### Create Database User

1. In Atlas dashboard, click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Authentication Method: **Password**
4. Username: `loopync_admin`
5. Password: **Generate Secure Password** (SAVE THIS!)
   - Example: `Xyz789@MongoSecure!2024`
6. Database User Privileges: **Atlas Admin**
7. Click "Add User"

**🔐 SAVE THESE CREDENTIALS:**
```
MongoDB Username: loopync_admin
MongoDB Password: [your secure password]
```

---

## Step 2.4: Configure Network Access (5 minutes)

### Whitelist IP Addresses

1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. **Option 1 - Allow All (for testing):**
   - Click "Allow Access from Anywhere"
   - IP: `0.0.0.0/0`
   - Temporary (for initial setup)
   
4. **Option 2 - Production (secure):**
   - Add your Jio Cloud server IP
   - IP: `YOUR_PUBLIC_IP/32`
   - Example: `203.0.113.45/32`

5. Click "Confirm"

**Security Note:** After deployment, remove "0.0.0.0/0" and only allow your server IP.

---

## Step 2.5: Get Connection String (5 minutes)

1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Python** / Version: **3.6 or later**
5. Copy connection string:
   ```
   mongodb+srv://loopync_admin:<password>@loopync-production-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. **Save this connection string!**

**Example final connection string:**
```
mongodb+srv://loopync_admin:Xyz789@MongoSecure!2024@loopync-production-cluster.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 2.6: Test Database Connection (10 minutes)

### From Your Server

```bash
# SSH into server (if not already connected)
ssh -i loopync-server-key.pem ubuntu@YOUR_PUBLIC_IP

# Install pymongo to test
pip3 install pymongo[srv]

# Test connection
python3 -c "
from pymongo import MongoClient
uri = 'YOUR_CONNECTION_STRING'
client = MongoClient(uri)
try:
    client.admin.command('ping')
    print('✅ Successfully connected to MongoDB!')
except Exception as e:
    print(f'❌ Connection failed: {e}')
"
```

**Expected output:** `✅ Successfully connected to MongoDB!`

**✅ MongoDB Atlas is ready!**

---

# DAY 3: BACKEND DEPLOYMENT

## Step 3.1: Prepare Application Code (30 minutes)

### Transfer Code to Server

**Option 1: Using Git (Recommended)**

```bash
# On server
cd /home/ubuntu

# Clone your repository (if you have GitHub)
git clone https://github.com/yourusername/loopync.git

# Or create the directory structure
mkdir -p loopync/backend loopync/frontend
```

**Option 2: Using SCP (from your local machine)**

```bash
# From your local computer
cd /path/to/your/app

# Copy backend folder
scp -i loopync-server-key.pem -r /app/backend ubuntu@YOUR_PUBLIC_IP:/home/ubuntu/loopync/

# Copy frontend folder
scp -i loopync-server-key.pem -r /app/frontend ubuntu@YOUR_PUBLIC_IP:/home/ubuntu/loopync/
```

**Option 3: Manual File Transfer**
- Use FileZilla or WinSCP
- Connect using SSH key
- Upload `/app/backend` and `/app/frontend` folders

---

## Step 3.2: Configure Backend Environment (20 minutes)

### Create Production .env File

```bash
# SSH into server
cd /home/ubuntu/loopync/backend

# Create .env file
nano .env
```

**Paste this configuration:**

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
MONGO_URL=mongodb+srv://loopync_admin:YOUR_PASSWORD@loopync-production-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=loopync_production

# ==========================================
# SERVER CONFIGURATION
# ==========================================
CORS_ORIGINS=https://loopync.com,https://www.loopync.com,https://api.loopync.com
FRONTEND_URL=https://loopync.com

# ==========================================
# SECURITY (Generate new secret!)
# ==========================================
JWT_SECRET=YOUR_NEW_SUPER_SECURE_64_CHARACTER_RANDOM_STRING_HERE

# ==========================================
# AGORA.IO (Video/Audio Calls)
# ==========================================
AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
AGORA_APP_CERTIFICATE=59fd8e967f754664b3aa994c9b356e12

# ==========================================
# EMERGENT AI
# ==========================================
EMERGENT_LLM_KEY=sk-emergent-2A08f0464C83fA2299

# ==========================================
# CLOUDINARY (Add your credentials)
# ==========================================
CLOUDINARY_CLOUD=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UNSIGNED=your_upload_preset

# ==========================================
# RAZORPAY (Add your credentials)
# ==========================================
RAZORPAY_KEY=rzp_live_XXXXXXXXXX
RAZORPAY_SECRET=your_secret_key

# ==========================================
# EMAIL (Optional)
# ==========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@loopync.com
```

**Important:** Replace ALL placeholder values:
- MongoDB connection string
- JWT secret (generate new one):
  ```bash
  openssl rand -base64 64
  ```
- Cloudinary credentials
- Razorpay credentials

**Save and exit:** Ctrl+X, then Y, then Enter

---

## Step 3.3: Install Python Dependencies (15 minutes)

```bash
cd /home/ubuntu/loopync/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# This takes 5-10 minutes
```

**Expected output:** All packages installed successfully

---

## Step 3.4: Test Backend Locally (10 minutes)

```bash
# Make sure you're in backend directory with venv activated
cd /home/ubuntu/loopync/backend
source venv/bin/activate

# Test run server
uvicorn server:app --host 0.0.0.0 --port 8001

# Expected output:
# INFO:     Started server process
# INFO:     Uvicorn running on http://0.0.0.0:8001
```

**Test from another terminal:**
```bash
# Open new SSH connection
ssh -i loopync-server-key.pem ubuntu@YOUR_PUBLIC_IP

# Test API
curl http://localhost:8001/api/health

# Expected: {"status":"ok"}
```

**If working, press Ctrl+C to stop the server.**

---

## Step 3.5: Deploy Backend with PM2 (15 minutes)

### Create PM2 Ecosystem File

```bash
cd /home/ubuntu/loopync/backend

# Create ecosystem config
nano ecosystem.config.js
```

**Paste this configuration:**

```javascript
module.exports = {
  apps: [{
    name: 'loopync-backend',
    script: '/home/ubuntu/loopync/backend/venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001 --workers 4',
    cwd: '/home/ubuntu/loopync/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/home/ubuntu/logs/backend-error.log',
    out_file: '/home/ubuntu/logs/backend-out.log',
    log_file: '/home/ubuntu/logs/backend-combined.log',
    time: true
  }]
};
```

**Save:** Ctrl+X, Y, Enter

### Create Logs Directory

```bash
mkdir -p /home/ubuntu/logs
```

### Start Backend with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# You should see:
# ┌─────┬────────────────────┬─────────┬─────────┐
# │ id  │ name               │ status  │ restart │
# ├─────┼────────────────────┼─────────┼─────────┤
# │ 0   │ loopync-backend    │ online  │ 0       │
# └─────┴────────────────────┴─────────┴─────────┘

# View logs
pm2 logs loopync-backend --lines 50

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Run the command it outputs
```

### Test Backend API

```bash
# Test health endpoint
curl http://localhost:8001/api/health

# Test with public IP
curl http://YOUR_PUBLIC_IP:8001/api/health

# Both should return: {"status":"ok"}
```

**✅ Backend is now running on production server!**

---

# DAY 4: FRONTEND DEPLOYMENT & DOMAIN SETUP

## Step 4.1: Build Frontend for Production (30 minutes)

### Install Frontend Dependencies

```bash
cd /home/ubuntu/loopync/frontend

# Install dependencies
npm install --legacy-peer-deps

# This takes 5-10 minutes
```

### Configure Production Environment

```bash
# Create production .env
nano .env.production
```

**Paste this (update YOUR_DOMAIN):**

```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
REACT_APP_CLOUDINARY_CLOUD=your_cloud_name
REACT_APP_CLOUDINARY_UNSIGNED=your_upload_preset
REACT_APP_RAZORPAY_KEY=rzp_live_XXXXXXXXXX
```

**Note:** We'll update the domain later. For now, you can use:
```env
REACT_APP_BACKEND_URL=http://YOUR_PUBLIC_IP:8001
```

**Save:** Ctrl+X, Y, Enter

### Build Production Bundle

```bash
# Build for production
npm run build

# This takes 2-5 minutes
# Output will be in 'build' folder
```

### Deploy to Nginx

```bash
# Create web directory
sudo mkdir -p /var/www/loopync

# Copy build files
sudo cp -r build/* /var/www/loopync/

# Set permissions
sudo chown -R www-data:www-data /var/www/loopync
sudo chmod -R 755 /var/www/loopync
```

**✅ Frontend build deployed!**

---

## Step 4.2: Buy and Configure Domain (1 hour)

### Purchase Domain

1. Go to domain registrar:
   - **GoDaddy**: https://www.godaddy.com/
   - **Namecheap**: https://www.namecheap.com/
   - **BigRock**: https://www.bigrock.in/ (Indian)
   
2. Search for your domain:
   - Example: `loopync.com`, `vibely.com`, etc.
   
3. Purchase domain:
   - Cost: ₹800-₹1,500/year
   - Add privacy protection (recommended)

### Configure DNS Records

Once domain is purchased:

1. Go to Domain Management Dashboard
2. Find DNS Settings / DNS Management
3. Add these records:

**A Records:**
```
Type: A
Name: @
Value: YOUR_PUBLIC_IP
TTL: 1 Hour
```

```
Type: A
Name: api
Value: YOUR_PUBLIC_IP
TTL: 1 Hour
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: yourdomain.com
TTL: 1 Hour
```

**Example for domain: loopync.com**
```
A Record: @ → 203.0.113.45
A Record: api → 203.0.113.45
CNAME: www → loopync.com
```

4. Save DNS changes
5. **Wait 15-30 minutes** for DNS propagation

### Verify DNS Propagation

```bash
# Check if DNS is working
nslookup yourdomain.com
nslookup api.yourdomain.com

# Should show your server IP
```

**✅ Domain configured!**

---

## Step 4.3: Configure Nginx (30 minutes)

### Create Nginx Configuration

```bash
# Create config file
sudo nano /etc/nginx/sites-available/loopync
```

**Paste this configuration:**

```nginx
# Frontend - Main domain
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/loopync;
    index index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Handle React routing
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable caching for API
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Replace `yourdomain.com` with your actual domain!**

**Save:** Ctrl+X, Y, Enter

### Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/loopync /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Expected output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx
```

### Test HTTP Access

```bash
# Test frontend
curl http://yourdomain.com

# Test backend API
curl http://api.yourdomain.com/api/health
```

**Open in browser:**
- http://yourdomain.com (should show your app)
- http://api.yourdomain.com/api/health (should show {"status":"ok"})

**✅ Nginx configured and serving content!**

---

# DAY 5: SSL CERTIFICATES & SECURITY

## Step 5.1: Install SSL Certificates (15 minutes)

### Generate SSL with Let's Encrypt

```bash
# Install Certbot (if not already done)
sudo apt install certbot python3-certbot-nginx -y

# Generate certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# You'll be asked:
# Email: your-email@example.com
# Agree to Terms: (A)gree
# Share email with EFF: (Y)es or (N)o
# Redirect HTTP to HTTPS: 2 (Recommended)

# Certbot will automatically:
# 1. Generate SSL certificates
# 2. Update Nginx configuration
# 3. Set up auto-renewal
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Test SSL Renewal

```bash
# Test auto-renewal (dry run)
sudo certbot renew --dry-run

# Expected: Congratulations, all simulated renewals succeeded
```

### Verify HTTPS

**Open in browser:**
- https://yourdomain.com (should have 🔒 lock icon)
- https://api.yourdomain.com/api/health

**✅ SSL certificates installed! Your site is now secure!**

---

## Step 5.2: Security Hardening (30 minutes)

### Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status

# Should show:
# Status: active
# To                         Action      From
# --                         ------      ----
# OpenSSH                    ALLOW       Anywhere
# Nginx Full                 ALLOW       Anywhere
```

### Secure SSH

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Change these settings:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

# Save and restart SSH
sudo systemctl restart sshd
```

### Set Up Fail2Ban (Prevent brute force)

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Find [sshd] section and set:
# enabled = true
# maxretry = 3
# bantime = 3600

# Save and start
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### Update Frontend Environment Variables

```bash
cd /home/ubuntu/loopync/frontend

# Update .env.production with HTTPS URLs
nano .env.production
```

**Update to:**
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_AGORA_APP_ID=9d727260580f40d2ae8c131dbfd8ba08
REACT_APP_CLOUDINARY_CLOUD=your_cloud_name
REACT_APP_CLOUDINARY_UNSIGNED=your_upload_preset
REACT_APP_RAZORPAY_KEY=rzp_live_XXXXXXXXXX
```

### Rebuild and Redeploy Frontend

```bash
# Rebuild with new environment
npm run build

# Deploy new build
sudo rm -rf /var/www/loopync/*
sudo cp -r build/* /var/www/loopync/
sudo chown -R www-data:www-data /var/www/loopync
```

**✅ Security hardening complete!**

---

# DAY 6: MONITORING & TESTING

## Step 6.1: Set Up Server Monitoring (30 minutes)

### Install Netdata (System Monitoring)

```bash
# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --stable-channel --disable-telemetry

# Access monitoring at: http://YOUR_PUBLIC_IP:19999
# Or configure Nginx proxy for https://monitor.yourdomain.com
```

### Configure PM2 Monitoring

```bash
# Install PM2 monitoring module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true

# View logs
pm2 logs --lines 100
```

### Set Up Application Monitoring

**Option 1: Sentry (Error Tracking)**

1. Sign up at https://sentry.io (Free tier: 5K errors/month)
2. Create new project: "Loopync Backend"
3. Get DSN (Data Source Name)
4. Add to backend .env:
   ```env
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```
5. Install Sentry in backend:
   ```bash
   cd /home/ubuntu/loopync/backend
   source venv/bin/activate
   pip install sentry-sdk
   ```
6. Add to server.py (top of file):
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn=os.getenv('SENTRY_DSN'))
   ```

**Option 2: UptimeRobot (Uptime Monitoring)**

1. Sign up at https://uptimerobot.com (Free: 50 monitors)
2. Add monitors:
   - Name: Loopync Frontend
   - URL: https://yourdomain.com
   - Interval: 5 minutes
   
   - Name: Loopync API
   - URL: https://api.yourdomain.com/api/health
   - Interval: 5 minutes
3. Set up alerts (email/SMS)

---

## Step 6.2: Database Backup Setup (20 minutes)

### Automated MongoDB Backups

```bash
# Create backup script
nano /home/ubuntu/backup-mongodb.sh
```

**Paste this:**

```bash
#!/bin/bash

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups/mongodb"
MONGO_URI="YOUR_MONGODB_CONNECTION_STRING"
DB_NAME="loopync_production"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database (using mongodump)
mongodump --uri="$MONGO_URI" --db=$DB_NAME --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.tar.gz"
```

**Save:** Ctrl+X, Y, Enter

```bash
# Make executable
chmod +x /home/ubuntu/backup-mongodb.sh

# Install MongoDB tools
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.0.deb
sudo apt install ./mongodb-database-tools-ubuntu2204-x86_64-100.9.0.deb

# Test backup
/home/ubuntu/backup-mongodb.sh

# Set up daily backup cron job
crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * /home/ubuntu/backup-mongodb.sh >> /home/ubuntu/logs/backup.log 2>&1
```

**✅ Automated backups configured!**

---

## Step 6.3: Comprehensive Testing (1 hour)

### Test All Endpoints

Create test script:

```bash
nano /home/ubuntu/test-api.sh
```

**Paste:**

```bash
#!/bin/bash

API_URL="https://api.yourdomain.com"

echo "🧪 Testing Loopync API..."
echo "=========================="

# Test 1: Health Check
echo "1. Health Check"
curl -s $API_URL/api/health
echo -e "\n"

# Test 2: User Signup
echo "2. User Signup"
SIGNUP_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@loopync.com","password":"test123","name":"Test User","handle":"testuser"}')
echo $SIGNUP_RESPONSE | python3 -m json.tool
echo -e "\n"

# Test 3: User Login
echo "3. User Login"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@loopync.com","password":"test123"}')
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))")
echo $LOGIN_RESPONSE | python3 -m json.tool
echo -e "\n"

# Test 4: Get User Info
echo "4. Get User Info"
curl -s $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo -e "\n"

# Test 5: Create Post
echo "5. Create Post"
curl -s -X POST $API_URL/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test post from production server!"}' | python3 -m json.tool
echo -e "\n"

# Test 6: Get Posts
echo "6. Get Posts"
curl -s $API_URL/api/posts \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
echo -e "\n"

echo "✅ API Testing Complete!"
```

**Run tests:**

```bash
chmod +x /home/ubuntu/test-api.sh
/home/ubuntu/test-api.sh
```

### Frontend Testing

**Open browser and test:**

1. **Homepage**: https://yourdomain.com
   - Should load without errors
   - Check browser console for errors (F12)

2. **Signup Flow**:
   - Click signup
   - Create account
   - Verify redirect to home

3. **Login Flow**:
   - Logout
   - Login again
   - Verify successful authentication

4. **Create Post**:
   - Create new post
   - Verify it appears in feed

5. **Navigation**:
   - Test all bottom nav items
   - Discover, VibeZone, Messenger, Profile

6. **VibeRooms**:
   - Navigate to VibeRooms
   - Create a room
   - Test join functionality

7. **Tribes**:
   - Go to Discover → Tribes
   - Create a tribe
   - Post in tribe

8. **Mobile Responsiveness**:
   - Open developer tools (F12)
   - Toggle device toolbar
   - Test on different screen sizes

**✅ All features tested!**

---

## Step 6.4: Performance Testing (30 minutes)

### Load Testing with Apache Bench

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API endpoint (1000 requests, 100 concurrent)
ab -n 1000 -c 100 https://api.yourdomain.com/api/health

# Should handle without errors
# Look for: Requests per second

# Test authenticated endpoint
# First get token, then test
TOKEN="your_jwt_token"
ab -n 500 -c 50 -H "Authorization: Bearer $TOKEN" https://api.yourdomain.com/api/posts
```

### Check Server Resources

```bash
# Check CPU and memory
htop

# Check disk usage
df -h

# Check network
sudo iftop

# Check Nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status
pm2 monit
```

**✅ Performance verified!**

---

# DAY 7: GO LIVE! 🚀

## Step 7.1: Pre-Launch Checklist

### Security Checklist

```bash
# Run security audit
sudo apt install lynis -y
sudo lynis audit system

# Check open ports
sudo netstat -tulpn

# Verify firewall
sudo ufw status verbose

# Check SSL grade
# Visit: https://www.ssllabs.com/ssltest/
# Enter your domain, check grade (should be A or A+)
```

### Final Configuration Check

```bash
# Backend status
pm2 status

# Backend logs (check for errors)
pm2 logs loopync-backend --lines 100 --nostream

# Nginx status
sudo systemctl status nginx

# Check disk space (should have at least 20% free)
df -h

# Check memory (should have at least 1GB free)
free -h

# Database connection
curl -s http://localhost:8001/api/health
```

### Final Frontend Check

**Open https://yourdomain.com and verify:**

- [ ] Homepage loads correctly
- [ ] All images load
- [ ] CSS/styling applied correctly
- [ ] No console errors
- [ ] Authentication works
- [ ] All navigation works
- [ ] Forms submit correctly
- [ ] Real-time features work
- [ ] Mobile responsive
- [ ] HTTPS (lock icon) visible

---

## Step 7.2: Create Support Pages (1 hour)

### Privacy Policy

Create: `/var/www/loopync/privacy-policy.html`

Use generator: https://app-privacy-policy-generator.firebaseapp.com/

### Terms of Service

Create: `/var/www/loopync/terms-of-service.html`

Use generator: https://www.termsofservicegenerator.net/

### Update Nginx to serve these pages

```bash
sudo nano /etc/nginx/sites-available/loopync
```

Add:
```nginx
location /privacy-policy {
    alias /var/www/loopync/privacy-policy.html;
}

location /terms-of-service {
    alias /var/www/loopync/terms-of-service.html;
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7.3: Set Up Analytics (30 minutes)

### Google Analytics

1. Go to: https://analytics.google.com/
2. Create account and property
3. Get Measurement ID (G-XXXXXXXXXX)
4. Add to frontend `public/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

5. Rebuild and redeploy frontend

---

## Step 7.4: Launch Announcement (30 minutes)

### Prepare Social Media Posts

**Twitter/X:**
```
🚀 Loopync is now LIVE! 

India's new social superapp where vibes meet tribes!

✨ Features:
• Social Feed
• VibeZone (Reels)
• Tribes
• VibeRooms (Audio)
• Direct Messaging

Join now: https://yourdomain.com

#Loopync #MadeInIndia #SocialApp #Launch
```

**Instagram:**
```
📱 LOOPYNC IS LIVE! 🎉

Your new favorite social app is here! 🇮🇳

Download and join the community:
🔗 Link in bio

#loopync #socialmedia #madeinIndia #newapp #tribes #vibes
```

**LinkedIn:**
```
Excited to announce the launch of Loopync! 🚀

A new social platform designed for authentic connections and community building.

Key Features:
✅ Content Feed & Stories
✅ Short Video (VibeZone)
✅ Communities (Tribes)
✅ Audio Rooms (VibeRooms)
✅ Direct Messaging

Visit: https://yourdomain.com

#ProductLaunch #SocialMedia #Startup #MadeInIndia
```

---

## Step 7.5: GO LIVE! 🎉

### Make Final Announcement

1. **Post on all social media** (prepared above)
2. **Send emails** to beta testers/friends
3. **Post on communities**:
   - Reddit: r/SideProject, r/startups
   - Product Hunt (submit your product)
   - Hacker News (Show HN)
   - IndieHackers

### Monitor Launch

**First 24 Hours - Check Every 2 Hours:**

```bash
# SSH into server
ssh -i loopync-server-key.pem ubuntu@YOUR_PUBLIC_IP

# Check server health
htop

# Check backend status
pm2 status
pm2 logs loopync-backend --lines 50

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check server resources
df -h  # Disk
free -h  # Memory

# Check who's online
curl -s http://localhost:8001/api/health
```

**Monitoring Dashboards:**
- Server: http://YOUR_PUBLIC_IP:19999 (Netdata)
- Uptime: https://uptimerobot.com
- Errors: https://sentry.io
- Analytics: https://analytics.google.com

---

## Step 7.6: Incident Response Plan

### If Backend Crashes:

```bash
# Restart backend
pm2 restart loopync-backend

# Check logs
pm2 logs loopync-backend --lines 200

# If persistent issues
pm2 stop loopync-backend
cd /home/ubuntu/loopync/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
# Check console for errors
```

### If Frontend Not Loading:

```bash
# Check Nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# Check files
ls -la /var/www/loopync

# Rebuild if needed
cd /home/ubuntu/loopync/frontend
npm run build
sudo cp -r build/* /var/www/loopync/
```

### If Database Connection Fails:

1. Check MongoDB Atlas status
2. Verify IP whitelist
3. Test connection:
   ```bash
   python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URI'); print(client.admin.command('ping'))"
   ```

### If SSL Expires:

```bash
# Renew certificates
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## 🎊 CONGRATULATIONS! YOU'RE LIVE!

### What You've Accomplished

- ✅ Jio Cloud server configured
- ✅ MongoDB Atlas database set up
- ✅ Backend deployed with PM2
- ✅ Frontend deployed with Nginx
- ✅ Domain configured
- ✅ SSL certificates installed
- ✅ Security hardened
- ✅ Monitoring set up
- ✅ Backups automated
- ✅ Analytics tracking
- ✅ **LIVE ON PRODUCTION!** 🚀

---

## 📊 Cost Summary

| Item | Monthly Cost |
|------|--------------|
| Jio Cloud Server (4 vCPU, 8GB) | ₹8,000 |
| MongoDB Atlas (M10) | ₹5,000 |
| Domain (.com) | ₹100 |
| SSL Certificate (Let's Encrypt) | FREE |
| Cloudinary (optional) | ₹3,000 |
| **TOTAL** | **₹16,000-19,000/month** |

**One-time costs:**
- Domain registration: ₹1,200/year
- Initial setup: Time investment

---

## 📈 Next Steps (Week 2+)

### Scaling (as you grow)

**When you reach 10K users:**
- Upgrade server to 8 vCPU, 16GB RAM (₹18,000/month)
- Upgrade MongoDB to M30 (₹12,000/month)
- Add Cloudinary Pro (₹8,000/month)
- Add Agora usage fees (₹10,000/month)

**When you reach 50K users:**
- Add load balancer
- Multiple servers (horizontal scaling)
- CDN for static assets
- Redis for caching

### Feature Development

- Push notifications (Firebase)
- Email notifications
- Advanced analytics
- Content moderation
- User verification
- Payment integration

### Marketing

- SEO optimization
- Social media marketing
- Influencer partnerships
- Paid advertising
- Community building

---

## 🆘 Support & Resources

### Documentation
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/docs/
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Certbot: https://certbot.eff.org/

### Communities
- DigitalOcean Community: https://www.digitalocean.com/community
- Stack Overflow: https://stackoverflow.com/
- Reddit: r/webdev, r/selfhosted

### Monitoring
- Server health: Netdata dashboard
- Uptime: UptimeRobot
- Errors: Sentry
- Analytics: Google Analytics

---

## ✅ Final Checklist

- [ ] Server running and accessible
- [ ] Backend API responding
- [ ] Frontend loading correctly
- [ ] Database connected
- [ ] SSL certificates valid
- [ ] Domain resolving correctly
- [ ] Monitoring active
- [ ] Backups scheduled
- [ ] Security hardened
- [ ] Analytics tracking
- [ ] Support pages created
- [ ] Social media announced
- [ ] **APP IS LIVE!** 🎉

---

**🎊 YOUR APP IS NOW LIVE ON PRODUCTION! 🚀**

**Access your app:**
- Frontend: https://yourdomain.com
- API: https://api.yourdomain.com
- Monitoring: http://YOUR_IP:19999

**Share your success:**
- Twitter/X
- LinkedIn
- Product Hunt
- Reddit

**Monitor and iterate:**
- Check metrics daily
- Respond to user feedback
- Fix bugs quickly
- Add features regularly

**Welcome to production! Your journey to millions of users has begun! 🌟**
