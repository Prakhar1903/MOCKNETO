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
