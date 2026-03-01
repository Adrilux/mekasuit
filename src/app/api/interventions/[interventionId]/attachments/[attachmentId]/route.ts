import { NextRequest } from "next/server"
import { unlink } from "fs/promises"
import path from "path"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { can } from "@/lib/permissions/permission-matrix"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ interventionId: string; attachmentId: string }> },
) {
  const { interventionId, attachmentId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!can(session.role, "intervention:update")) return new Response("Forbidden", { status: 403 })

  const attachment = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.interventionAttachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, interventionId: true, storedName: true },
    })
  })

  if (!attachment || attachment.interventionId !== interventionId) {
    return new Response("Introuvable", { status: 404 })
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "interventions", interventionId, attachment.storedName)
  try {
    await unlink(filePath)
  } catch {
    // Fichier déjà absent — on continue
  }

  await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    await tx.interventionAttachment.delete({ where: { id: attachmentId } })
  })

  return Response.json({ success: true })
}
