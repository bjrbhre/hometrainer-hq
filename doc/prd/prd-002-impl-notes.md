# PRD-002 — Note d'implémentation (v0 Export .ZWO / .FIT / .MRC)

Statut : **implémenté et testé** (tests unitaires Node + validation FIT via SDK officiel Python + E2E navigateur).

## Contexte projet & arbitrages

L'application est un **fichier HTML unique, sans build, sans dépendance, offline-first** (`file://` fonctionne).
C'est la contrainte structurante qui a dicté les choix techniques suivants.

### 1. FIT encodé à la main, pas via `@garmin/fitsdk`
La PRD impose le SDK officiel, mais il nécessite Node/npm et casse les contraintes du projet
(mono-fichier, offline, aucun build). Décision : **encodeur FIT minimal inline** (~200 lignes,
messages `file_id` / `workout` / `workout_step`, CRC-16 inclus, Definition+Data records).
**Compensation** : le fichier généré est validé en test par décodage avec le **SDK officiel
Garmin Python (`garmin-fit-sdk`)** — le fichier ne passe que s'il décode proprement avec
les bonnes valeurs. C'est au moins aussi fort que d'utiliser le SDK en génération.

### 2. Corrections apportées à la PRD (erreurs dans la spec d'origine)
- `intensity` FIT : la PRD indiquait 1=Active/2=Rest/3=Warmup/4=Cooldown. Valeurs réelles du
  profil FIT : **0=Active, 1=Rest, 2=Warmup, 3=Cooldown**.
- `target_type` : la PRD proposait `6` (« Power % FTP ») — n'existe pas. Les cibles FIT sont
  encodées en **watts absolus** via `target_type=2 (Power)` + `custom_target_value_low/high`
  avec l'**offset +1000** imposé par Garmin (watts + 1000). La conversion `%FTP → watts`
  utilise le FTP courant de `PARAMS.ftp` au moment de l'export.
- `wkt_name` : limité à 15 octets ASCII → on utilise le **code de la séance** (`B2`, `D1`…),
  le titre complet reste dans ZWO/MRC et dans la description.
- Le champ FIT `duration_value` pour `duration_type=0 (Time)` est bien en **millisecondes**.

### 3. Pas de regroupement d'intervalles (aplatissement 1:1)
Les `segments` de l'app ne codent pas explicitement les répétitions (D1 = 20 segments
alternés explicites, pas un bloc « 8×30s »). Détecter les motifs pour générer des blocs
`IntervalsT` (ZWO) ou `repeat_until_steps_cmplt` (FIT) produirait parfois des séances fausses.
v0 : **un step par segment**, 100 % fidèle. Regroupement = candidat v2 (heuristic + preview).

### 4. `.MRC` plutôt qu'`.ERG`
L'ERG (watts) est un sur-ensemble trivial du MRC (%FTP). v0 exporte **ZWO + FIT + MRC** :
couverture Zwift / Garmin / TrainerRoad. ERG trivial à ajouter si besoin (mêmes points
d'inflexion, header `WATTS`, valeurs en watts absolus).

### 5. Types de steps
Les données source ne contiennent pas de warmup/cooldown/ramp explicites → tous les segments
sont exportés en **SteadyState (ZWO)** / `intensity=Active` (FIT). Les séances commencent et
finissent de toute façon par des blocs de récupération dans le playbook.

## Ce qui a été ajouté (tout dans `index.html`)

- Section `EXPORT` (marquée `EXPORT-BEGIN` / `EXPORT-END` pour l'extraction en tests) :
  - `workoutToExport(w, ftp)` : convertit une entrée `WORKOUTS` en modèle PRD
    (`Workout` + `WorkoutStep[]`), description = `DESC[code]`.
  - `generateZwo(workout)` → XML (échappement XML, puissances arrondies à 2 décimales).
  - `generateMrc(workout)` → points d'inflexion minute/puissance cumulés.
  - `generateFit(workout)` → `Uint8Array` (encodeur FIT v1.0, CRC-16 footer, little-endian).
  - `slugify()`, `downloadBlob()` (Blob + mime `application/xml` / `application/octet-stream` / `text/plain`).
- UI : trois boutons « Exporter » dans la modal de détail séance (ZWO / FIT / MRC),
  nommage `slug(code + '-' + title) + extension` (ex. `b2-sweetspot-classique.fit`).

## Tests

1. **Unitaires Node** (`tests/export.test.mjs`) : extraction de la section EXPORT depuis
   `index.html`, assertions sur ZWO (structure, échappement, valeurs), MRC (points
   d'inflexion, cumuls), FIT (header, CRC, séquence file_id→workout→steps, décoding des
   records), sur des cas représentatifs : A1 (1 segment), B2, D1 (micro-intervalles 30 s),
   E1 (segments de 18 s), titres avec accents/apostrophes.
2. **Validation FIT officielle** : le binaire généré est décodé avec `garmin-fit-sdk`
   (Python, via uv) — type de fichier, sport, nombre de steps, cibles en watts vérifiées.
3. **E2E navigateur** : modal → clic sur chaque bouton → fichiers téléchargés vérifiés.

Lancer les tests :
- `node tests/export.test.mjs` — 24 contrôles (ZWO, MRC, structure FIT/CRC, slugify)
- `uv run --with garmin-fit-sdk tests/validate_fit.py` — 80 contrôles : décode les 4 fichiers
  FIT générés (A1, B2, D1, E1) avec le SDK officiel Garmin et vérifie type/sport/nb steps/
  durées en ms/cibles watts+1000/intensité/message_index.

## Résultats des tests

- Unitaires Node : **24/24 OK**
- Décodage SDK Garmin officiel : **80/80 contrôles OK** (les 4 fichiers décodent sans erreur,
  CRC inclus)
- E2E navigateur (cmux) : ouverture de la modal B2, clics sur les 3 boutons →
  `b2-sweetspot-classique.{zwo,fit,mrc}` téléchargés dans `~/Downloads`, FIT re-décodé
  avec succès après téléchargement (cibles 90/198 W = %FTP × FTP courant du profil, 130 W),
  MRC aux points d'inflexion corrects, D1 exporté avec ses 39 blocs SteadyState.

## Bugs trouvés et corrigés pendant le développement

1. Signature du header FIT : ASCII `.FIT` (octets 8–11), pas un identifiant applicatif.
2. Definition record : préfixe de 6 octets (header, reserved, arch, msg_num×2, n_fields),
   pas 13 — un buffer surdimensionné décalait tous les octets.
3. Data record : préfixé d'un header `0x00` (local type 0).
4. CRC-16 : l'algorithme bit-wise KERMIT classique ne correspond pas à l'implémentation
   Garmin (table de nibbles `0xCC01…`, calcul bas-nibble d'abord) — répliqué à l'identique.
5. Numéros de champs du profil FIT (différents de la PRD) : `num_valid_steps`=6,
   `duration_type` champ 1, `target_type` champ 3, `intensity` champ 7.
6. `time_created` : secondes depuis l'époque FIT **1989-12-31** → `unix − 631065600`
   (la PRD n'en parle pas ; un offset dans le mauvais sens donnait une date en 2066).
7. Strings FIT : NUL-terminés (taille = longueur + 1), ASCII pur (accents → `?`).
