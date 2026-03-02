export interface InterventionAssignedData {
  technicianName: string
  interventionTitle: string
  interventionId: string
  machineName?: string
  scheduledAt?: string
  priority: string
  appUrl: string
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#64748b",
  MEDIUM: "#2563eb",
  HIGH: "#d97706",
  CRITICAL: "#dc2626",
}

export function buildInterventionAssignedEmail(data: InterventionAssignedData): string {
  const priorityLabel = PRIORITY_LABELS[data.priority] ?? data.priority
  const priorityColor = PRIORITY_COLORS[data.priority] ?? "#64748b"
  const link = `${data.appUrl}/interventions/${data.interventionId}`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Intervention assignée</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#1e293b;padding:24px 32px;">
          <span style="color:#94a3b8;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">MekaSuite</span>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Intervention assignée</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour <strong>${data.technicianName}</strong>,</p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;">Une intervention vous a été assignée :</p>
          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:12px;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">Titre</span><br>
              <span style="font-size:15px;font-weight:600;color:#0f172a;">${data.interventionTitle}</span>
            </td></tr>
            ${data.machineName ? `<tr><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:12px;color:#64748b;font-weight:500;">Machine</span><br>
              <span style="font-size:14px;color:#334155;">${data.machineName}</span>
            </td></tr>` : ""}
            <tr><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:12px;color:#64748b;font-weight:500;">Priorité</span><br>
              <span style="font-size:14px;font-weight:600;color:${priorityColor};">${priorityLabel}</span>
            </td></tr>
            ${data.scheduledAt ? `<tr><td style="padding:12px 20px;">
              <span style="font-size:12px;color:#64748b;font-weight:500;">Planifiée le</span><br>
              <span style="font-size:14px;color:#334155;">${data.scheduledAt}</span>
            </td></tr>` : ""}
          </table>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Voir l'intervention</a>
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
