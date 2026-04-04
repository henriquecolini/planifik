# 1. Base image
FROM node:22-alpine AS base

# 2. Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_ENV=development
RUN npm ci

# 3. Build app
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx --no-install prisma generate
RUN npm run build

# 4. Production image
FROM base AS runner
WORKDIR /app
RUN apk add --no-cache openssl postgresql-client

ENV NODE_ENV=production

# Copy only necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prisma needs schema (sometimes)
COPY prisma ./prisma

EXPOSE 3000

COPY start.sh ./start.sh
CMD ["./start.sh"]
