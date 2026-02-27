"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, Shield, Users, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { actionCreateRole } from "@/server/actions/roles/action-create-role"
import { actionUpdateRole } from "@/server/actions/roles/action-update-role"
import { actionDeleteRole } from "@/server/actions/roles/action-delete-role"
import { ACTION_GROUPS, ACTION_LABELS } from "@/lib/permissions/permission-matrix"
import type { TenantRoleItem } from "@/server/queries/roles/query-get-tenant-roles"
import type { Action } from "@/lib/permissions/permission-matrix"

type Props = {
  roles: TenantRoleItem[]
}

type FormState = {
  name: string
  permissions: Set<Action>
}

function PermissionCheckboxes({
  selected,
  onChange,
}: {
  selected: Set<Action>
  onChange: (action: Action) => void
}) {
  return (
    <div className="space-y-4">
      {ACTION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {group.label}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {group.actions.map((action) => (
              <label
                key={action}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(action)}
                  onChange={() => onChange(action)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  {ACTION_LABELS[action]}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RoleCard({ role, onRefresh }: { role: TenantRoleItem; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: role.name,
    permissions: new Set(role.permissions as Action[]),
  })

  function togglePermission(action: Action) {
    setForm((prev) => {
      const next = new Set(prev.permissions)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return { ...prev, permissions: next }
    })
  }

  async function handleSave() {
    if (form.permissions.size === 0) {
      toast.error("Sélectionnez au moins une permission")
      return
    }
    setLoading(true)
    const result = await actionUpdateRole({
      roleId: role.id,
      name: form.name,
      permissions: Array.from(form.permissions),
    })
    setLoading(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success("Rôle mis à jour")
    setEditing(false)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm(`Supprimer le rôle "${role.name}" ?`)) return
    setLoading(true)
    const result = await actionDeleteRole({ roleId: role.id })
    setLoading(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success("Rôle supprimé")
    onRefresh()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{role.name}</span>
              {role.isSystem && (
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                  système
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Users className="w-3 h-3" />
              {role._count.tenantUsers} utilisateur{role._count.tenantUsers !== 1 ? "s" : ""}
              <span className="mx-1">·</span>
              {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!role.isSystem && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                onClick={() => { setEditing(!editing); setExpanded(true) }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                disabled={loading || role._count.tenantUsers > 0}
                title={role._count.tenantUsers > 0 ? "Réassignez les utilisateurs avant de supprimer" : "Supprimer ce rôle"}
                onClick={() => { void handleDelete() }}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400"
            onClick={() => { setExpanded(!expanded); if (expanded) setEditing(false) }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-4 bg-slate-50">
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nom du rôle</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <PermissionCheckboxes selected={form.permissions} onChange={togglePermission} />
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => { void handleSave() }} disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ name: role.name, permissions: new Set(role.permissions as Action[]) }) }}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {ACTION_GROUPS.map((group) => {
                const granted = group.actions.filter((a) => role.permissions.includes(a))
                if (granted.length === 0) return null
                return (
                  <div key={group.label}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {granted.map((a) => (
                        <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {ACTION_LABELS[a]}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreateRoleForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({ name: "", permissions: new Set() })

  function togglePermission(action: Action) {
    setForm((prev) => {
      const next = new Set(prev.permissions)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return { ...prev, permissions: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error("Entrez un nom de rôle"); return }
    if (form.permissions.size === 0) { toast.error("Sélectionnez au moins une permission"); return }
    setLoading(true)
    const result = await actionCreateRole({
      name: form.name,
      permissions: Array.from(form.permissions),
    })
    setLoading(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success(`Rôle "${form.name}" créé`)
    setForm({ name: "", permissions: new Set() })
    setOpen(false)
    onCreated()
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Nouveau rôle
      </Button>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-4">Nouveau rôle personnalisé</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="role-name">Nom du rôle *</Label>
          <Input
            id="role-name"
            placeholder="ex : Patron, Laboratorien, Responsable HSE..."
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="mt-1"
            maxLength={50}
          />
        </div>
        <div>
          <Label>Permissions *</Label>
          <div className="mt-2 border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
            <PermissionCheckboxes selected={form.permissions} onChange={togglePermission} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {form.permissions.size} permission{form.permissions.size !== 1 ? "s" : ""} sélectionnée{form.permissions.size !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Créer le rôle
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}

export function RolesPageClient({ roles }: Props) {
  const router = useRouter()

  function refresh() {
    router.refresh()
  }

  const systemRoles = roles.filter((r) => r.isSystem)
  const customRoles = roles.filter((r) => !r.isSystem)

  return (
    <div className="space-y-6">
      <CreateRoleForm onCreated={refresh} />

      {customRoles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Rôles personnalisés ({customRoles.length})
          </h2>
          <div className="space-y-3">
            {customRoles.map((role) => (
              <RoleCard key={role.id} role={role} onRefresh={refresh} />
            ))}
          </div>
        </div>
      )}

      {systemRoles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            Rôles système (non modifiables)
          </h2>
          <div className="space-y-3 opacity-80">
            {systemRoles.map((role) => (
              <RoleCard key={role.id} role={role} onRefresh={refresh} />
            ))}
          </div>
        </div>
      )}

      {roles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Shield className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucun rôle personnalisé — créez le premier ci-dessus.</p>
        </div>
      )}
    </div>
  )
}
