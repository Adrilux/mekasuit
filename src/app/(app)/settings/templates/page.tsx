import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetInterventionTemplates } from "@/server/queries/intervention-templates/query-get-intervention-templates"
import { InterventionTemplatesManager } from "./intervention-templates-manager"

export default async function InterventionTemplatesPage() {
  const session = await requireSession()
  assertCan(session.role, "intervention:update")

  const templates = await queryGetInterventionTemplates(session)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Modèles d&apos;intervention</h1>
        <p className="text-sm text-slate-500 mt-1">
          Créez des modèles réutilisables pour vos préventives. Ils pré-remplissent le formulaire à la création.
        </p>
      </div>
      <InterventionTemplatesManager templates={templates} />
    </div>
  )
}
