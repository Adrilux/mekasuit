"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { actionUpdateUserRole } from "@/server/actions/users/action-update-user-role"
import { toast } from "sonner"
import type { UserRole } from "@prisma/client"

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "client_admin", label: "Admin" },
  { value: "workshop_manager", label: "Chef d'atelier" },
  { value: "technician", label: "Technicien" },
  { value: "reader", label: "Lecteur" },
]

export function UserRoleActions({
  tenantUserId,
  currentRole,
}: {
  tenantUserId: string
  currentRole: UserRole
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRoleChange(newRole: UserRole) {
    if (newRole === currentRole) return
    setLoading(true)
    const result = await actionUpdateUserRole({ tenantUserId, newRole })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Rôle mis à jour")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="text-xs">
          Rôle <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ASSIGNABLE_ROLES.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            className={currentRole === role.value ? "font-semibold text-blue-600" : ""}
          >
            {role.label}
            {currentRole === role.value && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
