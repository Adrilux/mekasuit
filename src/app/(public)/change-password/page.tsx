import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { Shield } from "lucide-react"

export default async function ChangePasswordPage() {
  const session = await getSession()

  // Pas connecté → login
  if (!session) redirect("/login")

  // Super admin n'a pas de contrainte de changement
  if (session.role === "super_admin") redirect("/admin")

  // Pas de flag → retour dashboard
  if (!session.mustChangePassword) redirect("/dashboard")

  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Changement de mot de passe requis</h1>
          <p className="text-sm text-slate-500 mt-2">
            Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire avant de continuer.
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  )
}
