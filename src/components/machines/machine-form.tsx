"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { actionCreateMachine } from "@/server/actions/machines/action-create-machine"
import { actionUpdateMachine } from "@/server/actions/machines/action-update-machine"
import { toast } from "sonner"
import type { SiteListItem } from "@/server/queries/sites/query-get-sites-by-tenant"

type MachineFormProps = {
  sites: Pick<SiteListItem, "id" | "name">[]
  // Si machine est fourni, c'est un formulaire d'édition
  machine?: {
    id: string
    siteId: string
    name: string
    serialNumber: string | null
    category: string | null
    manufacturer: string | null
    model: string | null
    installedAt: Date | null
    notes: string | null
  }
}

export function MachineForm({ sites, machine }: MachineFormProps) {
  const router = useRouter()
  const isEdit = !!machine
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)

    const payload = {
      siteId: form.get("siteId") as string,
      name: form.get("name") as string,
      serialNumber: form.get("serialNumber") as string || undefined,
      category: form.get("category") as string || undefined,
      manufacturer: form.get("manufacturer") as string || undefined,
      model: form.get("model") as string || undefined,
      installedAt: form.get("installedAt") as string || undefined,
      notes: form.get("notes") as string || undefined,
    }

    const result = isEdit
      ? await actionUpdateMachine({ machineId: machine.id, ...payload })
      : await actionCreateMachine(payload)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Machine modifiée" : "Machine ajoutée")
    router.push(isEdit ? `/machines/${machine.id}` : "/machines")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      {/* Site — désactivé en édition (on ne change pas le site d'une machine) */}
      <div>
        <Label htmlFor="siteId">Site *</Label>
        {isEdit ? (
          <input type="hidden" name="siteId" value={machine.siteId} />
        ) : (
          <Select name="siteId" defaultValue={sites[0]?.id} required>
            <SelectTrigger id="siteId" className="mt-1">
              <SelectValue placeholder="Sélectionner un site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label htmlFor="name">Nom de la machine *</Label>
        <Input id="name" name="name" required maxLength={100} defaultValue={machine?.name} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Input id="category" name="category" maxLength={100} defaultValue={machine?.category ?? ""} className="mt-1" placeholder="Ex: Presse hydraulique" />
        </div>
        <div>
          <Label htmlFor="serialNumber">N° de série</Label>
          <Input id="serialNumber" name="serialNumber" maxLength={100} defaultValue={machine?.serialNumber ?? ""} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="manufacturer">Fabricant</Label>
          <Input id="manufacturer" name="manufacturer" maxLength={100} defaultValue={machine?.manufacturer ?? ""} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="model">Modèle</Label>
          <Input id="model" name="model" maxLength={100} defaultValue={machine?.model ?? ""} className="mt-1" />
        </div>
      </div>

      <div>
        <Label htmlFor="installedAt">Date de mise en service</Label>
        <Input
          id="installedAt"
          name="installedAt"
          type="date"
          defaultValue={machine?.installedAt ? machine.installedAt.toISOString().split("T")[0] : ""}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes / Description</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={2000}
          defaultValue={machine?.notes ?? ""}
          className="mt-1 resize-none"
          rows={3}
          placeholder="Informations complémentaires, localisation, particularités techniques…"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Ajouter la machine"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
