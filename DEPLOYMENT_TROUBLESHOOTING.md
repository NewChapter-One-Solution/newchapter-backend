# 🚨 Elastic Beanstalk Deployment Troubleshooting Guide

## Current Issue: Health Status Red/Degraded

Your deployment finished successfully, but the application health is **Red** with status **Degraded**. This means:

- ✅ **Deployment completed** - Files were uploaded and deployed
- ❌ **Application not starting** - The Node.js app is failing to start or respond

## 🔍 Immediate Diagnosis Steps

### Step 1: Check Application Logs

```bash
# Using EB CLI
eb logs --all

# Or check specific log files
eb ssh
sudo tail -f /var/log/eb-engine.log
sudo tail -f /var/log/nodejs/nodejs.log
```

### Step 2: Check Application Status

```bash
# SSH into the instance
eb ssh

# Check if Node.js process is running
ps aux | grep node

# Check application logs
cd /var/app/current
ls -la
cat /var/log/nodejs/nodejs.log
```

### Step 3: Test Application Manually

```bash
# SSH into instance
eb ssh

# Navigate to app directory
cd /var/app/current

# Try to start manually
node start.js

# Check if dependencies are installed
ls -la node_modules/
npm list --depth=0
```

## 🔧 Common Issues & Solutions

### Issue 1: Missing Dependencies

**Symptoms:** Application fails to start with module not found errors

**Solution:**

```bash
# SSH into instance
eb ssh
cd /var/app/current

# Install dependencies manually
npm install --only=production

# Try starting again
node start.js
```

### Issue 2: Database Connection Issues

**Symptoms:** Application starts but fails on database connection

**Solution:**

1. **Set Environment Variables** in EB Console:

   ```
   DATABASE_URL=postgresql://username:password@host:5432/database
   NODE_ENV=production
   PORT=8080
   ```

2. **Test Database Connection:**

   ```bash
   # SSH into instance
   eb ssh
   cd /var/app/current

   # Test database connection
   node -e "
   require('dotenv').config();
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.\$connect().then(() => {
     console.log('Database connected successfully');
     process.exit(0);
   }).catch(err => {
     console.error('Database connection failed:', err);
     process.exit(1);
   });
   "
   ```

### Issue 3: Port Configuration Issues

**Symptoms:** Application starts but health checks fail

**Solution:**

1. **Verify Port Configuration:**

   ```bash
   # Check environment variables
   eb ssh
   echo $PORT  # Should be 8080
   ```

2. **Update Application to Use Correct Port:**
   - Ensure your app listens on `process.env.PORT || 8080`
   - Ensure it binds to `0.0.0.0` not `localhost`

### Issue 4: Prisma Client Issues

**Symptoms:** Prisma client not generated or outdated

**Solution:**

```bash
# SSH into instance
eb ssh
cd /var/app/current

# Generate Prisma client
npx prisma generate

# Check if generated directory exists
ls -la generated/

# Try starting application
node start.js
```

## 🛠️ Quick Fix Deployment

Let me create an updated deployment configuration that addresses common issues:

### Updated .ebextensions Configuration

**01-nodejs.config:**

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    NPM_USE_PRODUCTION: false
    PORT: 8080
    HOST: "0.0.0.0"
```

**02-deployment.config:**

```yaml
option_settings:
  aws:elasticbeanstalk:command:
    DeploymentPolicy: AllAtOnce
    Timeout: 900

container_commands:
  01_install_dependencies:
    command: "npm ci --only=production"
    cwd: "/var/app/staging"
  02_generate_prisma:
    command: "npx prisma generate"
    cwd: "/var/app/staging"
    ignoreErrors: true
  03_create_logs_dir:
    command: "mkdir -p logs"
    cwd: "/var/app/staging"

files:
  "/opt/elasticbeanstalk/tasks/taillogs.d/nodejs.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      /var/log/nodejs/nodejs.log
      /var/app/current/logs/*.log
```

## 🚀 Immediate Action Plan

### Option 1: Quick Environment Variable Fix

1. **Go to AWS EB Console**
2. **Navigate to Configuration → Software**
3. **Add Environment Properties:**
   ```
   DATABASE_URL=your_database_connection_string
   NODE_ENV=production
   PORT=8080
   HOST=0.0.0.0
   JWT_ACCESS_TOKEN_SECRET=your_secret
   JWT_REFRESH_TOKEN_SECRET=your_secret
   ```
4. **Apply Changes** (this will restart the application)

### Option 2: Redeploy with Fixed Configuration

1. **Update the GitHub workflow** with the improved configuration above
2. **Push changes** to trigger new deployment
3. **Monitor logs** during deployment

### Option 3: Manual Fix via SSH

1. **SSH into the instance:**

   ```bash
   eb ssh
   ```

2. **Navigate to app directory:**

   ```bash
   cd /var/app/current
   ```

3. **Check what's failing:**

   ```bash
   # Check if start.js exists
   ls -la start.js

   # Try running manually
   node start.js

   # Check for missing dependencies
   npm list --depth=0
   ```

4. **Fix common issues:**

   ```bash
   # Install missing dependencies
   npm install --only=production

   # Generate Prisma client
   npx prisma generate

   # Create logs directory
   mkdir -p logs

   # Try starting again
   node start.js
   ```

## 📊 Health Check Debugging

### Check Current Health Status

```bash
# Get detailed health information
eb health --refresh

# Check specific instance health
eb health --view detailed
```

### Test Health Endpoint

```bash
# From outside
curl -v http://your-app-url.elasticbeanstalk.com/api/v1/health

# From inside instance
eb ssh
curl -v http://localhost:8080/api/v1/health
```

## 🔍 Log Analysis Commands

### Essential Log Commands

```bash
# Application logs
eb logs --all

# Real-time log monitoring
eb ssh
sudo tail -f /var/log/eb-engine.log
sudo tail -f /var/log/nodejs/nodejs.log

# Check deployment logs
sudo tail -f /var/log/eb-activity.log

# Check system logs
sudo tail -f /var/log/messages
```

### Log Locations

- **Application Logs:** `/var/log/nodejs/nodejs.log`
- **EB Engine Logs:** `/var/log/eb-engine.log`
- **Deployment Logs:** `/var/log/eb-activity.log`
- **System Logs:** `/var/log/messages`
- **Custom App Logs:** `/var/app/current/logs/`

## 🎯 Most Likely Solutions

Based on common deployment issues, try these in order:

### 1. Set Environment Variables (Most Common)

- Go to EB Console → Configuration → Software
- Add `DATABASE_URL` and other required environment variables
- Apply changes

### 2. Fix Dependencies

```bash
eb ssh
cd /var/app/current
npm install --only=production
sudo service nodejs restart
```

### 3. Generate Prisma Client

```bash
eb ssh
cd /var/app/current
npx prisma generate
sudo service nodejs restart
```

### 4. Check Application Code

- Ensure your server listens on `process.env.PORT`
- Ensure it binds to `0.0.0.0` not `localhost`
- Ensure health endpoint `/api/v1/health` is accessible

## 📞 Next Steps

1. **Try Option 1** (Environment Variables) first - it's the quickest fix
2. **Check logs** using the commands above
3. **Share the log output** if you need further assistance
4. **Consider redeploying** with the improved configuration

The most common cause is missing environment variables, especially `DATABASE_URL`. Set that first and the application should recover within a few minutes.

Let me know what you find in the logs and I can provide more specific guidance! 🚀
