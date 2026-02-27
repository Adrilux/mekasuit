# DEV_ROADMAP.md — GMAO SaaS — Todo complet

> Dernière mise à jour : 2026-02-26
> État actuel : MVP fonctionnel ~95% du core. Modules optionnels, notifications, exports et UX avancée à implémenter.

---

## LÉGENDE

- 🔴 **Bloquant** — fonctionnalité annoncée ou critique manquante
- 🟠 **Important** — impact fort sur l'expérience utilisateur quotidienne
- 🟡 **Utile** — amélioration notable mais non bloquante
- 🟢 **Bonus** — nice-to-have, différenciateur produit

---

## 1. MODULES OPTIONNELS (non implémentés)

### 1.1 Transferts inter-sites — `INTER_SITE_TRANSFERS` 🔴

Module défini, schéma DB complet (`StockTransferRequest`), mais aucune UI ni action.

**À créer :**
- `src/server/actions/stock/action-create-stock-transfer.ts`
- `src/server/actions/stock/action-approve-stock-transfer.ts`
- `src/server/actions/stock/action-reject-stock-transfer.ts`
- `src/server/actions/stock/action-complete-stock-transfer.ts`
- `src/server/queries/stock/query-get-stock-transfers.ts`
- `src/app/(app)/stock/transfers/page.tsx` — liste des demandes en attente + historique
- `src/app/(app)/stock/transfers/new/page.tsx` — formulaire création (site source → site cible, article, quantité)
- `src/app/(app)/stock/transfers/[requestId]/page.tsx` — détail + boutons Approuver/Rejeter
- `src/components/stock/stock-transfer-form.tsx`
- Bouton "Demander un transfert" sur la page `/stock/[stockItemId]`
- Badge "X transferts en attente" dans la sidebar si `workshop_manager`+

---

### 1.2 Rapports avancés — `ADVANCED_REPORTS` 🔴

Module défini, permission `report:read` définie, aucune page.

**À créer :**
- `src/server/queries/reports/query-get-mtbf-by-machine.ts` — MTBF = temps entre 2 pannes CORRECTIVE CLOSED
- `src/server/queries/reports/query-get-technician-workload.ts` — nb interventions + heures par technicien
- `src/server/queries/reports/query-get-maintenance-cost.ts` — valorisation stock consommé par période
- `src/server/queries/reports/query-get-intervention-trends.ts` — nb interventions par semaine/mois
- `src/app/(app)/reports/page.tsx` — page d'accueil rapports avec navigation
- `src/app/(app)/reports/machines/page.tsx` — MTBF + top pannes + coût par machine
- `src/app/(app)/reports/technicians/page.tsx` — charge + performance par technicien
- `src/app/(app)/reports/stock/page.tsx` — valorisation, consommation, rotations
- `src/app/(app)/reports/interventions/page.tsx` — tendances, SLA, types
- Graphiques avec **Recharts** (barres, courbes, camemberts) — à ajouter aux dépendances
- Filtres par période (datepicker date-fns) et par site

---

### 1.3 Assistant IA — `AI_ASSISTANT` 🟠

Module défini, Groq API configurée, aucune intégration.

**À créer :**
- `src/server/actions/ai/action-generate-intervention-description.ts` — génère description à partir du titre + historique machine
- `src/server/actions/ai/action-analyze-recurring-failures.ts` — détecte patterns de pannes répétées
- `src/server/actions/ai/action-suggest-preventive-action.ts` — suggère action préventive basée sur historique
- Bouton "Générer avec IA ✨" sur le champ description des interventions (désactivé si module inactif)
- Section "Analyse IA" sur la page détail machine (si N pannes similaires → suggestion)
- `src/app/(app)/ai-assistant/page.tsx` — interface de chat pour questions libres sur les données

---

## 2. NOTIFICATIONS SYSTÈME 🔴

Aucune notification implémentée. Zéro alerte email ou in-app.

**Schema à ajouter :**
```prisma
model Notification {
  id         String   @id @default(cuid())
  tenantId   String
  userId     String   // destinataire (authUserId Better Auth)
  type       NotificationType
  title      String
  body       String
  link       String?  // URL de redirection
  readAt     DateTime?
  createdAt  DateTime @default(now())
}

enum NotificationType {
  INTERVENTION_ASSIGNED
  INTERVENTION_OVERDUE
  STOCK_LOW
  PREVENTIVE_DUE
  LICENSE_EXPIRING
  TRANSFER_PENDING
  TRANSFER_APPROVED
}
```

**À implémenter :**
- Migration + RLS pour table `Notification`
- `src/lib/notifications/notification-sender.ts` — service d'envoi (créer notif en DB + email optionnel)
- Appeler `sendNotification()` dans les actions existantes :
  - `action-assign-intervention.ts` → notif au technicien assigné
  - `action-update-intervention-status.ts` → notif si retard, si clôture
  - `action-consume-stock-part.ts` → notif rupture si `quantityOnHand` passe sous `minimumLevel`
- `src/components/layout/notification-bell.tsx` — cloche dans le header avec badge compteur non lus
- `src/app/(app)/notifications/page.tsx` — liste toutes les notifs avec "Marquer tout comme lu"
- `src/server/actions/notifications/action-mark-notification-read.ts`
- `src/server/queries/notifications/query-get-user-notifications.ts`
- Email (optionnel phase 2) : Resend ou Nodemailer pour les alertes critiques

---

## 3. PAGES PARAMÈTRES (settings vides) 🟠

### 3.1 `/settings` — Page principale 🟠
Page d'accueil des paramètres avec liens vers sous-sections. Actuellement inexistante.
- `src/app/(app)/settings/page.tsx` — index avec cards navigables

### 3.2 `/settings/modules` — Gestion des modules 🟠
- `src/app/(app)/settings/modules/page.tsx` — liste les modules avec statut actif/inactif
- Afficher : nom, description, prix, statut (actif/inactif)
- Bouton "Contacter pour activer" (lien vers email/Calendly) si module inactif
- Info : modules activés par le super-admin, page lecture seule pour client_admin
- `src/server/queries/modules/query-get-tenant-modules.ts` (probablement existe, vérifier)

### 3.3 `/settings/billing` — Licence et facturation 🟡
- `src/app/(app)/settings/billing/page.tsx`
- Afficher : plan actif, maxSites, maxUsers, sites utilisés / users utilisés, date renouvellement
- Barre de progression "X/Y utilisateurs", "X/Y sites"
- Alerte si renouvellement dans < 30 jours
- Bouton "Contacter l'équipe commerciale"
- `src/server/queries/billing/query-get-tenant-license.ts`

### 3.4 `/settings/general` — Paramètres généraux 🟡
- `src/app/(app)/settings/general/page.tsx`
- Modifier nom du tenant, email de contact
- Timezone (pour affichage dates)
- `src/server/actions/settings/action-update-tenant-settings.ts`

---

## 4. PROFIL UTILISATEUR 🟠

Page `/profile` vide ou inexistante.

**À créer :**
- `src/app/(app)/profile/page.tsx` — affiche email, nom, rôle, sites assignés
- Formulaire modifier son prénom/nom (appelle `auth.api.updateUser`)
- Formulaire changer mot de passe (appelle `auth.api.changePassword`)
- Section "Mes préférences notifications" (toggle email alerts)
- `src/server/actions/profile/action-update-profile.ts`

---

## 5. EXPORTS 🟠

### 5.1 Export CSV 🟠
Applicable à : interventions, machines, stock, mouvements de stock

**À créer :**
- `src/lib/export/csv-builder.ts` — helper générique
- Bouton "Exporter CSV" sur les pages de liste (machines, interventions, stock)
- `src/server/actions/export/action-export-interventions-csv.ts`
- `src/server/actions/export/action-export-machines-csv.ts`
- `src/server/actions/export/action-export-stock-csv.ts`

### 5.2 Bon de travail PDF 🟡
Rapport d'intervention imprimable (pour signature client ou archivage).

**À créer :**
- Dépendance : `@react-pdf/renderer` ou `puppeteer` (léger)
- `src/lib/pdf/intervention-report-template.tsx` — template React PDF
- `src/app/api/interventions/[id]/pdf/route.ts` — route API qui génère le PDF
- Bouton "Télécharger PDF" sur la page détail intervention
- Contenu : titre, machine, dates, technicien, statut, notes, pièces utilisées, signature

---

## 6. QR CODES — Impression et Scan 🟠

### 6.1 Affichage et impression QR machine 🟠
- `src/app/(app)/machines/[machineId]/qr-code/page.tsx` — page dédiée print-friendly
- Afficher le QR code (lib `qrcode.react`) encodant l'URL `https://app.domain.com/machines/[qrCodeSlug]`
- Bouton "Imprimer" (CSS print: masque navbar, agrandit QR)
- Optionnel : batch print plusieurs machines

### 6.2 Route de scan QR 🟠
- `src/app/(app)/m/[slug]/page.tsx` — URL courte pour scan terrain
- Redirige vers `/machines/[machineId]` après résolution du slug
- Si non authentifié → page login avec retour vers la machine
- `src/server/queries/machines/query-get-machine-by-qr-slug.ts`

### 6.3 QR code stock 🟡
- Même pattern que machine mais pour articles stock
- Permet scan rapide depuis `/stock/scan` avec caméra

**Dépendances à ajouter :**
- `qrcode.react` — rendu QR dans le browser

---

## 7. RECHERCHE ET FILTRES 🟠

### 7.1 Recherche globale 🟡
- `src/components/layout/global-search.tsx` — input dans la sidebar/header
- Recherche parmi : machines (nom, ref), interventions (titre), stock (nom, ref)
- Affiche résultats en dropdown avec liens directs
- Implémenter avec `useDebounce` + Server Action ou API route
- `src/server/queries/search/query-global-search.ts`

### 7.2 Filtres sur liste machines 🟠
- Filtre par statut (OPERATIONAL, UNDER_MAINTENANCE, OUT_OF_SERVICE, ARCHIVED)
- Filtre par catégorie (si défini)
- Tri par nom, statut, date installation
- Passer les filtres en searchParams URL (SSR compatible)

### 7.3 Filtres sur liste interventions 🟠
- Filtre par type (CORRECTIVE, PREVENTIVE, PREDICTIVE, INSPECTION) — déjà un peu présent
- Filtre par priorité
- Filtre par statut
- Filtre par technicien assigné
- Filtre par période (ce mois, cette semaine, custom)
- Recherche textuelle sur titre

### 7.4 Filtres sur liste stock 🟡
- Filtre par seuil d'alerte (en rupture uniquement)
- Tri par quantité (croissant/décroissant)
- Recherche par nom ou référence

### 7.5 Sélecteur de site côté client 🟠
- TODO explicite dans le code : `src/app/(app)/machines/page.tsx:16`
- Ajouter Select site dans les headers de : `/machines`, `/interventions`, `/stock`
- Passer `siteId` en searchParam URL (reste SSR)
- Mémoriser le dernier site sélectionné (localStorage ou cookie)

---

## 8. UX INTERVENTIONS — Champs manquants 🟠

### 8.1 Durée réelle à la clôture
- Ajouter champ `durationMinutes Int?` sur le modèle `Intervention` (migration)
- Afficher un dialog à la clôture : "Durée de l'intervention (minutes)" facultatif
- Afficher la durée sur la page détail et dans les rapports
- Calculer automatiquement si `startedAt` et `closedAt` existent

### 8.2 Diagnostic et action corrective
- Ajouter champs `diagnosticNotes String?` et `correctiveAction String?` sur `Intervention`
- Afficher dans le formulaire de clôture (modale) ou sur la page détail (édition inline)
- Alimenter les rapports MTBF/analyse récurrente

### 8.3 Chaîne de récurrence visible
- Sur la page détail d'une intervention préventive, afficher :
  - Lien "← Occurrence précédente" (via `parentInterventionId`)
  - Liste "Occurrences suivantes" (query par `parentInterventionId = id`)
- `src/server/queries/interventions/query-get-recurrence-chain.ts`

---

## 9. AUDIT TRAIL / HISTORIQUE DES MODIFICATIONS 🟡

Aucune traçabilité des changements.

**Schema à ajouter :**
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  tenantId   String
  userId     String   // authUserId
  action     String   // ex: "intervention.status_changed"
  entityType String   // "Intervention", "Machine", "StockItem"
  entityId   String
  before     Json?    // état avant
  after      Json?    // état après
  createdAt  DateTime @default(now())
}
```

**À implémenter :**
- Migration + RLS
- `src/lib/audit/audit-logger.ts` — helper `logAudit(tx, session, action, before, after)`
- Appeler dans les actions critiques : changement statut, modification, suppression
- `src/app/(app)/audit/page.tsx` — page visible pour `client_admin` uniquement
- Filtre par entité, par utilisateur, par période

---

## 10. PWA / OFFLINE 🟡

### 10.1 Icônes PWA manquantes 🟠
- Générer et placer dans `/public/icons/` :
  - `icon-192.png` (192×192)
  - `icon-512.png` (512×512)
  - `icon-512-maskable.png` (512×512 avec zone safe)
- Outils : [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) ou Figma

### 10.2 Offline queue 🟡
- Implémenter une queue IndexedDB pour sauvegarder les actions offline
- `src/lib/offline/offline-queue.ts` — `push(action)`, `flush()` au retour réseau
- Actions prioritaires : créer note intervention, changer statut, consommer pièce
- Indicateur visuel "Mode hors ligne" dans le header

### 10.3 Vue "Mes interventions du jour" 🟡
- `src/app/(app)/today/page.tsx` ou section dédiée dans le dashboard technicien
- Afficher uniquement les interventions assignées au technicien connecté, planifiées aujourd'hui
- Design épuré, adapté mobile : titre, machine, priorité, bouton "Démarrer"

---

## 11. ADMIN CONSOLE — Améliorations 🟡

### 11.1 Graphiques globaux sur `/admin`
- Courbe de croissance : nb tenants actifs par mois
- Courbe d'usage : nb interventions totales sur la plateforme
- Répartition des modules les plus activés

### 11.2 Recherche tenants améliorée
- Déjà un composant `AdminTenantsClient` avec search — vérifier qu'il est en place
- Ajouter filtre : actif/inactif, par module activé, par plan

### 11.3 Logs super-admin
- `src/app/(admin)/admin/logs/page.tsx` — actions admin (activation tenant, changement licence, etc.)

---

## 12. RÉCURRENCE PRÉVENTIVE — Compléter 🟡

### 12.1 Fin de récurrence
- Ajouter champ `recurrenceEndsAt DateTime?` sur `Intervention`
- À la génération d'une nouvelle occurrence, vérifier si `recurrenceEndsAt` est dépassé → ne pas créer
- Afficher/modifier dans le formulaire d'intervention

### 12.2 Gestion jours fériés / weekends
- Option "Reporter si weekend" : si la date calculée tombe samedi/dimanche → décaler au lundi
- Table `TenantHoliday` optionnelle pour jours fériés spécifiques

### 12.3 Vue historique récurrence
- Page ou section affichant toute la chaîne : occurrence 1 → 2 → 3 → ...
- Statuts de chaque occurrence (clôturée en temps, en retard, annulée)

---

## 13. PAGES MACHINE — Compléter 🟡

### 13.1 Afficher `startedAt` sur les interventions
- La page détail intervention n'affiche pas `startedAt` alors que le champ existe
- Ajouter dans le `<dl>` de détail : "Démarrée le" si `startedAt` n'est pas null
- Calculer et afficher la durée réelle si `startedAt` + `closedAt` existent

### 13.2 Statistiques machine
- Sur la page détail machine : nb total d'interventions, MTBF approximatif, coût total maintenance
- `src/server/queries/machines/query-get-machine-stats.ts`

---

## RÉCAPITULATIF PAR PRIORITÉ

### 🔴 HAUTE (fonctionnalités manquantes critiques)
1. Transferts inter-sites (schema présent, 0% UI)
2. Notifications in-app (assigner, retard, rupture stock)
3. Page `/settings/modules` — les clients doivent voir leurs modules
4. Page `/profile` utilisateur — changer son mot de passe, ses préfs

### 🟠 IMPORTANT (impact quotidien fort)
5. Sélecteur de site côté client (`/machines`, `/interventions`, `/stock`)
6. Recherche + filtres sur les listes (machines, interventions, stock)
7. Export CSV interventions et machines
8. QR code machine : affichage + impression + route de scan `/m/[slug]`
9. Rapports avancés (MTBF, charge tech, coût)
10. Page `/settings/billing` — afficher la licence client

### 🟡 UTILE
11. Bon de travail PDF (page détail intervention)
12. Audit trail (qui a modifié quoi)
13. Champs durée réelle + diagnostic à la clôture
14. Icônes PWA manquantes
15. Vue "Mes interventions du jour" pour technicien
16. Chaîne de récurrence visible sur la page détail
17. Assistant IA (Groq) — génération description, analyse pannes
18. Statistiques machine (MTBF, coût total)

### 🟢 BONUS (différenciateur)
19. Offline queue IndexedDB
20. Fin de récurrence + gestion weekends/fériés
21. Gestion des temps (timesheet par technicien)
22. Recherche globale (toutes entités)
23. Graphiques dashboard avancés (Recharts)
24. Logs admin console
25. Signature client sur bon de travail
26. Photos/vidéos sur les interventions
