import Link from "next/link"
import { ArrowLeft, ScrollText } from "lucide-react"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"

const ACTION_LABELS: Record<string, string> = {
  "tenant.created":            "Tenant créé",
  "tenant.activated":          "Tenant activé",
  "tenant.deactivated":        "Tenant désactivé",
  "license.updated":           "Licence mise à jour",
  "module.activated":          "Module activé",
  "module.deactivated":        "Module désactivé",
  "user.linked":               "Utilisateur lié",
  "user.unlinked":             "Utilisateur délié",
  "site.created":              "Site créé",
  "super_admin.sign_in":       "Connexion super-admin",
}

// Récupérer les dernières actions d'audit (toutes les tables, toutes les organisations)
async function getAdminLogs(limit = 100) {
  // AuditLog est une table multi-tenant — pour le super-admin on lit sans RLS (prisma direct)
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      tenantId: true,
      userId: true,
      action: true,
      entityType: true,
      entityId: true,
      entityLabel: true,
      createdAt: true,
    },
  })
}

// Récupérer les noms des tenants pour affichage
async function getTenantNames(tenantIds: string[]) {
  if (!tenantIds.length) return new Map<string, string>()
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  })
  return new Map(tenants.map((t) => [t.id, t.name]))
}

export default async function AdminLogsPage() {
  await requireSuperAdmin()

  const logs = await getAdminLogs(200)
  const tenantIds = [...new Set(logs.map((l) => l.tenantId))]
  const tenantNames = await getTenantNames(tenantIds)

  const groupedByAction = new Map<string, number>()
  for (const log of logs) {
    groupedByAction.set(log.action, (groupedByAction.get(log.action) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-slate-400" />
          <h1 className="text-xl font-bold text-white">Logs d&apos;activité</h1>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
            {logs.length} entrées
          </span>
        </div>
      </div>

      {/* Top actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...groupedByAction.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([action, count]) => (
            <div key={action} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 truncate">{ACTION_LABELS[action] ?? action}</p>
              <p className="text-2xl font-bold text-white mt-1">{count}</p>
            </div>
          ))}
      </div>

      {/* Table logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Organisation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Action</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Entité</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit", month: "2-digit", year: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${log.tenantId}`}
                      className="text-slate-300 hover:text-white text-xs"
                    >
                      {tenantNames.get(log.tenantId) ?? log.tenantId.slice(0, 8) + "…"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    <span className="text-slate-500">{log.entityType}</span>
                    {log.entityLabel && (
                      <span className="ml-1.5 text-slate-300">{log.entityLabel}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Aucune activité enregistrée pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
