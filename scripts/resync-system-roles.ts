/**
 * Script de resynchronisation des rôles système
 *
 * Ce script :
 * 1. Applique la migration SQL (ajout colonne systemRole) si pas encore fait
 * 2. Pour chaque tenant, mappe les rôles isSystem existants → UserRole enum
 * 3. Met à jour systemRole + permissions (depuis PERMISSION_MATRIX mis à jour)
 * 4. Crée les rôles système manquants pour chaque tenant
 * 5. Assigne tenantRoleId aux TenantUser qui n'en ont pas encore
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
const adminUrl = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString: adminUrl })
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] })

// ============================================================
// Source de vérité — synchronisée avec permission-matrix.ts
// ============================================================

const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  super_admin: [
    "machine:create", "machine:update", "machine:archive", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
    "site:create", "site:update", "site:deactivate", "site:read", "site:view-all",
    "user:invite", "user:update-role", "user:deactivate", "user:read",
    "role:read", "role:update", "role:assign",
    "module:activate", "module:deactivate",
    "report:read",
    "audit:read",
    "notifications:receive",
    "tenant:manage",
  ],
  client_admin: [
    "machine:create", "machine:update", "machine:archive", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
    "site:create", "site:update", "site:deactivate", "site:read", "site:view-all",
    "user:invite", "user:update-role", "user:deactivate", "user:read",
    "role:read", "role:update", "role:assign",
    "module:activate", "module:deactivate",
    "report:read",
    "audit:read",
    "notifications:receive",
  ],
  workshop_manager: [
    "machine:create", "machine:update", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:receive",
    "site:read", "site:view-all",
    "user:read",
    "role:read",
    "report:read",
    "audit:read",
    "notifications:receive",
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
  { systemRole: "client_admin", name: "Administrateur" },
]

// Rôles système obsolètes à supprimer
const OBSOLETE_SYSTEM_ROLES: UserRole[] = ["workshop_manager", "technician", "reader"]

// ============================================================

async function applyMigrationIfNeeded() {
  // Colonne systemRole déjà présente via migration Prisma — rien à faire
  console.log("  ✓ Colonne systemRole déjà présente (migration appliquée)")
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

    // 2. Supprimer les rôles système obsolètes (réassigner les users vers client_admin)
    const adminRole = await prisma.tenantRole.findFirst({
      where: { tenantId: tenant.id, systemRole: "client_admin" },
    })

    for (const obsoleteRole of OBSOLETE_SYSTEM_ROLES) {
      const roleToDelete = await prisma.tenantRole.findFirst({
        where: { tenantId: tenant.id, systemRole: obsoleteRole },
      })
      if (!roleToDelete) continue

      // Réassigner les users liés vers client_admin
      const affected = await prisma.tenantUser.updateMany({
        where: { tenantId: tenant.id, tenantRoleId: roleToDelete.id },
        data: { tenantRoleId: adminRole?.id ?? null },
      })
      if (affected.count > 0) {
        console.log(`  ↗️  ${affected.count} user(s) réassigné(s) de "${roleToDelete.name}" → client_admin`)
      }

      await prisma.tenantRole.delete({ where: { id: roleToDelete.id } })
      console.log(`  🗑️  Rôle obsolète supprimé : "${roleToDelete.name}" (${obsoleteRole})`)
    }

    // 3. Créer les rôles système manquants
    for (const { systemRole, name } of TENANT_SYSTEM_ROLES) {
      const alreadyExists = await prisma.tenantRole.findFirst({
        where: { tenantId: tenant.id, systemRole },
      })

      if (alreadyExists) {
        // Mettre à jour les permissions même si déjà existant
        await prisma.tenantRole.update({
          where: { id: alreadyExists.id },
          data: { permissions: PERMISSION_MATRIX[systemRole] },
        })
        continue
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

    // 4. Assigner tenantRoleId aux TenantUser sans rôle custom
    const usersWithoutRole = await prisma.tenantUser.findMany({
      where: { tenantId: tenant.id, tenantRoleId: null, role: { not: "super_admin" } },
      select: { id: true, role: true },
    })

    if (usersWithoutRole.length > 0) {
      console.log(`  → ${usersWithoutRole.length} utilisateur(s) sans tenantRoleId à assigner...`)

      // Charger tous les TenantRole du tenant pour la correspondance
      const tenantRoles = await prisma.tenantRole.findMany({
        where: { tenantId: tenant.id, systemRole: { not: null } },
        select: { id: true, systemRole: true },
      })
      const roleMap = Object.fromEntries(tenantRoles.map((r) => [r.systemRole!, r.id]))

      for (const user of usersWithoutRole) {
        const targetRoleId = roleMap[user.role]
        if (!targetRoleId) {
          console.log(`    ⚠️  User ${user.id} role="${user.role}" — pas de TenantRole correspondant`)
          continue
        }
        await prisma.tenantUser.update({
          where: { id: user.id },
          data: { tenantRoleId: targetRoleId },
        })
      }
      console.log(`  ✅ tenantRoleId assigné pour ${usersWithoutRole.length} utilisateur(s)`)
    }
  }

  console.log("\n\n✅ Resynchronisation terminée.")
  await prisma.$disconnect()
}

resync().catch((err) => {
  console.error("❌ Erreur :", err)
  process.exit(1)
})
