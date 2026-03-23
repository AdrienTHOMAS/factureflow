# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: production image
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy deps and app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure data directory exists and is owned by appuser
RUN mkdir -p data && chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=8091

EXPOSE 8091

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8091/health || exit 1

CMD ["node", "server.js"]
