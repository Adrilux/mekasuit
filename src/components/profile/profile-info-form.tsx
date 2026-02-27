"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { actionUpdateProfile } from "@/server/actions/profile/action-update-profile"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type Props = {
  initialName: string
}

export function ProfileInfoForm({ initialName }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await actionUpdateProfile({ name })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success("Nom mis à jour")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom complet</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending || name === initialName}>
        {isPending ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Enregistrement…</> : "Enregistrer"}
      </Button>
    </form>
  )
}
