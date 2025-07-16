# ─── Stage 1: Build all your code ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Copy package manifests and install ALL deps (incl. dev)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2. Copy source & build both client and server
COPY . .
RUN npm run build         # Runs `build:client` + `build:server`

# ─── Stage 2: Production image ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# 1. Copy only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# 2. Pull in built artifacts and any public assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# 3. Expose the port your SSR server listens on
EXPOSE 3000

# 4. Launch your SSR entrypoint
CMD ["npm", "start"]
