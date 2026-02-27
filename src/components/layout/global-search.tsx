"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Wrench, ClipboardList, Package, X } from "lucide-react"
import type { SearchResult } from "@/server/queries/search/query-global-search"

const TYPE_ICONS = {
  machine: Wrench,
  intervention: ClipboardList,
  stock: Package,
}

const TYPE_LABELS = {
  machine: "Machine",
  intervention: "Intervention",
  stock: "Stock",
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = (await res.json()) as SearchResult[]
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { void search(query) }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, search])

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
        setResults([])
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSelect = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault()
      const r = results[activeIdx]
      if (r) handleSelect(r.href)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm text-slate-500 transition-colors"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left text-xs">Rechercher…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false)
              setQuery("")
              setResults([])
            }
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIdx(-1)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher une machine, intervention, pièce…"
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
                autoComplete="off"
              />
              {(query || loading) && (
                <button
                  onClick={() => {
                    setQuery("")
                    setResults([])
                    inputRef.current?.focus()
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            {loading && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">Recherche…</div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                Aucun résultat pour &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && results.length > 0 && (
              <ul className="max-h-72 overflow-y-auto py-1">
                {results.map((r, idx) => {
                  const Icon = TYPE_ICONS[r.type]
                  const isActive = idx === activeIdx
                  return (
                    <li key={r.id}>
                      <button
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                        onClick={() => handleSelect(r.href)}
                        onMouseEnter={() => setActiveIdx(idx)}
                      >
                        <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                          <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{TYPE_LABELS[r.type]}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {!query && (
              <div className="px-4 py-5 text-center text-xs text-slate-400">
                Tapez au moins 2 caractères · ↑↓ pour naviguer · Entrée pour ouvrir
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
