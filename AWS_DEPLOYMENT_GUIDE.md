# 🚀 AWS Free Tier Deployment Guide - Furniture Shop Management System

## Overview

This guide will help you deploy your Node.js/Express furniture shop management system on AWS Free Tier using EC2, RDS PostgreSQL, and other AWS services.

## 📋 Prerequisites

- AWS Account (Free Tier eligible)
- Domain name (optional, but recommended)
- Local development environment set up
- Git repository with your code

## 🏗️ Architecture Overview (100% Free Tier)

```
Internet → Elastic IP → EC2 Instance (Nginx + Node.js) → RDS PostgreSQL
                              ↓
                           S3 (File Storage)
```

**Simple, cost-effective architecture using only free tier services!**

## 📊 AWS Free Tier Resources Used (100% FREE)

- **EC2**: t2.micro instance (750 hours/month - FREE)
- **RDS**: db.t3.micro PostgreSQL (750 hours/month - FREE)
- **S3**: 5GB storage + 20,000 GET requests (FREE)
- **Elastic IP**: 1 static IP address (FREE when attached)
- **Data Transfer**: 1GB/month outbound (FREE)

**Total Monthly Cost: $0.00** ✅

## ⚡ Quick Start (TL;DR)

For experienced developers who want to deploy quickly:

```bash
# 1. Create RDS PostgreSQL (db.t3.micro, 20GB)
# 2. Create EC2 t2.micro with Amazon Linux 2023
# 3. SSH into EC2 and run:

sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git postgresql15
sudo npm install -g pm2 typescript

git clone [YOUR-REPO-URL]
cd furniture-shop-backend
npm install
npm run build

# Create .env.production with DATABASE_URL and other configs
npx prisma generate
npx prisma migrate deploy
npm run seed:furniture

pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Install and configure Nginx as reverse proxy
# Optional: Setup SSL with Let's Encrypt
```

**Estimated setup time: 30-45 minutes**

---

## 🎯 Detailed Step-by-Step Deployment

### Phase 1: Database Setup (RDS PostgreSQL)

#### Step 1: Create RDS PostgreSQL Instance

1. **Login to AWS Console**

   - Go to [AWS Console](https://console.aws.amazon.com)
   - Navigate to RDS service

2. **Create Database**

   ```
   - Click "Create database"
   - Choose "Standard create"
   - Engine: PostgreSQL
   - Version: PostgreSQL 15.x (latest)
   - Templates: Free tier
   - DB instance identifier: furniture-shop-db
   - Master username: postgres
   - Master password: [Create strong password - save it!]
   ```

3. **Instance Configuration**

   ```
   - DB instance class: db.t3.micro (Free tier)
   - Storage type: General Purpose SSD (gp2)
   - Allocated storage: 20 GB (Free tier limit)
   - Enable storage autoscaling: No
   ```

4. **Connectivity**

   ```
   - VPC: Default VPC
   - Subnet group: default
   - Public access: No (for security)
   - VPC security group: Create new
   - Security group name: furniture-shop-db-sg
   - Database port: 5432
   ```

5. **Additional Configuration**

   ```
   - Initial database name: furniture_shop
   - Backup retention: 7 days (Free tier)
   - Monitoring: Enable basic monitoring
   - Log exports: None (to save costs)
   ```

6. **Create Database** (Takes 10-15 minutes)

#### Step 2: Configure Database Security Group

1. **Go to EC2 → Security Groups**
2. **Find "furniture-shop-db-sg"**
3. **Edit Inbound Rules**
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: Custom (will update after EC2 creation)
   Description: Allow EC2 access to PostgreSQL
   ```

### Phase 2: EC2 Instance Setup

#### Step 3: Launch EC2 Instance

1. **Go to EC2 Dashboard**
2. **Launch Instance**

   ```
   Name: furniture-shop-server
   AMI: Amazon Linux 2023 (Free tier eligible)
   Instance type: t2.micro (Free tier)
   Key pair: Create new key pair
   - Name: furniture-shop-key
   - Type: RSA
   - Format: .pem
   - Download and save securely!
   ```

3. **Network Settings**

   ```
   VPC: Default VPC
   Subnet: Default subnet
   Auto-assign public IP: Enable
   Security group: Create new
   - Name: furniture-shop-web-sg
   - Description: Web server security group
   ```

4. **Security Group Rules**

   ```
   Inbound Rules:
   - SSH (22): My IP (your current IP)
   - HTTP (80): Anywhere (0.0.0.0/0)
   - HTTPS (443): Anywhere (0.0.0.0/0)
   - Custom TCP (8001): Anywhere (0.0.0.0/0) [Your app port]
   ```

5. **Storage**

   ```
   Size: 8 GB (Free tier)
   Volume type: gp2
   ```

6. **Launch Instance**

#### Step 4: Update Database Security Group

1. **Copy EC2 Security Group ID**
2. **Go back to RDS Security Group**
3. **Edit Inbound Rules**
   ```
   Source: Custom → Select EC2 security group ID
   ```

### Phase 3: Server Configuration

#### Step 5: Connect to EC2 Instance

1. **Using SSH (Linux/Mac)**

   ```bash
   chmod 400 furniture-shop-key.pem
   ssh -i furniture-shop-key.pem ec2-user@[EC2-PUBLIC-IP]
   ```

2. **Using PuTTY (Windows)**
   - Convert .pem to .ppk using PuTTYgen
   - Connect using PuTTY with the .ppk file

#### Step 6: Install Required Software

```bash
# Update system
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install PostgreSQL client
sudo yum install -y postgresql15

# Verify installations
node --version
npm --version
git --version
pm2 --version
```

#### Step 7: Clone and Setup Application

```bash
# Clone your repository
git clone https://github.com/your-username/furniture-shop-backend.git
cd furniture-shop-backend

# Install dependencies
npm install

# Install TypeScript globally (if not already installed)
sudo npm install -g typescript

# Build the application (this will also run prisma:generate)
npm run build

# Verify build was successful
ls -la dist/
```

#### Step 8: Environment Configuration

```bash
# Create production environment file
nano .env.production
```

**Add the following content:**

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-DB-PASSWORD]@[RDS-ENDPOINT]:5432/furniture_shop"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-for-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=8001
NODE_ENV="production"

# CORS Configuration
CORS_ORIGIN="*"

# Email Configuration (Optional - configure later)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASS="your-app-password"

# Cloudinary Configuration (Optional - for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Get RDS Endpoint:**

```bash
# Go to RDS Console → Databases → furniture-shop-db → Connectivity & security
# Copy the Endpoint URL
```

#### Step 9: Database Migration and Seeding

```bash
# Generate Prisma client (already done in build step)
npx prisma generate

# Run database migrations for production
npm run prisma:migrate:prod

# Seed the database with furniture data
npm run seed:furniture

# Verify seeding was successful
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Products\";"
```

#### Step 10: Start Application with PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add the following content:**

```javascript
module.exports = {
  apps: [
    {
      name: "furniture-shop-api",
      script: "dist/src/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8001,
      },
      env_file: ".env.production",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

**Start the application:**

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

#### Step 11: Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/furniture-shop.conf
```

**Add the following Nginx configuration:**

```nginx
server {
    listen 80;
    server_name [YOUR-ELASTIC-IP];

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # API routes
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Default location
    location / {
        return 200 'Furniture Shop API Server is running!';
        add_header Content-Type text/plain;
    }
}
```

**Test and restart Nginx:**

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Phase 4: SSL Certificate (Optional but Recommended)

#### Step 12: SSL Certificate Setup (Optional)

**Option 1: Use HTTP (Simplest for testing)**

```bash
# Your API will be available at:
# http://[YOUR-ELASTIC-IP]/api/v1/health
echo "✅ HTTP setup complete - no SSL needed for testing"
```

**Option 2: SSL with Domain (If you own a domain)**

```bash
# Only if you have a domain pointing to your Elastic IP
# Install Certbot
sudo yum install -y python3-pip
sudo pip3 install certbot certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

**Note:** SSL requires a domain name. For free testing, HTTP with Elastic IP works perfectly!

### Phase 5: Elastic IP Setup (FREE Static IP)

#### Step 13: Allocate Elastic IP (FREE)

1. **Go to EC2 Console → Elastic IPs**
2. **Allocate Elastic IP Address**

   ```
   Network Border Group: Default
   Public IPv4 address pool: Amazon's pool of IPv4 addresses
   ```

3. **Associate Elastic IP with EC2 Instance**

   ```
   Instance: Select your furniture-shop-server
   Private IP address: (auto-selected)
   ```

4. **Update Security Groups** (if needed)

   ```bash
   # Test your new static IP
   curl http://[YOUR-ELASTIC-IP]/health
   ```

**Benefits of Elastic IP:**

- ✅ **FREE** when attached to running instance
- ✅ **Static IP** - doesn't change when you stop/start instance
- ✅ **No DNS needed** - can use IP directly for testing
- ✅ **Easy SSL setup** - works with Let's Encrypt

### Phase 6: Monitoring and Maintenance

#### Step 14: Setup CloudWatch Monitoring

1. **Install CloudWatch Agent**

   ```bash
   # Download CloudWatch agent
   wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm

   # Install agent
   sudo rpm -U ./amazon-cloudwatch-agent.rpm
   ```

2. **Create IAM Role for CloudWatch**

   - Go to IAM Console
   - Create Role for EC2
   - Attach policy: CloudWatchAgentServerPolicy
   - Attach role to EC2 instance

3. **Configure CloudWatch Agent**
   ```bash
   sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
   ```

#### Step 15: Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/furniture-shop
```

**Add the following:**

```
/home/ec2-user/furniture-shop-backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        pm2 reload furniture-shop-api
    endscript
}
```

#### Step 16: Backup Strategy

```bash
# Create backup script
nano backup.sh
```

**Add the following:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ec2-user/backups"
DB_NAME="furniture_shop"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/ec2-user/furniture-shop-backend

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Make executable and schedule:**

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ec2-user/backup.sh
```

## 🔧 Testing Your Deployment

### Step 17: Test API Endpoints

```bash
# Test health endpoint
curl http://[YOUR-ELASTIC-IP]/health

# Test API endpoint
curl http://[YOUR-ELASTIC-IP]/api/v1/health

# Test with JSON response
curl -H "Content-Type: application/json" http://[YOUR-ELASTIC-IP]/api/v1/health

# Test system info endpoint
curl http://[YOUR-ELASTIC-IP]/api/v1/info
```

### Step 18: Import Postman Collection

1. **Update Postman Environment**

   ```json
   {
     "baseUrl": "http://[YOUR-ELASTIC-IP]/api/v1"
   }
   ```

2. **Import Collections**

   - Import `Furniture_Shop_Complete_API.postman_collection.json`
   - Import `Furniture_Shop_Complete_Environment.postman_environment.json`
   - Update the `baseUrl` variable with your Elastic IP

3. **Test Authentication Flow**

   - Run register request
   - Run login request
   - Verify token extraction
   - Test protected endpoints

4. **Available Collections**
   - Complete API collection with all endpoints
   - Environment file with demo credentials

## 📊 100% FREE Tier Usage Guide

### Free Tier Limits (Stay Within These!)

- **EC2**: 750 hours/month (1 t2.micro instance) ✅
- **RDS**: 750 hours/month (1 db.t3.micro instance) ✅
- **S3**: 5GB storage, 20,000 GET requests ✅
- **Elastic IP**: FREE when attached to running instance ✅
- **Data Transfer**: 1GB/month outbound ✅

### Staying 100% FREE

1. **Keep Instances Running 24/7**

   ```bash
   # 750 hours = 31.25 days = Always on for 1 month
   # Don't stop/start frequently to avoid charges
   ```

2. **Monitor Free Tier Usage**

   ```bash
   # Check AWS Billing Dashboard
   # Set up billing alerts at $1 threshold
   # Monitor usage daily
   ```

3. **Elastic IP Best Practices**

   ```bash
   # ✅ FREE: When attached to running EC2
   # ❌ CHARGED: When not attached or instance stopped
   # Always keep attached to your running instance
   ```

4. **Database Optimization**

   ```bash
   # Use connection pooling in your app
   # Optimize queries to reduce load
   # Regular maintenance during low usage
   ```

5. **S3 Usage Tips**
   ```bash
   # Stay under 5GB storage
   # Monitor GET requests (20,000/month limit)
   # Use for essential files only
   ```

### Free Tier Monitoring Commands

```bash
# Check EC2 uptime
uptime

# Check disk usage
df -h

# Check memory usage
free -h

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🚨 Security Best Practices

### Step 19: Security Hardening

1. **Update Security Groups**

   ```
   SSH (22): Only your IP
   HTTP (80): Anywhere (if using Nginx)
   HTTPS (443): Anywhere (if using SSL)
   App Port (8001): Only from Nginx (localhost)
   ```

2. **Enable AWS Config**

   - Monitor configuration changes
   - Compliance checking

3. **Setup AWS WAF** (if using ALB)

   - Protection against common attacks
   - Rate limiting

4. **Regular Updates**

   ```bash
   # System updates
   sudo yum update -y

   # Node.js security updates
   npm audit fix

   # PM2 updates
   pm2 update
   ```

## 🔄 Deployment Automation (Optional)

### Step 20: Create Deployment Script

```bash
nano deploy.sh
```

**Add the following:**

```bash
#!/bin/bash
echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run migrations
npx prisma migrate deploy

# Restart application
pm2 restart furniture-shop-api

# Test health
sleep 5
curl -f http://localhost:8001/health || exit 1

echo "✅ Deployment completed successfully!"
```

**Make executable:**

```bash
chmod +x deploy.sh
```

## 📋 Maintenance Checklist

### Daily

- [ ] Check application logs: `pm2 logs`
- [ ] Monitor system resources: `htop`
- [ ] Check disk space: `df -h`

### Weekly

- [ ] Review CloudWatch metrics
- [ ] Check backup files
- [ ] Update dependencies: `npm audit`

### Monthly

- [ ] System updates: `sudo yum update -y`
- [ ] Review AWS costs
- [ ] Security group review
- [ ] SSL certificate renewal check

## 🆘 Troubleshooting

### Common Issues

1. **Application won't start**

   ```bash
   # Check PM2 status
   pm2 status

   # Check logs
   pm2 logs furniture-shop-api

   # Check environment variables
   pm2 env 0
   ```

2. **Database connection issues**

   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT version();"

   # Check security groups
   # Verify RDS endpoint
   ```

3. **High memory usage**

   ```bash
   # Check memory usage
   free -h

   # Restart application
   pm2 restart furniture-shop-api

   # Check for memory leaks
   pm2 monit
   ```

4. **SSL certificate issues**

   ```bash
   # Check certificate status
   sudo certbot certificates

   # Renew certificate
   sudo certbot renew
   ```

5. **Port already in use**

   ```bash
   # Check what's using port 8001
   sudo lsof -i :8001

   # Kill process if needed
   sudo kill -9 [PID]

   # Restart application
   pm2 restart furniture-shop-api
   ```

6. **Nginx configuration errors**

   ```bash
   # Test Nginx config
   sudo nginx -t

   # Check Nginx status
   sudo systemctl status nginx

   # Restart Nginx
   sudo systemctl restart nginx
   ```

7. **Environment variables not loading**

   ```bash
   # Check PM2 environment
   pm2 env 0

   # Restart with environment file
   pm2 restart furniture-shop-api --update-env

   # Check if .env.production exists
   ls -la .env.production
   ```

8. **Database migration failures**

   ```bash
   # Check database connection
   psql $DATABASE_URL -c "SELECT version();"

   # Reset migrations (CAUTION: This will delete data)
   npx prisma migrate reset

   # Deploy migrations step by step
   npx prisma migrate deploy --verbose
   ```

## 🎉 100% FREE Deployment Complete!

Your Furniture Shop Management System is now deployed on AWS Free Tier at **$0.00/month**!

### 🌐 Access URLs:

- **API Base**: `http://[YOUR-ELASTIC-IP]/api/v1`
- **Health Check**: `http://[YOUR-ELASTIC-IP]/health`
- **System Info**: `http://[YOUR-ELASTIC-IP]/api/v1/info`
- **Admin Panel**: Use Postman collection with your Elastic IP

### 📋 Next Steps:

1. **Import Postman Collections**

   - `Furniture_Shop_Complete_API.postman_collection.json`
   - `Furniture_Shop_Complete_Environment.postman_environment.json`
   - Update `baseUrl` with your Elastic IP

2. **Test Demo Credentials**

   ```json
   {
     "admin": "admin@furniturestore.com / admin123",
     "manager": "manager@furniturestore.com / manager123",
     "staff": "staff@furniturestore.com / staff123"
   }
   ```

3. **Monitor Free Tier Usage**

   - Set billing alerts
   - Check usage weekly
   - Keep instances running 24/7

4. **Optional Enhancements**
   - Add domain name (requires purchase)
   - Setup SSL certificate
   - Configure automated backups

### 💰 **Total Monthly Cost: $0.00** ✅

### 🚀 **Your Free Tier Architecture:**

```
Internet → Elastic IP (FREE) → EC2 t2.micro (FREE) → RDS db.t3.micro (FREE)
                                     ↓
                                S3 5GB (FREE)
```

**Congratulations! You now have a production-ready furniture shop management system running completely FREE on AWS!** 🎉

### 📊 **What You Get:**

- ✅ Complete REST API with authentication
- ✅ PostgreSQL database with sample data
- ✅ File upload capabilities
- ✅ Business analytics and reporting
- ✅ Inventory management
- ✅ Sales tracking
- ✅ Customer management
- ✅ 24/7 uptime
- ✅ Static IP address
- ✅ Production-ready setup

**Happy coding and happy selling!** 🛋️💼
