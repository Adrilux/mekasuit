"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Users, MapPin, ChevronDown, ChevronUp, Power, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { actionToggleModule } from "@/server/actions/super-admin/action-toggle-module"
import { actionUpdateLicense } from "@/server/actions/super-admin/action-update-license"
import { actionToggleTenant } from "@/server/actions/super-admin/action-toggle-tenant"
import { toast } from "sonner"
import type { TenantWithDetails } from "@/server/queries/super-admin/query-get-all-tenants"
import { ModuleName } from "@prisma/client"

const MODULE_LABELS: Record<ModuleName, string> = {
  GMAO: "GMAO (noyau)",
  STOCK_MANAGEMENT: "Gestion de stock",
  AI_ASSISTANT: "Assistant IA",
  ADVANCED_REPORTS: "Rapports avancés",
  INTER_SITE_TRANSFERS: "Transferts inter-sites",
}

type TenantCardProps = { tenant: TenantWithDetails }

export function TenantCard({ tenant }: TenantCardProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [licenseForm, setLicenseForm] = useState({
    maxSites: String(tenant.license?.maxSites ?? 1),
    maxUsers: String(tenant.license?.maxUsers ?? 5),
    billingPeriod: tenant.license?.billingPeriod ?? "monthly",
    renewsAt: tenant.license?.renewsAt
      ? new Date(tenant.license.renewsAt).toISOString().slice(0, 10)
      : "",
  })

  async function handleToggleModule(module: ModuleName, currentlyActive: boolean) {
    setLoading(`module-${module}`)
    const result = await actionToggleModule({
      tenantId: tenant.id,
      module,
      activate: !currentlyActive,
    })
    setLoading(null)

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success(
        `Module ${MODULE_LABELS[module]} ${!currentlyActive ? "activé" : "désactivé"}`
      )
      router.refresh()
    }
  }

  async function handleSaveLicense(e: React.FormEvent) {
    e.preventDefault()
    if (!licenseForm.renewsAt) {
      toast.error("La date de renouvellement est requise")
      return
    }
    setLoading("license")
    const result = await actionUpdateLicense({
      tenantId: tenant.id,
      ...licenseForm,
    })
    setLoading(null)

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Licence mise à jour")
      router.refresh()
    }
  }

  async function handleToggleTenant() {
    setLoading("tenant")
    const result = await actionToggleTenant({
      tenantId: tenant.id,
      isActive: !tenant.isActive,
    })
    setLoading(null)

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success(tenant.isActive ? "Tenant désactivé" : "Tenant réactivé")
      router.refresh()
    }
  }

  const allModules = Object.values(ModuleName)
  const activeModuleSet = new Set(
    tenant.modules.filter((m) => m.isActive).map((m) => m.module)
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* En-tête */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tenant.isActive ? "bg-blue-900" : "bg-slate-700"
              }`}
            >
              <Building2
                className={`w-4 h-4 ${
                  tenant.isActive ? "text-blue-400" : "text-slate-500"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-white">{tenant.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{tenant.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tenant._count.sites} site{tenant._count.sites !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tenant._count.tenantUsers} user{tenant._count.tenantUsers !== 1 ? "s" : ""}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setExpanded(!expanded) }}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="ml-1">{expanded ? "Réduire" : "Gérer"}</span>
            </Button>
          </div>
        </div>

        {/* Pastilles des modules */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {allModules.map((mod) => {
            const active = activeModuleSet.has(mod)
            return (
              <span
                key={mod}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  active
                    ? "bg-green-900 text-green-400"
                    : "bg-slate-700 text-slate-500"
                }`}
              >
                {MODULE_LABELS[mod]}
              </span>
            )
          })}
        </div>
      </div>

      {/* Panneau étendu */}
      {expanded && (
        <div className="border-t border-slate-700 px-5 py-4 space-y-6 bg-slate-900">
          {/* Modules */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Modules</h4>
            <div className="space-y-2">
              {allModules.map((mod) => {
                const active = activeModuleSet.has(mod)
                const isGmao = mod === ModuleName.GMAO
                const isLoadingThis = loading === `module-${mod}`
                return (
                  <div
                    key={mod}
                    className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
                  >
                    <span className="text-sm font-medium text-slate-300">
                      {MODULE_LABELS[mod]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${active ? "text-green-400" : "text-slate-500"}`}
                      >
                        {active ? "Actif" : "Inactif"}
                      </span>
                      <Button
                        size="sm"
                        variant={active ? "outline" : "default"}
                        disabled={isGmao || isLoadingThis}
                        onClick={() => { void handleToggleModule(mod, active) }}
                        className={`h-7 text-xs ${active ? "border-slate-600 text-slate-300 hover:bg-slate-700" : ""}`}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : active ? (
                          "Désactiver"
                        ) : (
                          "Activer"
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Licence */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Licence</h4>
            <form
              onSubmit={handleSaveLicense}
              className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`maxSites-${tenant.id}`} className="text-xs text-slate-400">
                    Sites max
                  </Label>
                  <Input
                    id={`maxSites-${tenant.id}`}
                    type="number"
                    min={1}
                    max={100}
                    value={licenseForm.maxSites}
                    onChange={(e) => {
                      setLicenseForm({ ...licenseForm, maxSites: e.target.value })
                    }}
                    className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <Label htmlFor={`maxUsers-${tenant.id}`} className="text-xs text-slate-400">
                    Utilisateurs max
                  </Label>
                  <Input
                    id={`maxUsers-${tenant.id}`}
                    type="number"
                    min={1}
                    max={1000}
                    value={licenseForm.maxUsers}
                    onChange={(e) => {
                      setLicenseForm({ ...licenseForm, maxUsers: e.target.value })
                    }}
                    className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Facturation</Label>
                  <Select
                    value={licenseForm.billingPeriod}
                    onValueChange={(v) => {
                      setLicenseForm({ ...licenseForm, billingPeriod: v })
                    }}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="yearly">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`renewsAt-${tenant.id}`} className="text-xs text-slate-400">
                    Renouvellement
                  </Label>
                  <Input
                    id={`renewsAt-${tenant.id}`}
                    type="date"
                    value={licenseForm.renewsAt}
                    onChange={(e) => {
                      setLicenseForm({ ...licenseForm, renewsAt: e.target.value })
                    }}
                    className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-slate-200"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={loading === "license"}
                className="w-full"
              >
                {loading === "license" ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Sauvegarder la licence"
                )}
              </Button>
            </form>
          </div>

          {/* Zone de danger */}
          <div>
            <h4 className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Zone de danger</h4>
            <Button
              variant="outline"
              size="sm"
              disabled={loading === "tenant"}
              onClick={handleToggleTenant}
              className={
                tenant.isActive
                  ? "border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
                  : "border-green-800 text-green-400 hover:bg-green-950 hover:text-green-300"
              }
            >
              {loading === "tenant" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Power className="w-4 h-4 mr-2" />
              )}
              {tenant.isActive ? "Désactiver ce tenant" : "Réactiver ce tenant"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
