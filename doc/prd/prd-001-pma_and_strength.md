# PRD Incrémentale (v1.2) : Extension PMA & Force Sécurisée

> Suite de [`prd-000.md`](prd-000.md) — **HomeTrainer HQ**

## 1. Contexte & Objectif

Cette mise à jour v1.2 fait suite à la disparition des symptômes lombaires aigus. Elle intègre deux nouvelles filières physiologiques indispensables pour la haute montagne (Marmotte, Étape du Tour) :

- **PMA / VO₂ max (Zone 5)** : pour élever le plafond aérobie.
- **Force / SFR (Sub-maximal Force, Zone 3–4 sous-cadence)** : pour franchir les pourcentages raides (> 9 %).

Elle applique des garde-fous algorithmiques stricts pour empêcher le déclenchement de ces séances à haut risque en cas de fatigue nerveuse ou de surcharge discale.

## 2. Spécifications Algorithmiques & Garde-fous

### Feature A : Règle de Verrouillage PMA (Zone 5)

La Zone 5 sollicite le système nerveux autonome à son niveau maximal.

**Condition d'activation dans le JS :**

```
Déviation VFC (%) = ((VFC Nuit − Moyenne 7j) / Moyenne 7j) × 100
```

**Règle** : autoriser les séances D1, D2, D3 **uniquement si** :

- `Déviation VFC ≥ 0 %` (système nerveux à 100 %)
- **ET** `TSB ≥ −15` (absence de fatigue musculaire profonde)

**Message d'inhibition** (si conditions non remplies) :

> « Séance PMA masquée : Déviation VFC négative ou TSB trop bas. Risque d'épuisement du SNA. »

### Feature B : Règle de Sécurité Lombaire pour la Force (SFR)

Le travail en sous-cadence (60–70 tr/min) augmente la pression intra-discale sur L5-S1.

**Conditions d'activation :**

- `TSB ≥ −20` (les muscles stabilisateurs du tronc ne doivent pas être épuisés)

**Garde-fou temporel :** plafond absolu de **20 minutes** de travail cumulé en sous-cadence par séance.

**Message d'avertissement :**

> « Séance Force déverrouillée : Garder un gainage abdominal actif et couper immédiatement l'effort en cas de tension dans le bas du dos. »

## 3. Extension de la Matrice d'Entraînement (Passage en 5×3)

Les calculs de puissance pour les cartes D et E s'appuient dynamiquement sur la variable FTP (ex. : 217 W).

| Code | Titre | Format / Durée | Cible Puissance | Cible Cadence | Consigne Sécurité |
|---|---|---|---|---|---|
| D1 | Micro-Intervals PMA | Court (35 min) | 2 sets de 8 × (30 s @ 115 % FTP / 30 s Z1) | 100+ rpm | Cadence élevée obligatoire pour soulager la colonne. |
| D2 | Intervalles Courts PMA | Moyen (55 min) | 5 × 3 min @ 108–112 % FTP (récup 3 min) | 95+ rpm | Arrêter si la dérive cardiaque est excessive. |
| D3 | Pyramide PMA | Long (1 h 15) | 2 × (1-2-3-2-1 min) @ 110 % FTP | 95–100 rpm | Réservé aux jours de fraîcheur maximale (`TSB > −10`). |
| E1 | Force Explosive | Court (40 min) | 6 × 20 s Départ arrêté / Grand plateau | Max torque | Assis uniquement. Interdiction de se déhancher. |
| E2 | SFR Classique | Moyen (1 h 00) | 4 × 5 min @ 85 % FTP (récup 5 min) | 60–65 rpm | Gainage actif. Relâcher si tiraillement lombaire. |
| E3 | Foncier + SFR Côte | Long (2 h 00) | Z2 + 3 × 6 min en côte @ 88 % FTP | 65 rpm | Stopper la sous-cadence après 1 h 30 de sortie. |

## 4. Impact UI & Modifications CSS/JS

1. **Calculateur de Puissance Dynamique (Zone 5)** : ajout de la plage Z5 (VO₂ max) dans le script — 106 % à 120 % de la FTP (ex. : 230–260 W pour 217 W).
2. **Affichage Grid Responsive** : mise à jour du layout CSS de la grille de 9 à **15 cartes** (3 colonnes × 5 lignes sur Desktop, 1 colonne sur Mobile).
3. **Badges de Statut sur les Cartes** :
   - Cartes D1–D3 : tag visuel `[PMA - Lock VFC]`
   - Cartes E1–E3 : tag visuel `[Force - Guardrail L5-S1]`

## 5. Critères d'Acceptation pour l'Agent de Codage

1. Si l'utilisateur entre `VFC Nuit = 78` et `VFC 7j = 89` (déviation −12,3 %), les cartes D1, D2, D3 doivent apparaître grises/désactivées avec l'avertissement adéquat.
2. Si `TSB < −20`, la ligne E (Force) doit être verrouillée.
3. Le bouton **Copy Garmin Specs** sur les cartes D et E doit générer la description textuelle intégrant les consignes de cadence précises (ex. : `5x3m @ 240W, Cadence > 95rpm`).
