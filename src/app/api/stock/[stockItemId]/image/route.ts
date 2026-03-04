import { NextRequest } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ stockItemId: string }> },
) {
  const { stockItemId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!session.permissions.includes("stock:update")) return new Response("Forbidden", { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return new Response("No file", { status: 400 })

  if (file.size > MAX_SIZE_BYTES) return new Response("Fichier trop volumineux (max 5 Mo)", { status: 413 })
  if (!ALLOWED_MIME.includes(file.type)) return new Response("Type non autorisé (JPEG, PNG, WebP)", { status: 415 })

  // Vérifier que l'article appartient au tenant + récupérer l'ancienne image
  const item = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.stockItem.findUnique({ where: { id: stockItemId }, select: { id: true, imageUrl: true } })
  })
  if (!item) return new Response("Article introuvable", { status: 404 })

  const ext = path.extname(file.name).toLowerCase() || ".jpg"
  const storedName = `${randomUUID()}${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "stock", stockItemId)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()))

  // Supprimer l'ancienne image physique si elle existe
  if (item.imageUrl) {
    const oldPath = path.join(process.cwd(), "public", item.imageUrl)
    await unlink(oldPath).catch(() => {})
  }

  const imageUrl = `/uploads/stock/${stockItemId}/${storedName}`
  await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.stockItem.update({ where: { id: stockItemId }, data: { imageUrl } })
  })

  return Response.json({ success: true, imageUrl })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ stockItemId: string }> },
) {
  const { stockItemId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!session.permissions.includes("stock:update")) return new Response("Forbidden", { status: 403 })

  const item = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.stockItem.findUnique({ where: { id: stockItemId }, select: { id: true, imageUrl: true } })
  })
  if (!item) return new Response("Article introuvable", { status: 404 })

  if (item.imageUrl) {
    await unlink(path.join(process.cwd(), "public", item.imageUrl)).catch(() => {})
    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.stockItem.update({ where: { id: stockItemId }, data: { imageUrl: null } })
    })
  }

  return Response.json({ success: true })
}
