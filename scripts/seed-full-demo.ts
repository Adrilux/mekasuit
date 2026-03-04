/**
 * Seed Full Demo — 2 entreprises, 2 ans de données réalistes
 *
 * TENANT 1 : Acier & Forge Girard — industrie métallurgique, 3 sites
 * TENANT 2 : BioFresh Logistique — agroalimentaire/logistique, 2 sites
 *
 * Exécution :
 *   DATABASE_URL='postgresql://meka_admin:MekaAdmin2024@localhost:5432/mekasuite' npx tsx scripts/seed-full-demo.ts
 *
 * Ce script VIDE d'abord les tables (sauf structure Prisma migrations)
 * puis recrée tout from scratch.
 */

import { config } from "dotenv"
config({ path: ".env.local" })
config({ path: ".env" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

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
// HELPERS
// ============================================================

function daysAgo(n: number, fromDate?: Date): Date {
  const d = fromDate ? new Date(fromDate) : new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3_600_000)
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function upsertAuthUser(email: string, name: string, password: string): Promise<string> {
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "user" WHERE email = ${email} LIMIT 1
  `
  if (existing[0]) return existing[0].id
  const result = await auth.api.signUpEmail({ body: { email, password, name } })
  if (!result?.user?.id) throw new Error(`Échec création auth pour ${email}`)
  return result.user.id
}

// ============================================================
// PURGE — vide toutes les tables applicatives
// ============================================================

async function purgeAll() {
  console.log("🗑️  Purge des données existantes...")

  // Ordre de suppression respectant les FK (feuilles en premier)
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.customReport.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.stockInventoryItem.deleteMany()
  await prisma.stockInventorySession.deleteMany()
  await prisma.stockTransferRequest.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stockItemSupplier.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.interventionPartUsed.deleteMany()
  await prisma.interventionPlannedMaterial.deleteMany()
  await prisma.interventionChecklistItem.deleteMany()
  await prisma.interventionChecklist.deleteMany()
  await prisma.interventionNote.deleteMany()
  await prisma.interventionAttachment.deleteMany()
  await prisma.interventionTimeEntry.deleteMany()
  await prisma.intervention.deleteMany()
  await prisma.interventionTemplateChecklistItem.deleteMany()
  await prisma.interventionTemplate.deleteMany()
  await prisma.checklistTemplateItem.deleteMany()
  await prisma.checklistTemplate.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.machineCounterReading.deleteMany()
  await prisma.machineCounter.deleteMany()
  await prisma.machineComponent.deleteMany()
  await prisma.machineAttachment.deleteMany()
  await prisma.machine.deleteMany()
  await prisma.userSite.deleteMany()
  await prisma.tenantUser.deleteMany()
  await prisma.tenantRole.deleteMany()
  await prisma.tenantModule.deleteMany()
  await prisma.license.deleteMany()
  await prisma.site.deleteMany()
  await prisma.tenant.deleteMany()

  // Purge users Better Auth (sauf super_admin)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@mekasuite.fr"
  await prisma.$executeRaw`DELETE FROM "session"`
  await prisma.$executeRaw`DELETE FROM "account"`
  await prisma.$executeRaw`DELETE FROM "user" WHERE email != ${superAdminEmail}`

  console.log("  ✓ Tables vidées\n")
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("🌱 Seed Full Demo — 2 tenants, 2 ans de données\n")

  await purgeAll()

  // ========================================================
  // TENANT 1 — Acier & Forge Girard
  // ========================================================
  await seedAcierGirard()

  // ========================================================
  // TENANT 2 — BioFresh Logistique
  // ========================================================
  await seedBioFresh()

  console.log("\n✅ Seed terminé avec succès !")
  console.log("\nComptes de connexion :")
  console.log("  ACIER & FORGE GIRARD")
  console.log("    admin@girard.fr       / Girard@Admin2024")
  console.log("    responsable@girard.fr / Girard@Chef2024")
  console.log("    tech1@girard.fr       / Girard@Tech12024")
  console.log("    tech2@girard.fr       / Girard@Tech22024")
  console.log("    tech3@girard.fr       / Girard@Tech32024")
  console.log("    qualite@girard.fr     / Girard@Qualite2024")
  console.log("    direction@girard.fr   / Girard@Dir2024")
  console.log("  BIOFRESH LOGISTIQUE")
  console.log("    admin@biofresh.fr     / BioFresh@Admin2024")
  console.log("    chef@biofresh.fr      / BioFresh@Chef2024")
  console.log("    tech1@biofresh.fr     / BioFresh@Tech12024")
  console.log("    tech2@biofresh.fr     / BioFresh@Tech22024")
  console.log("    logistique@biofresh.fr/ BioFresh@Log2024")
}

// ============================================================
// TENANT 1 — Acier & Forge Girard
// Métallurgie / forge / traitement thermique
// 3 sites, 7 utilisateurs, rôles custom, 2 ans de données
// ============================================================

async function seedAcierGirard() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🏭 TENANT 1 — Acier & Forge Girard")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Acier & Forge Girard",
      slug: "acier-forge-girard",
      isActive: true,
      license: {
        create: {
          maxSites: 10,
          maxUsers: 30,
          billingPeriod: "yearly",
          renewsAt: new Date("2026-12-31"),
        },
      },
      modules: {
        create: [
          { module: "GMAO",              isActive: true,  activatedAt: daysAgo(730) },
          { module: "STOCK_MANAGEMENT",  isActive: true,  activatedAt: daysAgo(720) },
          { module: "ADVANCED_REPORTS",  isActive: true,  activatedAt: daysAgo(500) },
          { module: "INTER_SITE_TRANSFERS", isActive: true, activatedAt: daysAgo(400) },
          { module: "AI_ASSISTANT",      isActive: false },
        ],
      },
    },
  })
  const T = tenant.id
  console.log(`  ✓ Tenant : ${tenant.name}`)

  // 2. Sites
  const s1 = await prisma.site.create({ data: { id: `${T}-s1`, tenantId: T, name: "Forge — Roanne", address: "ZI des Forges, 42300 Roanne", isActive: true } })
  const s2 = await prisma.site.create({ data: { id: `${T}-s2`, tenantId: T, name: "Traitement Thermique — Montbrison", address: "15 rue des Fondeurs, 42600 Montbrison", isActive: true } })
  const s3 = await prisma.site.create({ data: { id: `${T}-s3`, tenantId: T, name: "Atelier Finition — Roanne", address: "ZI des Forges Bât B, 42300 Roanne", isActive: true } })
  console.log(`  ✓ Sites : ${s1.name}, ${s2.name}, ${s3.name}`)

  // 3. Rôles (système + 2 rôles custom)
  const ALL_PERMS = [
    "machine:create","machine:update","machine:archive","machine:read",
    "intervention:create","intervention:update","intervention:close","intervention:cancel","intervention:read","intervention:assign",
    "stock:create","stock:update","stock:movement","stock:movement:cancel","stock:read","stock:transfer:create","stock:transfer:approve",
    "stock:po:create","stock:po:approve","stock:po:receive","stock:po:cancel",
    "site:create","site:update","site:deactivate","site:read","site:view-all",
    "user:invite","user:update-role","user:deactivate","user:read",
    "role:read","role:update","role:assign",
    "module:activate","module:deactivate",
    "report:read","audit:read","notifications:receive",
  ]

  const roleAdmin = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Administrateur", isSystem: true, systemRole: "client_admin",
    permissions: ALL_PERMS,
  }})

  const roleResponsable = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Responsable Atelier", isSystem: true, systemRole: "workshop_manager",
    permissions: [
      "machine:create","machine:update","machine:read",
      "intervention:create","intervention:update","intervention:close","intervention:cancel","intervention:read","intervention:assign",
      "stock:update","stock:movement","stock:movement:cancel","stock:read","stock:transfer:create","stock:transfer:approve",
      "stock:po:create","stock:po:receive",
      "site:read","site:view-all","user:read","role:read",
      "report:read","audit:read","notifications:receive",
    ],
  }})

  const roleTechnicien = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Technicien", isSystem: true, systemRole: "technician",
    permissions: [
      "machine:read","intervention:create","intervention:update","intervention:read",
      "stock:movement","stock:read","site:read",
    ],
  }})

  const roleLecteur = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Lecteur", isSystem: true, systemRole: "reader",
    permissions: ["machine:read","intervention:read","stock:read","site:read","user:read","report:read"],
  }})

  // Rôles custom
  const roleQualite = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Responsable Qualité", isSystem: false,
    permissions: [
      "machine:read","intervention:read","intervention:close",
      "stock:read","site:read","site:view-all","report:read","audit:read",
    ],
  }})

  const roleAcheteur = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Acheteur", isSystem: false,
    permissions: [
      "stock:read","stock:create","stock:update",
      "stock:po:create","stock:po:receive","stock:transfer:create",
      "site:read","site:view-all","report:read",
    ],
  }})

  console.log(`  ✓ Rôles : Administrateur, Responsable Atelier, Technicien, Lecteur + Responsable Qualité, Acheteur`)

  // 4. Utilisateurs Better Auth
  const idAdmin    = await upsertAuthUser("admin@girard.fr",        "Sophie Girard",      "Girard@Admin2024")
  const idChef     = await upsertAuthUser("responsable@girard.fr",  "Marc Tessier",       "Girard@Chef2024")
  const idTech1    = await upsertAuthUser("tech1@girard.fr",        "Julien Moreau",      "Girard@Tech12024")
  const idTech2    = await upsertAuthUser("tech2@girard.fr",        "Fatima Benali",      "Girard@Tech22024")
  const idTech3    = await upsertAuthUser("tech3@girard.fr",        "Romain Lefevre",     "Girard@Tech32024")
  const idQualite  = await upsertAuthUser("qualite@girard.fr",      "Isabelle Perrin",    "Girard@Qualite2024")
  const idDirection= await upsertAuthUser("direction@girard.fr",    "Pierre Girard",      "Girard@Dir2024")

  // TenantUser
  const tuAdmin = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idAdmin, role: "client_admin", tenantRoleId: roleAdmin.id,
    jobTitle: "Responsable Maintenance", isActive: true, joinedAt: daysAgo(730),
  }})
  const tuChef = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idChef, role: "workshop_manager", tenantRoleId: roleResponsable.id,
    jobTitle: "Chef d'Atelier Forge", managerId: idAdmin, isActive: true, joinedAt: daysAgo(720),
  }})
  const tuTech1 = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idTech1, role: "technician", tenantRoleId: roleTechnicien.id,
    jobTitle: "Technicien de maintenance", managerId: idChef, isActive: true, joinedAt: daysAgo(700),
  }})
  const tuTech2 = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idTech2, role: "technician", tenantRoleId: roleTechnicien.id,
    jobTitle: "Technicienne hydraulique", managerId: idChef, isActive: true, joinedAt: daysAgo(680),
  }})
  const tuTech3 = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idTech3, role: "technician", tenantRoleId: roleTechnicien.id,
    jobTitle: "Technicien électricité", managerId: idChef, isActive: true, joinedAt: daysAgo(300),
  }})
  const tuQualite = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idQualite, role: "reader", tenantRoleId: roleQualite.id,
    jobTitle: "Responsable Qualité & HSE", managerId: idAdmin, isActive: true, joinedAt: daysAgo(650),
  }})
  const tuDirection = await prisma.tenantUser.create({ data: {
    tenantId: T, authUserId: idDirection, role: "reader", tenantRoleId: roleLecteur.id,
    jobTitle: "Directeur Général", isActive: true, joinedAt: daysAgo(730),
  }})
  console.log(`  ✓ 7 utilisateurs créés`)

  // UserSites
  await prisma.userSite.createMany({ data: [
    // Admin et Direction : tous les sites
    { tenantId: T, tenantUserId: tuAdmin.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuAdmin.id, siteId: s2.id },
    { tenantId: T, tenantUserId: tuAdmin.id, siteId: s3.id },
    { tenantId: T, tenantUserId: tuDirection.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuDirection.id, siteId: s2.id },
    { tenantId: T, tenantUserId: tuDirection.id, siteId: s3.id },
    { tenantId: T, tenantUserId: tuQualite.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuQualite.id, siteId: s2.id },
    { tenantId: T, tenantUserId: tuQualite.id, siteId: s3.id },
    // Chef : sites 1 et 2
    { tenantId: T, tenantUserId: tuChef.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuChef.id, siteId: s2.id },
    // Tech1 et Tech2 : site 1 (Forge Roanne)
    { tenantId: T, tenantUserId: tuTech1.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuTech2.id, siteId: s1.id },
    // Tech3 : sites 2 et 3
    { tenantId: T, tenantUserId: tuTech3.id, siteId: s2.id },
    { tenantId: T, tenantUserId: tuTech3.id, siteId: s3.id },
  ]})

  // 5. Fournisseurs
  const fournisseurs = await Promise.all([
    prisma.supplier.create({ data: { tenantId: T, name: "Rexnord Industries",   email: "commandes@rexnord.fr",    phone: "04 77 12 34 56" }}),
    prisma.supplier.create({ data: { tenantId: T, name: "SKF France",           email: "ventes@skf.fr",           phone: "01 49 38 88 88" }}),
    prisma.supplier.create({ data: { tenantId: T, name: "Parker Hannifin",      email: "orders.fr@parker.com",    phone: "04 72 75 55 55" }}),
    prisma.supplier.create({ data: { tenantId: T, name: "Graiss'All Pro",       email: "contact@graissall.fr",    phone: "04 77 45 23 10" }}),
    prisma.supplier.create({ data: { tenantId: T, name: "Würth Industrie",      email: "pro@wurth.fr",            phone: "0825 822 822" }}),
  ])
  const [fRexnord, fSKF, fParker, fGraiss, fWurth] = fournisseurs
  console.log(`  ✓ 5 fournisseurs`)

  // 6. Machines — Site Forge Roanne (s1)
  const machines_s1 = await Promise.all([
    prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Marteau Pilon MP-400", serialNumber: "MP400-2019-042", category: "Forge", manufacturer: "Schuler AG", model: "HYDRAULIC 400", status: "OPERATIONAL", installedAt: daysAgo(1200), notes: "Marteau hydraulique 400T — révisé en 2023" }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Presse Excentrique PE-250", serialNumber: "PE250-2020-011", category: "Forge", manufacturer: "Seyi", model: "SN2-250", status: "OPERATIONAL", installedAt: daysAgo(900) }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Induction Four IF-6", serialNumber: "IF6-2018-007", category: "Chauffage", manufacturer: "EFD Induction", model: "ProHeat 6000", status: "UNDER_MAINTENANCE", installedAt: daysAgo(1800), notes: "Four induction 6kW — problème inducteur en cours" }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Robot Soudage RS-1", serialNumber: "RS1-2021-003", category: "Soudage", manufacturer: "KUKA", model: "KR 6 R700", status: "OPERATIONAL", installedAt: daysAgo(700) }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Compresseur Atlas CA-200", serialNumber: "CA200-2017-002", category: "Air comprimé", manufacturer: "Atlas Copco", model: "GA200", status: "OPERATIONAL", installedAt: daysAgo(2100) }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Pont Roulant PR-10T", serialNumber: "PR10-2015-001", category: "Manutention", manufacturer: "Verlinde", model: "EUROBLOC VT10", status: "DECOMMISSIONED", installedAt: daysAgo(3200), notes: "Mis hors service — remplacement prévu Q2 2025" }}),
  ])

  // Machines — Site Traitement Thermique (s2)
  const machines_s2 = await Promise.all([
    prisma.machine.create({ data: { tenantId: T, siteId: s2.id, name: "Four Cémentation FC-800", serialNumber: "FC800-2019-002", category: "Traitement Thermique", manufacturer: "Ipsen", model: "TurboTreater 800", status: "OPERATIONAL", installedAt: daysAgo(1400) }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s2.id, name: "Four Trempe FT-500", serialNumber: "FT500-2020-001", category: "Traitement Thermique", manufacturer: "ECM Technologies", model: "FicTHERM 500", status: "OPERATIONAL", installedAt: daysAgo(1100) }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s2.id, name: "Bac Trempe Huile BH-1", serialNumber: "BH1-2020-001", category: "Traitement Thermique", manufacturer: "Interne", model: "Custom", status: "OPERATIONAL", installedAt: daysAgo(1100) }}),
  ])

  // Machines — Site Finition (s3)
  const machines_s3 = await Promise.all([
    prisma.machine.create({ data: { tenantId: T, siteId: s3.id, name: "Rectifieuse Plane RP-600", serialNumber: "RP600-2021-001", category: "Usinage", manufacturer: "Blohm", model: "Profimat 415", status: "OPERATIONAL", installedAt: daysAgo(800) }}),
    prisma.machine.create({ data: { tenantId: T, siteId: s3.id, name: "Sableuse Industrielle SB-50", serialNumber: "SB50-2018-003", category: "Traitement Surface", manufacturer: "Wheelabrator", model: "TITAN 50", status: "OPERATIONAL", installedAt: daysAgo(1800) }}),
  ])

  const [mp400, pe250, if6, rs1, ca200] = machines_s1
  const [fc800, ft500] = machines_s2
  const [rp600, sb50] = machines_s3

  console.log(`  ✓ 11 machines (dont 1 UNDER_MAINTENANCE, 1 DECOMMISSIONED)`)

  // 7. Compteurs
  await prisma.machineCounter.create({ data: {
    tenantId: T, machineId: mp400.id, name: "Heures moteur", unit: "h",
    currentValue: 4847, thresholdValue: 5000, thresholdInterval: 1000,
    triggerTitle: "Révision 1000h marteau pilon", triggerPriority: "HIGH",
  }})
  await prisma.machineCounter.create({ data: {
    tenantId: T, machineId: ca200.id, name: "Heures compresseur", unit: "h",
    currentValue: 12340, thresholdValue: 12500, thresholdInterval: 2000,
    triggerTitle: "Maintenance 2000h compresseur", triggerPriority: "MEDIUM",
  }})
  await prisma.machineCounter.create({ data: {
    tenantId: T, machineId: pe250.id, name: "Cycles presse", unit: "cycles",
    currentValue: 284500, thresholdValue: 300000, thresholdInterval: 50000,
    triggerTitle: "Révision 50k cycles — roulements", triggerPriority: "HIGH",
  }})

  // 8. Stock — Site Forge Roanne (s1)
  const stock_s1 = await Promise.all([
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "ROL-6205-2RS", name: "Roulement 6205-2RS", unit: "pièce", quantityOnHand: 2, minimumLevel: 5, unitCostCents: 1890 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "ROL-6308-ZZ", name: "Roulement 6308-ZZ", unit: "pièce", quantityOnHand: 0, minimumLevel: 3, unitCostCents: 3450 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "JT-NBR-40x55x8", name: "Joint torique NBR 40x55x8", unit: "pièce", quantityOnHand: 12, minimumLevel: 10, unitCostCents: 380 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "HYD-FILTER-LH25", name: "Filtre hydraulique LH25", unit: "pièce", quantityOnHand: 4, minimumLevel: 2, unitCostCents: 8900 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "HYD-HUILE-46-5L", name: "Huile hydraulique ISO 46 (5L)", unit: "bidon", quantityOnHand: 8, minimumLevel: 4, unitCostCents: 2450 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "GRAISSE-EP2-400G", name: "Graisse EP2 (cartouche 400g)", unit: "cartouche", quantityOnHand: 24, minimumLevel: 10, unitCostCents: 690 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "COURROIE-SPA-1700", name: "Courroie trapézoïdale SPA 1700", unit: "pièce", quantityOnHand: 3, minimumLevel: 2, unitCostCents: 2890 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "FUSIBLE-63A-AM", name: "Fusible 63A AM", unit: "pièce", quantityOnHand: 1, minimumLevel: 6, unitCostCents: 450 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "INDUCTEUR-EFD-S6", name: "Inducteur EFD série 6", unit: "pièce", quantityOnHand: 0, minimumLevel: 1, unitCostCents: 145000 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "CONTACT-KM50", name: "Contacteur KM50A Schneider", unit: "pièce", quantityOnHand: 5, minimumLevel: 2, unitCostCents: 7800 }}),
  ])

  // Stock — Site Traitement Thermique (s2)
  const stock_s2 = await Promise.all([
    prisma.stockItem.create({ data: { tenantId: T, siteId: s2.id, reference: "THERMO-K-TYPE", name: "Thermocouple type K ø6 L=500", unit: "pièce", quantityOnHand: 6, minimumLevel: 3, unitCostCents: 4500 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s2.id, reference: "HUILE-TREMPE-25L", name: "Huile de trempe Quenching 68 (25L)", unit: "bidon", quantityOnHand: 3, minimumLevel: 2, unitCostCents: 18900 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s2.id, reference: "RESISTANCE-2KW", name: "Résistance de chauffage 2kW", unit: "pièce", quantityOnHand: 0, minimumLevel: 2, unitCostCents: 8700 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s2.id, reference: "POMPE-CENTRIFUGE-P5", name: "Pompe centrifuge P5 bac trempe", unit: "pièce", quantityOnHand: 1, minimumLevel: 1, unitCostCents: 34500 }}),
  ])

  // Stock — Site Finition (s3)
  const stock_s3 = await Promise.all([
    prisma.stockItem.create({ data: { tenantId: T, siteId: s3.id, reference: "MEULE-CB-250", name: "Meule corindon blanc ø250", unit: "pièce", quantityOnHand: 7, minimumLevel: 4, unitCostCents: 3200 }}),
    prisma.stockItem.create({ data: { tenantId: T, siteId: s3.id, reference: "MEDIA-SABLAGE-S330", name: "Grenaille acier S330 (25kg)", unit: "sac", quantityOnHand: 15, minimumLevel: 5, unitCostCents: 8900 }}),
  ])

  const [rol6205, rol6308, jtNBR, hydFilter, hydHuile, graisse, courroie, fusible, inducteur, contacteur] = stock_s1
  const [thermoK, huileTrempe, resistance, pompeCentri] = stock_s2

  console.log(`  ✓ 16 articles de stock (dont 3 à zéro, 3 sous seuil minimum)`)

  // Liens fournisseurs → stock
  await prisma.stockItemSupplier.createMany({ data: [
    { tenantId: T, stockItemId: rol6205.id, supplierId: fSKF.id, supplierReference: "SKF-6205-2RSH", purchasePriceCents: 1650, leadTimeDays: 3 },
    { tenantId: T, stockItemId: rol6308.id, supplierId: fSKF.id, supplierReference: "SKF-6308-ZZ", purchasePriceCents: 3100, leadTimeDays: 3 },
    { tenantId: T, stockItemId: rol6308.id, supplierId: fWurth.id, supplierReference: "WURTH-6308-ZZ", purchasePriceCents: 3250, leadTimeDays: 5 },
    { tenantId: T, stockItemId: hydFilter.id, supplierId: fParker.id, supplierReference: "PAR-LH25-004", purchasePriceCents: 7900, leadTimeDays: 7 },
    { tenantId: T, stockItemId: hydHuile.id, supplierId: fParker.id, supplierReference: "PAR-HF46-5L", purchasePriceCents: 2100, leadTimeDays: 2 },
    { tenantId: T, stockItemId: graisse.id, supplierId: fGraiss.id, supplierReference: "GA-EP2-400", purchasePriceCents: 590, leadTimeDays: 2 },
    { tenantId: T, stockItemId: inducteur.id, supplierId: fRexnord.id, supplierReference: "EFD-IND-S6", purchasePriceCents: 130000, leadTimeDays: 21 },
    { tenantId: T, stockItemId: fusible.id, supplierId: fWurth.id, supplierReference: "WURTH-FUSE-63AM", purchasePriceCents: 380, leadTimeDays: 1 },
  ]})

  // 9. Mouvements de stock historiques (2 ans)
  // ROL-6205 — plusieurs entrées/sorties
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: rol6205.id, type: "IN",  quantity: 10, reason: "Commande fournisseur N°2023-041", operatorId: idAdmin, createdAt: daysAgo(700) },
    { tenantId: T, stockItemId: rol6205.id, type: "OUT", quantity: 2,  reason: "Intervention MP400 — roulements", operatorId: idTech1, createdAt: daysAgo(600) },
    { tenantId: T, stockItemId: rol6205.id, type: "OUT", quantity: 3,  reason: "Intervention PE250 — révision", operatorId: idTech2, createdAt: daysAgo(400) },
    { tenantId: T, stockItemId: rol6205.id, type: "IN",  quantity: 6,  reason: "Commande fournisseur N°2024-012", operatorId: idAdmin, createdAt: daysAgo(200) },
    { tenantId: T, stockItemId: rol6205.id, type: "OUT", quantity: 1,  reason: "Urgence compresseur", operatorId: idTech1, createdAt: daysAgo(80) },
    { tenantId: T, stockItemId: rol6205.id, type: "OUT", quantity: 8,  reason: "Remplacement préventif parc machines", operatorId: idTech2, createdAt: daysAgo(15) },
  ]})

  // ROL-6308 — épuisé
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: rol6308.id, type: "IN",  quantity: 5,  reason: "Stock initial", operatorId: idAdmin, createdAt: daysAgo(730) },
    { tenantId: T, stockItemId: rol6308.id, type: "OUT", quantity: 2,  reason: "Panne four induction", operatorId: idTech1, createdAt: daysAgo(500) },
    { tenantId: T, stockItemId: rol6308.id, type: "OUT", quantity: 2,  reason: "Révision préventive", operatorId: idTech2, createdAt: daysAgo(300) },
    { tenantId: T, stockItemId: rol6308.id, type: "OUT", quantity: 1,  reason: "Casse urgence four IF-6", operatorId: idTech1, createdAt: daysAgo(20) },
  ]})

  // Fusible — stock critique
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: fusible.id, type: "IN",  quantity: 10, reason: "Commande initiale", operatorId: idAdmin, createdAt: daysAgo(720) },
    { tenantId: T, stockItemId: fusible.id, type: "OUT", quantity: 4,  reason: "Tableau électrique forge", operatorId: idTech3, createdAt: daysAgo(400) },
    { tenantId: T, stockItemId: fusible.id, type: "OUT", quantity: 3,  reason: "Incident électrique compresseur", operatorId: idTech3, createdAt: daysAgo(90) },
    { tenantId: T, stockItemId: fusible.id, type: "OUT", quantity: 2,  reason: "Remplacement préventif", operatorId: idTech3, createdAt: daysAgo(10) },
  ]})

  // Inducteur — épuisé (commandé)
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: inducteur.id, type: "IN",  quantity: 1, reason: "Stock de secours", operatorId: idAdmin, createdAt: daysAgo(600) },
    { tenantId: T, stockItemId: inducteur.id, type: "OUT", quantity: 1, reason: "Remplacement urgence IF-6", operatorId: idTech1, createdAt: daysAgo(25) },
  ]})

  // Résistance s2 — épuisée
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: resistance.id, type: "IN",  quantity: 3, reason: "Commande initiale", operatorId: idAdmin, createdAt: daysAgo(700) },
    { tenantId: T, stockItemId: resistance.id, type: "OUT", quantity: 2, reason: "Révision four FC800", operatorId: idTech3, createdAt: daysAgo(350) },
    { tenantId: T, stockItemId: resistance.id, type: "OUT", quantity: 1, reason: "Panne urgence FT500", operatorId: idTech3, createdAt: daysAgo(60) },
  ]})

  // Quelques mouvements sur d'autres articles
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: hydHuile.id, type: "IN",  quantity: 20, reason: "Commande annuelle", operatorId: idAdmin, createdAt: daysAgo(365) },
    { tenantId: T, stockItemId: hydHuile.id, type: "OUT", quantity: 12, reason: "Vidange hydraulique marteaux", operatorId: idTech2, createdAt: daysAgo(200) },
    { tenantId: T, stockItemId: graisse.id,  type: "IN",  quantity: 50, reason: "Commande mensuelle", operatorId: idChef, createdAt: daysAgo(90) },
    { tenantId: T, stockItemId: graisse.id,  type: "OUT", quantity: 26, reason: "Lubrification mensuelle parc", operatorId: idTech1, createdAt: daysAgo(30) },
    { tenantId: T, stockItemId: jtNBR.id,    type: "IN",  quantity: 20, reason: "Réapprovisionnement", operatorId: idAdmin, createdAt: daysAgo(250) },
    { tenantId: T, stockItemId: jtNBR.id,    type: "OUT", quantity: 8,  reason: "Divers — interventions", operatorId: idTech2, createdAt: daysAgo(120) },
  ]})
  console.log(`  ✓ Historique mouvements de stock (2 ans)`)

  // 10. Transferts inter-sites
  const transfer1 = await prisma.stockTransferRequest.create({ data: {
    tenantId: T, fromSiteId: s1.id, toSiteId: s2.id,
    stockItemId: rol6205.id, quantity: 2, status: "COMPLETED",
    requestedById: idChef, approvedById: idAdmin,
    reason: "Dépannage urgent four FC800", createdAt: daysAgo(180), resolvedAt: daysAgo(178),
  }})
  const transfer2 = await prisma.stockTransferRequest.create({ data: {
    tenantId: T, fromSiteId: s1.id, toSiteId: s2.id,
    stockItemId: hydHuile.id, quantity: 3, status: "PENDING",
    requestedById: idTech3, reason: "Stock bas site Montbrison", createdAt: daysAgo(2),
  }})
  const transfer3 = await prisma.stockTransferRequest.create({ data: {
    tenantId: T, fromSiteId: s2.id, toSiteId: s3.id,
    stockItemId: graisse.id, quantity: 5, status: "APPROVED",
    requestedById: idTech3, approvedById: idChef,
    reason: "Rectifieuse RP-600 — entretien mensuel", createdAt: daysAgo(5), resolvedAt: daysAgo(4),
  }})
  console.log(`  ✓ 3 transferts inter-sites (PENDING, APPROVED, COMPLETED)`)

  // 11. Commandes fournisseurs
  const po1 = await prisma.purchaseOrder.create({ data: {
    tenantId: T, siteId: s1.id, supplierId: fSKF.id,
    status: "RECEIVED", createdBy: idAdmin, approvedBy: idChef,
    approvedAt: daysAgo(200), receivedAt: daysAgo(195),
    expectedDeliveryDate: daysAgo(196), createdAt: daysAgo(205),
    notes: "Commande urgente roulements — panne MP400",
    items: { create: [
      { tenantId: T, stockItemId: rol6205.id, quantityOrdered: 10, unitPriceCents: 1650, quantityReceived: 10 },
      { tenantId: T, stockItemId: rol6308.id, quantityOrdered: 5,  unitPriceCents: 3100, quantityReceived: 5 },
    ]},
  }})

  const po2 = await prisma.purchaseOrder.create({ data: {
    tenantId: T, siteId: s1.id, supplierId: fParker.id,
    status: "ORDERED", createdBy: idChef, approvedBy: idAdmin,
    approvedAt: daysAgo(3), expectedDeliveryDate: daysFromNow(7),
    createdAt: daysAgo(5),
    notes: "Réapprovisionnement filtres hydrauliques et huile",
    items: { create: [
      { tenantId: T, stockItemId: hydFilter.id, quantityOrdered: 6, unitPriceCents: 7900, quantityReceived: 0 },
      { tenantId: T, stockItemId: hydHuile.id,  quantityOrdered: 12, unitPriceCents: 2100, quantityReceived: 0 },
    ]},
  }})

  const po3 = await prisma.purchaseOrder.create({ data: {
    tenantId: T, siteId: s1.id, supplierId: fRexnord.id,
    status: "DRAFT", createdBy: idAdmin, createdAt: daysAgo(1),
    notes: "URGENT — inducteur de rechange four IF-6 (en panne)",
    items: { create: [
      { tenantId: T, stockItemId: inducteur.id, quantityOrdered: 2, unitPriceCents: 130000, quantityReceived: 0 },
    ]},
  }})

  const po4 = await prisma.purchaseOrder.create({ data: {
    tenantId: T, siteId: s2.id, supplierId: fWurth.id,
    status: "ORDERED", createdBy: idTech3, approvedBy: idAdmin,
    approvedAt: daysAgo(8), expectedDeliveryDate: daysFromNow(3),
    createdAt: daysAgo(10),
    items: { create: [
      { tenantId: T, stockItemId: fusible.id, quantityOrdered: 20, unitPriceCents: 380, quantityReceived: 0 },
      { tenantId: T, stockItemId: resistance.id, quantityOrdered: 4, unitPriceCents: 8700, quantityReceived: 0 },
    ]},
  }})
  console.log(`  ✓ 4 commandes fournisseurs (DRAFT, ORDERED×2, RECEIVED)`)

  // 12. Templates d'intervention
  const tmplRevision = await prisma.interventionTemplate.create({ data: {
    tenantId: T, name: "Révision mensuelle hydraulique", type: "PREVENTIVE", priority: "MEDIUM",
    description: "Contrôle et maintenance mensuelle circuit hydraulique",
    checklistItems: { create: [
      { tenantId: T, label: "Vérifier niveau huile hydraulique", isRequired: true, position: 0 },
      { tenantId: T, label: "Contrôler pression circuit (min 180 bar)", isRequired: true, position: 1 },
      { tenantId: T, label: "Inspecter flexibles — fuites visuelles", isRequired: true, position: 2 },
      { tenantId: T, label: "Remplacer filtre hydraulique si ΔP > 3 bar", isRequired: false, position: 3 },
      { tenantId: T, label: "Purger condensats bac décantation", isRequired: false, position: 4 },
      { tenantId: T, label: "Enregistrer relevé compteur heures", isRequired: true, position: 5 },
    ]},
  }})

  const tmplLubrif = await prisma.interventionTemplate.create({ data: {
    tenantId: T, name: "Lubrification parc machines", type: "PREVENTIVE", priority: "LOW",
    checklistItems: { create: [
      { tenantId: T, label: "Lubrifier roulements moteur principal", isRequired: true, position: 0 },
      { tenantId: T, label: "Graisser guidages linéaires", isRequired: true, position: 1 },
      { tenantId: T, label: "Vérifier usure courroies", isRequired: false, position: 2 },
      { tenantId: T, label: "Contrôler alignement accouplements", isRequired: false, position: 3 },
    ]},
  }})

  // 13. Interventions — 2 ans de données
  const interventions: { id: string }[] = []

  // === CLOSÉES (historique) ===

  // Révision annuelle MP400 — il y a 14 mois
  const i1 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: mp400.id,
    title: "Révision annuelle marteau pilon MP-400",
    description: "Révision complète programme 2 ans — roulements, joints, vérins hydrauliques",
    type: "PREVENTIVE", priority: "HIGH", status: "CLOSED",
    assignedUserId: idTech2,
    scheduledAt: daysAgo(430), startedAt: daysAgo(429), closedAt: daysAgo(427),
    actualDurationMinutes: 960, closingDiagnosis: "Révision effectuée — roulements paliers remplacés, joints tiroirs OK, pression hydraulique recalée à 220 bar",
    recurrenceType: "ANNUAL", recurrenceIntervalDays: 365,
    createdAt: daysAgo(450),
  }})
  interventions.push(i1)

  // Révision annuelle MP400 — il y a 2 mois (occurrence suivante)
  const i2 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: mp400.id,
    title: "Révision annuelle marteau pilon MP-400",
    description: "Révision complète — 2ème occurrence",
    type: "PREVENTIVE", priority: "HIGH", status: "CLOSED",
    assignedUserId: idTech2,
    scheduledAt: daysAgo(65), startedAt: daysAgo(64), closedAt: daysAgo(62),
    actualDurationMinutes: 840, closingDiagnosis: "Roulements 6205 remplacés × 4, flexibles hydrauliques inspectés OK, huile vidangée et remplacée",
    parentInterventionId: i1.id,
    recurrenceType: "ANNUAL", recurrenceIntervalDays: 365,
    createdAt: daysAgo(65),
  }})
  interventions.push(i2)

  // Panne corrective compresseur — il y a 8 mois
  const i3 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: ca200.id,
    title: "Panne compresseur — fuite circuit refroidissement",
    description: "Compresseur en alarme haute température. Fuite détectée côté échangeur",
    type: "CORRECTIVE", priority: "CRITICAL", status: "CLOSED",
    assignedUserId: idTech1,
    startedAt: daysAgo(240), closedAt: daysAgo(239),
    actualDurationMinutes: 180, closingDiagnosis: "Joint échangeur remplacé (JT-NBR-40x55x8 ×2), test pression OK, redémarrage production",
    createdAt: daysAgo(240),
  }})
  interventions.push(i3)

  // Contrôle robot soudage — il y a 6 mois
  const i4 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: rs1.id,
    title: "Contrôle annuel robot soudage RS-1",
    type: "INSPECTION", priority: "MEDIUM", status: "CLOSED",
    assignedUserId: idTech1,
    scheduledAt: daysAgo(180), startedAt: daysAgo(180), closedAt: daysAgo(179),
    actualDurationMinutes: 240, closingDiagnosis: "Axes 1 à 6 vérifiés, jeux dans tolérances, câblage OK, test cycles production OK",
    recurrenceType: "ANNUAL", createdAt: daysAgo(185),
  }})
  interventions.push(i4)

  // Lubrification trimestrielle — il y a 4 mois (CLOSED)
  const i5 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: mp400.id,
    title: "Lubrification trimestrielle parc forge S1",
    type: "PREVENTIVE", priority: "LOW", status: "CLOSED",
    assignedUserId: idTech1,
    scheduledAt: daysAgo(120), startedAt: daysAgo(120), closedAt: daysAgo(119),
    actualDurationMinutes: 120, closingDiagnosis: "Lubrification effectuée — 8 cartouches EP2 consommées",
    recurrenceType: "QUARTERLY", recurrenceIntervalDays: 90,
    createdAt: daysAgo(125),
  }})
  interventions.push(i5)

  // Panne four induction — RECENT (panne active à cause de l'inducteur manquant)
  const i6 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: if6.id,
    title: "Panne four induction IF-6 — inducteur hors service",
    description: "Four en arrêt total. Inducteur endommagé suite surcharge. Commande pièce en cours (délai 21j).",
    type: "CORRECTIVE", priority: "CRITICAL", status: "PENDING_PARTS",
    assignedUserId: idTech1,
    startedAt: daysAgo(25), createdAt: daysAgo(26),
  }})
  interventions.push(i6)

  // Contrôle mensuel hydraulique — EN COURS
  const i7 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: pe250.id,
    title: "Révision mensuelle hydraulique PE-250",
    description: "Contrôle mensuel circuit hydraulique presse excentrique",
    type: "PREVENTIVE", priority: "MEDIUM", status: "IN_PROGRESS",
    assignedUserId: idTech2,
    scheduledAt: new Date(), startedAt: hoursAgo(2),
    createdAt: daysAgo(1),
  }})
  interventions.push(i7)

  // Lubrification trimestrielle — PLANIFIÉE (prochaine occurrence)
  const i8 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: mp400.id,
    title: "Lubrification trimestrielle parc forge S1",
    type: "PREVENTIVE", priority: "LOW", status: "OPEN",
    scheduledAt: daysFromNow(5),
    parentInterventionId: i5.id,
    recurrenceType: "QUARTERLY", recurrenceIntervalDays: 90,
    createdAt: daysAgo(1),
  }})
  interventions.push(i8)

  // Révision four cémentation — PLANIFIÉE S2
  const i9 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s2.id, machineId: fc800.id,
    title: "Révision semestrielle four cémentation FC-800",
    description: "Remplacement thermocouples, nettoyage résistances, calibration température",
    type: "PREVENTIVE", priority: "HIGH", status: "OPEN",
    assignedUserId: idTech3,
    scheduledAt: daysFromNow(12), createdAt: daysAgo(3),
  }})
  interventions.push(i9)

  // Panne rectifieuse — OUVERTE non assignée
  const i10 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s3.id, machineId: rp600.id,
    title: "Vibrations anormales rectifieuse RP-600",
    description: "Signalement opérateur — vibrations excessives en fin de passe. Meule à inspecter.",
    type: "CORRECTIVE", priority: "HIGH", status: "OPEN",
    createdAt: hoursAgo(4),
  }})
  interventions.push(i10)

  // Révision annuelle sableuse — PLANIFIÉE longue échéance
  const i11 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s3.id, machineId: sb50.id,
    title: "Révision annuelle sableuse SB-50",
    type: "PREVENTIVE", priority: "MEDIUM", status: "OPEN",
    scheduledAt: daysFromNow(45), createdAt: daysAgo(2),
  }})

  // Intervention annulée
  const i12 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: ca200.id,
    title: "Remplacement courroies compresseur — planifié",
    description: "Annulé — compresseur remplacé par modèle neuf lors de la prochaine intervention",
    type: "PREVENTIVE", priority: "LOW", status: "CANCELLED",
    scheduledAt: daysAgo(100), createdAt: daysAgo(110),
  }})

  console.log(`  ✓ 12 interventions (CLOSED, IN_PROGRESS, OPEN, PENDING_PARTS, CANCELLED)`)

  // 14. Notes et pièces consommées sur interventions
  await prisma.interventionNote.createMany({ data: [
    { tenantId: T, interventionId: i6.id, authorUserId: idTech1, content: "Inducteur confirmé HS — test isolation: 0.2MΩ (minimum 10MΩ). Commande effectuée chez Rexnord, délai annoncé 21 jours.", createdAt: daysAgo(24) },
    { tenantId: T, interventionId: i6.id, authorUserId: idChef, content: "Production four reportée sur sous-traitant pendant la réparation. Budget supplémentaire validé.", createdAt: daysAgo(23) },
    { tenantId: T, interventionId: i6.id, authorUserId: idAdmin, content: "Suivi quotidien avec Rexnord — expédition confirmée dans 5 jours.", createdAt: daysAgo(3) },
    { tenantId: T, interventionId: i7.id, authorUserId: idTech2, content: "Pression hydraulique mesurée à 195 bar (spec 200 bar) — recalage en cours sur limiteur de pression.", createdAt: hoursAgo(1) },
    { tenantId: T, interventionId: i10.id, authorUserId: idAdmin, content: "Signalement reçu à 14h30. Technicien non disponible avant demain matin. Vitesse réduite autorisée.", createdAt: hoursAgo(3) },
  ]})

  // Pièces consommées sur interventions fermées
  await prisma.interventionPartUsed.createMany({ data: [
    { tenantId: T, interventionId: i2.id, stockItemId: rol6205.id, quantity: 4, usedAt: daysAgo(63) },
    { tenantId: T, interventionId: i2.id, stockItemId: hydHuile.id, quantity: 1, usedAt: daysAgo(63) },
    { tenantId: T, interventionId: i3.id, stockItemId: jtNBR.id, quantity: 2, usedAt: daysAgo(239) },
    { tenantId: T, interventionId: i5.id, stockItemId: graisse.id, quantity: 8, usedAt: daysAgo(119) },
  ]})

  // Matériaux planifiés pour interventions futures
  await prisma.interventionPlannedMaterial.createMany({ data: [
    { tenantId: T, interventionId: i8.id, stockItemId: graisse.id, quantityPlanned: 6 },
    { tenantId: T, interventionId: i9.id, stockItemId: thermoK.id, quantityPlanned: 3, note: "Remplacement systématique" },
    { tenantId: T, interventionId: i9.id, stockItemId: resistance.id, quantityPlanned: 2 },
  ]})

  // 15. Pointages de temps
  // Intervention i7 — en cours
  await prisma.interventionTimeEntry.create({ data: {
    tenantId: T, interventionId: i7.id, userId: idTech2,
    startedAt: hoursAgo(2), createdAt: hoursAgo(2),
  }})
  // Interventions fermées
  await prisma.interventionTimeEntry.createMany({ data: [
    { tenantId: T, interventionId: i2.id, userId: idTech2, startedAt: daysAgo(64), endedAt: daysAgo(64), durationMinutes: 480 },
    { tenantId: T, interventionId: i2.id, userId: idTech1, startedAt: daysAgo(63), endedAt: daysAgo(63), durationMinutes: 360 },
    { tenantId: T, interventionId: i3.id, userId: idTech1, startedAt: daysAgo(240), endedAt: daysAgo(240), durationMinutes: 180 },
    { tenantId: T, interventionId: i4.id, userId: idTech1, startedAt: daysAgo(180), endedAt: daysAgo(180), durationMinutes: 240 },
  ]})

  // 16. Checklist pour intervention en cours
  const cl1 = await prisma.interventionChecklist.create({ data: {
    tenantId: T, interventionId: i7.id, name: "Contrôle hydraulique mensuel",
  }})
  await prisma.interventionChecklistItem.createMany({ data: [
    { tenantId: T, checklistId: cl1.id, label: "Vérifier niveau huile hydraulique", isRequired: true, isChecked: true, checkedAt: hoursAgo(1.5), checkedBy: idTech2, position: 0 },
    { tenantId: T, checklistId: cl1.id, label: "Contrôler pression circuit", isRequired: true, isChecked: true, checkedAt: hoursAgo(1), checkedBy: idTech2, position: 1 },
    { tenantId: T, checklistId: cl1.id, label: "Inspecter flexibles — fuites visuelles", isRequired: true, isChecked: false, position: 2 },
    { tenantId: T, checklistId: cl1.id, label: "Remplacer filtre si ΔP > 3 bar", isRequired: false, isChecked: false, position: 3 },
  ]})

  // 17. Session d'inventaire (clôturée)
  const invSession = await prisma.stockInventorySession.create({ data: {
    tenantId: T, siteId: s1.id, status: "CLOSED",
    createdBy: idAdmin, closedAt: daysAgo(60), closedBy: idAdmin,
    createdAt: daysAgo(62),
    items: { create: [
      { tenantId: T, stockItemId: rol6205.id, systemQuantity: 6, countedQuantity: 5, note: "1 unité manquante non retrouvée" },
      { tenantId: T, stockItemId: hydFilter.id, systemQuantity: 4, countedQuantity: 4 },
      { tenantId: T, stockItemId: hydHuile.id, systemQuantity: 8, countedQuantity: 8 },
      { tenantId: T, stockItemId: graisse.id, systemQuantity: 30, countedQuantity: 29 },
      { tenantId: T, stockItemId: fusible.id, systemQuantity: 3, countedQuantity: 3 },
    ]},
  }})

  // 18. Rapport custom
  await prisma.customReport.create({ data: {
    tenantId: T, createdBy: idAdmin,
    name: "MTBF Forge Roanne — 2024",
    columns: ["machineName", "mtbfHours", "availabilityRate", "correctiveCount"],
    filters: { siteId: s1.id, from: daysAgo(365).toISOString(), to: new Date().toISOString(), type: "CORRECTIVE" },
  }})
  await prisma.customReport.create({ data: {
    tenantId: T, createdBy: idQualite,
    name: "Suivi interventions critiques — mensuel",
    columns: ["title", "status", "priority", "assignedTech", "closedAt"],
    filters: { priority: "CRITICAL" },
  }})

  // 19. Audit logs
  await prisma.auditLog.createMany({ data: [
    { tenantId: T, userId: idAdmin, action: "machine.created", entityType: "machine", entityId: mp400.id, entityLabel: "Marteau Pilon MP-400", createdAt: daysAgo(1200) },
    { tenantId: T, userId: idAdmin, action: "machine.status_changed", entityType: "machine", entityId: if6.id, entityLabel: "Induction Four IF-6", changes: { from: "OPERATIONAL", to: "UNDER_MAINTENANCE" }, createdAt: daysAgo(25) },
    { tenantId: T, userId: idTech1, action: "intervention.closed", entityType: "intervention", entityId: i3.id, entityLabel: "Panne compresseur — fuite circuit refroidissement", createdAt: daysAgo(239) },
    { tenantId: T, userId: idAdmin, action: "stock.low_alert", entityType: "stock_item", entityId: rol6205.id, entityLabel: "Roulement 6205-2RS", changes: { quantity: 2, minimumLevel: 5 }, createdAt: daysAgo(15) },
    { tenantId: T, userId: idAdmin, action: "user.invited", entityType: "user", entityId: idTech3, entityLabel: "Romain Lefevre", createdAt: daysAgo(300) },
    { tenantId: T, userId: idAdmin, action: "purchase_order.created", entityType: "purchase_order", entityId: po3.id, entityLabel: "Commande Rexnord — inducteur EFD", createdAt: daysAgo(1) },
  ]})

  // 20. Notifications
  await prisma.notification.createMany({ data: [
    { tenantId: T, userId: idAdmin, type: "STOCK_LOW", title: "Stock critique", body: "Roulement 6205-2RS : 2 unité(s) (seuil : 5)", link: `/stock/${rol6205.id}`, createdAt: daysAgo(15) },
    { tenantId: T, userId: idChef,  type: "STOCK_LOW", title: "Stock à zéro", body: "Roulement 6308-ZZ : 0 unité (seuil : 3)", link: `/stock/${rol6308.id}`, createdAt: daysAgo(20) },
    { tenantId: T, userId: idAdmin, type: "STOCK_LOW", title: "Stock critique — fusible", body: "Fusible 63A AM : 1 unité (seuil : 6)", link: `/stock/${fusible.id}`, createdAt: daysAgo(10) },
    { tenantId: T, userId: idAdmin, type: "TRANSFER_PENDING", title: "Transfert en attente", body: "3 × Huile hydraulique — Roanne → Montbrison", link: `/stock/transfers/${transfer2.id}`, createdAt: daysAgo(2) },
    { tenantId: T, userId: idChef,  type: "TRANSFER_PENDING", title: "Transfert en attente", body: "3 × Huile hydraulique — Roanne → Montbrison", link: `/stock/transfers/${transfer2.id}`, createdAt: daysAgo(2) },
    { tenantId: T, userId: idAdmin, type: "INTERVENTION_OVERDUE", title: "Intervention en retard", body: "Vibrations anormales rectifieuse RP-600", link: `/interventions/${i10.id}`, createdAt: hoursAgo(2), readAt: hoursAgo(1) },
  ]})

  console.log(`  ✓ Audit logs, notifications, rapports custom`)
  console.log("  ✅ TENANT 1 complet\n")
}

// ============================================================
// TENANT 2 — BioFresh Logistique
// Agroalimentaire / entrepôts réfrigérés / logistique
// 2 sites, 5 utilisateurs, rôles custom, 2 ans de données
// ============================================================

async function seedBioFresh() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🥶 TENANT 2 — BioFresh Logistique")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  const tenant = await prisma.tenant.create({
    data: {
      name: "BioFresh Logistique",
      slug: "biofresh-logistique",
      isActive: true,
      license: {
        create: {
          maxSites: 5,
          maxUsers: 20,
          billingPeriod: "monthly",
          renewsAt: new Date("2026-06-30"),
        },
      },
      modules: {
        create: [
          { module: "GMAO",             isActive: true,  activatedAt: daysAgo(600) },
          { module: "STOCK_MANAGEMENT", isActive: true,  activatedAt: daysAgo(590) },
          { module: "ADVANCED_REPORTS", isActive: false },
          { module: "INTER_SITE_TRANSFERS", isActive: true, activatedAt: daysAgo(300) },
          { module: "AI_ASSISTANT",     isActive: false },
        ],
      },
    },
  })
  const T = tenant.id
  console.log(`  ✓ Tenant : ${tenant.name}`)

  // Sites
  const s1 = await prisma.site.create({ data: { id: `${T}-s1`, tenantId: T, name: "Entrepôt Froid — Rungis", address: "23 avenue de la Pomme, 94150 Rungis", isActive: true }})
  const s2 = await prisma.site.create({ data: { id: `${T}-s2`, tenantId: T, name: "Plateforme Logistique — Massy", address: "5 rue des Entrepreneurs, 91300 Massy", isActive: true }})
  console.log(`  ✓ Sites : ${s1.name}, ${s2.name}`)

  // Rôles
  const ALL_PERMS = [
    "machine:create","machine:update","machine:archive","machine:read",
    "intervention:create","intervention:update","intervention:close","intervention:cancel","intervention:read","intervention:assign",
    "stock:create","stock:update","stock:movement","stock:movement:cancel","stock:read","stock:transfer:create","stock:transfer:approve",
    "stock:po:create","stock:po:approve","stock:po:receive","stock:po:cancel",
    "site:create","site:update","site:deactivate","site:read","site:view-all",
    "user:invite","user:update-role","user:deactivate","user:read",
    "role:read","role:update","role:assign",
    "module:activate","module:deactivate",
    "report:read","audit:read","notifications:receive",
  ]

  const roleAdmin = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Administrateur", isSystem: true, systemRole: "client_admin", permissions: ALL_PERMS,
  }})
  const roleResponsable = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Responsable Atelier", isSystem: true, systemRole: "workshop_manager",
    permissions: ["machine:create","machine:update","machine:read","intervention:create","intervention:update","intervention:close","intervention:cancel","intervention:read","intervention:assign","stock:update","stock:movement","stock:movement:cancel","stock:read","stock:transfer:create","stock:transfer:approve","stock:po:create","stock:po:receive","site:read","site:view-all","user:read","role:read","report:read","audit:read","notifications:receive"],
  }})
  const roleTechnicien = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Technicien", isSystem: true, systemRole: "technician",
    permissions: ["machine:read","intervention:create","intervention:update","intervention:read","stock:movement","stock:read","site:read"],
  }})
  const roleLecteur = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Lecteur", isSystem: true, systemRole: "reader",
    permissions: ["machine:read","intervention:read","stock:read","site:read","user:read","report:read"],
  }})

  // Rôle custom : Responsable Froid (spécifique agroalimentaire)
  const roleResponsableFroid = await prisma.tenantRole.create({ data: {
    tenantId: T, name: "Responsable Froid & Énergie", isSystem: false,
    permissions: [
      "machine:read","machine:update",
      "intervention:create","intervention:update","intervention:close","intervention:read","intervention:assign",
      "stock:read","stock:movement","site:read","site:view-all",
      "report:read","notifications:receive",
    ],
  }})

  // Utilisateurs
  const idAdmin  = await upsertAuthUser("admin@biofresh.fr",      "Nathalie Voisin",    "BioFresh@Admin2024")
  const idChef   = await upsertAuthUser("chef@biofresh.fr",       "Kevin Blanchet",     "BioFresh@Chef2024")
  const idTech1  = await upsertAuthUser("tech1@biofresh.fr",      "Alexandre Petit",    "BioFresh@Tech12024")
  const idTech2  = await upsertAuthUser("tech2@biofresh.fr",      "Amina Diallo",       "BioFresh@Tech22024")
  const idLogist = await upsertAuthUser("logistique@biofresh.fr", "Thomas Renard",      "BioFresh@Log2024")

  const tuAdmin  = await prisma.tenantUser.create({ data: { tenantId: T, authUserId: idAdmin,  role: "client_admin",    tenantRoleId: roleAdmin.id, jobTitle: "Directrice Technique", isActive: true, joinedAt: daysAgo(600) }})
  const tuChef   = await prisma.tenantUser.create({ data: { tenantId: T, authUserId: idChef,   role: "workshop_manager", tenantRoleId: roleResponsableFroid.id, jobTitle: "Responsable Froid & Énergie", managerId: idAdmin, isActive: true, joinedAt: daysAgo(595) }})
  const tuTech1  = await prisma.tenantUser.create({ data: { tenantId: T, authUserId: idTech1,  role: "technician",       tenantRoleId: roleTechnicien.id, jobTitle: "Technicien frigoriste", managerId: idChef, isActive: true, joinedAt: daysAgo(580) }})
  const tuTech2  = await prisma.tenantUser.create({ data: { tenantId: T, authUserId: idTech2,  role: "technician",       tenantRoleId: roleTechnicien.id, jobTitle: "Technicienne électricité", managerId: idChef, isActive: true, joinedAt: daysAgo(200) }})
  const tuLogist = await prisma.tenantUser.create({ data: { tenantId: T, authUserId: idLogist, role: "reader",           tenantRoleId: roleLecteur.id, jobTitle: "Responsable Logistique", isActive: true, joinedAt: daysAgo(400) }})

  await prisma.userSite.createMany({ data: [
    { tenantId: T, tenantUserId: tuAdmin.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuAdmin.id, siteId: s2.id },
    { tenantId: T, tenantUserId: tuChef.id,  siteId: s1.id },
    { tenantId: T, tenantUserId: tuChef.id,  siteId: s2.id },
    { tenantId: T, tenantUserId: tuTech1.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuTech2.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuTech2.id, siteId: s2.id },
    { tenantId: T, tenantUserId: tuLogist.id, siteId: s1.id },
    { tenantId: T, tenantUserId: tuLogist.id, siteId: s2.id },
  ]})
  console.log(`  ✓ 5 utilisateurs`)

  // Fournisseurs
  const fDanfoss   = await prisma.supplier.create({ data: { tenantId: T, name: "Danfoss Réfrigération", email: "ventes@danfoss.fr", phone: "01 64 62 50 00" }})
  const fCopeland  = await prisma.supplier.create({ data: { tenantId: T, name: "Copeland France",       email: "support@copeland.fr" }})
  const fSchneider = await prisma.supplier.create({ data: { tenantId: T, name: "Schneider Electric",    email: "commandes@schneider.fr", phone: "04 76 60 60 60" }})
  const fGraisse   = await prisma.supplier.create({ data: { tenantId: T, name: "Fuchs Lubrifiants",     email: "pro@fuchs.fr" }})

  // Machines — Entrepôt Rungis (s1)
  const m_comp1 = await prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Groupe Froid GF-1 (Chambre +4°C)", serialNumber: "GF1-2020-003", category: "Froid", manufacturer: "Copeland", model: "ZBD120KCE", status: "OPERATIONAL", installedAt: daysAgo(1000) }})
  const m_comp2 = await prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Groupe Froid GF-2 (Chambre -18°C)", serialNumber: "GF2-2020-004", category: "Froid", manufacturer: "Copeland", model: "ZBD120KCE", status: "OPERATIONAL", installedAt: daysAgo(1000) }})
  const m_conv  = await prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Convoyeur réfrigéré CR-40m", serialNumber: "CR40-2021-001", category: "Convoyeur", manufacturer: "Hamon Thermal", model: "CR-2000", status: "OPERATIONAL", installedAt: daysAgo(800) }})
  const m_elev  = await prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Élévateur à palettes EP-3T", serialNumber: "EP3-2019-007", category: "Manutention", manufacturer: "Still", model: "EXV20", status: "UNDER_MAINTENANCE", installedAt: daysAgo(1400), notes: "Moteur de levage à remplacer" }})
  const m_porte = await prisma.machine.create({ data: { tenantId: T, siteId: s1.id, name: "Porte rapide isolante PRI-1", serialNumber: "PRI1-2022-002", category: "Porte", manufacturer: "Assa Abloy", model: "IsoTherm Pro", status: "OPERATIONAL", installedAt: daysAgo(600) }})

  // Machines — Plateforme Massy (s2)
  const m_tapis = await prisma.machine.create({ data: { tenantId: T, siteId: s2.id, name: "Tapis roulant tri colis TC-30", serialNumber: "TC30-2021-002", category: "Tri", manufacturer: "Vanderlande", model: "POSISORTER", status: "OPERATIONAL", installedAt: daysAgo(700) }})
  const m_robot = await prisma.machine.create({ data: { tenantId: T, siteId: s2.id, name: "Palettiseur automatique PA-1", serialNumber: "PA1-2022-001", category: "Palettisation", manufacturer: "Fanuc", model: "M-410iB/450", status: "OPERATIONAL", installedAt: daysAgo(500) }})
  const m_clip  = await prisma.machine.create({ data: { tenantId: T, siteId: s2.id, name: "Groupe froid stockage GFS-2", serialNumber: "GFS2-2021-001", category: "Froid", manufacturer: "Copeland", model: "ZBD72KCE", status: "OPERATIONAL", installedAt: daysAgo(700) }})

  console.log(`  ✓ 8 machines`)

  // Compteur groupes froid
  await prisma.machineCounter.create({ data: {
    tenantId: T, machineId: m_comp1.id, name: "Heures compresseur", unit: "h",
    currentValue: 6842, thresholdValue: 8000, thresholdInterval: 2000,
    triggerTitle: "Révision 2000h groupe froid", triggerPriority: "HIGH",
  }})
  await prisma.machineCounter.create({ data: {
    tenantId: T, machineId: m_comp2.id, name: "Heures compresseur", unit: "h",
    currentValue: 7920, thresholdValue: 8000, thresholdInterval: 2000,
    triggerTitle: "Révision 2000h groupe froid (-18°C)", triggerPriority: "CRITICAL",
  }})

  // Stock — Rungis (s1)
  const st_huile   = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "HFC-R404A-13KG", name: "Fluide frigorigène R404A (13kg)", unit: "bouteille", quantityOnHand: 2, minimumLevel: 2, unitCostCents: 28000 }})
  const st_filtr   = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "DESSICCANT-DML-164", name: "Déshydrateur DML-164S", unit: "pièce", quantityOnHand: 0, minimumLevel: 2, unitCostCents: 4500 }})
  const st_clem    = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "CLAPET-EVR-15", name: "Clapet solénoïde EVR15", unit: "pièce", quantityOnHand: 3, minimumLevel: 2, unitCostCents: 12800 }})
  const st_relai   = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "RELAI-TEMP-KP61", name: "Pressostat Danfoss KP61", unit: "pièce", quantityOnHand: 4, minimumLevel: 2, unitCostCents: 8900 }})
  const st_graisse = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "GRAISSE-FROID-200G", name: "Graisse basse température −40°C (200g)", unit: "tube", quantityOnHand: 6, minimumLevel: 3, unitCostCents: 1890 }})
  const st_sangles = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "SANGLE-PORTE-RAPIDE", name: "Sangle inférieure porte rapide", unit: "pièce", quantityOnHand: 1, minimumLevel: 2, unitCostCents: 7200 }})
  const st_moteur  = await prisma.stockItem.create({ data: { tenantId: T, siteId: s1.id, reference: "MOTEUR-LEVAGE-EP3T", name: "Moteur de levage 3T (élévateur)", unit: "pièce", quantityOnHand: 0, minimumLevel: 1, unitCostCents: 89000 }})

  // Stock — Massy (s2)
  const st_courr2  = await prisma.stockItem.create({ data: { tenantId: T, siteId: s2.id, reference: "COURROIE-B-1400", name: "Courroie tapis roulant B-1400", unit: "pièce", quantityOnHand: 4, minimumLevel: 2, unitCostCents: 3200 }})
  const st_roleau  = await prisma.stockItem.create({ data: { tenantId: T, siteId: s2.id, reference: "ROULEAU-TC-50", name: "Rouleau convoyeur ø50 L=700", unit: "pièce", quantityOnHand: 8, minimumLevel: 5, unitCostCents: 1450 }})

  console.log(`  ✓ 9 articles de stock (3 en rupture ou stock minimum)`)

  // Liens fournisseurs
  await prisma.stockItemSupplier.createMany({ data: [
    { tenantId: T, stockItemId: st_huile.id,  supplierId: fCopeland.id,  supplierReference: "COP-R404A-13", purchasePriceCents: 25000, leadTimeDays: 5 },
    { tenantId: T, stockItemId: st_filtr.id,  supplierId: fDanfoss.id,   supplierReference: "DAN-DML164S",  purchasePriceCents: 3900, leadTimeDays: 3 },
    { tenantId: T, stockItemId: st_relai.id,  supplierId: fDanfoss.id,   supplierReference: "DAN-KP61",     purchasePriceCents: 7800, leadTimeDays: 3 },
    { tenantId: T, stockItemId: st_moteur.id, supplierId: fSchneider.id, supplierReference: "SCH-MT3T-001", purchasePriceCents: 82000, leadTimeDays: 14 },
    { tenantId: T, stockItemId: st_graisse.id,supplierId: fGraisse.id,   supplierReference: "FUC-BT-200",   purchasePriceCents: 1600, leadTimeDays: 2 },
  ]})

  // Mouvements stock
  await prisma.stockMovement.createMany({ data: [
    { tenantId: T, stockItemId: st_huile.id,  type: "IN",  quantity: 5,  reason: "Stock annuel frigorigène", operatorId: idAdmin, createdAt: daysAgo(550) },
    { tenantId: T, stockItemId: st_huile.id,  type: "OUT", quantity: 2,  reason: "Appoint GF-1 fuite mineure", operatorId: idTech1, createdAt: daysAgo(300) },
    { tenantId: T, stockItemId: st_huile.id,  type: "OUT", quantity: 1,  reason: "Recharge GF-2 révision", operatorId: idTech1, createdAt: daysAgo(100) },
    { tenantId: T, stockItemId: st_filtr.id,  type: "IN",  quantity: 4,  reason: "Commande initiale", operatorId: idAdmin, createdAt: daysAgo(590) },
    { tenantId: T, stockItemId: st_filtr.id,  type: "OUT", quantity: 2,  reason: "Révision annuelle GF-1", operatorId: idTech1, createdAt: daysAgo(200) },
    { tenantId: T, stockItemId: st_filtr.id,  type: "OUT", quantity: 2,  reason: "Révision annuelle GF-2", operatorId: idTech1, createdAt: daysAgo(50) },
    { tenantId: T, stockItemId: st_moteur.id, type: "IN",  quantity: 1,  reason: "Pièce urgence — élévateur HS", operatorId: idAdmin, createdAt: daysAgo(20) },
    { tenantId: T, stockItemId: st_moteur.id, type: "OUT", quantity: 1,  reason: "Montage sur EP-3T en cours", operatorId: idTech2, createdAt: daysAgo(2) },
    { tenantId: T, stockItemId: st_sangles.id,type: "IN",  quantity: 3,  reason: "Maintenance annuelle porte rapide", operatorId: idChef, createdAt: daysAgo(400) },
    { tenantId: T, stockItemId: st_sangles.id,type: "OUT", quantity: 2,  reason: "Remplacement sangles usées", operatorId: idTech2, createdAt: daysAgo(100) },
    { tenantId: T, stockItemId: st_courr2.id, type: "IN",  quantity: 6,  reason: "Stock annuel", operatorId: idAdmin, createdAt: daysAgo(500) },
    { tenantId: T, stockItemId: st_courr2.id, type: "OUT", quantity: 2,  reason: "Remplacement tapis TC-30", operatorId: idTech2, createdAt: daysAgo(150) },
    { tenantId: T, stockItemId: st_roleau.id, type: "IN",  quantity: 20, reason: "Commande initiale", operatorId: idAdmin, createdAt: daysAgo(595) },
    { tenantId: T, stockItemId: st_roleau.id, type: "OUT", quantity: 12, reason: "Remplacement rouleaux usés", operatorId: idTech2, createdAt: daysAgo(200) },
  ]})

  // Transfert inter-sites
  const tf1 = await prisma.stockTransferRequest.create({ data: {
    tenantId: T, fromSiteId: s1.id, toSiteId: s2.id,
    stockItemId: st_graisse.id, quantity: 2, status: "COMPLETED",
    requestedById: idTech2, approvedById: idChef,
    reason: "Palettiseur PA-1 — lubrification urgente", createdAt: daysAgo(50), resolvedAt: daysAgo(49),
  }})
  const tf2 = await prisma.stockTransferRequest.create({ data: {
    tenantId: T, fromSiteId: s2.id, toSiteId: s1.id,
    stockItemId: st_relai.id, quantity: 1, status: "PENDING",
    requestedById: idTech1, reason: "GF-2 pressostat à remplacer rapidement", createdAt: daysAgo(1),
  }})

  // Commandes fournisseurs
  const po1 = await prisma.purchaseOrder.create({ data: {
    tenantId: T, siteId: s1.id, supplierId: fDanfoss.id,
    status: "ORDERED", createdBy: idAdmin, approvedBy: idChef,
    approvedAt: daysAgo(4), expectedDeliveryDate: daysFromNow(2),
    createdAt: daysAgo(6),
    notes: "Réapprovisionnement déshydrateurs + pressostat",
    items: { create: [
      { tenantId: T, stockItemId: st_filtr.id, quantityOrdered: 4, unitPriceCents: 3900, quantityReceived: 0 },
      { tenantId: T, stockItemId: st_relai.id, quantityOrdered: 3, unitPriceCents: 7800, quantityReceived: 0 },
    ]},
  }})

  const po2 = await prisma.purchaseOrder.create({ data: {
    tenantId: T, siteId: s1.id, supplierId: fCopeland.id,
    status: "RECEIVED", createdBy: idChef, approvedBy: idAdmin,
    approvedAt: daysAgo(550), receivedAt: daysAgo(544), expectedDeliveryDate: daysAgo(545),
    createdAt: daysAgo(555),
    items: { create: [
      { tenantId: T, stockItemId: st_huile.id, quantityOrdered: 5, unitPriceCents: 25000, quantityReceived: 5 },
    ]},
  }})

  console.log(`  ✓ 2 transferts, 2 commandes fournisseurs`)

  // Interventions
  // Révision annuelle GF-1 — CLOSED
  const b1 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: m_comp1.id,
    title: "Révision annuelle groupe froid GF-1 (+4°C)",
    description: "Révision complète : déshydrateur, joints, contrôle frigorigène, nettoyage condenseur",
    type: "PREVENTIVE", priority: "HIGH", status: "CLOSED",
    assignedUserId: idTech1,
    scheduledAt: daysAgo(200), startedAt: daysAgo(200), closedAt: daysAgo(198),
    actualDurationMinutes: 480, closingDiagnosis: "Déshydrateur remplacé, R404A complété +0.8kg, température chambre stabilisée à +3.8°C",
    recurrenceType: "ANNUAL", recurrenceIntervalDays: 365,
    createdAt: daysAgo(205),
  }})

  // Panne élévateur — IN PROGRESS
  const b2 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: m_elev.id,
    title: "Panne élévateur EP-3T — moteur de levage grillé",
    description: "Élévateur bloqué en position haute. Moteur de levage hors service (court-circuit). Pièce reçue, démontage en cours.",
    type: "CORRECTIVE", priority: "CRITICAL", status: "IN_PROGRESS",
    assignedUserId: idTech2,
    startedAt: daysAgo(2), createdAt: daysAgo(3),
  }})

  // GF-2 approche seuil compteur — PLANIFIÉE
  const b3 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: m_comp2.id,
    title: "Révision 2000h groupe froid GF-2 (-18°C)",
    description: "Compteur à 7920h — révision urgente avant 8000h. Risque production.",
    type: "PREVENTIVE", priority: "CRITICAL", status: "OPEN",
    assignedUserId: idTech1,
    scheduledAt: daysFromNow(3), createdAt: daysAgo(2),
  }})

  // Maintenance porte rapide — CLOSED
  const b4 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: m_porte.id,
    title: "Remplacement sangles porte rapide PRI-1",
    type: "CORRECTIVE", priority: "MEDIUM", status: "CLOSED",
    assignedUserId: idTech2,
    startedAt: daysAgo(100), closedAt: daysAgo(100),
    actualDurationMinutes: 90, closingDiagnosis: "2 sangles inférieures remplacées, porte testée OK",
    createdAt: daysAgo(101),
  }})

  // Palettiseur inspection — OPEN non assignée
  const b5 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s2.id, machineId: m_robot.id,
    title: "Inspection trimestrielle palettiseur PA-1",
    type: "INSPECTION", priority: "MEDIUM", status: "OPEN",
    scheduledAt: daysFromNow(8), createdAt: daysAgo(1),
  }})

  // Tapis roulant — remplacement courroie CLOSED
  const b6 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s2.id, machineId: m_tapis.id,
    title: "Remplacement courroies tapis TC-30",
    type: "CORRECTIVE", priority: "HIGH", status: "CLOSED",
    assignedUserId: idTech2,
    startedAt: daysAgo(150), closedAt: daysAgo(149),
    actualDurationMinutes: 180, closingDiagnosis: "2 courroies remplacées — test vitesse et détection colis OK",
    createdAt: daysAgo(151),
  }})

  // Inspection réglementaire groupe froid — OPEN planifiée
  const b7 = await prisma.intervention.create({ data: {
    tenantId: T, siteId: s1.id, machineId: m_comp2.id,
    title: "Contrôle réglementaire étanchéité fluide frigorigène",
    description: "Contrôle annuel obligatoire (directive F-Gas) par bureau de contrôle agréé",
    type: "INSPECTION", priority: "HIGH", status: "OPEN",
    scheduledAt: daysFromNow(30), createdAt: daysAgo(5),
  }})

  console.log(`  ✓ 7 interventions (CLOSED, IN_PROGRESS, OPEN×4)`)

  // Notes
  await prisma.interventionNote.createMany({ data: [
    { tenantId: T, interventionId: b2.id, authorUserId: idTech2, content: "Moteur démonté — bobinage noir, clairement en court-circuit. Moteur reçu hier, montage commencé.", createdAt: daysAgo(1) },
    { tenantId: T, interventionId: b2.id, authorUserId: idAdmin, content: "Zone de quai 3 condamnée le temps de la réparation. Direction informée. Livraisons redirigées sur quai 5.", createdAt: daysAgo(2) },
    { tenantId: T, interventionId: b3.id, authorUserId: idChef, content: "GF-2 compteur à 7920h. Température chambre négative tenue mais vibrations légèrement augmentées. Révision en urgence programmée.", createdAt: daysAgo(1) },
  ]})

  // Matériaux planifiés
  await prisma.interventionPlannedMaterial.createMany({ data: [
    { tenantId: T, interventionId: b3.id, stockItemId: st_filtr.id, quantityPlanned: 2, note: "Remplacement systématique" },
    { tenantId: T, interventionId: b3.id, stockItemId: st_huile.id, quantityPlanned: 1, note: "Appoint frigorigène préventif" },
    { tenantId: T, interventionId: b5.id, stockItemId: st_graisse.id, quantityPlanned: 2 },
  ]})

  // Pièces consommées
  await prisma.interventionPartUsed.createMany({ data: [
    { tenantId: T, interventionId: b1.id, stockItemId: st_filtr.id, quantity: 2, usedAt: daysAgo(198) },
    { tenantId: T, interventionId: b4.id, stockItemId: st_sangles.id, quantity: 2, usedAt: daysAgo(100) },
    { tenantId: T, interventionId: b6.id, stockItemId: st_courr2.id, quantity: 2, usedAt: daysAgo(149) },
  ]})

  // Pointages
  await prisma.interventionTimeEntry.create({ data: {
    tenantId: T, interventionId: b2.id, userId: idTech2,
    startedAt: hoursAgo(3), createdAt: hoursAgo(3),
  }})
  await prisma.interventionTimeEntry.createMany({ data: [
    { tenantId: T, interventionId: b1.id, userId: idTech1, startedAt: daysAgo(200), endedAt: daysAgo(200), durationMinutes: 480 },
    { tenantId: T, interventionId: b4.id, userId: idTech2, startedAt: daysAgo(100), endedAt: daysAgo(100), durationMinutes: 90 },
    { tenantId: T, interventionId: b6.id, userId: idTech2, startedAt: daysAgo(150), endedAt: daysAgo(150), durationMinutes: 180 },
  ]})

  // Checklists
  const cl2 = await prisma.interventionChecklist.create({ data: {
    tenantId: T, interventionId: b2.id, name: "Remplacement moteur de levage",
  }})
  await prisma.interventionChecklistItem.createMany({ data: [
    { tenantId: T, checklistId: cl2.id, label: "Consignation électrique tableau EP-3T", isRequired: true, isChecked: true, checkedAt: daysAgo(2), checkedBy: idTech2, position: 0 },
    { tenantId: T, checklistId: cl2.id, label: "Démontage moteur défectueux", isRequired: true, isChecked: true, checkedAt: daysAgo(2), checkedBy: idTech2, position: 1 },
    { tenantId: T, checklistId: cl2.id, label: "Montage moteur neuf + test insulation", isRequired: true, isChecked: true, checkedAt: daysAgo(1), checkedBy: idTech2, position: 2 },
    { tenantId: T, checklistId: cl2.id, label: "Test montée/descente à vide", isRequired: true, isChecked: false, position: 3 },
    { tenantId: T, checklistId: cl2.id, label: "Test charge nominale 3T", isRequired: true, isChecked: false, position: 4 },
    { tenantId: T, checklistId: cl2.id, label: "Déconsignation + remise en service", isRequired: true, isChecked: false, position: 5 },
  ]})

  // Templates
  await prisma.interventionTemplate.create({ data: {
    tenantId: T, name: "Révision annuelle groupe froid", type: "PREVENTIVE", priority: "HIGH",
    checklistItems: { create: [
      { tenantId: T, label: "Vérifier étanchéité circuit frigorigène (détecteur)", isRequired: true, position: 0 },
      { tenantId: T, label: "Contrôler niveau frigorigène", isRequired: true, position: 1 },
      { tenantId: T, label: "Remplacer déshydrateur", isRequired: true, position: 2 },
      { tenantId: T, label: "Nettoyage condenseur (air comprimé)", isRequired: true, position: 3 },
      { tenantId: T, label: "Mesurer températures soufflage/reprise", isRequired: true, position: 4 },
      { tenantId: T, label: "Vérifier résistances de dégivrage", isRequired: false, position: 5 },
      { tenantId: T, label: "Mettre à jour carnet de bord fluides F-Gas", isRequired: true, position: 6 },
    ]},
  }})

  // Inventaire en cours
  const invS = await prisma.stockInventorySession.create({ data: {
    tenantId: T, siteId: s1.id, status: "OPEN",
    createdBy: idChef, createdAt: daysAgo(1),
    items: { create: [
      { tenantId: T, stockItemId: st_huile.id,   systemQuantity: 2, countedQuantity: 2 },
      { tenantId: T, stockItemId: st_filtr.id,   systemQuantity: 0, countedQuantity: null, note: "En attente livraison commande PO-001" },
      { tenantId: T, stockItemId: st_clem.id,    systemQuantity: 3, countedQuantity: 3 },
      { tenantId: T, stockItemId: st_relai.id,   systemQuantity: 4, countedQuantity: null },
      { tenantId: T, stockItemId: st_graisse.id, systemQuantity: 4, countedQuantity: 3, note: "1 tube entamé non comptabilisé" },
    ]},
  }})

  // Notifications
  await prisma.notification.createMany({ data: [
    { tenantId: T, userId: idAdmin, type: "STOCK_LOW", title: "Rupture stock", body: "Déshydrateur DML-164S : 0 unité (seuil : 2)", link: `/stock/${st_filtr.id}`, createdAt: daysAgo(50) },
    { tenantId: T, userId: idChef,  type: "STOCK_LOW", title: "Stock en rupture", body: "Déshydrateur DML-164S : 0 unité (seuil : 2)", link: `/stock/${st_filtr.id}`, createdAt: daysAgo(50), readAt: daysAgo(49) },
    { tenantId: T, userId: idAdmin, type: "STOCK_LOW", title: "Stock critique", body: "Sangle porte rapide : 1 unité (seuil : 2)", link: `/stock/${st_sangles.id}`, createdAt: daysAgo(100) },
    { tenantId: T, userId: idAdmin, type: "TRANSFER_PENDING", title: "Transfert en attente", body: "1 × Pressostat KP61 — Massy → Rungis", link: `/stock/transfers/${tf2.id}`, createdAt: daysAgo(1) },
    { tenantId: T, userId: idChef,  type: "INTERVENTION_OVERDUE", title: "Révision urgente", body: "GF-2 à 7920h/8000h — révision critique", link: `/interventions/${b3.id}`, createdAt: daysAgo(1) },
    { tenantId: T, userId: idTech2, type: "INTERVENTION_ASSIGNED", title: "Intervention assignée", body: "Panne élévateur EP-3T — moteur de levage grillé", link: `/interventions/${b2.id}`, createdAt: daysAgo(3), readAt: daysAgo(3) },
  ]})

  // Audit logs
  await prisma.auditLog.createMany({ data: [
    { tenantId: T, userId: idAdmin, action: "tenant.module_activated", entityType: "module", entityId: "INTER_SITE_TRANSFERS", entityLabel: "Module Transferts Inter-Sites", createdAt: daysAgo(300) },
    { tenantId: T, userId: idAdmin, action: "machine.status_changed", entityType: "machine", entityId: m_elev.id, entityLabel: "Élévateur à palettes EP-3T", changes: { from: "OPERATIONAL", to: "UNDER_MAINTENANCE" }, createdAt: daysAgo(3) },
    { tenantId: T, userId: idTech1, action: "intervention.closed", entityType: "intervention", entityId: b1.id, entityLabel: "Révision annuelle groupe froid GF-1", createdAt: daysAgo(198) },
    { tenantId: T, userId: idAdmin, action: "stock.low_alert", entityType: "stock_item", entityId: st_filtr.id, entityLabel: "Déshydrateur DML-164S", changes: { quantity: 0, minimumLevel: 2 }, createdAt: daysAgo(50) },
    { tenantId: T, userId: idAdmin, action: "user.invited", entityType: "user", entityId: idTech2, entityLabel: "Amina Diallo", createdAt: daysAgo(200) },
  ]})

  console.log(`  ✓ Audit logs, notifications, inventaire en cours`)
  console.log("  ✅ TENANT 2 complet")
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
