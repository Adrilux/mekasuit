"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { actionDeleteCustomReport } from "@/server/actions/reports/action-delete-custom-report"

export function CustomReportDeleteButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }

    startTransition(async () => {
      await actionDeleteCustomReport({ id: reportId })
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      disabled={isPending}
      className={confirming ? "border-red-300 text-red-600 hover:bg-red-50" : ""}
    >
      <Trash2 className="w-4 h-4 mr-1.5" />
      {confirming ? "Confirmer ?" : "Supprimer"}
    </Button>
  )
}
