"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { actionAddInterventionNote } from "@/server/actions/interventions/action-add-intervention-note"
import { toast } from "sonner"

export function InterventionNoteForm({ interventionId }: { interventionId: string }) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const result = await actionAddInterventionNote({ interventionId, content })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setContent("")
    toast.success("Note ajoutée")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ajouter une note, observation, action réalisée..."
        rows={3}
        maxLength={5000}
        className="text-sm"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading || !content.trim()}>
          {loading ? "Envoi..." : "Ajouter la note"}
        </Button>
      </div>
    </form>
  )
}
