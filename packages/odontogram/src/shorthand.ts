// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-t8y: charting by shorthand instead of click paths.
//
// Dirk, 18.08.2026: "Die Bedienung der Befundeingabe ist denkbar schlecht. Ich
// bin es gewohnt, Zaehne zu markieren und den Befund mit Kuerzeln einzugeben,
// z.B. k fuer Krone, b fuer Brueckenglied, e fuer ersetzt, und bei Fuellungen
// ist der Zahn markiert und ich gebe mit mod die Flaechen ein."
//
// This is the workflow at the chair, not a convenience: findings are taken in
// seconds, often dictated. With 46 axes and 129 values the number of click
// paths is the actual bottleneck.
//
// WHY THIS MODULE IS DOM-FREE, like `retention.ts` and `perioClassification.ts`
// -----------------------------------------------------------------------------
// The bead asks for THREE entry routes onto the SAME finding set: keystrokes,
// a FHIR query against a practice system, and speech. If the table lived in a
// key handler, the other two would have nothing to call and a second table
// would grow beside it — which is exactly how the three drift apart. So the
// mapping and the parser live here, pure and tested, and every route resolves
// through them. Applying the result to a tooth is somebody else's job, and it
// must go through `gateToothEdit` like every other interactive edit (DS-1).
//
// WHERE THE TABLE COMES FROM
// -----------------------------------------------------------------------------
// Read off charly's own 01-Befund keypad, transcribed in
// `docs/charly/01-befund-tastenfeld.md` with both screenshots beside it, and
// the meanings resolved by Dirk on 2026-08-19 rather than guessed. It is not
// invented shorthand: it is the one already in his fingers.
//
// TWO THINGS THE KEYPAD TAUGHT US, both of which shape the parser
// -----------------------------------------------------------------------------
// 1. THE MATERIAL COMES FIRST. Dirk: "Bei charly waehlt man das Material und
//    gibt dann die Kuerzel ein." The material row is not a suffix to a finding
//    key — it is a MODE that is set beforehand and stays set, like a chosen
//    colour one then paints with. Our own state already has the counterpart:
//    `fillingMaterial` is documented as "active material chosen in the
//    dropdown (applied on surface tap)".
// 2. LONGEST MATCH, AND CASE MATTERS. One-, two- and three-character tokens sit
//    side by side (`k`, `TK`, `Twf`), and case carries meaning: `d` is distal
//    while `D` is the eruption stage, `t` is a telescope while `TK` is an
//    onlay. Reading character by character, or case-insensitively, would
//    silently chart the wrong finding.
//
// WHAT IS DELIBERATELY NOT HERE
// -----------------------------------------------------------------------------
// Seven of charly's keys have no target in our 46 axes yet. They are listed in
// `SHORTHAND_PENDING` with the bead that will give them one, and the parser
// reports them as `pending` rather than as unknown — a key we understand but
// cannot yet store is a different situation from a typo, and the caller should
// be able to say so.

/** A surface as our state spells it. charly's `v` (vestibulaer) is our
 *  `buccal`; charly's `z` (zervikal) has no counterpart — see SHORTHAND_PENDING. */
export type SurfaceKey = "mesial" | "occlusal" | "distal" | "buccal" | "lingual";

/** What a parsed input asks to be written. Scalar axis writes name the state
 *  FIELD, not the registry axis id, because that is what an applier sets. */
export type ShorthandEdit =
  | { kind: "axis"; field: string; value: string | boolean }
  | { kind: "surfaces"; target: "filling"; surfaces: SurfaceKey[]; material: string }
  | { kind: "surfaces"; target: "caries"; surfaces: SurfaceKey[]; severity: number | null }
  // A restoration material on surfaces: the surfaces belong to the tooth's
  // partial restoration (inlay / onlay / veneer). Which coverage they land in is
  // decided at WRITE time from the tooth's current restorationType — a veneer
  // stays a veneer, and only a tooth with no such restoration becomes an inlay.
  | { kind: "surfaces"; target: "restoration-coverage"; surfaces: SurfaceKey[] }
  | { kind: "denture" }
  | { kind: "reset" };

export interface ShorthandResult {
  /** In input order. Empty when nothing resolved. */
  edits: ShorthandEdit[];
  /** The material mode AFTER this input — it survives, so a caller keeps it. */
  material: MaterialKey | null;
  /** Tokens with no meaning in this language. */
  unknown: string[];
  /** Tokens we understand but have nowhere to store yet, with their bead. */
  pending: { token: string; bead: string }[];
  /** Restoration keys typed with NO material mode standing. The engine treats
   *  a crown without a material as no restoration at all and normalises it
   *  away, so such a key looks as if it did nothing. Reported rather than
   *  swallowed — the same reasoning as `pending`. */
  needsMaterial: string[];
}

export interface ShorthandContext {
  /** The material mode carried in from before, as charly carries it. */
  material?: MaterialKey | null;
}

// -----------------------------------------------------------------------------
// The table
// -----------------------------------------------------------------------------

type Entry =
  | { kind: "axis"; field: string; value: string | boolean; takesMaterial?: true }
  | { kind: "axes"; edits: { field: string; value: string | boolean }[]; takesMaterial?: true }
  | { kind: "surface"; surface: SurfaceKey }
  | { kind: "material"; material: MaterialKey }
  | { kind: "caries" }
  | { kind: "denture" }
  | { kind: "severity"; severity: number }
  | { kind: "reset" };

/** German shorthand, read off charly's keypad.
 *
 *  The table is per language ON PURPOSE and from the start: `k` for Krone is
 *  German, and this library ships twelve UI languages. Adding the parameter
 *  later would mean touching every call site; adding it now costs a lookup. */
export const SHORTHAND_DE: Record<string, Entry> = {
  // --- whole tooth: presence and substrate
  "o.B.": { kind: "reset" },
  "f":    { kind: "axis", field: "toothSelection", value: "none" },
  "i":    { kind: "axis", field: "toothSelection", value: "implant" },
  "x":    { kind: "axis", field: "extractionPlan", value: true },
  // charlys Taste D zeigt das Stadium eines Zahndurchbruchs in DREI Stufen
  // (Bead odontogram-0n8). Die Stufe wird als Ziffer angehaengt, wie `K3` bei
  // der Kariesstufe - ein blankes `D` wartet deshalb auf seine Ziffer und tut
  // fuer sich nichts, weil laengere Schluessel damit beginnen (`shouldCommit`).
  // charlys `MZ`: der markierte Zahn ist ein MILCHZAHN (Dirk, 25.09.2026 - im
  // Schema gab es keinen Weg dorthin). Nur auf den Plaetzen 1-5; auf einem
  // Molarenplatz gibt es keinen Milchzahn, dort schreibt der Schreiber nichts.
  // Zurueck zum bleibenden Zahn wie in charly mit `o.B.`.
  "MZ":   { kind: "axis", field: "toothSelection", value: "milktooth" },
  "D1":   { kind: "axis", field: "eruptionStage", value: "emerging" },
  "D2":   { kind: "axis", field: "eruptionStage", value: "half-crown" },
  "D3":   { kind: "axis", field: "eruptionStage", value: "full-crown" },
  "WR":   { kind: "axis", field: "toothSubstrate", value: "radix" },
  // charlys viertes Bild ("Fr im Kasten") ist die KRONEN-Fraktur — ein anderer
  // Befund als `Fra` (die WURZELfraktur, weiter unten): die Krone ist gebrochen,
  // also `toothSubstrate: "broken"`. "Fra" gewinnt beim Tippen ueber "Fr", weil
  // die laengste Uebereinstimmung zuerst greift.
  "Fr":   { kind: "axis", field: "toothSubstrate", value: "broken" },
  // Zahnstein steht bei charly als Ankreuzfeld in der rechten Spalte, nicht als
  // getippter Buchstabe; das Kuerzel ist hier unsere Wahl, die Bedeutung ist
  // charlys. `calculus` ist ein boolesches Feld in defaultState().
  "Zst":  { kind: "axis", field: "calculus", value: true },
  ")L(":  { kind: "axis", field: "missingClosed", value: true },
  // "ersetzt" and "Brueckenglied" are both a gap that carries something. A
  // pontic is a gap tooth with a bridge on it (`restorationOptions()` offers a
  // missing tooth exactly that); plain "ersetzt" says only that the tooth is
  // gone. See the OPEN QUESTIONS note at the foot of this file.
  "b":    { kind: "axes", takesMaterial: true, edits: [
             { field: "toothSelection", value: "none" },
             { field: "restorationType", value: "bridge" } ] },
  // Two neighbouring keys that are NOT the same thing (Dirk, 19.08.2026):
  //
  //   b   Brueckenglied            — a gap spanned by a bridge
  //   e   Zahn ersetzt durch einen — a gap filled by a DENTURE tooth,
  //       Prothesenzahn              "in der Regel aus Kunststoff"
  //
  // They land on different axes here, and that is the whole point: a bridge is
  // `restorationType`, a denture tooth is `prosthesis`, and the two are
  // MUTUALLY EXCLUSIVE by the registry's own rule — selecting a removable
  // entry "writes s.prosthesis and clears restorationType/material (a tooth
  // has EITHER a fixed restoration OR a prosthesis, never both)".
  //
  // `removable-partial` rather than `removable-full`, because one key on one
  // tooth cannot know which: a full denture is a property of the whole arch,
  // not of the tooth being keyed.
  // Whether it is a PARTIAL or a FULL denture is not in the keystroke — it is
  // in how many teeth are marked. Dirk, 19.08.2026: "Totalprothese OK & UK,
  // alle markieren, e, fertig." So `e` emits an edit that names the finding and
  // leaves the extent to `dentureValueFor()`, which can see the selection.
  "e":    { kind: "denture" },

  // --- restoration
  "k":    { kind: "axis", field: "restorationType", value: "crown", takesMaterial: true },
  // Dirk plaediert fuer ONL statt charlys TK: `t` (Teleskop) and `TK`
  // (Teilkrone) live in DIFFERENT axes here — restorationMaterial against
  // restorationType — and two keys that look like siblings but write to
  // different fields are where keyboard and FHIR later drift apart. charly's
  // spelling is accepted as well, so his fingers are not retrained.
  "ONL":  { kind: "axis", field: "restorationType", value: "onlay", takesMaterial: true },
  "TK":   { kind: "axis", field: "restorationType", value: "onlay", takesMaterial: true },
  "t":    { kind: "axes", edits: [
             { field: "restorationType", value: "crown" },
             { field: "restorationMaterial", value: "telescope" } ] },

  // --- endodontics
  "wf":   { kind: "axis", field: "endo", value: "endo-filling" },
  "WFi":  { kind: "axis", field: "endo", value: "endo-filling-incomplete" },
  "Twf":  { kind: "axis", field: "endo", value: "endo-medical-filling" },
  "Sti":  { kind: "axis", field: "rootPostType", value: "metal" },
  "Res":  { kind: "axis", field: "endoResection", value: true },
  // Beads odontogram-t6y / -ca0, gebaut am 20.08.2026. `Fra` meint bei charly
  // die WURZELfraktur; unsere drei Bruchachsen meinen die Krone. Ob laengs
  // oder quer sagt die Taste nicht - sie setzt den haeufigeren und klinisch
  // folgenschwereren Fall, die Laengsfraktur, und der Klickweg verfeinert.
  "Fra":  { kind: "axis", field: "rootFracture", value: "vertical" },
  "Hem":  { kind: "axis", field: "rootResection", value: "hemisection" },

  // --- apical. `Be` is "beherdet" — one key against our five AAE values, so it
  // resolves to the unspecific one and the picker keeps the refinement.
  "Be":   { kind: "axis", field: "apicalDx", value: "asymptomatic-apical-periodontitis" },
  "Zys":  { kind: "axes", edits: [
             { field: "apicalDx", value: "asymptomatic-apical-periodontitis" },
             { field: "periapicalType", value: "cyst" } ] },

  // --- surfaces. `v` is vestibulaer, which our state spells `buccal`.
  "m":    { kind: "surface", surface: "mesial" },
  "o":    { kind: "surface", surface: "occlusal" },
  "d":    { kind: "surface", surface: "distal" },
  "v":    { kind: "surface", surface: "buccal" },
  "l":    { kind: "surface", surface: "lingual" },

  // --- caries. `c` opens a caries run; `C` is charly's switcher onto the five
  // stages and means the same thing here.
  "c":    { kind: "caries" },
  "C":    { kind: "caries" },
  "K1":   { kind: "severity", severity: 2 },
  "K2":   { kind: "severity", severity: 3 },
  "K3":   { kind: "severity", severity: 4 },
  "K4":   { kind: "severity", severity: 5 },
  "K5":   { kind: "severity", severity: 6 },

  // --- Pulpapruefung (Bead odontogram-fu1, gebaut am 20.08.2026). Vier Tasten,
  // ZWEI Achsen: ein vitaler Zahn kann perkussionsempfindlich sein.
  "+":    { kind: "axis", field: "sensibility", value: "vital" },
  "-":    { kind: "axis", field: "sensibility", value: "no-response" },
  "\u2212": { kind: "axis", field: "sensibility", value: "no-response" },  // typografisches Minus
  "?":    { kind: "axis", field: "sensibility", value: "questionable" },
  "p":    { kind: "axis", field: "percussion", value: "sensitive" },

  // --- material mode. `E` and `Ker` both switch to ceramic (Dirk,
  // 19.08.2026: "E schaltet das Material auf Keramik um") — one is the
  // Ersatz-row spelling, the other the material row's.
  // The KEYS are single capitals (Dirk, 19.08.2026: "K schaltet das Material
  // auf Kunststoff, A auf Amalgam, G auf Gold", and "E schaltet das Material
  // auf Keramik um"). The keypad LABELS them Am / Kst / Ker, and those
  // spellings are deliberately NOT typable — accepting them looks generous and
  // is in fact a trap: `A` followed by `m` (mesial) is then indistinguishable
  // from `Am`, and the mesial surface is silently swallowed. Found by the
  // keyboard test, not by reasoning. One key, one meaning.
  //
  // `K` against `K1`…`K5` is safe because longest match runs first, and `K`
  // against `k` (Krone) because the tokenizer is case-sensitive.
  //
  // GIZ has no key on the keypad at all; it lives in the extended material
  // list, which is a PRODUCT list and not what shorthand maps onto.
  "A":    { kind: "material", material: "Am" },
  "K":    { kind: "material", material: "Kst" },
  "G":    { kind: "material", material: "G" },
  "E":    { kind: "material", material: "Ker" },
  // Zirkon und NEM (Dirk, 31.08.2026): reine Restaurationsmaterialien, im Dock
  // als Chip. Als MEHRSTELLIGE Token (longest-match) kollidieren sie nicht mit
  // den Einzeltasten — "NEM" schlägt vor "E"/"M", "Zir" vor "Zst".
  "Zir":  { kind: "material", material: "Zir" },
  "NEM":  { kind: "material", material: "NEM" },
};

/** Keys we understand and cannot store yet, each with the bead that will give
 *  it a target. Reported separately from `unknown`: a key with no field is a
 *  different situation from a typo, and the caller should be able to say which. */
export const SHORTHAND_PENDING: Record<string, string> = {
  "z":   "",                 // zervikale Flaeche — unser Flaechensatz hat sie nicht
  "R":   "",                 // Wurzelkappe — Dirk fragt selbst, ob es die noch gibt
};

/** A material key from charly's row, and its TWO readings.
 *
 *  This is the subtlety the keypad hides: one key means a different value
 *  depending on what it is applied to. Gold on surfaces is not a filling —
 *  our `fillingMaterial` has no gold — and charly agrees without saying so:
 *  its own planning table spells the entry "Fuellung n-flaechig Gold /
 *  Teilkrone". Conversely amalgam is no restoration material here.
 *
 *  Keeping both readings on ONE key is what lets `Kst mo` be a composite
 *  filling and `Kst e` a replacement in Gradia, from the same keystroke. */
export type MaterialKey = "Am" | "Kst" | "GIZ" | "G" | "Ker" | "Zir" | "NEM";

export interface MaterialReading {
  /** `fillingMaterial` value, or null when this material is never a direct filling. */
  filling: string | null;
  /** `restorationMaterial` value, or null when it is never a restoration. */
  restoration: string | null;
}

export const MATERIALS: Record<MaterialKey, MaterialReading> = {
  Am:  { filling: "amalgam",   restoration: null },
  Kst: { filling: "composite", restoration: "gradia" },   // Kunststoff (Verblendung/Krone)
  GIZ: { filling: "gic",       restoration: null },
  G:   { filling: null,        restoration: "gold" },
  Ker: { filling: null,        restoration: "emax" },      // Keramik (e.max)
  Zir: { filling: null,        restoration: "zircon" },    // Zirkon
  NEM: { filling: null,        restoration: "metal" },     // Nicht-Edelmetall
};

// -----------------------------------------------------------------------------
// Tokenizer
// -----------------------------------------------------------------------------

/** Every key we can recognise, longest first, so `Twf` never reads as `T`+`wf`
 *  and `o.B.` never as `o`. Built once. */
const TOKENS_DE: string[] = [
  ...Object.keys(SHORTHAND_DE),
  ...Object.keys(SHORTHAND_PENDING),
].sort((a, b) => b.length - a.length);

/** Splits an input into known keys, longest match first, CASE-SENSITIVELY.
 *  Whitespace separates but is not required. An unrecognised character is
 *  returned as a one-character token so the caller can report it. */
export function tokenizeShorthand(input: string): string[] {
  const out: string[] = [];
  let i = 0;
  while(i < input.length){
    if(/\s/.test(input[i])){ i++; continue; }
    let hit = "";
    for(const t of TOKENS_DE){
      if(input.startsWith(t, i)){ hit = t; break; }
    }
    if(hit){ out.push(hit); i += hit.length; }
    else { out.push(input[i]); i += 1; }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Parser
// -----------------------------------------------------------------------------

/**
 * Resolves an input into edits, carrying the material mode in and out.
 *
 * A run of surface keys is collected and flushed when something else arrives
 * or the input ends. Whether the run becomes a filling or a caries lesion is
 * decided by whether a caries key opened it — which is Dirk's own description:
 * "bei Fuellungen ist der Zahn markiert und ich gebe mit mod die Flaechen ein",
 * so a bare surface run IS a filling. A severity key (`K1`…`K5`) implies caries
 * even without `c`, because on the keypad it is only reachable through the
 * caries switcher.
 */
export function parseShorthand(input: string, ctx: ShorthandContext = {}): ShorthandResult {
  const edits: ShorthandEdit[] = [];
  const unknown: string[] = [];
  const pending: { token: string; bead: string }[] = [];
  const needsMaterial: string[] = [];
  let material: MaterialKey | null = ctx.material ?? null;

  let run: SurfaceKey[] = [];
  let runIsCaries = false;
  let runSeverity: number | null = null;

  // A restoration key takes the material mode with it — that is the whole
  // point of the mode standing before the finding. `t` does NOT: it names its
  // own material (telescope), and a mode left over from an earlier tooth must
  // not overwrite it. A material with no restoration reading (amalgam, GIZ)
  // writes nothing rather than inventing one.
  const applyMaterial = (token: string) => {
    const rest = material ? MATERIALS[material].restoration : null;
    if(rest) edits.push({ kind: "axis", field: "restorationMaterial", value: rest });
    else needsMaterial.push(token);
  };

  const flush = () => {
    if(run.length === 0 && !runIsCaries){ runSeverity = null; return; }
    if(runIsCaries){
      if(run.length > 0) edits.push({ kind: "surfaces", target: "caries", surfaces: run, severity: runSeverity });
    } else if(material && MATERIALS[material].filling){
      edits.push({ kind: "surfaces", target: "filling", surfaces: run, material: MATERIALS[material].filling! });
    } else if(material && MATERIALS[material].restoration){
      // A material that is never a direct filling, applied to surfaces: a partial
      // restoration carrying it, not a filling. The SURFACES are its extent —
      // stored in the matching coverage (inlay/onlay/veneer) at write time so the
      // cost plan can bill "n-flächig, Material X" (Dirk, 31.08.2026). The
      // restorationType is set by the writer (default inlay), so a veneer already
      // on the tooth keeps being a veneer.
      edits.push({ kind: "axis", field: "restorationMaterial", value: MATERIALS[material].restoration! });
      if(run.length > 0) edits.push({ kind: "surfaces", target: "restoration-coverage", surfaces: run });
    } else {
      // Surfaces with no material chosen = CARIES. charly's mode block always
      // has one key lit — `C` (caries) or a material — so "no material" is its
      // `C` state, and the keypad now shows that state as its own switch (Dirk,
      // 25.09.2026). This used to be reported as an error, which left the
      // keyboard unable to do what the lit caries switch said: `mod` did
      // nothing while the keypad's m/o/d keys entered caries.
      edits.push({ kind: "surfaces", target: "caries", surfaces: run, severity: null });
    }
    run = [];
    runIsCaries = false;
    runSeverity = null;
  };

  for(const tok of tokenizeShorthand(input)){
    const entry = SHORTHAND_DE[tok];
    if(!entry){
      flush();
      if(tok in SHORTHAND_PENDING) pending.push({ token: tok, bead: SHORTHAND_PENDING[tok] });
      else unknown.push(tok);
      continue;
    }
    switch(entry.kind){
      case "surface":
        run.push(entry.surface);
        break;
      case "caries":
        // Opens a run; surfaces already collected belong to it.
        runIsCaries = true;
        break;
      case "severity":
        runIsCaries = true;
        runSeverity = entry.severity;
        break;
      case "material":
        flush();
        material = entry.material;
        break;
      case "axis":
        flush();
        edits.push({ kind: "axis", field: entry.field, value: entry.value });
        if(entry.takesMaterial) applyMaterial(tok);
        break;
      case "axes":
        flush();
        for(const e of entry.edits) edits.push({ kind: "axis", field: e.field, value: e.value });
        if(entry.takesMaterial) applyMaterial(tok);
        break;
      case "denture":
        flush();
        edits.push({ kind: "denture" });
        break;
      case "reset":
        flush();
        edits.push({ kind: "reset" });
        break;
    }
  }
  flush();
  return { edits, material, unknown, pending, needsMaterial };
}

/** Keys that ARE a finding on their own, as opposed to those that open a run
 *  and wait for what follows (the caries marker, a severity).
 *
 *  A SURFACE is one since 25.09.2026 (Dirk: "Ich aktiviere Karies und druecke
 *  m o d und nichts erscheint"): with no material a surface is caries, with one
 *  it is a filling — complete either way, so it appears on the keystroke, as in
 *  charly. The buffer before it still rides along: `cK3m` commits as ONE caries
 *  run at stage K3, `Km` as a composite filling. */
const STANDALONE = new Set(["axis", "axes", "material", "reset", "denture", "surface"]);

/** Whether some longer key begins with this one — `A` can still become `Am`,
 *  `K` can still become `K3` or `Kst`. */
function canExtend(token: string): boolean {
  return TOKENS_DE.some(t => t !== token && t.startsWith(token));
}

/**
 * Whether what has been typed so far can be applied WITHOUT waiting for Tab
 * or Enter.
 *
 * Dirk, 19.08.2026: "Wenn z.B. 6 OK Frontzaehne eine Keramikkrone haben,
 * markiere ich alle 6 und druecke k." One keystroke, done — so a key that is a
 * complete finding must not sit in a buffer waiting for a second keystroke
 * that has no reason to exist.
 *
 * It commits only when BOTH hold:
 *
 *   - the last key is a finding on its own (`k`, `e`, `x`, a material switch,
 *     a surface), not a run opener — `c` waits, because caries without
 *     surfaces is nothing;
 *   - no longer key begins with it — `A` waits because it may still become
 *     `Am`, and `K` waits because it may still become `K3`, `Kst` or `Ker`.
 *
 * The waiting cases resolve on the next keystroke: `Ak` tokenizes as `A` + `k`,
 * whose last key is standalone and unextendable, so the pair commits together.
 * A buffer that waits only because a longer key COULD follow (`o` before
 * `o.B.`, `K` before `K3`) is committed by the caller after a short pause
 * (`isCompleteShorthand`) — at the end of `mod` there is no next keystroke.
 */
export function shouldCommit(buffer: string): boolean {
  const tokens = tokenizeShorthand(buffer);
  if(tokens.length === 0) return false;
  const last = tokens[tokens.length - 1];
  const entry = SHORTHAND_DE[last];
  if(!entry || !STANDALONE.has(entry.kind)) return false;
  return !canExtend(last);
}

/** The caries stage a buffer consists of, and nothing else (`K3` -> 4), or
 *  null. Dirk's order is surfaces FIRST, stage after — "mod K3" (19.08.2026) —
 *  and since a surface now applies on its keystroke, a stage typed right after
 *  it grades the surfaces just entered; the key handler does that. */
export function loneSeverity(buffer: string): number | null {
  const tokens = tokenizeShorthand(buffer);
  if(tokens.length !== 1) return null;
  const entry = SHORTHAND_DE[tokens[0]];
  return entry && entry.kind === "severity" ? entry.severity : null;
}

/** Whether a buffer that `shouldCommit` holds back would already mean
 *  something if applied as it stands — its last key a complete finding that
 *  merely COULD grow (`o` → `o.B.`, `K` → `K3`). The key handler commits such
 *  a buffer after a short pause. A run opener alone (`c`, a stage) is not
 *  complete: caries without a surface is nothing. */
export function isCompleteShorthand(buffer: string): boolean {
  const tokens = tokenizeShorthand(buffer);
  if(tokens.length === 0) return false;
  const entry = SHORTHAND_DE[tokens[tokens.length - 1]];
  return !!entry && STANDALONE.has(entry.kind);
}

// -----------------------------------------------------------------------------
// The walk: which tooth the shorthand lands on
// -----------------------------------------------------------------------------
//
// Dirk, 19.08.2026: "ich springe mit der Tabulator-Taste von einem Zahn zum
// naechsten, Anfang immer bei 18, Shift + Tabulator springt einen Zahn
// zurueck. Das will ich hier auch."
//
// That is what makes `k-b` a single gesture rather than two mouse selections:
// `k`, Tab, `b` — crown on one tooth, pontic on its neighbour. The shorthand
// and the walk are one workflow, which is why the order lives beside the table
// instead of in the key handler.
//
// The two rows are the SAME ones `odontogram.ts` already navigates with the
// arrow keys (`NAV_ROWS`), and it imports them from here — one table, so the
// arrow keys and the Tab walk can never disagree about where a tooth is.

// The arch ORDER lives here too, not only the shorthand: the Tab walk
// (odontogram-t8y) and the drag/Shift span (odontogram-apn) and the arrow keys
// in `odontogram.ts` all read these two rows. One table, so none of the four
// can disagree about where a tooth stands or what lies between two of them.

/** The arch as it is charted and displayed: upper left to right, then lower. */
export const ARCH_ROWS: readonly (readonly number[])[] = [
  [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38],
] as const;

/** One continuous charting order over both arches, beginning at 18.
 *
 *  It is NOT the display order flattened. Dirk, 19.08.2026: "18 zu 28 und
 *  Tabulator nach 28 springt zu 38." The walk goes AROUND THE MOUTH — upper
 *  right to upper left, then straight down and back along the lower arch to
 *  the lower right — while the lower row is DISPLAYED from 48 to 38. So the
 *  lower row is walked in reverse of how it is drawn, and the two orders are
 *  deliberately different rather than one being a mistake for the other. */
export const CHARTING_ORDER: readonly number[] = [
  ...ARCH_ROWS[0],
  ...[...ARCH_ROWS[1]].reverse(),
];

/**
 * Every tooth from `a` to `b` inclusive, along the arch — a SPAN, the way a
 * clinician thinks of one.
 *
 * Bead odontogram-apn. Deliberately arch order rather than geometry: a
 * rectangle drawn over the tile centres picks up teeth in the OPPOSING jaw as
 * soon as the pointer strays a few pixels, which is never what was meant. It
 * crosses the midline (13 to 23 is a real span) but never the jaw: if `b` sits
 * in the other arch, the span stops at the end of `a`'s.
 *
 * `isChartable` drops what is not on the chart — hidden wisdom teeth — so a
 * span drawn across them does not select what cannot be seen.
 */
export function teethBetween(
  a: number,
  b: number,
  isChartable: (toothNo: number) => boolean = () => true,
): number[] {
  const row = ARCH_ROWS.find(r => r.includes(a));
  if(!row) return [];
  const i = row.indexOf(a);
  const j = row.indexOf(b);
  if(j < 0) return [a].filter(isChartable);         // other arch: stay put
  const [from, to] = i <= j ? [i, j] : [j, i];
  return row.slice(from, to + 1).filter(isChartable);
}

/**
 * Partial or full denture, decided by how much of the arch is marked.
 *
 * A full denture is not a different keystroke, it is a different extent: if
 * every chartable tooth of this tooth's arch is in the selection, the arch is
 * being replaced entirely. `isChartable` lets the caller exclude what is not
 * on the chart at all — hidden wisdom teeth, above all, since a mouth charted
 * without third molars must still be able to reach a full denture.
 */
export function dentureValueFor(
  toothNo: number,
  selection: Iterable<number>,
  isChartable: (toothNo: number) => boolean = () => true,
): "removable-full" | "removable-partial" {
  const arch = ARCH_ROWS.find(row => row.includes(toothNo));
  if(!arch) return "removable-partial";
  const marked = new Set(selection);
  const relevant = arch.filter(isChartable);
  if(relevant.length === 0) return "removable-partial";
  return relevant.every(t => marked.has(t)) ? "removable-full" : "removable-partial";
}

/**
 * The next tooth in charting order, or the previous one going back.
 *
 * `isAvailable` skips what is not there to be charted — hidden wisdom teeth,
 * for instance. It is a callback rather than a list because availability is a
 * property of the mounted grid, and this module never touches the DOM.
 *
 * The walk WRAPS: past 38 comes 18 again. A round of the mouth is a round, and
 * stopping dead at the last tooth would mean reaching for the mouse to start
 * over. Returns `null` only when nothing at all is available.
 */
export function nextChartTooth(
  current: number | null,
  direction: 1 | -1 = 1,
  isAvailable: (toothNo: number) => boolean = () => true,
): number | null {
  const n = CHARTING_ORDER.length;
  const at = current === null ? -1 : CHARTING_ORDER.indexOf(current);
  // From nowhere, forward begins at 18 and backward at the last tooth.
  const start = at < 0 ? (direction === 1 ? 0 : n - 1) : at;
  for(let step = 1; step <= n; step++){
    const idx = (((at < 0 ? start - direction : start) + direction * step) % n + n) % n;
    if(isAvailable(CHARTING_ORDER[idx])) return CHARTING_ORDER[idx];
  }
  return null;
}

// -----------------------------------------------------------------------------
// OPEN QUESTIONS — decided by Dirk, not by this file
// -----------------------------------------------------------------------------
//
// * A `b` ALONE is not a finding. Dirk, 19.08.2026: "zu b gehoert irgendwo ein
//   k, oder links und rechts irgendwo jeweils ein k; k-b ist die Ausnahme,
//   bedeutet Krone mit schwebendem Brueckenglied." A bridge needs abutments,
//   and the one-sided case is the cantilever — charly names it too, its own
//   material list carries "SB Schwebebruecke".
//
//   That rule spans SEVERAL teeth and therefore cannot live in this parser,
//   which sees one input at a time. It belongs beside `detectBridgeSpans`
//   (`bridgeOverlay.ts`), which today accepts any run of two adjacent bridge
//   teeth and will happily draw a span carrying no crown at all. Bead
//   odontogram-5rv.
//
// * The denture tooth's MATERIAL is not written. Dirk says it is "in der Regel
//   aus Kunststoff", and that is true, but `prosthesis` carries no material
//   here and `restorationMaterial` may not be set beside it — the registry
//   forbids the combination. So the material mode is left standing and simply
//   does not apply to `e`. If the denture material has to be recorded, it needs
//   an axis first.
// * `Sti` resolves to the independent metal root-post axis. charly does not
//   distinguish the post material on this key; the detailed picker does.
// * `K1`…`K5` map onto ICDAS 2…6. charly has five stages and no definition for
//   them in its own database; ours are seven with one. The mapping is linear
//   from the top, which leaves ICDAS 1 — a change visible only after drying —
//   unreachable by shorthand. Deliberate: it is not a chairside call made in
//   seconds.
// * `Ker` resolves to `emax`. Our `restorationMaterial` has no generic ceramic.
