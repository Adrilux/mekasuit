/**
 * Seed de démonstration — Heinrich & Bock
 * Crée un tenant fictif avec données réalistes pour la démo interne
 *
 * Exécution : npm run db:seed
 * Prérequis  : migrations appliquées + .env.local configuré
 */

import { config } from "dotenv"
config({ path: ".env.local" })
config({ path: ".env" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

// Prisma 7 : requiert un adapter DB (Query Compiler / WASM)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] })

async function main() {
  console.log("🌱 Démarrage du seed...")

  // --- Tenant Heinrich & Bock ---
  const tenant = await prisma.tenant.upsert({
    where: { slug: "heinrich-bock" },
    update: {},
    create: {
      name: "Heinrich & Bock",
      slug: "heinrich-bock",
      isActive: true,
      license: {
        create: {
          maxSites: 3,
          maxUsers: 20,
          billingPeriod: "monthly",
          renewsAt: new Date("2027-01-01"),
        },
      },
      modules: {
        create: [
          { module: "GMAO", isActive: true, activatedAt: new Date() },
          { module: "STOCK_MANAGEMENT", isActive: true, activatedAt: new Date() },
          { module: "AI_ASSISTANT", isActive: false },
          { module: "ADVANCED_REPORTS", isActive: false },
          { module: "INTER_SITE_TRANSFERS", isActive: false },
        ],
      },
    },
  })

  console.log(`✓ Tenant créé : ${tenant.name} (${tenant.id})`)

  // --- Sites ---
  const siteMain = await prisma.site.upsert({
    where: { id: "site-hb-main" },
    update: {},
    create: {
      id: "site-hb-main",
      tenantId: tenant.id,
      name: "Atelier principal — Küstrin",
      address: "Küstriner Str. 12, 10000 Berlin",
      isActive: true,
    },
  })

  const siteSecond = await prisma.site.upsert({
    where: { id: "site-hb-second" },
    update: {},
    create: {
      id: "site-hb-second",
      tenantId: tenant.id,
      name: "Atelier pièces détachées — Frankfurt",
      address: "Industriestr. 8, 60000 Frankfurt",
      isActive: true,
    },
  })

  console.log(`✓ Sites créés : ${siteMain.name}, ${siteSecond.name}`)

  // --- Machines ---
  const machines = await Promise.all([
    prisma.machine.upsert({
      where: { qrCodeSlug: "presse-p1-hb" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        name: "Presse hydraulique P1",
        serialNumber: "PH-2019-001",
        category: "Presse hydraulique",
        manufacturer: "HACO",
        model: "HACC 40T",
        status: "OPERATIONAL",
        qrCodeSlug: "presse-p1-hb",
        installedAt: new Date("2019-03-15"),
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "concasseur-c1-hb" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        name: "Concasseur à mâchoires C1",
        serialNumber: "CM-2020-007",
        category: "Concasseur",
        manufacturer: "Metso",
        model: "C80",
        status: "OPERATIONAL",
        qrCodeSlug: "concasseur-c1-hb",
        installedAt: new Date("2020-06-01"),
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "moule-pave-m1-hb" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        name: "Moule de presse pavé 20×20",
        serialNumber: "MP-2018-042",
        category: "Moule",
        manufacturer: "Heinrich & Bock",
        model: "MP-20-20",
        status: "OPERATIONAL",
        qrCodeSlug: "moule-pave-m1-hb",
        installedAt: new Date("2018-01-10"),
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "vibreur-v1-hb" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        name: "Table vibrante V1",
        serialNumber: "TV-2021-003",
        category: "Vibreur",
        manufacturer: "Wacker Neuson",
        model: "VT950",
        status: "UNDER_MAINTENANCE",
        qrCodeSlug: "vibreur-v1-hb",
        installedAt: new Date("2021-09-20"),
      },
    }),
  ])

  console.log(`✓ ${machines.length} machines créées`)

  // --- Stock items ---
  const stockItems = await Promise.all([
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteMain.id, reference: "RLT-6205-2RS" } },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        reference: "RLT-6205-2RS",
        name: "Roulement 6205-2RS",
        unit: "pièce",
        quantityOnHand: 12,
        minimumLevel: 4,
        unitCostCents: 850,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteMain.id, reference: "CRR-B27-POL" } },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        reference: "CRR-B27-POL",
        name: "Courroie trapézoïdale B27",
        unit: "pièce",
        quantityOnHand: 6,
        minimumLevel: 2,
        unitCostCents: 2400,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteMain.id, reference: "HUI-46-5L" } },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        reference: "HUI-46-5L",
        name: "Huile hydraulique ISO 46 (5L)",
        unit: "litre",
        quantityOnHand: 40,
        minimumLevel: 10,
        unitCostCents: 1200,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteMain.id, reference: "JOI-CAOUT-10" } },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteMain.id,
        reference: "JOI-CAOUT-10",
        name: "Joint caoutchouc Ø10mm",
        unit: "pièce",
        quantityOnHand: 50,
        minimumLevel: 20,
        unitCostCents: 120,
      },
    }),
  ])

  console.log(`✓ ${stockItems.length} articles de stock créés`)

  // Note : les interventions de démonstration ne sont pas créées ici
  // car elles nécessitent des authUserIds valides (Better Auth)
  // → À créer depuis l'interface après la création du premier compte

  console.log("✅ Seed terminé avec succès !")
  console.log("")
  console.log("Prochaines étapes :")
  console.log("  1. Créer un compte via /register pour devenir client_admin")
  console.log("  2. Associer ce compte au tenant heinrich-bock depuis le super_admin")
  console.log("  3. Explorer l'interface avec les données de démo")
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
