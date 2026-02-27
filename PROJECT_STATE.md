# PROJECT_STATE.md — GMAO SaaS
> Dernière mise à jour : 2026-02-26 (session 2)
> Usage : référence rapide pour IA/dev — état réel du code, pas de spécifications futures.

---

## ROUTES — App (`(app)`)

| Route | Fichier | État |
|-------|---------|------|
| `/dashboard` | `dashboard/page.tsx` | ✅ |
| `/machines` | `machines/page.tsx` | ✅ SiteSwitcher + filtres + export CSV |
| `/machines/new` | `machines/new/page.tsx` | ✅ |
| `/machines/[machineId]` | `machines/[machineId]/page.tsx` | ✅ stats, QR (bouton "Plein écran"), pièces, historique |
| `/machines/[machineId]/edit` | `machines/[machineId]/edit/page.tsx` | ✅ |
| `/machines/[machineId]/qr-code` | `machines/[machineId]/qr-code/page.tsx` | ✅ page dédiée print-friendly, QR 240px, `print:hidden` sur nav |
| `/interventions` | `interventions/page.tsx` | ✅ SiteSwitcher + filtres + export CSV |
| `/interventions/new` | `interventions/new/page.tsx` | ✅ |
| `/interventions/[id]` | `interventions/[id]/page.tsx` | ✅ notes, pièces, plannedMaterials, statuts, chaîne récurrence, startedAt, durée, diagnostic |
| `/interventions/[id]/edit` | `interventions/[id]/edit/page.tsx` | ✅ passe `aiEnabled` au formulaire |
| `/interventions/[id]/print` | `interventions/[id]/print/page.tsx` | ✅ redirige vers `/api/interventions/[id]/print` |
| `/preventive` | `preventive/page.tsx` | ✅ board temporel, assignation rapide |
| `/today` | `today/page.tsx` | ✅ interventions du jour du technicien connecté |
| `/stock` | `stock/page.tsx` | ✅ SiteSwitcher + filtres + export CSV |
| `/stock/new` | `stock/new/page.tsx` | ✅ |
| `/stock/[stockItemId]` | `stock/[stockItemId]/page.tsx` | ✅ mouvements, lien machine |
| `/stock/[stockItemId]/edit` | `stock/[stockItemId]/edit/page.tsx` | ✅ |
| `/stock/scan` | `stock/scan/page.tsx` | ✅ scanner code-barre |
| `/stock/transfers` | `stock/transfers/page.tsx` | ✅ liste en attente + historique |
| `/stock/transfers/new` | `stock/transfers/new/page.tsx` | ✅ |
| `/stock/transfers/[transferId]` | `stock/transfers/[transferId]/page.tsx` | ✅ détail + approve/reject/complete |
| `/reports` | `reports/page.tsx` | ✅ MTBF, charge tech, coût — SiteSwitcher + filtre période |
| `/ai-assistant` | `ai-assistant/page.tsx` | ✅ chat Groq (module AI_ASSISTANT) |
| `/notifications` | `notifications/page.tsx` | ✅ liste + marquer lu |
| `/today` | `today/page.tsx` | ✅ |
| `/users` | `users/page.tsx` | ✅ inline edit, rôles custom |
| `/users/invite` | `users/invite/page.tsx` | ✅ auto-crée compte Better Auth si email inconnu |
| `/users/org` | `users/org/page.tsx` | ✅ organigramme visuel collapse/expand |
| `/sites` | `sites/page.tsx` | ✅ |
| `/sites/new` | `sites/new/page.tsx` | ✅ |
| `/sites/[siteId]/edit` | `sites/[siteId]/edit/page.tsx` | ✅ |
| `/profile` | `profile/page.tsx` | ✅ modifier nom + mdp |
| `/settings` | `settings/page.tsx` | ✅ index avec cards |
| `/settings/modules` | `settings/modules/page.tsx` | ✅ lecture seule client |
| `/settings/billing` | `settings/billing/page.tsx` | ✅ licence, limites, renouvellement |
| `/settings/general` | `settings/general/page.tsx` | ✅ nom tenant, email |
| `/settings/roles` | `settings/roles/page.tsx` | ✅ CRUD rôles custom (client_admin) |
| `/settings/audit` | `settings/audit/page.tsx` | ⚠️ fonctionne mais gate via `module:activate` (mauvaise permission) |

## ROUTES — Public (`(public)`)

| Route | État |
|-------|------|
| `/login` | ✅ |
| `/register` | ✅ onboarding tenant |
| `/onboarding` | ✅ |
| `/change-password` | ✅ mustChangePassword flow |
| `/offline` | ⚠️ page statique OK, mais pas de vrai offline queue |

## ROUTES — Scan QR

| Route | État |
|-------|------|
| `/m/[slug]` | ✅ `src/app/m/[slug]/page.tsx` — résout slug → redirect si connecté, landing si non connecté |

## ROUTES — Admin (`(admin)`)

| Route | État |
|-------|------|
| `/admin` | ✅ stats globales + liste tenants |
| `/admin/[tenantId]` | ✅ détail tenant, users, sites, modules, licence |
| `/admin/logs` | ✅ journal audit super-admin (dark theme) |

## ROUTES — API

| Route | État |
|-------|------|
| `/api/auth/[...all]` | ✅ Better Auth handler |
| `/api/interventions/[id]/print` | ✅ bon de travail HTML imprimable |
| `/api/export/interventions` | ✅ CSV |
| `/api/export/machines` | ✅ CSV |
| `/api/export/stock` | ✅ CSV |
| `/api/stock-items` | ✅ autocomplete |
| `/api/search` | ✅ recherche globale |
| `/api/ai-chat` | ✅ streaming Groq |

---

## SERVER ACTIONS

### Auth
- `action-sign-out.ts`
- `action-register-tenant.ts`
- `action-change-password.ts`

### Machines
- `action-create-machine.ts`
- `action-update-machine.ts`
- `action-archive-machine.ts`

### Interventions
- `action-create-intervention.ts`
- `action-update-intervention.ts`
- `action-update-intervention-status.ts` — gère statuts + récurrence auto + copie plannedMaterials + durée + diagnostic
- `action-add-intervention-note.ts`
- `action-assign-intervention.ts`
- `action-consume-stock-part.ts` — atomique : InterventionPartUsed + StockMovement + decrement
- `action-remove-consumed-part.ts` — déconsommation (remet le stock)
- `action-update-planned-materials.ts` — full replace deleteMany+createMany
- `action-consume-planned-materials.ts` — consommer tout d'un coup

### Stock
- `action-create-stock-item.ts`
- `action-update-stock-item.ts`
- `action-delete-stock-item.ts`
- `action-stock-movement.ts`
- `action-stock-movement-barcode.ts`
- `action-link-stock-item-to-machine.ts`
- `action-create-stock-transfer.ts`
- `action-resolve-stock-transfer.ts` — gère APPROVED / REJECTED / COMPLETED

### Users
- `action-invite-user.ts` — auto-crée compte si email inconnu, mustChangePassword=true
- `action-update-user-info.ts` — nom Better Auth + recalcul UserSite
- `action-update-user-role.ts`
- `action-update-user-org-info.ts` — jobTitle + managerId
- `action-deactivate-user.ts`

### Roles
- `action-create-role.ts`
- `action-update-role.ts`
- `action-delete-role.ts`

### Notifications
- `action-mark-notification-read.ts`

### Profile
- `action-update-profile.ts`

### Settings
- `action-update-tenant-settings.ts`

### AI
- `action-generate-intervention-description.ts`

### Onboarding
- `action-complete-onboarding.ts`

### Super-admin
- `action-create-tenant.ts`
- `action-toggle-tenant.ts`
- `action-update-license.ts`
- `action-toggle-module.ts`
- `action-create-site.ts` / `action-delete-site.ts`
- `action-link-user-to-tenant.ts` / `action-unlink-user.ts`

### Sites
- `action-create-site.ts`
- `action-update-site.ts`
- `action-deactivate-site.ts`

---

## SERVER QUERIES

| Fichier | Usage |
|---------|-------|
| `dashboard/query-get-dashboard-stats.ts` | stats homepage |
| `machines/query-get-machines-by-site.ts` | liste machines |
| `machines/query-get-machine-detail.ts` | fiche machine |
| `machines/query-get-machine-stats.ts` | MTBF, coût, compteurs |
| `machines/query-get-machine-by-slug.ts` | résolution QR scan |
| `interventions/query-get-interventions-by-site.ts` | liste interventions |
| `interventions/query-get-intervention-detail.ts` | fiche intervention |
| `interventions/query-get-preventives.ts` | board préventives |
| `interventions/query-get-my-interventions-today.ts` | page /today |
| `interventions/query-get-recurrence-chain.ts` | chaîne occurrences préventives |
| `stock/query-get-stock-items-by-site.ts` | liste stock |
| `stock/query-get-stock-item-detail.ts` | fiche article |
| `stock/query-get-stock-transfers.ts` | liste transferts + `queryGetPendingTransfersCount()` |
| `reports/query-get-maintenance-reports.ts` | MTBF, charge tech, coût |
| `notifications/query-get-user-notifications.ts` | cloche + page notifs |
| `audit/query-get-audit-logs.ts` | page audit |
| `search/query-global-search.ts` | recherche globale |
| `users/query-get-users-by-tenant.ts` | page users |
| `users/query-get-users-by-auth-ids.ts` | `buildUserNameMap()` |
| `sites/query-get-sites-by-tenant.ts` | SiteSwitcher |
| `roles/query-get-tenant-roles.ts` | sélecteur rôles |
| `super-admin/query-get-all-tenants.ts` | liste admin |
| `super-admin/query-get-tenant-detail.ts` | fiche admin tenant |
| `super-admin/query-get-admin-global-stats.ts` | stats admin dashboard |

---

## LIB — Modules clés

| Fichier | Rôle |
|---------|------|
| `db/prisma-client-singleton.ts` | singleton Prisma + adapter-pg |
| `db/prisma-with-rls-context.ts` | `withTenantContext(tenantId, fn)` |
| `auth/auth-session-helpers.ts` | `requireSession()`, `requireSuperAdmin()`, `getSession()` |
| `auth/better-auth-server-config.ts` | config Better Auth server |
| `auth/better-auth-client-config.ts` | `signOut()` client |
| `permissions/permission-matrix.ts` | `can()`, `canWithCustomRole()`, `ALL_ACTIONS`, `ACTION_GROUPS` — inclut `audit:read` (client_admin, workshop_manager, super_admin) |
| `permissions/permission-checker-server.ts` | `assertCan()`, `assertSiteAccess()` |
| `modules/module-definitions.ts` | source de vérité modules |
| `modules/module-access-checker.ts` | `assertModuleActive()`, `isModuleActive()` |
| `license/license-limits-checker.ts` | vérification limites sites/users |
| `notifications/notification-sender.ts` | `sendNotification()` |
| `notifications/notify-stock-low.ts` | alerte rupture stock |
| `audit/audit-logger.ts` | `logAudit(tx, session, action, entityType, entityId, label)` |
| `csv/csv-builder.ts` | helper CSV générique |
| `offline/offline-queue.ts` | IndexedDB queue : `queuePush()`, `queueGetAll()`, `queueDelete()`, `queueCount()` |
| `offline/use-offline-queue.ts` | hook `useOfflineQueueFlush()` — replay au retour réseau, toasts succès/erreur |
| `errors/app-error-classes.ts` | `AppError`, `AuthError`, `ModuleError`, `LicenseError` |
| `env/env-server-schema.ts` | validation vars env au démarrage |

---

## COMPOSANTS CLÉS

| Composant | Rôle |
|-----------|------|
| `layout/app-sidebar.tsx` | sidebar + GlobalSearch, filtre module/rôle, prop `pendingTransfersCount`, drawer mobile animé |
| `layout/app-sidebar-server.tsx` | charge `pendingTransfersCount` server-side, passe à AppSidebar |
| `layout/app-header.tsx` | header + burger mobile + NotificationBell + OfflineIndicator |
| `layout/app-header-server.tsx` | charge les notifs server-side |
| `layout/offline-queue-flusher.tsx` | composant invisible montant `useOfflineQueueFlush` dans le layout |
| `layout/global-search.tsx` | recherche globale via `/api/search` |
| `layout/site-switcher.tsx` | SiteSwitcher (searchParam `siteId`) |
| `layout/notification-bell.tsx` | cloche avec badge non lus |
| `layout/offline-indicator.tsx` | badge "Hors ligne / Reconnecté" |
| `interventions/intervention-status-actions.tsx` | transitions statut + dialog clôture (durée, diagnostic) |
| `interventions/intervention-parts-panel.tsx` | consommer/déconsommer pièces |
| `interventions/intervention-planned-materials-panel.tsx` | pièces prévues (PREVENTIVE) |
| `interventions/intervention-form.tsx` | création/édition intervention |
| `machines/machine-qr-code.tsx` | canvas QR + print, prop `size` (défaut 160, page dédiée 240) |
| `machines/machine-form.tsx` | création/édition machine |
| `stock/stock-transfer-form.tsx` | formulaire transfert |
| `stock/transfer-resolve-buttons.tsx` | boutons approve/reject/complete |
| `stock/stock-machine-link-panel.tsx` | lier article à une machine |
| `stock/stock-barcode-scanner.tsx` | scan code-barre |
| `users/org-chart.tsx` | organigramme visuel |
| `users/user-edit-row.tsx` | édition inline utilisateur |
| `preventive/preventive-board.tsx` | board préventives par période |
| `reports/tech-load-chart.tsx` | graphe charge technicien (Recharts) |
| `reports/cost-pie-chart.tsx` | camembert coûts (Recharts) |
| `feedback/empty-state-placeholder.tsx` | état vide réutilisable |
| `feedback/confirm-dialog.tsx` | dialog confirmation destructive |
| `guards/module-feature-guard.tsx` | guard client module |
| `guards/role-permission-guard.tsx` | guard client rôle |

---

## SCHÉMA DB — Modèles principaux

| Modèle | Notes |
|--------|-------|
| `Tenant` | organisation cliente |
| `TenantUser` | lien user↔tenant, rôle, sites, jobTitle, managerId |
| `TenantRole` | rôles custom avec permissions[] |
| `Site` | site physique (tenantId, isActive) |
| `UserSite` | lien user↔site |
| `Machine` | qrCodeSlug @unique, status enum |
| `Intervention` | type, priority, status, recurrenceType, recurrenceEndsAt, parentInterventionId, actualDurationMinutes, closingDiagnosis, startedAt, closedAt |
| `InterventionNote` | notes libres |
| `InterventionPartUsed` | pièces consommées (lien stock) |
| `InterventionPlannedMaterial` | pièces prévues (PREVENTIVE uniquement) |
| `StockItem` | quantityOnHand, minimumLevel, unitCostCents, machineId? |
| `StockMovement` | type enum, quantityBefore/After |
| `StockTransferRequest` | status PENDING/APPROVED/REJECTED/COMPLETED |
| `Notification` | type enum, readAt? |
| `AuditLog` | action string, entityType, entityId, entityLabel, before/after Json? |
| Better Auth `user` | mustChangePassword champ custom (UPDATE raw SQL) |

---

## PROVIDERS

| Fichier | Rôle |
|---------|------|
| `providers/tenant-context-provider.tsx` | session + modules actifs (`isModuleActive`) |
| `providers/sidebar-context.tsx` | `isOpen`, `open/close/toggle` pour drawer mobile |

---

## CE QUI MANQUE (todos réels)

Tous les todos précédents ont été réalisés. Aucun todo critique restant identifié à ce jour.
