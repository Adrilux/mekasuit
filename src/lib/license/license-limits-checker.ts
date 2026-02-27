import { prisma } from "@/lib/db/prisma-client-singleton"
import { LicenseError } from "@/lib/errors/app-error-classes"

// Vérifie si le tenant peut créer un site supplémentaire
export async function assertCanAddSite(tenantId: string): Promise<void> {
  const [license, siteCount] = await Promise.all([
    prisma.license.findUnique({ where: { tenantId }, select: { maxSites: true } }),
    prisma.site.count({ where: { tenantId, isActive: true } }),
  ])

  if (!license) throw new LicenseError("Licence introuvable pour ce tenant")

  if (siteCount >= license.maxSites) {
    throw new LicenseError(
      `Limite de ${license.maxSites} site(s) atteinte. Passez à un abonnement supérieur.`,
      { current: siteCount, max: license.maxSites }
    )
  }
}

// Vérifie si le tenant peut inviter un utilisateur supplémentaire
export async function assertCanAddUser(tenantId: string): Promise<void> {
  const [license, userCount] = await Promise.all([
    prisma.license.findUnique({ where: { tenantId }, select: { maxUsers: true } }),
    prisma.tenantUser.count({ where: { tenantId, isActive: true } }),
  ])

  if (!license) throw new LicenseError("Licence introuvable pour ce tenant")

  if (userCount >= license.maxUsers) {
    throw new LicenseError(
      `Limite de ${license.maxUsers} utilisateur(s) atteinte. Passez à un abonnement supérieur.`,
      { current: userCount, max: license.maxUsers }
    )
  }
}
