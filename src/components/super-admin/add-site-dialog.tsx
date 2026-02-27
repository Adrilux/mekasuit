"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { actionCreateSite } from "@/server/actions/super-admin/action-create-site"

type Props = {
  tenantId: string
}

type FormState = {
  name: string
  address: string
}

const defaultForm: FormState = {
  name: "",
  address: "",
}

export function AddSiteDialog({ tenantId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(defaultForm)
    }
    setOpen(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await actionCreateSite({
      tenantId,
      name: form.name,
      address: form.address || undefined,
    })

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Site ajouté")
    router.refresh()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MapPin className="w-4 h-4 mr-1.5" />
          Ajouter un site
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter un site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="as-name">Nom du site</Label>
            <Input
              id="as-name"
              placeholder="Atelier principal"
              value={form.name}
              onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })) }}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="as-address">Adresse (optionnel)</Label>
            <Input
              id="as-address"
              placeholder="12 rue de l'Industrie, 75001 Paris"
              value={form.address}
              onChange={(e) => { setForm((p) => ({ ...p, address: e.target.value })) }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { handleOpenChange(false) }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le site"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
