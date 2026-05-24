# 🚀 Mockneto — AWS Production Deployment Reference

> Complete record of everything set up for the AWS production deployment.
> Use this as a reference to reproduce or update the deployment from scratch.

---

## 🏗️ Architecture Overview

```
User (Browser)
     │
     ▼ HTTPS
┌─────────────────────────────┐
│     AWS CloudFront CDN      │  d1r044vobuw5uv.cloudfront.net
│  Distribution: E2NXR1MQBZCMQV │
└──────┬──────────────────────┘
       │                    │
  /api/* behavior       /* (default)
       │                    │
       ▼ HTTP               ▼
┌──────────────┐    ┌──────────────────┐
│  AWS EC2     │    │   AWS S3 Bucket  │
│ 13.60.193.71 │    │ mockneto-frontend│
│ eu-north-1   │    │  -prakhar        │
│              │    └──────────────────┘
│  Nginx :80   │
│      │       │
│  Docker      │
│  Node.js:5600│
│      │       │
└──────┼───────┘
       │
       ▼
┌──────────────────────────────────┐
│  MongoDB Atlas                   │
│  cluster0.kght3sk.mongodb.net    │
│  DB: mockneto                    │
└──────────────────────────────────┘
```

---

## 📋 All AWS Resources Created

| Resource | Name / ID | Region |
|---|---|---|
| **EC2 Instance** | `mockneto-backend` | `eu-north-1` |
| **EC2 Public IP** | `13.60.193.71` | — |
| **EC2 DNS** | `ec2-13-60-193-71.eu-north-1.compute.amazonaws.com` | — |
| **ECR Repository** | `mockneto-backend` | `eu-north-1` |
| **ECR Registry URL** | `467397259363.dkr.ecr.eu-north-1.amazonaws.com` | — |
| **S3 Bucket** | `mockneto-frontend-prakhar` | `eu-north-1` |
| **CloudFront Distribution ID** | `E2NXR1MQBZCMQV` | Global |
| **CloudFront Domain** | `d1r044vobuw5uv.cloudfront.net` | — |
| **IAM User** | `mockneto-deployer` | Global |

---

## 🔑 Credentials & Keys

| Item | Value / Location |
|---|---|
| **EC2 SSH Key** | `~/mockneto-key.pem` |
| **IAM Access Key ID** | `YOUR_AWS_ACCESS_KEY_ID` |
| **MongoDB Atlas URI** | `YOUR_MONGODB_ATLAS_URI` |

---

## 🔐 GitHub Repository Secrets
Location: `GitHub → MOCKNETO repo → Settings → Secrets → Actions`

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | `YOUR_AWS_ACCESS_KEY_ID` |
| `AWS_SECRET_ACCESS_KEY` | `YOUR_AWS_SECRET_ACCESS_KEY` |
| `EC2_HOST` | `13.60.193.71` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of `~/mockneto-key.pem` |
| `MONGO_URI` | MongoDB Atlas connection string (see above) |
| `JWT_SECRET` | `YOUR_JWT_SECRET` |
| `GEMINI_API_KEY` | `YOUR_GEMINI_API_KEY` |
| `FRONTEND_ORIGIN` | `https://d1r044vobuw5uv.cloudfront.net` |
| `S3_BUCKET_NAME` | `mockneto-frontend-prakhar` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E2NXR1MQBZCMQV` |

---

## 🛠️ Step-by-Step: What Was Built (In Order)

### Phase 1 — Dockerization

**Files created:**
- `Backend/Dockerfile` — Multi-stage Node.js build, non-root user, healthcheck on port 5600
- `Backend/.dockerignore` — Excludes node_modules, .env
- `docker-compose.yml` — Local testing only

**Test locally:**
```bash
docker build ./Backend
docker compose up --build
curl http://localhost:5600/api/health
```

---

### Phase 2 — CI/CD Pipeline

**File created:** `.github/workflows/deploy.yml`

**What it does on every `git push` to `main`:**

| Job | Steps |
|---|---|
| 🐳 `deploy-backend` | 1. Checkout code → 2. Login to ECR → 3. `docker build` → 4. `docker push` to ECR → 5. SSH into EC2 → 6. Pull new image → 7. Stop old container → 8. Start new container with env vars → 9. Health check |
| ⚛️ `deploy-frontend` | 1. Checkout code → 2. `npm ci` → 3. `npm run build` (with `VITE_API_BASE_URL`) → 4. `aws s3 sync dist/ → S3` → 5. CloudFront cache invalidation |

---

### Phase 3 — AWS EC2 Setup

**Instance specs:**
- OS: Ubuntu Server 22.04 LTS
- Type: `t2.micro` (Free Tier)
- Region: `eu-north-1` (Stockholm)
- Security Group inbound ports: `22`, `80`, `443`, `5600`

**SSH command:**
```bash
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71
```

**Bootstrap script run on EC2:**
```bash
git clone https://github.com/Prakhar1903/MOCKNETO.git
cd MOCKNETO
chmod +x scripts/ec2-setup.sh && ./scripts/ec2-setup.sh
```

This installed: Docker, Docker Compose, Nginx, AWS CLI, Git.

**AWS credentials configured on EC2:**
```bash
aws configure set aws_access_key_id YOUR_AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key YOUR_AWS_SECRET_ACCESS_KEY
aws configure set default.region eu-north-1
aws configure set default.output json
```

**Nginx config** (`/etc/nginx/sites-available/default`):
- Listens on port 80
- Proxies all traffic to `http://localhost:5600` (Docker container)
- Read timeout: 120s (for slow Gemini AI responses)

---

### Phase 4 — AWS ECR (Container Registry)

```bash
# Created repository
aws ecr create-repository --repository-name mockneto-backend --region eu-north-1

# Registry URL:
# 467397259363.dkr.ecr.eu-north-1.amazonaws.com/mockneto-backend
```

**Images in ECR:**
- `latest` — current live image
- Tagged with git commit SHA for each deploy

---

### Phase 5 — AWS S3 + CloudFront (Frontend)

**S3 Bucket:**
- Name: `mockneto-frontend-prakhar`
- Static website hosting: enabled
- Index document: `index.html`
- Public access: allowed

**CloudFront Distribution:**
- ID: `E2NXR1MQBZCMQV`
- Domain: `d1r044vobuw5uv.cloudfront.net`
- **Origin 1 (default `/*`)**: S3 website endpoint → `http-only` protocol
- **Origin 2 (`/api/*`)**: EC2 DNS hostname → `http-only` protocol
- Default root object: `index.html`

> ⚠️ Key fix: CloudFront origin for S3 must use `http-only` (S3 website endpoints don't support HTTPS).
> ⚠️ Key fix: CloudFront `/api/*` behavior routes to EC2 DNS hostname (IP addresses not allowed).

---

### Phase 6 — IAM User for CI/CD

**User:** `mockneto-deployer`

**Policies attached:**
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`

---

### Phase 7 — Running Docker Container on EC2

The container is started/restarted by the CI/CD pipeline automatically.

**Manual start command (if needed):**
```bash
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71

# On EC2:
ECR_REGISTRY=467397259363.dkr.ecr.eu-north-1.amazonaws.com
ECR_REPOSITORY=mockneto-backend

# Login to ECR
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest image
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Stop old container
docker stop mockneto-backend && docker rm mockneto-backend

# Start new container
docker run -d \
  --name mockneto-backend \
  --restart unless-stopped \
  -p 5600:5600 \
  -e PORT=5600 \
  -e NODE_ENV=production \
  -e MONGODB_URI='YOUR_MONGODB_ATLAS_URI' \
  -e JWT_SECRET='YOUR_JWT_SECRET' \
  -e GEMINI_API_KEY='YOUR_GEMINI_API_KEY' \
  -e GEMINI_MODEL='gemini-flash-latest' \
  -e FRONTEND_ORIGIN='https://d1r044vobuw5uv.cloudfront.net' \
  $ECR_REGISTRY/$ECR_REPOSITORY:latest
```

---

## ✅ Verification Commands

```bash
# 1. Backend health check (via Nginx on EC2)
curl http://13.60.193.71/api/health
# Expected: {"status":"OK","database":"Connected"}

# 2. Backend health check (direct Docker port)
curl http://13.60.193.71:5600/api/health

# 3. Check Docker container status on EC2
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71 "docker ps"

# 4. Check Docker logs
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71 "docker logs mockneto-backend --tail 30"

# 5. Check Nginx status
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71 "sudo systemctl status nginx"

# 6. Frontend live
open https://d1r044vobuw5uv.cloudfront.net
```

---

## 🔄 How to Deploy (After Any Code Change)

```bash
# From your laptop — just push to main:
git add .
git commit -m "your message"
git push origin main

# GitHub Actions will automatically:
# → Build Docker image → Push to ECR → Deploy to EC2
# → Build React → Upload to S3 → Invalidate CloudFront
```

Watch the pipeline live:
```
https://github.com/Prakhar1903/MOCKNETO/actions
```

---

## 🧯 Troubleshooting Production

| Problem | Fix |
|---|---|
| Container not running | SSH in → `docker ps -a` → `docker logs mockneto-backend` |
| DB Disconnected | Check MongoDB Atlas cluster is running (not paused) |
| Frontend icons broken | Check Google Fonts loading in browser DevTools → Network tab |
| Mixed Content error | Ensure frontend calls `https://` not `http://` — check `VITE_API_BASE_URL` |
| CloudFront 504 | Check S3 origin protocol is `http-only` (not `https-only`) |
| API 404 from frontend | Check CloudFront `/api/*` behavior exists and points to EC2 |
| CI/CD failed | Check GitHub → Actions tab for error details |
| ECR push permission denied | Check IAM user has `AmazonEC2ContainerRegistryFullAccess` |
| Nginx 502 Bad Gateway | Container crashed — SSH in and `docker start mockneto-backend` |

---

## 📦 Files Created for DevOps

```
Mockneto/
├── Backend/
│   ├── Dockerfile            ← Multi-stage Docker build
│   └── .dockerignore         ← Excludes node_modules, .env
├── nginx/
│   └── nginx.conf            ← Nginx reverse proxy config
├── scripts/
│   └── ec2-setup.sh          ← EC2 bootstrap (Docker, Nginx, AWS CLI)
├── docker-compose.yml        ← Local testing only
├── .github/
│   └── workflows/
│       └── deploy.yml        ← Full CI/CD pipeline
├── LOCAL_SETUP.md            ← Local dev guide
└── DEPLOYMENT.md             ← This file
```

---

---

## 🎓 Viva / PPT — Key Definitions

> Memorize these. These are the exact definitions your professor will ask about.

---

### 🐳 Docker
**Definition:** Docker is a containerization platform that packages an application and all its dependencies (Node.js, libraries, config) into a single portable unit called a **container**, so it runs identically on any machine.

**What we did:** We wrote a `Dockerfile` that packages the Mockneto backend into a container image. This image is stored in ECR and deployed on EC2.

**Key terms:**
- **Image** — A blueprint/snapshot of the app (like a class)
- **Container** — A running instance of an image (like an object)
- **Dockerfile** — Instructions to build the image
- **ECR** — AWS registry to store images

---

### 🔄 CI/CD (Continuous Integration / Continuous Deployment)
**Definition:** CI/CD is an automated pipeline that builds, tests, and deploys your application every time code is pushed to GitHub — removing the need to deploy manually.

**What we did:** We wrote `.github/workflows/deploy.yml` — a GitHub Actions pipeline that:
- **CI:** Automatically builds the Docker image on every `git push`
- **CD:** Pushes to ECR → SSHs into EC2 → restarts container → builds frontend → uploads to S3 → clears CloudFront cache

**Key terms:**
- **Pipeline** — A series of automated steps
- **Trigger** — What starts the pipeline (`git push` to `main`)
- **Job** — A group of steps (we have 2: backend deploy, frontend deploy)
- **GitHub Actions** — The CI/CD platform (free, built into GitHub)

---

### ☁️ AWS EC2 (Elastic Compute Cloud)
**Definition:** EC2 is a virtual server (cloud computer) provided by AWS. You rent it by the hour and run any application on it.

**What we did:** Launched a `t2.micro` Ubuntu server in `eu-north-1` (Stockholm). Our Node.js backend Docker container runs on this server behind Nginx.

**Key terms:**
- **Instance** — A single virtual server
- **t2.micro** — Size (1 vCPU, 1GB RAM — Free Tier)
- **AMI** — The OS image used (Ubuntu 22.04)
- **Security Group** — Virtual firewall controlling which ports are open
- **Key Pair (.pem)** — SSH login credentials

---

### 📦 AWS ECR (Elastic Container Registry)
**Definition:** ECR is AWS's private Docker image registry — like Docker Hub but hosted inside AWS. It stores our backend Docker images securely.

**What we did:** CI/CD builds the Docker image and pushes it to ECR (`mockneto-backend`). The EC2 server pulls the latest image from ECR on each deployment.

---

### 🌐 AWS S3 (Simple Storage Service)
**Definition:** S3 is cloud object storage. We use it to host the React frontend as static files (HTML, CSS, JS).

**What we did:** After `npm run build`, CI/CD uploads the `dist/` folder to S3. S3 serves these files to CloudFront.

**Key terms:**
- **Bucket** — A container for files (like a folder in the cloud)
- **Static website hosting** — Serving HTML/JS/CSS directly from S3
- **Object** — Any file stored in S3

---

### 🌍 AWS CloudFront (CDN)
**Definition:** CloudFront is a Content Delivery Network (CDN). It caches your files at servers around the world (Edge Locations) so users get fast load times from anywhere.

**What we did:** CloudFront sits in front of both S3 (frontend) and EC2 (API). All production traffic goes through `https://d1r044vobuw5uv.cloudfront.net`. We configured two origins:
- `/api/*` → routes to EC2 (backend)
- `/*` → routes to S3 (frontend)

**Key terms:**
- **CDN** — Network of servers caching content closer to users
- **Edge Location** — A CloudFront server near the user
- **Cache Invalidation** — Clearing old cached files after new deployment
- **Origin** — Where CloudFront fetches real content from (S3 or EC2)
- **Distribution** — A single CloudFront configuration

---

### 🔀 Nginx (Reverse Proxy)
**Definition:** Nginx is a web server used here as a **reverse proxy** — it sits in front of our Node.js app, receives all HTTP requests on port 80, and forwards them to the Docker container on port 5600.

**What we did:** Nginx is installed on EC2. Every request to `http://13.60.193.71` is proxied by Nginx to `http://localhost:5600`.

**Why reverse proxy?**
- Hides the backend port from public internet
- Handles load balancing
- Adds timeouts (we set 120s for slow Gemini AI responses)

---

### 🔐 IAM (Identity and Access Management)
**Definition:** IAM is AWS's permission system — it controls who can do what in your AWS account.

**What we did:** Created IAM user `mockneto-deployer` with only the permissions needed for CI/CD (ECR push, S3 upload, CloudFront invalidation). Its Access Key is stored in GitHub Secrets.

**Principle used:** **Least Privilege** — give only the minimum permissions needed, nothing more.

---

### 🔑 GitHub Secrets
**Definition:** Encrypted environment variables stored in a GitHub repository. Injected into CI/CD workflows at runtime — never visible in code.

**What we did:** Stored AWS keys, MongoDB URI, SSH key, JWT secret as GitHub Secrets so the pipeline can use them safely.

---

### 🍃 MongoDB Atlas
**Definition:** A fully managed cloud database service. Handles backups, scaling, and security automatically — no need to install or maintain MongoDB on the server.

**What we did:** Backend connects to Atlas using a connection URI. The `mockneto` database runs in Atlas, completely separate from the app server.

---

### 🏗️ Infrastructure as Code (IaC)
**Definition:** Managing servers and infrastructure using code/config files instead of manual clicks in a web console.

**What we did:** `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `ec2-setup.sh`, and `deploy.yml` together define our entire infrastructure as code — anyone can recreate the deployment from scratch using just these files.

---

---

## 💻 Important Commands — Live Demo for Presentation

> Run these live during your presentation to impress your professor.

---

### ✅ Show the Live Backend is Running
```bash
curl http://13.60.193.71/api/health
```
**Expected:**
```json
{"status":"OK","database":"Connected"}
```

---

### 🔐 SSH into the Production Server
```bash
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71
```

---

### 🐳 Show Running Docker Container
```bash
# After SSH into EC2:
docker ps
```
Shows: `mockneto-backend` container, uptime, port `0.0.0.0:5600->5600`

---

### 📜 Show Live Backend Logs
```bash
# After SSH into EC2:
docker logs mockneto-backend --tail 20
```
Shows: Real-time server logs — requests, MongoDB connection, Gemini API calls

---

### 🏗️ Show Docker Images in ECR
```bash
# After SSH into EC2:
aws ecr list-images --repository-name mockneto-backend --region eu-north-1
```
Shows: All Docker images stored in the private registry with commit SHA tags

---

### 🚀 Trigger a Live Deployment (Most Impressive)
```bash
# On your laptop:
cd ~/Mockneto
git commit --allow-empty -m "demo: live deployment"
git push origin main
```
Then open: `https://github.com/Prakhar1903/MOCKNETO/actions`

Shows: CI/CD pipeline running live — build → ECR push → EC2 deploy → S3 upload → CloudFront cache invalidation

---

### ☁️ Show Files in S3 Bucket
```bash
aws s3 ls s3://mockneto-frontend-prakhar/assets/ --profile mockneto --region eu-north-1
```
Shows: All frontend files (JS bundle, CSS, images) hosted in S3

---

### 🌍 Show CloudFront Distribution Status
```bash
aws cloudfront get-distribution --id E2NXR1MQBZCMQV --profile mockneto \
  --query 'Distribution.{Status:Status,Domain:DomainName}'
```
Shows: `"Status": "Deployed"`, `"Domain": "d1r044vobuw5uv.cloudfront.net"`

---

### 📊 Show EC2 Server Resource Usage
```bash
# After SSH into EC2:
free -h                                           # RAM usage
df -h                                             # Disk usage
docker stats mockneto-backend --no-stream         # Container CPU & RAM live
```

---

---

## ❓ Expected Viva Questions & Answers

| Question | Short Answer |
|---|---|
| **What is Docker?** | Packages app + dependencies into a container that runs identically anywhere |
| **What is CI/CD?** | Automated pipeline that builds and deploys on every `git push` |
| **What triggers your pipeline?** | `git push` to the `main` branch on GitHub |
| **Where is your backend running?** | Docker container on AWS EC2 `t2.micro` in `eu-north-1` |
| **Where is your frontend hosted?** | AWS S3 bucket, delivered globally via CloudFront CDN |
| **What is Nginx doing here?** | Reverse proxy — receives traffic on port 80, forwards to Docker on port 5600 |
| **Why CloudFront?** | CDN for fast global delivery + HTTPS + routes `/api/*` to EC2 |
| **Why MongoDB Atlas?** | Managed cloud DB — no need to install/maintain MongoDB on the server |
| **What are GitHub Secrets?** | Encrypted env variables used by CI/CD without exposing in code |
| **What is ECR?** | AWS private Docker image registry — stores our built container images |
| **What is Least Privilege?** | IAM principle — give only minimum permissions needed, nothing extra |
| **How do you deploy new code?** | Just `git push origin main` — pipeline handles everything automatically |
| **What if the container crashes?** | `--restart unless-stopped` flag makes Docker auto-restart it |
| **What is a reverse proxy?** | A server that receives requests and forwards them to the actual backend app |
| **How do you verify app is live?** | `curl http://13.60.193.71/api/health` → `{"status":"OK","database":"Connected"}` |
| **What is an EC2 Security Group?** | Virtual firewall that controls inbound/outbound traffic by port |
| **What is S3?** | AWS object storage — we use it to host React static files (HTML, CSS, JS) |
| **What is cache invalidation?** | Telling CloudFront to delete old cached files so users get the new version |
| **What is Infrastructure as Code?** | Defining servers and config as code files instead of manual console clicks |
| **What is the difference between image and container?** | Image = blueprint (static), Container = running instance of that image |
