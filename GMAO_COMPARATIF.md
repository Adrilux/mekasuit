# GMAO SaaS — État & Comparatif

> Dernière mise à jour : 2026-02-26

---

## LÉGENDE
- ✅ Implémenté
- ⚠️ Partiel
- ❌ Absent
- 🔥 Priorité haute
- 💡 Amélioration utile
- 🟦 Hors scope MVP

---

## 1. DASHBOARD

| Feature | Statut | Vrai GMAO |
|---|---|---|
| KPIs (ouvertes, critiques, en maint., total) | ✅ | ✅ |
| Table interventions ouvertes | ✅ | ✅ |
| Graphiques | ❌ | ✅ |
| Filtre par site | ❌ | ✅ |
| Widget stock bas | ❌ | ✅ |
| KPI interventions en retard | ❌ | ✅ |
| MTTR / MTBF | ❌ | ✅ |

**À faire :**
- 🔥 Widget "stock en rupture" (données déjà là)
- 🔥 KPI "Interventions en retard" (scheduledAt < now)
- 🔥 Filtre par site (multi-sites)
- 💡 Graphique interventions sur 30j

---

## 2. MACHINES

| Feature | Statut | Vrai GMAO |
|---|---|---|
| CRUD complet | ✅ | ✅ |
| Statuts (OPERATIONAL / UNDER_MAINTENANCE / DECOMMISSIONED) | ✅ | ✅ |
| QR Code slug | ✅ | ✅ |
| Catégorie, fabricant, modèle, N° série | ✅ | ✅ |
| Archivage bloqué si intervention ouverte | ✅ | ✅ |
| Page QR imprimable | ❌ | ✅ |
| Photo machine | ❌ | ✅ |
| Documents attachés (PDF) | ❌ | ✅ |
| Localisation (bâtiment, ligne) | ❌ | ✅ |
| Date garantie / fin contrat | ❌ | ✅ |
| Compteur heures / cycles | ❌ | Avancé |

**À faire :**
- 🔥 Page `/machines/[id]/qr` — QR code imprimable (lib `qrcode`)
- 💡 Champ `location` (texte libre : "Bât. A, ligne 3")
- 💡 Champ `warrantyUntil`
- 💡 Upload photo (S3 / Cloudflare R2)
- 🟦 Compteur heures

---

## 3. INTERVENTIONS

| Feature | Statut | Vrai GMAO |
|---|---|---|
| 4 types (PREVENTIVE, CORRECTIVE, PREDICTIVE, INSPECTION) | ✅ | ✅ |
| 5 statuts + transitions | ✅ | ✅ |
| 4 priorités dont CRITICAL | ✅ | ✅ |
| Assignation technicien | ✅ | ✅ |
| Notes / journal horodaté | ✅ | ✅ |
| Pièces consommées (si module stock) | ✅ | ✅ |
| Récurrence préventive (7 types) | ✅ | ✅ |
| Génération auto à la clôture | ✅ | ✅ |
| Statut machine auto | ✅ | ✅ |
| Filtre avancé (type, période, tech, machine) | ❌ | ✅ |
| Temps passé (heures MO) | ❌ | ✅ |
| Coût total (MO + pièces) | ❌ | ✅ |
| Photos / pièces jointes | ❌ | ✅ |
| Export PDF bon d'intervention | ❌ | ✅ |
| Checklist / gamme opératoire | ❌ | ✅ |
| Notification email à l'assignation | ❌ | ✅ |

**À faire :**
- 🔥 Champ `durationMinutes` (temps passé)
- 🔥 Export PDF bon d'intervention
- 🔥 Filtre avancé sur la liste
- 💡 Checklist pré-saisie pour préventives
- 💡 Notification email assignation (Resend)
- 🟦 Signature numérique à la clôture

---

## 4. PRÉVENTIVES (page dédiée)

| Feature | Statut | Vrai GMAO |
|---|---|---|
| Board par catégories temporelles | ✅ | ✅ |
| Filtre par technicien | ✅ | ✅ |
| Assignation rapide inline | ✅ | ✅ |
| Badge récurrence | ✅ | ✅ |
| Vue calendrier | ❌ | ✅ |
| Durée estimée | ❌ | ✅ |
| Planification en masse | ❌ | Avancé |

**À faire :**
- 🔥 Vue calendrier mensuel (FullCalendar ou react-big-calendar)
- 💡 Champ `estimatedDurationMinutes`
- 💡 Bouton "Planifier" inline (date picker)

---

## 5. STOCK

| Feature | Statut | Vrai GMAO |
|---|---|---|
| CRUD articles (référence, unité, coût, seuil) | ✅ | ✅ |
| Mouvements IN / OUT / ADJUSTMENT | ✅ | ✅ |
| Historique mouvements | ✅ | ✅ |
| Alertes stock bas | ✅ | ✅ |
| Consommation atomique liée aux interventions | ✅ | ✅ |
| Scanner code-barres | ✅ | ✅ |
| Modèle transferts inter-sites | ✅ | ✅ |
| UI transferts inter-sites | ❌ | ✅ |
| Valeur totale stock (qté × coût) | ❌ | ✅ |
| Fournisseurs / référence fournisseur | ❌ | ✅ |
| Export inventaire CSV | ❌ | ✅ |
| Commandes fournisseurs | ❌ | Avancé |

**À faire :**
- 🔥 UI transferts inter-sites (modèle DB déjà là)
- 🔥 KPI valeur totale stock
- 💡 Export CSV inventaire
- 💡 Champ `supplierRef` sur les articles
- 🟦 Module commandes fournisseurs

---

## 6. UTILISATEURS & RÔLES

| Feature | Statut | Vrai GMAO |
|---|---|---|
| 5 rôles système | ✅ | ✅ |
| Rôles custom par tenant | ✅ | Rare |
| Invitation + création compte auto | ✅ | ✅ |
| Forçage changement mdp | ✅ | ✅ |
| Assignation par site | ✅ | ✅ |
| Édition inline | ✅ | ✅ |
| Email d'invitation avec credentials | ❌ | ✅ |
| Audit log (qui a fait quoi) | ❌ | ✅ |
| Avatar / photo | ❌ | Cosmétique |

**À faire :**
- 🔥 Email d'invitation avec credentials (Resend — rapide)
- 💡 Audit log simple (table `AuditLog`)
- 💡 Avatar

---

## 7. RAPPORTS (module ADVANCED_REPORTS)

| Feature | Statut | Vrai GMAO |
|---|---|---|
| Page | ❌ vide | ✅ |
| MTTR / MTBF | ❌ | ✅ |
| Charge technicien | ❌ | ✅ |
| Coût maintenance | ❌ | ✅ |
| Taux de disponibilité | ❌ | ✅ |
| Historique par machine | ❌ | ✅ |
| Export PDF / Excel | ❌ | ✅ |

**À faire :**
- 🔥 C'est le module le plus vendu. À faire en Phase 2.
- 🔥 Tableau récap par machine (nb interventions, temps total, coût)
- 🔥 Graphique interventions par mois
- 💡 MTTR = somme(closedAt - startedAt) / nb interventions
- 💡 MTBF = intervalle moyen entre deux correctives sur une machine

---

## 8. ASSISTANT IA (module AI_ASSISTANT)

| Feature | Statut |
|---|---|
| Page | ❌ vide |
| Chat contextuel sur intervention | ❌ |
| Suggestions pièces basées historique | ❌ |
| Prédiction pannes | ❌ |

**À faire :**
- 💡 Chat sur une intervention : résumer les notes, suggérer des actions (Groq déjà configuré)
- 💡 Suggestion de pièces basées sur l'historique machine
- 🟦 Prédiction de pannes (nécessite beaucoup de data)

---

## 9. PARAMÈTRES / ADMIN CLIENT

| Feature | Statut |
|---|---|
| Gestion rôles custom | ✅ |
| Page modules (activation) | ❌ vide |
| Page billing | ❌ vide |
| Gestion sites depuis settings | ❌ |

**À faire :**
- 🔥 Page `/settings/modules` — le client_admin active ses modules lui-même
- 💡 Page `/settings/billing` — afficher plan, dates, compteurs utilisés/max

---

## 10. SUPER ADMIN

| Feature | Statut |
|---|---|
| Liste + création tenants | ✅ |
| Gestion licence | ✅ |
| Activation modules | ✅ |
| Link/unlink utilisateurs | ✅ |
| Dark theme | ✅ |
| Recherche / filtre tenants | ❌ |
| Stats globales | ❌ |

**À faire :**
- 💡 Barre de recherche tenants
- 💡 Stats globales en haut (nb tenants actifs, nb interventions totales)

---

## ROADMAP SYNTHÉTIQUE

### Phase 1 — Quick wins (< 1 jour chacun)
| # | Feature | Effort |
|---|---|---|
| 1 | Widget stock bas sur dashboard | 2h |
| 2 | KPI interventions en retard | 1h |
| 3 | Valeur totale stock | 1h |
| 4 | UI transferts inter-sites | 4h |
| 5 | Champ `durationMinutes` interventions | 2h |
| 6 | Email invitation avec credentials (Resend) | 3h |
| 7 | Page `/settings/modules` | 3h |
| 8 | Page QR machine imprimable | 2h |

### Phase 2 — Fonctionnalités manquantes critiques (1-3 jours)
| # | Feature | Effort |
|---|---|---|
| 1 | Rapports de base (MTTR, charge, coût) | 2j |
| 2 | Export PDF bon d'intervention | 1j |
| 3 | Vue calendrier préventives | 1j |
| 4 | Filtre avancé liste interventions | 4h |
| 5 | Champ `location` sur machine | 1h |

### Phase 3 — Différenciants (3-7 jours)
| # | Feature |
|---|---|
| 1 | Assistant IA sur les interventions |
| 2 | Checklist / gamme opératoire préventives |
| 3 | Notifications email assignation |
| 4 | Upload photos (machines + interventions) |
| 5 | Audit log |

### Hors scope MVP
- Commandes fournisseurs
- Compteur heures machines
- Prédiction de pannes IA
- Signature numérique
