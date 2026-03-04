import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { MODULE_METADATA, ModuleName } from "@/lib/modules/module-definitions"
import { Package2, CheckCircle2, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function SettingsModulesPage() {
  const session = await requireSession()
  assertCan(session, "module:activate")

  // Charger tous les modules du tenant (pas RLS-scopé, c'est une table globale)
  const tenantModules = await prisma.tenantModule.findMany({
    where: { tenantId: session.tenantId },
    select: { module: true, isActive: true, activatedAt: true },
  })

  const moduleMap = new Map(tenantModules.map((m) => [m.module, m]))

  const allModules = Object.entries(MODULE_METADATA) as [ModuleName, typeof MODULE_METADATA[ModuleName]][]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Package2 className="w-5 h-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Modules</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Les modules sont activés par votre prestataire. Contactez-nous pour en activer de nouveaux.
      </p>

      <div className="space-y-3">
        {allModules.map(([key, meta]) => {
          const record = moduleMap.get(key)
          const isActive = meta.alwaysActive || (record?.isActive ?? false)
          const activatedAt = record?.activatedAt

          return (
            <div
              key={key}
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                isActive
                  ? "bg-white border-slate-200"
                  : "bg-slate-50 border-slate-200 opacity-70"
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${isActive ? "text-green-500" : "text-slate-300"}`}>
                {isActive ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{meta.label}</span>
                  {meta.alwaysActive && (
                    <Badge variant="outline" className="text-xs">Inclus</Badge>
                  )}
                  {!meta.alwaysActive && isActive && (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Actif</Badge>
                  )}
                  {!isActive && (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{meta.description}</p>
                {meta.requires.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Requiert : {meta.requires.map((r) => MODULE_METADATA[r].label).join(", ")}
                  </p>
                )}
                {activatedAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Activé le {new Date(activatedAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              {!isActive && (
                <div className="shrink-0">
                  <a
                    href="mailto:contact@gmao-saas.fr?subject=Activation module"
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Contacter →
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
