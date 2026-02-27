"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function StockFilters() {
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
  const lowStock = searchParams.get("lowStock") ?? ""
  const hasFilters = search || lowStock

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("lowStock")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <Input
          className="pl-8 h-8 w-48 text-sm"
          placeholder="Référence, désignation…"
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value
            clearTimeout((window as typeof window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer)
            ;(window as typeof window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => update("search", val), 300)
          }}
        />
      </div>

      <label className="h-8 px-3 flex items-center gap-2 text-sm border border-slate-200 rounded-md bg-white cursor-pointer hover:bg-slate-50">
        <input
          type="checkbox"
          checked={lowStock === "1"}
          onChange={(e) => update("lowStock", e.target.checked ? "1" : "")}
          className="w-3.5 h-3.5 accent-amber-500"
        />
        <span className="text-slate-700">Sous seuil uniquement</span>
      </label>

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
