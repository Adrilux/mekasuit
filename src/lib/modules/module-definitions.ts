import { ModuleName } from "@prisma/client"

export { ModuleName }

// Métadonnées de chaque module — source de vérité unique
export const MODULE_METADATA: Record<
  ModuleName,
  {
    label: string
    description: string
    alwaysActive: boolean       // GMAO ne peut pas être désactivé
    requires: ModuleName[]      // dépendances (ex: INTER_SITE_TRANSFERS requiert STOCK_MANAGEMENT)
  }
> = {
  [ModuleName.GMAO]: {
    label: "GMAO",
    description: "Gestion des machines, interventions et historique maintenance",
    alwaysActive: true,
    requires: [],
  },
  [ModuleName.STOCK_MANAGEMENT]: {
    label: "Gestion du stock",
    description: "Catalogue de pièces, niveaux de stock, alertes de rupture",
    alwaysActive: false,
    requires: [],
  },
  [ModuleName.AI_ASSISTANT]: {
    label: "Assistant IA",
    description: "Rédaction de rapports, analyse des pannes récurrentes (Groq)",
    alwaysActive: false,
    requires: [],
  },
  [ModuleName.ADVANCED_REPORTS]: {
    label: "Rapports avancés",
    description: "MTBF, charge technicien, valorisation du stock",
    alwaysActive: false,
    requires: [],
  },
  [ModuleName.INTER_SITE_TRANSFERS]: {
    label: "Transferts inter-sites",
    description: "Déplacer des pièces entre ateliers avec traçabilité complète",
    alwaysActive: false,
    requires: [ModuleName.STOCK_MANAGEMENT], // ne peut pas être activé sans le stock
  },
}
