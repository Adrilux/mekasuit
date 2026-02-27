"use server"

import { z } from "zod"
import { ModuleName } from "@prisma/client"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { auth } from "@/lib/auth/better-auth-server-config"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  // Tenant info
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug: lettres minuscules, chiffres, tirets uniquement"),

  // License
  maxSites: z.coerce.number().int().min(1).max(100).default(1),
  maxUsers: z.coerce.number().int().min(1).max(1000).default(5),
  billingPeriod: z.enum(["monthly", "yearly"]).default("monthly"),
  renewsAt: z.string().min(1),

  // Modules to activate
  activeModules: z.array(z.nativeEnum(ModuleName)).default(["GMAO"]),

  // Admin user (optional)
  adminMode: z.enum(["none", "existing", "generate"]).default("none"),
  adminEmail: z.string().email().optional(),
  adminName: z.string().min(1).optional(),

  // Initial site (optional)
  firstSiteName: z.string().min(2).optional(),
})

type CreateTenantInput = z.infer<typeof schema>

function generateTempPassword(): string {
  const part1 = Math.random().toString(36).slice(2, 6).toUpperCase()
  const part2 = Math.random().toString(36).slice(2, 6)
  return part1 + part2
}

export async function actionCreateTenant(input: unknown) {
  try {
    await requireSuperAdmin()

    const data: CreateTenantInput = schema.parse(input)
    const {
      name,
      slug,
      maxSites,
      maxUsers,
      billingPeriod,
      renewsAt,
      activeModules,
      adminMode,
      adminEmail,
      adminName,
      firstSiteName,
    } = data

    // 1. Validate slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (existing) {
      throw new ValidationError("Ce slug est déjà utilisé")
    }

    // 2. Build modules data — GMAO always active, others based on activeModules
    const allModules = Object.values(ModuleName)
    const modulesData = allModules.map((module) => ({
      module,
      isActive: activeModules.includes(module),
      activatedAt: activeModules.includes(module) ? new Date() : null,
    }))

    // 3. Create tenant with license + modules
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        license: {
          create: {
            maxSites,
            maxUsers,
            billingPeriod,
            renewsAt: new Date(renewsAt),
          },
        },
        modules: {
          createMany: { data: modulesData },
        },
      },
    })

    // 4. Create initial site if provided
    if (firstSiteName && firstSiteName.trim().length >= 2) {
      await prisma.site.create({
        data: {
          tenantId: tenant.id,
          name: firstSiteName.trim(),
          isActive: true,
        },
      })
    }

    // 5. Handle admin user
    let tempPassword: string | undefined = undefined

    if (adminMode === "existing" && adminEmail) {
      // Look up existing Better Auth user by email
      const user = await prisma.user.findUnique({ where: { email: adminEmail } })
      if (!user) {
        // Roll back tenant creation to keep DB clean
        await prisma.tenant.delete({ where: { id: tenant.id } })
        throw new ValidationError(
          "Aucun compte avec cet email. L'utilisateur doit d'abord s'inscrire via /register"
        )
      }

      const alreadyLinked = await prisma.tenantUser.findFirst({
        where: { authUserId: user.id },
      })
      if (alreadyLinked) {
        await prisma.tenant.delete({ where: { id: tenant.id } })
        throw new ValidationError("Cet utilisateur est déjà lié à un tenant")
      }

      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          authUserId: user.id,
          role: "client_admin",
          isActive: true,
        },
      })
    } else if (adminMode === "generate" && adminEmail && adminName) {
      tempPassword = generateTempPassword()

      // Check if a Better Auth user already exists with this email
      const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })

      let authUserId: string

      if (existingUser) {
        // User already has an account — just link them
        const alreadyLinked = await prisma.tenantUser.findFirst({
          where: { authUserId: existingUser.id },
        })
        if (alreadyLinked) {
          await prisma.tenant.delete({ where: { id: tenant.id } })
          throw new ValidationError("Un compte avec cet email est déjà lié à un tenant")
        }
        authUserId = existingUser.id
        tempPassword = undefined // Don't return a temp password if account already existed
      } else {
        // Create the Better Auth account via the server-side API
        const signUpResult = await auth.api.signUpEmail({
          body: {
            email: adminEmail,
            password: tempPassword,
            name: adminName,
          },
        })

        if (!signUpResult?.user?.id) {
          await prisma.tenant.delete({ where: { id: tenant.id } })
          throw new ValidationError("Échec de la création du compte administrateur")
        }

        authUserId = signUpResult.user.id
      }

      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          authUserId,
          role: "client_admin",
          isActive: true,
        },
      })
    }

    return success({
      tenant,
      tempPassword,
      adminEmail: adminMode !== "none" ? adminEmail : undefined,
    })
  } catch (error) {
    return handleServerActionError(error)
  }
}
