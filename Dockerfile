# Multi-stage build for optimal image size and caching
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy application source code
COPY . .

# Build the Vite React frontend into /app/dist
RUN npm run build

# ── Production Image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend server code
COPY server ./server

# Create data directory for Railway Volume
RUN mkdir -p /app/data/recordings

# Expose server port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

# Start the Express server
CMD ["node", "server/index.js"]
