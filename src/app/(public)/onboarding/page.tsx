"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, ArrowRight, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { actionCompleteOnboarding } from "@/server/actions/onboarding/action-complete-onboarding"
import { toast } from "sonner"
import Link from "next/link"

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [hasInvitation, setHasInvitation] = useState<boolean | null>(null)

  useEffect(() => {
    // Essaie de compléter l'onboarding automatiquement au chargement de la page
    async function checkAndComplete() {
      const result = await actionCompleteOnboarding()
      if (result.success) {
        setHasInvitation(true)
        toast.success("Invitation acceptée ! Bienvenue dans votre espace.")
        setTimeout(() => { router.push("/dashboard") }, 1500)
      } else if (result.code === "NO_INVITATION") {
        setHasInvitation(false)
      } else {
        // Autre erreur — on affiche le message mais on laisse l'utilisateur réessayer
        setHasInvitation(false)
      }
      setChecked(true)
    }
    checkAndComplete()
  }, [router])

  async function handleRetry() {
    setLoading(true)
    const result = await actionCompleteOnboarding()
    setLoading(false)
    if (result.success) {
      toast.success("Invitation acceptée ! Redirection...")
      router.push("/dashboard")
    } else {
      toast.error(result.error)
    }
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Vérification de votre accès...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6">
          {hasInvitation === true ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Invitation acceptée !</h1>
                <p className="text-slate-500 mt-2 text-sm">
                  Votre accès a été activé. Redirection vers votre espace...
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Bienvenue sur GMAO</h1>
                <p className="text-slate-500 mt-2 text-sm">
                  Votre compte est créé, mais vous n'êtes lié à aucune organisation.
                </p>
              </div>

              <div className="space-y-3 text-left bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-amber-800">Que faire ?</p>
                <ul className="space-y-2 text-amber-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-semibold shrink-0">1.</span>
                    <span>
                      Si vous avez reçu une <strong>invitation</strong> d'un administrateur avec
                      votre email actuel, cliquez sur &laquo;&nbsp;Réessayer&nbsp;&raquo;.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-semibold shrink-0">2.</span>
                    <span>
                      Si vous souhaitez créer une <strong>nouvelle organisation</strong>, cliquez
                      sur &laquo;&nbsp;Créer une organisation&nbsp;&raquo;.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-semibold shrink-0">3.</span>
                    <span>
                      Sinon, demandez à votre administrateur de vous inviter avec l'adresse
                      email de ce compte.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleRetry} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      Réessayer (j'ai une invitation)
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">
                    <Building2 className="w-4 h-4 mr-2" />
                    Créer une organisation
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
