import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import {
  queryGetMtbfBySite,
  queryGetTechnicianLoad,
  queryGetMaintenanceCostBySite,
} from "@/server/queries/reports/query-get-maintenance-reports"
import { queryGetAvailability } from "@/server/queries/reports/query-get-availability"
import { queryGetSlaReport } from "@/server/queries/reports/query-get-sla-report"

function formatHours(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)} h`
  const days = hours / 24
  if (days < 30) return `${days.toFixed(1)} j`
  return `${(days / 30).toFixed(1)} mois`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default async function ReportsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  const sites = await queryGetSitesByTenant(session)

  const activeSite = (params.siteId ? sites.find((s) => s.id === params.siteId) : null)
    ?? sites.find((s) => s.isActive)
    ?? sites[0]

  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to + "T23:59:59") : undefined

  const filter = { siteId: activeSite?.id ?? "", from, to }

  const [mtbf, techLoad, costs, availability, sla] = activeSite
    ? await Promise.all([
        queryGetMtbfBySite(session, filter),
        queryGetTechnicianLoad(session, filter),
        queryGetMaintenanceCostBySite(session, filter),
        queryGetAvailability(session, filter),
        queryGetSlaReport(session, filter),
      ])
    : [[], [], [], [], []]

  const techIds = techLoad.map((t) => t.userId)
  const techNamesMap = await buildUserNameMap(techIds)
  const techNames = Object.fromEntries(techNamesMap.entries())

  const totalCostCents = costs.reduce((sum, c) => sum + c.totalCostCents, 0)
  const exportedAt = new Date()

  const periodLabel = from || to
    ? `${from ? formatDate(from) : "…"} → ${to ? formatDate(to) : "aujourd'hui"}`
    : "Toutes les périodes"

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <title>Rapport GMAO — {activeSite?.name ?? ""}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; background: white; }
          .header { border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 18pt; font-weight: bold; }
          .header .meta { font-size: 9pt; color: #64748b; margin-top: 4px; }
          h2 { font-size: 13pt; font-weight: bold; margin-bottom: 8px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; font-weight: 600; }
          td { border: 1px solid #e2e8f0; padding: 6px 8px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-muted { color: #64748b; }
          .bold { font-weight: 600; }
          .empty { color: #94a3b8; font-style: italic; font-size: 10pt; }
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            h2 { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>Rapport de maintenance — {activeSite?.name ?? "Site inconnu"}</h1>
          <div className="meta">
            Période : {periodLabel} &nbsp;·&nbsp; Exporté le {formatDate(exportedAt)}
          </div>
        </div>

        {/* MTBF */}
        <h2>MTBF — Temps moyen entre pannes correctives</h2>
        {mtbf.length === 0 ? (
          <p className="empty">Pas assez de données (minimum 2 interventions correctives clôturées par machine).</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th className="text-right">Pannes</th>
                <th className="text-right">MTBF</th>
              </tr>
            </thead>
            <tbody>
              {mtbf.map((row) => (
                <tr key={row.machineId}>
                  <td className="bold">{row.machineName}</td>
                  <td className="text-right">{row.interventionCount}</td>
                  <td className="text-right bold">
                    {row.mtbfHours !== null ? formatHours(row.mtbfHours) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Disponibilité */}
        <h2>Taux de disponibilité des machines</h2>
        {availability.length === 0 ? (
          <p className="empty">Aucune intervention corrective clôturée sur cette période.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th className="text-right">Incidents</th>
                <th className="text-right">Temps d&apos;arrêt</th>
                <th className="text-right">Disponibilité</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((row) => (
                <tr key={row.machineId}>
                  <td className="bold">{row.machineName}</td>
                  <td className="text-right">{row.incidentCount}</td>
                  <td className="text-right text-muted">{formatHours(row.downtimeHours)}</td>
                  <td className="text-right bold">{row.availabilityRate} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* SLA */}
        <h2>Respect des délais SLA</h2>
        <p className="text-muted" style={{ fontSize: "9pt", marginBottom: "8px" }}>
          Délais cibles : Critique 4h · Haute 24h · Moyenne 72h · Basse 168h
        </p>
        {sla.every((r) => r.total === 0) ? (
          <p className="empty">Aucune intervention clôturée sur cette période.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Priorité</th>
                <th className="text-right">SLA cible</th>
                <th className="text-right">Total</th>
                <th className="text-right">Dans les délais</th>
                <th className="text-right">Taux SLA</th>
                <th className="text-right">Délai moyen</th>
              </tr>
            </thead>
            <tbody>
              {sla.map((row) => (
                <tr key={row.priority}>
                  <td className="bold">{row.priorityLabel}</td>
                  <td className="text-right text-muted">{formatHours(row.slaLimitHours)}</td>
                  <td className="text-right">{row.total || "—"}</td>
                  <td className="text-right">{row.withinSla || "—"}</td>
                  <td className="text-right bold">{row.total > 0 ? `${row.slaRate} %` : "—"}</td>
                  <td className="text-right text-muted">{row.total > 0 ? formatHours(row.avgResponseHours) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Charge technicien */}
        <h2>Charge par technicien</h2>
        {techLoad.length === 0 ? (
          <p className="empty">Aucune intervention assignée sur cette période.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Technicien</th>
                <th className="text-right">Total</th>
                <th className="text-right">Ouvertes</th>
                <th className="text-right">Fermées</th>
                <th className="text-right">Correctives</th>
                <th className="text-right">Préventives</th>
                <th className="text-right">Critiques</th>
              </tr>
            </thead>
            <tbody>
              {techLoad
                .sort((a, b) => b.total - a.total)
                .map((row) => (
                  <tr key={row.userId}>
                    <td className="bold">
                      {techNames[row.userId] ?? row.userId.slice(0, 8) + "…"}
                    </td>
                    <td className="text-right bold">{row.total}</td>
                    <td className="text-right">{row.open || "—"}</td>
                    <td className="text-right">{row.closed || "—"}</td>
                    <td className="text-right">{row.corrective || "—"}</td>
                    <td className="text-right">{row.preventive || "—"}</td>
                    <td className="text-right bold">{row.critical || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {/* Coût maintenance */}
        <h2>Coût de maintenance par machine</h2>
        {costs.length === 0 ? (
          <p className="empty">Aucune pièce consommée avec un coût renseigné.</p>
        ) : (
          <>
            <p style={{ fontSize: "10pt", marginBottom: "8px" }}>
              Total sur la période :{" "}
              <span className="bold">{(totalCostCents / 100).toFixed(2)} €</span>
            </p>
            <table>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th className="text-right">Pièces consommées</th>
                  <th className="text-right">Coût total</th>
                  <th className="text-right">% du total</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((row) => (
                  <tr key={row.machineId}>
                    <td className="bold">{row.machineName}</td>
                    <td className="text-right">{row.partsConsumed}</td>
                    <td className="text-right bold">{(row.totalCostCents / 100).toFixed(2)} €</td>
                    <td className="text-right text-muted">
                      {totalCostCents > 0 ? `${((row.totalCostCents / totalCostCents) * 100).toFixed(1)} %` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <script
          dangerouslySetInnerHTML={{
            __html: `window.onload = function() { window.print(); }`,
          }}
        />
      </body>
    </html>
  )
}
