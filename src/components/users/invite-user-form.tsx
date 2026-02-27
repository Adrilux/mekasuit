"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionInviteUser } from "@/server/actions/users/action-invite-user"
import { toast } from "sonner"
import { Copy, CheckCircle2, Key } from "lucide-react"
import type { SiteListItem } from "@/server/queries/sites/query-get-sites-by-tenant"
import type { UserRole } from "@prisma/client"

// Les rôles qu'un workshop_manager peut assigner sont limités
const ROLES_BY_INVITER: Record<string, { value: UserRole; label: string }[]> = {
  workshop_manager: [
    { value: "technician", label: "Technicien" },
    { value: "reader", label: "Lecteur" },
  ],
  client_admin: [
    { value: "client_admin", label: "Administrateur" },
    { value: "workshop_manager", label: "Chef d'atelier" },
    { value: "technician", label: "Technicien" },
    { value: "reader", label: "Lecteur" },
  ],
  super_admin: [
    { value: "client_admin", label: "Administrateur" },
    { value: "workshop_manager", label: "Chef d'atelier" },
    { value: "technician", label: "Technicien" },
    { value: "reader", label: "Lecteur" },
  ],
}

type InviteResult = {
  status: "created" | "linked"
  email: string
  tempPassword?: string
}

export function InviteUserForm({
  sites,
  userRole,
}: {
  sites: Pick<SiteListItem, "id" | "name">[]
  userRole: UserRole
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [result, setResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)

  const availableRoles = ROLES_BY_INVITER[userRole] ?? ROLES_BY_INVITER.client_admin

  function toggleSite(siteId: string) {
    setSelectedSites((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    )
  }

  function copyPassword(password: string) {
    void navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (selectedSites.length === 0) {
      toast.error("Sélectionnez au moins un site")
      return
    }

    setLoading(true)
    const form = new FormData(e.currentTarget)

    const res = await actionInviteUser({
      name: form.get("name") as string,
      email: form.get("email") as string,
      role: form.get("role") as UserRole,
      siteIds: selectedSites,
    })

    setLoading(false)

    if (!res.success) {
      toast.error(res.error)
      return
    }

    if (res.data.status === "created" && res.data.tempPassword) {
      setResult({
        status: "created",
        email: res.data.email as string,
        tempPassword: res.data.tempPassword as string,
      })
    } else {
      toast.success("Utilisateur ajouté avec succès")
      router.push("/users")
      router.refresh()
    }
  }

  // Écran de résultat avec mot de passe temporaire
  if (result?.status === "created" && result.tempPassword) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Compte créé avec succès</h3>
            <p className="text-sm text-slate-500 mt-1">
              L'utilisateur peut maintenant se connecter. Communiquez-lui les informations ci-dessous.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <Key className="w-4 h-4" />
            Identifiants de connexion
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded border border-amber-200 px-3 py-2">
              <div>
                <span className="text-xs text-slate-400 block">Email</span>
                <span className="text-sm font-mono text-slate-700">{result.email}</span>
              </div>
              <button
                onClick={() => void navigator.clipboard.writeText(result.email)}
                className="p-1 hover:text-amber-700 text-amber-500"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between bg-white rounded border border-amber-200 px-3 py-2">
              <div>
                <span className="text-xs text-slate-400 block">Mot de passe temporaire</span>
                <span className="text-sm font-mono text-slate-700 tracking-wider">{result.tempPassword}</span>
              </div>
              <button
                onClick={() => { if (result.tempPassword) copyPassword(result.tempPassword) }}
                className="p-1 hover:text-amber-700 text-amber-500"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-amber-700">
            L'utilisateur sera invité à changer son mot de passe dès sa première connexion.
          </p>
        </div>

        <Button
          onClick={() => { router.push("/users"); router.refresh() }}
          className="w-full"
        >
          Retour à la liste des utilisateurs
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      <div>
        <Label htmlFor="name">Nom complet *</Label>
        <Input id="name" name="name" required maxLength={100} className="mt-1" />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" required className="mt-1" />
        <p className="text-xs text-slate-400 mt-1">
          Si cet email n'a pas encore de compte, il sera créé automatiquement avec un mot de passe temporaire.
        </p>
      </div>

      <div>
        <Label htmlFor="role">Rôle *</Label>
        <Select name="role" defaultValue={availableRoles[availableRoles.length - 1]?.value} required>
          <SelectTrigger id="role" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Sites assignés * <span className="text-slate-400 font-normal">(au moins un)</span></Label>
        <div className="mt-2 space-y-2">
          {sites.map((site) => (
            <label key={site.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSites.includes(site.id)}
                onChange={() => toggleSite(site.id)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">{site.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Traitement..." : "Ajouter l'utilisateur"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
