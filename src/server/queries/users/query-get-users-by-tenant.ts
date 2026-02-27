import { prisma } from "@/lib/db/prisma-client-singleton"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetUsersByTenant(session: SessionUser) {
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { joinedAt: "desc" },
    include: {
      userSites: { select: { site: { select: { id: true, name: true } } } },
      tenantRole: { select: { id: true, name: true } },
    },
  })

  if (tenantUsers.length === 0) return []

  // Résolution des noms/emails depuis la table Better Auth
  const authIds = tenantUsers.map((u) => u.authUserId)
  const authUsers = await prisma.$queryRaw<{ id: string; name: string; email: string }[]>`
    SELECT id, name, email FROM "user" WHERE id = ANY(${authIds}::text[])
  `
  const authMap = Object.fromEntries(authUsers.map((u) => [u.id, u]))

  return tenantUsers.map((u) => ({
    ...u,
    name: authMap[u.authUserId]?.name ?? "—",
    email: authMap[u.authUserId]?.email ?? "",
    // jobTitle and managerId are already in tenantUser — just remapped for clarity
    jobTitle: u.jobTitle ?? null,
    managerId: u.managerId ?? null,
  }))
}

export type TenantUserListItem = Awaited<ReturnType<typeof queryGetUsersByTenant>>[number]
