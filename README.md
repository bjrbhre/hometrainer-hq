# HomeTrainer HQ

A single-file, self-contained cycling training dashboard and daily decision engine. Open `index.html` in any browser — no build step, no server, no external dependencies, works offline.

## Why this exists

Generic training platforms show charts; they don't *decide*. This app encodes a personal coaching playbook into an interactive daily routine:

1. **Every morning**, you enter two numbers (last night's heart-rate variability and your current form/TSB) plus the time you have available.
2. **The decision engine** applies a fixed, safety-first rule set and prescribes exactly one workout — or explicitly tells you to rest.
3. **The library** documents every workout in the playbook: intensity profile, structure, targets, and safety notes.

The philosophy is polarization (most volume at low intensity, intensity only in favorable windows), and the engine is deliberately conservative: when in doubt, it prescribes recovery.

## What the code does that isn't obvious

### One source of truth: `PARAMS`
All physiological settings (FTP, weight, HRV baseline, resting HR, max HR per sport, VO₂max) live in a single `PARAMS` object. Every editable surface — header chips, the *Zones* tab, the *Profil* tab — writes through one `setParam()` function, so editing a value anywhere updates every derived display (zone tables, charts, thresholds). Defaults are defined once in `FTP_REF` and are meant to be replaced with your own numbers.

### The decision engine is ordered by safety
`decide()` evaluates rules in a strict order where the most acute signal wins:

1. **Autonomic red flag** — HRV this morning below 85 % of your 7-day average → recovery only, regardless of everything else.
2. **Structural red flag** — form (TSB) below a hard floor → forced deload.
3. **Green window** — moderate negative TSB → intensity is productive and prescribed by available time.
4. **Blue (fresh)** — high TSB → volume by default; if PMA (VO₂max) work is unlocked, a Z5 session is prescribed instead because freshness is exactly when it pays off.
5. **Amber buffer** — a deliberate gray zone between green and red: ride easy, never intensify.

### Unlocking is separate from prescribing
The two highest-risk workout families (D: VO₂max intervals, E: sub-cadence strength) are never available by default. They unlock only after a morning evaluation, each with its own physiological gate (HRV deviation, TSB thresholds), and locked cards stay visible in the library — greyed, with the reason. Prescribing them is even stricter: e.g. explosive work (E1) is never auto-prescribed, only ever made accessible.

### Workout data is declarative
Every session is one entry in `WORKOUTS` containing: duration (label + minimum feasible minutes), cadence, an intensity profile as `[minutes, %FTP]` segments, a TSS estimate, a safety note, and — for sessions whose power depends on your FTP — optional `wattsFn`/`specsFn` functions. Everything on screen (matrix cards, mini-charts, the detail modal, highlight/lock states) is rendered from that single structure. Charts use a fixed 0–160 % FTP scale with a dashed FTP reference line, so profiles are visually comparable across all sessions.

### Highlights and locks are recomputed, never stored
Every change to an input (including the time dropdown) recomputes the recommendation and re-evaluates the whole matrix: the recommended card gets a green badge, alternatives an amber one, and anything that no longer fits your available time is greyed out. Nothing about "today" persists — each morning starts from a safe, locked state until you enter data.

### Persistence is minimal by design
Only your physiological parameters and season goal are saved (`localStorage`). Daily decisions are ephemeral by intent: the tool answers "what should I do today", not "track my history". (A training-log feature is a natural v2 direction.)

### Glossary is wired automatically
Technical terms across the app are turned into clickable links by a text-node walker (`linkifyTerms()`), pointing at anchors in the *Glossaire* tab. Any new content containing those terms is linked for free.

## Layout

| Tab | Purpose |
|---|---|
| **Dashboard** | Morning inputs → recommendation, full workout library (15 sessions) |
| **Playbook** | The "why": training principles, the decision tree, unlock rules |
| **Zones** | Garmin-style power and heart-rate zones (power zones 1–7, sport-specific HR zones), recalculated live |
| **Profil** | All physiological parameters with explanations |
| **Glossaire** | Definitions for every term used anywhere in the app |

## Running it

Open `index.html` directly (`file://` works). All state is local; nothing leaves the browser.

## Customizing

- **Your numbers**: Profil tab (or edit `FTP_REF` in the source to change defaults).
- **Your sessions**: edit `WORKOUTS` — each entry is self-describing; intensity segments are in % of FTP so they follow your fitness.
- **Your rules**: `decide()` and `updateLocks()` contain all coaching logic, kept deliberately simple and commented.

## Limitations

- Session power *labels* for the original A/B/C families are still literal strings (the intensity profiles used by charts/tables are dynamic); converting them fully to computed values is planned.
- TSB is currently a manual input — computing CTL/ATL automatically from a logged training history is the main v2 candidate.
- Persistence is browser-local (no sync). Each workout detail modal can export the session as **.ZWO** (Zwift), **.FIT** (Garmin) or **.MRC** (TrainerRoad) — see `doc/prd/prd-002-impl-notes.md`.
