# ─── Stage 1: compile TS ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# 1) Copy package manifests & install all deps
COPY package.json package-lock.json ./
RUN npm ci

# 2) Copy TS source & compile
COPY . .
RUN npm run build

# ─── Stage 2: production image ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# 3) Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --production

# 4) Copy built output
COPY --from=builder /app/dist ./dist

# 5) Expose port and launch
EXPOSE 3000
CMD ["npm", "start"]
