"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, UserCircle2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { actionUpdateUserOrgInfo } from "@/server/actions/users/action-update-user-org-info"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export type OrgUser = {
  id: string           // tenantUser.id
  authUserId: string
  name: string
  email: string
  jobTitle: string | null
  managerId: string | null  // authUserId du manager
  role: string
  isActive: boolean
}

function roleColor(role: string): string {
  if (role.startsWith("custom:")) return "bg-amber-100 text-amber-700 border-amber-200"
  switch (role) {
    case "client_admin": return "bg-purple-100 text-purple-700 border-purple-200"
    case "workshop_manager": return "bg-blue-100 text-blue-700 border-blue-200"
    case "technician": return "bg-green-100 text-green-700 border-green-200"
    default: return "bg-slate-100 text-slate-500 border-slate-200"
  }
}

function roleLabel(role: string): string {
  if (role.startsWith("custom:")) return role.slice(7)
  switch (role) {
    case "client_admin": return "Administrateur"
    case "workshop_manager": return "Chef d'atelier"
    case "technician": return "Technicien"
    case "reader": return "Lecteur"
    default: return role
  }
}

function OrgCard({
  user,
  allUsers,
  canEdit,
}: {
  user: OrgUser
  allUsers: OrgUser[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "")
  const [managerId, setManagerId] = useState<string>(user.managerId ?? "__none__")
  const [isPending, startTransition] = useTransition()

  const eligibleManagers = allUsers.filter(
    (u) => u.authUserId !== user.authUserId && u.isActive
  )

  function cancel() {
    setJobTitle(user.jobTitle ?? "")
    setManagerId(user.managerId ?? "__none__")
    setEditing(false)
  }

  function save() {
    startTransition(async () => {
      const result = await actionUpdateUserOrgInfo({
        tenantUserId: user.id,
        jobTitle: jobTitle.trim() || null,
        managerId: managerId === "__none__" ? null : managerId,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Informations mises à jour")
      setEditing(false)
      router.refresh()
    })
  }

  return (
    <div className={`bg-white border rounded-lg p-3 w-52 shadow-sm ${user.isActive ? "border-slate-200" : "border-slate-200 opacity-50"}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <UserCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
          </div>
          {editing ? (
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Poste / fonction"
              className="h-6 text-xs mt-1 px-1.5"
            />
          ) : (
            <p className="text-xs text-slate-500 mt-0.5 pl-[22px] truncate">
              {user.jobTitle
                ? user.jobTitle
                : <span className="text-slate-300 italic">Poste non défini</span>}
            </p>
          )}
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-slate-300 hover:text-blue-500 shrink-0 mt-0.5"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded border mt-2 ${roleColor(user.role)}`}>
        {roleLabel(user.role)}
      </span>

      {editing && (
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Manager</p>
            <Select value={managerId} onValueChange={setManagerId} disabled={isPending}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs text-slate-400">Aucun</SelectItem>
                {eligibleManagers.map((m) => (
                  <SelectItem key={m.authUserId} value={m.authUserId} className="text-xs">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-6 text-xs px-2 flex-1"
              onClick={() => { void save() }}
              disabled={isPending}
            >
              <Check className="w-3 h-3 mr-0.5" />
              OK
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs px-2"
              onClick={cancel}
              disabled={isPending}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function OrgNode({
  user,
  allUsers,
  childrenMap,
  canEdit,
}: {
  user: OrgUser
  allUsers: OrgUser[]
  childrenMap: Map<string | null, OrgUser[]>
  canEdit: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  const children = childrenMap.get(user.authUserId) ?? []
  const hasChildren = children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Card + collapse toggle */}
      <div className="relative">
        <OrgCard user={user} allUsers={allUsers} canEdit={canEdit} />
        {hasChildren && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm z-10"
            title={collapsed ? "Déplier" : "Replier"}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="mt-6 flex flex-col items-center">
          {/* Vertical line from parent to horizontal bar */}
          <div className="w-px h-4 bg-slate-200" />

          {children.length === 1 ? (
            // Single child — just a straight line
            <div className="flex flex-col items-center">
              <OrgNode
                user={children[0]}
                allUsers={allUsers}
                childrenMap={childrenMap}
                canEdit={canEdit}
              />
            </div>
          ) : (
            // Multiple children — horizontal connector bar
            <div className="relative flex items-start">
              {/* Horizontal bar spanning all children */}
              <div className="absolute top-0 left-[calc(50%+26px)] right-[calc(50%+26px)] h-px bg-slate-200" style={{ left: "26px", right: "26px" }} />
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center px-3">
                  <div className="w-px h-4 bg-slate-200" />
                  <OrgNode
                    user={child}
                    allUsers={allUsers}
                    childrenMap={childrenMap}
                    canEdit={canEdit}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function OrgChart({
  users,
  canEdit,
}: {
  users: OrgUser[]
  canEdit: boolean
}) {
  // Build map: managerId (authUserId) → direct reports
  const childrenMap = new Map<string | null, OrgUser[]>()
  for (const user of users) {
    const key = user.managerId ?? null
    if (!childrenMap.has(key)) childrenMap.set(key, [])
    childrenMap.get(key)!.push(user)
  }

  // Root nodes: users with no manager or manager not in this tenant
  const tenantAuthIds = new Set(users.map((u) => u.authUserId))
  const roots = users.filter(
    (u) => !u.managerId || !tenantAuthIds.has(u.managerId)
  )

  if (users.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-12">
        Aucun utilisateur trouvé.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex gap-12 px-8 pt-8 justify-center min-w-max">
        {roots.map((root) => (
          <OrgNode
            key={root.id}
            user={root}
            allUsers={users}
            childrenMap={childrenMap}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  )
}
