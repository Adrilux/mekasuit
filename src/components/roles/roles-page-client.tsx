"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, Shield, ChevronDown, ChevronUp, Loader2, UserCircle, Check } from "lucide-react"
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

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Machines":      { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  "Interventions": { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  "Stock":         { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  "Sites":         { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Utilisateurs":  { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200"    },
  "Modules":       { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200"    },
  "Rapports":      { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
  "Audit":         { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200"   },
}

function PermissionCheckboxes({
  selected,
  onChange,
}: {
  selected: Set<Action>
  onChange: (action: Action) => void
}) {
  return (
    <div className="space-y-5">
      {ACTION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {group.label}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {group.actions.map((action) => (
              <label
                key={action}
                className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.has(action) ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                }`}>
                  {selected.has(action) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" checked={selected.has(action)} onChange={() => onChange(action)} className="sr-only" />
                <span className="text-sm text-slate-700">{ACTION_LABELS[action]}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PermissionsDisplay({ permissions }: { permissions: string[] }) {
  const permSet = new Set(permissions)
  const groups = ACTION_GROUPS
    .map((g) => ({ ...g, granted: g.actions.filter((a) => permSet.has(a)) }))
    .filter((g) => g.granted.length > 0)

  if (groups.length === 0) {
    return <p className="text-sm text-slate-400 italic">Aucune permission configurée</p>
  }

  return (
    <div className="space-y-4">
      {ACTION_GROUPS.map((group) => {
        const colors = GROUP_COLORS[group.label] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }
        const grantedCount = group.actions.filter((a) => permSet.has(a)).length
        if (grantedCount === 0) return null
        return (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{group.label}</p>
              <span className="text-xs text-slate-400">{grantedCount}/{group.actions.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.actions.map((action) => {
                const granted = permSet.has(action)
                return (
                  <span
                    key={action}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      granted
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : "bg-slate-50 text-slate-300 border-slate-100"
                    }`}
                  >
                    {ACTION_LABELS[action as Action]}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UsersDisplay({ users }: { users: TenantRoleItem["users"] }) {
  if (users.length === 0) {
    return <p className="text-sm text-slate-400 italic">Aucun utilisateur assigné à ce rôle</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {users.map((u) => (
        <div key={u.authUserId} className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 border border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
            <p className="text-xs text-slate-400 truncate">{u.jobTitle ?? u.email}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RoleCard({ role, onRefresh }: { role: TenantRoleItem; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<"permissions" | "users">("permissions")
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
    if (form.permissions.size === 0) { toast.error("Sélectionnez au moins une permission"); return }
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header cliquable */}
      <div
        className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
        onClick={() => { setExpanded(!expanded); if (expanded) setEditing(false) }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            role.isSystem ? "bg-blue-50" : "bg-violet-50"
          }`}>
            <Shield className={`w-4 h-4 ${role.isSystem ? "text-blue-500" : "text-violet-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{role.name}</span>
              {role.isSystem && (
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                  système
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span>{role._count.tenantUsers} utilisateur{role._count.tenantUsers !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!role.isSystem && (
            <>
              <Button
                variant="ghost" size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                onClick={() => { setEditing(!editing); setExpanded(true) }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost" size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                disabled={loading || role._count.tenantUsers > 0}
                title={role._count.tenantUsers > 0 ? "Réassignez les utilisateurs avant de supprimer" : "Supprimer"}
                onClick={() => { void handleDelete() }}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          <div className="w-8 h-8 flex items-center justify-center text-slate-400 pointer-events-none">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Contenu déplié */}
      {expanded && (
        <div className="border-t border-slate-100">
          {editing ? (
            <div className="px-4 py-4 bg-slate-50 space-y-4">
              <div>
                <Label className="text-xs">Nom du rôle</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Permissions</Label>
                <div className="border border-slate-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <PermissionCheckboxes selected={form.permissions} onChange={togglePermission} />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {form.permissions.size} permission{form.permissions.size !== 1 ? "s" : ""} sélectionnée{form.permissions.size !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { void handleSave() }} disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditing(false)
                  setForm({ name: role.name, permissions: new Set(role.permissions as Action[]) })
                }}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs Permissions / Utilisateurs */}
              <div className="flex bg-slate-50 border-b border-slate-100">
                {(["permissions", "users"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "permissions" ? "Permissions" : "Utilisateurs"}
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      activeTab === tab ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                    }`}>
                      {tab === "permissions" ? role.permissions.length : role._count.tenantUsers}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-4 py-4 bg-slate-50/40">
                {activeTab === "permissions" && <PermissionsDisplay permissions={role.permissions} />}
                {activeTab === "users" && <UsersDisplay users={role.users} />}
              </div>
            </>
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
    const result = await actionCreateRole({ name: form.name, permissions: Array.from(form.permissions) })
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
    <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
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
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}

export function RolesPageClient({ roles }: Props) {
  const router = useRouter()

  const systemRoles = roles.filter((r) => r.isSystem)
  const customRoles = roles.filter((r) => !r.isSystem)

  return (
    <div className="space-y-6">
      <CreateRoleForm onCreated={() => router.refresh()} />

      {customRoles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Rôles personnalisés ({customRoles.length})</h2>
          <div className="space-y-3">
            {customRoles.map((role) => (
              <RoleCard key={role.id} role={role} onRefresh={() => router.refresh()} />
            ))}
          </div>
        </div>
      )}

      {systemRoles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">Rôles système — non modifiables ({systemRoles.length})</h2>
          <div className="space-y-3">
            {systemRoles.map((role) => (
              <RoleCard key={role.id} role={role} onRefresh={() => router.refresh()} />
            ))}
          </div>
        </div>
      )}

      {roles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Shield className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucun rôle — créez le premier ci-dessus.</p>
        </div>
      )}
    </div>
  )
}
