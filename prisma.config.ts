import { config } from "dotenv"
// Next.js utilise .env.local — on le charge explicitement pour Prisma CLI
config({ path: ".env.local" })
config({ path: ".env" }) // fallback
import { defineConfig } from "prisma/config"

// Configuration Prisma 7 — les URLs de connexion sont ici, pas dans schema.prisma
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    // URL directe (non-poolée) pour les migrations
    // Neon requiert une connexion directe pour les migrations DDL
    ...(process.env.DATABASE_URL_UNPOOLED
      ? { directUrl: process.env.DATABASE_URL_UNPOOLED }
      : {}),
  },
})
