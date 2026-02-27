"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Loader2, Copy, CheckCircle2, Key } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { actionLinkUserToTenant } from "@/server/actions/super-admin/action-link-user-to-tenant"

type Props = {
  tenantId: string
  tenantName: string
}

type FormState = {
  userEmail: string
  userName: string
  role: string
}

type LinkResult = {
  status: "created" | "linked"
  email?: string
  tempPassword?: string
}

const defaultForm: FormState = {
  userEmail: "",
  userName: "",
  role: "client_admin",
}

export function LinkUserDialog({ tenantId, tenantName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [result, setResult] = useState<LinkResult | null>(null)
  const [copied, setCopied] = useState<"email" | "password" | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(defaultForm)
      setResult(null)
    }
    setOpen(next)
  }

  function copyText(text: string, field: "email" | "password") {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await actionLinkUserToTenant({
      tenantId,
      userEmail: form.userEmail,
      userName: form.userName || undefined,
      role: form.role,
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
      toast.success(`Utilisateur lié à ${tenantName}`)
      router.refresh()
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
          <UserPlus className="w-4 h-4 mr-1.5" />
          Lier un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Lier un utilisateur à {tenantName}</DialogTitle>
        </DialogHeader>

        {result?.status === "created" && result.tempPassword ? (
          <div className="space-y-4 mt-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Compte créé et lié</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Communiquez ces identifiants à l'utilisateur.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-medium mb-1">
                <Key className="w-3.5 h-3.5" />
                Identifiants de connexion
              </div>
              <div className="flex items-center justify-between bg-white rounded border border-amber-200 px-2.5 py-1.5">
                <div>
                  <span className="text-xs text-slate-400 block">Email</span>
                  <span className="text-xs font-mono text-slate-700">{result.email}</span>
                </div>
                <button
                  onClick={() => { if (result.email) copyText(result.email, "email") }}
                  className="p-1 text-amber-500 hover:text-amber-700"
                >
                  {copied === "email"
                    ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                    : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between bg-white rounded border border-amber-200 px-2.5 py-1.5">
                <div>
                  <span className="text-xs text-slate-400 block">Mot de passe temporaire</span>
                  <span className="text-xs font-mono text-slate-700 tracking-wider">{result.tempPassword}</span>
                </div>
                <button
                  onClick={() => { if (result.tempPassword) copyText(result.tempPassword, "password") }}
                  className="p-1 text-amber-500 hover:text-amber-700"
                >
                  {copied === "password"
                    ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                    : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-xs text-amber-700">
                L'utilisateur devra changer son mot de passe à la première connexion.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => { router.refresh(); handleOpenChange(false) }}
            >
              Terminer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="lu-email">Email de l'utilisateur</Label>
              <Input
                id="lu-email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={form.userEmail}
                onChange={(e) => { setForm((p) => ({ ...p, userEmail: e.target.value })) }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lu-name">
                Nom complet{" "}
                <span className="text-slate-400 font-normal text-xs">(si nouveau compte)</span>
              </Label>
              <Input
                id="lu-name"
                type="text"
                placeholder="Jean Dupont"
                value={form.userName}
                onChange={(e) => { setForm((p) => ({ ...p, userName: e.target.value })) }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) => { setForm((p) => ({ ...p, role: v })) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_admin">Administrateur client</SelectItem>
                  <SelectItem value="workshop_manager">Chef d'atelier</SelectItem>
                  <SelectItem value="technician">Technicien</SelectItem>
                  <SelectItem value="reader">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-slate-400">
              Si l'utilisateur n'a pas encore de compte, un compte sera créé automatiquement avec un mot de passe temporaire.
            </p>

            <div className="flex justify-end gap-2 pt-1">
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
                    Traitement...
                  </>
                ) : (
                  "Lier l'utilisateur"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
