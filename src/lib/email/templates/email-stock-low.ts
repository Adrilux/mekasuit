export interface StockLowData {
  recipientName: string
  articleName: string
  articleReference: string
  quantityOnHand: number
  minimumQuantity: number
  siteName?: string
  appUrl: string
}

export function buildStockLowEmail(data: StockLowData): string {
  const link = `${data.appUrl}/stock`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Stock bas</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#78350f;padding:24px 32px;">
          <span style="color:#fcd34d;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">MekaSuite</span>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">⚠️ Alerte stock bas</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour <strong>${data.recipientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;">Un article de stock est passé sous le seuil minimum :</p>
          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;background:#fffbeb;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #fef3c7;">
              <span style="font-size:12px;color:#d97706;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">Article</span><br>
              <span style="font-size:15px;font-weight:600;color:#0f172a;">${data.articleName}</span>
              <span style="font-size:13px;color:#64748b;margin-left:8px;">${data.articleReference}</span>
            </td></tr>
            ${data.siteName ? `<tr><td style="padding:12px 20px;border-bottom:1px solid #fef3c7;">
              <span style="font-size:12px;color:#64748b;font-weight:500;">Site</span><br>
              <span style="font-size:14px;color:#334155;">${data.siteName}</span>
            </td></tr>` : ""}
            <tr><td style="padding:12px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;">
                    <span style="font-size:12px;color:#64748b;font-weight:500;">Quantité actuelle</span><br>
                    <span style="font-size:22px;font-weight:700;color:#dc2626;">${data.quantityOnHand}</span>
                  </td>
                  <td style="width:50%;">
                    <span style="font-size:12px;color:#64748b;font-weight:500;">Seuil minimum</span><br>
                    <span style="font-size:22px;font-weight:700;color:#334155;">${data.minimumQuantity}</span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${link}" style="display:inline-block;background:#d97706;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Gérer le stock</a>
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
