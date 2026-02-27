import { prisma } from "@/lib/db/prisma-client-singleton"

export type AuthUserBasic = {
  id: string
  name: string
  email: string
}

/**
 * Résout une liste d'authUserId (Better Auth) en noms/emails.
 * Better Auth stocke les utilisateurs dans sa propre table `user`.
 * On l'interroge directement via Prisma $queryRaw.
 */
export async function queryGetUsersByAuthIds(authUserIds: string[]): Promise<AuthUserBasic[]> {
  if (authUserIds.length === 0) return []

  // Better Auth crée la table "user" dans le schéma public
  const rows = await prisma.$queryRaw<AuthUserBasic[]>`
    SELECT id, name, email
    FROM "user"
    WHERE id = ANY(${authUserIds})
  `

  return rows
}

/**
 * Construit un Map<authUserId, name> pour un accès rapide dans les composants serveur.
 */
export async function buildUserNameMap(authUserIds: string[]): Promise<Map<string, string>> {
  const users = await queryGetUsersByAuthIds(authUserIds)
  return new Map(users.map((u) => [u.id, u.name]))
}
