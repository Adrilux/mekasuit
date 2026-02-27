import { notFound, redirect } from "next/navigation"
import { Wrench } from "lucide-react"
import { queryGetMachineBySlug } from "@/server/queries/machines/query-get-machine-by-slug"
import { getSession } from "@/lib/auth/auth-session-helpers"

export default async function MachineQrScanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const machine = await queryGetMachineBySlug(slug)
  if (!machine) notFound()

  // Si l'utilisateur est déjà connecté, rediriger directement vers la fiche machine
  const session = await getSession()
  if (session && session.tenantId === machine.tenantId) {
    redirect(`/machines/${machine.id}`)
  }

  // Sinon, page de landing simple avec le nom de la machine et un bouton de connexion
  const STATUS_LABELS: Record<string, string> = {
    OPERATIONAL: "Opérationnelle",
    UNDER_MAINTENANCE: "En maintenance",
    OUT_OF_SERVICE: "Hors service",
    DECOMMISSIONED: "Déclassée",
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-7 h-7 text-blue-600" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-1">{machine.name}</h1>
        {machine.category && (
          <p className="text-sm text-slate-500 mb-1">{machine.category}</p>
        )}
        <p className="text-sm text-slate-500 mb-4">{machine.site.name}</p>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-6">
          {STATUS_LABELS[machine.status] ?? machine.status}
        </span>

        <div className="border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500 mb-4">
            Connectez-vous pour accéder à la fiche complète et aux interventions.
          </p>
          <a
            href={`/login?next=/m/${slug}`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            Se connecter
          </a>
        </div>
      </div>
    </div>
  )
}
