import { prisma } from "./prisma-client-singleton"

// Vérifie que la connexion DB est opérationnelle
// Utilisé au démarrage et dans les health checks API
export async function checkDatabaseConnection(): Promise<{
  ok: boolean
  latencyMs?: number
  error?: string
}> {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur de connexion inconnue",
    }
  }
}
