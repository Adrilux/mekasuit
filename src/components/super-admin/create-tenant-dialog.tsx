"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Check, Copy, CheckCheck } from "lucide-react"
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
import { actionCreateTenant } from "@/server/actions/super-admin/action-create-tenant"
import { ModuleName } from "@prisma/client"

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminMode = "none" | "existing" | "generate"

type FormState = {
  // Étape 1 — Entreprise
  name: string
  slug: string
  maxSites: string
  maxUsers: string
  billingPeriod: string
  renewsAt: string
  // Étape 2 — Modules & premier site
  activeModules: ModuleName[]
  firstSiteName: string
  // Étape 3 — Admin
  adminMode: AdminMode
  adminEmail: string
  adminName: string
}

type SuccessResult = {
  tenantName: string
  tempPassword?: string
  adminEmail?: string
}

const defaultForm: FormState = {
  name: "",
  slug: "",
  maxSites: "1",
  maxUsers: "5",
  billingPeriod: "monthly",
  renewsAt: "",
  activeModules: [ModuleName.GMAO],
  firstSiteName: "",
  adminMode: "none",
  adminEmail: "",
  adminName: "",
}

const MODULE_INFO: Record<ModuleName, { label: string; description: string; required?: boolean }> = {
  GMAO: { label: "GMAO (noyau)", description: "Machines et interventions — toujours actif", required: true },
  STOCK_MANAGEMENT: { label: "Gestion de stock", description: "Pièces détachées, mouvements, alertes rupture" },
  AI_ASSISTANT: { label: "Assistant IA", description: "Rédaction assistée des notes d'intervention" },
  ADVANCED_REPORTS: { label: "Rapports avancés", description: "MTBF, charge technicien, valorisation stock" },
  INTER_SITE_TRANSFERS: { label: "Transferts inter-sites", description: "Stock partagé entre plusieurs sites" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i < current
                ? "bg-blue-600 text-white"
                : i === current
                ? "bg-blue-100 text-blue-700 border-2 border-blue-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 w-8 ${i < current ? "bg-blue-600" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-500 font-medium">
        Étape {current + 1} / {total}
      </span>
    </div>
  )
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
      title="Copier"
    >
      {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export function CreateTenantDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [slugManual, setSlugManual] = useState(false)
  const [result, setResult] = useState<SuccessResult | null>(null)

  const TOTAL_STEPS = 3

  function reset() {
    setForm(defaultForm)
    setSlugManual(false)
    setStep(0)
    setResult(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    setOpen(next)
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManual ? prev.slug : slugify(value),
    }))
  }

  function toggleModule(mod: ModuleName) {
    if (mod === ModuleName.GMAO) return
    setForm((prev) => ({
      ...prev,
      activeModules: prev.activeModules.includes(mod)
        ? prev.activeModules.filter((m) => m !== mod)
        : [...prev.activeModules, mod],
    }))
  }

  async function handleSubmit() {
    setLoading(true)

    const res = await actionCreateTenant({
      name: form.name,
      slug: form.slug,
      maxSites: form.maxSites,
      maxUsers: form.maxUsers,
      billingPeriod: form.billingPeriod,
      renewsAt: form.renewsAt,
      activeModules: form.activeModules,
      firstSiteName: form.firstSiteName || undefined,
      adminMode: form.adminMode,
      adminEmail: form.adminEmail || undefined,
      adminName: form.adminName || undefined,
    })

    setLoading(false)

    if (!res.success) {
      toast.error(res.error)
      return
    }

    setResult({
      tenantName: form.name,
      tempPassword: res.data.tempPassword,
      adminEmail: res.data.adminEmail,
    })
    router.refresh()
  }

  // ── Step 1 — Entreprise ────────────────────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ct-name">Nom de l'entreprise *</Label>
          <Input
            id="ct-name"
            placeholder="Acme Industries"
            value={form.name}
            onChange={(e) => { handleNameChange(e.target.value) }}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ct-slug">Identifiant unique (slug) *</Label>
          <Input
            id="ct-slug"
            placeholder="acme-industries"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true)
              setForm((p) => ({ ...p, slug: e.target.value }))
            }}
            pattern="^[a-z0-9-]+$"
          />
          <p className="text-xs text-slate-400">Lettres minuscules, chiffres, tirets — généré automatiquement</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ct-max-sites">Sites max *</Label>
            <Input
              id="ct-max-sites"
              type="number"
              min={1}
              max={100}
              value={form.maxSites}
              onChange={(e) => { setForm((p) => ({ ...p, maxSites: e.target.value })) }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-max-users">Utilisateurs max *</Label>
            <Input
              id="ct-max-users"
              type="number"
              min={1}
              max={1000}
              value={form.maxUsers}
              onChange={(e) => { setForm((p) => ({ ...p, maxUsers: e.target.value })) }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Facturation *</Label>
            <Select
              value={form.billingPeriod}
              onValueChange={(v) => { setForm((p) => ({ ...p, billingPeriod: v })) }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuelle</SelectItem>
                <SelectItem value="yearly">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-renews">Date de renouvellement *</Label>
            <Input
              id="ct-renews"
              type="date"
              value={form.renewsAt}
              onChange={(e) => { setForm((p) => ({ ...p, renewsAt: e.target.value })) }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2 — Modules & premier site ───────────────────────────────────────
  function renderStep2() {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Modules à activer</p>
          <div className="space-y-2">
            {Object.entries(MODULE_INFO).map(([mod, info]) => {
              const m = mod as ModuleName
              const active = form.activeModules.includes(m)
              const required = info.required
              return (
                <button
                  key={m}
                  type="button"
                  disabled={required}
                  onClick={() => { toggleModule(m) }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    active
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  } ${required ? "cursor-default opacity-80" : "cursor-pointer"}`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                      active ? "bg-blue-600 border-blue-600" : "border-slate-300"
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{info.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{info.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <Label htmlFor="ct-site">Premier site (optionnel)</Label>
          <Input
            id="ct-site"
            placeholder="Atelier principal — Paris"
            value={form.firstSiteName}
            onChange={(e) => { setForm((p) => ({ ...p, firstSiteName: e.target.value })) }}
          />
          <p className="text-xs text-slate-400">Le client pourra en ajouter d'autres depuis son interface</p>
        </div>
      </div>
    )
  }

  // ── Step 3 — Compte admin ─────────────────────────────────────────────────
  function renderStep3() {
    const modes: { value: AdminMode; label: string; description: string }[] = [
      {
        value: "none",
        label: "Pas maintenant",
        description: "Je lierai un utilisateur plus tard depuis la page du tenant",
      },
      {
        value: "existing",
        label: "Compte existant",
        description: "L'utilisateur a déjà un compte sur la plateforme",
      },
      {
        value: "generate",
        label: "Générer un compte",
        description: "On crée le compte et génère un mot de passe temporaire à communiquer",
      },
    ]

    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-700">Administrateur client</p>
        <div className="space-y-2">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => { setForm((p) => ({ ...p, adminMode: m.value })) }}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                form.adminMode === m.value
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`mt-1 w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center ${
                  form.adminMode === m.value ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {form.adminMode === m.value && (
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{m.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
              </div>
            </button>
          ))}
        </div>

        {form.adminMode !== "none" && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ct-admin-email">Email de l'administrateur *</Label>
              <Input
                id="ct-admin-email"
                type="email"
                placeholder="admin@acme-industries.fr"
                value={form.adminEmail}
                onChange={(e) => { setForm((p) => ({ ...p, adminEmail: e.target.value })) }}
              />
            </div>
            {form.adminMode === "generate" && (
              <div className="space-y-1.5">
                <Label htmlFor="ct-admin-name">Nom complet *</Label>
                <Input
                  id="ct-admin-name"
                  placeholder="Jean Dupont"
                  value={form.adminName}
                  onChange={(e) => { setForm((p) => ({ ...p, adminName: e.target.value })) }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Résultat ───────────────────────────────────────────────────────────────
  function renderResult() {
    if (!result) return null
    return (
      <div className="text-center py-4 space-y-6">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">Tenant créé avec succès</h3>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-medium text-slate-700">{result.tenantName}</span> est maintenant actif
          </p>
        </div>

        {result.tempPassword && result.adminEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
            <p className="text-sm font-semibold text-amber-900">Identifiants générés — à communiquer au client</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-mono font-medium text-slate-800">{result.adminEmail}</p>
                </div>
                <CopyButton value={result.adminEmail} />
              </div>
              <div className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-slate-500">Mot de passe temporaire</p>
                  <p className="text-sm font-mono font-medium text-slate-800 tracking-widest">{result.tempPassword}</p>
                </div>
                <CopyButton value={result.tempPassword} />
              </div>
            </div>
            <p className="text-xs text-amber-700">L'administrateur devra changer son mot de passe à la première connexion</p>
          </div>
        )}

        <Button className="w-full" onClick={() => { handleOpenChange(false) }}>
          Fermer
        </Button>
      </div>
    )
  }

  // ── Validation par étape ──────────────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 0) {
      return (
        form.name.trim().length >= 2 &&
        /^[a-z0-9-]{2,50}$/.test(form.slug) &&
        !!form.renewsAt
      )
    }
    if (step === 2) {
      if (form.adminMode === "existing") return !!form.adminEmail.trim()
      if (form.adminMode === "generate") return !!form.adminEmail.trim() && !!form.adminName.trim()
    }
    return true
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const STEP_TITLES = ["Entreprise & licence", "Modules & configuration", "Compte administrateur"]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Nouveau tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {result ? "Tenant créé" : STEP_TITLES[step]}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          renderResult()
        ) : (
          <div className="mt-2">
            <StepIndicator current={step} total={TOTAL_STEPS} />

            {step === 0 && renderStep1()}
            {step === 1 && renderStep2()}
            {step === 2 && renderStep3()}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (step === 0) {
                    handleOpenChange(false)
                  } else {
                    setStep((s) => s - 1)
                  }
                }}
                disabled={loading}
              >
                {step === 0 ? "Annuler" : "Précédent"}
              </Button>

              {step < TOTAL_STEPS - 1 ? (
                <Button
                  type="button"
                  onClick={() => { setStep((s) => s + 1) }}
                  disabled={!canProceed()}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    "Créer le tenant"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
