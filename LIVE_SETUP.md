# 🌐 Mockneto — How to Check & Run the Live App

> What to do after turning on your laptop to make sure the production
> app is running at **https://d1r044vobuw5uv.cloudfront.net**

---

## 🔗 Live App URLs

| What | URL |
|---|---|
| 🌐 **Frontend (Live)** | https://d1r044vobuw5uv.cloudfront.net |
| 🩺 **Backend Health** | http://13.60.193.71/api/health |
| 🐙 **GitHub Actions** | https://github.com/Prakhar1903/MOCKNETO/actions |

---

## ✅ Step 1 — Check if App is Already Running

Open your browser and go to:
```
http://13.60.193.71/api/health
```

**If you see this → everything is fine, nothing to do:**
```json
{"status":"OK","database":"Connected"}
```

**If the page doesn't load or shows an error → go to Step 2.**

---

## 🛠️ Step 2 — Restart the Backend (If It's Down)

Open a terminal and SSH into the EC2 server:

```bash
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71
```

Once inside the server, run:

```bash
# Check if container is running
docker ps
```

**If `mockneto-backend` is NOT in the list**, start it:

```bash
# Login to AWS container registry
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin \
  467397259363.dkr.ecr.eu-north-1.amazonaws.com

# Start the container
docker run -d \
  --name mockneto-backend \
  --restart unless-stopped \
  -p 5600:5600 \
  -e PORT=5600 \
  -e NODE_ENV=production \
  -e MONGODB_URI='mongodb+srv://admin_db_user:Mockneto2026@cluster0.kght3sk.mongodb.net/mockneto?retryWrites=true&w=majority&appName=Cluster0' \
  -e JWT_SECRET='lets-go-to-boston' \
  -e GEMINI_API_KEY='AIzaSyBB4LZZ2lLkFdy--EKm7yarOXzEswP2U88' \
  -e GEMINI_MODEL='gemini-flash-latest' \
  -e FRONTEND_ORIGIN='https://d1r044vobuw5uv.cloudfront.net' \
  467397259363.dkr.ecr.eu-north-1.amazonaws.com/mockneto-backend:latest
```

Wait 5 seconds, then verify:
```bash
curl http://localhost:5600/api/health
# Expected: {"status":"OK","database":"Connected"}
```

Exit the server:
```bash
exit
```

---

## 🔄 Step 3 — Deploy New Code Changes

If you made code changes and want to push them live:

```bash
cd ~/Mockneto
git add .
git commit -m "your message here"
git push origin main
```

GitHub Actions will automatically:
1. Build Docker image → push to AWS ECR
2. SSH into EC2 → pull new image → restart container
3. Build React → upload to S3 → refresh CloudFront

Watch it run live:
```
https://github.com/Prakhar1903/MOCKNETO/actions
```

Takes about **2–3 minutes** to complete.

---

## 🩺 Quick Diagnostics

```bash
# SSH into EC2
ssh -i ~/mockneto-key.pem ubuntu@13.60.193.71

# See all containers (running or stopped)
docker ps -a

# See backend logs (last 30 lines)
docker logs mockneto-backend --tail 30

# Restart a stopped container
docker start mockneto-backend

# Check Nginx is running
sudo systemctl status nginx

# Restart Nginx if needed
sudo systemctl restart nginx
```

---

## ❓ Common Situations

| Situation | What to do |
|---|---|
| Frontend loads but login fails | Check `http://13.60.193.71/api/health` → restart container if down |
| `docker ps` shows container but health fails | `docker logs mockneto-backend --tail 30` to see the error |
| Container crashes immediately | MongoDB Atlas might be paused — log in to atlas.mongodb.com and resume cluster |
| Want latest code live | `git push origin main` → wait 3 min → check GitHub Actions |
| SSH key permission error | Run `chmod 400 ~/mockneto-key.pem` then try SSH again |
