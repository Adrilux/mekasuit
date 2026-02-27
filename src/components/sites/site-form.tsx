"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { actionCreateSite } from "@/server/actions/sites/action-create-site"
import { actionUpdateSite } from "@/server/actions/sites/action-update-site"
import { toast } from "sonner"

type SiteFormProps = {
  site?: { id: string; name: string; address: string | null }
}

export function SiteForm({ site }: SiteFormProps) {
  const router = useRouter()
  const isEdit = !!site
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get("name") as string,
      address: form.get("address") as string || undefined,
    }

    const result = isEdit
      ? await actionUpdateSite({ siteId: site.id, ...payload })
      : await actionCreateSite(payload)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Site modifié" : "Site créé")
    router.push("/sites")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      <div>
        <Label htmlFor="name">Nom du site *</Label>
        <Input id="name" name="name" required maxLength={100} defaultValue={site?.name} className="mt-1" placeholder="Ex: Atelier principal" />
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" maxLength={300} defaultValue={site?.address ?? ""} className="mt-1" placeholder="Ex: Rue des Usines 12, 4000 Liège" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le site"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
