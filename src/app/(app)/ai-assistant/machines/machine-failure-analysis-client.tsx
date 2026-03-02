"use client"

import { useState, useTransition } from "react"
import { ArrowLeft, Bot, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { actionAnalyzeMachineFailures } from "@/server/actions/ai/action-analyze-machine-failures"

type Machine = {
  id: string
  name: string
  category: string | null
  siteName: string
}

type AnalysisResult = {
  analysis: string
  machineName: string
  failureCount: number
}

function formatAnalysis(text: string) {
  const result: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let inList = false

  text.split("\n").forEach((line, i) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    if (line.startsWith("## ")) {
      if (inList) {
        result.push(<ul key={`ul-${i}`} className="my-1 ml-4 space-y-1">{listItems}</ul>)
        listItems = []
        inList = false
      }
      result.push(
        <h3 key={i} className="font-semibold text-slate-900 mt-4 mb-2 text-sm border-b border-slate-100 pb-1">
          {line.slice(3)}
        </h3>
      )
    } else if (line.startsWith("- ")) {
      inList = true
      listItems.push(
        <li key={i} className="list-disc text-slate-700 text-sm" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
      )
    } else if (line.startsWith("# ")) {
      if (inList) {
        result.push(<ul key={`ul-${i}`} className="my-1 ml-4 space-y-1">{listItems}</ul>)
        listItems = []
        inList = false
      }
      result.push(
        <h2 key={i} className="font-bold text-slate-900 mt-2 mb-1">{line.slice(2)}</h2>
      )
    } else {
      if (inList) {
        result.push(<ul key={`ul-${i}`} className="my-1 ml-4 space-y-1">{listItems}</ul>)
        listItems = []
        inList = false
      }
      if (!line.trim()) {
        result.push(<div key={i} className="h-1" />)
      } else {
        result.push(<p key={i} className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: formatted }} />)
      }
    }
  })

  if (inList && listItems.length > 0) {
    result.push(<ul key="ul-end" className="my-1 ml-4 space-y-1">{listItems}</ul>)
  }

  return <div className="space-y-0.5">{result}</div>
}

export function MachineFailureAnalysisClient({ machines }: { machines: Machine[] }) {
  const [selectedId, setSelectedId] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")

  const filtered = machines.filter((m) =>
    search.trim() === "" ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
    m.siteName.toLowerCase().includes(search.toLowerCase())
  )

  function handleAnalyze() {
    if (!selectedId) return
    setError(null)
    setResult(null)

    startTransition(async () => {
      const res = await actionAnalyzeMachineFailures({ machineId: selectedId })
      if (!res.success) {
        setError(res.error ?? "Erreur inconnue")
        return
      }
      if ("data" in res) setResult(res.data as AnalysisResult)
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ai-assistant" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Analyse des pannes récurrentes</h1>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Sélectionnez une machine pour que l&apos;IA analyse son historique de pannes et identifie les patterns récurrents.
      </p>

      {/* Machine selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une machine…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Aucune machine trouvée</p>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedId(m.id); setResult(null); setError(null) }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${
                  selectedId === m.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                }`}
              >
                <div className="font-medium text-slate-900">{m.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {m.siteName}{m.category ? ` · ${m.category}` : ""}
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={!selectedId || isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <span className="flex gap-1 mr-2">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce [animation-delay:0.15s]">·</span>
                <span className="animate-bounce [animation-delay:0.3s]">·</span>
              </span>
              Analyse en cours…
            </>
          ) : (
            "Analyser avec l'IA"
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error === "Aucune intervention corrective clôturée pour cette machine"
            ? "Cette machine n'a pas encore d'interventions correctives clôturées à analyser."
            : error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">{result.machineName}</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {result.failureCount} panne{result.failureCount > 1 ? "s" : ""} analysée{result.failureCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="p-5">
            {formatAnalysis(result.analysis)}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
            Analyse générée par Llama 3.3 via Groq · À titre indicatif
          </div>
        </div>
      )}
    </div>
  )
}
