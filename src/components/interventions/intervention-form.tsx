"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionCreateIntervention } from "@/server/actions/interventions/action-create-intervention"
import { actionUpdateIntervention } from "@/server/actions/interventions/action-update-intervention"
import { actionGenerateInterventionDescription } from "@/server/actions/ai/action-generate-intervention-description"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import type { SiteListItem } from "@/server/queries/sites/query-get-sites-by-tenant"
import type { InterventionType, InterventionPriority, RecurrenceType } from "@prisma/client"

const TYPE_OPTIONS: { value: InterventionType; label: string }[] = [
  { value: "CORRECTIVE", label: "Corrective (panne)" },
  { value: "PREVENTIVE", label: "Préventive (planifiée)" },
  { value: "PREDICTIVE", label: "Prédictive" },
  { value: "INSPECTION", label: "Inspection / contrôle" },
]

const PRIORITY_OPTIONS: { value: InterventionPriority; label: string }[] = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Normale" },
  { value: "HIGH", label: "Urgente" },
  { value: "CRITICAL", label: "Critique — arrêt de production" },
]

const RECURRENCE_OPTIONS: { value: RecurrenceType | "NONE"; label: string }[] = [
  { value: "NONE", label: "Aucune récurrence" },
  { value: "WEEKLY", label: "Hebdomadaire (7 jours)" },
  { value: "BIWEEKLY", label: "Bimensuelle (14 jours)" },
  { value: "MONTHLY", label: "Mensuelle (30 jours)" },
  { value: "QUARTERLY", label: "Trimestrielle (90 jours)" },
  { value: "SEMIANNUAL", label: "Semestrielle (180 jours)" },
  { value: "ANNUAL", label: "Annuelle (365 jours)" },
  { value: "CUSTOM", label: "Personnalisée" },
]

type InterventionFormProps = {
  sites: Pick<SiteListItem, "id" | "name">[]
  defaultSiteId?: string
  defaultMachineId?: string
  defaultType?: InterventionType
  aiEnabled?: boolean
  // Si intervention est fourni, c'est un formulaire d'édition
  intervention?: {
    id: string
    siteId: string
    title: string
    description: string | null
    type: InterventionType
    priority: InterventionPriority
    assignedUserId: string | null
    scheduledAt: Date | null
    recurrenceType: RecurrenceType | null
    recurrenceIntervalDays: number | null
    recurrenceEndsAt: Date | null
  }
}

export function InterventionForm({ sites, defaultSiteId, defaultMachineId, defaultType, intervention, aiEnabled = false }: InterventionFormProps) {
  const router = useRouter()
  const isEdit = !!intervention
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<InterventionType>(intervention?.type ?? defaultType ?? "CORRECTIVE")
  const [selectedRecurrence, setSelectedRecurrence] = useState<RecurrenceType | "NONE">(
    intervention?.recurrenceType ?? "NONE"
  )
  const [description, setDescription] = useState(intervention?.description ?? "")
  const [titleValue, setTitleValue] = useState(intervention?.title ?? "")
  const [aiLoading, setAiLoading] = useState(false)

  const isPreventive = selectedType === "PREVENTIVE"
  const isCustomRecurrence = selectedRecurrence === "CUSTOM"

  async function handleGenerateDescription() {
    if (!titleValue.trim() || aiLoading) return
    setAiLoading(true)
    const result = await actionGenerateInterventionDescription({
      title: titleValue,
      machineId: defaultMachineId,
      type: selectedType,
    })
    setAiLoading(false)
    if ("data" in result && result.data) {
      setDescription(result.data as string)
      toast.success("Description générée par IA")
    } else {
      toast.error("error" in result ? (result as { error: string }).error : "Erreur lors de la génération")
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)

    const recurrenceType = isPreventive && selectedRecurrence !== "NONE" ? selectedRecurrence : undefined
    const recurrenceIntervalDays =
      isPreventive && selectedRecurrence === "CUSTOM"
        ? form.get("recurrenceIntervalDays") as string || undefined
        : undefined

    const payload = {
      siteId: form.get("siteId") as string,
      machineId: form.get("machineId") as string || undefined,
      title: titleValue,
      description: description || undefined,
      type: selectedType,
      priority: form.get("priority") as InterventionPriority,
      scheduledAt: form.get("scheduledAt") as string || undefined,
      recurrenceType,
      recurrenceIntervalDays,
      recurrenceEndsAt: isPreventive ? (form.get("recurrenceEndsAt") as string || undefined) : undefined,
    }

    const result = isEdit
      ? await actionUpdateIntervention({ interventionId: intervention.id, ...payload })
      : await actionCreateIntervention(payload)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Intervention modifiée" : "Intervention créée")
    router.push(isEdit ? `/interventions/${intervention.id}` : "/interventions")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      <div>
        <Label htmlFor="siteId">Site *</Label>
        {isEdit ? (
          <input type="hidden" name="siteId" value={intervention.siteId} />
        ) : (
          <Select name="siteId" defaultValue={defaultSiteId ?? sites[0]?.id} required>
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

      {/* machineId caché (pré-rempli depuis URL ou vide) */}
      <input type="hidden" name="machineId" value={defaultMachineId ?? ""} />

      <div>
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          className="mt-1"
          placeholder="Ex: Remplacement courroie presse P1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="description">Description</Label>
          {aiEnabled && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => { void handleGenerateDescription() }}
              disabled={aiLoading || !titleValue.trim()}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {aiLoading ? "Génération…" : "Générer avec IA ✨"}
            </Button>
          )}
        </div>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-0"
          placeholder="Symptômes observés, contexte..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type *</Label>
          <Select
            name="type"
            value={selectedType}
            onValueChange={(v) => setSelectedType(v as InterventionType)}
            required
          >
            <SelectTrigger id="type" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priorité *</Label>
          <Select name="priority" defaultValue={intervention?.priority ?? "MEDIUM"} required>
            <SelectTrigger id="priority" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="scheduledAt">Date planifiée (optionnel)</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={
            intervention?.scheduledAt
              ? new Date(intervention.scheduledAt).toISOString().slice(0, 16)
              : ""
          }
          className="mt-1"
        />
      </div>

      {/* Section récurrence — uniquement pour les interventions préventives */}
      {isPreventive && (
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
          <p className="text-sm font-medium text-slate-700">Récurrence</p>

          <div>
            <Label htmlFor="recurrenceType">Fréquence</Label>
            <Select
              value={selectedRecurrence}
              onValueChange={(v) => setSelectedRecurrence(v as RecurrenceType | "NONE")}
            >
              <SelectTrigger id="recurrenceType" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRecurrence !== "NONE" && (
              <p className="text-xs text-slate-500 mt-1">
                À la clôture, une nouvelle intervention sera automatiquement créée avec la prochaine date planifiée.
              </p>
            )}
          </div>

          {isCustomRecurrence && (
            <div>
              <Label htmlFor="recurrenceIntervalDays">Intervalle (jours) *</Label>
              <Input
                id="recurrenceIntervalDays"
                name="recurrenceIntervalDays"
                type="number"
                min={1}
                max={3650}
                required
                defaultValue={intervention?.recurrenceIntervalDays ?? ""}
                className="mt-1"
                placeholder="Ex: 45"
              />
            </div>
          )}

          {selectedRecurrence !== "NONE" && (
            <div>
              <Label htmlFor="recurrenceEndsAt">Fin de la série (optionnel)</Label>
              <Input
                id="recurrenceEndsAt"
                name="recurrenceEndsAt"
                type="date"
                defaultValue={
                  intervention?.recurrenceEndsAt
                    ? new Date(intervention.recurrenceEndsAt).toISOString().slice(0, 10)
                    : ""
                }
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Aucune nouvelle occurrence ne sera générée après cette date.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer l'intervention"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
