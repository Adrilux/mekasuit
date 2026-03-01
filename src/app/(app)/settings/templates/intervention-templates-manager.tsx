"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { toast } from "sonner"
import { actionCreateInterventionTemplate } from "@/server/actions/intervention-templates/action-create-intervention-template"
import { actionUpdateInterventionTemplate } from "@/server/actions/intervention-templates/action-update-intervention-template"
import { actionDeleteInterventionTemplate } from "@/server/actions/intervention-templates/action-delete-intervention-template"
import type { InterventionTemplate } from "@/server/queries/intervention-templates/query-get-intervention-templates"
import { InterventionType, InterventionPriority } from "@prisma/client"

const TYPE_LABELS: Record<InterventionType, string> = {
  PREVENTIVE: "Préventive",
  CORRECTIVE: "Corrective",
  PREDICTIVE: "Prédictive",
  INSPECTION: "Inspection",
}

const PRIORITY_LABELS: Record<InterventionPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Normale",
  HIGH: "Urgente",
  CRITICAL: "Critique",
}

const PRIORITY_COLORS: Record<InterventionPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-700",
  CRITICAL: "bg-red-50 text-red-700",
}

type ChecklistItemDraft = { label: string; isRequired: boolean }

type Props = { templates: InterventionTemplate[] }

function emptyForm() {
  return {
    name: "",
    description: "",
    type: "PREVENTIVE" as InterventionType,
    priority: "MEDIUM" as InterventionPriority,
    checklistItems: [{ label: "", isRequired: false }] as ChecklistItemDraft[],
  }
}

export function InterventionTemplatesManager({ templates: initial }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<InterventionTemplate[]>(initial)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(tpl: InterventionTemplate) {
    setEditingId(tpl.id)
    setForm({
      name: tpl.name,
      description: tpl.description ?? "",
      type: tpl.type as InterventionType,
      priority: tpl.priority as InterventionPriority,
      checklistItems: tpl.checklistItems.length > 0
        ? tpl.checklistItems.map((i) => ({ label: i.label, isRequired: i.isRequired }))
        : [{ label: "", isRequired: false }],
    })
    setDialogOpen(true)
  }

  function addItem() {
    setForm((f) => ({ ...f, checklistItems: [...f.checklistItems, { label: "", isRequired: false }] }))
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, checklistItems: f.checklistItems.filter((_, i) => i !== idx) }))
  }

  function updateItem(idx: number, field: "label" | "isRequired", value: string | boolean) {
    setForm((f) => ({
      ...f,
      checklistItems: f.checklistItems.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))
  }

  async function handleSave() {
    const validItems = form.checklistItems.filter((i) => i.label.trim())
    if (!form.name.trim()) return

    setSaving(true)
    const payload = { ...form, checklistItems: validItems }

    const result = editingId
      ? await actionUpdateInterventionTemplate({ ...payload, templateId: editingId })
      : await actionCreateInterventionTemplate(payload)

    setSaving(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(editingId ? "Modèle mis à jour" : "Modèle créé")
    setDialogOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await actionDeleteInterventionTemplate({ templateId: deleteId })
    setDeleteLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Modèle supprimé")
    setDeleteId(null)
    setTemplates((prev) => prev.filter((t) => t.id !== deleteId))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau modèle
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg px-5 py-10 text-center">
          <p className="text-sm text-slate-400">Aucun modèle d&apos;intervention</p>
          <p className="text-xs text-slate-300 mt-1">Créez un modèle pour accélérer la saisie de vos préventives</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => toggleExpand(tpl.id)} className="text-slate-400 hover:text-slate-700">
                  {expanded.has(tpl.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="font-medium text-slate-800 flex-1">{tpl.name}</span>
                <span className="text-xs text-slate-400">{TYPE_LABELS[tpl.type as InterventionType]}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[tpl.priority as InterventionPriority]}`}>
                  {PRIORITY_LABELS[tpl.priority as InterventionPriority]}
                </span>
                {tpl.checklistItems.length > 0 && (
                  <span className="text-xs text-slate-400">{tpl.checklistItems.length} point{tpl.checklistItems.length > 1 ? "s" : ""}</span>
                )}
                <button onClick={() => openEdit(tpl)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteId(tpl.id)} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {expanded.has(tpl.id) && (
                <div className="border-t border-slate-100 px-8 py-3 space-y-2">
                  {tpl.description && (
                    <p className="text-xs text-slate-500 italic">{tpl.description}</p>
                  )}
                  {tpl.checklistItems.length > 0 ? (
                    <ul className="space-y-1">
                      {tpl.checklistItems.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                          {item.label}
                          {item.isRequired && <span className="text-amber-500 text-xs">*</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">Aucun point de contrôle</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog créer / modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le modèle" : "Nouveau modèle d'intervention"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom du modèle *</Label>
              <Input
                className="mt-1"
                placeholder="Vidange moteur hydraulique…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as InterventionType }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as InterventionPriority }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description (optionnelle)</Label>
              <Textarea
                className="mt-1 text-sm"
                rows={2}
                placeholder="Instructions générales, outillage requis…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Points de contrôle (optionnels)</Label>
              <div className="mt-1 space-y-2">
                {form.checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      className="flex-1 h-8 text-sm"
                      placeholder={`Point ${idx + 1}`}
                      value={item.label}
                      onChange={(e) => updateItem(idx, "label", e.target.value)}
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.isRequired}
                        onChange={(e) => updateItem(idx, "isRequired", e.target.checked)}
                        className="rounded"
                      />
                      Requis
                    </label>
                    {form.checklistItems.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter un point
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Enregistrement…" : editingId ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Supprimer ce modèle ?"
        description="Ce modèle ne sera plus proposé à la création d'intervention."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
