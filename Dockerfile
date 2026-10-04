# syntax=docker/dockerfile:1.19
FROM node:20-alpine AS base
RUN apk add --no-cache openssl ca-certificates

# --- deps: install with cache ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts

# --- build: compile TypeScript and prepare prisma client ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runner: minimal image for the running app ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/prisma/dev.db
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=build --chown=nodejs:nodejs /app/build ./build
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json
COPY --chown=nodejs:nodejs error-handler.cjs ./error-handler.cjs

RUN mkdir -p /data/prisma && chown -R nodejs:nodejs /data

USER nodejs
EXPOSE 8080

CMD ["npm", "run", "start"]
