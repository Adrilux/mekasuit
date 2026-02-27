import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { queryGetInterventionDetail } from "@/server/queries/interventions/query-get-intervention-detail"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  PENDING_PARTS: "Attente pièces",
  CLOSED: "Fermé",
  CANCELLED: "Annulé",
}

const TYPE_LABELS: Record<string, string> = {
  CORRECTIVE: "Corrective",
  PREVENTIVE: "Préventive",
  IMPROVEMENT: "Amélioration",
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
}

function fmt(d: Date | null | undefined): string {
  return d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—"
}

function esc(s: string | null | undefined): string {
  if (!s) return ""
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>")
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ interventionId: string }> },
) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { interventionId } = await params
  const intervention = await queryGetInterventionDetail(session, interventionId)
  if (!intervention) return new Response("Not found", { status: 404 })

  const userIds = [
    intervention.assignedUserId,
    ...intervention.notes.map((n) => n.authorUserId),
  ].filter((id): id is string => !!id)
  const userNames = await buildUserNameMap([...new Set(userIds)])

  const techName = intervention.assignedUserId
    ? (userNames.get(intervention.assignedUserId) ?? "—")
    : "Non assigné"

  const notesHtml = intervention.notes.length === 0
    ? `<p style="color:#94a3b8;font-size:11px">Aucune note</p>`
    : intervention.notes.map((note) => `
        <div class="note-block">
          <p class="note-meta">${esc(userNames.get(note.authorUserId))} — ${fmt(note.createdAt)}</p>
          <p>${esc(note.content)}</p>
        </div>
      `).join("")

  const partsHtml = intervention.partsUsed.length === 0
    ? `<p style="color:#94a3b8;font-size:11px">Aucune pièce consommée</p>`
    : `<table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Désignation</th>
            <th style="text-align:right">Quantité</th>
            <th>Unité</th>
          </tr>
        </thead>
        <tbody>
          ${intervention.partsUsed.map((part) => `
            <tr>
              <td style="font-family:monospace">${esc(part.stockItem.reference)}</td>
              <td>${esc(part.stockItem.name)}</td>
              <td style="text-align:right">${part.quantity}</td>
              <td>${esc(part.stockItem.unit)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bon de travail — ${esc(intervention.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-right { text-align: right; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background: #f1f5f9; color: #475569; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .info-item dt { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .info-item dd { font-weight: 600; color: #1e293b; }
    .info-wide { grid-column: span 2; }
    section { margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 6px 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; }
    td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
    .note-block { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 8px 10px; margin-bottom: 8px; }
    .note-meta { font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
    .signature-box { border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; height: 80px; }
    .signature-label { font-size: 10px; color: #94a3b8; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 10px 18px; font-size: 13px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <h1>${esc(intervention.title)}</h1>
        <p style="color:#64748b;font-size:11px;margin-top:2px">
          ${esc(intervention.site.name)}${intervention.machine ? ` — ${esc(intervention.machine.name)}` : ""}
        </p>
        <p style="margin-top:6px">
          <span class="badge">${PRIORITY_LABELS[intervention.priority] ?? intervention.priority}</span>
          <span class="badge" style="margin-left:4px">${TYPE_LABELS[intervention.type] ?? intervention.type}</span>
          <span class="badge" style="margin-left:4px">${STATUS_LABELS[intervention.status] ?? intervention.status}</span>
        </p>
      </div>
      <div class="header-right">
        <p style="font-size:10px;color:#94a3b8">Bon de travail</p>
        <p style="font-family:monospace;font-size:10px;color:#64748b">${intervention.id.slice(0, 16)}…</p>
        <p style="font-size:10px;color:#94a3b8;margin-top:4px">Imprimé le ${fmt(new Date())}</p>
      </div>
    </div>

    <section>
      <h2>Informations</h2>
      <div class="info-grid">
        <dl class="info-item">
          <dt>Technicien assigné</dt>
          <dd>${esc(techName)}</dd>
        </dl>
        <dl class="info-item">
          <dt>Date planifiée</dt>
          <dd>${fmt(intervention.scheduledAt)}</dd>
        </dl>
        <dl class="info-item">
          <dt>Créée le</dt>
          <dd>${fmt(intervention.createdAt)}</dd>
        </dl>
        <dl class="info-item">
          <dt>Fermée le</dt>
          <dd>${fmt(intervention.closedAt)}</dd>
        </dl>
        ${intervention.description
          ? `<dl class="info-item info-wide">
              <dt>Description</dt>
              <dd style="font-weight:normal">${esc(intervention.description)}</dd>
            </dl>`
          : ""}
      </div>
    </section>

    <section>
      <h2>Notes de suivi (${intervention.notes.length})</h2>
      ${notesHtml}
    </section>

    <section>
      <h2>Pièces consommées (${intervention.partsUsed.length})</h2>
      ${partsHtml}
    </section>

    <div class="signature-grid">
      <div class="signature-box">
        <p class="signature-label">Technicien — Signature</p>
      </div>
      <div class="signature-box">
        <p class="signature-label">Responsable — Visa</p>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Imprimer / PDF</button>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
