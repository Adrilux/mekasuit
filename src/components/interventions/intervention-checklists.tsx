"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckSquare, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
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
import { actionCreateChecklist } from "@/server/actions/interventions/action-create-checklist"
import { actionDeleteChecklist } from "@/server/actions/interventions/action-delete-checklist"
import { actionToggleChecklistItem } from "@/server/actions/interventions/action-toggle-checklist-item"
import { actionAddChecklistItem } from "@/server/actions/interventions/action-add-checklist-item"
import type { ChecklistTemplate } from "@/server/queries/checklists/query-get-checklist-templates"

type ChecklistItem = {
  id: string
  label: string
  isRequired: boolean
  isChecked: boolean
  checkedAt: Date | null
  checkedBy: string | null
  position: number
}

type Checklist = {
  id: string
  name: string
  items: ChecklistItem[]
  createdAt: Date
}

type Props = {
  interventionId: string
  checklists: Checklist[]
  templates: ChecklistTemplate[]
  canEdit: boolean
}

function ChecklistBlock({
  checklist,
  canEdit,
  onDelete,
}: {
  checklist: Checklist
  canEdit: boolean
  onDelete: () => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [newItemLabel, setNewItemLabel] = useState("")
  const [addingItem, setAddingItem] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const checked = checklist.items.filter((i) => i.isChecked).length
  const total = checklist.items.length
  const allChecked = total > 0 && checked === total
  const requiredUnchecked = checklist.items.filter((i) => i.isRequired && !i.isChecked).length

  async function handleToggle(item: ChecklistItem) {
    setToggling(item.id)
    const result = await actionToggleChecklistItem({ itemId: item.id, checked: !item.isChecked })
    setToggling(null)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  async function handleAddItem() {
    if (!newItemLabel.trim()) return
    setAddLoading(true)
    const result = await actionAddChecklistItem({
      checklistId: checklist.id,
      label: newItemLabel.trim(),
    })
    setAddLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setNewItemLabel("")
    setAddingItem(false)
    toast.success("Item ajouté")
    router.refresh()
  }

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-slate-400 hover:text-slate-700"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-sm font-medium text-slate-700 flex-1">{checklist.name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          allChecked ? "bg-green-100 text-green-700" :
          requiredUnchecked > 0 ? "bg-amber-100 text-amber-700" :
          "bg-slate-100 text-slate-500"
        }`}>
          {checked}/{total}
        </span>
        {canEdit && (
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {expanded && (
        <>
          {checklist.items.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 text-center">Aucun point</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {checklist.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50">
                  <button
                    onClick={() => { if (canEdit) handleToggle(item) }}
                    disabled={toggling === item.id || !canEdit}
                    className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      item.isChecked
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-slate-300 hover:border-blue-400"
                    }`}
                  >
                    {item.isChecked && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 leading-5 ${item.isChecked ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {item.label}
                    {item.isRequired && !item.isChecked && (
                      <span className="ml-1 text-xs text-amber-500 font-medium">*</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <div className="px-4 py-2 border-t border-slate-50">
              {addingItem ? (
                <div className="flex items-center gap-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder="Nouveau point…"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddItem()
                      if (e.key === "Escape") setAddingItem(false)
                    }}
                    autoFocus
                  />
                  <Button size="sm" className="h-7 text-xs px-2" onClick={handleAddItem} disabled={addLoading || !newItemLabel.trim()}>
                    {addLoading ? "…" : "OK"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAddingItem(false)}>
                    ✕
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingItem(true)}
                  className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter un point
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function InterventionChecklists({
  interventionId,
  checklists: initial,
  templates,
  canEdit,
}: Props) {
  const router = useRouter()
  const [checklists, setChecklists] = useState<Checklist[]>(initial)

  // Dialog nouvelle checklist
  const [createDialog, setCreateDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("__none__")
  const [createLoading, setCreateLoading] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleCreate() {
    setCreateLoading(true)
    const result = await actionCreateChecklist({
      interventionId,
      name: newName,
      templateId: selectedTemplate !== "__none__" ? selectedTemplate : undefined,
    })
    setCreateLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Checklist créée")
    setCreateDialog(false)
    setNewName("")
    setSelectedTemplate("__none__")
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await actionDeleteChecklist({ checklistId: deleteId })
    setDeleteLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Checklist supprimée")
    setDeleteId(null)
    setChecklists((prev) => prev.filter((c) => c.id !== deleteId))
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-slate-400" />
          Checklists
          {checklists.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({checklists.length})</span>
          )}
        </h2>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {checklists.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">
          Aucune checklist — points de contrôle à valider…
        </p>
      ) : (
        <div className="p-4 space-y-3">
          {checklists.map((cl) => (
            <ChecklistBlock
              key={cl.id}
              checklist={cl}
              canEdit={canEdit}
              onDelete={() => setDeleteId(cl.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog création */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nom *</Label>
              <Input
                className="mt-1"
                placeholder="Contrôle avant remise en service…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            {templates.length > 0 && (
              <div>
                <Label>Depuis un modèle (optionnel)</Label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value)
                    if (e.target.value !== "__none__" && !newName) {
                      const tpl = templates.find((t) => t.id === e.target.value)
                      if (tpl) setNewName(tpl.name)
                    }
                  }}
                >
                  <option value="__none__">— Aucun modèle</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.items.length} points)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createLoading || !newName.trim()}>
              {createLoading ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Supprimer cette checklist ?"
        description="Tous ses points seront supprimés."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
