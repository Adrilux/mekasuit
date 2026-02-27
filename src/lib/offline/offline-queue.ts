/**
 * Queue IndexedDB pour les actions terrain effectuées hors ligne.
 * Les entrées sont persistées localement et rejouées au retour du réseau.
 *
 * Actions supportées :
 * - "intervention:status" — changer le statut d'une intervention
 * - "intervention:note"   — ajouter une note à une intervention
 */

export type OfflineAction =
  | { type: "intervention:status"; interventionId: string; status: string; payload?: Record<string, unknown> }
  | { type: "intervention:note"; interventionId: string; content: string }

export type QueueEntry = {
  id: string
  action: OfflineAction
  createdAt: number
  retries: number
}

const DB_NAME = "gmao-offline"
const DB_VERSION = 1
const STORE_NAME = "queue"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function queuePush(action: OfflineAction): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const entry: QueueEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      createdAt: Date.now(),
      retries: 0,
    }
    const req = tx.objectStore(STORE_NAME).add(entry)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function queueGetAll(): Promise<QueueEntry[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueueEntry[])
    req.onerror = () => reject(req.error)
  })
}

export async function queueDelete(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function queueCount(): Promise<number> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
