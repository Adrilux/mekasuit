import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"
import { TenantGeneralForm } from "./tenant-general-form"
import { Settings2 } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

async function getTenantInfo(tenantId: string) {
  return withTenantContext(tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, createdAt: true },
    })
  })
}

export default async function SettingsGeneralPage() {
  const session = await requireSession()
  assertCan(session, "module:activate")

  const tenant = await getTenantInfo(session.tenantId)
  if (!tenant) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Paramètres
        </Link>
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-bold text-slate-900">Paramètres généraux</h1>
        </div>
      </div>

      {/* Infos tenant */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Identité de l&apos;organisation</h2>
        <TenantGeneralForm tenantId={tenant.id} currentName={tenant.name} />
        <dl className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Slug (URL)</dt>
            <dd className="font-mono font-medium text-slate-700 mt-0.5">{tenant.slug}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Membre depuis</dt>
            <dd className="font-medium text-slate-700 mt-0.5">
              {new Date(tenant.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Timezone info */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Fuseau horaire</h2>
        <p className="text-sm text-slate-500">
          Le fuseau horaire est actuellement déterminé par votre navigateur. La gestion des fuseaux
          horaires par tenant est prévue dans une prochaine mise à jour.
        </p>
      </div>
    </div>
  )
}
