# DevOps Environment Setup - Opeyemi Ariyo

**Date:** September 30, 2025
**To:** Opeyemi Ariyo (`opeyemiariyo@intentsolutions.io`)
**From:** Jeremy Longshore, CEO - Intent Solutions
**Re:** DiagnosticPro Development Environment Access & Guidelines

---

## 🎯 Your Access Overview

Welcome to the DiagnosticPro development team! You've been granted **DevOps Engineer** access to our development infrastructure. This document outlines your permissions, available tools, and best practices.

## 🔐 Access Permissions

### GitHub Repository Access
- **Repository:** `jeremylongshore/DiagnosticPro`
- **Permission Level:** Write Access
- **Branch Protection:** Active (all changes require Jeremy's approval)

**Your Workflow:**
1. Clone the repository
2. Create feature branches (`feature/your-branch-name`)
3. Make your changes and commit
4. Create pull requests for Jeremy's review
5. Wait for approval before merge

**Important:** You CANNOT push directly to the main branch - this is intentional for production safety.

### Google Cloud Project Access

#### ✅ FULL ACCESS (Development Environment)
- **Project:** `diagnosticpro-relay` (DiagnosticPro Dev)
- **Permission:** Editor Access
- **Project ID:** 405424743490

**You can freely:**
- Deploy and test services
- Modify resources and configurations
- Run experiments and proof-of-concepts
- Access logs and monitoring data
- Use all enabled APIs and services

#### 👁️ VIEW-ONLY ACCESS (Production Monitoring)
- **DiagnosticPro Production** (`diagnostic-pro-prod`) - Live customer systems
- **DiagnosticPro Data** (`diagnostic-pro-start-up`) - BigQuery data warehouse (266 tables)
- **DiagnosticPro Creative** (`creatives-diag-pro`) - Marketing and creative assets

**You can:**
- Monitor production health and metrics
- View configurations for reference
- Troubleshoot issues across the full stack
- Access logs for debugging

**You cannot:**
- Modify production resources
- Deploy to production environments
- Change billing or cost settings

## 🛠️ Available APIs & Services

### AI/ML Development Tools
```bash
# Enabled AI services in your dev environment:
✅ Vertex AI Platform         # Build and deploy ML models
✅ Gemini Code Assist        # AI-powered code completion
✅ Container Analysis        # Security scanning and code quality
```

### Data & Analytics
```bash
✅ BigQuery                  # Data warehouse and analytics
✅ Cloud Storage             # File storage and data lakes
✅ Pub/Sub                   # Event streaming and messaging
✅ Datastore/Firestore       # NoSQL databases
✅ Cloud Logging             # Centralized logging
✅ Cloud Monitoring          # Metrics and alerting
```

### Development Foundation
```bash
✅ Cloud APIs               # Google Cloud service integrations
✅ Service Management       # API configuration and management
✅ Analytics Hub            # Data sharing and collaboration
```

### 🚫 Billing Protection
- **NO access to billing accounts** - You cannot accidentally incur costs
- **Cost-controlled environment** - Spend limits managed by Jeremy
- **Safe experimentation** - Play freely without budget concerns

## 📋 Quick Start Commands

### Authentication & Setup
```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your default project to development
gcloud config set project diagnosticpro-relay

# Verify your access
gcloud projects describe diagnosticpro-relay
```

### Repository Setup
```bash
# Clone the repository
git clone https://github.com/jeremylongshore/DiagnosticPro.git
cd DiagnosticPro

# Create your feature branch
git checkout -b feature/opeyemi-devops-setup

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Workflow
```bash
# Check project status
gcloud projects list

# View enabled services
gcloud services list --enabled --project=diagnosticpro-relay

# Access logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Monitor resources
gcloud compute instances list
gcloud run services list
```

## 🔍 Linux Command Reference

### File Search & Navigation

#### Find Files by Name
```bash
# Find files by name (case-insensitive)
find /path/to/search -iname "*.js"
find . -name "config*"

# Find files modified in last 7 days
find . -type f -mtime -7

# Find large files (>100MB)
find . -type f -size +100M
```

#### Search File Contents (grep)
```bash
# Search for text in files
grep -r "function" .                    # Recursive search
grep -i "error" /var/log/*.log         # Case-insensitive
grep -n "TODO" src/*.js                # Show line numbers
grep -v "debug" app.log                # Exclude lines with "debug"

# Advanced grep patterns
grep -E "(error|warning)" *.log       # Multiple patterns
grep -A 5 -B 5 "exception" app.log    # 5 lines before/after match
```

#### Modern Search Tools (Recommended)
```bash
# ripgrep (rg) - faster than grep
rg "function" --type js                # Search JS files only
rg "error" -A 3 -B 3                  # Context lines
rg "api" --ignore-case                # Case-insensitive

# fd - modern find replacement
fd config                             # Find files named config
fd -e js                              # Find all .js files
fd -t d node                          # Find directories named node
```

### System Information
```bash
# Disk usage
df -h                                 # Human readable disk space
du -sh *                              # Directory sizes
du -h --max-depth=1                   # Subdirectory sizes

# Process monitoring
ps aux | grep node                    # Find Node.js processes
htop                                  # Interactive process viewer
lsof -i :3000                        # What's using port 3000

# System resources
free -h                               # Memory usage
uname -a                              # System information
uptime                                # System uptime and load
```

### File Operations
```bash
# Safe file operations
cp -r source/ destination/            # Copy directory recursively
mv old_name new_name                  # Rename/move files
rm -rf directory/                     # Remove directory (CAREFUL!)

# File permissions
chmod 755 script.sh                  # Make executable
chown user:group file.txt             # Change ownership
ls -la                                # Detailed file listing

# Archive operations
tar -czf backup.tar.gz directory/     # Create compressed archive
tar -xzf backup.tar.gz                # Extract archive
zip -r backup.zip directory/          # Create ZIP archive
```

### Network & Services
```bash
# Network diagnostics
curl -I https://diagnosticpro.io      # Check HTTP headers
wget https://example.com/file.zip     # Download files
netstat -tulpn                        # Active network connections

# Service management (systemd)
systemctl status nginx                # Check service status
systemctl restart service_name       # Restart service
journalctl -u service_name -f         # Follow service logs
```

## 🚀 Best Practices

### Git Workflow
```bash
# Always work on feature branches
git checkout -b feature/descriptive-name

# Commit frequently with clear messages
git add .
git commit -m "feat: add user authentication middleware"

# Push your branch and create PR
git push origin feature/descriptive-name
# Then create Pull Request on GitHub for Jeremy's review
```

### Development Environment
- **Test thoroughly** in dev before requesting production deployment
- **Use meaningful branch names** (`feature/add-auth`, `fix/payment-bug`)
- **Document your changes** in pull request descriptions
- **Monitor resource usage** to stay within development quotas

### Security Guidelines
- **Never commit secrets** or API keys to the repository
- **Use environment variables** for configuration
- **Follow principle of least privilege** - only request access you need
- **Report security issues** immediately to Jeremy

## 📞 Support & Communication

### Getting Help
- **Technical Questions:** Create GitHub issues in the repository
- **Access Issues:** Contact Jeremy directly
- **Production Emergencies:** Immediate escalation to Jeremy

### Useful Resources
- **Repository:** https://github.com/jeremylongshore/DiagnosticPro
- **Google Cloud Console:** https://console.cloud.google.com
- **Project Documentation:** See `/docs` directory in repository

## 🎯 Your Mission

As our DevOps engineer, your primary responsibilities include:

1. **Infrastructure as Code** - Manage deployment configurations
2. **CI/CD Pipeline Development** - Automate testing and deployment
3. **Monitoring & Alerting** - Ensure system health and performance
4. **Security Implementation** - Maintain security best practices
5. **Development Support** - Enable efficient development workflows

## ⚠️ Important Reminders

- **Development environment** is your playground - experiment freely!
- **Production changes** require Jeremy's explicit approval
- **All repository changes** go through pull request review process
- **Billing and costs** are protected - you cannot accidentally overspend
- **Security first** - when in doubt, ask before proceeding

---

**Welcome to the team! Let's build something amazing together.**

**Jeremy Longshore**
CEO, Intent Solutions
jeremy@intentsolutions.io

---

*This document was generated on September 30, 2025. For the most current access and permissions, always verify through the Google Cloud Console and GitHub repository settings.*