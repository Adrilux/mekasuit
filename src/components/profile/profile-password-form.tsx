"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { actionChangePassword } from "@/server/actions/auth/action-change-password"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function ProfilePasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await actionChangePassword({
        currentPassword: form.get("currentPassword") as string,
        newPassword:     form.get("newPassword") as string,
        confirmPassword: form.get("confirmPassword") as string,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success("Mot de passe modifié")
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <div className="relative">
          <Input id="currentPassword" name="currentPassword" type={showCurrent ? "text" : "password"} required className="pr-10" />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowCurrent((p) => !p)}>
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <div className="relative">
          <Input id="newPassword" name="newPassword" type={showNew ? "text" : "password"} required minLength={8} className="pr-10" />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowNew((p) => !p)}>
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-400">Au moins 8 caractères</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Enregistrement…</> : "Changer le mot de passe"}
      </Button>
    </form>
  )
}
