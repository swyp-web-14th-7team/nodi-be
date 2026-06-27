# syntax=docker/dockerfile:1
# check=error=true
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/generated ./prisma/generated

HEALTHCHECK \
    --start-period=15s \
    --start-interval=2s \
    --interval=10s \
    --timeout=5s \
    --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/src/main"]
