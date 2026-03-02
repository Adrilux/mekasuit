import { NextRequest, NextResponse } from "next/server"
import { serverEnv } from "@/lib/env/env-server-schema"
import { notifyInterventionsOverdue } from "@/lib/notifications/notify-interventions-overdue"

/**
 * GET /api/cron/check-overdue
 *
 * Route appelée par un cron externe (ex: GitHub Actions, cron-job.org, Vercel Cron).
 * Sécurisée par `Authorization: Bearer <CRON_SECRET>`.
 *
 * Si CRON_SECRET n'est pas configuré (dev), la requête passe sans auth.
 *
 * Exemple d'appel :
 *   curl -H "Authorization: Bearer <secret>" https://app.mekasuite.fr/api/cron/check-overdue
 */
export async function GET(req: NextRequest) {
  // Vérification du secret cron
  if (serverEnv.CRON_SECRET) {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (token !== serverEnv.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const processed = await notifyInterventionsOverdue()
    return NextResponse.json({ success: true, processed })
  } catch (err) {
    console.error("[cron/check-overdue] Erreur :", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
