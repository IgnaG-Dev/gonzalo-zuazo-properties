# Imagen única, desplegada como dos servicios EasyPanel (web / worker) con
# distinto start command a partir del mismo build. Ver README para detalles.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
# Las variables NEXT_PUBLIC_* se incrustan en el bundle del cliente en build
# time (no se leen en runtime), así que deben llegar como build args.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm run build:worker

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone server (web) — ya incluye su propio node_modules podado.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Worker compilado + node_modules completos de producción (node-cron, etc.,
# que el bundle standalone de Next no incluye por no ser dependencias del web).
COPY --from=builder /app/dist-worker ./dist-worker
COPY --from=prod-deps /app/node_modules ./node_modules

USER nextjs

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Start command por defecto (servicio "web" en EasyPanel).
# El servicio "worker" debe sobreescribirlo con: node dist-worker/worker/index.js
CMD ["node", "server.js"]
