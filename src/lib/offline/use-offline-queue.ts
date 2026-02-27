"use client"

import { useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { queueGetAll, queueDelete, queueCount } from "./offline-queue"
import type { QueueEntry } from "./offline-queue"

async function replayEntry(entry: QueueEntry): Promise<boolean> {
  try {
    if (entry.action.type === "intervention:status") {
      const { actionUpdateInterventionStatus } = await import(
        "@/server/actions/interventions/action-update-intervention-status"
      )
      const result = await actionUpdateInterventionStatus({
        interventionId: entry.action.interventionId,
        action: entry.action.status as never,
        ...(entry.action.payload ?? {}),
      })
      return result.success
    }

    if (entry.action.type === "intervention:note") {
      const { actionAddInterventionNote } = await import(
        "@/server/actions/interventions/action-add-intervention-note"
      )
      const result = await actionAddInterventionNote({
        interventionId: entry.action.interventionId,
        content: entry.action.content,
      })
      return result.success
    }

    return false
  } catch {
    return false
  }
}

export function useOfflineQueueFlush() {
  const flushing = useRef(false)

  const flush = useCallback(async () => {
    if (flushing.current) return
    flushing.current = true

    try {
      const entries = await queueGetAll()
      if (entries.length === 0) return

      let succeeded = 0
      let failed = 0

      for (const entry of entries) {
        const ok = await replayEntry(entry)
        if (ok) {
          await queueDelete(entry.id)
          succeeded++
        } else {
          failed++
        }
      }

      if (succeeded > 0) {
        toast.success(
          `${succeeded} action${succeeded > 1 ? "s" : ""} synchronisée${succeeded > 1 ? "s" : ""} avec succès`
        )
      }
      if (failed > 0) {
        toast.error(
          `${failed} action${failed > 1 ? "s" : ""} n'ont pas pu être synchronisées — réessayez manuellement`
        )
      }
    } finally {
      flushing.current = false
    }
  }, [])

  useEffect(() => {
    // Flush au montage si déjà en ligne et queue non vide
    if (navigator.onLine) {
      queueCount().then((count) => {
        if (count > 0) void flush()
      })
    }

    window.addEventListener("online", flush)
    return () => window.removeEventListener("online", flush)
  }, [flush])
}
