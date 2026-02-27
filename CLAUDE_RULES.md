# CLAUDE_RULES.md — Règles absolues du projet GMAO SaaS

## Lecture obligatoire en début de session
Avant toute intervention sur ce projet, lire impérativement :
- `PROJECT_STATE.md` — carte complète du code (routes, actions, queries, composants, todos)
- `MEMORY.md` (dans `.claude/projects/d--saas/memory/`) — patterns critiques, pièges connus, stack

Ces deux fichiers permettent d'avoir une vue globale sans explorer le code à l'aveugle.

## Stack technique
- Next.js 15 (App Router, Server Components par défaut)
- TypeScript strict
- Tailwind CSS + Shadcn/ui
- PostgreSQL + Prisma + Row Level Security (RLS)
- Better Auth (multi-tenant)
- Groq API (IA ponctuelle, jamais en temps réel sur chaque frappe)
- next-pwa (PWA, offline partiel)
- Hébergement : Vercel + Neon PostgreSQL

## Règles d'architecture — NON NÉGOCIABLES

### 1 fichier = 1 responsabilité
- Jamais plus de ~300 lignes par fichier
- Si un fichier grossit, on le découpe
- Noms de fichiers longs et descriptifs si nécessaire
- Ex : `query-get-interventions-by-site.ts` pas `queries.ts`

### Multi-tenant
- Chaque table a un champ `tenantId`
- RLS PostgreSQL activé sur toutes les tables tenant-scoped
- CHAQUE appel DB passe par `withTenantContext()` — jamais de requête directe sans contexte tenant
- Jamais faire confiance au filtre applicatif seul, RLS est le filet de sécurité

### Sécurité
- Validation Zod sur TOUS les inputs (server actions, API routes)
- Requêtes paramétrées uniquement via Prisma — zéro concaténation SQL
- Pas de données sensibles dans les logs en production
- Permissions vérifiées côté serveur AVANT toute action

### Server vs Client Components
- Server Components par défaut — pas de "use client" sans raison
- "use client" uniquement si : état React local, event handlers, hooks navigateur
- Les queries DB ne passent JAMAIS dans un Client Component

### Server Actions
- Un fichier par action : `action-create-intervention.ts`
- Ordre immuable dans chaque action :
  1. Vérifier la session
  2. Vérifier les permissions (rôle)
  3. Vérifier la licence (limites sites/users)
  4. Valider l'input (Zod)
  5. Exécuter avec `withTenantContext()`
  6. Retourner `{ success, data?, error? }`

### Gestion des erreurs
- Classes d'erreur typées : `AppError`, `AuthError`, `ModuleError`, `LicenseError`
- En développement : stack trace complète
- En production : code d'erreur sanitisé, jamais de stack ou détail DB
- Logger structuré, niveau contrôlé par `LOG_LEVEL` dans l'env

## Environnements
- `APP_ENV` : `development` | `staging` | `production` | `debug`
- `.env.local` : secrets locaux, jamais commité
- `.env.example` : commité, toutes les clés avec valeur placeholder
- Validation des vars d'env au démarrage via Zod — crash explicite si variable manquante

## Modules
- Définis dans `src/lib/modules/module-definitions.ts`
- Stockés en DB dans `tenant_modules`
- Vérification TOUJOURS côté serveur via `ModuleFeatureGuard`
- GMAO est toujours actif, ne peut pas être désactivé
- `INTER_SITE_TRANSFERS` requiert `STOCK_MANAGEMENT`

## Rôles
```
super_admin      → accès total plateforme (moi)
client_admin     → configure son tenant (sites, users, modules)
workshop_manager → voit ses sites, valide interventions, gère stock
technician       → saisit interventions, consulte machines, consomme stock
reader           → lecture seule dashboards et rapports
```

## Pricing / Licence
- Base : GMAO + 1 site + 5 users
- Chaque site supplémentaire = facturation
- Users au-delà du seuil = facturation par tranche
- Modules optionnels = facturation séparée
- Vérification de licence dans chaque action qui crée un site ou un user

## PWA / Offline
- Techniciens peuvent être sans réseau → formulaire d'intervention offline
- Queue IndexedDB pour les actions offline
- Background sync quand la connexion revient
- Page offline dédiée : `/offline`

## Conventions de code
- Nommage : kebab-case pour fichiers, PascalCase pour composants, camelCase pour fonctions
- Exports nommés uniquement — pas de `export default` sauf pour les pages Next.js
- Types Zod = source de vérité pour les inputs, types inférés ensuite
- Les montants monétaires = entiers en centimes (jamais de float)
- Les dates = UTC en DB, formatage côté client selon locale

## UX & Qualité produit — OBLIGATOIRE

### États de chargement
- Tout bouton qui déclenche une action async doit avoir un état `loading` visible (spinner ou texte "...")
- Jamais laisser l'utilisateur cliquer deux fois : désactiver le bouton pendant le traitement (`disabled={loading}`)
- Les transitions de page (navigation) doivent être fluides — utiliser `router.refresh()` avec parcimonie, préférer les mises à jour locales optimistes quand possible

### Feedback utilisateur
- **Toast sur toute action** : succès en vert, erreur en rouge, avec un message clair et actionnable
- Messages d'erreur en français, compréhensibles par un non-développeur ("Stock insuffisant" pas "CONSTRAINT_VIOLATION")
- **États vides significatifs** : jamais une page blanche — toujours un message + illustration + bouton CTA si applicable
- Confirmations pour les actions destructives (suppression, archivage) via dialog — jamais un `window.confirm()`

### Cohérence visuelle
- Même pattern partout : header page → liste/tableau → empty state → formulaire
- Badges de statut identiques sur toutes les pages (même couleurs, même tailles)
- Boutons d'action primaires toujours à droite dans les headers
- Icônes Lucide uniquement — pas de mélange avec d'autres librairies d'icônes

### Performance perçue
- Les pages critiques (dashboard, liste interventions) chargent en < 500ms — pas de N+1 queries
- `Promise.all()` pour les requêtes indépendantes en parallèle
- Les Server Components chargent les données côté serveur — pas de loading spinners sur la page entière
- Pas de revalidation inutile : `router.refresh()` seulement si la donnée affichée a réellement changé

### Accessibilité minimale
- Tous les `<button>` ont un `title` ou un label visible
- Les inputs ont toujours un `<label>` associé
- Les couleurs seules ne suffisent pas à transmettre une information (toujours ajouter une icône ou un texte)

### Internationalisation
- Toute l'interface en **français** — pas de mélange EN/FR dans les labels, messages, placeholders
- Dates formatées en `fr-FR` partout (`toLocaleDateString("fr-FR")`)
- Nombres : séparateur décimal virgule, séparateur milliers espace

## Responsive Design — OBLIGATOIRE
- **Toutes les pages sont responsives** — mobile-first, pas d'exception
- Breakpoints Tailwind : `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Grilles : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — jamais de grille fixe sans responsive
- Tableaux : sur mobile, envelopper dans `overflow-x-auto` OU basculer en liste de cartes avec `hidden sm:table` / `sm:hidden`
- Textes : tailles adaptées (`text-sm` sur mobile, `text-base` sur desktop si nécessaire)
- Headers/actions : `flex-col sm:flex-row` — jamais de row fixe sur petit écran
- Padding/spacing : réduits sur mobile (`px-4 sm:px-6 lg:px-8`)
- Largeurs fixes (`max-w-3xl`, `w-52`) : acceptées pour les contenus centrés mais toujours `w-full` en dessous du breakpoint
- Sidebar : cachée sur mobile avec toggle burger (à gérer dans le layout)

## Ergonomie & gain de temps — OBLIGATOIRE
- **Penser toujours au technicien sur le terrain** : chaque action doit être rapide, avec le moins de clics possible
- **Récurrence préventive** : à la clôture d'une préventive, la nouvelle occurrence hérite automatiquement de TOUTES les données récurrentes (matériaux prévus, description, technicien assigné, priorité, machine) — ne jamais forcer une re-saisie
- **Matériaux prévus** : copiés automatiquement sur chaque occurrence suivante — l'utilisateur ne les ressaisit jamais
- **Bulk actions** : si une opération peut s'appliquer à N éléments, proposer un bouton "Tout faire" (ex: "Tout consommer")
- **Valeurs par défaut intelligentes** : pré-remplir les champs avec la valeur la plus probable (quantité = quantité prévue, site = site actif, etc.)
- **Inline editing** : préférer l'édition inline (sans navigation) pour les champs fréquemment modifiés

## Tout est modifiable — RÈGLE ABSOLUE
L'utilisateur ne doit JAMAIS être bloqué par un état figé. Tout ce qui a été créé ou saisi peut être corrigé :
- **Champs de base** (titre, description, priorité, type) : toujours modifiables via une page `/edit`, même après création
- **Statuts** : les transitions doivent couvrir les cas réels — un technicien peut se tromper, revenir en arrière doit être possible tant que ce n'est pas terminal (CLOSED/CANCELLED sont les seuls vrais terminaux)
- **Consommation de stock** : une pièce consommée peut être "déconsommée" pour corriger une erreur (le stock est remis à jour en sens inverse)
- **Matériaux prévus** : modifiables tant que non consommés ; si déjà consommé, proposer un "annuler la consommation" avant de modifier
- **Assignation technicien** : modifiable à tout moment, même sur une intervention en cours
- **Quantités planifiées** : ajustables tant que l'intervention n'est pas clôturée
- **Dates planifiées** : toujours modifiables (report de maintenance = cas très fréquent)
- **Lien machine/site** : modifiable sur les entités qui ne sont pas clôturées
- **Règle générale** : si une donnée peut changer dans la vie réelle, l'app doit permettre de la corriger. Ne jamais créer de champ ou d'état "en lecture seule définitive" sans raison métier explicite.
- **Supprimer ≠ corriger** : l'utilisateur ne doit jamais être obligé de supprimer et recréer un enregistrement pour corriger une erreur de saisie

## Robustesse & fiabilité — OBLIGATOIRE
- **Zéro perte de données silencieuse** : toute action destructive (suppression, consommation de stock) est atomique et réversible si possible
- **Validation côté serveur** même si le front a déjà validé — jamais faire confiance au client seul
- **Gestion des edge cases** : que se passe-t-il si le stock est à 0 ? Si l'utilisateur est désactivé entre deux requêtes ? Prévoir et gérer explicitement
- **Pas d'état incohérent** : si une opération multi-étapes échoue à mi-chemin, rollback complet via transaction Prisma
- **Idempotence** : une action rejouée deux fois (double-clic, retry) ne doit pas créer de doublon ni corrompre les données

## Ce qu'on ne fait PAS
- Pas de fichiers "fourre-tout" (utils.ts, helpers.ts génériques)
- Pas d'abstraction prématurée pour un usage unique
- Pas de commentaires évidents — seulement si la logique n'est pas claire
- Pas de `any` TypeScript
- Pas de requête DB dans un composant Client
- Pas de secret dans le code source
- Pas de `console.log` en production (utiliser le logger structuré)
- Pas de placeholder UI non fonctionnel livré sans indication claire que c'est en cours
- Pas de feature à moitié faite : une fonctionnalité est soit complète et testable, soit pas encore présente
