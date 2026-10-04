# Validation officielle des fichiers FIT générés par index.html.
# Décode avec le SDK officiel Garmin (garmin-fit-sdk) et vérifie le contenu.
#
# Usage : uv run --with garmin-fit-sdk tests/validate_fit.py
# Génère les fichiers .fit via node (section EXPORT de index.html) puis les décode.
import sys, subprocess, tempfile
from pathlib import Path
import garmin_fit_sdk as g
from garmin_fit_sdk import Stream

FIT_TYPE_WORKOUT = 5
SPORT_CYCLING = 2
DURATION_TIME = 0
TARGET_POWER = 2

FTP = 200

# Séances attendues : (fichier, nb steps, segments [(secondes, watts)])
CASES = {
    "single.fit": (1, [(2700, 100)]),
    "sweet.fit": (7, [(600, 80), (600, 175), (300, 80), (600, 175), (300, 80), (600, 175), (600, 80)]),
    "micro.fit": (5, [(480, 70), (30, 230), (30, 70), (30, 230), (30, 70)]),
    "short.fit": (3, [(900, 60), (18, 300), (204, 60)]),
}

def main():
    root = Path(__file__).resolve().parent.parent
    folder = Path(tempfile.mkdtemp(prefix="fit-"))
    gen_js = f"""
const {{ readFileSync, writeFileSync }} = require('node:fs');
const html = readFileSync({str(root / 'index.html')!r}, 'utf8');
const m = html.match(/\\/\\* EXPORT-BEGIN[\\s\\S]*?\\/\\* EXPORT-END \\*\\//);
const DESC = {{}};
const EXPORT = new Function('DESC', m[0] + '\\nreturn EXPORT;')(DESC);
const FTP = 200;
const cases = {{
  single: {{ code:'A1', title:'A1', segments:[[45,0.5]] }},
  sweet: {{ code:'B2', title:'B2', segments:[[10,0.4],[10,0.875],[5,0.4],[10,0.875],[5,0.4],[10,0.875],[10,0.4]] }},
  micro: {{ code:'D1', title:'D1', segments:[[8,0.35],[0.5,1.15],[0.5,0.35],[0.5,1.15],[0.5,0.35]] }},
  short: {{ code:'E1', title:'E1', segments:[[15,0.30],[0.3,1.50],[3.4,0.30]] }}
}};
for (const [name, w] of Object.entries(cases))
  writeFileSync({str(folder)!r} + '/' + name + '.fit', EXPORT.generateFit(EXPORT.workoutToExport(w, FTP)));
"""
    r = subprocess.run(["node", "-e", gen_js], capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr)
        sys.exit(1)
    failures = 0
    for name, (num_steps, segments) in CASES.items():
        path = folder / name
        decoder = g.Decoder(Stream.from_file(str(path)))
        msgs, errors = decoder.read(apply_scale_and_offset=False,
                                convert_datetimes_to_dates=False,
                                convert_types_to_strings=False,
                                merge_heart_rates=False)
        if errors:
            print(f"✘ {name}: erreurs de décodage: {errors}")
            failures += 1
            continue
        fid = msgs["file_id_mesgs"][0]
        wkt = msgs["workout_mesgs"][0]
        steps = msgs["workout_step_mesgs"]
        checks = [
            ("type = workout(5)", fid["type"] == FIT_TYPE_WORKOUT),
            ("sport = cycling(2)", wkt["sport"] == SPORT_CYCLING),
            ("num_valid_steps", wkt["num_valid_steps"] == num_steps),
            ("nb workout_step", len(steps) == num_steps),
        ]
        for i, (secs, watts) in enumerate(segments):
            st = steps[i]
            checks += [
                (f"step {i} duration {st['duration_time']}ms = {secs}s",
                 st["duration_type"] == DURATION_TIME and st["duration_time"] == secs * 1000),
                (f"step {i} target {st['custom_target_value_low']}/{st['custom_target_value_high']} = {watts}W (+1000)",
                 st["target_type"] == TARGET_POWER
                 and st["custom_target_value_low"] == watts + 1000
                 and st["custom_target_value_high"] == watts + 1000),
                (f"step {i} intensity active(0)", st["intensity"] == 0),
                (f"step {i} message_index = {i}", st["message_index"] == i),
            ]
        bad = [label for label, cond in checks if not cond]
        status = "✔" if not bad else "✘"
        print(f"{status} {name}: {len(checks) - len(bad)}/{len(checks)} contrôles")
        for label in bad:
            print(f"   ✘ {label}")
        failures += len(bad)
    print(f"\n{'TOUT OK' if failures == 0 else f'{failures} ÉCHEC(S)'}")
    sys.exit(1 if failures else 0)

main()
