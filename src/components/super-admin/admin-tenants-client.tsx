"use client"

import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { TenantCard } from "./tenant-card"
import type { TenantWithDetails } from "@/server/queries/super-admin/query-get-all-tenants"

export function AdminTenantsClient({ tenants }: { tenants: TenantWithDetails[] }) {
  const [search, setSearch] = useState("")

  const q = search.toLowerCase().trim()
  const filtered = q
    ? tenants.filter(
        (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
      )
    : tenants

  const active = filtered.filter((t) => t.isActive)
  const inactive = filtered.filter((t) => !t.isActive)

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher par nom ou slug..."
          value={search}
          onChange={(e) => { setSearch(e.target.value) }}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-500 py-4 text-center">
          Aucun tenant correspondant à &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Tenants actifs */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Actifs ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/${tenant.id}`}
                className="block hover:opacity-90 transition-opacity"
              >
                <TenantCard tenant={tenant} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tenants inactifs */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            Désactivés ({inactive.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {inactive.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/${tenant.id}`}
                className="block"
              >
                <TenantCard tenant={tenant} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
