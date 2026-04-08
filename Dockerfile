# ─────────────────────────────────────────────────────────────────────────────
# TrustOps — Node.js Frontend + Express API Container
# (ML inference now lives in ml-service/Dockerfile)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-slim AS build-stage
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Install deps (cache layer)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# ── Stage 2: Production Node runtime ─────────────────────────────────────────
FROM node:20-slim AS production-stage
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Production deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built frontend + Express server
COPY --from=build-stage /app/dist ./dist

# Environment
ENV NODE_ENV=production
ENV PORT=5001
# ML microservice URL — override at runtime or via docker-compose
ENV ML_API_URL=http://ml-service:8000

EXPOSE 5001

CMD ["node", "dist/index.js"]
