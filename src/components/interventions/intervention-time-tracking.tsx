"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Timer, Play, Square, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { toast } from "sonner"
import { actionStartTimeEntry } from "@/server/actions/interventions/action-start-time-entry"
import { actionStopTimeEntry } from "@/server/actions/interventions/action-stop-time-entry"
import { actionDeleteTimeEntry } from "@/server/actions/interventions/action-delete-time-entry"

type TimeEntry = {
  id: string
  userId: string
  startedAt: Date
  endedAt: Date | null
  durationMinutes: number | null
  note: string | null
}

type Props = {
  interventionId: string
  entries: TimeEntry[]
  currentUserId: string
  userNameMap: Map<string, string>
  canEdit: boolean
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
}

function ElapsedTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000))
    }
    update()
    const id = setInterval(update, 10000) // update every 10s
    return () => clearInterval(id)
  }, [startedAt])

  return <span className="font-mono text-blue-600">{formatDuration(elapsed)}</span>
}

export function InterventionTimeTracking({
  interventionId,
  entries: initial,
  currentUserId,
  userNameMap,
  canEdit,
}: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState<TimeEntry[]>(initial)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const openEntry = entries.find((e) => e.userId === currentUserId && !e.endedAt)
  const totalMinutes = entries.reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0)

  async function handleStart() {
    setLoading(true)
    const result = await actionStartTimeEntry({ interventionId })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Pointage démarré")
    router.refresh()
  }

  async function handleStop() {
    if (!openEntry) return
    setLoading(true)
    const result = await actionStopTimeEntry({ entryId: openEntry.id })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Pointage arrêté")
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await actionDeleteTimeEntry({ entryId: deleteId })
    setDeleteLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Session supprimée")
    setDeleteId(null)
    setEntries((prev) => prev.filter((e) => e.id !== deleteId))
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Timer className="w-4 h-4 text-slate-400" />
          Pointage heures
          {totalMinutes > 0 && (
            <span className="text-xs font-normal text-slate-400">
              — total : {formatDuration(totalMinutes)}
            </span>
          )}
        </h2>
        {canEdit && (
          openEntry ? (
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleStop}
              disabled={loading}
            >
              <Square className="w-3.5 h-3.5 mr-1" />
              Stopper
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleStart} disabled={loading}>
              <Play className="w-3.5 h-3.5 mr-1" />
              Démarrer
            </Button>
          )
        )}
      </div>

      {/* Session ouverte */}
      {openEntry && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-blue-700">Session en cours —</span>
          <ElapsedTimer startedAt={openEntry.startedAt} />
        </div>
      )}

      {entries.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucune session enregistrée</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((entry) => {
            const isOwner = entry.userId === currentUserId
            const isOpen = !entry.endedAt
            return (
              <li key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {userNameMap.get(entry.userId) ?? "Utilisateur inconnu"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(entry.startedAt).toLocaleString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                    {entry.endedAt && (
                      <>
                        {" → "}
                        {new Date(entry.endedAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </>
                    )}
                    {entry.note && ` · ${entry.note}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isOpen ? (
                    <ElapsedTimer startedAt={entry.startedAt} />
                  ) : (
                    <span className="text-sm font-semibold text-slate-700">
                      {entry.durationMinutes !== null ? formatDuration(entry.durationMinutes) : "—"}
                    </span>
                  )}
                  {canEdit && (isOwner || true) && (
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Supprimer cette session ?"
        description="Cette action est irréversible."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
