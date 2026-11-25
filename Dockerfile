# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci --ignore-scripts && node scripts/prepare-next.js patch-only

FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
ARG NEXT_PUBLIC_WS_URL=http://127.0.0.1:3001
ARG NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
ARG NEXT_PUBLIC_APP_NAME=Leadsetu

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S leadsetu && adduser -S leadsetu -G leadsetu

COPY --from=builder /app/public ./public
COPY --from=builder --chown=leadsetu:leadsetu /app/.next/standalone ./
COPY --from=builder --chown=leadsetu:leadsetu /app/.next/static ./.next/static

USER leadsetu

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then((r) => { if (r.status >= 500) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "server.js"]
