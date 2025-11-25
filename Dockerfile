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


# 5. Build Next.js (requires DATABASE_URL → passed via ARG)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN ./node_modules/.bin/prisma generate

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

# Create non-root user EARLY to avoid chown -R later
RUN useradd -m -u 1001 nodejs

# Ensure /app is owned by nodejs (it was created by WORKDIR as root)
# This is fast because /app is empty
RUN chown nodejs:nodejs /app

# Install ONLY production deps
# Copy with ownership so nodejs user can write to it during install if needed
COPY --chown=nodejs:nodejs package.json package-lock.json ./

# Switch to user BEFORE installing deps to avoid root ownership issues
USER nodejs

# Install prod deps (files will be owned by nodejs)
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy Next.js build with ownership
COPY --chown=nodejs:nodejs --from=builder /app/.next ./.next
COPY --chown=nodejs:nodejs --from=builder /app/public ./public

# Copy Prisma client + schema with ownership
COPY --chown=nodejs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nodejs:nodejs --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma

# Copy environment file if it exists
COPY --chown=nodejs:nodejs .env* ./

EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && npm start"]
