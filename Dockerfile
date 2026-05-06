FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Install all dependencies (Required for both Dev and Build)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Development Stage
# This stage is specifically for local development
FROM base AS dev
ENV NODE_ENV=development
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Run Next.js in dev mode
CMD ["npm", "run", "dev"]

# 3. Production Builder Stage
FROM base AS builder
ARG NEXT_PUBLIC_PAGE_SIZE=10
ARG NEXT_PUBLIC_CH_PAGE_SIZE=10
ENV NEXT_PUBLIC_PAGE_SIZE=$NEXT_PUBLIC_PAGE_SIZE
ENV NEXT_PUBLIC_CH_PAGE_SIZE=$NEXT_PUBLIC_CH_PAGE_SIZE
# Use deps for the build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 4. Production Runner Stage
FROM base AS runner
ENV NODE_ENV=production
# Re-install only production deps to keep image slim
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]