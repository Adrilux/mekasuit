import { UserCircle } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { ProfileInfoForm } from "@/components/profile/profile-info-form"
import { ProfilePasswordForm } from "@/components/profile/profile-password-form"

const ROLE_LABELS: Record<string, string> = {
  super_admin:      "Super Admin",
  client_admin:     "Administrateur",
  workshop_manager: "Chef d'atelier",
  technician:       "Technicien",
  reader:           "Lecteur",
}

export default async function ProfilePage() {
  const session = await requireSession()

  // Charger les infos du TenantUser (jobTitle)
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { authUserId: session.id },
    select: { jobTitle: true, joinedAt: true },
  })

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <UserCircle className="w-5 h-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Mon profil</h1>
      </div>

      {/* Infos de base */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-slate-500 mb-0.5">Email</p>
            <p className="font-medium text-slate-900">{session.email}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Rôle</p>
            <p className="font-medium text-slate-900">{ROLE_LABELS[session.role] ?? session.role}</p>
          </div>
          {tenantUser?.jobTitle && (
            <div>
              <p className="text-slate-500 mb-0.5">Poste</p>
              <p className="font-medium text-slate-900">{tenantUser.jobTitle}</p>
            </div>
          )}
          {tenantUser?.joinedAt && (
            <div>
              <p className="text-slate-500 mb-0.5">Membre depuis</p>
              <p className="font-medium text-slate-900">
                {new Date(tenantUser.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
        <ProfileInfoForm initialName={session.name} />
      </section>

      {/* Mot de passe */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Changer de mot de passe</h2>
        <ProfilePasswordForm />
      </section>
    </div>
  )
}
