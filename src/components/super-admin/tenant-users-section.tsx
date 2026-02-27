"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { actionUnlinkUser } from "@/server/actions/super-admin/action-unlink-user"

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  client_admin: "Admin client",
  workshop_manager: "Chef d'atelier",
  technician: "Technicien",
  reader: "Lecteur",
}

export type TenantUserWithName = {
  id: string
  authUserId: string
  role: string
  joinedAt: Date
  name: string
  email: string
}

type Props = {
  tenantId: string
  users: TenantUserWithName[]
}

export function TenantUsersSection({ users }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUnlink(tenantUserId: string) {
    setDeletingId(tenantUserId)

    const result = await actionUnlinkUser({ tenantUserId })

    setDeletingId(null)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Utilisateur délié du tenant")
    router.refresh()
  }

  if (users.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aucun utilisateur lié — utilisez le bouton ci-dessus pour en ajouter un.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left font-medium text-slate-400 pb-2 pr-4">Nom</th>
            <th className="text-left font-medium text-slate-400 pb-2 pr-4">Email</th>
            <th className="text-left font-medium text-slate-400 pb-2 pr-4">Rôle</th>
            <th className="text-left font-medium text-slate-400 pb-2 pr-4">Rejoint le</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {users.map((user) => {
            const isDeleting = deletingId === user.id
            return (
              <tr key={user.id} className="group">
                <td className="py-2.5 pr-4 font-medium text-slate-200">
                  {user.name}
                </td>
                <td className="py-2.5 pr-4 text-slate-400">{user.email}</td>
                <td className="py-2.5 pr-4">
                  <span className="inline-block text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-slate-500 text-xs">
                  {new Date(user.joinedAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-600 hover:text-red-400 hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isDeleting || user.role === "super_admin"}
                    title={
                      user.role === "super_admin"
                        ? "Impossible de délier un super admin"
                        : "Délier cet utilisateur"
                    }
                    onClick={() => { void handleUnlink(user.id) }}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
