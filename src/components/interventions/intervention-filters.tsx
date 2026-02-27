"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "OPEN", label: "Ouvert" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "PENDING_PARTS", label: "Attente pièces" },
  { value: "CLOSED", label: "Fermé" },
  { value: "CANCELLED", label: "Annulé" },
]

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "CORRECTIVE", label: "Corrective" },
  { value: "PREVENTIVE", label: "Préventive" },
  { value: "IMPROVEMENT", label: "Amélioration" },
]

const PRIORITY_OPTIONS = [
  { value: "", label: "Toutes les priorités" },
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Normale" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
]

export function InterventionFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const type = searchParams.get("type") ?? ""
  const priority = searchParams.get("priority") ?? ""
  const hasFilters = search || status || type || priority

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("status")
    params.delete("type")
    params.delete("priority")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <Input
          className="pl-8 h-8 w-48 text-sm"
          placeholder="Rechercher…"
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value
            clearTimeout((window as typeof window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer)
            ;(window as typeof window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => update("search", val), 300)
          }}
        />
      </div>

      <select
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={status}
        onChange={(e) => update("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={type}
        onChange={(e) => update("type", e.target.value)}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={priority}
        onChange={(e) => update("priority", e.target.value)}
      >
        {PRIORITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="h-8 px-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md bg-white"
        >
          <X className="w-3 h-3" />
          Effacer
        </button>
      )}
    </div>
  )
}
