import Link from "next/link"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { Shield, Package2, CreditCard, Settings, Settings2, ClipboardList, CheckSquare, FileText } from "lucide-react"

const SETTINGS_SECTIONS = [
  {
    href: "/settings/general",
    icon: Settings2,
    title: "Paramètres généraux",
    description: "Nom de l'organisation et informations générales",
    color: "bg-slate-100 text-slate-600",
  },
  {
    href: "/settings/modules",
    icon: Package2,
    title: "Modules",
    description: "Consultez les modules activés sur votre compte",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/settings/billing",
    icon: CreditCard,
    title: "Licence & Facturation",
    description: "Votre plan, vos limites et la date de renouvellement",
    color: "bg-green-50 text-green-600",
  },
  {
    href: "/settings/roles",
    icon: Shield,
    title: "Rôles personnalisés",
    description: "Créez des rôles avec des permissions sur mesure",
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/settings/audit",
    icon: ClipboardList,
    title: "Journal d'audit",
    description: "Historique des actions réalisées dans votre espace",
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/settings/checklists",
    icon: CheckSquare,
    title: "Modèles de checklists",
    description: "Créez des modèles de points de contrôle réutilisables",
    color: "bg-teal-50 text-teal-600",
  },
  {
    href: "/settings/templates",
    icon: FileText,
    title: "Modèles d'intervention",
    description: "Pré-remplissez vos interventions depuis un modèle réutilisable",
    color: "bg-indigo-50 text-indigo-600",
  },
]

export default async function SettingsPage() {
  const session = await requireSession()
  assertCan(session.role, "module:activate") // seuls client_admin+

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${section.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {section.title}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
