import type { UserRole } from "@prisma/client"

// Actions possibles dans l'application
export type Action =
  // Machines
  | "machine:create"
  | "machine:update"
  | "machine:archive"
  | "machine:read"
  // Interventions
  | "intervention:create"
  | "intervention:update"
  | "intervention:close"
  | "intervention:cancel"
  | "intervention:read"
  | "intervention:assign"
  // Stock
  | "stock:create"
  | "stock:update"
  | "stock:movement"
  | "stock:movement:cancel"
  | "stock:read"
  | "stock:transfer:create"
  | "stock:transfer:approve"
  | "stock:po:create"
  | "stock:po:approve"
  | "stock:po:receive"
  | "stock:po:cancel"
  // Sites
  | "site:create"
  | "site:update"
  | "site:deactivate"
  | "site:read"
  | "site:view-all"      // voir TOUS les sites du tenant (sans ça : seulement les sites assignés)
  // Utilisateurs
  | "user:invite"
  | "user:update-role"
  | "user:deactivate"
  | "user:read"
  // Rôles
  | "role:read"          // voir les rôles et leurs permissions
  | "role:update"        // créer / modifier / supprimer des rôles
  | "role:assign"        // attribuer un rôle à un utilisateur
  // Modules
  | "module:activate"
  | "module:deactivate"
  // Rapports
  | "report:read"
  // Audit
  | "audit:read"
  // Notifications
  | "notifications:receive" // recevoir les alertes système (stock bas, interventions en retard…)
  // Super admin
  | "tenant:manage"

// Toutes les actions assignables via rôles custom (tenant:manage réservé super_admin)
export const ALL_ACTIONS: Action[] = [
  "machine:create", "machine:update", "machine:archive", "machine:read",
  "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
  "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
  "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
  "site:create", "site:update", "site:deactivate", "site:read", "site:view-all",
  "user:invite", "user:update-role", "user:deactivate", "user:read",
  "role:read", "role:update", "role:assign",
  "module:activate", "module:deactivate",
  "report:read",
  "audit:read",
  "notifications:receive",
]

// Groupes d'actions pour le formulaire de création de rôle
export const ACTION_GROUPS: { label: string; actions: Action[] }[] = [
  { label: "Machines", actions: ["machine:read", "machine:create", "machine:update", "machine:archive"] },
  { label: "Interventions", actions: ["intervention:read", "intervention:create", "intervention:update", "intervention:assign", "intervention:close", "intervention:cancel"] },
  { label: "Stock", actions: ["stock:read", "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:transfer:create", "stock:transfer:approve", "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel"] },
  { label: "Sites", actions: ["site:read", "site:view-all", "site:create", "site:update", "site:deactivate"] },
  { label: "Utilisateurs", actions: ["user:read", "user:invite", "user:deactivate"] },
  { label: "Rôles", actions: ["role:read", "role:update", "role:assign"] },
  { label: "Modules", actions: ["module:activate", "module:deactivate"] },
  { label: "Rapports", actions: ["report:read"] },
  { label: "Audit", actions: ["audit:read"] },
  { label: "Notifications", actions: ["notifications:receive"] },
]

export const ACTION_LABELS: Record<Action, string> = {
  "machine:create": "Créer machines",
  "machine:update": "Modifier machines",
  "machine:archive": "Archiver machines",
  "machine:read": "Voir les machines",
  "intervention:create": "Créer interventions",
  "intervention:update": "Modifier interventions",
  "intervention:close": "Clôturer interventions",
  "intervention:cancel": "Annuler interventions",
  "intervention:read": "Voir les interventions",
  "intervention:assign": "Assigner interventions",
  "stock:create": "Créer articles stock",
  "stock:update": "Modifier articles stock",
  "stock:movement": "Mouvements de stock",
  "stock:movement:cancel": "Annuler des mouvements de stock",
  "stock:read": "Voir le stock",
  "stock:transfer:create": "Demander transferts",
  "stock:transfer:approve": "Approuver transferts",
  "stock:po:create": "Créer commandes fournisseurs",
  "stock:po:approve": "Approuver commandes fournisseurs",
  "stock:po:receive": "Réceptionner commandes fournisseurs",
  "stock:po:cancel": "Annuler commandes fournisseurs",
  "site:create": "Créer sites",
  "site:update": "Modifier sites",
  "site:deactivate": "Désactiver sites",
  "site:read": "Voir les sites",
  "site:view-all": "Voir tous les sites du tenant",
  "user:invite": "Inviter utilisateurs",
  "user:update-role": "Modifier rôles utilisateurs",
  "user:deactivate": "Désactiver utilisateurs",
  "user:read": "Voir les utilisateurs",
  "role:read": "Voir les rôles & permissions",
  "role:update": "Gérer les rôles (créer/modifier/supprimer)",
  "role:assign": "Attribuer des rôles aux utilisateurs",
  "module:activate": "Activer modules",
  "module:deactivate": "Désactiver modules",
  "report:read": "Voir les rapports",
  "audit:read": "Voir le journal d'audit",
  "notifications:receive": "Recevoir les alertes système",
  "tenant:manage": "Gérer les tenants",
}

// Permissions complètes de l'Administrateur (toutes sauf tenant:manage)
export const ADMIN_PERMISSIONS: Action[] = [...ALL_ACTIONS]

// Matrice système — source de vérité pour les permissions des rôles système
// Utilisée par system-roles-definitions.ts → auth-session-helpers.ts pour charger les permissions en session
export const PERMISSION_MATRIX: Record<UserRole, Action[]> = {
  super_admin: [
    ...ALL_ACTIONS,
    "tenant:manage",
  ],
  client_admin: [...ALL_ACTIONS],
  workshop_manager: [
    "machine:create", "machine:update", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:receive",
    "site:read", "site:view-all",
    "user:read",
    "role:read",
    "report:read",
    "audit:read",
    "notifications:receive",
  ],
  technician: [
    "machine:read",
    "intervention:create", "intervention:update", "intervention:read",
    "stock:movement", "stock:read",
    "site:read",
  ],
  reader: [
    "machine:read",
    "intervention:read",
    "stock:read",
    "site:read",
    "user:read",
    "report:read",
  ],
}

// Vérifie si un tableau de permissions inclut une action
export function canWithPermissions(permissions: string[], action: Action): boolean {
  return permissions.includes(action)
}
