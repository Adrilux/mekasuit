"use client"

import { useState, useRef } from "react"
import { Paperclip, Trash2, Upload, FileText, ImageIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Attachment = {
  id: string
  fileName: string
  storedName: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

type Props = {
  interventionId: string
  attachments: Attachment[]
  canEdit: boolean
}

export function InterventionAttachments({ interventionId, attachments: initial, canEdit }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`/api/interventions/${interventionId}/attachments`, {
      method: "POST",
      body: formData,
    })

    setUploading(false)
    e.target.value = ""

    if (!res.ok) {
      const text = await res.text()
      toast.error(text || "Erreur lors de l'upload")
      return
    }

    const { attachment } = await res.json()
    setAttachments((prev) => [attachment, ...prev])
    toast.success("Fichier ajouté")
  }

  async function handleDelete(attachmentId: string, fileName: string) {
    if (!confirm(`Supprimer "${fileName}" ?`)) return

    const res = await fetch(`/api/interventions/${interventionId}/attachments/${attachmentId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      toast.error("Impossible de supprimer ce fichier")
      return
    }

    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    toast.success("Fichier supprimé")
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-400" />
          Pièces jointes
          {attachments.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({attachments.length})</span>
          )}
        </h2>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              {uploading ? "Upload…" : "Ajouter"}
            </Button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">
          Aucune pièce jointe — photos avant/après, rapports, PDF…
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {attachments.map((a) => {
            const isImage = a.mimeType.startsWith("image/")
            const url = `/uploads/interventions/${interventionId}/${a.storedName}`
            const sizeKb = Math.round(a.sizeBytes / 1024)

            return (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                {isImage ? (
                  <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {sizeKb} Ko · {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(a.id, a.fileName)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
