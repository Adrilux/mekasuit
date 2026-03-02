/**
 * Seed "Full Test" — MekaSuite Demo
 * Crée un tenant complet avec 5 utilisateurs + 3 mois de données réalistes
 *
 * Exécution : npx tsx scripts/seed-test-tenant.ts
 * Prérequis  : migrations appliquées + .env.local configuré
 *
 * Idempotent : peut être relancé sans dupliquer les données (upsert par slug/email)
 */

import { config } from "dotenv"
config({ path: ".env.local" })
config({ path: ".env" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

// ============================================================
// Init Prisma + Better Auth (standalone, sans Next.js)
// ============================================================

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] })

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  user: {
    additionalFields: {
      tenantId: { type: "string", required: false, input: false },
    },
  },
})

// ============================================================
// Helpers
// ============================================================

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

/** Crée ou récupère un utilisateur Better Auth et retourne son ID */
async function upsertAuthUser(email: string, name: string, password: string): Promise<string> {
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "user" WHERE email = ${email} LIMIT 1
  `
  if (existing[0]) return existing[0].id

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  })
  if (!result?.user?.id) throw new Error(`Échec création Better Auth pour ${email}`)
  return result.user.id
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("🌱 Seed Full Test — MekaSuite Demo\n")

  // =========================================================
  // 1. TENANT
  // =========================================================

  const tenant = await prisma.tenant.upsert({
    where: { slug: "mekasuite-demo" },
    update: {},
    create: {
      name: "MekaSuite Demo",
      slug: "mekasuite-demo",
      isActive: true,
      license: {
        create: {
          maxSites: 5,
          maxUsers: 50,
          billingPeriod: "yearly",
          renewsAt: new Date("2027-12-31"),
        },
      },
      modules: {
        create: [
          { module: "GMAO", isActive: true, activatedAt: daysAgo(90) },
          { module: "STOCK_MANAGEMENT", isActive: true, activatedAt: daysAgo(90) },
          { module: "ADVANCED_REPORTS", isActive: true, activatedAt: daysAgo(60) },
          { module: "INTER_SITE_TRANSFERS", isActive: true, activatedAt: daysAgo(60) },
          { module: "AI_ASSISTANT", isActive: false },
        ],
      },
    },
  })

  console.log(`✓ Tenant : ${tenant.name} (${tenant.id})`)

  // =========================================================
  // 2. SITES
  // =========================================================

  const siteA = await prisma.site.upsert({
    where: { id: "site-demo-a" },
    update: {},
    create: {
      id: "site-demo-a",
      tenantId: tenant.id,
      name: "Atelier A — Production",
      address: "12 rue de l'Industrie, 69100 Villeurbanne",
      isActive: true,
    },
  })

  const siteB = await prisma.site.upsert({
    where: { id: "site-demo-b" },
    update: {},
    create: {
      id: "site-demo-b",
      tenantId: tenant.id,
      name: "Atelier B — Maintenance",
      address: "45 avenue des Ateliers, 69200 Vénissieux",
      isActive: true,
    },
  })

  console.log(`✓ Sites : ${siteA.name}, ${siteB.name}`)

  // =========================================================
  // 3. UTILISATEURS
  // =========================================================

  const USERS = [
    {
      email: "admin@demo.mekasuite.fr",
      name: "Alice Martin",
      password: "Demo@Admin2024",
      role: "client_admin" as const,
      jobTitle: "Responsable Maintenance",
      sites: [siteA.id, siteB.id],
    },
    {
      email: "chef@demo.mekasuite.fr",
      name: "Bernard Dupont",
      password: "Demo@Chef2024",
      role: "workshop_manager" as const,
      jobTitle: "Chef d'atelier",
      sites: [siteA.id, siteB.id],
    },
    {
      email: "tech1@demo.mekasuite.fr",
      name: "Carla Fernandez",
      password: "Demo@Tech12024",
      role: "technician" as const,
      jobTitle: "Technicienne hydraulique",
      sites: [siteA.id],
    },
    {
      email: "tech2@demo.mekasuite.fr",
      name: "David Nguyen",
      password: "Demo@Tech22024",
      role: "technician" as const,
      jobTitle: "Technicien électromécanique",
      sites: [siteA.id, siteB.id],
    },
    {
      email: "lecture@demo.mekasuite.fr",
      name: "Emma Rousseau",
      password: "Demo@Reader2024",
      role: "reader" as const,
      jobTitle: "Directrice de site",
      sites: [siteA.id, siteB.id],
    },
  ]

  const userIds: Record<string, string> = {}

  for (const u of USERS) {
    const authId = await upsertAuthUser(u.email, u.name, u.password)
    userIds[u.email] = authId

    // Vérifie si déjà membre du tenant
    const existing = await prisma.tenantUser.findFirst({
      where: { tenantId: tenant.id, authUserId: authId },
    })

    if (!existing) {
      const tu = await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          authUserId: authId,
          role: u.role,
          jobTitle: u.jobTitle,
          isActive: true,
        },
      })

      await prisma.userSite.createMany({
        data: u.sites.map((siteId) => ({
          tenantId: tenant.id,
          tenantUserId: tu.id,
          siteId,
        })),
        skipDuplicates: true,
      })
    }
  }

  const adminId = userIds["admin@demo.mekasuite.fr"]!
  const chefId = userIds["chef@demo.mekasuite.fr"]!
  const tech1Id = userIds["tech1@demo.mekasuite.fr"]!
  const tech2Id = userIds["tech2@demo.mekasuite.fr"]!

  console.log(`✓ ${USERS.length} utilisateurs créés/vérifiés`)

  // =========================================================
  // 4. MACHINES
  // =========================================================

  const machines = await Promise.all([
    // Site A
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-presse-p1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteA.id,
        name: "Presse hydraulique PH-100",
        serialNumber: "PH-2020-001",
        category: "Presse hydraulique",
        manufacturer: "HACO",
        model: "HACC 100T",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-presse-p1",
        installedAt: new Date("2020-04-10"),
        notes: "Machine principale de l'atelier A. Révision annuelle prévue en Q3.",
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-tour-cnc-t1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteA.id,
        name: "Tour CNC T-450",
        serialNumber: "CNC-2019-007",
        category: "Tour CNC",
        manufacturer: "Mazak",
        model: "QUICK TURN 450",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-tour-cnc-t1",
        installedAt: new Date("2019-11-15"),
        notes: "Tour de précision. Calibration bi-annuelle obligatoire.",
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-fraiseuse-f1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteA.id,
        name: "Fraiseuse 3 axes F-250",
        serialNumber: "FR-2021-012",
        category: "Fraiseuse",
        manufacturer: "DMG Mori",
        model: "DMU 50",
        status: "UNDER_MAINTENANCE",
        qrCodeSlug: "demo-fraiseuse-f1",
        installedAt: new Date("2021-02-28"),
        notes: "En cours de remplacement de broche.",
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-compresseur-c1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteA.id,
        name: "Compresseur à vis CA-75",
        serialNumber: "CA-2018-003",
        category: "Compresseur",
        manufacturer: "Atlas Copco",
        model: "GA75",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-compresseur-c1",
        installedAt: new Date("2018-07-20"),
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-convoyeur-cv1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteA.id,
        name: "Convoyeur à bande CB-12",
        serialNumber: "CB-2022-001",
        category: "Convoyeur",
        manufacturer: "Flexlink",
        model: "XH-12",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-convoyeur-cv1",
        installedAt: new Date("2022-01-10"),
      },
    }),
    // Site B
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-ponceuse-p2" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteB.id,
        name: "Ponceuse à bande PB-60",
        serialNumber: "PB-2020-009",
        category: "Ponceuse",
        manufacturer: "Metabo",
        model: "BAS 318",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-ponceuse-p2",
        installedAt: new Date("2020-08-05"),
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-soudure-s1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteB.id,
        name: "Poste de soudure MIG/MAG SW-500",
        serialNumber: "SW-2021-004",
        category: "Soudure",
        manufacturer: "Lincoln Electric",
        model: "Power Wave S500",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-soudure-s1",
        installedAt: new Date("2021-05-12"),
      },
    }),
    prisma.machine.upsert({
      where: { qrCodeSlug: "demo-perceuse-pe1" },
      update: {},
      create: {
        tenantId: tenant.id,
        siteId: siteB.id,
        name: "Perceuse à colonne PC-32",
        serialNumber: "PC-2017-015",
        category: "Perceuse",
        manufacturer: "Bernardo",
        model: "DP 32-1050V",
        status: "OPERATIONAL",
        qrCodeSlug: "demo-perceuse-pe1",
        installedAt: new Date("2017-03-22"),
      },
    }),
  ])

  const [presseSiteA, tourCnc, fraiseuse, compresseur, convoyeur, ponceuse, soudure, perceuse] = machines
  console.log(`✓ ${machines.length} machines créées`)

  // =========================================================
  // 5. FOURNISSEURS
  // =========================================================

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: "sup-demo-roulements" },
      update: {},
      create: {
        id: "sup-demo-roulements",
        tenantId: tenant.id,
        name: "Roulements & Transmissions SARL",
        email: "contact@rt-sarl.fr",
        phone: "04 72 11 22 33",
      },
    }),
    prisma.supplier.upsert({
      where: { id: "sup-demo-fluides" },
      update: {},
      create: {
        id: "sup-demo-fluides",
        tenantId: tenant.id,
        name: "TotalEnergies Lubrifiants",
        email: "lubrifiants@totalenergies.fr",
        phone: "01 47 44 45 46",
      },
    }),
    prisma.supplier.upsert({
      where: { id: "sup-demo-elec" },
      update: {},
      create: {
        id: "sup-demo-elec",
        tenantId: tenant.id,
        name: "Electro-Distribution Pro",
        email: "pro@edpro.fr",
        phone: "04 78 90 12 34",
      },
    }),
    prisma.supplier.upsert({
      where: { id: "sup-demo-pneumatique" },
      update: {},
      create: {
        id: "sup-demo-pneumatique",
        tenantId: tenant.id,
        name: "Festo France SAS",
        email: "commandes@festo.fr",
        phone: "01 60 13 60 13",
      },
    }),
  ])

  const [supRlt, supFluides, supElec, supPneumatique] = suppliers
  console.log(`✓ ${suppliers.length} fournisseurs créés`)

  // =========================================================
  // 6. ARTICLES DE STOCK — Site A
  // =========================================================

  const stockItemsA = await Promise.all([
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "RLT-6205-2RS" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id, machineId: presseSiteA!.id,
        reference: "RLT-6205-2RS", name: "Roulement à billes 6205-2RS",
        unit: "pièce", quantityOnHand: 8, minimumLevel: 4, unitCostCents: 850,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "RLT-6306-2Z" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id, machineId: tourCnc!.id,
        reference: "RLT-6306-2Z", name: "Roulement à billes 6306-2Z",
        unit: "pièce", quantityOnHand: 6, minimumLevel: 3, unitCostCents: 1200,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "HUI-HYD-46-20L" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id,
        reference: "HUI-HYD-46-20L", name: "Huile hydraulique ISO VG 46 (20L)",
        unit: "litre", quantityOnHand: 60, minimumLevel: 20, unitCostCents: 480,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "CRR-SPA-1500" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id,
        reference: "CRR-SPA-1500", name: "Courroie trapézoïdale SPA-1500",
        unit: "pièce", quantityOnHand: 4, minimumLevel: 2, unitCostCents: 3200,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "FLT-AIR-G3-4" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id, machineId: compresseur!.id,
        reference: "FLT-AIR-G3-4", name: "Filtre à air G3/4 (compresseur)",
        unit: "pièce", quantityOnHand: 3, minimumLevel: 2, unitCostCents: 2800,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "JOI-PLAT-NBR-20" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id,
        reference: "JOI-PLAT-NBR-20", name: "Joint plat NBR Ø20mm",
        unit: "pièce", quantityOnHand: 25, minimumLevel: 10, unitCostCents: 180,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "ELC-CONT-3P-32A" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id,
        reference: "ELC-CONT-3P-32A", name: "Contacteur tripolaire 32A (Schneider)",
        unit: "pièce", quantityOnHand: 2, minimumLevel: 1, unitCostCents: 8500,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "PNE-VERIN-63-200" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id,
        reference: "PNE-VERIN-63-200", name: "Vérin pneumatique Ø63 course 200mm (Festo)",
        unit: "pièce", quantityOnHand: 1, minimumLevel: 1, unitCostCents: 22000,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "LUB-GRAISSE-500G" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id,
        reference: "LUB-GRAISSE-500G", name: "Graisse lithium NLGI 2 (pot 500g)",
        unit: "pièce", quantityOnHand: 5, minimumLevel: 3, unitCostCents: 1600,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteA.id, reference: "CRR-CONV-B-3000" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteA.id, machineId: convoyeur!.id,
        reference: "CRR-CONV-B-3000", name: "Bande convoyeur 3000x300mm",
        unit: "pièce", quantityOnHand: 2, minimumLevel: 1, unitCostCents: 18500,
      },
    }),
  ])

  // Articles de stock — Site B
  const stockItemsB = await Promise.all([
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteB.id, reference: "RLT-6205-2RS" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteB.id,
        reference: "RLT-6205-2RS", name: "Roulement à billes 6205-2RS",
        unit: "pièce", quantityOnHand: 3, minimumLevel: 2, unitCostCents: 850,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteB.id, reference: "SOD-FIL-MIG-1.0" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteB.id, machineId: soudure!.id,
        reference: "SOD-FIL-MIG-1.0", name: "Fil de soudure MIG 1.0mm (15kg)",
        unit: "bobine", quantityOnHand: 4, minimumLevel: 2, unitCostCents: 6500,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteB.id, reference: "ABR-DISQ-115-A24" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteB.id,
        reference: "ABR-DISQ-115-A24", name: "Disque abrasif Ø115mm grain A24",
        unit: "pièce", quantityOnHand: 40, minimumLevel: 20, unitCostCents: 280,
      },
    }),
    prisma.stockItem.upsert({
      where: { tenantId_siteId_reference: { tenantId: tenant.id, siteId: siteB.id, reference: "HUI-HYD-46-20L" } },
      update: {},
      create: {
        tenantId: tenant.id, siteId: siteB.id,
        reference: "HUI-HYD-46-20L", name: "Huile hydraulique ISO VG 46 (20L)",
        unit: "litre", quantityOnHand: 20, minimumLevel: 10, unitCostCents: 480,
      },
    }),
  ])

  const allStockItems = [...stockItemsA, ...stockItemsB]
  console.log(`✓ ${allStockItems.length} articles de stock créés`)

  // Lien articles ↔ fournisseurs
  const [si_rlt6205A, si_rlt6306, si_huileA, si_courroie, si_filtreAir, si_joint, si_contacteur, si_verin, si_graisse, si_bande, si_rlt6205B, si_filSoudure, si_disque, si_huileB] = [...stockItemsA, ...stockItemsB]

  await prisma.stockItemSupplier.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, stockItemId: si_rlt6205A!.id, supplierId: supRlt!.id, supplierReference: "SKF-6205-2RS", purchasePriceCents: 750, leadTimeDays: 5 },
      { tenantId: tenant.id, stockItemId: si_rlt6306!.id, supplierId: supRlt!.id, supplierReference: "SKF-6306-2Z", purchasePriceCents: 1050, leadTimeDays: 5 },
      { tenantId: tenant.id, stockItemId: si_huileA!.id, supplierId: supFluides!.id, supplierReference: "TOTAL-HV46-20L", purchasePriceCents: 420, leadTimeDays: 3 },
      { tenantId: tenant.id, stockItemId: si_contacteur!.id, supplierId: supElec!.id, supplierReference: "SCH-LC1D32", purchasePriceCents: 7800, leadTimeDays: 7 },
      { tenantId: tenant.id, stockItemId: si_verin!.id, supplierId: supPneumatique!.id, supplierReference: "FESTO-DNC-63-200", purchasePriceCents: 19500, leadTimeDays: 14 },
      { tenantId: tenant.id, stockItemId: si_rlt6205B!.id, supplierId: supRlt!.id, supplierReference: "SKF-6205-2RS", purchasePriceCents: 750, leadTimeDays: 5 },
    ],
  })

  console.log(`✓ Liens articles-fournisseurs créés`)

  // =========================================================
  // 7. MOUVEMENTS STOCK (historique 3 mois)
  // =========================================================

  // Entrées initiales il y a 90 jours (réception stock de départ)
  const initialMovements = [
    { stockItemId: si_rlt6205A!.id, quantity: 20, reason: "Stock initial — réception fournisseur", createdAt: daysAgo(90) },
    { stockItemId: si_rlt6306!.id, quantity: 12, reason: "Stock initial — réception fournisseur", createdAt: daysAgo(90) },
    { stockItemId: si_huileA!.id, quantity: 100, reason: "Stock initial — réception fournisseur", createdAt: daysAgo(90) },
    { stockItemId: si_courroie!.id, quantity: 8, reason: "Stock initial — réception fournisseur", createdAt: daysAgo(89) },
    { stockItemId: si_filtreAir!.id, quantity: 6, reason: "Stock initial", createdAt: daysAgo(89) },
    { stockItemId: si_joint!.id, quantity: 50, reason: "Stock initial", createdAt: daysAgo(89) },
    { stockItemId: si_contacteur!.id, quantity: 3, reason: "Stock initial", createdAt: daysAgo(88) },
    { stockItemId: si_verin!.id, quantity: 2, reason: "Stock initial", createdAt: daysAgo(88) },
    { stockItemId: si_graisse!.id, quantity: 10, reason: "Stock initial", createdAt: daysAgo(88) },
    { stockItemId: si_bande!.id, quantity: 3, reason: "Stock initial", createdAt: daysAgo(87) },
    { stockItemId: si_rlt6205B!.id, quantity: 8, reason: "Stock initial — site B", createdAt: daysAgo(90) },
    { stockItemId: si_filSoudure!.id, quantity: 8, reason: "Stock initial — site B", createdAt: daysAgo(90) },
    { stockItemId: si_disque!.id, quantity: 80, reason: "Stock initial — site B", createdAt: daysAgo(90) },
    { stockItemId: si_huileB!.id, quantity: 40, reason: "Stock initial — site B", createdAt: daysAgo(89) },
  ]

  for (const mv of initialMovements) {
    await prisma.stockMovement.create({
      data: { tenantId: tenant.id, stockItemId: mv.stockItemId, type: "IN", quantity: mv.quantity, reason: mv.reason, operatorId: adminId, createdAt: mv.createdAt },
    })
  }

  // Sorties consommation courante (simulées au fil des 3 mois)
  const outMovements = [
    { stockItemId: si_rlt6205A!.id, qty: -2, day: 75, reason: "Remplacement roulements presse PH-100" },
    { stockItemId: si_huileA!.id, qty: -15, day: 70, reason: "Vidange huile hydraulique — PH-100" },
    { stockItemId: si_joint!.id, qty: -8, day: 65, reason: "Remplacement joints — circuit hydraulique" },
    { stockItemId: si_graisse!.id, qty: -2, day: 60, reason: "Graissage tour CNC T-450" },
    { stockItemId: si_rlt6306!.id, qty: -2, day: 55, reason: "Remplacement roulements tour CNC" },
    { stockItemId: si_filtreAir!.id, qty: -1, day: 50, reason: "Remplacement filtre air compresseur" },
    { stockItemId: si_huileA!.id, qty: -10, day: 45, reason: "Appoint huile hydraulique fraiseuse" },
    { stockItemId: si_courroie!.id, qty: -2, day: 40, reason: "Remplacement courroie convoyeur" },
    { stockItemId: si_rlt6205A!.id, qty: -2, day: 35, reason: "Remplacement roulements convoyeur CB-12" },
    { stockItemId: si_joint!.id, qty: -5, day: 30, reason: "Maintenance préventive — joints divers" },
    { stockItemId: si_graisse!.id, qty: -1, day: 25, reason: "Graissage presse mensuel" },
    { stockItemId: si_disque!.id, qty: -20, day: 45, reason: "Consommation abrasifs — atelier B" },
    { stockItemId: si_filSoudure!.id, qty: -2, day: 38, reason: "Soudure réparation pièce" },
    { stockItemId: si_disque!.id, qty: -20, day: 22, reason: "Consommation abrasifs — atelier B" },
    { stockItemId: si_rlt6205B!.id, qty: -2, day: 18, reason: "Remplacement roulements perceuse" },
  ]

  for (const mv of outMovements) {
    await prisma.stockMovement.create({
      data: { tenantId: tenant.id, stockItemId: mv.stockItemId, type: "OUT", quantity: mv.qty, reason: mv.reason, operatorId: tech2Id, createdAt: daysAgo(mv.day) },
    })
  }

  // Réception commande récente (il y a 15 jours)
  await prisma.stockMovement.create({
    data: { tenantId: tenant.id, stockItemId: si_rlt6205A!.id, type: "IN", quantity: 10, reason: "Réception BC-2024-009", operatorId: adminId, createdAt: daysAgo(15) },
  })
  await prisma.stockMovement.create({
    data: { tenantId: tenant.id, stockItemId: si_filtreAir!.id, type: "IN", quantity: 3, reason: "Réception BC-2024-009", operatorId: adminId, createdAt: daysAgo(15) },
  })

  console.log(`✓ Mouvements de stock créés`)

  // =========================================================
  // 8. COMMANDES FOURNISSEURS
  // =========================================================

  // BC1 — Reçue il y a 2 mois
  const po1 = await prisma.purchaseOrder.upsert({
    where: { id: "po-demo-001" },
    update: {},
    create: {
      id: "po-demo-001",
      tenantId: tenant.id,
      siteId: siteA.id,
      supplierId: supRlt!.id,
      status: "RECEIVED",
      notes: "Commande roulements et courroies — réapprovisionnement trimestriel",
      createdBy: adminId,
      approvedBy: adminId,
      approvedAt: daysAgo(62),
      receivedAt: daysAgo(58),
      expectedDeliveryDate: daysAgo(59),
      createdAt: daysAgo(65),
      updatedAt: daysAgo(58),
    },
  })
  await prisma.purchaseOrderItem.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, purchaseOrderId: po1.id, stockItemId: si_rlt6205A!.id, quantityOrdered: 20, unitPriceCents: 750, quantityReceived: 20 },
      { tenantId: tenant.id, purchaseOrderId: po1.id, stockItemId: si_rlt6306!.id, quantityOrdered: 12, unitPriceCents: 1050, quantityReceived: 12 },
      { tenantId: tenant.id, purchaseOrderId: po1.id, stockItemId: si_courroie!.id, quantityOrdered: 8, unitPriceCents: 3000, quantityReceived: 8 },
    ],
  })

  // BC2 — En cours de livraison
  const po2 = await prisma.purchaseOrder.upsert({
    where: { id: "po-demo-002" },
    update: {},
    create: {
      id: "po-demo-002",
      tenantId: tenant.id,
      siteId: siteA.id,
      supplierId: supPneumatique!.id,
      status: "ORDERED",
      notes: "Remplacement vérin fraiseuse + stock tampon",
      createdBy: chefId,
      approvedBy: adminId,
      approvedAt: daysAgo(8),
      expectedDeliveryDate: daysFromNow(5),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(8),
    },
  })
  await prisma.purchaseOrderItem.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, purchaseOrderId: po2.id, stockItemId: si_verin!.id, quantityOrdered: 2, unitPriceCents: 19500, quantityReceived: 0 },
    ],
  })

  // BC3 — Brouillon (créé hier)
  const po3 = await prisma.purchaseOrder.upsert({
    where: { id: "po-demo-003" },
    update: {},
    create: {
      id: "po-demo-003",
      tenantId: tenant.id,
      siteId: siteA.id,
      supplierId: supElec!.id,
      status: "DRAFT",
      notes: "Réapprovisionnement contacteurs + fusibles",
      createdBy: chefId,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  })
  await prisma.purchaseOrderItem.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, purchaseOrderId: po3.id, stockItemId: si_contacteur!.id, quantityOrdered: 3, unitPriceCents: 7800, quantityReceived: 0 },
    ],
  })

  console.log(`✓ 3 commandes fournisseurs créées (RECEIVED, ORDERED, DRAFT)`)

  // =========================================================
  // 9. INTERVENTIONS (3 mois d'historique)
  // =========================================================

  // Helper pour créer une intervention avec notes optionnelles
  async function createIntervention(data: {
    id: string
    siteId: string
    machineId?: string
    assignedUserId?: string
    title: string
    description?: string
    type: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION" | "PREDICTIVE"
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    status: "OPEN" | "IN_PROGRESS" | "PENDING_PARTS" | "CLOSED" | "CANCELLED"
    scheduledAt?: Date
    startedAt?: Date
    closedAt?: Date
    actualDurationMinutes?: number
    closingDiagnosis?: string
    recurrenceType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL" | "CUSTOM"
    recurrenceEndsAt?: Date
    parentInterventionId?: string
    createdAt: Date
    notes?: { authorId: string; content: string; daysAgo: number }[]
    partsUsed?: { stockItemId: string; quantity: number }[]
  }) {
    const existing = await prisma.intervention.findUnique({ where: { id: data.id } })
    if (existing) return existing

    const intervention = await prisma.intervention.create({
      data: {
        id: data.id,
        tenantId: tenant.id,
        siteId: data.siteId,
        machineId: data.machineId,
        assignedUserId: data.assignedUserId,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: data.status,
        scheduledAt: data.scheduledAt,
        startedAt: data.startedAt,
        closedAt: data.closedAt,
        actualDurationMinutes: data.actualDurationMinutes,
        closingDiagnosis: data.closingDiagnosis,
        recurrenceType: data.recurrenceType,
        recurrenceEndsAt: data.recurrenceEndsAt,
        parentInterventionId: data.parentInterventionId,
        createdAt: data.createdAt,
        updatedAt: data.closedAt ?? data.startedAt ?? data.createdAt,
      },
    })

    // Notes
    if (data.notes?.length) {
      await prisma.interventionNote.createMany({
        data: data.notes.map((n) => ({
          tenantId: tenant.id,
          interventionId: intervention.id,
          authorUserId: n.authorId,
          content: n.content,
          createdAt: daysAgo(n.daysAgo),
        })),
      })
    }

    // Pièces utilisées
    if (data.partsUsed?.length) {
      await prisma.interventionPartUsed.createMany({
        data: data.partsUsed.map((p) => ({
          tenantId: tenant.id,
          interventionId: intervention.id,
          stockItemId: p.stockItemId,
          quantity: p.quantity,
          usedAt: data.closedAt ?? data.createdAt,
        })),
      })
    }

    return intervention
  }

  // --- PRÉVENTIVES (CLOSED — historique) ---

  await createIntervention({
    id: "int-demo-prev-001",
    siteId: siteA.id, machineId: presseSiteA!.id, assignedUserId: tech1Id,
    title: "Vidange hydraulique — PH-100 (mensuelle)",
    description: "Vidange complète du circuit hydraulique, remplacement huile ISO VG 46. Vérifier niveau huile, pression, fuites.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "CLOSED",
    scheduledAt: daysAgo(85), startedAt: daysAgo(85), closedAt: daysAgo(85),
    actualDurationMinutes: 90, closingDiagnosis: "Vidange effectuée sans anomalie. Huile ancienne en bon état. Niveau remis à neuf.",
    recurrenceType: "MONTHLY", recurrenceEndsAt: new Date("2026-12-31"),
    createdAt: daysAgo(90),
    notes: [
      { authorId: tech1Id, content: "Intervention réalisée dans les temps. Aucune fuite détectée sur les raccords.", daysAgo: 85 },
      { authorId: chefId, content: "Bon travail. Penser à commander de l'huile pour le prochain mois.", daysAgo: 84 },
    ],
    partsUsed: [{ stockItemId: si_huileA!.id, quantity: 15 }],
  })

  await createIntervention({
    id: "int-demo-prev-002",
    siteId: siteA.id, machineId: tourCnc!.id, assignedUserId: tech2Id,
    title: "Graissage et vérification tour CNC (mensuel)",
    description: "Graissage points de lubrification, vérification fixations, contrôle jeu sur axes X/Y/Z.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "CLOSED",
    scheduledAt: daysAgo(82), startedAt: daysAgo(82), closedAt: daysAgo(82),
    actualDurationMinutes: 45, closingDiagnosis: "Graissage complet. Jeu axe Z légèrement augmenté — à surveiller au prochain entretien.",
    recurrenceType: "MONTHLY",
    createdAt: daysAgo(85),
    partsUsed: [{ stockItemId: si_graisse!.id, quantity: 1 }],
    notes: [
      { authorId: tech2Id, content: "Jeu axe Z mesuré à 0.08mm (normal < 0.05mm). Signalé à la supervision.", daysAgo: 82 },
    ],
  })

  await createIntervention({
    id: "int-demo-prev-003",
    siteId: siteA.id, machineId: compresseur!.id, assignedUserId: tech2Id,
    title: "Remplacement filtre à air CA-75",
    description: "Remplacement filtre air compresseur Atlas Copco GA75. Nettoyage séparateur d'huile.",
    type: "PREVENTIVE", priority: "LOW", status: "CLOSED",
    scheduledAt: daysAgo(75), startedAt: daysAgo(75), closedAt: daysAgo(75),
    actualDurationMinutes: 30, closingDiagnosis: "Filtre remplacé. Pression de service stable à 8 bars. Pas de fuite détectée.",
    recurrenceType: "QUARTERLY",
    createdAt: daysAgo(78),
    partsUsed: [{ stockItemId: si_filtreAir!.id, quantity: 1 }],
  })

  await createIntervention({
    id: "int-demo-prev-004",
    siteId: siteA.id, machineId: presseSiteA!.id, assignedUserId: tech1Id,
    title: "Inspection sécurité presse PH-100",
    description: "Vérification arrêt d'urgence, protecteurs, carters, circuit hydraulique visible. Test pression nominale.",
    type: "INSPECTION", priority: "HIGH", status: "CLOSED",
    scheduledAt: daysAgo(60), startedAt: daysAgo(60), closedAt: daysAgo(60),
    actualDurationMinutes: 120, closingDiagnosis: "Inspection conforme. Un cache-courroie présente une fissure — remplacé à titre préventif. Rapport de conformité établi.",
    createdAt: daysAgo(65),
    notes: [
      { authorId: tech1Id, content: "Cache-courroie fissuré côté moteur. Remplacement immédiat effectué.", daysAgo: 60 },
      { authorId: adminId, content: "Rapport de conformité archivé. Prochaine inspection dans 6 mois.", daysAgo: 59 },
    ],
  })

  await createIntervention({
    id: "int-demo-prev-005",
    siteId: siteA.id, machineId: presseSiteA!.id, assignedUserId: tech1Id,
    title: "Vidange hydraulique — PH-100 (mensuelle)",
    description: "Vidange complète du circuit hydraulique, remplacement huile ISO VG 46.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "CLOSED",
    scheduledAt: daysAgo(55), startedAt: daysAgo(55), closedAt: daysAgo(55),
    actualDurationMinutes: 85, closingDiagnosis: "Vidange OK. Légère coloration de l'huile ancienne — normale pour machine en production.",
    recurrenceType: "MONTHLY", recurrenceEndsAt: new Date("2026-12-31"),
    parentInterventionId: "int-demo-prev-001",
    createdAt: daysAgo(58),
    partsUsed: [{ stockItemId: si_huileA!.id, quantity: 10 }],
  })

  await createIntervention({
    id: "int-demo-prev-006",
    siteId: siteA.id, machineId: convoyeur!.id, assignedUserId: tech2Id,
    title: "Vérification tension courroies et bande convoyeur",
    description: "Contrôle tension bande transporteuse, vérification rouleaux, graissage paliers.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "CLOSED",
    scheduledAt: daysAgo(50), startedAt: daysAgo(50), closedAt: daysAgo(50),
    actualDurationMinutes: 60, closingDiagnosis: "Tension OK. 2 roulements de reprise remplacés (signes d'usure). Bande en bon état.",
    recurrenceType: "MONTHLY",
    createdAt: daysAgo(52),
    partsUsed: [{ stockItemId: si_rlt6205A!.id, quantity: 2 }],
  })

  await createIntervention({
    id: "int-demo-prev-007",
    siteId: siteA.id, machineId: tourCnc!.id, assignedUserId: tech2Id,
    title: "Graissage et vérification tour CNC (mensuel)",
    description: "Graissage points de lubrification, vérification fixations, contrôle jeu axes.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "CLOSED",
    scheduledAt: daysAgo(52), startedAt: daysAgo(52), closedAt: daysAgo(52),
    actualDurationMinutes: 50, closingDiagnosis: "Graissage complet. Jeu axe Z stable par rapport au dernier contrôle. RAS.",
    recurrenceType: "MONTHLY",
    parentInterventionId: "int-demo-prev-002",
    createdAt: daysAgo(54),
    partsUsed: [{ stockItemId: si_graisse!.id, quantity: 1 }],
  })

  await createIntervention({
    id: "int-demo-prev-008",
    siteId: siteA.id, machineId: presseSiteA!.id, assignedUserId: tech1Id,
    title: "Vidange hydraulique — PH-100 (mensuelle)",
    description: "Vidange complète du circuit hydraulique, remplacement huile ISO VG 46.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "CLOSED",
    scheduledAt: daysAgo(25), startedAt: daysAgo(25), closedAt: daysAgo(25),
    actualDurationMinutes: 90, closingDiagnosis: "Vidange effectuée. Huile ancienne présentait des particules métalliques — prélevé échantillon pour analyse.",
    recurrenceType: "MONTHLY", recurrenceEndsAt: new Date("2026-12-31"),
    parentInterventionId: "int-demo-prev-005",
    createdAt: daysAgo(28),
    partsUsed: [{ stockItemId: si_huileA!.id, quantity: 15 }, { stockItemId: si_joint!.id, quantity: 3 }],
    notes: [
      { authorId: tech1Id, content: "Particules métalliques détectées dans l'huile ancienne. Possible début d'usure interne. Échantillon envoyé pour analyse lab.", daysAgo: 25 },
      { authorId: chefId, content: "Analyse commandée. Maintien surveillance hebdomadaire pression circuit.", daysAgo: 24 },
    ],
  })

  // --- CORRECTIVES (CLOSED — historique pannes) ---

  await createIntervention({
    id: "int-demo-corr-001",
    siteId: siteA.id, machineId: tourCnc!.id, assignedUserId: tech2Id,
    title: "Panne — Bruit anormal axe X tour CNC",
    description: "Opérateur signale bruit métallique lors des déplacements rapides axe X. Machine arrêtée par sécurité.",
    type: "CORRECTIVE", priority: "HIGH", status: "CLOSED",
    startedAt: daysAgo(70), closedAt: daysAgo(69),
    actualDurationMinutes: 210, closingDiagnosis: "Roulement de guidage axe X HS. Remplacement effectué (2 roulements 6306-2Z). Test cycle complet conforme.",
    createdAt: daysAgo(70),
    partsUsed: [{ stockItemId: si_rlt6306!.id, quantity: 2 }],
    notes: [
      { authorId: tech2Id, content: "Démontage guide linéaire : roulement côté moteur éclaté. Roulement côté opposé présentait des piqûres. Remplacement des 2.", daysAgo: 70 },
      { authorId: chefId, content: "Machine remise en service après test 30mn. Bruit disparu. Consigner l'événement dans le registre maintenance.", daysAgo: 69 },
    ],
  })

  await createIntervention({
    id: "int-demo-corr-002",
    siteId: siteA.id, machineId: compresseur!.id, assignedUserId: tech2Id,
    title: "Fuite huile — compresseur CA-75",
    description: "Fuite huile visible au niveau du joint de carter inférieur. Nappe d'huile au sol constatée lors de la ronde du matin.",
    type: "CORRECTIVE", priority: "MEDIUM", status: "CLOSED",
    startedAt: daysAgo(45), closedAt: daysAgo(45),
    actualDurationMinutes: 75, closingDiagnosis: "Joint de carter inférieur remplacé (réf JOI-PLAT-NBR-20). Nettoyage zone. Compresseur reparti sans fuite.",
    createdAt: daysAgo(45),
    partsUsed: [{ stockItemId: si_joint!.id, quantity: 5 }],
    notes: [
      { authorId: tech2Id, content: "Joint plat d'origine durci et fissuré (âge > 5 ans). Remplacement complet des joints carter.", daysAgo: 45 },
    ],
  })

  await createIntervention({
    id: "int-demo-corr-003",
    siteId: siteA.id, machineId: convoyeur!.id, assignedUserId: tech1Id,
    title: "Arrêt convoyeur — courroie de transmission cassée",
    description: "Arrêt production suite à rupture courroie transmission moteur-réducteur convoyeur CB-12.",
    type: "CORRECTIVE", priority: "CRITICAL", status: "CLOSED",
    startedAt: daysAgo(38), closedAt: daysAgo(38),
    actualDurationMinutes: 40, closingDiagnosis: "Courroie SPA-1500 remplacée. Vérification tendeur — ressort affaibli mais acceptable. Convoyeur remis en service. Arrêt production 1h.",
    createdAt: daysAgo(38),
    partsUsed: [{ stockItemId: si_courroie!.id, quantity: 2 }],
    notes: [
      { authorId: tech1Id, content: "Rupture franche — surcharge possible. Vérifier charge transportée avec le responsable atelier.", daysAgo: 38 },
      { authorId: adminId, content: "Enquête en cours sur la cause de surcharge. Convoyeur OK pour production. Surveiller tendeur.", daysAgo: 37 },
    ],
  })

  await createIntervention({
    id: "int-demo-corr-004",
    siteId: siteB.id, machineId: soudure!.id, assignedUserId: tech2Id,
    title: "Dysfonctionnement bobine soudure — SW-500",
    description: "Fil de soudure ne déroule plus correctement. Patinage du dévidoir détecté par l'opérateur.",
    type: "CORRECTIVE", priority: "MEDIUM", status: "CLOSED",
    startedAt: daysAgo(30), closedAt: daysAgo(30),
    actualDurationMinutes: 25, closingDiagnosis: "Galet presseur dévidoir usé. Remplacement galet (pièce standard). Réglage pression dévidoir. Test soudure OK.",
    createdAt: daysAgo(30),
    notes: [
      { authorId: tech2Id, content: "Galet presseur plat — usure normale après 2 ans. Pièce commandée en stock de sécurité.", daysAgo: 30 },
    ],
  })

  await createIntervention({
    id: "int-demo-corr-005",
    siteId: siteA.id, machineId: fraiseuse!.id, assignedUserId: tech1Id,
    title: "Panne broche fraiseuse DMU 50 — vibrations anormales",
    description: "Vibrations importantes lors de l'usinage. Qualité surface dégradée. Machine arrêtée par l'opérateur.",
    type: "CORRECTIVE", priority: "HIGH", status: "IN_PROGRESS",
    startedAt: daysAgo(5),
    createdAt: daysAgo(6),
    notes: [
      { authorId: tech1Id, content: "Diagnostic initial : roulements de broche suspects. Démontage broche en cours. Pièces de remplacement en commande (BC-2024-002).", daysAgo: 5 },
      { authorId: chefId, content: "BC envoyée chez Festo. Délai estimé 14 jours. Machine hors service pendant ce temps.", daysAgo: 4 },
    ],
  })

  // --- INTERVENTIONS OUVERTES / EN COURS ---

  await createIntervention({
    id: "int-demo-prev-009",
    siteId: siteA.id, machineId: presseSiteA!.id, assignedUserId: tech1Id,
    title: "Vidange hydraulique — PH-100 (mensuelle)",
    description: "Vidange complète du circuit hydraulique, remplacement huile ISO VG 46. Attention aux particules signalées mois dernier.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "OPEN",
    scheduledAt: daysFromNow(3),
    recurrenceType: "MONTHLY", recurrenceEndsAt: new Date("2026-12-31"),
    parentInterventionId: "int-demo-prev-008",
    createdAt: daysAgo(2),
  })

  await createIntervention({
    id: "int-demo-prev-010",
    siteId: siteA.id, machineId: tourCnc!.id, assignedUserId: tech2Id,
    title: "Graissage et vérification tour CNC (mensuel)",
    description: "Graissage points de lubrification, vérification fixations, contrôle jeu axes.",
    type: "PREVENTIVE", priority: "MEDIUM", status: "OPEN",
    scheduledAt: daysFromNow(5),
    recurrenceType: "MONTHLY",
    parentInterventionId: "int-demo-prev-007",
    createdAt: daysAgo(1),
  })

  await createIntervention({
    id: "int-demo-insp-001",
    siteId: siteB.id, machineId: perceuse!.id, assignedUserId: tech2Id,
    title: "Inspection annuelle perceuse PC-32",
    description: "Vérification fixation colonne, mandrin, sécurités, vitesses. Nettoyage copeaux intérieur carter.",
    type: "INSPECTION", priority: "LOW", status: "OPEN",
    scheduledAt: daysFromNow(10),
    createdAt: daysAgo(3),
  })

  await createIntervention({
    id: "int-demo-corr-006",
    siteId: siteA.id, machineId: compresseur!.id,
    title: "Alarme température huile compresseur CA-75",
    description: "Alarme température déclenchée ce matin (TH > 95°C). Compresseur s'est mis en sécurité. Cause à identifier.",
    type: "CORRECTIVE", priority: "HIGH", status: "OPEN",
    createdAt: daysAgo(1),
    notes: [
      { authorId: adminId, content: "Alarme survenue à 08h42. Compresseur arrêté automatiquement. Ventilation vérifiée — filtre air à regarder. Technicien à assigner.", daysAgo: 1 },
    ],
  })

  await createIntervention({
    id: "int-demo-corr-007",
    siteId: siteA.id, machineId: convoyeur!.id, assignedUserId: tech1Id,
    title: "Bruit rouleau de tête convoyeur CB-12",
    description: "Bruit de claquement intermittent sur le rouleau de tête. Signalé par l'opérateur en fin de shift.",
    type: "CORRECTIVE", priority: "MEDIUM", status: "PENDING_PARTS",
    startedAt: daysAgo(3),
    createdAt: daysAgo(3),
    notes: [
      { authorId: tech1Id, content: "Roulement de rouleau de tête à remplacer. Stock insuffisant — 0 roulements 6205 en stock. BC en préparation.", daysAgo: 3 },
      { authorId: tech1Id, content: "BC-003 créée. En attente livraison (5 jours délai).", daysAgo: 2 },
    ],
  })

  console.log(`✓ Interventions créées (préventives, correctives, ouvertes)`)

  // =========================================================
  // 10. RÉSUMÉ FINAL
  // =========================================================

  console.log("\n" + "═".repeat(60))
  console.log("  ✅ Tenant full test créé avec succès !")
  console.log("═".repeat(60))
  console.log("")
  console.log("  TENANT")
  console.log(`    Nom   : MekaSuite Demo`)
  console.log(`    Slug  : mekasuite-demo`)
  console.log(`    ID    : ${tenant.id}`)
  console.log("")
  console.log("  IDENTIFIANTS UTILISATEURS")
  console.log("")
  console.log("  Rôle              Email                          Mot de passe")
  console.log("  " + "─".repeat(70))
  for (const u of USERS) {
    const roleLabel = u.role.padEnd(18)
    const emailLabel = u.email.padEnd(35)
    console.log(`  ${roleLabel} ${emailLabel} ${u.password}`)
  }
  console.log("")
  console.log("  DONNÉES CRÉÉES")
  console.log(`    Sites         : 2 (Atelier A - Production, Atelier B - Maintenance)`)
  console.log(`    Machines      : 8 (5 site A, 3 site B)`)
  console.log(`    Fournisseurs  : 4`)
  console.log(`    Articles stock : 14 (10 site A, 4 site B)`)
  console.log(`    Commandes BC  : 3 (RECEIVED, ORDERED, DRAFT)`)
  console.log(`    Interventions : 16 (8 préventives, 5 correctives, 3 ouvertes/en cours)`)
  console.log(`    Période       : ~3 mois de données réalistes`)
  console.log("")
  console.log("  Se connecter sur : " + (process.env.BETTER_AUTH_URL ?? "http://localhost:3000"))
  console.log("═".repeat(60) + "\n")
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
