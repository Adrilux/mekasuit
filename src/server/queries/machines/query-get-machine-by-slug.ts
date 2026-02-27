import { prisma } from "@/lib/db/prisma-client-singleton"

export async function queryGetMachineBySlug(slug: string) {
  return prisma.machine.findUnique({
    where: { qrCodeSlug: slug },
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      tenantId: true,
      site: { select: { name: true } },
    },
  })
}
