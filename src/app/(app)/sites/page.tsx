import Link from "next/link"
import { Plus, MapPin } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { can } from "@/lib/permissions/permission-matrix"

export default async function SitesPage() {
  const session = await requireSession()
  const sites = await queryGetSitesByTenant(session)
  const canCreate = can(session.role, "site:create")

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-slate-900">Sites</h1>
        {canCreate && (
          <Button asChild size="sm" className="self-start sm:self-auto">
            <Link href="/sites/new">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un site
            </Link>
          </Button>
        )}
      </div>

      {sites.length === 0 ? (
        <EmptyStatePlaceholder
          icon={MapPin}
          title="Aucun site configuré"
          description="Ajoutez votre premier site pour commencer."
          action={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/sites/new">Ajouter un site</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <div key={site.id} className={`bg-white border rounded-lg p-5 ${!site.isActive ? "opacity-60 border-slate-100" : "border-slate-200"}`}>
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-slate-900">{site.name}</h2>
                {!site.isActive && <Badge variant="outline" className="text-xs text-slate-400">Désactivé</Badge>}
              </div>

              {site.address && <p className="text-sm text-slate-500 mb-3">{site.address}</p>}

              <div className="flex gap-4 text-sm text-slate-600 mb-4">
                <span>{site._count.machines} machine(s)</span>
                {site._count.interventions > 0 && (
                  <span className="text-orange-600 font-medium">
                    {site._count.interventions} intervention(s) ouverte(s)
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Link href={`/machines?siteId=${site.id}`} className="text-xs text-blue-600 hover:underline">
                  Machines
                </Link>
                <span className="text-slate-300">·</span>
                <Link href={`/interventions?siteId=${site.id}`} className="text-xs text-blue-600 hover:underline">
                  Interventions
                </Link>
                {can(session.role, "site:update") && (
                  <>
                    <span className="text-slate-300">·</span>
                    <Link href={`/sites/${site.id}/edit`} className="text-xs text-slate-500 hover:underline">
                      Modifier
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
