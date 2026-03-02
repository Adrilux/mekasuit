"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Map, Upload, Save, X, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type MachineStatus = "OPERATIONAL" | "UNDER_MAINTENANCE" | "DECOMMISSIONED"

type MachineItem = {
  id: string
  name: string
  status: MachineStatus
  _count: { interventions: number }
}

type SiteData = {
  id: string
  name: string
  floorPlanImage: string | null
  machinePins: Record<string, { x: number; y: number }>
}

type Props = {
  site: SiteData
  machines: MachineItem[]
  canEdit: boolean
}

const STATUS_COLORS: Record<MachineStatus, string> = {
  OPERATIONAL: "bg-green-500 border-green-600",
  UNDER_MAINTENANCE: "bg-amber-400 border-amber-500",
  DECOMMISSIONED: "bg-slate-400 border-slate-500",
}

const STATUS_LABELS: Record<MachineStatus, string> = {
  OPERATIONAL: "Opérationnelle",
  UNDER_MAINTENANCE: "En maintenance",
  DECOMMISSIONED: "Hors service",
}

export function SiteFloorPlanClient({ site, machines, canEdit }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [pins, setPins] = useState<Record<string, { x: number; y: number }>>(site.machinePins)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [floorPlan, setFloorPlan] = useState(site.floorPlanImage)

  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent, machineId: string) => {
    if (!isEditing) return
    e.preventDefault()
    draggingRef.current = machineId
  }, [isEditing])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setPins((prev) => ({ ...prev, [draggingRef.current!]: { x, y } }))
  }, [])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  // Prevent text selection during drag
  const handleDragStart = (e: React.DragEvent) => e.preventDefault()

  // ── Add machine to plan ───────────────────────────────────────────────────

  function addMachine(machineId: string) {
    setPins((prev) => ({ ...prev, [machineId]: { x: 50, y: 50 } }))
  }

  function removePin(machineId: string) {
    setPins((prev) => {
      const next = { ...prev }
      delete next[machineId]
      return next
    })
  }

  // ── Upload plan image ─────────────────────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`/api/sites/${site.id}/floor-plan`, {
      method: "POST",
      body: formData,
    })

    setUploading(false)
    if (!res.ok) {
      const text = await res.text()
      toast.error(text || "Erreur lors de l'upload")
      return
    }

    const data = await res.json() as { floorPlanImage: string }
    setFloorPlan(data.floorPlanImage)
    toast.success("Plan mis à jour")
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Save pins ────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/sites/${site.id}/pins`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pins }),
    })
    setSaving(false)

    if (!res.ok) {
      toast.error("Erreur lors de la sauvegarde")
      return
    }

    toast.success("Positions sauvegardées")
    setIsEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setPins(site.machinePins)
    setFloorPlan(site.floorPlanImage)
    setIsEditing(false)
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const placedIds = new Set(Object.keys(pins))
  const unplacedMachines = machines.filter((m) => !placedIds.has(m.id))

  const imageUrl = floorPlan
    ? `/uploads/sites/${site.id}/${floorPlan}?t=${Date.now()}`
    : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {canEdit && !isEditing && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            Modifier le plan
          </Button>
        )}
        {isEditing && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? "Upload…" : "Changer l'image"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { void handleImageUpload(e) }}
            />
            <Button size="sm" onClick={() => { void handleSave() }} disabled={saving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              Annuler
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-4 items-start">
        {/* Plan canvas */}
        <div className="flex-1 min-w-0">
          {!imageUrl ? (
            <div className="border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-3 h-80 bg-slate-50">
              <Map className="w-10 h-10 text-slate-300" />
              <p className="text-sm text-slate-500">Aucun plan configuré</p>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setIsEditing(true); setTimeout(() => fileInputRef.current?.click(), 50) }}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Uploader un plan
                </Button>
              )}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative select-none rounded-lg overflow-hidden border border-slate-200"
              style={{ cursor: isEditing ? "crosshair" : "default" }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDragStart={handleDragStart}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Plan ${site.name}`}
                className="w-full h-auto block"
                draggable={false}
              />

              {/* Machine markers */}
              {machines.map((machine) => {
                const pin = pins[machine.id]
                if (!pin) return null
                const hasAlert = machine._count.interventions > 0

                return (
                  <div
                    key={machine.id}
                    style={{
                      position: "absolute",
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: "translate(-50%, -50%)",
                      cursor: isEditing ? "grab" : "pointer",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, machine.id)}
                    title={`${machine.name} — ${STATUS_LABELS[machine.status]}${hasAlert ? ` — ${machine._count.interventions} intervention(s) ouverte(s)` : ""}`}
                  >
                    {isEditing ? (
                      // Mode édition : marqueur avec bouton supprimer
                      <div className="relative group">
                        <div className={`w-6 h-6 rounded-full border-2 shadow-md flex items-center justify-center ${STATUS_COLORS[machine.status]}`}>
                          {hasAlert && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-white" />
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removePin(machine.id) }}
                          className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] items-center justify-center hidden group-hover:flex leading-none"
                          title="Retirer du plan"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      // Mode lecture : lien cliquable
                      <Link href={`/machines/${machine.id}`}>
                        <div className={`w-6 h-6 rounded-full border-2 shadow-md hover:scale-110 transition-transform ${STATUS_COLORS[machine.status]}`}>
                          {hasAlert && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-white" />
                          )}
                        </div>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          {imageUrl && (
            <div className="flex gap-4 mt-2 flex-wrap">
              {(Object.entries(STATUS_LABELS) as [MachineStatus, string][]).map(([status, label]) => (
                <div key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`w-3 h-3 rounded-full border ${STATUS_COLORS[status]}`} />
                  {label}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
                Interventions ouvertes
              </div>
            </div>
          )}
        </div>

        {/* Sidebar machines non placées (mode édition uniquement) */}
        {isEditing && unplacedMachines.length > 0 && (
          <div className="w-56 shrink-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Machines non placées
            </p>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {unplacedMachines.map((machine) => (
                <div key={machine.id} className="flex items-center justify-between px-3 py-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[machine.status]}`} />
                    <span className="text-sm text-slate-800 truncate">{machine.name}</span>
                  </div>
                  <button
                    onClick={() => addMachine(machine.id)}
                    className="shrink-0 w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                    title="Ajouter au plan"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info : toutes placées */}
        {isEditing && unplacedMachines.length === 0 && machines.length > 0 && (
          <div className="w-56 shrink-0">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Toutes les machines sont placées
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
