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

# npm 이 아닌 node 로 직접 실행하면 npm_package_version 이 주입되지 않음.
# 빌드 시 APP_VERSION 을 받아 런타임 env 로 심어 Swagger setVersion 에서 사용.
ARG APP_VERSION
ENV npm_package_version=$APP_VERSION

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
