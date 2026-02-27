"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { actionRegisterTenant } from "@/server/actions/auth/action-register-tenant"

// Formulaire d'inscription d'un nouveau tenant (entreprise + compte admin)

export function RegisterTenantForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)

    const result = await actionRegisterTenant({
      companyName: form.get("companyName") as string,
      adminName: form.get("adminName") as string,
      adminEmail: form.get("adminEmail") as string,
      adminPassword: form.get("adminPassword") as string,
    })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
          Nom de l'entreprise
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="adminName" className="block text-sm font-medium text-slate-700 mb-1">
          Votre nom
        </label>
        <input
          id="adminName"
          name="adminName"
          type="text"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-700 mb-1">
          Mot de passe
        </label>
        <input
          id="adminPassword"
          name="adminPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Création en cours..." : "Créer mon compte"}
      </button>
    </form>
  )
}
