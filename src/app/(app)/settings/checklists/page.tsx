import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetChecklistTemplates } from "@/server/queries/checklists/query-get-checklist-templates"
import { ChecklistTemplatesManager } from "./checklist-templates-manager"

export default async function ChecklistTemplatesPage() {
  const session = await requireSession()
  assertCan(session, "intervention:update")

  const templates = await queryGetChecklistTemplates(session)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Modèles de checklists</h1>
        <p className="text-sm text-slate-500 mt-1">
          Créez des modèles réutilisables pour vos interventions. Ils seront proposés lors de la création d&apos;une checklist.
        </p>
      </div>

      <ChecklistTemplatesManager templates={templates} />
    </div>
  )
}
