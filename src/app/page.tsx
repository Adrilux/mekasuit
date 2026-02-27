import type { Metadata } from "next"
import Link from "next/link"
import {
  Wrench,
  ClipboardList,
  Package,
  BarChart3,
  Shield,
  Smartphone,
  Check,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"

export const metadata: Metadata = {
  title: "GMAO Pro — Logiciel de maintenance industrielle pour PME",
  description:
    "Gérez vos machines, interventions et stocks depuis une seule plateforme cloud. Conçu pour les PME industrielles. Déployé en 24h.",
}

const FEATURES = [
  {
    icon: Wrench,
    title: "Suivi des machines",
    description:
      "Inventaire complet de votre parc machines, QR codes terrain, historique des pannes et des interventions par équipement.",
  },
  {
    icon: ClipboardList,
    title: "Gestion des interventions",
    description:
      "Créez, assignez et clôturez vos interventions correctives et préventives. Planification des maintenances récurrentes.",
  },
  {
    icon: Package,
    title: "Gestion des stocks",
    description:
      "Suivi des pièces détachées, alertes de rupture automatiques, consommation liée aux interventions.",
  },
  {
    icon: BarChart3,
    title: "Rapports & KPIs",
    description:
      "MTBF, taux de disponibilité, charge technicien — visualisez la performance de votre maintenance.",
  },
  {
    icon: Shield,
    title: "Multi-sites sécurisé",
    description:
      "Isolation totale des données par entreprise, gestion des accès par rôles, conformité RGPD.",
  },
  {
    icon: Smartphone,
    title: "Accessible partout",
    description:
      "Application web PWA utilisable sur tablette et mobile, même sans connexion internet stable.",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Nous configurons votre espace",
    description:
      "En moins de 24h, votre environnement est prêt avec vos sites, votre équipe et vos modules activés.",
  },
  {
    number: "02",
    title: "Vous importez votre parc machines",
    description:
      "Ajoutez vos équipements, imprimez les QR codes générés automatiquement et collez-les sur vos machines.",
  },
  {
    number: "03",
    title: "Votre équipe prend en main",
    description:
      "Les techniciens reçoivent leurs accès et peuvent gérer les interventions depuis leur poste ou leur mobile.",
  },
]

const PLANS = [
  {
    name: "Starter",
    price: "99",
    period: "mois",
    description: "Pour les petits ateliers",
    features: [
      "1 site de production",
      "5 utilisateurs",
      "GMAO + Gestion des stocks",
      "Support email",
      "Mises à jour incluses",
    ],
    cta: "Démarrer",
    popular: false,
  },
  {
    name: "Pro",
    price: "249",
    period: "mois",
    description: "Pour les PME en croissance",
    features: [
      "3 sites de production",
      "20 utilisateurs",
      "Tous les modules",
      "Rapports avancés & KPIs",
      "Support prioritaire",
      "Mises à jour incluses",
    ],
    cta: "Choisir Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: null,
    period: null,
    description: "Pour les groupes industriels",
    features: [
      "Sites illimités",
      "Utilisateurs illimités",
      "API & intégrations",
      "Rapports sur mesure",
      "Account manager dédié",
      "SLA garanti",
    ],
    cta: "Nous contacter",
    popular: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
            Logiciel de GMAO cloud · SaaS
          </span>
          <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
            La maintenance industrielle,
            <br />
            <span className="text-blue-600">simplifiée</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gérez vos machines, interventions et stocks depuis une seule plateforme.
            Conçu pour les PME industrielles qui veulent arrêter de gérer la maintenance
            sur papier ou sur Excel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#contact"
              className="flex items-center gap-2 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              Voir une démo
            </a>
          </div>
          <p className="text-sm text-slate-400">
            Déployé en 24h · Sans engagement · Support inclus
          </p>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Tout ce dont votre atelier a besoin
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Une plateforme complète, modulaire, adaptée à votre activité.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Opérationnel en 24h
            </h2>
            <p className="text-lg text-slate-500">
              Pas de formation longue, pas d&apos;installation. On s&apos;occupe de tout.
            </p>
          </div>
          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {step.number}
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{step.title}</h3>
                  <p className="text-slate-500">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute ml-6 mt-14 w-0.5 h-8 bg-blue-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Des tarifs transparents
            </h2>
            <p className="text-lg text-slate-500">
              Sans frais cachés, sans engagement. Évoluez quand vous en avez besoin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 relative ${
                  plan.popular
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Le plus populaire
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                  {plan.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}€</span>
                      <span className="text-slate-500 text-sm">/{plan.period}</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-900">Sur devis</div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`block text-center font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-24 bg-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à moderniser votre maintenance ?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Contactez-nous pour une démonstration personnalisée de 30 minutes.
            On s&apos;adapte à votre activité.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <a
              href="mailto:contact@gmaopro.fr"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-400" />
              contact@gmaopro.fr
            </a>
            <span className="hidden sm:block text-slate-700">·</span>
            <a
              href="tel:+33600000000"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-5 h-5 text-blue-400" />
              +33 6 00 00 00 00
            </a>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl transition-colors text-base"
          >
            Demander une démo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>GMAO Pro © {new Date().getFullYear()} — Tous droits réservés</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-700 transition-colors">
              Connexion
            </Link>
            <a href="#" className="hover:text-slate-700 transition-colors">
              Mentions légales
            </a>
            <a href="#" className="hover:text-slate-700 transition-colors">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
