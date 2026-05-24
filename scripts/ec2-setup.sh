#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  EC2 Bootstrap Script — Mockneto
#  Run this ONCE after creating your EC2 instance:
#    chmod +x scripts/ec2-setup.sh && ./scripts/ec2-setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "════════════════════════════════════════"
echo "  Mockneto EC2 Setup Script"
echo "════════════════════════════════════════"

# ── 1. System Updates ──────────────────────────────────────────────────────
echo "▶ Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ── 2. Install Docker ──────────────────────────────────────────────────────
echo "▶ Installing Docker..."
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu   # Allow ubuntu user to run docker without sudo

# ── 3. Install Docker Compose ─────────────────────────────────────────────
echo "▶ Installing Docker Compose..."
sudo apt-get install -y docker-compose

# ── 4. Install Nginx ──────────────────────────────────────────────────────
echo "▶ Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# ── 5. Install AWS CLI ────────────────────────────────────────────────────
echo "▶ Installing AWS CLI..."
sudo apt-get install -y awscli

# ── 6. Install Git ────────────────────────────────────────────────────────
echo "▶ Installing Git..."
sudo apt-get install -y git

# ── 7. Configure Nginx reverse proxy ─────────────────────────────────────
echo "▶ Configuring Nginx..."
sudo cp /home/ubuntu/MOCKNETO/nginx/nginx.conf /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "════════════════════════════════════════"
echo "  ✅ EC2 Setup Complete!"
echo ""
echo "  Next steps:"
echo "  1. Configure AWS credentials: aws configure"
echo "  2. Create your Backend/.env file"
echo "  3. Run: docker compose up -d --build"
echo "════════════════════════════════════════"
