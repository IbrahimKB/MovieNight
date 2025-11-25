# ---------------------------------------------
# Stage 1: Builder (installs deps, builds Next)
# ---------------------------------------------
FROM node:20-bullseye AS builder
WORKDIR /app

# 1. Copy package manifests
COPY package.json package-lock.json ./

# 2. Install ALL dependencies
RUN npm install --legacy-peer-deps && npm cache clean --force

# 3. Copy full project
COPY . .

# 4. Generate Prisma client
RUN npx prisma generate

# 5. Build Next.js (requires DATABASE_URL → passed via ARG)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV PRISMA_SKIP_ENGINE_CHECK=true
RUN npm run build

# 6. Cleanup builder artifacts
RUN npm cache clean --force && rm -rf /app/.next/cache


# ---------------------------------------------
# Stage 2: Runner (production runtime)
# ---------------------------------------------
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install ONLY production deps
COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy Next.js build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy Prisma client + schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy environment file if it exists
COPY .env* ./

# Create non-root user for security
RUN useradd -m -u 1001 nodejs && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
