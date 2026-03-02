"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select"
import { UserDeactivateButton } from "@/components/users/user-deactivate-button"
import { UserReactivateButton } from "@/components/users/user-reactivate-button"
import { actionUpdateUserRole } from "@/server/actions/users/action-update-user-role"
import { actionUpdateUserInfo } from "@/server/actions/users/action-update-user-info"
import type { UserRole } from "@prisma/client"
import type { TenantUserListItem } from "@/server/queries/users/query-get-users-by-tenant"

const SYSTEM_ROLES: { value: UserRole; label: string }[] = [
  { value: "client_admin", label: "Administrateur" },
  { value: "workshop_manager", label: "Chef d'atelier" },
  { value: "technician", label: "Technicien" },
  { value: "reader", label: "Lecteur" },
]

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  client_admin: "bg-purple-100 text-purple-700",
  workshop_manager: "bg-blue-100 text-blue-700",
  technician: "bg-green-100 text-green-700",
  reader: "bg-slate-100 text-slate-600",
}

type Site = { id: string; name: string }
type CustomRole = { id: string; name: string }

type Props = {
  users: TenantUserListItem[]
  allSites: Site[]
  allCustomRoles: CustomRole[]
  sessionUserId: string
  canEdit: boolean
  canDeactivate: boolean
}

function EditableUserRow({
  user,
  allSites,
  allCustomRoles,
  sessionUserId,
  canEdit,
  canDeactivate,
}: {
  user: TenantUserListItem
  allSites: Site[]
  allCustomRoles: CustomRole[]
  sessionUserId: string
  canEdit: boolean
  canDeactivate: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editName, setEditName] = useState(user.name)

  // roleValue : "workshop_manager" (système) ou "custom:clxxx" (custom)
  const initialRoleValue = user.tenantRoleId ? `custom:${user.tenantRoleId}` : user.role
  const [editRoleValue, setEditRoleValue] = useState<string>(initialRoleValue)
  const [editSiteIds, setEditSiteIds] = useState<string[]>(
    user.userSites.map((us) => us.site.id)
  )

  const isCurrentUser = user.authUserId === sessionUserId
  const isSuperAdmin = user.role === "super_admin"
  const isEditable = canEdit && !isCurrentUser && !isSuperAdmin && user.isActive

  function toggleSite(siteId: string) {
    setEditSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    )
  }

  function cancelEdit() {
    setEditName(user.name)
    setEditRoleValue(initialRoleValue)
    setEditSiteIds(user.userSites.map((us) => us.site.id))
    setEditing(false)
  }

  async function handleSave() {
    if (editSiteIds.length === 0) {
      toast.error("Assignez au moins un site")
      return
    }
    setLoading(true)

    if (editRoleValue !== initialRoleValue) {
      const r = await actionUpdateUserRole({ tenantUserId: user.id, roleValue: editRoleValue })
      if (!r.success) { toast.error(r.error); setLoading(false); return }
    }

    const r2 = await actionUpdateUserInfo({
      tenantUserId: user.id,
      name: editName,
      siteIds: editSiteIds,
    })
    setLoading(false)

    if (!r2.success) { toast.error(r2.error); return }
    toast.success("Utilisateur mis à jour")
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/60 border-b border-blue-100">
        <td className="px-4 py-3 min-w-[180px]">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 text-sm"
            placeholder="Nom complet"
          />
          <p className="text-xs text-slate-400 mt-1">{user.email}</p>
        </td>
        <td className="px-4 py-3">
          <Select value={editRoleValue} onValueChange={setEditRoleValue}>
            <SelectTrigger className="h-8 text-xs w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs text-slate-400">Rôles système</SelectLabel>
                {SYSTEM_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              {allCustomRoles.length > 0 && (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel className="text-xs text-slate-400">Rôles personnalisés</SelectLabel>
                    {allCustomRoles.map((r) => (
                      <SelectItem key={r.id} value={`custom:${r.id}`} className="text-xs">
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {allSites.map((site) => {
              const active = editSiteIds.includes(site.id)
              return (
                <label
                  key={site.id}
                  className={`flex items-center gap-1 cursor-pointer text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    active
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => toggleSite(site.id)}
                  />
                  {site.name}
                </label>
              )
            })}
          </div>
        </td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 justify-end">
            <Button size="sm" className="h-7 px-2" disabled={loading} onClick={() => { void handleSave() }}>
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2" disabled={loading} onClick={cancelEdit}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  // Affichage : rôle custom en amber, système en couleur selon le rôle
  const roleLabel = user.tenantRole?.name
    ?? (SYSTEM_ROLES.find((r) => r.value === user.role)?.label ?? user.role)
  const roleColor = user.tenantRole
    ? "bg-amber-100 text-amber-700"
    : (ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600")
  const sites = user.userSites.map((us) => us.site.name)

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!user.isActive ? "opacity-50" : ""}`}>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900 text-sm">
          {user.name}
          {isCurrentUser && <span className="ml-1.5 text-xs text-slate-400">(vous)</span>}
        </p>
        <p className="text-xs text-slate-400">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>
          {roleLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {sites.length > 0
            ? sites.map((s) => (
                <span key={s} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))
            : <span className="text-xs text-slate-400">—</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        {user.isActive
          ? <span className="text-xs text-green-600 font-medium">Actif</span>
          : <span className="text-xs text-slate-400">Désactivé</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 justify-end">
          {isEditable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {canDeactivate && !isCurrentUser && !isSuperAdmin && user.isActive && (
            <UserDeactivateButton tenantUserId={user.id} />
          )}
          {canDeactivate && !isCurrentUser && !isSuperAdmin && !user.isActive && (
            <UserReactivateButton tenantUserId={user.id} />
          )}
        </div>
      </td>
    </tr>
  )
}

export function UsersTable({ users, allSites, allCustomRoles, sessionUserId, canEdit, canDeactivate }: Props) {
  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aucun utilisateur — invitez le premier membre de votre équipe.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-medium text-slate-600">Utilisateur</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Rôle</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Sites</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <EditableUserRow
              key={user.id}
              user={user}
              allSites={allSites}
              allCustomRoles={allCustomRoles}
              sessionUserId={sessionUserId}
              canEdit={canEdit}
              canDeactivate={canDeactivate}
            />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
