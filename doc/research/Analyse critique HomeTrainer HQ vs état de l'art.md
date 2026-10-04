# Note d'analyse critique — HomeTrainer HQ au regard de l'état de l'art data-driven

> Référence : *État de l'art des protocoles d'entraînement cycliste pour amateurs* (`Entraînement Cycliste Data-Driven.md`).
> Périmètre : `index.html` (moteur de décision + bibliothèque 5×3), README, PRD-000 / PRD-001.
> Audience : cycliste amateur, progression **et** simplicité.

---

## 1. Synthèse exécutive

HomeTrainer HQ fait partie de la famille d'outils rares : il **décide** au lieu d'afficher. Sa logique — VFC matinale en veto absolu, TSB comme fenêtre de surcompensation, intensité calibrée sur le temps disponible — est globalement **conforme aux preuves scientifiques les plus solides** (entraînement guidé par la VFC de Javaloyes, gestion PMC de Coggan). Les choix structurels (sécurité d'abord, polarisation du volume, garde-fous PMA/Force) sont sains et honnêtement documentés dans l'app elle-même.

Les faiblesses principales sont ailleurs : **le modèle de charge est entré à la main (TSB) sans contrôle du Ramp Rate**, le **seuil VFC est fixe (−15 %) alors que l'état de l'art impose un couloir glissant**, la **programmation hebdomadaire n'existe pas** (le moteur est purement réactif, sans dosing hebdo de l'intensité), et quelques **prescriptions d'intervalles s'écartent des protocoles validés** (D2, D3). Aucune de ces faiblesses n'est dangereuse ; toutes sont adressables de façon incrémentale, en préservant la simplicité qui est la grande force de l'outil.

| Dimension | Verdict |
|---|---|
| Philosophie (autorégulation, priorité récupération) | 🟢 Alignée sur la littérature |
| Moteur de décision quotidien | 🟢 Solide, deux réserves méthodo |
| Distribution d'intensité (TID) | 🟡 Hybride non explicité : coherent mais sous-optimisé pour 6–10 h/semaine |
| Séances B (seuil/sweetspot) | 🟢 Bien calibrées |
| Séances D (PMA) | 🟡 Formats divergents des protocoles validés (Rønnestad/Seiler) |
| Séances E (Force) | 🟢 Garde-fous discaux exemplaires (hors littérature, mais justifiés) |
| Métrologie (FTP, zones) | 🟡 FTP statique, pas de protocole de re-test, risque de dérive des zones |
| Charge & périodisation | 🔴 Ramp rate absent, pas de vue hebdo, pas de tapering |

---

## 2. Ce que l'app fait bien (à valoriser)

### 2.1 L'autorégulation par la VFC — le choix le mieux prouvé de l'app
L'état de l'art le plus fort en faveur de l'approche est l'essai de **Javaloyes et al.** sur cyclistes : le groupe autorégulé par le rMSSD matinal a progressé de ~+4,6 % au second seuil et ~+2,6 % sur un TT de 40 km **en réalisant moins d'intervalles HIIT** que le groupe planifié. La règle de HomeTrainer (« VFC < 85 % de la moyenne 7 j → aucune intensité, quoi qu'il arrive ») transpose exactement ce principe : veto autonome prioritaire sur toute autre considération. C'est la bonne hiérarchie : le signal aigu l'emporte sur le signal chronique.

### 2.2 La lecture du TSB est physiologiquement correcte
L'app assume et explique que **un TSB négatif modéré n'est pas un mauvais signe** (fenêtre de surcompensation −10 à −25, ligne rouge à −30). C'est fidèle au modèle impulsion-réponse de Coggan (CTL 42 j / ATL 7 j / TSB = CTL − ATL) et évite l'erreur classique de l'amateur qui « se sent fatigué donc se repose » systématiquement. Le tableau Playbook est pédagogiquement excellent.

### 2.3 Séparation déverrouillage / prescription
Ne jamais proposer D et E par défaut, ne jamais auto-prescrire E1 (départs arrêtés), garder les cartes verrouillées **visibles avec leur motif** : c'est à la fois une sécurité réelle et un dispositif pédagogique rare. La distinction « accessible ≠ recommandé » est explicitée — un vrai geste de coach.

### 2.4 Garde-fous lombaires (famille E)
Le plafond de 20 min de sous-cadence par séance, la cadence ≥ 85–90 rpm comme verrou global, le gainage actif, l'interdiction du déhanché : rien de tout cela ne figure dans la littérature endurance classique — c'est du **coaching de cas particulier** (hernie L5-S1 documentée dans le PRD-000), et c'est exactement ce qu'un outil générique ne peut pas faire. C'est la légitimité profonde de l'app.

### 2.5 Simplicité radicale
3 inputs le matin, une prescription, un glossaire linké, zéro dépendance, tout local. Pour l'amateur, la barrière d'adoption est quasi nulle — et l'adhérence est le premier facteur de progression. L'éphémérité assumée des décisions quotidiennes (pas de tracking) est un choix cohérent avec la v1.

---

## 3. Critiques : où l'app s'écarte de l'état de l'art

### 3.1 🔴 Le seuil VFC est trop rudimentaire — l'état de l'art impose un couloir
L'app compare le rMSSD du matin à **85 % d'une moyenne 7 j saisie à la main**. Le protocole validé (Javaloyes/HRV4Training) utilise :
- une **baseline glissante 60 jours** (pas une moyenne 7 j figée) ;
- un couloir **baseline ± écart-type**, avec la transformation ln(rMSSD) pour normaliser le signal ;
- une interprétation **bilatérale** : un rMSSD anormalement **élevé** signale aussi un risque (saturation vagale, précurseur de surmenage) ;
- le **coefficient de variation** comme signal d'instabilité.

Conséquences concrètes du choix actuel : (a) un sportif dont la VFC « normale » est très variable aura de faux positifs/faux négatifs ; (b) un rMSSD au-dessus de la baseline est traité comme « parfait » alors que la prudence serait de mise ; (c) la moyenne 7 j devient obsolète à mesure que la condition évolue et personne ne rappelle de la mettre à jour.

### 3.2 🔴 Pas de contrôle du Ramp Rate — le maillon manquant de la gestion de charge
L'état de l'art est univoque : la **vitesse d'accroissement du CTL** (+2 à +5/sem. en croisière, +5 à +8 max sur bloc court, >8–10 = zone à risque, ACWR > 1,3 corrélé aux blessures) est *la* métrique de sécurité de la charge chronique. Or l'app n'accepte le TSB que comme saisie manuelle : elle ne voit ni le CTL, ni son historique, ni sa dérivée. L'utilisateur peut très bien se maintenir dans la fenêtre verte « −10 à −25 » **tous les jours pendant des semaines** — le moteur dira « intensité productive » chaque matin — alors que le CTL dérape à +10/semaine. Le vert du moteur n'est pas un certificat de progression saine ; il manque une régulation **hebdomadaire** au-dessus de la régulation quotidienne.

### 3.3 🟡 Distribution d'intensité : la rhétorique dit « polarisée », la bibliothèque est pyramido-sweetspot
Le Playbook affiche une barre « modèle polarisé » (~80/5/15) et vante la Z2 comme socle à 75–80 % du volume. Mais :
- la méta-analyse 2025 (Rosenblat, Talsnes & Seiler) montre que la supériorité du polarisé n'est établie que chez les élites à **> 15 h/semaine** ; à 6–10 h, polarisé et pyramidal sont équivalents, et le pyramidal offre une densité de stimulus supérieure ;
- la bibliothèque réelle (3×B en Z4/sweetspot + 3×D en Z5 + 3×E en force) correspond à un **modèle pyramidal/sweet spot** — ce qui est d'ailleurs le bon choix pour ce volume — mais l'app ne le dit pas.

Le risque n'est pas physiologique, il est **narratif** : l'utilisateur croit appliquer la méthode de Seiler alors qu'il pratique du sweetspot dominant. L'état de l'art pointe précisément le risque inverse (« enfermement métabolique » du SST : si l'FTP est surestimée de quelques %, le « 90 % FTP » devient du domaine sévère et l'amateur s'épuise en glycolytique récurrent). Une **dization hebdomadaire cible** (ex. max 2 séances intenses/semaine, ≤ 15–20 % du temps) est le correctif minimal.

### 3.4 🟡 Les séances PMA divergent des protocoles validés
- **D1 « 30 s ON / 30 s OFF @ 115 % FTP »** : le protocole de Rønnestad validé expérimentalement est **30 s @ 120–130 % / 15 s OFF** (récupération active 50 %, 3 min inter-séries). La récupération de D1 est 2× plus longue pour une intensité plus basse → moins de temps au-dessus de 90 % du VO₂ max, stimulus dilué. C'est plus doux, donc plus sûr — mais alors l'app devrait le dire (« version prudence ») au lieu de revendiquer « le stimulus VO₂ max le plus efficace par minute ».
- **D2 « 5×3 min @ 108–112 % »** : correct dans l'esprit, mais le format isoefficace validé (Seiler) est **4×8 min @ 105–108 %** ; à 3 min, la cinétique du VO₂ max n'atteint son plateau que dans les 2ᵉ–3ᵉ minutes de chaque intervalle — temps utile réduit. Pour un amateur, 4×8 à 105–107 % est plus rentable et plus tenable mentalement.
- **D3** (pyramide 1-2-3-2-1 @ 110 %) : format original, sans équivalent validé ; pas nécessairement mauvais, mais non justifié par la littérature.

### 3.5 🟡 FTP statique, zones en %FTP fixes — la métrologie aveugle de l'app
Toute la calibration repose sur un FTP saisi une fois (217 W dans le PRD, 226 W par défaut). L'état de l'art rappelle que le test 20 min Coggan peut dévier de ±15–25 W du MLSS, et que le rampe test surestime chez les profils anaérobiques. L'app ne propose **ni protocole de test, ni calendrier de re-test, ni recalibration par eFTP** (Intervals.icu ajusté sur des efforts ≥ 7–12 min). Sur 6 mois d'entraînement, un FTP qui progresse de 8 % sans mise à jour transforme silencieusement toutes les cibles en sous-entraînement — et inversement, une FTP surestimée transforme les B2 « sweetspot » en seuil réel (le piège documenté du SST).

### 3.6 🟡 Aucune métrique de progression — l'app ne peut pas prouver qu'elle fonctionne
EF (Friel), découplage aérobien (Pw:Hr), dérive cardiaque à puissance constante : l'état de l'art positionne ces métriques comme **filtres décisionnels objectifs** (ex. : ne pas progresser en volume/intensité tant que le découplage sur la durée cible dépasse ~5 %). L'app a les inputs (FC max vélo, FC repos) mais ne les exploite pas. Sans journal ni tendance, l'utilisateur pilote aux instruments sans tableau de bord de tendance — précisément ce que « data-driven » signifie dans le rapport.

### 3.7 🟡 Pas de logique de périodisation
Ni blocs, ni affûtage (tapering : TSB vers +5 à +15 avant l'objectif, volume −40 à −60 % en gardant l'intensité), ni progressivité du TTE (allonger le temps de soutien à 97–100 % FTP : 2×20 → 3×15 → 40–60 min continues). Le moteur est un **décideur quotidien** ; il manque un **planificateur hebdomadaire** au-dessus. Pour la Marmotte/Étape du Tour, les 8–14 jours d'affûtage avant l'événement sont un standard non couvert.

---

## 4. Pistes de progrès (priorisées, en gardant la simplicité)

1. **Journal minimal + Ramp Rate (le plus gros gain/effort).** Une simple liste des séances réalisées (code, TSS, date) suffirait à calculer CTL/ATL/TSB automatiquement, tuer la saisie manuelle du TSB, et ajouter deux règles : CTL +Δ > 5/semaine → alerte ; ACWR > 1,3 → décharge. C'est la « v2 » déjà identifiée dans le README — elle est plus urgente que le README ne le suggère.
2. **Couloir VFC basé sur écart-type glissant.** Stocker les mesures matinales (déjà nécessaires pour le point 1), calculer baseline 60 j ± 1 écart-type sur ln(rMSSD), et gérer le cas « au-dessus du couloir ». La règle reste une ligne, la robustesse double.
3. **Plafond hebdomadaire d'intensité.** Compteur simple : ≤ 2 séances intenses (B/C/D/E) par 7 jours glissants ; le statut vert passe en « vert volume » si le quota est atteint. Corrige le risque « vert tous les jours » du §3.2/3.3 sans architecture lourde.
4. **Recalibrer D1/D2 sur les protocoles validés.** D1 → 30/15 à 120–130 % (ou l'assumer explicitement comme variante prudence) ; proposer une variante D2 « 4×8 @ 105–107 % ». Optionnel : un bloc de rappel type Rønnestad pour les stages/vacances.
5. **Protocole de test FTP + rappel de re-test.** Une fiche (test 20 min avec 92 % de correction si profil explosif, ou protocole Kolie Moore / 3 points de puissance critique) et un rappel tous les 6–8 semaines. Contre le décalage silencieux des zones.
6. **Événement cible + tapering.** Le champ « Objectif » existe déjà ; lui ajouter une date suffirait à déclencher une règle d'affûtage (−50 % volume, intensité conservée, TSB cible +5 à +10) sur les 8–14 jours précédents.
7. **Deux métriques de tendance.** Sur les sorties Z2 longues : EF et découplage Pw:Hr (seuil ~5 % sur la durée cible). Une carte « santé aérobie » par semaine serait cohérente avec l'esthétique actuelle.
8. **Aligner le discours TID.** Renommer la barre « polarisée » en « pyramidal hybride adapté à 6–10 h/semaine », en citant la méta-analyse 2025 — l'honnêteté narrative est un atout marketing autant que scientifique.

---

## 5. Conclusion

HomeTrainer HQ est un **excellent produit de coaching pour cas particulier** : sa hiérarchie de sécurité (VFC > surcharge > fenêtre verte), ses garde-fous discaux et sa transparence pédagogique le placent au-dessus de la plupart des dashboards génériques. Sur le plan scientifique, son cœur — l'autorégulation par biomarqueurs — est le choix le mieux validé de la littérature, appliqué avec la bonne prudence.

Ses limites sont celles de sa v1 assumée : le moteur régule le **jour** mais rien ne régule la **semaine**, la **métrologie d'entrée** (FTP, moyenne VFC) est figée alors que la littérature exige du glissant et du recalibré, et quelques **formats d'intervalles** divergent des protocoles validés sans le dire. Toutes les pistes identifiées sont additives et compatibles avec l'architecture single-file : un journal minimal (piste 1) en débloquerait trois autres à lui seul. L'app n'a pas besoin d'un changement de cap — elle a besoin d'une mémoire.
