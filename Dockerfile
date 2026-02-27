# ─── Stage 1 : deps ───────────────────────────────────────────────────────────
# Installe uniquement les dépendances de production
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2 : builder ────────────────────────────────────────────────────────
# Compile le projet Next.js
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copie toutes les dépendances (dev comprises pour le build)
COPY package.json package-lock.json ./
RUN npm ci

# Copie le code source
COPY . .

# Génère le client Prisma (WASM query compiler)
RUN npx prisma generate

# Build Next.js en mode standalone — réduit drastiquement la taille de l'image
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ─── Stage 3 : runner ─────────────────────────────────────────────────────────
# Image finale minimale
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie les fichiers statiques générés par Next.js
COPY --from=builder /app/public ./public

# Next.js standalone — crée un serveur Node minimal
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Client Prisma généré (WASM)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
