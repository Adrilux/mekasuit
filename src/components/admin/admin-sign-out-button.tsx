"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/auth/better-auth-client-config"

export function AdminSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <button
      onClick={() => { void handleSignOut() }}
      className="mt-3 flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
    >
      <LogOut className="w-3 h-3" />
      Se déconnecter
    </button>
  )
}
