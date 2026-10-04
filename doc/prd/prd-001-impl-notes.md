# Implementation Notes — prd-001 (v1.2, Extension PMA & Force)

## Plan (slices testables)
1. **Note d'impl** (ce fichier).
2. **Familles D & E dans la matrice** : 6 nouvelles séances (D1–D3 PMA, E1–E3 Force/SFR) → grille 15 cartes (5×3), badges famille, mini-charts. Puissances **calculées dynamiquement** sur `PARAMS.ftp` (specs + charts watts).
3. **Inputs moteur** : le champ VFC devient « VFC nuit (ms) » ; la déviation est calculée `((nuit − moy7j)/moy7j)×100` avec `moy7j = PARAMS.hrv`. Affichage de la déviation dans la carte résultat.
4. **Garde-fous** : verrou PMA (déviation ≥ 0 % ET TSB ≥ −15), verrou Force (TSB ≥ −20), verrou D3 renforcé (TSB > −10). Cartes verrouillées = grises + message, bouton copie désactivé. État par défaut (pas encore évalué) : verrouillé (safe default).
5. **Recalage FTP dynamique** : l'édition du FTP re-rend la matrice (les cartes D/E suivent) + réapplique l'état des verrous + re-linkifie le glossaire.
6. **Copy Garmin Specs** D/E : watts calculés + cadences + consignes.

## Arbitrages
| # | Point | Décision |
|---|---|---|
| 1 | État des verrous avant toute évaluation | **Verrouillé** (safe default) avec message « Évaluez votre état du matin » — évite de prescrire du Z5 sans données. |
| 2 | Le moteur prescrit-il D/E ? | Non dans la fenêtre verte (mapping inchangé) — la PRD ne le demande pas. Mais la carte résultat **affiche la disponibilité** PMA/Force (🔓/🔒 + déviation). |
| 3 | Séances A/B/C | Restent en watts absolus codés (PRD : seule D/E est dynamique). Backlog : tout passer en % FTP. |
| 4 | Zone Z5 106–120 % (PRD) vs 106–119 % (config Garmin utilisateur) | La config Garmin de l'utilisateur prime (cohérence onglet Zones). D1/D2 à 108–115 % tombent bien dans Z5. |
| 5 | Plafond 20 min sous-cadence (E) | E2 = 4×5 = 20 min pile, E3 = 3×6 = 18 min → conforme par construction ; mentionné dans les consignes des cartes. |
| 6 | Badge verrouillage | Tag permanent sur les cartes D (« PMA — Lock VFC ») et E (« Force — Guardrail lombaire ») + état verrouillé grisée, conformes à la PRD. |

## Critères d'acceptation PRD (testés)
1. `VFC nuit 78 / VFC 7j 89` (déviation −12,4 %) → D1–D3 grisées + avertissement ✓
2. `TSB < −20` → ligne E verrouillée ✓
3. Copy specs D/E dynamiques (`5x3m @ 244W, Cadence > 95rpm` à FTP 226) ✓

- **Playbook mis à jour** : nouvelle carte « Garde-fous PMA & Force (familles D et E) » (formule de déviation, conditions D/D3/E, plafond 20 min sous-cadence, gainage) ; récap TSB −10 à −25 mentionne les séances PMA/Force conditionnelles. Le lien glossaire fonctionne sur les nouveaux textes (linkify auto).

## Arbitrages complémentaires (post-implémentation)
- **Verrou temporel** : séance verrouillée si `durMin > temps dispo + 10 min`, sauf la reco et les alternatives (toujours exemptées — certaines recos légitimes dépassent déjà, ex. B1 à 35 min pour 30 dispo). Tolérance discutée et **validée telle quelle** par l'utilisateur (cas D2 : 55 min pour 45 dispo reste accessible).
- **E2 en alternative** : ajoutée uniquement si `durMin (60) ≤ temps + 10` — sinon elle n'apparaît pas dans la reco (fix suite au cas 89/−10/45).
- **Reco PMA en BLEU** (hors PRD, ajoutée) : jour frais + PMA déverrouillée → D en primaire selon le temps ; BLUE + PMA verrouillée + Force → E3 si ≥ 90 min. E1 jamais recommandé.
- Les boutons « Copier specs Garmin » (PRD-001 critère 3) ont été retirés à la demande de l'utilisateur — `specsFn` conservé dans le code pour un futur export.

- **v1.3 — Modal de détail des séances** : clic sur une carte → modal (~94 % écran) avec grand graphe annoté (ligne FTP étiquetée, graduations temps), table des intervalles (% FTP → W, zone), objectifs, consigne sécurité, bannière de verrou le cas échéant. Fermeture : ✕, backdrop ou Échap. Les **profils sont passés en % FTP réels** (au lieu de hauteurs décoratives) → les mini-charts de la matrice sont désormais exacts et suivent le FTP édité. Ajout d'une description pédagogique par séance.
  - Le bloc « Specs Garmin » de la modal a été retiré juste après (inutile pour l'instant — les `specsFn` restent dans le code).
  - Fix visuel matrice : badges « ★ Recommandée » / « Alternative » avec **espace réservé constant** (`visibility: hidden` + hauteur fixe 21 px) pour éviter le décalage vertical des cartes sans badge.
  - Fix reco : E2 n'est ajoutée en alternative que si elle rentre dans le temps (cas 89/−10/45).
  - Disponibilité PMA/Force affichée avec **✅/❌ colorés** (ex-🔓/🔒 peu lisibles).
  - Bug : édition du modal JS a un temps cassé un crochet `.join("")` (SyntaxError) — détecté via `node --check` avant les tests browser.

## Validation (v1.2)
- Défaut (sans évaluation) : D/E verrouillées, « Évaluez votre état du matin ». ✓
- Déverrouillage complet (VFC 95 / TSB −8) : D1–D3 + E1–E3 🔓, carte résultat « 🔓 PMA disponible · 🔓 Force disponible ». ✓
- D3 : verrou renforcé testé (TSB −12 → 🔒 spécifique « fraîcheur maximale » alors que D1/D2 ouverts). ✓
- FTP 250 → matrice re-rendue, D2 @ 270–280 W, specs + copie suivent. ✓
- Régression : moteur 5 branches, tabs, chips, liens glossaire (53), localStorage. ✓
- Reco D/E (v1.2+) : scan exhaustif de 96 combinaisons VFC×TSB×temps → E1 jamais recommandé, aucune D/E en rouge/ambre, E2 alternative conditionnelle au temps, E3 primaire en BLUE sans PMA à ≥ 90 min. ✓
- Modal : ouverture/fermeture (✕, backdrop, Échap), contenu dynamique selon FTP (250 → « ~219 W », label « FTP 250 W »), bannière de verrou sur séance non accessible, largeur du graphe (SVG `width: 100%` — défaut navigateur 300 px sinon). ✓

## Bug rencontré
- **TDZ au chargement** : `renderMatrix()` (appelé avant la déclaration de `GLOSSARY_TERMS`) invoquait `linkifyTerms()` → ReferenceError → script avorté (tabs/chips/zones morts). Corrigé en déplaçant le bloc « Liens vers le glossaire » avant l'init de la matrice.
