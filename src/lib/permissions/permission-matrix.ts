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
  // Utilisateurs
  | "user:invite"
  | "user:update-role"
  | "user:deactivate"
  | "user:read"
  // Modules
  | "module:activate"
  | "module:deactivate"
  // Rapports
  | "report:read"
  // Audit
  | "audit:read"
  // Super admin
  | "tenant:manage"

// Toutes les actions disponibles pour les rôles custom
export const ALL_ACTIONS: Action[] = [
  "machine:create", "machine:update", "machine:archive", "machine:read",
  "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
  "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
  "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
  "site:create", "site:update", "site:deactivate", "site:read",
  "user:invite", "user:update-role", "user:deactivate", "user:read",
  "module:activate", "module:deactivate",
  "report:read",
  "audit:read",
  // tenant:manage est réservé super_admin — non assignable via rôles custom
]

// Groupes d'actions pour le formulaire de création de rôle
export const ACTION_GROUPS: { label: string; actions: Action[] }[] = [
  { label: "Machines", actions: ["machine:read", "machine:create", "machine:update", "machine:archive"] },
  { label: "Interventions", actions: ["intervention:read", "intervention:create", "intervention:update", "intervention:assign", "intervention:close", "intervention:cancel"] },
  { label: "Stock", actions: ["stock:read", "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:transfer:create", "stock:transfer:approve", "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel"] },
  { label: "Sites", actions: ["site:read", "site:create", "site:update", "site:deactivate"] },
  { label: "Utilisateurs", actions: ["user:read", "user:invite", "user:update-role", "user:deactivate"] },
  { label: "Modules", actions: ["module:activate", "module:deactivate"] },
  { label: "Rapports", actions: ["report:read"] },
  { label: "Audit", actions: ["audit:read"] },
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
  "user:invite": "Inviter utilisateurs",
  "user:update-role": "Modifier rôles",
  "user:deactivate": "Désactiver utilisateurs",
  "user:read": "Voir les utilisateurs",
  "module:activate": "Activer modules",
  "module:deactivate": "Désactiver modules",
  "report:read": "Voir les rapports",
  "audit:read": "Voir le journal d'audit",
  "tenant:manage": "Gérer les tenants",
}

// Matrice de permissions pour les rôles système
export const PERMISSION_MATRIX: Record<UserRole, Action[]> = {
  super_admin: [
    "machine:create", "machine:update", "machine:archive", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
    "site:create", "site:update", "site:deactivate", "site:read",
    "user:invite", "user:update-role", "user:deactivate", "user:read",
    "module:activate", "module:deactivate",
    "report:read",
    "audit:read",
    "tenant:manage",
  ],
  client_admin: [
    "machine:create", "machine:update", "machine:archive", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:create", "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:approve", "stock:po:receive", "stock:po:cancel",
    "site:create", "site:update", "site:deactivate", "site:read",
    "user:invite", "user:update-role", "user:deactivate", "user:read",
    "module:activate", "module:deactivate",
    "report:read",
    "audit:read",
  ],
  workshop_manager: [
    "machine:create", "machine:update", "machine:read",
    "intervention:create", "intervention:update", "intervention:close", "intervention:cancel", "intervention:read", "intervention:assign",
    "stock:update", "stock:movement", "stock:movement:cancel", "stock:read", "stock:transfer:create", "stock:transfer:approve",
    "stock:po:create", "stock:po:receive",
    "site:read",
    "user:read",
    "report:read",
    "audit:read",
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

// Vérifie si un rôle système peut effectuer une action
export function can(role: UserRole, action: Action): boolean {
  return PERMISSION_MATRIX[role]?.includes(action) ?? false
}

// Vérifie si un rôle custom (TenantRole.permissions) peut effectuer une action
export function canWithCustomRole(permissions: string[], action: Action): boolean {
  return permissions.includes(action)
}
