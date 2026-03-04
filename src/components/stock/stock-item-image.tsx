"use client"

import { useRef, useState } from "react"
import { Package, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Props = {
  stockItemId: string
  imageUrl: string | null
  canEdit: boolean
}

export function StockItemImage({ stockItemId, imageUrl: initialUrl, canEdit }: Props) {
  const [imageUrl, setImageUrl] = useState(initialUrl)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch(`/api/stock/${stockItemId}/image`, { method: "POST", body })
      if (!res.ok) {
        const text = await res.text()
        toast.error(text || "Erreur lors de l'upload")
        return
      }
      const data = await res.json()
      setImageUrl(data.imageUrl)
      toast.success("Image mise à jour")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${stockItemId}/image`, { method: "DELETE" })
      if (!res.ok) { toast.error("Erreur lors de la suppression"); return }
      setImageUrl(null)
      toast.success("Image supprimée")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Aperçu */}
      <div className="w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Photo article"
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-8 h-8 text-slate-300" />
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="text-xs h-7 px-2"
          >
            <Upload className="w-3 h-3 mr-1" />
            {imageUrl ? "Changer" : "Ajouter"}
          </Button>
          {imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="text-xs h-7 px-2 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
