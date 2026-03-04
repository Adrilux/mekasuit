"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/feedback/confirm-dialog"
import { actionUpdateInterventionStatus } from "@/server/actions/interventions/action-update-intervention-status"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { InterventionStatus } from "@prisma/client"

type StatusAction = {
  label: string
  newStatus: InterventionStatus
  variant: "default" | "outline" | "destructive"
  requireConfirm?: boolean
  confirmTitle?: string
  confirmDescription?: string
  permission: "intervention:update" | "intervention:close" | "intervention:cancel"
}

const ACTIONS_BY_STATUS: Record<string, StatusAction[]> = {
  OPEN: [
    {
      label: "Démarrer",
      newStatus: "IN_PROGRESS",
      variant: "default",
      permission: "intervention:update",
    },
    {
      label: "Annuler",
      newStatus: "CANCELLED",
      variant: "destructive",
      requireConfirm: true,
      confirmTitle: "Annuler l'intervention ?",
      confirmDescription: "L'intervention sera marquée comme annulée. Cette action est irréversible.",
      permission: "intervention:cancel",
    },
  ],
  IN_PROGRESS: [
    {
      label: "Attente pièce",
      newStatus: "PENDING_PARTS",
      variant: "outline",
      permission: "intervention:update",
    },
    {
      label: "Clôturer",
      newStatus: "CLOSED",
      variant: "default",
      permission: "intervention:close",
    },
    {
      label: "Annuler",
      newStatus: "CANCELLED",
      variant: "destructive",
      requireConfirm: true,
      confirmTitle: "Annuler l'intervention ?",
      confirmDescription: "L'intervention sera marquée comme annulée. Cette action est irréversible.",
      permission: "intervention:cancel",
    },
  ],
  PENDING_PARTS: [
    {
      label: "Reprendre",
      newStatus: "IN_PROGRESS",
      variant: "default",
      permission: "intervention:update",
    },
    {
      label: "Clôturer",
      newStatus: "CLOSED",
      variant: "outline",
      permission: "intervention:close",
    },
    {
      label: "Annuler",
      newStatus: "CANCELLED",
      variant: "destructive",
      requireConfirm: true,
      confirmTitle: "Annuler l'intervention ?",
      confirmDescription: "L'intervention sera marquée comme annulée. Cette action est irréversible.",
      permission: "intervention:cancel",
    },
  ],
}

export function InterventionStatusActions({
  interventionId,
  currentStatus,
  userPermissions,
}: {
  interventionId: string
  currentStatus: InterventionStatus
  userPermissions: string[]
}) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null)
  const [loading, setLoading] = useState(false)
  // Close dialog state
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState("")
  const [diagnosis, setDiagnosis] = useState("")

  const availableActions = (ACTIONS_BY_STATUS[currentStatus] ?? []).filter((action) =>
    userPermissions.includes(action.permission)
  )

  if (availableActions.length === 0) return null

  async function executeAction(
    action: StatusAction,
    extra?: { actualDurationMinutes?: number; closingDiagnosis?: string },
  ) {
    setLoading(true)
    const result = await actionUpdateInterventionStatus({
      interventionId,
      newStatus: action.newStatus,
      ...extra,
    })
    setLoading(false)
    setPendingAction(null)
    setCloseDialogOpen(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Statut mis à jour")
    router.refresh()
  }

  function handleClick(action: StatusAction) {
    if (action.newStatus === "CLOSED") {
      setCloseDialogOpen(true)
      setPendingAction(action)
    } else if (action.requireConfirm) {
      setPendingAction(action)
    } else {
      executeAction(action)
    }
  }

  function handleCloseConfirm() {
    if (!pendingAction) return
    executeAction(pendingAction, {
      actualDurationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      closingDiagnosis: diagnosis || undefined,
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {availableActions.map((action) => (
          <Button
            key={action.newStatus}
            variant={action.variant}
            size="sm"
            disabled={loading}
            onClick={() => handleClick(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Dialogue clôture enrichi */}
      <Dialog open={closeDialogOpen} onOpenChange={(o) => { if (!o) { setCloseDialogOpen(false); setPendingAction(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clôturer l'intervention</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              Confirmez la clôture. Vous pouvez renseigner la durée réelle et un diagnostic.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Durée réelle (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="ex: 90"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">Diagnostic / Cause racine</Label>
              <Textarea
                id="diagnosis"
                rows={3}
                placeholder="Décrivez la cause du problème et la solution apportée…"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCloseDialogOpen(false); setPendingAction(null) }}>
              Annuler
            </Button>
            <Button onClick={handleCloseConfirm} disabled={loading}>
              {loading ? "Clôture…" : "Confirmer la clôture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue confirmation pour les autres actions */}
      {pendingAction && pendingAction.newStatus !== "CLOSED" && (
        <ConfirmDialog
          open={!!pendingAction}
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={pendingAction.confirmTitle!}
          description={pendingAction.confirmDescription!}
          confirmLabel={pendingAction.label}
          variant={pendingAction.variant === "destructive" ? "destructive" : "default"}
          onConfirm={() => executeAction(pendingAction)}
        />
      )}
    </>
  )
}
