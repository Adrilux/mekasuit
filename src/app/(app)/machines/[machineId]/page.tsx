import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { Pencil, ClipboardList, Package, Activity, QrCode } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { queryGetMachineDetail } from "@/server/queries/machines/query-get-machine-detail"
import { queryGetMachineStats } from "@/server/queries/machines/query-get-machine-stats"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { MachineStatusBadge } from "@/components/machines/machine-status-badge"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"
import { InterventionPriorityBadge } from "@/components/interventions/intervention-priority-badge"
import { MachineArchiveButton } from "@/components/machines/machine-archive-button"
import { MachineQrCode } from "@/components/machines/machine-qr-code"
import { can } from "@/lib/permissions/permission-matrix"

export default async function MachineDetailPage({ params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params
  const session = await requireSession()
  const [machine, stockModuleActive] = await Promise.all([
    queryGetMachineDetail(session, machineId),
    isModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT),
  ])

  if (!machine) notFound()

  assertSiteAccess(session.role, session.siteIds, machine.siteId)

  const stats = await queryGetMachineStats(session, machineId)

  const canEdit = can(session.role, "machine:update")
  const canArchive = can(session.role, "machine:archive")
  const canCreateIntervention = can(session.role, "intervention:create")
  const canEditStock = can(session.role, "stock:update")

  // Determine base URL for QR code
  const hdrs = await headers()
  const host = hdrs.get("host") ?? "localhost:3000"
  const proto = hdrs.get("x-forwarded-proto") ?? "http"
  const baseUrl = `${proto}://${host}`

  return (
    <div className="max-w-3xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{machine.name}</h1>
            <MachineStatusBadge status={machine.status} />
          </div>
          <p className="text-sm text-slate-500">{machine.site.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && machine.status !== "DECOMMISSIONED" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/machines/${machine.id}/edit`}>
                <Pencil className="w-4 h-4 mr-1" />
                Modifier
              </Link>
            </Button>
          )}
          {canArchive && machine.status !== "DECOMMISSIONED" && (
            <MachineArchiveButton machineId={machine.id} machineName={machine.name} />
          )}
        </div>
      </div>

      {/* Infos techniques */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Informations techniques</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Catégorie</dt>
            <dd className="font-medium text-slate-900">{machine.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">N° de série</dt>
            <dd className="font-medium text-slate-900">{machine.serialNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fabricant</dt>
            <dd className="font-medium text-slate-900">{machine.manufacturer ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Modèle</dt>
            <dd className="font-medium text-slate-900">{machine.model ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Mise en service</dt>
            <dd className="font-medium text-slate-900">
              {machine.installedAt
                ? new Date(machine.installedAt).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Stats machine */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          Statistiques de maintenance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="Interventions totales"
            value={stats.totalInterventions.toString()}
          />
          <StatCard
            label="En cours / ouvertes"
            value={stats.openInterventions.toString()}
            highlight={stats.openInterventions > 0 ? "amber" : undefined}
          />
          <StatCard
            label="Pannes clôturées"
            value={stats.closedCorrectiveCount.toString()}
          />
          <StatCard
            label="MTBF"
            value={
              stats.mtbfHours === null
                ? "—"
                : stats.mtbfHours >= 720
                ? `${Math.round(stats.mtbfHours / 24)}j`
                : `${stats.mtbfHours}h`
            }
            sub={stats.mtbfHours !== null ? "temps moyen entre pannes" : "données insuffisantes"}
            highlight={
              stats.mtbfHours === null
                ? undefined
                : stats.mtbfHours < 168
                ? "red"
                : stats.mtbfHours < 720
                ? "amber"
                : "green"
            }
          />
          <StatCard
            label="Coût pièces total"
            value={
              stats.totalCostCents === 0
                ? "—"
                : `${(stats.totalCostCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
            }
          />
          <StatCard
            label="Dernière intervention"
            value={
              stats.lastInterventionAt
                ? new Date(stats.lastInterventionAt).toLocaleDateString("fr-FR")
                : "—"
            }
          />
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">QR Code terrain</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={`/machines/${machine.id}/qr-code`}>
              <QrCode className="w-4 h-4 mr-1" />
              Plein écran
            </Link>
          </Button>
        </div>
        <MachineQrCode slug={machine.qrCodeSlug} machineName={machine.name} baseUrl={baseUrl} />
      </div>

      {/* Pièces associées à cette machine */}
      {stockModuleActive && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              Pièces associées
              {machine.stockItems.length > 0 && (
                <span className="text-xs font-normal text-slate-400">({machine.stockItems.length})</span>
              )}
            </h2>
            {canEditStock && (
              <Link
                href={`/stock?machineId=${machine.id}&siteId=${machine.siteId}`}
                className="text-xs text-blue-600 hover:underline"
              >
                Gérer depuis le stock
              </Link>
            )}
          </div>
          {machine.stockItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">
              Aucune pièce associée — liez des articles depuis la page stock
            </p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-2.5 font-medium text-slate-600">Article</th>
                  <th className="text-right px-5 py-2.5 font-medium text-slate-600">En stock</th>
                  <th className="text-right px-5 py-2.5 font-medium text-slate-600">Seuil min</th>
                </tr>
              </thead>
              <tbody>
                {machine.stockItems.map((item) => {
                  const lowStock = item.quantityOnHand <= item.minimumLevel
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/stock/${item.id}`} className="font-medium hover:text-blue-600">
                          {item.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">{item.reference}</p>
                      </td>
                      <td className={`px-5 py-3 text-right font-medium ${lowStock ? "text-red-600" : "text-slate-800"}`}>
                        {item.quantityOnHand} {item.unit}
                        {lowStock && " ⚠"}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-400">{item.minimumLevel} {item.unit}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Historique des interventions */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Historique des interventions</h2>
          {canCreateIntervention && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/interventions/new?machineId=${machine.id}&siteId=${machine.siteId}`}>
                <ClipboardList className="w-4 h-4 mr-1" />
                Nouvelle intervention
              </Link>
            </Button>
          )}
        </div>

        {machine.interventions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">Aucune intervention enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Titre</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Priorité</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {machine.interventions.map((intervention) => (
                <tr key={intervention.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/interventions/${intervention.id}`} className="hover:text-blue-600 font-medium">
                      {intervention.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600 capitalize">{intervention.type.toLowerCase()}</td>
                  <td className="px-5 py-3">
                    <InterventionPriorityBadge priority={intervention.priority} />
                  </td>
                  <td className="px-5 py-3">
                    <InterventionStatusBadge status={intervention.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string
  sub?: string
  highlight?: "amber" | "red" | "green"
}

function StatCard({ label, value, sub, highlight }: StatCardProps) {
  const valueColor =
    highlight === "red"
      ? "text-red-600"
      : highlight === "amber"
      ? "text-amber-600"
      : highlight === "green"
      ? "text-green-600"
      : "text-slate-900"

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
