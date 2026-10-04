# HomeTrainer HQ — Single-File Cyclist Training Dashboard & Decision Engine (HTML/JS)

> **HomeTrainer HQ** — *Your home training command center. Z2maxxing for busy founders.*

## 1. Context & Objectives

**User Profile**: Cyclist preparing for long-distance mountain events (Étape du Tour / Marmotte) with a lumbar hernia history (L5-S1) and a busy professional schedule (start-up founder).

**Target Metrics & Baselines:**

| Metric | Value |
|---|---|
| FTP | 217 W (2,82 W/kg for 77 kg) |
| Power Zones | Z1 (< 117 W) · Z2 (118–161 W) · Z3 (162–193 W) · Z4 (194–227 W) · Z5+ (> 228 W) |
| Target Cadence | > 85–90 rpm (strict requirement to limit intra-discal pressure) |
| rMSSD (VFC) | ~ 88 ms |
| RHR | ~ 41 bpm |

**Primary Objective**: Deliver a lightweight, fully self-contained HTML page (single file, no external dependencies, no framework compilation required) acting as a personal training OS. It must synthesize the training philosophy, display an interactive training library, and provide an interactive daily decision engine.

## 2. Technical Architecture & Constraints

- **Format**: Single `index.html` file containing inline CSS (`<style>`) and vanilla JavaScript (`<script>`).
- **Dependencies**: Zero external NPM packages. SVG/Canvas or pure CSS used for visual graphics. Native CSS system fonts.
- **Design System**: Dark mode default (Garmin/Intervals.icu aesthetic). High contrast, functional typography, compact layout for mobile/desktop.

## 3. Page Structure & Features

### Section 1: Methodology & Physiology Core ("Le Pourquoi")

A concise, collapsible analytical reference explaining the rules:

- **The Polarized Base Rule**: Why Z2 (118–161 W) builds mitochondrial density without autonomic fatigue or spinal stress.
- **The Spine Protection Protocol**: Why low cadences (< 80 rpm) or asymmetric efforts are strictly forbidden.
- **The 3 Core KPIs:**
  - **CTL (Fitness)**: Chronic load over 42 days. Target: steady growth.
  - **TSB (Form)**: `Fitness − Fatigue`. Target: −10 to −25 in build phase; > −30 is red line.
  - **rMSSD (VFC/Nervous State)**: Immediate parasympathetic indicator. Target: ~ 88 ms.

### Section 2: Interactive Decision Engine ("Arbre de Décision")

An interactive form allowing the user to enter their morning metrics to get an instant, unambiguous training instruction.

**User Inputs:**

- rMSSD (ms) — number input, step 1
- Form / TSB — number input, step 1
- Time Available (min) — dropdown: 30, 45, 60, 90, 120+

**Engine Logic:**

| Condition | Trigger | Flag | Output |
|---|---|---|---|
| A — Nervous exhaustion | rMSSD < 75 | 🔴 RED (Nervous Stress) | Force Workout Class: A1 or Rest |
| B — Structural overload | TSB < −30 | 🔴 RED (Physical Surcharge) | Force Workout Class: A1 or Rest |
| C — Optimal window | rMSSD ≥ 75 **and** −25 ≤ TSB ≤ −10 | 🟢 GREEN (Building Zone) | Intensity workouts matching time available (B1/B2/B3 or C1/C2/C3) |
| D — Maintenance/Fresh | TSB > −10 **and** rMSSD ≥ 75 | 🔵 BLUE (Fresh/Deload) | Z2 base workouts (A2/A3) to drive volume |

**Output Rendered**: Highlighted card displaying the exact workout code (A1, B2, etc.), target watts, target cadence, and safety note.

### Section 3: Visual Training Matrix ("Bibliothèque d'Entraînement")

A 3×3 visual CSS grid representing the 9 structural workouts. Each card must include a visual SVG/CSS mini-chart (power profile over time), key targets, and lumbar safety indicator.

| Code | Title | Duration | Target Power | Target Cadence | Profile SVG Schema |
|---|---|---|---|---|---|
| A1 | Décrassage Z1 | 45 min | < 117 W | 95+ rpm | Flat low bar |
| A2 | Endurance Z2 | 60–75 min | 118–161 W | 90 rpm | Solid mid bar |
| A3 | Foncier Long Z2 | 120–210 min | 118–161 W | 85–90 rpm | Long flat mid block |
| B1 | Sub-Seuil Flash | 35 min | 3×6m @ 195 W | 90 rpm | 3 short spikes |
| B2 | Sweetspot Classique | 60 min | 3×10m @ 190 W | 90 rpm | 3 medium blocks |
| B3 | Over-Under Long | 90 min | 4×12m @ 185–205 W | 90–95 rpm | 4 undulating blocks |
| C1 | Pyramide Vélocité | 40 min | 140–165 W | 100–110 rpm | Stepped pyramid |
| C2 | Variations Cadence | 60 min | 150 W | Alt 85/105 rpm | Sawtooth pattern |
| C3 | Foncier + Vélocité | 120 min | 120–161 W + spurt | 90–100 rpm | Flat with high pulses |

## 4. Detailed UI/UX Specifications

```
+-----------------------------------------------------------------------+
|  HEADER: HOMETRAINER HQ — CYCLING DECISION ENGINE                     |
+-----------------------------------------------------------------------+
| [Section 1: Methodology Core (Collapsible Accordion)]                 |
|  - Physiology, FTP (217W), Z2 Rules, Lumbar Guardrails                |
+-----------------------------------------------------------------------+
| [Section 2: Daily Decision Engine]                                    |
|  Inputs: [ rMSSD: 78 ]  [ TSB: +9 ]  [ Time: 60m ]  [ EVALUATE ]      |
|                                                                       |
|  RESULT CARD:                                                         |
|  [ STATUS: BLUE / FRESH ] -> RECOMMENDED: A2 - Endurance Z2           |
|  Target: 118-161W | Cadence: 90 rpm | Target TSS: ~45                 |
+-----------------------------------------------------------------------+
| [Section 3: 3x3 Training Matrix]                                      |
|  +------------------+  +------------------+  +------------------+     |
|  | [A1] Recup Z1    |  | [A2] Endur. Z2   |  | [A3] Foncier     |     |
|  | - Chart SVG -    |  | - Chart SVG -    |  | - Chart SVG -    |     |
|  +------------------+  +------------------+  +------------------+     |
|  | [B1] Sub-Seuil   |  | [B2] Sweetspot   |  | [B3] Over-Under  |     |
|  | - Chart SVG -    |  | - Chart SVG -    |  | - Chart SVG -    |     |
|  +------------------+  +------------------+  +------------------+     |
|  | [C1] Pyramide V. |  | [C2] Var. Cad.   |  | [C3] Endur + V.  |     |
|  | - Chart SVG -    |  | - Chart SVG -    |  | - Chart SVG -    |     |
|  +------------------+  +------------------+  +------------------+     |
+-----------------------------------------------------------------------+
```

## 5. Acceptance Criteria for the AI Coder

1. **Zero External Requests**: The HTML file must load instantly offline without loading scripts or fonts via CDN.
2. **Functional Decision Engine**: Entering `rMSSD: 65, TSB: -15, Time: 60` must trigger a Red Warning State recommending A1 or Rest due to autonomic stress.
3. **Responsive Design**: Grid collapses cleanly from 3 columns on desktop to 1 column on mobile.
4. **Copy-to-Clipboard Feature**: Each workout card has a "Copy Garmin Specs" button that copies target text (e.g., `3x10m @ 190W, Cadence > 90rpm`) for manual input into Garmin Connect.
