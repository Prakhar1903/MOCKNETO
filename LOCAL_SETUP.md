# 💻 Mockneto — Local Development Setup Guide

> Complete step-by-step from turning on your laptop to having both
> Frontend and Backend running locally.

---

## 🖥️ System Info
| Item | Value |
|---|---|
| Node.js | v22.20.0 |
| npm | 11.11.0 |
| MongoDB | v8.0.21 (local) |
| Frontend port | `http://localhost:5173` |
| Backend port | `http://localhost:5600` |

---

## ✅ One-Time Prerequisites
> Only do this the **first time** on a new machine. Skip if already installed.

```bash
# 1. Install Node.js (v20+ recommended)
# Download from: https://nodejs.org/en/download

# 2. Install MongoDB locally
# Ubuntu:
sudo apt-get install -y mongodb
# Or follow: https://www.mongodb.com/docs/manual/installation/

# 3. Install nodemon globally (for backend hot-reload)
npm install -g nodemon
```

---

## 🚀 Every Time You Open Your Laptop — Full Startup Sequence

### Step 1 — Start MongoDB (Local Database)
Open a terminal and run:
```bash
sudo systemctl start mongod
```

Verify it's running:
```bash
sudo systemctl status mongod
# Should say: Active: active (running)
```

> ⚠️ If you skip this step, the backend will fail to connect to the database.

---

### Step 2 — Open the Project Folder

```bash
cd ~/Mockneto
```

---

### Step 3 — Start the Backend

Open a **new terminal tab** (keep it open — don't close it):

```bash
cd ~/Mockneto/Backend
npm run dev
```

✅ You should see:
```
Server running on http://localhost:5600
MongoDB connected successfully
```

> 💡 `npm run dev` uses **nodemon** which auto-restarts when you edit backend files.

---

### Step 4 — Start the Frontend

Open **another new terminal tab**:

```bash
cd ~/Mockneto/ai-based-project
npm run dev
```

✅ You should see:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 5 — Open the App in Browser

```
http://localhost:5173
```

---

## 🗂️ Terminal Layout (Keep 2 tabs open)

```
Tab 1 (Backend):   cd ~/Mockneto/Backend && npm run dev
Tab 2 (Frontend):  cd ~/Mockneto/ai-based-project && npm run dev
```

---

## 🔐 Backend Environment Variables

File: `Backend/.env` — already configured, no changes needed for local dev.

| Variable | Local Value |
|---|---|
| `PORT` | `5600` |
| `MONGODB_URI` | `mongodb://localhost:27017/MOCKNETO` |
| `JWT_SECRET` | `YOUR_JWT_SECRET` |
| `GEMINI_API_KEY` | `YOUR_GEMINI_API_KEY` |
| `FRONTEND_URL` | `http://localhost:5173` |

---

## 🔄 Verify Everything is Working

```bash
# Check backend health
curl http://localhost:5600/api/health
# Expected: {"status":"OK","database":"Connected"}
```

Then open `http://localhost:5173` → try **Login / Signup**.

---

## 🛑 How to Stop Everything

```bash
# In Backend terminal:  Ctrl + C
# In Frontend terminal: Ctrl + C
# Stop MongoDB:
sudo systemctl stop mongod
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connected failed` | Run `sudo systemctl start mongod` |
| `Port 5600 already in use` | Run `lsof -ti:5600 \| xargs kill` |
| `Port 5173 already in use` | Run `lsof -ti:5173 \| xargs kill` |
| `Cannot find module` (Backend) | Run `cd Backend && npm install` |
| `Cannot find module` (Frontend) | Run `cd ai-based-project && npm install` |
| Changes not showing | Hard refresh browser: `Ctrl + Shift + R` |

---

## 📁 Project Structure Quick Reference

```
Mockneto/
├── Backend/              ← Node.js + Express API
│   ├── app.js            ← Entry point (port 5600)
│   ├── .env              ← Environment variables
│   └── package.json      ← npm run dev / start
│
├── ai-based-project/     ← React + Vite Frontend
│   ├── src/
│   │   ├── api.jsx       ← Axios config (baseURL)
│   │   └── ...
│   └── package.json      ← npm run dev
│
└── LOCAL_SETUP.md        ← This file
```
