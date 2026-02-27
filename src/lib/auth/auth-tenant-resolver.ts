import { prisma } from "@/lib/db/prisma-client-singleton"

// Résout le tenantId à partir du slug (URL) ou de l'authUserId
// Utilisé dans le middleware et lors de l'onboarding

export async function resolveTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true },
  })
}

export async function resolveTenantByUserId(authUserId: string) {
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { authUserId },
    include: { tenant: { select: { id: true, name: true, slug: true, isActive: true } } },
  })

  if (!tenantUser?.tenant.isActive) return null

  return tenantUser.tenant
}
