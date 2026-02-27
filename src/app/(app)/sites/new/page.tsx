import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { SiteForm } from "@/components/sites/site-form"

export default async function NewSitePage() {
  const session = await requireSession()
  assertCan(session.role, "site:create")

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Ajouter un site</h1>
      <SiteForm />
    </div>
  )
}
