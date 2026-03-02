import { NextRequest } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { can } from "@/lib/permissions/permission-matrix"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!can(session.role, "site:update")) return new Response("Forbidden", { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return new Response("No file", { status: 400 })

  if (file.size > MAX_SIZE_BYTES) {
    return new Response("Fichier trop volumineux (max 5 Mo)", { status: 413 })
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return new Response("Type de fichier non autorisé (JPEG, PNG, WebP uniquement)", { status: 415 })
  }

  // Vérifier que le site appartient au tenant + récupérer l'ancien fichier
  const site = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.site.findFirst({ where: { id: siteId }, select: { id: true, floorPlanImage: true } })
  })
  if (!site) return new Response("Site introuvable", { status: 404 })

  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg"
  const storedName = `floor-plan${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "sites", siteId)
  await mkdir(uploadDir, { recursive: true })

  // Supprimer l'ancien fichier s'il existait
  if (site.floorPlanImage) {
    const oldPath = path.join(uploadDir, site.floorPlanImage)
    await unlink(oldPath).catch(() => undefined)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, storedName), buffer)

  await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    await tx.site.update({
      where: { id: siteId },
      data: { floorPlanImage: storedName },
    })
  })

  return Response.json({ success: true, floorPlanImage: storedName })
}
