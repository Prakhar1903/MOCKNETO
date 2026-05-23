# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

# Copy from builder
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Switch to non-root user
USER nodeuser

EXPOSE 5600

# Health check so Docker knows the container is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5600/api/health || exit 1

CMD ["node", "app.js"]
