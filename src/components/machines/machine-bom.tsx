"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  GitBranch,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Link2,
  Link2Off,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { toast } from "sonner"
import { actionCreateComponent } from "@/server/actions/components/action-create-component"
import { actionUpdateComponent } from "@/server/actions/components/action-update-component"
import { actionMoveComponent } from "@/server/actions/components/action-move-component"
import { actionDeleteComponent } from "@/server/actions/components/action-delete-component"
import type { BomNode } from "@/server/queries/machines/query-get-machine-bom"

// ─── Types ───────────────────────────────────────────────────────────────────

type StockItemOption = {
  id: string
  name: string
  reference: string
  unit: string
  quantityOnHand: number
  minimumLevel: number
}

type TreeNode = BomNode & { children: TreeNode[] }

type Props = {
  machineId: string
  initialNodes: BomNode[]
  canEdit: boolean
  stockModuleActive: boolean
  availableStockItems: StockItemOption[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTree(nodes: BomNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  for (const n of nodes) {
    map.set(n.id, { ...n, children: [] })
  }
  const roots: TreeNode[] = []
  for (const node of map.values()) {
    if (node.parentId === null) {
      roots.push(node)
    } else {
      const parent = map.get(node.parentId)
      if (parent) parent.children.push(node)
    }
  }
  // Sort roots and children by position then name
  function sortNodes(arr: TreeNode[]) {
    arr.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    for (const n of arr) sortNodes(n.children)
  }
  sortNodes(roots)
  return roots
}

// Flat list with depth labels for parent picker
function flattenWithDepth(
  nodes: TreeNode[],
  depth = 0,
  excludeId?: string,
): { id: string; label: string; disabled: boolean }[] {
  const result: { id: string; label: string; disabled: boolean }[] = []
  for (const n of nodes) {
    const prefix = "—".repeat(depth)
    result.push({ id: n.id, label: `${prefix} ${n.name}`.trimStart(), disabled: n.id === excludeId })
    // Also disable descendants of excluded node (would create cycle)
    if (n.id !== excludeId) {
      result.push(...flattenWithDepth(n.children, depth + 1, excludeId))
    }
  }
  return result
}

// ─── Sub-component: single tree node ─────────────────────────────────────────

type NodeProps = {
  node: TreeNode
  depth: number
  canEdit: boolean
  stockModuleActive: boolean
  onAddChild: (parentId: string) => void
  onEdit: (node: TreeNode) => void
  onDelete: (node: TreeNode) => void
}

function BomTreeNode({ node, depth, canEdit, stockModuleActive, onAddChild, onEdit, onDelete }: NodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isLowStock =
    node.stockItem !== null &&
    node.stockItem.quantityOnHand <= node.stockItem.minimumLevel

  return (
    <li>
      <div
        className="flex items-center gap-2 py-2 pr-3 hover:bg-slate-50 rounded group"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-slate-300 hover:text-slate-600 flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0" />
        )}

        <GitBranch className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />

        {/* Name + quantity */}
        <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">
          {node.name}
        </span>
        {node.quantity > 1 && (
          <span className="text-xs text-slate-400 flex-shrink-0">×{node.quantity}</span>
        )}

        {/* Stock badge */}
        {stockModuleActive && node.stockItem && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
              isLowStock ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
            }`}
            title={node.stockItem.name}
          >
            {node.stockItem.reference}
            {isLowStock && " ⚠"}
          </span>
        )}

        {/* Actions (shown on hover) */}
        {canEdit && (
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild(node.id)}
              title="Ajouter un sous-composant"
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <ul>
          {node.children.map((child) => (
            <BomTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              canEdit={canEdit}
              stockModuleActive={stockModuleActive}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  name: string
  description: string
  quantity: string
}

const EMPTY_FORM: FormState = { name: "", description: "", quantity: "1" }

// ─── Main component ───────────────────────────────────────────────────────────

export function MachineBom({
  machineId,
  initialNodes,
  canEdit,
  stockModuleActive,
  availableStockItems,
}: Props) {
  const router = useRouter()
  const [nodes, setNodes] = useState<BomNode[]>(initialNodes)

  // Component dialog (create / edit)
  const [componentDialog, setComponentDialog] = useState(false)
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null)
  const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)

  // Move dialog
  const [moveDialog, setMoveDialog] = useState(false)
  const [movingNode, setMovingNode] = useState<TreeNode | null>(null)
  const [moveParentId, setMoveParentId] = useState<string>("__root__")
  const [moveLoading, setMoveLoading] = useState(false)

  // Stock link dialog
  const [stockDialog, setStockDialog] = useState(false)
  const [stockDialogNode, setStockDialogNode] = useState<TreeNode | null>(null)
  const [stockSearch, setStockSearch] = useState("")
  const [stockLoading, setStockLoading] = useState(false)

  // Delete dialog
  const [deleteNode, setDeleteNode] = useState<TreeNode | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const tree = buildTree(nodes)

  // ── Create ──────────────────────────────────────────────────────────────────

  function openCreate(parentId: string | null = null) {
    setEditingNode(null)
    setParentIdForCreate(parentId)
    setForm(EMPTY_FORM)
    setComponentDialog(true)
  }

  function openEdit(node: TreeNode) {
    setEditingNode(node)
    setParentIdForCreate(null)
    setForm({ name: node.name, description: node.description ?? "", quantity: String(node.quantity) })
    setComponentDialog(true)
  }

  async function handleComponentSubmit() {
    setFormLoading(true)

    const result = editingNode
      ? await actionUpdateComponent({
          componentId: editingNode.id,
          name: form.name,
          description: form.description || undefined,
          quantity: Number(form.quantity),
        })
      : await actionCreateComponent({
          machineId,
          parentId: parentIdForCreate ?? undefined,
          name: form.name,
          description: form.description || undefined,
          quantity: Number(form.quantity),
        })

    setFormLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(editingNode ? "Composant modifié" : "Composant créé")
    setComponentDialog(false)
    router.refresh()
  }

  // ── Move ────────────────────────────────────────────────────────────────────

  function openMove(node: TreeNode) {
    setMovingNode(node)
    setMoveParentId(node.parentId ?? "__root__")
    setMoveDialog(true)
  }

  async function handleMove() {
    if (!movingNode) return
    setMoveLoading(true)

    const result = await actionMoveComponent({
      componentId: movingNode.id,
      newParentId: moveParentId === "__root__" ? null : moveParentId,
    })

    setMoveLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Composant déplacé")
    setMoveDialog(false)
    router.refresh()
  }

  // ── Stock link ───────────────────────────────────────────────────────────────

  function openStockLink(node: TreeNode) {
    setStockDialogNode(node)
    setStockSearch("")
    setStockDialog(true)
  }

  async function handleLinkStock(stockItemId: string | null) {
    if (!stockDialogNode) return
    setStockLoading(true)

    const result = await actionUpdateComponent({
      componentId: stockDialogNode.id,
      name: stockDialogNode.name,
      quantity: stockDialogNode.quantity,
      stockItemId: stockItemId,
    })

    setStockLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(stockItemId ? "Article lié" : "Lien supprimé")
    setStockDialog(false)
    router.refresh()
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteNode) return
    setDeleteLoading(true)

    const result = await actionDeleteComponent({ componentId: deleteNode.id })
    setDeleteLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Composant supprimé")
    setDeleteNode(null)
    router.refresh()
  }

  // ── Flat options for parent picker ──────────────────────────────────────────

  const parentOptions = flattenWithDepth(tree, 0, movingNode?.id)

  // ── Filtered stock items ────────────────────────────────────────────────────

  const filteredStock = stockSearch.trim()
    ? availableStockItems.filter(
        (s) =>
          s.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
          s.reference.toLowerCase().includes(stockSearch.toLowerCase()),
      )
    : availableStockItems

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-slate-400" />
          Arborescence composants
          {nodes.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({nodes.length})</span>
          )}
        </h2>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => openCreate(null)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {nodes.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">
          Aucun composant — machine → sous-ensemble → pièce…
        </p>
      ) : (
        <ul className="py-1">
          {tree.map((node) => (
            <BomTreeNode
              key={node.id}
              node={node}
              depth={0}
              canEdit={canEdit}
              stockModuleActive={stockModuleActive}
              onAddChild={(parentId) => openCreate(parentId)}
              onEdit={(n) => openEdit(n)}
              onDelete={(n) => setDeleteNode(n)}
            />
          ))}
        </ul>
      )}

      {/* ── Dialog création / édition composant ── */}
      <Dialog open={componentDialog} onOpenChange={setComponentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNode
                ? "Modifier le composant"
                : parentIdForCreate
                ? "Nouveau sous-composant"
                : "Nouveau composant racine"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Nom *</Label>
              <Input
                className="mt-1"
                placeholder="Moteur hydraulique, Joint d'étanchéité…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                min="1"
                className="mt-1 w-24"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Move button only in edit mode */}
            {editingNode && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-xs text-slate-500 flex-1">
                  {editingNode.parentId
                    ? `Parent : ${nodes.find((n) => n.id === editingNode.parentId)?.name ?? "—"}`
                    : "Racine (pas de parent)"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setComponentDialog(false)
                    openMove(editingNode)
                  }}
                >
                  Déplacer
                </Button>
                {stockModuleActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setComponentDialog(false)
                      openStockLink(editingNode)
                    }}
                  >
                    <Package className="w-3.5 h-3.5 mr-1" />
                    {editingNode.stockItemId ? "Lien stock" : "Lier stock"}
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComponentDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleComponentSubmit}
              disabled={formLoading || !form.name.trim() || !form.quantity}
            >
              {formLoading ? "Enregistrement…" : editingNode ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog déplacement ── */}
      <Dialog open={moveDialog} onOpenChange={setMoveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Déplacer «&nbsp;{movingNode?.name}&nbsp;»</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Nouveau parent</Label>
            <select
              className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
              value={moveParentId}
              onChange={(e) => setMoveParentId(e.target.value)}
            >
              <option value="__root__">— Racine (aucun parent)</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleMove} disabled={moveLoading}>
              {moveLoading ? "Déplacement…" : "Déplacer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog lien article stock ── */}
      <Dialog open={stockDialog} onOpenChange={setStockDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Lier un article —&nbsp;{stockDialogNode?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {stockDialogNode?.stockItemId && (
              <div className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
                <span className="text-xs text-blue-700 font-medium">
                  <Link2 className="w-3 h-3 inline mr-1" />
                  {availableStockItems.find((s) => s.id === stockDialogNode.stockItemId)?.name ??
                    "Article lié"}
                </span>
                <button
                  onClick={() => handleLinkStock(null)}
                  className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1"
                  disabled={stockLoading}
                >
                  <Link2Off className="w-3 h-3" />
                  Délier
                </button>
              </div>
            )}
            <Input
              placeholder="Rechercher par nom ou référence…"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-52 overflow-y-auto border border-slate-100 rounded">
              {filteredStock.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aucun article trouvé</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredStock.map((s) => {
                    const isLow = s.quantityOnHand <= s.minimumLevel
                    const isCurrent = s.id === stockDialogNode?.stockItemId
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => handleLinkStock(s.id)}
                          disabled={stockLoading || isCurrent}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                            isCurrent ? "bg-blue-50" : ""
                          }`}
                        >
                          <span className="font-medium text-slate-800">{s.name}</span>
                          <span className="ml-2 font-mono text-xs text-slate-400">{s.reference}</span>
                          <span
                            className={`ml-2 text-xs ${isLow ? "text-red-500" : "text-slate-400"}`}
                          >
                            {s.quantityOnHand} {s.unit}
                            {isLow && " ⚠"}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog suppression ── */}
      <ConfirmDialog
        open={!!deleteNode}
        onOpenChange={(o) => {
          if (!o) setDeleteNode(null)
        }}
        title={`Supprimer "${deleteNode?.name}" ?`}
        description="Tous les sous-composants seront supprimés avec lui."
        confirmLabel={deleteLoading ? "Suppression…" : "Supprimer"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
