# MekaSuite — Suivi de qualité par fonctionnalité

> **Légende** : ✅ OK | ⚠️ Partiel / Bug | ❌ Absent

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

### Restant

- Signature électronique (non demandée pour l'instant)
- SLA / temps de réponse (non demandé pour l'instant)
- Planning visuel calendrier (prévu dans 1.3)
- Modèles d'intervention (prévu dans 1.3)

