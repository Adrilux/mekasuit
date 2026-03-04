import { notFound } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { SiteForm } from "@/components/sites/site-form"
import { SiteDeactivateButton } from "@/components/sites/site-deactivate-button"

export default async function EditSitePage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const session = await requireSession()
  assertCan(session, "site:update")

  const site = await prisma.site.findFirst({
    where: { id: siteId, tenantId: session.tenantId },
  })

  if (!site) notFound()

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Modifier le site</h1>

      <SiteForm site={{ id: site.id, name: site.name, address: site.address }} />

      {session.permissions.includes("site:deactivate") && site.isActive && (
        <div className="border border-red-100 rounded-lg p-4 bg-red-50/50">
          <h3 className="text-sm font-medium text-red-900 mb-1">Zone dangereuse</h3>
          <p className="text-sm text-red-700 mb-3">
            Désactiver ce site empêchera la création de nouvelles interventions. Les données existantes sont conservées.
          </p>
          <SiteDeactivateButton siteId={site.id} siteName={site.name} />
        </div>
      )}
    </div>
  )
}
