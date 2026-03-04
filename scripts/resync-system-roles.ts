/**
 * Script de resynchronisation des rôles système
 *
 * Problème résolu : les TenantRole avec isSystem=true en base ont des permissions
 * incomplètes ou manquantes, et le champ systemRole (nouveau) est NULL.
 *
 * Ce script :
 * 1. Applique la migration SQL (ajout colonne systemRole) si pas encore fait
 * 2. Pour chaque tenant, mappe les rôles isSystem existants → UserRole enum
 * 3. Met à jour systemRole + permissions (depuis PERMISSION_MATRIX)
 * 4. Crée les rôles système manquants pour chaque tenant
 *
 * Idempotent — peut être relancé sans risque.
 *
 * Exécution : DATABASE_URL='postgresql://meka_admin:...' npx tsx scripts/resync-system-roles.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })
config({ path: ".env" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import type { UserRole } from "@prisma/client"

// Sur le VPS : DATABASE_URL doit pointer vers meka_admin (droits DDL + BYPASSRLS)
// Sur Neon dev : utiliser DATABASE_URL_ADMIN si disponible, sinon DATABASE_URL
const adminUrl = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString: adminUrl })
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] })

// ============================================================
// Source de vérité — doit rester synchronisée avec permission-matrix.ts
// ============================================================

const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  super_admin: [
    "machine:create", "machine:update", "machine:archive", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
    "site:create", "site:update", "site:deactivate", "site:read",
    "user:invite", "user:update-role", "user:deactivate", "user:read",
    "module:activate", "module:deactivate",
    "report:read",
    "audit:read",
    "tenant:manage",
  ],
  client_admin: [
    "machine:create", "machine:update", "machine:archive", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
    "site:create", "site:update", "site:deactivate", "site:read",
    "user:invite", "user:update-role", "user:deactivate", "user:read",
    "module:activate", "module:deactivate",
    "report:read",
    "audit:read",
  ],
  workshop_manager: [
    "machine:create", "machine:update", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:receive",
    "site:read",
    "user:read",
    "report:read",
    "audit:read",
  ],
  technician: [
    "machine:read",
    "intervention:create", "intervention:update", "intervention:read",
    "stock:movement", "stock:read",
    "site:read",
  ],
  reader: [
    "machine:read",
    "intervention:read",
    "stock:read",
    "site:read",
    "user:read",
    "report:read",
  ],
}

// Noms français possibles pour chaque rôle système (insensible à la casse)
// Inclut les variantes historiques qui ont pu être créées
const SYSTEM_ROLE_NAME_MAP: Record<string, UserRole> = {
  "administrateur":         "client_admin",
  "admin":                  "client_admin",
  "administrator":          "client_admin",
  "client_admin":           "client_admin",
  "responsable atelier":    "workshop_manager",
  "chef d'atelier":         "workshop_manager",
  "workshop_manager":       "workshop_manager",
  "technicien":             "technician",
  "technician":             "technician",
  "technicien terrain":     "technician",
  "lecteur":                "reader",
  "reader":                 "reader",
  "lecture seule":          "reader",
}

// Rôles à créer pour chaque tenant (super_admin exclu — global)
const TENANT_SYSTEM_ROLES: { systemRole: UserRole; name: string }[] = [
  { systemRole: "client_admin",     name: "Administrateur" },
  { systemRole: "workshop_manager", name: "Responsable Atelier" },
  { systemRole: "technician",       name: "Technicien" },
  { systemRole: "reader",           name: "Lecteur" },
]

// ============================================================

async function applyMigrationIfNeeded() {
  // Vérifie si la colonne systemRole existe déjà
  const result = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tenant_roles' AND column_name = 'systemRole'
    ) as exists
  `
  if (result[0]?.exists) {
    console.log("  ✓ Colonne systemRole déjà présente")
    return
  }

  console.log("  → Ajout de la colonne systemRole...")
  await prisma.$executeRaw`ALTER TABLE tenant_roles ADD COLUMN "systemRole" "UserRole"`
  // Index unique partiel pour éviter les doublons systemRole par tenant
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "tenant_roles_tenantId_systemRole_key"
    ON tenant_roles("tenantId", "systemRole")
  `
  console.log("  ✓ Colonne et index créés")
}

async function resync() {
  console.log("🔄 Resynchronisation des rôles système...\n")

  console.log("1. Vérification migration DDL...")
  await applyMigrationIfNeeded()

  console.log("\n2. Synchronisation des rôles...")
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } })
  console.log(`→ ${tenants.length} tenant(s) trouvé(s)\n`)

  for (const tenant of tenants) {
    console.log(`\n📦 Tenant: ${tenant.name} (${tenant.id})`)

    const existingRoles = await prisma.tenantRole.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, isSystem: true, systemRole: true },
    })

    // 1. Mettre à jour les rôles isSystem existants
    for (const role of existingRoles.filter((r) => r.isSystem)) {
      const key = role.name.toLowerCase().trim()
      const mappedSystemRole = SYSTEM_ROLE_NAME_MAP[key]

      if (!mappedSystemRole) {
        console.log(`  ⚠️  Rôle isSystem "${role.name}" — pas de mapping connu, ignoré`)
        continue
      }

      if (role.systemRole === mappedSystemRole) {
        // Mettre à jour les permissions quand même (peuvent être désynchronisées)
        await prisma.tenantRole.update({
          where: { id: role.id },
          data: { permissions: PERMISSION_MATRIX[mappedSystemRole] },
        })
        console.log(`  ✅ "${role.name}" (${mappedSystemRole}) — permissions resynchronisées`)
        continue
      }

      // Vérifier si un rôle avec ce systemRole existe déjà pour ce tenant
      const duplicate = await prisma.tenantRole.findFirst({
        where: { tenantId: tenant.id, systemRole: mappedSystemRole, id: { not: role.id } },
      })

      if (duplicate) {
        console.log(`  ⚠️  "${role.name}" — doublon avec "${duplicate.name}", ignoré`)
        continue
      }

      await prisma.tenantRole.update({
        where: { id: role.id },
        data: {
          systemRole: mappedSystemRole,
          permissions: PERMISSION_MATRIX[mappedSystemRole],
        },
      })
      console.log(`  ✅ "${role.name}" → systemRole="${mappedSystemRole}" + permissions mises à jour`)
    }

    // 2. Créer les rôles système manquants
    for (const { systemRole, name } of TENANT_SYSTEM_ROLES) {
      const alreadyExists = await prisma.tenantRole.findFirst({
        where: { tenantId: tenant.id, systemRole },
      })

      if (alreadyExists) {
        continue // déjà traité ci-dessus ou déjà existant
      }

      // Éviter collision sur le nom unique
      const nameExists = await prisma.tenantRole.findFirst({
        where: { tenantId: tenant.id, name },
      })
      const finalName = nameExists ? `${name} (système)` : name

      await prisma.tenantRole.create({
        data: {
          tenantId: tenant.id,
          name: finalName,
          systemRole,
          permissions: PERMISSION_MATRIX[systemRole],
          isSystem: true,
        },
      })
      console.log(`  ➕ Créé rôle système "${finalName}" (${systemRole})`)
    }
  }

  console.log("\n\n✅ Resynchronisation terminée.")
  await prisma.$disconnect()
}

resync().catch((err) => {
  console.error("❌ Erreur :", err)
  process.exit(1)
})
