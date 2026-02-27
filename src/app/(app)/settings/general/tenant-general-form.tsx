"use client"

import { useState } from "react"
import { actionUpdateTenantSettings } from "@/server/actions/settings/action-update-tenant-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  tenantId: string
  currentName: string
}

export function TenantGeneralForm({ currentName }: Props) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const isDirty = name.trim() !== currentName

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty || saving) return

    setSaving(true)
    setMessage(null)

    const result = await actionUpdateTenantSettings({ name: name.trim() })

    setSaving(false)
    if (result.success) {
      setMessage({ type: "success", text: "Nom mis à jour avec succès." })
    } else {
      setMessage({ type: "error", text: result.error ?? "Une erreur est survenue." })
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tenant-name">Nom de l&apos;organisation</Label>
        <Input
          id="tenant-name"
          value={name}
          onChange={(e) => { setName(e.target.value) }}
          maxLength={100}
          placeholder="Mon entreprise"
        />
        <p className="text-xs text-slate-400">
          Ce nom apparaît dans l&apos;interface et les documents générés.
        </p>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <Button type="submit" size="sm" disabled={!isDirty || saving}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  )
}
