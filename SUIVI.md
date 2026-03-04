# MekaSuite — Suivi de qualité par fonctionnalité

> **Légende** : ✅ OK | ⚠️ Partiel / Bug | ❌ Absent

---

## 0. DASHBOARD

| Point | Statut | Notes |
|---|---|---|
| Vue d'ensemble | ⚠️ | Manque d'organisation. Notifications trop nombreuses, côte à côte/superposées, fatigue visuelle |
| Couleurs | ⚠️ | Usage excessif rouge/orange — nuit à l'ergonomie |
| Filtre par atelier/site | ✅ | Pertinent, à conserver |
| Restructuration complète | ❌ | Vue hiérarchisée, claire, agréable. KPIs prioritaires en haut, alertes regroupées, moins de bruit visuel |

---

## 1.1 MACHINES

### Fiche machine — Champs

| Champ | Présent | Notes |
|---|---|---|
| Nom | ✅ | Obligatoire, max 100 |
| Catégorie | ✅ | Optionnel |
| N° de série | ✅ | Optionnel |
| Fabricant | ✅ | Optionnel |
| Modèle | ✅ | Optionnel |
| Date de mise en service | ✅ | Optionnel, date picker |
| Site | ✅ | Obligatoire à la création, non modifiable ensuite |
| Statut | ✅ | Modifiable via bouton dédié (OPERATIONAL ↔ UNDER_MAINTENANCE) |
| Description / notes libres | ✅ | Textarea 2000 car., visible sur fiche détail si rempli |

### Liste machines

| Point | Statut | Notes |
|---|---|---|
| Filtre par site | ✅ | Via SiteSwitcher global |
| Filtre par statut | ✅ | Dropdown : Tous / Opérationnelle / En maintenance / Hors service |
| Recherche par nom | ✅ | Délai 300ms, case-insensitive |
| Filtre par catégorie | ✅ | Dropdown dynamique depuis les catégories du site actif |
| Pagination | ✅ | 25 par page, navigation Précédent/Suivant |
| Colonne : nom + n° série | ✅ | |
| Colonne : catégorie | ✅ | |
| Colonne : statut (badge) | ✅ | |
| Colonne : interventions ouvertes | ✅ | |
| Bouton archiver depuis la liste | ✅ | Icône archive sur chaque ligne, dialog de confirmation, refresh sans redirection |

### Page détail machine

| Point | Statut | Notes |
|---|---|---|
| Infos techniques | ✅ | Nom, catégorie, n° série, fabricant, modèle, date installation, notes |
| Statistiques maintenance | ✅ | MTBF, coût total, interventions total/ouvertes/correctives |
| QR code (aperçu + bouton plein écran) | ✅ | |
| QR code — régénération slug | ✅ | Bouton "Régénérer" avec dialog d'avertissement — nouveau UUID |
| Pièces associées (articles stock liés) | ✅ | Visible uniquement si module Stock actif |
| Pièces jointes (photos, PDF) | ✅ | Upload local `/public/uploads/machines/`, max 10 Mo, types : images + PDF |
| Timeline machine | ✅ | Page `/machines/[id]/timeline` — interventions créées/clôturées/annulées + audit logs |
| Historique interventions (20 dernières) | ✅ | |
| Bouton "Créer intervention" | ✅ | machineId et siteId pré-remplis |
| Bouton "Modifier" | ✅ | Caché si machine archivée |
| Bouton "Archiver" | ✅ | Avec label texte, caché si déjà archivée |
| Bouton "Restaurer" (désarchiver) | ✅ | Visible si DECOMMISSIONED — remet en OPERATIONAL + audit log |
| Bouton changer statut (OPERATIONAL ↔ UNDER_MAINTENANCE) | ✅ | 1 clic, label adaptatif, masqué si DECOMMISSIONED |

### QR code

| Point | Statut | Notes |
|---|---|---|
| Génération automatique | ✅ | cuid() à la création, unique |
| Page plein écran imprimable | ✅ | `/machines/[id]/qr-code` |
| Page publique scan terrain | ✅ | `/m/[slug]` — accessible sans login |
| Redirection post-login | ✅ | `?next=/m/[slug]` conservé après connexion |
| Régénération du slug | ✅ | Bouton "Régénérer" avec avertissement — nouveau UUID |
| **Impression QR code — BUGGÉ** | ❌ | Bouton d'impression non fonctionnel sur la page `/machines/[id]/qr-code` |

### Archivage

| Point | Statut | Notes |
|---|---|---|
| Bouton archiver (fiche détail) | ✅ | Dialog de confirmation |
| Bouton archiver (liste) | ✅ | Icône archive par ligne, refresh in-place |
| Blocage si interventions ouvertes | ✅ | Message d'erreur avec le nombre d'interventions bloquantes |
| Audit log à l'archivage | ✅ | |
| Désarchivage / restauration | ✅ | Bouton "Restaurer" — remet en OPERATIONAL + audit log |

### Statistiques machine

| Métrique | Statut | Notes |
|---|---|---|
| Interventions totales | ✅ | |
| Interventions ouvertes | ✅ | Highlight amber si > 0 |
| Pannes correctives clôturées | ✅ | |
| MTBF | ✅ | Calculé sur interventions correctives clôturées. Rouge < 168h, Amber < 720h, Vert sinon. "—" si < 2 pannes |
| Coût pièces total | ✅ | Somme quantité × prix unitaire des pièces consommées |
| Dernière intervention (date) | ✅ | |

### Bugs / Incohérences corrigés

| Bug | Correction |
|---|---|
| ~~Enum `OUT_OF_SERVICE` référencé mais n'existe pas dans Prisma~~ | ✅ Supprimé des 3 fichiers |
| ~~Libellé incohérent : "Archivée" vs "Déclassée"~~ | ✅ Harmonisé sur "Hors service" partout |

### Restant hors périmètre actuel (grosses features)

- ~~Compteurs machine (heures, cycles, km) — déclenche préventives automatiques~~ ✅ Implémenté (MachineCounter + MachineCounterReading, seuil + intervalle + déclenchement préventive automatique)
- ~~Arborescence composants / BOM (machine → sous-ensemble → pièce)~~ ✅ Implémenté (MachineComponent, tree récursif, créer/modifier/déplacer/supprimer, lien StockItem optionnel)

---

## 1.2 INTERVENTIONS

### Features implémentées

| Feature | Statut | Notes |
|---|---|---|
| Créer intervention | ✅ | Titre, description, type, priorité, machine, date, technicien, matériaux prévus |
| Modifier intervention | ✅ | Tous champs avant clôture |
| Changer statut | ✅ | OPEN → IN_PROGRESS → PENDING_PARTS → CLOSED / CANCELLED |
| Assigner technicien | ✅ | Notification in-app envoyée |
| Notes & journal | ✅ | Horodatés, max 5000 car. |
| Clôture enrichie | ✅ | `actualDurationMinutes` + `closingDiagnosis` |
| Impression bon de travail | ✅ | `/interventions/[id]/print` |
| Matériaux prévus (stock) | ✅ | Masqué si module stock inactif |
| Consommation pièces (stock) | ✅ | Décrémente stock, réversible |
| Annulation | ✅ | Traçabilité dans statuts |
| Pièces jointes | ✅ | Photos + PDF, max 10 Mo, stockage local VPS — `/api/interventions/[id]/attachments` |
| Pointage heures | ✅ | Démarrer/stopper chrono, plusieurs sessions, total calculé — `InterventionTimeEntry` |
| Checklists | ✅ | Items cochables (isRequired), ajout à la volée, import depuis modèle — `InterventionChecklist` |
| Modèles de checklists | ✅ | CRUD dans `/settings/checklists` — `ChecklistTemplate` |
| Chaîne de récurrence | ✅ | Vue de toutes les occurrences passées et futures |

### Améliorations UX demandées

| Point | Statut | Notes |
|---|---|---|
| Pointage heures — remplacer chrono | ❌ | Saisie a posteriori : heure début/fin, mini planning journalier. Pas de chrono temps réel |

### Restant

- Signature électronique (non demandée pour l'instant)
- SLA / temps de réponse (non demandé pour l'instant)

---

## 1.3 PRÉVENTIVE & RÉCURRENCE

| Feature | Statut | Notes |
|---|---|---|
| Récurrence automatique | ✅ | À la clôture d'une préventive → création automatique selon fréquence |
| Matériaux prévus copiés | ✅ | Pièces prévues copiées sur la nouvelle occurrence |
| Date fin récurrence (`recurrenceEndsAt`) | ✅ | Respectée à la génération |
| Chaîne de récurrence | ✅ | Vue de toutes les occurrences via `parentInterventionId` |
| Planning visuel | ✅ | Route `/planning` — calendrier mois/semaine, couleur par priorité, clic → fiche |
| Modèles d'intervention | ✅ | CRUD dans `/settings/templates` — `InterventionTemplate` + checklist items. Pré-remplit le formulaire à la création |
| Déclenchement par compteur | ✅ | Quand un relevé de compteur atteint le seuil → préventive créée automatiquement. Seuil recalibré par intervalle |

### Améliorations UX demandées

| Point | Statut | Notes |
|---|---|---|
| Vue préventive — mur/liste verticale | ❌ | Interface plus visuelle, moins d'infos simultanées, tri rapide |
| Planning — vues supplémentaires | ❌ | Actuellement : mois/semaine. À ajouter : jour, trimestre, semestre, année |

### Restant

- Signature électronique (non demandée pour l'instant)
- SLA / temps de réponse (non demandé pour l'instant)

---

## 2.1 CATALOGUE ARTICLES (STOCK)

| Feature | Statut | Notes |
|---|---|---|
| Fiche article | ✅ | Référence unique par site, nom, unité, quantité, seuil, prix unitaire (centimes) |
| Liste avec filtre & recherche | ✅ | Recherche nom/référence, filtre rupture, tri par seuil |
| Alertes rupture | ✅ | Badge rouge si quantité ≤ seuil minimum |
| Lier article à machine | ✅ | FK optionnel `machineId` sur `StockItem` |
| Historique mouvements | ✅ | 50 derniers mouvements avec opérateur résolu |
| QR code / étiquette article | ✅ | Dialog "Étiquette QR" sur la fiche — QR code + référence + nom, bouton impression |
| Fournisseurs | ✅ | Modèle `Supplier` tenant-scoped. Panneau sur la fiche article — créer fournisseur à la volée ou sélectionner existant |
| Délai réapprovisionnement | ✅ | Champ `leadTimeDays` sur le lien `StockItemSupplier` — affiché dans le panneau fournisseurs |
| Inventaire physique | ✅ | Session couvrant tous les articles du site. Route `/stock/inventory`. Saisie comptage avec écart en temps réel, validation → ajustements ADJUSTMENT en masse. `StockInventorySession` + `StockInventoryItem` |
| Annulation mouvement | ✅ | Workshop manager+, sans limite de temps. TRANSFER non annulables. Génère ADJUSTMENT compensatoire + `cancelledAt/By/Reason` sur le mouvement. Composant `StockMovementHistory` client |

### Améliorations UX demandées

| Point | Statut | Notes |
|---|---|---|
| Ligne article entièrement cliquable | ❌ | Actuellement seule la désignation est cliquable — toute la ligne doit l'être |
| Image article | ❌ | Ajouter une photo par article pour identification visuelle rapide |
| Liens URL fournisseur par article | ❌ | Ex : même pièce achetable chez Würth ET Manutan. Objectif : panier groupé par fournisseur |
| Filtre "Tous les sites" dans stock | ❌ | Filtre global par site dans la liste stock (selon permissions user) |
| Filtre "Tous les sites" en rupture | ❌ | Section "Articles en rupture" : filtre site ou vue globale |

---

## 2.2 MOUVEMENTS DE STOCK

| Feature | Statut | Notes |
|---|---|---|
| Entrée en stock (IN) | ✅ | |
| Sortie manuelle (OUT) | ✅ | |
| Ajustement inventaire (ADJUSTMENT) | ✅ | Raison obligatoire |
| Scan code-barres | ✅ | Via caméra ou douchette, résolution par `reference` |
| Consommation sur intervention | ✅ | Décrémente stock, réversible |

---

## 2.3 TRANSFERTS INTER-SITES

| Feature | Statut | Notes |
|---|---|---|
| Demande de transfert | ✅ | |
| Approbation / rejet | ✅ | Manager du site source |
| Complétion (réception) | ✅ | Génère TRANSFER_OUT + TRANSFER_IN automatiquement |
| Notifications | ✅ | Managers notifiés à chaque étape |

---

## 2.4 COMMANDES FOURNISSEURS

| Feature | Statut | Notes |
|---|---|---|
| Bon de commande | ✅ | `PurchaseOrder` + `PurchaseOrderItem`. Multi-articles, fournisseur, prix unitaires, date livraison, notes |
| Workflow statuts BC | ✅ | DRAFT → ORDERED (approuvé par client_admin+) → RECEIVED / CANCELLED. `action-approve-purchase-order`, `action-cancel-purchase-order` |
| Réception partielle | ✅ | `action-receive-purchase-order-items` — incrémente stock + crée mouvement IN par article. Statut RECEIVED quand tout reçu |
| Lien rupture → commande | ✅ | Page `/stock/low-stock` — articles sous seuil avec cases à cocher. "Commander la sélection" → pré-remplit formulaire BC via `?items=` |

---

## MODULE 3 — RAPPORTS AVANCÉS

| Feature | Statut | Notes |
|---|---|---|
| MTBF par machine | ✅ | `queryGetMtbfBySite` — calcul gaps entre interventions correctives clôturées. Coloration rouge/amber/vert |
| Charge technicien | ✅ | `queryGetTechnicianLoad` — groupé par `assignedUserId`. Graphique + tableau |
| Coût maintenance | ✅ | `queryGetMaintenanceCostBySite` — pièces consommées × prix unitaire par machine. PieChart |
| Taux de disponibilité | ✅ | `queryGetAvailability` — downtime = cumul durée interventions correctives clampé à la période. BarChart coloré ≥95%/≥80%/<80% |
| Rapport SLA | ✅ | `queryGetSlaReport` — SLA fixes : CRITICAL 4h, HIGH 24h, MEDIUM 72h, LOW 168h. BarChart groupé Dans les délais / Hors délais |
| Export PDF | ✅ | Page `/reports/print?siteId&from&to` — rendu HTML épuré + `@media print` + auto-print via `window.onload`. Tous les 5 rapports inclus |
| Rapport personnalisé | ✅ | `CustomReport` modèle DB (colonnes[], filtres JSON). CRUD actions. Pages `/reports/custom` (liste), `/reports/custom/new`, `/reports/custom/[id]`, `/reports/custom/[id]/edit`. Composant `CustomReportBuilder` (cases à cocher colonnes, filtres, aperçu, sauvegarde) |

### Améliorations UX demandées

| Point | Statut | Notes |
|---|---|---|
| Restructurer la page rapports | ❌ | Trop de rapports sans hiérarchie. Proposer une structure guidée, pédagogique et ergonomique |

---

## MODULE 4 — ASSISTANT IA

| Feature | Statut | Notes |
|---|---|---|
| Génération description | ✅ | Existant — `actionGenerateInterventionDescription` — Groq Llama 3.3 70B, bouton "Générer avec IA ✨" dans `intervention-form.tsx` |
| Analyse pannes récurrentes | ✅ | `actionAnalyzeMachineFailures` — charge les 30 dernières pannes CORRECTIVE CLOSED, prompt structuré (pannes fréquentes, tendances, recommandations, niveau de risque). Page `/ai-assistant/machines` avec sélecteur machine + rendu markdown. Lien depuis `/ai-assistant` |
| Suggestion de pièces | ✅ | `actionSuggestParts` — charge intervention + catalogue (50 articles), prompt demande refs exactes → match en JS. Composant `PartsSuggestionButton` sur fiche intervention (non terminée, modules AI+Stock actifs) → dialog avec suggestions + bouton "Ajouter" → `actionConsumeStockPart` |
| Résumé d'intervention | ✅ | `actionGenerateInterventionSummary` — charge intervention CLOSED + technicien + notes + pièces, prompt résumé pro. Composant `InterventionSummaryButton` sur fiche intervention CLOSED → dialog avec résumé + bouton "Copier" |

---

## MODULE 5 — NOTIFICATIONS & EMAIL

| Feature | Statut | Notes |
|---|---|---|
| Notifications in-app | ✅ | Existant — badge, centre notifs, 6 types |
| Service email (Resend) | ✅ | `src/lib/email/email-sender.ts` — `sendEmail({ to, subject, html })`. Appelle Resend SDK si `RESEND_API_KEY` configuré, sinon log console. Never throws. |
| Template : intervention assignée | ✅ | `src/lib/email/templates/email-intervention-assigned.ts` — Header slate, CTA bleu, priorité colorée |
| Template : intervention en retard | ✅ | `src/lib/email/templates/email-intervention-overdue.ts` — Header rouge, CTA rouge. Inclut aussi `buildOverdueManagerSummaryEmail` (tableau multi-interventions) |
| Template : stock bas | ✅ | `src/lib/email/templates/email-stock-low.ts` — Header amber, quantités actuelles vs seuil |
| Email à l'assignation | ✅ | `action-assign-intervention.ts` — après notif in-app, fetch email via `queryGetUsersByAuthIds`, envoie email au technicien. Fire-and-forget (void async IIFE hors transaction) |
| Email stock bas | ✅ | `notify-stock-low.ts` — après `sendNotificationToMany`, fetch emails des managers, envoie email à chacun. Fire-and-forget hors transaction. Signature étendue : `stockItemReference?`, `siteName?` |
| Check interventions en retard | ✅ | `src/lib/notifications/notify-interventions-overdue.ts` — iterate tous les tenants actifs, `withTenantContext` par tenant, cherche OPEN/IN_PROGRESS/PENDING_PARTS avec `scheduledAt < now`. Dédup : vérifie notif INTERVENTION_OVERDUE dans les 24h. Notif in-app au technicien + managers. Email individuel au technicien + email récap groupé aux managers |
| Route cron `/api/cron/check-overdue` | ✅ | `GET` sécurisé par `Authorization: Bearer CRON_SECRET`. Si pas de CRON_SECRET : passe sans auth (dev). Retourne `{ success: true, processed: N }` |
| Variables d'environnement | ✅ | `RESEND_API_KEY` (re_*), `EMAIL_FROM`, `CRON_SECRET` — toutes optionnelles dans `env-server-schema.ts` et `.env.example` |

---

## MODULE 6 — ADMINISTRATION

### 6.3 Plan 2D du site

| Feature | Statut | Notes |
|---|---|---|
| Upload image plan | ✅ | `POST /api/sites/[siteId]/floor-plan` — PNG/JPG/WebP max 5 Mo, stocké dans `public/uploads/sites/[siteId]/`. Remplace l'ancien fichier. Permission `site:update` |
| Sauvegarde positions | ✅ | `PATCH /api/sites/[siteId]/pins` — Body `{ pins: { [machineId]: { x, y } } }`. Stocké en `Json?` sur le modèle Site. Permission `site:update` |
| Page plan | ✅ | `/sites/[siteId]/plan` — server component, charge site + machines non-décommissionnées du site. Lien "Plan 2D" sur chaque carte dans `/sites` |
| Marqueurs machines | ✅ | Couleur par statut (vert/amber/gray). Badge rouge si interventions ouvertes > 0. Tooltip natif (title). Clic → `/machines/[id]` |
| Drag & drop | ✅ | Natif (pas de lib). `onMouseDown` sur marqueur → `onMouseMove` sur conteneur → coordonnées en % relatif. Bouton "+" pour placer les machines non positionnées (place à 50%, 50%) |
| Légende | ✅ | En bas du plan — couleurs statuts + badge alerte |
| Schéma DB | ✅ | `Site.floorPlanImage String?` + `Site.machinePins Json?` — migration `20260302_add_site_floor_plan` |

---

### 6.2 Utilisateurs & rôles

| Feature | Statut | Notes |
|---|---|---|
| Inviter utilisateur | ✅ | `action-invite-user.ts` — création compte Better Auth + mot de passe temporaire + `mustChangePassword: true`. Email d'invitation envoyé via Resend (best-effort) avec template `email-invite-user.ts` (identifiants + CTA login) |
| Réinviter | ✅ | L'email est envoyé automatiquement lors de l'invitation. Si perdu, l'admin peut réinviter via le formulaire avec un nouvel email |
| Désactiver utilisateur | ✅ | `action-deactivate-user.ts` — bouton `UserDeactivateButton`, dialog confirmation |
| Réactiver utilisateur | ✅ | `action-reactivate-user.ts` (nouveau) — bouton `UserReactivateButton` (vert), visible si `!user.isActive`. Permission réutilisée : `user:deactivate` |
| Gérer rôle | ✅ | Dropdown inline dans `UsersTable` — rôles système + custom (`custom:id`) |
| Rôles custom | ✅ | CRUD dans `/settings/roles` — `roles-page-client.tsx`, permissions groupées par module |
| Sites assignés | ✅ | Checkboxes inline dans `UsersTable` — au moins 1 site obligatoire |
| Organigramme | ✅ | `/users/org` — arbre visual, édition poste + manager, couleurs par rôle |

