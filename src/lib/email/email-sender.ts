import { serverEnv } from "@/lib/env/env-server-schema"

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

/**
 * Envoie un email via Resend (best-effort).
 * Si RESEND_API_KEY n'est pas configuré, loggue dans la console sans lever d'exception.
 * Ne doit jamais être appelé dans une transaction DB — côté fire-and-forget.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!serverEnv.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY non configuré — email simulé :")
    console.log(`  To: ${payload.to}`)
    console.log(`  Subject: ${payload.subject}`)
    return
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(serverEnv.RESEND_API_KEY)

    const from = serverEnv.EMAIL_FROM ?? "MekaSuite <noreply@mekasuite.fr>"

    const { error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    })

    if (error) {
      console.error("[email] Échec Resend :", error)
    }
  } catch (err) {
    console.error("[email] Exception lors de l'envoi :", err)
  }
}
