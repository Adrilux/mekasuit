import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { can } from "@/lib/permissions/permission-matrix"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 Mo
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ interventionId: string }> },
) {
  const { interventionId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!can(session.role, "intervention:update")) return new Response("Forbidden", { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return new Response("No file", { status: 400 })

  if (file.size > MAX_SIZE_BYTES) {
    return new Response("Fichier trop volumineux (max 10 Mo)", { status: 413 })
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return new Response("Type de fichier non autorisé", { status: 415 })
  }

  const intervention = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.intervention.findUnique({ where: { id: interventionId }, select: { id: true } })
  })
  if (!intervention) return new Response("Intervention introuvable", { status: 404 })

  const ext = path.extname(file.name).toLowerCase() || ".bin"
  const storedName = `${randomUUID()}${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "interventions", interventionId)
  await mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, storedName)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const attachment = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.interventionAttachment.create({
      data: {
        tenantId: session.tenantId,
        interventionId,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedBy: session.id,
      },
    })
  })

  return Response.json({ success: true, attachment })
}
