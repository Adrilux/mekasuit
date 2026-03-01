"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Save, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { actionCreateCustomReport } from "@/server/actions/reports/action-create-custom-report"
import { actionUpdateCustomReport } from "@/server/actions/reports/action-update-custom-report"

export type ColumnDef = {
  key: string
  label: string
  description: string
}

export const AVAILABLE_COLUMNS: ColumnDef[] = [
  { key: "machineName", label: "Machine", description: "Nom de la machine" },
  { key: "mtbfHours", label: "MTBF (h)", description: "Temps moyen entre pannes (heures)" },
  { key: "interventionCount", label: "Nb pannes", description: "Nombre d'interventions correctives" },
  { key: "downtimeHours", label: "Arrêt (h)", description: "Cumul temps d'indisponibilité (heures)" },
  { key: "availabilityRate", label: "Dispo %", description: "Taux de disponibilité (%)" },
  { key: "totalCostCents", label: "Coût (€)", description: "Coût total des pièces consommées" },
  { key: "partsConsumed", label: "Pièces consommées", description: "Nombre de pièces utilisées" },
  { key: "slaRate", label: "Taux SLA %", description: "Pourcentage d'interventions dans les délais" },
  { key: "avgResponseHours", label: "Délai moyen (h)", description: "Délai moyen de résolution (heures)" },
]

type ReportFilters = {
  siteId?: string
  from?: string
  to?: string
}

type Props = {
  sites: { id: string; name: string }[]
  initialName?: string
  initialColumns?: string[]
  initialFilters?: ReportFilters
  reportId?: string // si édition
}

export function CustomReportBuilder({
  sites,
  initialName = "",
  initialColumns = [],
  initialFilters = {},
  reportId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialName)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(initialColumns))
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)

  function toggleColumn(key: string) {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Preserve original column order from AVAILABLE_COLUMNS
  const orderedColumns = AVAILABLE_COLUMNS.filter((c) => selectedColumns.has(c.key))

  function handleSave() {
    if (!name.trim()) { setError("Donnez un nom au rapport"); return }
    if (selectedColumns.size === 0) { setError("Sélectionnez au moins une colonne"); return }
    setError(null)

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        columns: AVAILABLE_COLUMNS.filter((c) => selectedColumns.has(c.key)).map((c) => c.key),
        filters,
      }

      let result
      if (reportId) {
        result = await actionUpdateCustomReport({ id: reportId, ...payload })
      } else {
        result = await actionCreateCustomReport(payload)
      }

      if (!result.success) {
        setError(result.error ?? "Erreur lors de la sauvegarde")
        return
      }

      if (!reportId && result.data) {
        router.push(`/reports/custom/${(result.data as { id: string }).id}`)
      } else {
        router.refresh()
      }
    })
  }

  const printParams = new URLSearchParams()
  if (filters.siteId) printParams.set("siteId", filters.siteId)
  if (filters.from) printParams.set("from", filters.from)
  if (filters.to) printParams.set("to", filters.to)
  const printUrl = `/reports/print?${printParams.toString()}`

  return (
    <div className="space-y-6">
      {/* Nom */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Nom du rapport</h2>
        <div>
          <Label htmlFor="report-name" className="sr-only">Nom</Label>
          <Input
            id="report-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Disponibilité machines — Site A"
            className="max-w-md"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Filtres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="filter-site" className="text-sm text-slate-600 mb-1 block">Site</Label>
            <select
              id="filter-site"
              value={filters.siteId ?? ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, siteId: e.target.value || undefined }))}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Tous les sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="filter-from" className="text-sm text-slate-600 mb-1 block">Du</Label>
            <Input
              id="filter-from"
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value || undefined }))}
            />
          </div>
          <div>
            <Label htmlFor="filter-to" className="text-sm text-slate-600 mb-1 block">Au</Label>
            <Input
              id="filter-to"
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value || undefined }))}
            />
          </div>
        </div>
      </div>

      {/* Colonnes */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Colonnes du rapport</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_COLUMNS.map((col) => (
            <label
              key={col.key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedColumns.has(col.key)
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedColumns.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-slate-900 text-sm">{col.label}</div>
                <div className="text-xs text-slate-500">{col.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Aperçu */}
      {orderedColumns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-900 text-sm">Aperçu des colonnes sélectionnées</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {orderedColumns.map((col) => (
                    <th key={col.key} className="px-4 py-2 text-left font-medium text-slate-600 text-xs bg-slate-50">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {orderedColumns.map((col) => (
                    <td key={col.key} className="px-4 py-2 text-slate-400 italic text-xs">
                      {col.description}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="w-4 h-4 mr-1.5" />
          {isPending ? "Sauvegarde…" : reportId ? "Mettre à jour" : "Sauvegarder"}
        </Button>
        <Button variant="outline" asChild>
          <a href={printUrl} target="_blank" rel="noreferrer">
            <Printer className="w-4 h-4 mr-1.5" />
            Exporter PDF
          </a>
        </Button>
      </div>
    </div>
  )
}
