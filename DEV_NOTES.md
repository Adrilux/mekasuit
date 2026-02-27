# GMAO SaaS — Notes de développement

> **NE PAS COMMITER** — contient des identifiants locaux

---

## Comptes utilisateurs (seed de démo)

> Les comptes Better Auth sont créés via `/register` ou `/api/auth/sign-up`.
> Le seed ne crée pas de comptes — il crée uniquement le tenant et les données.

| Rôle          | Email                  | Mot de passe  | Comment créer                              |
|---------------|------------------------|---------------|--------------------------------------------|
| super_admin   | admin@example.com      | _(libre)_     | `/register` avec cet email exact → rôle auto-attribué |
| client_admin  | _(libre)_              | _(libre)_     | `/register` → lier au tenant depuis `/super-admin` |
| technician    | _(libre)_              | _(libre)_     | Invité depuis `/users` → reçoit un lien → `/register` → `/onboarding` |

**Tenant de démo :** Heinrich & Bock (`slug: heinrich-bock`)
- 2 sites : Atelier Küstrin, Atelier Frankfurt
- 4 machines de démo
- 4 articles en stock

---

## Base de données (Neon PostgreSQL)

| Variable               | Valeur                                                                                                    |
|------------------------|-----------------------------------------------------------------------------------------------------------|
| `DATABASE_URL`         | `postgresql://neondb_owner:npg_I54RcKhAaWZX@ep-young-thunder-aloyemd5-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `DATABASE_URL_UNPOOLED`| `postgresql://neondb_owner:npg_I54RcKhAaWZX@ep-young-thunder-aloyemd5.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| Région                 | AWS eu-central-1 (Frankfurt)                                                                              |
| Provider               | Neon — [console.neon.tech](https://console.neon.tech)                                                    |

---

## Variables d'environnement (.env.local)

```
APP_ENV=development
DATABASE_URL=...                        # connexion poolée (PgBouncer) — app
DATABASE_URL_UNPOOLED=...               # connexion directe — migrations + scripts
BETTER_AUTH_SECRET=yyKOzSRqfHMzc2qvvESm1P8Gj8S1TikL
BETTER_AUTH_URL=http://localhost:3000
GROQ_API_KEY=gsk_...                    # optionnel — module AI
LOG_LEVEL=debug
SUPER_ADMIN_EMAIL=admin@example.com
```

---

## Commandes utiles

### Développement

```bash
npm run dev          # Lance le serveur Next.js (http://localhost:3000)
npm run build        # Build de production
npm run start        # Lance le build de production
npm run lint         # Vérification ESLint
npx tsc --noEmit     # Vérification TypeScript sans compiler
```

### Base de données

```bash
npm run db:migrate          # Crée + applique une migration (dev)
npm run db:migrate:prod     # Applique les migrations en production
npm run db:push             # Synchronise le schéma sans migration (proto)
npm run db:generate         # Régénère le client Prisma après modif schema
npm run db:studio           # Interface Prisma Studio (http://localhost:5555)
npm run db:seed             # Injecte les données de démo (Heinrich & Bock)
```

### Scripts RLS / maintenance

```bash
npx tsx scripts/apply-rls.ts   # Applique les politiques RLS PostgreSQL
```

---

## Flux de démarrage (premier lancement)

1. Copier `.env.example` → `.env.local` et remplir les valeurs
2. `npm run db:migrate` — appliquer les migrations
3. `npx tsx scripts/apply-rls.ts` — activer les politiques RLS
4. `npm run db:seed` — injecter les données de démo
5. `npm run dev` — démarrer l'app
6. Aller sur `/register` → créer le compte super admin avec l'email `SUPER_ADMIN_EMAIL`
7. Aller sur `/super-admin` → lier le compte au tenant Heinrich & Bock

---

## URLs locales

| Page                  | URL                                      |
|-----------------------|------------------------------------------|
| App (dashboard)       | http://localhost:3000/dashboard          |
| Login                 | http://localhost:3000/login              |
| Register              | http://localhost:3000/register           |
| Onboarding (invite)   | http://localhost:3000/onboarding         |
| Super Admin           | http://localhost:3000/super-admin        |
| Machines              | http://localhost:3000/machines           |
| Interventions         | http://localhost:3000/interventions      |
| Stock                 | http://localhost:3000/stock              |
| Scan code-barre       | http://localhost:3000/stock/scan         |
| Prisma Studio         | http://localhost:5555                    |

---

## Stack

| Composant      | Version  | Notes                                    |
|----------------|----------|------------------------------------------|
| Next.js        | 16.1.6   | App Router, Turbopack, Server Actions    |
| React          | 19.2.3   |                                          |
| Prisma         | 7.4.1    | Query Compiler WASM + adapter-pg requis  |
| Better Auth    | 1.4.19   | Sessions, rôles, multi-tenant            |
| Tailwind CSS   | 4        | + shadcn/ui                              |
| PostgreSQL      | 16       | Neon (serverless), RLS activé            |
