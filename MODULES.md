# MekaSuite — Catalogue complet des modules & fonctionnalités

> **Convention** : ✅ = déjà implémenté | 🔲 = à développer
> Chaque fonctionnalité est autonome et activable indépendamment dans son module.

---

## MODULE 1 — GMAO *(obligatoire, inclus dans tout abonnement)*

### 1.1 Machines
Gérer le parc d'équipements de l'atelier.

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Fiche machine | Nom, n° série, catégorie, fabricant, modèle, date installation, statut, notes libres | Créer, modifier, archiver, restaurer, changer statut |
| ✅ QR code terrain | QR code unique par machine, imprimable, accès fiche depuis mobile sans login. Slug régénérable. | Générer, imprimer, régénérer slug |
| ✅ Historique interventions | Liste de toutes les interventions passées sur la machine | Lecture |
| ✅ Statistiques machine | MTBF, coût total maintenance, nombre interventions ouvertes/fermées | Lecture |
| ✅ Archivage | Mettre une machine hors service (bloqué si interventions ouvertes). Désarchivage possible. | Archiver, restaurer |
| ✅ Pièces jointes | Photos, manuels PDF, fiches techniques liés à la machine. Stockage local VPS. Max 10 Mo. | Ajouter, supprimer, télécharger |
| ✅ Timeline machine | Vue chronologique : interventions créées/clôturées/annulées + audit logs (changements statut, archivage) | Lecture |
| ✅ Compteurs machine | Heures de fonctionnement, cycles, km. Saisie manuelle. Déclenche préventive automatiquement quand seuil atteint, recalibre le seuil par intervalle | Saisir relevé, voir historique relevés, configurer seuil + intervalle |
| ✅ Arborescence composants | Machine → sous-ensemble → pièce (BOM). Multi-niveaux. Chaque composant peut être lié à un article stock (badge quantité + alerte rupture) | Créer nœud, modifier, déplacer (anti-cycle), supprimer (cascade), lier à article stock |

### 1.2 Interventions
Gérer les demandes et ordres de travail (OT) de maintenance.

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Créer intervention | Titre, description, type (corrective/préventive/prédictive/inspection), priorité (low/medium/high/critical), machine cible, date planifiée, technicien assigné | Créer |
| ✅ Modifier intervention | Modifier les champs avant clôture | Modifier titre, description, type, priorité, date |
| ✅ Changer statut | Pipeline de statuts avec transitions contrôlées | OPEN → IN_PROGRESS → PENDING_PARTS → CLOSED ou CANCELLED |
| ✅ Assigner technicien | Affecter ou réaffecter un technicien. Notification envoyée | Assigner, désassigner |
| ✅ Notes & journal | Commentaires horodatés sur l'avancement. Texte libre (5000 car. max) | Ajouter note |
| ✅ Clôture enrichie | À la clôture : saisie durée réelle (min) + diagnostic final | Saisir lors fermeture |
| ✅ Impression fiche | Fiche intervention imprimable (HTML → PDF navigateur) | Imprimer |
| ✅ Annulation | Annuler une intervention avec traçabilité | Annuler |
| ✅ Pièces jointes | Photos avant/après, documents PDF. Stockage local VPS. Max 10 Mo. | Ajouter, supprimer, télécharger |
| ✅ Pointage heures | Technicien démarre/stoppe une session de pointage. Plusieurs sessions possibles. Total calculé automatiquement. | Démarrer chrono, stopper, supprimer session, voir total |
| ✅ Checklists | Liste de points à valider. Items requis marqués *. Modèles réutilisables configurables dans /settings/checklists | Cocher item, ajouter item à la volée, créer depuis modèle, supprimer checklist |
| 🔲 Signature électronique | Signature du technicien et/ou du responsable à la clôture. Stockée comme image | Signer sur mobile, voir signature, invalider |
| 🔲 SLA / temps de réponse | Délai maximum par priorité (ex: critical = 2h). Alerte si dépassé. Suivi taux de respect | Configurer SLA par priorité, voir alertes dépassement |

### 1.3 Préventive & Récurrence
Planifier la maintenance préventive.

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Récurrence automatique | À la clôture d'une préventive, la suivante est créée automatiquement selon la fréquence (hebdo, mensuelle, etc.) | Configurer fréquence, date fin récurrence |
| ✅ Matériaux prévus | Liste de pièces planifiées pour une préventive. ⚠️ Dépend du module Stock — masqué si Stock inactif | Ajouter, modifier, supprimer, consommer tout en masse |
| ✅ Chaîne de récurrence | Vue de toutes les occurrences passées et futures d'une même préventive | Lecture |
| ✅ Planning visuel | Calendrier mois/semaine des interventions planifiées. Couleur par priorité, clic → fiche intervention. Route /planning | Voir calendrier, changer vue mois/semaine |
| ✅ Modèles d'intervention | Créer un modèle réutilisable (nom, description, type, priorité, checklist). Pré-remplit le formulaire à la création. Géré dans /settings/templates | Créer modèle, modifier, supprimer, utiliser à la création |
| ✅ Déclenchement par compteur | Quand un compteur machine atteint un seuil → créer automatiquement une préventive. Seuil recalibré par intervalle après déclenchement | Configurer seuil + intervalle sur le compteur, lié au modèle d'intervention |

---

## MODULE 2 — GESTION DU STOCK *(optionnel, dépend GMAO)*

### 2.1 Catalogue articles
Gérer le référentiel des pièces et consommables.

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Fiche article | Référence unique, nom, unité, quantité en stock, seuil minimum, prix unitaire | Créer, modifier, supprimer |
| ✅ Lier article à machine | Associer optionnellement un article à une machine (pièce dédiée) | Lier, délier |
| ✅ Alertes rupture | Article signalé comme "rupture" si quantité ≤ seuil minimum. Badge rouge visible partout | Automatique, configurer seuil |
| ✅ Historique mouvements | Traçabilité de tous les mouvements IN/OUT/ADJUSTMENT/TRANSFER sur l'article | Lecture, filtrer par période |
| ✅ QR code article | Générer et imprimer une étiquette QR code par article (référence + nom). Accès direct à la fiche via scan | Générer, imprimer étiquette (bouton "Étiquette QR" sur la fiche) |
| ✅ Fournisseurs | Lier un article à un ou plusieurs fournisseurs avec référence fournisseur et prix d'achat. Panneau sur la fiche article | Créer fournisseur, lier article, modifier, délier |
| ✅ Délai réapprovisionnement | Délai estimé en jours par lien article-fournisseur. Visible dans le panneau fournisseurs | Configurer lors du lien article↔fournisseur |

### 2.2 Mouvements de stock

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Entrée en stock | Réception de pièces (type IN). Quantité, raison optionnelle | Enregistrer entrée |
| ✅ Sortie manuelle | Retrait manuel sans lien intervention (type OUT) | Enregistrer sortie |
| ✅ Ajustement inventaire | Correction de quantité (type ADJUSTMENT) avec raison obligatoire | Enregistrer ajustement |
| ✅ Scan code-barres | Faire une entrée/sortie via scan mobile (caméra ou douchette) | Scanner, valider mouvement |
| ✅ Consommation sur intervention | Enregistrer les pièces utilisées sur une intervention. Décrémente le stock automatiquement. Réversible | Ajouter pièce, retirer pièce (remet le stock) |
| ✅ Inventaire physique | Session couvrant tous les articles du site. Saisie quantités réelles, écart calculé en temps réel, validation génère des ajustements ADJUSTMENT en masse. Route /stock/inventory | Ouvrir session, saisir comptage article par article, valider et clôturer |
| ✅ Annulation mouvement | Workshop manager+ peut annuler tout mouvement IN/OUT/ADJUSTMENT (pas les transferts). Génère un ADJUSTMENT compensatoire. Ligne marquée "Annulé" sur la fiche article | Annuler avec raison optionnelle depuis la fiche article |

### 2.3 Transferts inter-sites

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Demande de transfert | Demander l'envoi d'un article d'un site source à un site destination | Créer demande (article, quantité, site destination) |
| ✅ Approbation transfert | Manager du site source approuve ou rejette | Approuver, rejeter |
| ✅ Complétion transfert | Confirmation réception côté destination. Mouvements TRANSFER_OUT/IN générés automatiquement | Compléter |
| ✅ Notification transfert | Managers notifiés à chaque étape | Automatique |

### 2.4 Commandes fournisseurs *(🔲 à créer)*

| Fonctionnalité | Description | Opérations |
|---|---|---|
| 🔲 Bon de commande | Créer un BC avec lignes par article (référence, quantité, prix unitaire, fournisseur) | Créer, modifier, supprimer ligne |
| 🔲 Statuts BC | Workflow : DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED → CANCELLED | Changer statut |
| 🔲 Réception partielle | Réceptionner une partie seulement du BC. Génère mouvements IN proportionnels | Saisir quantités reçues, valider réception |
| 🔲 Lien rupture → commande | Depuis un article en rupture, créer directement un BC pré-rempli | Action rapide sur fiche article |
| 🔲 Historique commandes | Voir toutes les commandes passées, statuts, fournisseurs | Lecture, filtrer |

---

## MODULE 3 — RAPPORTS AVANCÉS *(optionnel)*

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ MTBF par machine | Temps moyen entre pannes (interventions correctives) par machine | Lecture, filtrer par site/période |
| ✅ Charge technicien | Interventions par technicien (total, ouvertes, fermées, correctives, préventives, critiques) | Lecture, filtrer par période |
| ✅ Coût maintenance | Coût pièces consommées par machine. Valorisation stock consommé | Lecture, filtrer par site/période |
| 🔲 Taux de disponibilité | Ratio temps machine OPERATIONAL vs total. Par machine et par site | Lecture, filtrer par période |
| 🔲 Rapport SLA | Taux de respect des délais d'intervention par priorité. Évolution dans le temps | Lecture, exporter |
| 🔲 Export rapport | Exporter un rapport en PDF mis en page avec logo tenant | Exporter |
| 🔲 Rapport personnalisé | Créer une vue rapport avec colonnes, filtres et regroupements choisis. Sauvegardable | Créer, modifier, supprimer, exporter |

---

## MODULE 4 — ASSISTANT IA *(optionnel)*

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Génération description intervention | Générer automatiquement une description à partir de quelques mots-clés | Générer, accepter ou rejeter |
| 🔲 Analyse pannes récurrentes | Analyser l'historique d'une machine, identifier les pannes répétitives, suggérer des actions préventives | Lancer analyse sur machine, voir rapport |
| 🔲 Suggestion de pièces | À partir du diagnostic saisi, suggérer les pièces probablement nécessaires depuis le catalogue | Voir suggestions, ajouter à l'intervention |
| 🔲 Résumé d'intervention | Générer un résumé professionnel d'une intervention clôturée pour archivage ou rapport client | Générer depuis fiche clôturée |

---

## MODULE 5 — NOTIFICATIONS & ALERTES *(inclus dans GMAO)*

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Notification in-app | Badge + centre notifications. Types : intervention assignée, en retard, stock bas, préventive imminente, transfert en attente, transfert résolu | Lire, marquer comme lue |
| 🔲 Email | Emails pour événements critiques (intervention assignée, en retard, stock bas). Template configurable | Configurer événements → email, modifier template |
| 🔲 Récap planifié | Résumé quotidien ou hebdomadaire par email : interventions du jour, stocks bas, préventives à venir | Configurer fréquence, destinataires |

---

## MODULE 6 — ADMINISTRATION *(inclus)*

### 6.1 Gestion tenant

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Paramètres généraux | Nom, logo, informations de l'entreprise | Modifier |
| ✅ Modules | Activer / désactiver chaque module | Activer, désactiver |
| ✅ Licence | Voir limites (nb utilisateurs, nb sites), date renouvellement | Lecture |
| ✅ Audit trail | Historique complet des actions : qui, quoi, quand, avant/après | Lecture, filtrer |

### 6.2 Utilisateurs & rôles

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Inviter utilisateur | Création compte auto + mot de passe temporaire envoyé par email | Inviter, réinviter |
| ✅ Gérer rôle | Changer le rôle d'un utilisateur (rôle système ou custom) | Modifier rôle |
| ✅ Désactiver utilisateur | Bloquer l'accès sans supprimer les données | Désactiver, réactiver |
| ✅ Rôles custom | Créer un rôle sur mesure avec un sous-ensemble de permissions granulaires | Créer, modifier permissions, supprimer |
| ✅ Sites assignés | Contrôler sur quels sites l'utilisateur a accès | Modifier assignation |
| ✅ Organigramme équipe | Vue hiérarchique par site (manager → techniciens). Clic sur une personne → fiche pro : poste, rôle, sites assignés, interventions en cours. Aucune donnée personnelle exposée | Voir organigramme, naviguer par site |

### 6.3 Sites / Ateliers

| Fonctionnalité | Description | Opérations |
|---|---|---|
| ✅ Gérer sites | Créer et configurer les ateliers/usines (nom, adresse) | Créer, modifier, désactiver |
| 🔲 Plan 2D du site | Carte visuelle de l'atelier. Positionner les machines sur le plan. Voir statut machine en temps réel | Créer plan (upload image), placer machine, modifier position, voir alertes sur plan |

---

## MODULE 7 — EXPORT *(🔲 à développer)*

> L'import de données est géré en prestation d'onboarding par l'équipe MekaSuite.

| Fonctionnalité | Description | Opérations |
|---|---|---|
| 🔲 Export interventions | Exporter la liste des interventions filtrée en CSV (audits, comptabilité) | Configurer filtres, exporter |
| 🔲 Export stock | Exporter l'état du stock (inventaire valorisé) en CSV | Exporter |
| 🔲 Export rapport maintenance | Exporter un rapport formaté en PDF avec logo tenant | Exporter |

---

## RÉCAPITULATIF

| Module | Statut | Fonctionnalités existantes | À développer |
|---|---|---|---|
| GMAO | ✅ Obligatoire | Machines (fiche, notes, pièces jointes, timeline, statut, archivage/restauration, QR code régénérable, compteurs + déclenchement préventive, BOM), interventions (pièces jointes, pointage heures, checklists + modèles de checklist), préventives (récurrence, matériaux, chaîne, planning /planning, modèles d'intervention, déclenchement compteur) | Signature électronique, SLA |
| Stock | ✅ Optionnel (dépend GMAO) | Catalogue (fiche, QR code étiquette, fournisseurs + délai réappro), mouvements (avec annulation), inventaire physique /stock/inventory, consommation sur intervention, scan barcode, alertes rupture, transferts | Commandes BC fournisseurs |
| Rapports avancés | ✅ Optionnel | MTBF, charge technicien, coût maintenance | Taux disponibilité, SLA, export PDF, rapport custom |
| Assistant IA | ✅ Optionnel | Génération description intervention | Analyse pannes, suggestion pièces, résumé clôture |
| Notifications | ✅ Inclus | In-app (6 types) | Email, récap planifié |
| Administration | ✅ Inclus | Tenant, utilisateurs, rôles custom, organigramme, audit | Plan 2D site |
| Export | 🔲 À créer | — | CSV interventions/stock, PDF rapport |
