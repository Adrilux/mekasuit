import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { CreditCard, Users, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react"

export default async function SettingsBillingPage() {
  const session = await requireSession()
  assertCan(session, "module:activate")

  const [license, userCount, siteCount] = await Promise.all([
    prisma.license.findUnique({
      where: { tenantId: session.tenantId },
      select: { maxSites: true, maxUsers: true, billingPeriod: true, renewsAt: true },
    }),
    prisma.tenantUser.count({
      where: { tenantId: session.tenantId, isActive: true },
    }),
    prisma.site.count({
      where: { tenantId: session.tenantId, isActive: true },
    }),
  ])

  if (!license) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Licence & Facturation</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Aucune licence trouvée. Contactez votre administrateur.
        </div>
      </div>
    )
  }

  const renewsAt = new Date(license.renewsAt)
  const daysUntilRenewal = Math.ceil((renewsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysUntilRenewal <= 30
  const isExpired = daysUntilRenewal < 0

  const userPct  = Math.min(100, Math.round((userCount / license.maxUsers) * 100))
  const sitePct  = Math.min(100, Math.round((siteCount / license.maxSites) * 100))

  const PERIOD_LABELS: Record<string, string> = {
    monthly: "Mensuel",
    yearly:  "Annuel",
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-5 h-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Licence & Facturation</h1>
      </div>

      {/* Alerte expiration */}
      {(isExpired || isExpiringSoon) && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border mb-6 ${
          isExpired
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">
            {isExpired
              ? "Votre licence a expiré. Contactez-nous pour renouveler."
              : `Votre licence expire dans ${daysUntilRenewal} jour${daysUntilRenewal > 1 ? "s" : ""}.`}
            {" "}
            <a href="mailto:contact@gmao-saas.fr?subject=Renouvellement licence" className="underline font-medium">
              Nous contacter
            </a>
          </p>
        </div>
      )}

      {/* Carte principale */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6">
        {/* Plan */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Plan</p>
            <p className="font-semibold text-slate-900 text-lg">
              {PERIOD_LABELS[license.billingPeriod] ?? license.billingPeriod}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 mb-1">Renouvellement</p>
            <p className={`font-semibold ${isExpired ? "text-red-600" : "text-slate-900"}`}>
              {renewsAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            {!isExpired && !isExpiringSoon && (
              <p className="text-xs text-green-600 flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Actif
              </p>
            )}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Utilisation */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">Utilisation</p>

          {/* Utilisateurs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                Utilisateurs actifs
              </div>
              <span className={`text-sm font-semibold ${userPct >= 90 ? "text-red-600" : userPct >= 70 ? "text-amber-600" : "text-slate-900"}`}>
                {userCount} / {license.maxUsers}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  userPct >= 90 ? "bg-red-500" : userPct >= 70 ? "bg-amber-400" : "bg-blue-500"
                }`}
                style={{ width: `${userPct}%` }}
              />
            </div>
            {userPct >= 90 && (
              <p className="text-xs text-red-600 mt-1">Limite quasi atteinte — contactez-nous pour augmenter.</p>
            )}
          </div>

          {/* Sites */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                Sites actifs
              </div>
              <span className={`text-sm font-semibold ${sitePct >= 90 ? "text-red-600" : sitePct >= 70 ? "text-amber-600" : "text-slate-900"}`}>
                {siteCount} / {license.maxSites}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sitePct >= 90 ? "bg-red-500" : sitePct >= 70 ? "bg-amber-400" : "bg-blue-500"
                }`}
                style={{ width: `${sitePct}%` }}
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Contact */}
        <div className="text-sm text-slate-500">
          Pour modifier votre plan, augmenter vos limites ou renouveler votre licence :{" "}
          <a href="mailto:contact@gmao-saas.fr" className="text-blue-600 hover:underline font-medium">
            contact@gmao-saas.fr
          </a>
        </div>
      </div>
    </div>
  )
}
