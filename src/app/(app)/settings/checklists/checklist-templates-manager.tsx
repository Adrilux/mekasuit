"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronDown, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { toast } from "sonner"
import { actionCreateChecklistTemplate } from "@/server/actions/checklists/action-create-checklist-template"
import { actionDeleteChecklistTemplate } from "@/server/actions/checklists/action-delete-checklist-template"
import type { ChecklistTemplate } from "@/server/queries/checklists/query-get-checklist-templates"

type Props = {
  templates: ChecklistTemplate[]
}

export function ChecklistTemplatesManager({ templates: initial }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(initial)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false)
  const [name, setName] = useState("")
  const [items, setItems] = useState<{ label: string; isRequired: boolean }[]>([
    { label: "", isRequired: false },
  ])
  const [createLoading, setCreateLoading] = useState(false)

  // Delete dialog
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

  function addItem() {
    setItems((prev) => [...prev, { label: "", isRequired: false }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: "label" | "isRequired", value: string | boolean) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleCreate() {
    const validItems = items.filter((i) => i.label.trim())
    if (!name.trim() || validItems.length === 0) return

    setCreateLoading(true)
    const result = await actionCreateChecklistTemplate({
      name: name.trim(),
      items: validItems,
    })
    setCreateLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Modèle créé")
    setCreateDialog(false)
    setName("")
    setItems([{ label: "", isRequired: false }])
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await actionDeleteChecklistTemplate({ templateId: deleteId })
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
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau modèle
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg px-5 py-10 text-center">
          <p className="text-sm text-slate-400">Aucun modèle de checklist</p>
          <p className="text-xs text-slate-300 mt-1">Créez un modèle pour l'utiliser dans vos interventions</p>
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
                <span className="text-xs text-slate-400">{tpl.items.length} point{tpl.items.length > 1 ? "s" : ""}</span>
                <button
                  onClick={() => setDeleteId(tpl.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {expanded.has(tpl.id) && (
                <ul className="divide-y divide-slate-50 border-t border-slate-100">
                  {tpl.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 px-8 py-2 text-sm text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                      {item.label}
                      {item.isRequired && <span className="text-amber-500 text-xs ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau modèle de checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom du modèle *</Label>
              <Input
                className="mt-1"
                placeholder="Contrôle avant remise en service…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Points à valider *</Label>
              <div className="mt-1 space-y-2">
                {items.map((item, idx) => (
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
                    {items.length > 1 && (
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
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Annuler</Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || !name.trim() || items.every((i) => !i.label.trim())}
            >
              {createLoading ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Supprimer ce modèle ?"
        description="Les checklists déjà créées depuis ce modèle ne seront pas supprimées."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
