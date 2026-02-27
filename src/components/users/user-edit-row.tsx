"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { actionUpdateUserRole } from "@/server/actions/users/action-update-user-role"
import { actionUpdateUserInfo } from "@/server/actions/users/action-update-user-info"
import type { UserRole } from "@prisma/client"

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "client_admin", label: "Administrateur" },
  { value: "workshop_manager", label: "Chef d'atelier" },
  { value: "technician", label: "Technicien" },
  { value: "reader", label: "Lecteur" },
]

type Site = { id: string; name: string }

type Props = {
  tenantUserId: string
  currentName: string
  currentEmail: string
  currentRole: UserRole
  currentRoleLabel: string
  currentSiteIds: string[]
  allSites: Site[]
  canEdit: boolean
  isCurrentUser: boolean
  customRoles?: { id: string; name: string }[]
}

export function UserEditRow({
  tenantUserId,
  currentName,
  currentEmail,
  currentRole,
  currentRoleLabel,
  currentSiteIds,
  allSites,
  canEdit,
  isCurrentUser,
  customRoles = [],
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(currentName)
  const [role, setRole] = useState<UserRole>(currentRole)
  const [siteIds, setSiteIds] = useState<string[]>(currentSiteIds)

  function toggleSite(siteId: string) {
    setSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    )
  }

  function cancelEdit() {
    setName(currentName)
    setRole(currentRole)
    setSiteIds(currentSiteIds)
    setEditing(false)
  }

  async function handleSave() {
    if (siteIds.length === 0) {
      toast.error("Assignez au moins un site")
      return
    }
    setLoading(true)

    // Met à jour le rôle système si changé
    if (role !== currentRole) {
      const roleResult = await actionUpdateUserRole({ tenantUserId, newRole: role })
      if (!roleResult.success) {
        toast.error(roleResult.error)
        setLoading(false)
        return
      }
    }

    // Met à jour nom + sites
    const infoResult = await actionUpdateUserInfo({ tenantUserId, name, siteIds })
    setLoading(false)

    if (!infoResult.success) {
      toast.error(infoResult.error)
      return
    }

    toast.success("Utilisateur mis à jour")
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <tr className="bg-blue-50 border-b border-blue-100">
        {/* Nom + email */}
        <td className="px-4 py-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm w-44"
          />
          <p className="text-xs text-slate-400 mt-0.5">{currentEmail}</p>
        </td>
        {/* Rôle */}
        <td className="px-4 py-3">
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        {/* Sites */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {allSites.map((site) => (
              <label
                key={site.id}
                className={`flex items-center gap-1 cursor-pointer text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  siteIds.includes(site.id)
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={siteIds.includes(site.id)}
                  onChange={() => toggleSite(site.id)}
                />
                {site.name}
              </label>
            ))}
          </div>
        </td>
        {/* Actions */}
        <td className="px-4 py-3" colSpan={2}>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="h-7"
              disabled={loading}
              onClick={() => { void handleSave() }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              disabled={loading}
              onClick={cancelEdit}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return null // rendu par le parent en mode normal
}

// Composant affichant uniquement le bouton d'édition (dans la ligne normale)
export function UserEditButton({
  canEdit,
  onClick,
}: {
  canEdit: boolean
  onClick: () => void
}) {
  if (!canEdit) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
      onClick={onClick}
    >
      <Pencil className="w-3.5 h-3.5" />
    </Button>
  )
}
