"use client"

import { useOfflineQueueFlush } from "@/lib/offline/use-offline-queue"

/**
 * Composant invisible — monte le hook de flush de la queue offline.
 * Doit être placé dans le layout app (côté client).
 */
export function OfflineQueueFlusher() {
  useOfflineQueueFlush()
  return null
}
