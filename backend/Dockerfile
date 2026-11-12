# Multi-stage Dockerfile for MobiMatch Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configuration and packages
COPY package.json package-lock.json ./
COPY packages/api-contracts ./packages/api-contracts
COPY backend ./backend

# Install dependencies and build
RUN npm ci
RUN npm run --workspace=@mobimatch/api-contracts build
RUN npm run --workspace=mobimatch-backend build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/packages/api-contracts ./packages/api-contracts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/migrations ./backend/migrations
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]

