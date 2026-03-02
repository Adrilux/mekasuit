export interface InviteUserData {
  recipientName: string
  recipientEmail: string
  tempPassword: string
  tenantName: string
  appUrl: string
}

export function buildInviteUserEmail(data: InviteUserData): string {
  const loginUrl = `${data.appUrl}/sign-in`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invitation MekaSuite</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#1e293b;padding:24px 32px;">
          <span style="color:#94a3b8;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">MekaSuite</span>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Vous avez été invité(e)</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour <strong>${data.recipientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;">
            <strong>${data.tenantName}</strong> vous a invité(e) à rejoindre MekaSuite, leur logiciel de GMAO.
          </p>
          <!-- Credentials card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;background:#fffbeb;">
            <tr><td style="padding:16px 20px;">
              <div style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:12px;">Vos identifiants de connexion</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;border-bottom:1px solid #fef3c7;">
                    <span style="font-size:12px;color:#78350f;font-weight:500;display:block;">Email</span>
                    <span style="font-size:14px;color:#0f172a;font-family:monospace;">${data.recipientEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="font-size:12px;color:#78350f;font-weight:500;display:block;">Mot de passe temporaire</span>
                    <span style="font-size:18px;color:#0f172a;font-family:monospace;font-weight:700;letter-spacing:0.1em;">${data.tempPassword}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#92400e;">
                Vous serez invité(e) à changer ce mot de passe dès votre première connexion.
              </p>
            </td></tr>
          </table>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Se connecter</a>
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
