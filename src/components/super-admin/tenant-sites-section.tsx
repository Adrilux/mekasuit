"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { actionDeleteSite } from "@/server/actions/super-admin/action-delete-site"

export type SiteWithCounts = {
  id: string
  name: string
  address: string | null
  isActive: boolean
  _count: {
    machines: number
    stockItems: number
    interventions: number
  }
}

type Props = {
  tenantId: string
  sites: SiteWithCounts[]
}

export function TenantSitesSection({ sites }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(siteId: string) {
    setDeletingId(siteId)

    const result = await actionDeleteSite({ siteId })

    setDeletingId(null)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Site supprimé")
    router.refresh()
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Aucun site — utilisez le bouton ci-dessus pour en ajouter un.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sites.map((site) => {
        const isDeleting = deletingId === site.id
        const hasData =
          site._count.machines > 0 ||
          site._count.stockItems > 0 ||
          site._count.interventions > 0

        return (
          <div
            key={site.id}
            className="group flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{site.name}</p>
                {site.address && (
                  <p className="text-xs text-slate-400 mt-0.5">{site.address}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{site._count.machines} machine{site._count.machines !== 1 ? "s" : ""}</span>
                  <span>{site._count.stockItems} article{site._count.stockItems !== 1 ? "s" : ""} stock</span>
                  <span>{site._count.interventions} intervention{site._count.interventions !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-600 hover:text-red-400 hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isDeleting || hasData}
              title={
                hasData
                  ? "Impossible de supprimer : ce site contient des données"
                  : "Supprimer ce site"
              }
              onClick={() => { void handleDelete(site.id) }}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
