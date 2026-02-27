/**
 * This page is intentionally blank — the actual print view is at:
 * /api/interventions/[interventionId]/print (returns full HTML for printing)
 *
 * This page exists to satisfy the Next.js App Router routing, but redirects
 * to the API route which returns a standalone printable HTML document.
 */
import { redirect } from "next/navigation"

export default async function PrintRedirectPage({
  params,
}: {
  params: Promise<{ interventionId: string }>
}) {
  const { interventionId } = await params
  redirect(`/api/interventions/${interventionId}/print`)
}
