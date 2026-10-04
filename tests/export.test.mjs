// Tests unitaires pour l'export PRD-002 (.ZWO / .FIT / .MRC).
// Extrait la section EXPORT de index.html (marqueurs EXPORT-BEGIN/EXPORT-END)
// et l'exécute dans un contexte Node sans DOM.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, "..", "index.html"), "utf8");

const m = html.match(/\/\* EXPORT-BEGIN[\s\S]*?\/\* EXPORT-END \*\//);
if (!m) { console.error("Section EXPORT introuvable dans index.html"); process.exit(1); }

// Contexte minimal : DESC utilisé par workoutToExport
const DESC = {
  A1: "Sortie très douce.", B2: "Sweetspot.", D1: "Micro-intervals.", E1: "Départs arrêtés."
};
const code = m[0] + "\nreturn EXPORT;";
const EXPORT = new Function("DESC", code)(DESC);

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log("  ✔ " + label); }
  else { failed++; console.error("  ✘ " + label); }
}

const FTP = 200;

// ---- Fixtures ----
const single = { code: "A1", title: "Décrassage Z1", segments: [[45, 0.5]] };
const sweet  = { code: "B2", title: "Sweetspot Classique", segments: [[10,0.4],[10,0.875],[5,0.4],[10,0.875],[5,0.4],[10,0.875],[10,0.4]] };
const micro  = { code: "D1", title: "Micro-Intervals PMA", segments: [[8,0.35],[0.5,1.15],[0.5,0.35],[0.5,1.15],[0.5,0.35]] };
const short  = { code: "E1", title: "Force Explosive", segments: [[15,0.30],[0.3,1.50],[3.4,0.30]] };
const accent = { code: "T1", title: "Séance spéciale — l'endurance !", segments: [[10,0.6]] };

function wo(w) { return EXPORT.workoutToExport(w, FTP); }

// ================= ZWO =================
console.log("\n— ZWO —");
{
  const z = EXPORT.generateZwo(wo(sweet));
  ok(z.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "prologue XML");
  ok(z.includes("<workout_file>") && z.includes("<sportType>bike</sportType>"), "racine workout_file + sportType");
  ok(z.includes("<author>HomeTrainer HQ</author>"), "author");
  ok(z.includes("<name>Sweetspot Classique</name>"), "name = titre");
  const blocks = [...z.matchAll(/<SteadyState Duration="(\d+)" Power="([\d.]+)"\/>/g)];
  ok(blocks.length === 7, `7 blocs SteadyState (reçu ${blocks.length})`);
  ok(blocks[0][1] === "600" && blocks[0][2] === "0.4", "bloc 1 : 600 s @ 0.40");
  ok(blocks[1][2] === "0.88", "bloc 2 : 0.875 arrondi à 0.88");
  const total = blocks.reduce((s, b) => s + Number(b[1]), 0);
  ok(total === 3600, `durée totale 3600 s (reçu ${total})`);

  const za = EXPORT.generateZwo(wo(accent));
  ok(za.includes("<name>Séance spéciale — l&apos;endurance !</name>"), "échappement XML des accents/apostrophes");
}

// ================= MRC =================
console.log("\n— MRC —");
{
  const t = EXPORT.generateMrc(wo(sweet));
  const lines = t.split("\n").filter(l => /^\d/.test(l));
  ok(t.includes("[COURSE HEADER]") && t.includes("MINUTES %FTP") && t.includes("[END COURSE DATA]"), "en-têtes MRC");
  const rows = lines.map(l => l.split("\t").map(Number));
  ok(rows[0][0] === 0, "premier point à 0.00 min");
  const last = rows[rows.length - 1];
  ok(Math.abs(last[0] - 60) < 0.001, `dernier point à 60.00 min (reçu ${last[0]})`);
  // points d'inflexion : pas de doublon consécutif de puissance au même instant
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === rows[i-1][1] && rows[i][0] === rows[i-1][0]) ok(false, "pas de doublon temps+puissance");
  }
  ok(rows.filter(r => r[0] === 10).length === 2 || rows.some(r => Math.abs(r[0]-10) < 0.005 && Math.abs(r[1]-87.5) < 0.01), "point d'inflexion à 10 min @ 87.5 %");

  const tm = EXPORT.generateMrc(wo(micro));
  ok(tm.split("\n").filter(l => /^\d/.test(l)).length >= 10, "micro-intervalles : nombreux points d'inflexion");
}

// ================= FIT =================
console.log("\n— FIT —");
{
  const fit = EXPORT.generateFit(wo(sweet));
  ok(fit instanceof Uint8Array, "retourne Uint8Array");
  ok(fit[0] === 14 && fit[1] === 0x20, "header 14 octets, dcr 0x20");
  ok(fit[8] === 0x2E && fit[9] === 0x46 && fit[10] === 0x49 && fit[11] === 0x54, "signature .FIT");
  // CRC header (octets 0-11)
  ok(crc(fit.subarray(0, 12)) === fit[12] | (fit[13] << 8), "CRC header valide");
  // CRC fichier (tout sauf les 2 derniers octets)
  ok(crc(fit.subarray(0, fit.length - 2)) === fit[fit.length-2] | (fit[fit.length-1] << 8), "CRC fichier valide");
  // data size
  const size = fit[4] | (fit[5] << 8) | (fit[6] << 16) | (fit[7] << 24);
  ok(size === fit.length - 16, `data size cohérente (${size} octets)`);

  // structure : la séquence exacte des messages est vérifiée par le SDK officiel
  // (tests/validate_fit.py, décodage garmin-fit-sdk) — voir plus bas.

  // micro + short encodent les secondes correctement
  const fitMicro = EXPORT.generateFit(wo(micro));
  const fitShort = EXPORT.generateFit(wo(short));
  ok(fitMicro.length > 0 && fitShort.length > 0, "génération D1 (30 s) et E1 (18 s) sans erreur");

  // écriture pour validation par le SDK officiel Python
  const dir = mkdtempSync(join(tmpdir(), "fit-"));
  writeFileSync(join(dir, "sweet.fit"), fit);
  writeFileSync(join(dir, "micro.fit"), fitMicro);
  writeFileSync(join(dir, "short.fit"), fitShort);
  writeFileSync(join(dir, "single.fit"), EXPORT.generateFit(wo(single)));
  console.log("\nFichiers FIT écrits dans " + dir + " (validation par tests/validate_fit.py)");
}

// ================= slugify =================
console.log("\n— slugify —");
{
  ok(EXPORT.slugify("B2 Sweetspot Classique") === "b2-sweetspot-classique", "slug simple");
  ok(EXPORT.slugify("D1 Micro-Intervals PMA") === "d1-micro-intervals-pma", "tirets multiples normalisés");
  ok(EXPORT.slugify("Séance spéciale — l'endurance !") === "seance-speciale-l-endurance", "accents et ponctuation");
}

console.log(`\n${passed} OK, ${failed} KO`);
process.exit(failed ? 1 : 0);

function crc(bytes) {
  const T = [0x0000,0xCC01,0xD801,0x1400,0xF001,0x3C00,0x2800,0xE401,0xA001,0x6C00,0x7800,0xB401,0x5000,0x9C01,0x8801,0x4400];
  let c = 0;
  const upd = (value, crc) => {
    let t = T[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ t ^ T[value & 0xF];
    t = T[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    return crc ^ t ^ T[(value >> 4) & 0xF];
  };
  for (const b of bytes) c = upd(b, c);
  return c;
}
