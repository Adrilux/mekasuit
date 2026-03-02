export interface InterventionOverdueData {
  recipientName: string
  interventionTitle: string
  interventionId: string
  machineName?: string
  scheduledAt: string
  priority: string
  appUrl: string
}

// For manager recap — multiple overdue interventions
export interface OverdueManagerSummaryData {
  managerName: string
  interventions: Array<{
    id: string
    title: string
    machineName?: string
    scheduledAt: string
    technicianName?: string
  }>
  appUrl: string
}

export function buildInterventionOverdueEmail(data: InterventionOverdueData): string {
  const link = `${data.appUrl}/interventions/${data.interventionId}`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Intervention en retard</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#7f1d1d;padding:24px 32px;">
          <span style="color:#fca5a5;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">MekaSuite</span>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">⚠️ Intervention en retard</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour <strong>${data.recipientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;">L'intervention suivante dépasse sa date planifiée :</p>
          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;background:#fff7f7;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #fee2e2;">
              <span style="font-size:12px;color:#ef4444;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">Titre</span><br>
              <span style="font-size:15px;font-weight:600;color:#0f172a;">${data.interventionTitle}</span>
            </td></tr>
            ${data.machineName ? `<tr><td style="padding:12px 20px;border-bottom:1px solid #fee2e2;">
              <span style="font-size:12px;color:#64748b;font-weight:500;">Machine</span><br>
              <span style="font-size:14px;color:#334155;">${data.machineName}</span>
            </td></tr>` : ""}
            <tr><td style="padding:12px 20px;">
              <span style="font-size:12px;color:#64748b;font-weight:500;">Date planifiée</span><br>
              <span style="font-size:14px;font-weight:600;color:#dc2626;">${data.scheduledAt}</span>
            </td></tr>
          </table>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${link}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Voir l'intervention</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">MekaSuite — Logiciel de GMAO · Ce message est généré automatiquement</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function buildOverdueManagerSummaryEmail(data: OverdueManagerSummaryData): string {
  const rows = data.interventions
    .map(
      (i) => `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
      <a href="${data.appUrl}/interventions/${i.id}" style="color:#2563eb;text-decoration:none;font-weight:500;font-size:13px;">${i.title}</a>
      ${i.machineName ? `<br><span style="font-size:12px;color:#64748b;">${i.machineName}</span>` : ""}
    </td>
    <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#dc2626;font-weight:500;">${i.scheduledAt}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${i.technicianName ?? "—"}</td>
  </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Interventions en retard</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#7f1d1d;padding:24px 32px;">
          <span style="color:#fca5a5;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">MekaSuite</span>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">⚠️ ${data.interventions.length} intervention(s) en retard</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour <strong>${data.managerName}</strong>,</p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;">Les interventions suivantes dépassent leur date planifiée :</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Intervention</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Prévue le</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Technicien</th>
            </tr>
            ${rows}
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">MekaSuite — Logiciel de GMAO · Ce message est généré automatiquement</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
