# PRD — Génération de fichiers d'entraînements cyclistes (.ZWO, .FIT, .ERG)

## 1. Contexte & Objectif

L'application permet aux utilisateurs de créer ou de sélectionner des séances d'entraînement cycliste structurées. L'objectif de ce module est de convertir ces séances (stockées sous forme d'objets JSON/TypeScript) en fichiers standardisés téléchargeables localement par l'utilisateur. Les formats cibles sont `.ZWO` (XML), `.FIT` (Binaire) et optionnellement `.ERG` (Texte).

---

## 2. Modèle de données source (Input Data Model)

L'agent de code devra s'appuyer sur l'interface unifiée suivante pour générer n'importe quel format de fichier.

```typescript
type StepType = 'warmup' | 'cooldown' | 'steady' | 'interval' | 'ramp';

interface WorkoutStep {
  type: StepType;
  durationSeconds: number;
  powerTarget: {
    type: 'pct_ftp' | 'watts';
    value?: number;      // Pour 'steady', 'warmup', 'cooldown' (ex: 0.75 pour 75% FTP)
    startValue?: number; // Pour 'ramp' (ex: 0.40)
    endValue?: number;   // Pour 'ramp' (ex: 0.75)
  };
  cadenceTarget?: number; // En RPM (optionnel)

  // Spécifique au type 'interval'
  repeatCount?: number;   // Nombre de répétitions (ex: 8)
  restDurationSeconds?: number;
  restPowerTarget?: number; // Puissance de récupération (ex: 0.50)
}

interface Workout {
  id: string;
  title: string;
  description: string;
  author?: string;
  sportType: 'bike';
  steps: WorkoutStep[];
}

```

---

## 3. Spécifications techniques par format

### 3.1 Format `.ZWO` (Zwift Workout Format)

* **Type :** XML (Texte clair).
* **Encodage :** UTF-8.
* **Règles de calcul :** La puissance est toujours relative à la FTP (ex. `0.85` pour 85%). Arrondir à 2 décimales maximum. Les durées sont en secondes.

**Mapping des balises XML selon le `StepType` :**

* `warmup` : `<Warmup Cadence="{cadenceTarget}" Duration="{durationSeconds}" PowerHigh="{endValue}" PowerLow="{startValue}"/>`
* `cooldown` : `<Cooldown Duration="{durationSeconds}" PowerHigh="{endValue}" PowerLow="{startValue}"/>`
* `steady` : `<SteadyState Cadence="{cadenceTarget}" Duration="{durationSeconds}" Power="{value}"/>`
* `ramp` : `<Ramp Duration="{durationSeconds}" PowerHigh="{endValue}" PowerLow="{startValue}"/>`
* `interval` : `<IntervalsT Cadence="{cadenceTarget}" OffDuration="{restDurationSeconds}" OffPower="{restPowerTarget}" OnDuration="{durationSeconds}" OnPower="{value}" Repeat="{repeatCount}"/>`

**Structure racine requise :**

```xml
<workout_file>
    <author>[Workout.author]</author>
    <name>[Workout.title]</name>
    <description>[Workout.description]</description>
    <sportType>bike</sportType>
    <tags/>
    <workout>
        <!-- Les blocs (WorkoutStep) sont injectés ici -->
    </workout>
</workout_file>

```

---

### 3.2 Format `.FIT` (Flexible & Interoperable Data Transfer)

* **Type :** Binaire.
* **Bibliothèque imposée :** L'agent doit utiliser le SDK FIT officiel ou une librairie éprouvée (`@garmin/fitsdk` en JS/TS, ou `garmin-fit-sdk` en Python). **Ne pas encoder le binaire manuellement.**
* **Profil FIT requis :** Type de fichier `Workout` (valeur enum: 5).

**Messages FIT obligatoires à encoder dans le fichier :**

1. **`file_id` (Message d'en-tête) :**
* `type`: 5 (Workout)
* `manufacturer`: 255 (Development)
* `product`: 0
* `serial_number`: [Générer un ID ou 0]
* `time_created`: [Timestamp actuel]


2. **`workout` (Message global) :**
* `wkt_name`: [Workout.title] (Limité à 15 caractères ASCII)
* `sport`: 2 (Cycling)
* `num_valid_steps`: [Nombre total d'étapes créées]


3. **`workout_step` (Un message par étape) :**
* `message_index`: 0, 1, 2... (Incrémental)
* `wkt_step_name`: (Optionnel, nom de l'étape)
* `duration_type`: 0 (Time)
* `duration_value`: [Durée en secondes x 1000] (Le FIT attend des millisecondes pour cette valeur)
* `target_type`: 1 (Power) ou 6 (Power % FTP)
* `custom_target_value_low`: [Cible min - ex: % FTP + offset binaire]
* `custom_target_value_high`: [Cible max]
* `intensity`: 1 (Active), 2 (Rest), 3 (Warmup), 4 (Cooldown).



*Note pour l'agent : Les blocs "interval" du modèle de données source doivent souvent être aplatis (un step effort, un step repos, englobés par un step "Repeat") pour respecter la norme FIT.*

---

### 3.3 Formats `.ERG` / `.MRC` (Optionnel)

* **Type :** Texte brut, délimité par des tabulations ou espaces.
* **Différence :** `.ERG` utilise des Watts absolus. `.MRC` utilise le % FTP.
* **Structure requise :**

```text
[COURSE HEADER]
VERSION = 2
UNITS = ENGLISH
DESCRIPTION = [Workout.description]
FILE NAME = [Workout.title]
MINUTES WATTS
[END COURSE HEADER]
[COURSE DATA]
0.00    50
10.00   50
10.00   85
15.00   85
[END COURSE DATA]

```

* **Logique de l'agent :** Convertir les durées (secondes) en points d'inflexion (minutes cumulées) pour marquer le début et la fin de chaque étape de puissance.

---

## 4. Spécifications fonctionnelles de l'exportateur (Front-end ou Backend)

1. **Générateurs (Services) :**
* `generateZwo(workout: Workout): string` -> Retourne la chaîne XML valide.
* `generateFit(workout: Workout): Uint8Array` -> Retourne le buffer binaire FIT.


2. **Téléchargement UI (Browser) :**
* Exposer des boutons "Télécharger .ZWO", "Télécharger .FIT".
* Créer un `Blob` à partir du retour des générateurs.
* Mime-types recommandés :
* ZWO : `application/xml`
* FIT : `application/octet-stream`


* Nommage du fichier de sortie : Nettoyer le titre de l'entraînement (retirer les caractères spéciaux, espaces remplacés par des tirets) + extension. Exemple : `seance-pma-30-30.zwo`.
