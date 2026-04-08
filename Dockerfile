# --- Stage 1: Build the React Frontend ---
FROM node:20-slim AS build-stage
WORKDIR /app
COPY package*.json ./
# Use --legacy-peer-deps to handle the vite-plugin conflict
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# --- Stage 2: Final Runtime ---
FROM node:20-slim AS production-stage
WORKDIR /app

# Install Python & Dependencies
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Setup Python VENV
RUN python3 -m venv .venv
COPY server/requirements.txt ./server/
RUN ./.venv/bin/pip install -r server/requirements.txt

# Copy backend and production build
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY --from=build-stage /app/dist ./dist
COPY server/ ./server/
# Ensure the model files are present (if they were generated/stored in server/)
COPY server/*.joblib ./server/

# Environment Variables
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

# Run the server
CMD [ "node", "dist/index.js" ]
