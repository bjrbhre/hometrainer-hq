# Implementation Notes — prd-000 (v0)

## Plan d'implémentation (vertical slices, chacune testable)

1. **Note d'implémentation** (ce fichier) — plan + arbitrages.
2. **Squelette `index.html`** : design system dark (CSS variables, system fonts), header, 3 sections vides. *Testable : la page s'ouvre offline.*
3. **Section 1 — Méthodologie** : accordéon `<details>` (natif, zéro JS) avec les 3 blocs (polarisé, protocle rachis, KPI CTL/TSB/rMSSD). *Testable : ouverture/fermeture.*
4. **Section 3 — Matrice 3×3** : workouts définis en JS (data-driven), rendu des cartes + mini-charts SVG générés par une fonction unique `chartSVG(segments)`. *Testable : 9 cartes visibles avec profils.*
5. **Section 2 — Moteur de décision** : formulaire → logique → carte résultat. *Testable : cas nominal de la PRD.*
6. **Bouton "Copy Garmin Specs"** + responsive (3→1 colonnes) + test browser complet.

## Arbitrages & choix techniques

### Architecture
- **Single file, vanilla JS, zéro dépendance** (contrainte PRD). Pas de framework, pas de build.
- **Data-driven** : les 9 workouts sont un tableau JS unique (`WORKOUTS`) qui alimente ET la matrice ET le moteur de décision ET les specs à copier → une seule source de vérité.
- **Mini-charts SVG générés en JS** depuis une description de segments `{minutes, %hauteur}` — plus maintenable que 9 SVG inline écrits à la main.
- **Accordéon natif `<details>/<summary>`** pour la section 1 : zéro JS, accessible.

### Arbitrages fonctionnels (zones d'ombre de la PRD)

| # | Point ambigu | Décision | Justification |
|---|---|---|---|
| 1 | Fenêtre verte : quel workout B ou C selon le temps ? | Mapping temps→séance : 30→B1, 45→C1, 60→B2, 90→B3, 120+→C3. Alternatives affichées sur la carte. | Suit au plus près les durées de la matrice (B1=35m, C1=40m, B2=60m, B3=90m, C3=120m). |
| 2 | Priorité si rMSSD<75 **et** TSB<−30 simultanés ? | Le flag nerveux (A) prime sur le physique (B). | Le stress autonome est le signal le plus aigu ; le message affiché mentionne les deux. |
| 3 | Trou non couvert : rMSSD ≥ 75 et −30 ≤ TSB < −25 (ni vert, ni bleu, ni rouge). | Statut 🟡 AMBER "Prudence" → A2 (volume Z2 modéré), jamais d'intensité. | Le rouge ne démarre qu'à < −30 strict ; cette bande est une zone tampeur classique en coaching. |
| 4 | TSS cible affiché sur la carte résultat. | `TSS ≈ IF² × durée_h × 100` avec IF estimé par workout (0.55–0.78). | Approximation standard, suffisante pour un v0 sans historique de charge. |
| 5 | Temps 30m en statut BLEU (A2 = 60–75 min) ? | On recommande A2 raccourci à 45 min (mention explicite), pas A1 (inutile si frais). | Pragmatique : le frais n'a pas besoin de décrassage. |
| 6 | rMSSD/TSB manquants ? | Le bouton Évaluer exige les 3 champs ; validation inline. | Évite les faux verdicts. |

### Décisions UX
- Dark mode uniquement (PRD), esthétique Garmin/Intervals.icu : fond très sombre, accents cyan/vert, badges de zone colorés.
- Résultat du moteur : carte à bordure colorée selon statut (rouge/vert/bleu/ambre), code workout cliquable → scroll vers la carte correspondante de la matrice.
- Toast de confirmation après copie (pas d'`alert()`).
- `navigator.clipboard` + fallback `execCommand` (contexte `file://`).

### v0.1 — Onglets & vue « Logique du moteur »
- **Nav basique** : barre sticky d'onglets (`Dashboard` / `Playbook`), 2 `<div class="view">` togglés en JS, pas de framework.
- **Deep links** : hash `#dashboard` / `#logic` appliqué au chargement **et** sur `hashchange` (l'onglet cliqué met à jour le hash via `history.replaceState`).
- **Contenu de l'onglet logique** : diagramme de l'arbre (ASCII `<pre>` stylé), récap rMSSD×TSB → statut/séance, mapping temps→séance (vert), table des 5 branches de test avec valeurs d'exemple, explication rMSSD/VFC.
- **Motif** : l'utilisateur comprenait mal pourquoi il obtenait toujours A2/A1 (il testait avec un TSB positif). L'explication « TSB négatif = fenêtre de construction » est désormais dans l'app.

### v0.2 — Onglet « Zones »
- **3ᵉ onglet** `#zones` : zones de puissance (% FTP, FTP 217 W → bornes en watts) et zones FC (% FC max).
- **Nomenclature & couleurs Garmin classiques** : Z1 Active Recovery/Warm up (gris) · Z2 Endurance/Easy (bleu) · Z3 Tempo/Moderate (vert) · Z4 Threshold/Hard (orange) · Z5 VO2 Max/Maximum (rouge).
- **Arbitrage** : la FC max n'est pas connue → champ « FC max » éditable (défaut 185) qui recalcule les zones FC en bpm en direct (méthode Garmin % FC max). La FC max réelle doit être validée par test de terrain.
- **v0.2.1** : FTP également éditable (défaut 217 W) — la table puissance se recalcule en direct, même mécanique que la FC max. Les séances de la bibliothèque restent calibrées sur le FTP de référence (mention dans l'UI) ; rendu dynamique de la matrice = backlog.
- **v0.2.2 — Zones puissance Garmin 7 zones** : passage de 5 à 7 zones selon la config Garmin de l'utilisateur (Z1 &lt;55 % · Z2 55–74 · Z3 75–89 · Z4 90–105 · Z5 106–119 · Z6 120–150 · Z7 &gt;150 %). Noms : Active Recovery, Endurance, Tempo, Threshold, VO2 Max, Anaerobic, Neuromuscular. Z6/Z7 marquées « Interdit — protocle rachidien ». Note : le Z4 dépasse le FTP (jusqu'à 105 %) — c'est la définition Garmin, différente du seuil 100 % classique.
- Colonnes « Usage principal » reliant chaque zone aux séances A/B/C de la matrice.
- **v0.2.3 — Zones FC cyclisme Garmin** : seuils cyclisme spécifiques (Z1 45–54 · Z2 54–63 · Z3 63–72 · Z4 72–81 · Z5 81–100 %) remplaçant les défauts génériques 50/60/70/80/90 %.
- **v0.7 — Deux tables FC** : la table standard (50/60/70/80/90 % — course à pied/endurance) est conservée et la table cyclisme (v0.2.3) devient une 2ᵉ table, avec explication : la FC max est généralement plus basse à vélo qu'en course à pied (souvent 5 à 10 bpm de moins), d'où des profils de zones spécifiques.
- Nouveau paramètre global **`hrmaxBike`** (défaut 191 bpm, éditable, persisté) — distinct de `hrmax` ; chaque table FC se recalcule sur son propre paramètre. Bug rencontré : id DOM en casse différente de la clé PARAMS dans la boucle générique des chips → script avorté ; corrigé en alignant l'id sur `chip-hrmaxBike`.
- **v0.8 — FC max hors header** : les deux FC max (standard et cyclisme) n'apparaissent plus que dans l'onglet Zones — retirées des chips header ; la boucle générique des chips a un garde-fou null (param sans chip). Wording complet « FC max cyclisme » dans le bloc.

- **v0.3 — Paramètres physiologiques globaux (header)**
- Les 5 chips du header (FTP, Poids, VFC cible, FC repos, FC max — FC max ajoutée) deviennent éditables via bouton ✎/✓ qui bascule le header en mode édition (inputs inline). v0.4 : ajout du **VO₂ max** (6ᵉ paramètre global, défaut 50 ml/kg/min estimé à partir de 2,82 W/kg — à affiner au test de terrain).
- **v0.5 — Objectif de saison éditable** : le sous-titre du header devient un champ texte libre éditable en mode ✎ (variable `GOAL`, séparée des `PARAMS` numériques). Pierre d'attente pour l'analyse en langage naturel / orientation du coaching (backlog v1 : interpréter l'objectif pour pondérer les recommandations, ex. « Marmotte » → priorité foncier A3 et D+).
- **Persistance** : implémentée en v0.6 via `localStorage` (clé `hometrainer-hq:v1`) — `PARAMS` + `GOAL` sauvés à chaque changement, relus au chargement (JSON corrompu → défauts, silencieux). Bouton **⟳ reset** visible uniquement en mode édition, à côté de ✓. Fonctionne sur `file://` ; l'espace est lié au navigateur profil utilisé.
- **Une seule source de vérité** : objet global `PARAMS` (défauts — métriques perso : 226 W / 75,5 kg / 89 ms / 41 bpm / 196 bpm / 51,5 ml·kg⁻¹·min⁻¹). Le FTP édité dans le header et dans l'onglet Zones pointent vers `PARAMS.ftp`, la FC max vers `PARAMS.hrmax` — édition dans un sens ou dans l'autre, effet identique (tables recalculées dans les deux cas).
- La baseline VFC du KPI (section Méthodologie) est également branchée sur `PARAMS.hrv`. La ligne FTP des mini-charts devient relative au FTP édité.
- Les séances A1–C3 restent en watts absolus codés en dur (backlog v1 : recalcul dynamique).

- **v0.9 — Onglet « User Profile »** : toutes les variables (FTP, VFC 7j, Poids, FC repos, FC max, FC max cyclisme, VO₂ max + Objectif) réunies en cartes éditables avec texte explicatif chacune. Header réduit aux 2 paramètres dimensionnants du coaching (FTP, VFC 7j). Sources de vérité uniques : `PARAMS`/`GOAL` — header, Zones et Profile restent synchronisés dans les deux sens via `setParam`. Corrections au passage : retrait d'`addEventListener` empilés dans `renderHeader` (listeners attachés une seule fois), suppression des références DOM mortes (v-weight/v-rhr/v-vo2).

- **v0.10 — Onglet « Glossaire »** : glossaire déplacé du Playbook vers un 5ᵉ onglet dédié, chaque terme ancré (`gl-ftp`, `gl-ctl`, …). Mécanisme de liaison générique : `linkifyTerms()` parcourt les nœuds texte (hors glossaire, balises `<a>`, inputs) et transforme FTP/CTL/ATL/TSB/TSS/VFC/rMSSD/VO₂ max en liens pointillés cliquables → bascule d'onglet + scroll + flash sur l'entrée. Le rendu dynamique du résultat moteur est re-linkifié (wrap de `renderResult`). Entrée VO₂ max ajoutée au glossaire (lien orphelin sinon).

- **v0.11 — Méthodologie → Playbook** : la section « Méthodologie & Physiologie » (3 accordéons polarisé/rachidien/KPI) quitte le Dashboard, qui se recentre sur l'opérationnel : 1 · Arbre de décision · 2 · Bibliothèque. Le Playbook devient la référence complète (méthode + logique du moteur). Le KPI baseline (`kpi-hrv-baseline`) et ses liens glossaire suivent (24 liens dans le Playbook).

### v1.x — Itérations UX & wording (chronologie des échanges, post-v0.11)

**Nom & vocabulaire**
- App renommée **« HomeTrainer HQ »** (title + h1, « HQ » en vert = couleur du statut GREEN, Trainer en bleu).
- **« VFC cible » → « VFC 7j »** : le paramètre est désormais explicitement la moyenne VFC sur 7 jours, contre laquelle la mesure du matin est comparée. KPI méthodologie aligné (« Moyenne 7 j », formulation générique sans valeurs perso).
- **rMSSD → VFC partout** (terminologie Garmin), rMSSD gardé uniquement dans le glossaire avec précision « VFC et rMSSD sont synonymes dans ce contexte ».
- Typo unité : `(ms)` en minuscules dans les labels (exception `text-transform: none` sur le span). « Objectif » au singulier.

**Header / Profil / Zones**
- Retrait des chips Poids / FC repos / VO₂ max du header (déménagés vers Profil) — puis FC max et FC max cyclisme également (v0.8). Header final : **FTP + VFC 7j** uniquement.
- Bouton reset ⟳ invisible en production : cause = `style="display:none"` inline écrasant la règle CSS `header.editing #reset-params`. Corrigé (retiré l'inline).
- Zones : Z6/Z7 re-wording (plus de « protocle rachidien ») → usage principal réel + mise en garde risque ; note ⚠ générique sur les zones hautes.
- Wording « restent calibrées » → « sont calibrées » ; note FC réécrite (pilotage puissance/cadence, FC = contrôle, dérive cardiaque).

**Playbook**
- Onglet renommé **« Playbook »** (ex-Logique du moteur), deux titres de section : « Les 3 principes de base » et « Choix de l'entraînement ».
- Accordéon « Protocle de protection rachidienne » déplacé en dernier et re-wording : **« Contexte de douleur — quand l'intensité est proscrite »** (généralisation, référence cliquable `a.tablink` vers l'Objectif de l'onglet Profil).
- Seuil nerveux **dynamique** : le moteur est passé du seuil absolu (75 ms) à **« VFC < 85 % de VFC 7j »** (`round(PARAMS.hrv × 0.85)`) — arbre, récap (6 occurrences `.dyn-vfc-th`) et message rouge suivent la variable. Frontière stricte (nuit 76 = GREEN à baseline 89).
- Table « L'idée clé » : plages TSB colorées aux couleurs de statut (bleu/vert/ambre/rouge). Récap « inputs → output » trié par TSB croissant (ambre en 3ᵉ position).
- Glossaire : entrées FC Max, FC Repos, Poids ajoutées ; tri alphabétique complet.

**Dashboard**
- Section renommée **« État du matin → Séance du jour »**.
- **Reco en direct** : tout `input` (champs numériques, steppers ±1, dropdown temps) recalcule la prescription sans cliquer sur Évaluer ; champs invalides → carte vidée + verrous D/E repassés en état sûr.
- Formulaire : messages d'erreur en `position: absolute` (plus de décalage de la ligne — première tentative avec espace réservé `visibility` créait un désalignement du select/bouton).
- Nav responsive : les 5 onglets débordaient à 390 px → `overflow-x: auto` (scrollbar masquée).
- Boutons « Copier specs Garmin » retirés des cartes (les `specsFn` restent dans le code pour un futur export).

### Validation effectuée (v0)
- Ouverture offline (`file://`) sans requête externe.
- Cas PRD : `rMSSD 65, TSB −15, 60m` → 🔴 RED nerveux → A1/Repos. ✓
- Cas vert / bleu / ambre / rouge-physique testés via le browser en side-panel.
- Responsive vérifié desktop + vue étroite.
- v0.1 : bascule d'onglets, deep link au chargement et via `hashchange`, dashboard toujours fonctionnel après navigation, 0 erreur console. ✓
