import { NextRequest } from "next/server"
import { unlink } from "fs/promises"
import path from "path"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { can } from "@/lib/permissions/permission-matrix"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ machineId: string; attachmentId: string }> },
) {
  const { machineId, attachmentId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!can(session.role, "machine:update")) return new Response("Forbidden", { status: 403 })

  const attachment = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machineAttachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, machineId: true, storedName: true },
    })
  })

  if (!attachment || attachment.machineId !== machineId) {
    return new Response("Introuvable", { status: 404 })
  }

  // Supprimer le fichier physique
  const filePath = path.join(process.cwd(), "public", "uploads", "machines", machineId, attachment.storedName)
  try {
    await unlink(filePath)
  } catch {
    // Le fichier peut déjà être absent — on continue quand même
  }

  await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    await tx.machineAttachment.delete({ where: { id: attachmentId } })
  })

  return Response.json({ success: true })
}
