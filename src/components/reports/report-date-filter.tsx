"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"

const PRESETS = [
  { label: "30 derniers jours", days: 30 },
  { label: "3 derniers mois", days: 90 },
  { label: "6 derniers mois", days: 180 },
  { label: "Cette année", days: 365 },
]

export function ReportDateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (from) params.set("from", from)
      else params.delete("from")
      if (to) params.set("to", to)
      else params.delete("to")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""

  function applyPreset(days: number) {
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    update(fromDate.toISOString().slice(0, 10), toDate.toISOString().slice(0, 10))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.days}
          onClick={() => applyPreset(p.days)}
          className="h-7 px-3 text-xs rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          {p.label}
        </button>
      ))}
      <span className="text-slate-300 hidden sm:inline">|</span>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          className="h-7 px-2 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={from}
          onChange={(e) => update(e.target.value, to)}
        />
        <span className="text-slate-400 text-xs">→</span>
        <input
          type="date"
          className="h-7 px-2 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={to}
          onChange={(e) => update(from, e.target.value)}
        />
      </div>
    </div>
  )
}
