import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { serverEnv } from "@/lib/env/env-server-schema"

// Prisma 7 utilise le Query Compiler (WASM) et requiert un adapter DB
// @prisma/adapter-pg avec la connexion poolée (PgBouncer Neon)

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: serverEnv.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log:
      serverEnv.APP_ENV === "development" || serverEnv.APP_ENV === "debug"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  })
}

// Singleton — évite les connexions multiples en développement (hot reload Next.js)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
