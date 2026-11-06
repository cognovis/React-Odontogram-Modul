// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { STATUS_EXTRAS } from "./status_extras";
import {
  ARCH_ROWS, nextChartTooth, parseShorthand, shouldCommit, isCompleteShorthand, loneSeverity, dentureValueFor, teethBetween,
  type MaterialKey, type ShorthandEdit,
} from "./shorthand";
import { t, onI18nChange, getI18nLanguage } from "./i18n/useI18n";
import { toLabel, type NumberingSystem } from "./utils/numbering";
import { type OdontogramPlugin, getQuadrant, LAYER_Z } from "./plugin";
import { sanitizePluginSvg } from "./pluginSanitize";
import type { OdontogramDocument, ExaminationSnapshotRecord } from "./document";
import { PAYLOAD_VERSION } from "./document";
export type { OdontogramDocument } from "./document";
import { loadPatientChart, type LoadResult } from "./live/load";
import type { AidboxGateway } from "./live/gateway";
import { executeWritePlan, planGuardedSave, type WriteResult, type WriteTarget } from "./live/save";
import { MissingDentalCoreEffectiveDateError } from "./fhir/toFhirDentalCore";
export type { AidboxGateway, PagedSearchResult } from "./live/gateway";
export type { LoadResult, LoadReport, UnsupportedResource } from "./live/load";
export type { WriteTarget, WriteResult, WriteFailure, LoadOutcome } from "./live/save";
export type { WritePlan, WriteOp, SkippedResource } from "./live/writePlan";
// Bead odontogram-0w9: `isSaveAllowed`, `assembleLoadResult`,
// `SEARCHED_RESOURCE_TYPES`, `buildWritePlan` and `PAYLOAD_VERSION` are
// deliberately NOT re-exported here, and so never reach `App.tsx` or the
// published `dist/index.d.ts`. They were briefly published while the standalone
// app was being split into its own package, on the argument that each already
// had its TYPE on the public surface — but AC2 freezes that surface, and "a
// sibling in this workspace needs it" is a reason to move the CALL SITE, not to
// commit every future consumer to five more supported names. The provisioner
// that needed them now lives in `tools/`, inside this package, and reaches them
// by relative path; the standalone app keeps its own four-line save gate.
// `6fi-live-boundary.test.ts` pins both halves of that.
import { type ImplantProduct, normalizeImplantProduct, isEmptyImplantProduct } from "./implantProduct";
import { type RestorationProduct, normalizeRestorationProduct,
         isEmptyRestorationProduct } from "./restorationProduct";
import { allClearLayers } from "./registry/svgLayers";
import { applyFlagLayers, buildFlagCtx } from "./registry/svgActivate";
import { validValues, validSurfaces } from "./registry/validate";
import { optionsFor, isAxisFlagSatisfied } from "./registry/uiOptions";
import {
  composeRestorationLayers, restorationOptions, isValidRestoration, RESTORATION_MATRIX,
  allRestorationLayers,
  type RestorationType, type RestorationMaterial,
} from "./registry/restorations";
// Bead odontogram-sjr: choosable restoration colours. Session state, like
// perioViewMode and the other app-level flags — a practice preference, never
// patient data, so it is deliberately NOT part of the export payload (Dirk).
// The accepted consequence: a case exported here and opened elsewhere renders
// in THAT practice's colours.
import {
  RESTORATION_PALETTE, applyRestorationPalette, getRestorationPalette as paletteValues,
  setRestorationColourValue, resetRestorationPaletteValues, setRestorationPaletteValues,
  restorationColour, paletteEntry, restorationPaletteIsDefault as paletteIsDefault,
  DRAFT_V1_PALETTE, DRAFT_V1_MATERIAL, applyPaletteVars,
} from "./restorationPalette";
// Bead odontogram-dma: retention gating + bar-span derivation, kept DOM-free.
import {
  retentionOptions, retentionAllowed, detectBarSpans, retentionMark,
  isTelescopeRetention, hasRetention, computeRetentionBars, computeClaspGlyphs,
  type RetentionValue, mesialIsLeft,
} from "./retention";
import {
  renderBridgeOverlay,
  detectBridgeSpans,
  computeBridgeBars,
  barRect,
  tileRectFor,
  defaultMaterialColor,
  UPPER_ARCH, LOWER_ARCH,
  checkBridgeSpans, bridgeSpanNeedsAttention,      // Bead odontogram-5rv
  detectSplintSpans,                                // Verblockung
  detectOcclusalSplintSpans,                        // Schiene
  type BridgeToothState, type BridgeSpanCheck,
} from "./bridgeOverlay";
import { renderGumOverlay } from "./gumOverlay";
import { appendPortal } from "./portal";
import { ageFromDob, suggestDentition, type DentitionKind } from "./dentition";  // Bead odontogram-iqj
import { derivePerioClassification, type PerioClassification, type PerioDerivationInput, type ToothDerivationInput } from "./perioClassification";
// Tooth-template SVGs are imported with Vite's `?raw` suffix so their markup is
// INLINED into the JS bundle as string literals at build time — no runtime
// `fetch()` of an emitted asset URL. This is what makes the built library
// self-contained and portable to any consumer bundler (a fetched hashed asset
// URL would 404 in a downstream app). `TEMPLATES` therefore holds SVG *text*,
// not URLs.
import tooth11Svg from "./assets/teeth-svgs/11.svg?raw";
import tooth12Svg from "./assets/teeth-svgs/12.svg?raw";
import tooth13Svg from "./assets/teeth-svgs/13.svg?raw";
import tooth14Svg from "./assets/teeth-svgs/14.svg?raw";
import tooth15Svg from "./assets/teeth-svgs/15.svg?raw";
import tooth16Svg from "./assets/teeth-svgs/16.svg?raw";
import tooth17Svg from "./assets/teeth-svgs/17.svg?raw";
import tooth18Svg from "./assets/teeth-svgs/18.svg?raw";
import tooth41Svg from "./assets/teeth-svgs/41.svg?raw";
import tooth42Svg from "./assets/teeth-svgs/42.svg?raw";
import tooth43Svg from "./assets/teeth-svgs/43.svg?raw";
import tooth44Svg from "./assets/teeth-svgs/44.svg?raw";
import tooth45Svg from "./assets/teeth-svgs/45.svg?raw";
import tooth46Svg from "./assets/teeth-svgs/46.svg?raw";
import tooth47Svg from "./assets/teeth-svgs/47.svg?raw";
import tooth48Svg from "./assets/teeth-svgs/48.svg?raw";
/* Tooth SVG Test UI (v2) - vanilla JS */

// Exported (read-only use) so `perioGraphic.ts` can parse + clone the same
// tooth-base artwork for the perio "Dental Chart" tooth-row graphic without
// re-importing or duplicating this SVG text. Purely additive — no existing
// call site or behavior changes. Values are inlined SVG markup (see above).
export const TEMPLATES = {
  11: tooth11Svg,
  12: tooth12Svg,
  13: tooth13Svg,
  14: tooth14Svg,
  15: tooth15Svg,
  16: tooth16Svg,
  17: tooth17Svg,
  18: tooth18Svg,
  41: tooth41Svg,
  42: tooth42Svg,
  43: tooth43Svg,
  44: tooth44Svg,
  45: tooth45Svg,
  46: tooth46Svg,
  47: tooth47Svg,
  48: tooth48Svg,
};

/** The eight deciduous drawings, loaded on demand rather than compiled into the
 *  module graph.
 *
 *  They are the same size as the permanent ones - roughly 85 KB of markup each -
 *  and importing them eagerly doubled the tooth artwork every consumer parses at
 *  import time. Measured on this repository's own suite: import time went from
 *  37.5 to 54.3 seconds and a two-instance mount test fell off its five-second
 *  budget. A chart with no milk teeth should not pay for drawings it never
 *  mounts. */
const PRIMARY_SVG_LOADERS: Record<string, () => Promise<string>> = import.meta.glob(
  "./assets/teeth-svgs/{51,52,53,54,55,81,82,83,84,85}.svg",
  { query: "?raw", import: "default" },
) as Any;

function primaryTemplateLoader(tpl: number): (() => Promise<string>) | null {
  const key = Object.keys(PRIMARY_SVG_LOADERS).find((k) => k.endsWith(`/${tpl}.svg`));
  return key ? PRIMARY_SVG_LOADERS[key] : null;
}

/** Which primary template stands in for a tooth that is charted as a milk
 *  tooth. A primary tooth occupies its successor's slot in this engine, so the
 *  key is the permanent position and the value is the deciduous drawing shown
 *  there. TEN drawings cover all twenty — one per position in the upper and the
 *  lower right quadrant; the other side is the same drawing mirrored.
 *
 *  Until 2026-08-17 eight drawings served the twenty positions, and the lower
 *  primary canine was the UPPER one shown a tenth smaller. Dirk drew all ten,
 *  so no position borrows across the jaws any more. */
export const PRIMARY_TEMPLATE = new Map<number, number>([
  [11, 51], [21, 51],
  [12, 52], [22, 52],
  [13, 53], [23, 53],
  [14, 54], [24, 54],
  [15, 55], [25, 55],
  [41, 81], [31, 81],
  [42, 82], [32, 82],
  [43, 83], [33, 83],
  [44, 84], [34, 84],
  [45, 85], [35, 85],
]);
/** The fourteen occlusal drawings, loaded on demand for the same reason as the
 *  deciduous ones above: they went from four to fourteen when every posterior
 *  position got its own, and importing them eagerly would have added ten more
 *  85 KB literals to the module graph of every consumer — for artwork that only
 *  the occlusal tiles mount. `buildGrid` already awaits them. */
const OCCLUSAL_SVG_LOADERS: Record<string, () => Promise<string>> = import.meta.glob(
  "./assets/teeth-svgs/*_occl.svg",
  { query: "?raw", import: "default" },
) as Any;

function occlusalTemplateLoader(tpl: number): (() => Promise<string>) | null {
  const key = Object.keys(OCCLUSAL_SVG_LOADERS).find((k) => k.endsWith(`/${tpl}_occl.svg`));
  return key ? OCCLUSAL_SVG_LOADERS[key] : null;
}

// Nine shape templates, generated by the tooth generator from four source drawings
// and the line-grid contours in Schumacher, Odontographie (scans under
// docs/images). Each template carries its measured anchors in a leading
// `<!-- toothgen: ... -->` comment; the generator re-measures the
// generated files against its anatomical specification.
//
// Root counts follow the anatomy, which the previous four-template set could
// not express: the upper first premolar is the only regularly two-rooted
// premolar, upper molars carry three roots, lower molars two.
//
//   11  upper central incisor      1 root
//   12  upper lateral incisor      1 root   (narrower, relatively longer root)
//   31  lower incisor              1 root   (smallest tooth of the dentition)
//   13  canine                     1 root   (longest root)
//   14  upper 1st premolar         2 roots
//   15  premolar                   1 root   (15/25 plus every lower premolar)
//   16  upper 1st molar            3 roots
//   17  upper 2nd/3rd molar        3 roots  (more convergent than the 6)
//   46  lower molar                2 roots
//
// Orientation per quadrant is unchanged: quadrant 1 as drawn, quadrant 2
// mirrored, quadrant 3 rotated 180, quadrant 4 rotated 180 + mirrored.
export const TOOTH_TEMPLATE = new Map([
  // upper right, as drawn
  [11,{tpl:11,rot:0,mirror:false}],
  [12,{tpl:12,rot:0,mirror:false}],
  [13,{tpl:13,rot:0,mirror:false}],
  [14,{tpl:14,rot:0,mirror:false}],
  [15,{tpl:15,rot:0,mirror:false}],
  [16,{tpl:16,rot:0,mirror:false}],
  [17,{tpl:17,rot:0,mirror:false}],
  [18,{tpl:18,rot:0,mirror:false}],
  // upper left, mirrored
  [21,{tpl:11,rot:0,mirror:true}],
  [22,{tpl:12,rot:0,mirror:true}],
  [23,{tpl:13,rot:0,mirror:true}],
  [24,{tpl:14,rot:0,mirror:true}],
  [25,{tpl:15,rot:0,mirror:true}],
  [26,{tpl:16,rot:0,mirror:true}],
  [27,{tpl:17,rot:0,mirror:true}],
  [28,{tpl:18,rot:0,mirror:true}],
  // lower right (quadrant 4). `mirror:true` together with `rot:180` is a pure
  // VERTICAL flip - it brings the crown up without touching mesial/distal.
  //
  // mirror:false, unlike the upper arch's right side and unlike what stood here
  // until Dirk saw it: "Du hast den 3. Quadranten in den 4. gestellt." His lower
  // drawings ARE quadrant 4, and `rahmen_dreher` rotates them 180 degrees into
  // the template frame - a rotation flips left/right along with top/bottom. The
  // `rot:180` here undoes exactly that, so the drawing stands as drawn and a
  // mirror on top of it turns 41 into 31. The transform was inherited from the
  // position's old entry, which was right for a template built from an UPPER
  // incisor and wrong for a drawing of the tooth itself.
  [41,{tpl:41,rot:180,mirror:true}],
  [42,{tpl:42,rot:180,mirror:true}],
  [43,{tpl:43,rot:180,mirror:true}],
  [44,{tpl:44,rot:180,mirror:true}],
  [45,{tpl:45,rot:180,mirror:true}],
  [46,{tpl:46,rot:180,mirror:true}],
  [47,{tpl:47,rot:180,mirror:true}],
  [48,{tpl:48,rot:180,mirror:true}],
  // lower left (quadrant 3), mirrored
  [31,{tpl:41,rot:180,mirror:false}],
  [32,{tpl:42,rot:180,mirror:false}],
  [33,{tpl:43,rot:180,mirror:false}],
  [34,{tpl:44,rot:180,mirror:false}],
  [35,{tpl:45,rot:180,mirror:false}],
  [36,{tpl:46,rot:180,mirror:false}],
  [37,{tpl:47,rot:180,mirror:false}],
  [38,{tpl:48,rot:180,mirror:false}],
]);

// Occlusal artwork has its own viewpoint contract. The source templates place
// mesial geometry on the right. These transforms keep mesial toward the arch
// midline in the standard chart ordering (patient right on the viewer left).
export const OCCLUSAL_TEMPLATE = new Map([
  // Keine Drehung mehr, in KEINEM Kiefer. Sie stammte aus der Zeit, als die
  // unteren Kauflaechen vom Oberkiefer-Template geliehen waren und deshalb
  // umgedreht werden mussten. Seit Dirk jede Position selbst zeichnet, liegt
  // jede Zeichnung schon richtig - Oberkiefer bukkal oben, Unterkiefer bukkal
  // unten, mesial bei beiden rechts -, und der rechte Quadrant braucht gar
  // keine Transformation. Gedreht statt gespiegelt kam der Unterkiefer mit den
  // bukkalen Hoeckern nach lingual heraus.
  // FRONTZAHN-DRAUFSICHT, ab 18.08.2026. Bis dahin bekam jede Frontzahn-
  // Position eine leere Platzhalterkachel, weil es fuer sie keine Draufsicht
  // gab - und damit auch keinen Platz, eine palatinale Fuellung zu befunden.
  // Die Tafeln der Odontographie tragen die Ansicht, Dirk zeichnet sie nach.
  // Dieselbe Orientierung wie bei den Kauflaechen, von ihm in der Zeichnung
  // mit `v` und `m` beschriftet.
  [11,{tpl:11,rot:0,mirror:false}],[21,{tpl:11,rot:0,mirror:true}],
  [12,{tpl:12,rot:0,mirror:false}],[22,{tpl:12,rot:0,mirror:true}],
  [13,{tpl:13,rot:0,mirror:false}],[23,{tpl:13,rot:0,mirror:true}],
  [41,{tpl:41,rot:0,mirror:false}],[31,{tpl:41,rot:0,mirror:true}],
  [42,{tpl:42,rot:0,mirror:false}],[32,{tpl:42,rot:0,mirror:true}],
  [43,{tpl:43,rot:0,mirror:false}],[33,{tpl:43,rot:0,mirror:true}],
  [14,{tpl:14,rot:0,mirror:false}],[15,{tpl:15,rot:0,mirror:false}],
  [16,{tpl:16,rot:0,mirror:false}],[17,{tpl:17,rot:0,mirror:false}],[18,{tpl:18,rot:0,mirror:false}],
  [24,{tpl:14,rot:0,mirror:true}],[25,{tpl:15,rot:0,mirror:true}],
  [26,{tpl:16,rot:0,mirror:true}],[27,{tpl:17,rot:0,mirror:true}],[28,{tpl:18,rot:0,mirror:true}],
  [44,{tpl:44,rot:0,mirror:false}],[45,{tpl:45,rot:0,mirror:false}],
  [46,{tpl:46,rot:0,mirror:false}],[47,{tpl:47,rot:0,mirror:false}],[48,{tpl:48,rot:0,mirror:false}],
  [34,{tpl:44,rot:0,mirror:true}],[35,{tpl:45,rot:0,mirror:true}],
  [36,{tpl:46,rot:0,mirror:true}],[37,{tpl:47,rot:0,mirror:true}],[38,{tpl:48,rot:0,mirror:true}],
]);

// The TEN primary occlusal drawings (51/52/53/54/55 and 81/82/83/84/85 `_occl`)
// are mounted like any other, since 2026-08-19: `syncOcclusalTemplate` swaps the
// occlusal tile on a state change exactly as `syncToothTemplate` swaps the side
// view. Until then an occlusal tile was built once in `buildGrid` and never
// re-templated, so a milk tooth kept the PERMANENT top view - a milk molar showed
// its successor's artwork, and the six milk front teeth did too as soon as their
// drawings existed. "One template per position" now holds in both views.

const ALL_TEETH = [
  18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,
  48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38
];

const GROUPS = {
  fillingSurfaces: ["buccal","lingual","mesial","distal","occlusal"],
};

const MILKTOOTH_BLOCKED = new Set([16,17,18,26,27,28,36,37,38,46,47,48]);
const FISSURE_ALLOWED = new Set([16,17,26,27,36,37,46,47]);
const BROKEN_VARIANTS = new Set([
  "tooth-broken-incisal",
  "tooth-broken-distal-incisal",
  "tooth-broken-distal",
  "tooth-broken-mesial-incisal",
  "tooth-broken-mesial",
]);
const PRIMARY_MILK = new Set([11,12,13,14,15,21,22,23,24,25,31,32,33,34,35,41,42,43,44,45]);
const MIXED_PERMANENT = new Set([11,12,16,21,22,26,31,32,36,41,42,46]);
const MIXED_MILK = new Set([13,14,15,23,24,25,33,34,35,43,44,45]);
const MIXED_NONE = new Set([17,18,27,28,37,38,47,48]);

// SP6 Task 4 (§8): anterior teeth (incisors + canines) — FDI 11-13/21-23/31-33/
// 41-43. Drives the "occlusal" -> "incisal" display-only label swap; the
// stored surface value always stays "occlusal".
const ANTERIOR_TEETH = new Set([11,12,13,21,22,23,31,32,33,41,42,43]);
export function isAnteriorTooth(toothNo: number): boolean {
  return ANTERIOR_TEETH.has(toothNo);
}

// SP16 Task 2: arch helper (upper vs. lower jaw) — quadrants 1/2 (permanent
// upper) and 5/6 (milk upper) are "upper"; 3/4 (permanent lower) and 7/8
// (milk lower) are "lower". Drives the full-mode lingual->palatal swap.
export function isUpperTooth(toothNo: number): boolean {
  const q = Math.floor(toothNo / 10);
  return q === 1 || q === 2 || q === 5 || q === 6;
}

// SP-perio P2b Task 2: furcation entrance set for a given tooth, by FDI
// POSITION (`toothNo % 10`) + quadrant. Deliberately position-based only —
// it does NOT gate on whether the tooth is actually present/natural (that
// present-natural-tooth gate belongs to the render layer, added in a later
// task). Upper molars (position 6/7/8, quadrants 1-2: 16/17/18, 26/27/28)
// have 3 entrances (mesial/distal/buccal); lower molars (quadrants 3-4:
// 36/37/38, 46/47/48) have 2 (buccal/lingual); upper FIRST premolars only
// (14, 24 — position 4, quadrants 1-2) have 2 (mesial/distal), since the
// mesial root trunk on an upper first premolar can carry a furcation, unlike
// upper second premolars (15/25) or any lower premolar. Every other tooth
// (anteriors, lower premolars, upper 2nd premolars) has none. Returns a
// fresh array each call (safe to mutate); order matches the brief exactly.
export function furcationEntrances(toothNo: number): string[] {
  const position = toothNo % 10;
  const quadrant = Math.floor(toothNo / 10);
  const isUpperQuadrant = quadrant === 1 || quadrant === 2;
  const isLowerQuadrant = quadrant === 3 || quadrant === 4;
  const isMolarPosition = position === 6 || position === 7 || position === 8;
  if (isMolarPosition && isUpperQuadrant) return ["mesial", "distal", "buccal"];
  if (isMolarPosition && isLowerQuadrant) return ["buccal", "lingual"];
  if (position === 4 && isUpperQuadrant) return ["mesial", "distal"]; // 14/24 only
  return [];
}

/**
 * Die beiden Zwischenraeume, an die ein Zahn grenzt - als Befundstellen.
 *
 * Eine Papille liegt ZWISCHEN zwei Zaehnen und gehoert damit zweien. Gespeichert
 * wird sie trotzdem je Zahn und Seite, wie die sechs Sondierungsstellen: MB von
 * 46 und DB von 47 beschreiben denselben Zwischenraum, und das ist im
 * Parodontalstatus seit jeher so. Zwei Nachbarn koennen dieselbe Papille
 * verschieden beurteilen - das ist kein Fehler des Modells, sondern zwei
 * Beobachtungen von zwei Seiten, und beide werden angezeigt.
 *
 * Positionsbasiert wie `furcationEntrances`: der letzte Zahn im Bogen hat
 * distal keinen Nachbarn und damit auch keine distale Papille. Ueber die
 * Mittellinie hinweg gibt es sie sehr wohl - zwischen 11 und 21 liegt die
 * Papille, die am haeufigsten fehlt.
 *
 * Ob an der Stelle wirklich ein Nachbar STEHT, entscheidet der Zustand und
 * nicht die Position; das gehoert wie bei der Furkation in die Anzeige
 * (`papillaLossAllowed`), nicht hierher.
 */
export function papillaSites(toothNo: number): string[] {
  const position = toothNo % 10;
  const quadrant = Math.floor(toothNo / 10);
  const letzte = quadrant >= 5 ? 5 : 8;   // Milchgebiss endet am zweiten Milchmolaren
  return position >= letzte ? ["mesial"] : ["mesial", "distal"];
}

/**
 * Welche Wurzeln eine Position hat - benannt, nicht gezaehlt.
 *
 * Dirk, 20.08.2026: eine Bruchlinie muss sich "bei mehrwurzeligen Zaehnen per
 * Schalter zwischen den Wurzeln wechseln" lassen, und bei der Hemisektion muss
 * "die entfernte Wurzel umschaltbar sein". Beides braucht NAMEN, nicht nur eine
 * Zahl - und die Namen sind anatomisch verschieden je Kiefer.
 *
 * Positionsbasiert wie `furcationEntrances` daneben, und aus demselben Grund:
 * die Wurzelzahl haengt an der Position und nicht am Zustand. Ein leeres
 * Ergebnis heisst EINWURZELIG - dort gibt es nichts zu waehlen, und die
 * Bedienung zeigt den Schalter gar nicht erst.
 *
 * Nicht aus der Spezifikation des Zahngenerators gelesen, obwohl dort die Wurzelzahl
 * steht: das ist Python, laeuft beim Erzeugen und nicht zur Laufzeit, und die
 * Namen stehen dort ohnehin nicht. Zwei Tabellen sind es damit nicht - jene
 * zaehlt fuer die Zeichnung, diese benennt fuer den Befund.
 */
/**
 * Auf welcher Seite eine benannte Wurzel im Bild steht.
 *
 * Zum ZEICHNEN reicht der anatomische Name nicht: eine Seitenansicht kennt nur
 * links und rechts. Mesial liegt je nach Quadrant auf der einen oder der
 * anderen Seite (`mesialIsLeft`), und die palatinale Wurzel eines
 * Oberkiefermolaren steht in dieser Ansicht HINTER der bukkalen - sie hat gar
 * keine eigene Seite. Sie bekommt deshalb "mitte", und was dort gezeichnet
 * wird, liegt auf dem Stamm.
 */
export function rootSideOf(toothNo: number, root: string): "links" | "rechts" | "mitte" {
  const mesialLinks = mesialIsLeft(toothNo);
  if(root === "mesial" || root === "mesiobuccal") return mesialLinks ? "links" : "rechts";
  if(root === "distal" || root === "distobuccal") return mesialLinks ? "rechts" : "links";
  return "mitte";   // palatinal und bukkal stehen hintereinander
}

export function rootsOf(toothNo: number): string[] {
  const position = toothNo % 10;
  const quadrant = Math.floor(toothNo / 10);
  const oben = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const unten = quadrant === 3 || quadrant === 4 || quadrant === 7 || quadrant === 8;
  const molar = position === 6 || position === 7 || position === 8;
  const milchmolar = (quadrant >= 5) && (position === 4 || position === 5);
  if((molar || milchmolar) && oben) return ["mesiobuccal", "distobuccal", "palatal"];
  if((molar || milchmolar) && unten) return ["mesial", "distal"];
  if(position === 4 && oben && quadrant < 5) return ["buccal", "palatal"];  // nur 14/24
  return [];
}

const MOD_OPTIONS = optionsFor("mods");

function getPeriapicalTypeOptions(){
  return optionsFor("periapicalType").map(o => ({ value: o.value, label: t(o.labelKey) }));
}

const CARIES_OPTIONS = [
  { value: "caries-mesial", labelKey: "surface.mesial" },
  { value: "caries-distal", labelKey: "surface.distal" },
  { value: "caries-buccal", labelKey: "surface.buccal" },
  { value: "caries-lingual", labelKey: "surface.lingualPalatal" },
  { value: "caries-occlusal", labelKey: "surface.occlusal" },
  { value: "caries-subcrown", labelKey: "surface.subcrown" },
];

const FILLING_SURFACE_LABELS: Record<string, string> = {
  buccal: "surface.buccal",
  lingual: "surface.lingualPalatal",
  mesial: "surface.mesial",
  distal: "surface.distal",
  occlusal: "surface.occlusal",
};

type Any = any;

// Restoration material -> its SVG wrapper <g> id. Every material lives inside a
// per-material group in the artwork; activating the group lets its (individually
// toggled) crown/connector/inlay/onlay/veneer children paint. `temporary` uses a
// legacy group id; all others match the material id.
const RESTORATION_WRAPPER_GROUP: Record<string, string> = {
  emax: "emax", gold: "gold", gradia: "gradia", zircon: "zircon", metal: "metal",
  "metal-ceramic": "metal-ceramic", telescope: "telescope", temporary: "temporary-restorations",
};

// `prosthesis` axis value -> its i18n summary label. Implant attachments
// (healing-abutment/locator/bar) and removable/bar-retained dentures share this
// one map — used by both the per-tooth tooltip (getStateSummary) and the
// tooth-information panel (getOdontogramSummary).
const PROSTHESIS_SUMMARY_KEY: Record<string, string> = {
  "healing-abutment": "prosthesis.type.healingAbutment",
  locator: "prosthesis.type.locator",
  "locator-denture": "prosthesis.type.locatorDenture",
  bar: "prosthesis.type.bar",
  "bar-denture": "prosthesis.type.barDenture",
  "removable-partial": "prosthesis.type.removablePartial",
  "removable-full": "prosthesis.type.removableFull",
};

// SP-perio P1 Task 1: canonical 6-site periodontal probing order — buccal row
// (mesio-buccal, buccal, disto-buccal), then lingual/palatal row (mesio-
// lingual, lingual/palatal, disto-lingual). Shared verbatim by the data core
// here and every later perio task (UI charting grid, FHIR mapping) — the
// exact array identity/order those tasks key their per-site controls to.
export const PERIO_SITES = ["MB", "B", "DB", "ML", "L", "DL"] as const;
export type PerioSite = typeof PERIO_SITES[number];

function defaultState(){
  return {
    toothSelection: "tooth-base", // none | tooth-base | milktooth | implant | variants
    // Bead odontogram-0n8: WIE WEIT ein vorhandener Zahn durchgebrochen ist,
    // nach dem sichtbaren Kronenanteil. `none` heisst in Okklusion oder nicht
    // erhoben - der Regelfall, und deshalb nie gespeichert.
    //
    // Die Grenze zu `toothSelection: "not-erupted"` ist scharf und beide
    // ueberschneiden sich nicht: JENES heisst, dass gar nichts zu sehen ist,
    // DIESES stuft einen sichtbaren Zahn ab. Ein nicht durchgebrochener Zahn
    // traegt deshalb keine Stufe (`eruptionAllowed`), und wird ein Zahn auf
    // `not-erupted` gesetzt, faellt die Stufe weg. Eine Frage, zwei Werte, aber
    // kein Wert an zwei Orten.
    eruptionStage: "none",  // none | emerging | half-crown | full-crown
    endoResection: false,
    mods: new Set(),
    periapicalType: "none", // none | granuloma | cyst | abscess (qualifies mods "inflammation")
    endo: "none", // none | endo-medical-filling | endo-filling | endo-filling-incomplete
    rootPostType: "none", // none | glass-fiber | metal; independent from endo
    // Endo pro Wurzel/Kanal (charly WURZELZUSTAND: je Wurzel ein Set). Keyed by
    // root name (rootsOf; single-rooted → "single"), value = subset of
    // ["filling","post","incomplete","temporary"] — WF und Stift koexistieren,
    // ein Kanal gefüllt, ein anderer nicht. Leer/absent = Kanal unbehandelt.
    // Vorrangig vor dem `endo`-Skalar, der als whole-tooth-Fallback bleibt.
    endoCanals: {} as Record<string, string[]>,
    caries: new Set(),
    cariesActiveDepth: 2, // canonical ICDAS code (2 = superficial representative)
    // SP6 Task 1: the single unified per-surface caries severity (0..6). Read as
    // ICDAS on a primary-caries surface (no filling → drives `caries-{surface}`
    // opacity/`caries-deep`) and as CARS on a recurrent surface (filling present
    // → drives `subcaries-{surface}` opacity). Replaces the two SP5 fields
    // `cariesDepths` (ICDAS) + `secondaryCaries` (CARS), which are now read only
    // from the raw payload during migration (see hydrateState).
    cariesSeverity: new Map(), // surface -> unified severity 0..6
    fillingMaterial: "none", // active material chosen in the dropdown (applied on surface tap)
    fillingSurfaces: new Set(), // buccal/mesial/distal/occlusal (= keys of fillingSurfaceMaterials)
    fillingSurfaceMaterials: new Map(), // surface -> amalgam|composite|gic|temporary
    fissureSealing: false,
    calculus: false,
    contactMesial: false,
    contactDistal: false,
    wearEdge: "none", // none | attrition | erosion  (incisal/occlusal)
    wearCervical: "none", // none | abrasion | abfraction | erosion  (cervical)
    discoloration: "none", // none | tetracycline | fluorosis | nonvital | extrinsic | other
    // SP14 Task 1: orthodontic axes foundation (additive; render lands in Task 2).
    orthoAppliance: "none", // none | bracket | band
    orthoDrift: "none", // none | mesial | distal
    orthoVertical: "none", // none | extrusion | intrusion
    orthoRotation: false,
    // charly „zunehmend": die Kippung/Wanderung/Drehung nimmt zu (progressiv) —
    // ein Qualifier auf den Ortho-Bewegungen, nicht an/aus wie bisher.
    orthoProgressive: false,
    orthoBracketSide: "buccal", // KFO: buccal (Standard) | lingual (Lingualtechnik)
    brokenMesial: false,
    brokenIncisal: false,
    brokenDistal: false,
    // charly führt die Kronenfraktur DREISTUFIG (Riss / gesplittert / Bruch);
    // die brokenMesial/Incisal/Distal-Flags sagen WO, dieser Wert wie SCHWER.
    crownFractureType: "none", // none | crack | split | fracture
    extractionWound: false,
    extractionPlan: false,
    parapulpalPin: false,
    crownReplace: false,
    crownNeeded: false,
    missingClosed: false,
    bridgePillar: false,
    // Bead odontogram-5rv: dieses Brueckenglied haengt einseitig, und zwar
    // ABSICHTLICH - die Schwebebruecke. Ohne diese Angabe ist sie von einem
    // unfertigen Befund nicht zu unterscheiden, und der Hinweis auf die
    // fehlenden Pfeiler stuende dauerhaft an einer fertigen Arbeit. charly
    // fuehrt sie ebenfalls als eigenen Eintrag ("SB Schwebebruecke").
    cantilever: false,
    // charly „Verblockung" (Splinting): dieser Zahn ist mit seinen Nachbarn
    // starr verbunden. Der Overlay-Balken wird über benachbarte verblockte
    // Zähne abgeleitet (detectSplintSpans), wie die Brücken-/Steg-Spanne.
    splinted: false,
    // charly „Schiene" (Aufbiss-/Knirscherschiene): dieser Zahn liegt unter einer
    // Okklusionsschiene. Das durchgehende Band wird über die benachbarten
    // markierten Zähne abgeleitet (detectOcclusalSplintSpans).
    occlusalSplint: false,
    // charly Funktion: Frühkontakt (premature) / Gleithindernis (interference) /
    // Belastung (overload). Eine okklusale Funktionsangabe pro Zahn.
    occlusalFunction: "none", // none | premature | interference | overload
    prosthesis: "none", // none | healing-abutment | locator | locator-denture | bar | bar-denture | removable-partial | removable-full
    mobility: "none", // none | m1 | m2 | m3
    toothSubstrate: "natural",  // natural | radix | broken | crownprep
    restorationType: "none",    // none | crown | inlay | onlay | veneer | bridge
    restorationMaterial: "none", // none | emax | gold | gradia | zircon | metal | metal-ceramic | telescope | temporary
    // charly TEILKRONE1-4: welche FLÄCHEN die Teilkrone (Onlay) bedeckt. Leer =
    // ganze Kaufläche (das bisherige Verhalten); sonst nur die genannten Flächen.
    onlayCoverage: [] as string[],
    // Inlay-Flächen (Dirk, 31.08.2026, wichtig für den Kostenplan): WELCHE
    // Flächen das Inlay umfasst (MO/OD/MOD…). Ein Inlay ist eine mehrflächige
    // Restauration, keine Füllung — die Engine muss die Flächen kennen, um es im
    // HKP als „Inlay n-flächig" abzurechnen.
    inlayCoverage: [] as string[],
    // Veneer-Flächen (Dirk, 31.08.2026): welche Flächen das Veneer bedeckt
    // (labial, ggf. inzisal/approximal) — für den Kostenplan, wie inlayCoverage.
    veneerCoverage: [] as string[],
    crownLeakage: false, // marginal leakage on a crown/bridge restoration (SP3b Task 6)
    // charly „Wurzelkappe": eine Kappe auf einer Wurzel (Radix), z. B. als
    // Auflager einer Deckprothese. Nur auf einem Wurzelrest sinnvoll — der
    // Restaurationsblock ist dort ausgeblendet, also eine eigene Angabe.
    rootCap: false,
    // charly BefundAngabeKronerandBefund + …Seite: der Kronenrand TYPISIERT
    // (überstehend / Karies / Füllung) und die SEITE. crownLeakage sagt nur DASS
    // der Rand undicht ist; diese beiden sagen WAS und WO.
    crownMarginType: "none", // none | overhang | caries | filling
    crownMarginSide: "",     // "" | mesial | distal | buccal | lingual
    // SP4 Task 1: pulp/apical/resorption diagnosis axes. pulpLatin/apicalDx
    // are additive scaffolding — not yet rendered/wired to UI or migration;
    // see later SP4 tasks. resorptionType was wired up (render + migration;
    // replaced the retired `rootResorption` boolean) in SP4 Task 2. pulpDx
    // was wired up (render + migration; replaced the retired `pulpInflam`
    // boolean) in SP4 Task 3.
    pulpDx: "normal", // normal | reversible-pulpitis | irreversible-pulpitis | necrosis (replaces the legacy `pulpInflam` boolean)
    pulpLatin: "none", // none | pulpa-sana | hyperaemia-pulpae | pulpitis-acuta-serosa | pulpitis-acuta-purulenta | pulpitis-chronica-clausa | pulpitis-chronica-ulcerosa | pulpitis-chronica-hyperplastica | necrosis-pulpae | gangraena-pulpae
    apicalDx: "normal", // normal | symptomatic-apical-periodontitis | asymptomatic-apical-periodontitis | acute-apical-abscess | chronic-apical-abscess | condensing-osteitis
    // charly führt die apikale Beherdung PRO WURZEL. Wir behalten apicalDx je
    // Zahn, benennen aber optional die betroffene WURZEL — das Bild sitzt dann
    // an deren Apex statt in der Mitte. "" = ganzer Zahn / nicht angegeben.
    apicalRoot: "",
    resorptionType: "none", // none | internal | external-cervical (replaces the legacy `rootResorption` boolean)
    // SP5 Task 1: caries fields foundation. `rootCaries` is a normal enum axis.
    // `radiographicDepth` is a per-surface scalar map (independent of the visual
    // severity — the radiographic-vs-visual split). The SP5 `secondaryCaries`
    // CARS map was retired in SP6 Task 1 (folded into the unified
    // `cariesSeverity` above; still read from the raw payload on migration).
    rootCaries: "none", // none | active | arrested | active-cavitated
    radiographicDepth: new Map(), // surface -> none | E1 | E2 | D1 | D2 | D3
    fillingDefect: new Map(), // surface -> none | marginal | fracture | wear (on a filled surface)
    // Bead odontogram-wxt: the surfaces whose finding — a filling, a caries
    // lesion, or both — extends into the cervical region. A MEMBERSHIP set over
    // buccal/lingual, never a sixth surface: the marker qualifies a surface, it
    // does not add one, so getFillingSurfaceCount() is untouched by it.
    cervicalSurfaces: new Set(), // subset of { buccal, lingual, mesial, distal }
    // Bead odontogram-d1b: a cervical finding whose SIDE is not documented
    // (charly records "zervikal" with no side on 257 of 621 fillings). A
    // tooth-level set over { filling, caries }: shown as an open finding,
    // never drawn on a surface and never counted as one.
    cervicalSideUnknown: new Set(),
    // SP8 Task 1 foundation, wired up (render + migration) in Task 3: implant-only
    // peri-implant disease axis. none | mucositis | peri-implantitis-mild |
    // peri-implantitis-moderate | peri-implantitis-severe.
    periImplant: "none",
    // Implantatposition (charly BefundAngabeImplantat: MITTIG/MESIAL/DISTAL/
    // MESIAL_UND_DISTAL). Wo das Implantat im Zahnfach steht — nur bei
    // toothSelection === "implant" wirksam. center | mesial | distal | both.
    implantPosition: "center",
    // SP-perio PG-C Task 2: two per-tooth categorical DATA axes (registry/FHIR/
    // payload only; the Dental Chart rows/UI land in PG-C Task 3). Both default
    // "none" and are omit-when-none on serialize; NO svgLayer, so neither renders.
    // Bead odontogram-dma: what holds a removable denture to this tooth. ONE
    // value, never a set — a bar abutment does not normally carry a clasp and
    // a telescope abutment does not either, so choosing one replaces the other
    // and the exclusion falls out of the model instead of needing a rule.
    retention: "none",      // none | clasp | attachment | bar-abutment
    retentionSide: "none",  // none | mesial | distal | both (charly's <Kl / Kl>)
    // Bead odontogram-fu1: was GEPRUEFT wurde, neben dem, was daraus
    // geschlossen wurde. `none` heisst NICHT GEPRUEFT, nicht "unauffaellig".
    rootFracture: "none",  // none | vertical | horizontal (die WURZEL, nicht die Krone)
    // Welche Wurzel es trifft. "" heisst: der Zahn hat nur eine, oder es ist
    // noch nicht gesagt. Der Wert wird gegen `rootsOf(toothNo)` geprueft, also
    // gegen die Anatomie der POSITION - ein palatinaler Wert an einem Molaren
    // des Unterkiefers wird gar nicht erst angenommen.
    rootFractureRoot: "",
    rootResection: "none", // none | hemisection | amputation | premolarisation
    rootResectionRoot: "",  // die ENTFERNTE Wurzel
    sensibility: "none", // none | vital | no-response | questionable
    percussion: "none",  // none | negative | sensitive
    cejVisibility: "none", // none | detectable | not-detectable
    rootConcavity: "none", // none | mild | deep
    // SP-perio PG-D Task 3: two per-tooth categorical DATA axes (registry/FHIR/
    // payload only; the Dental Chart rows/UI land in later PG-D tasks). Both
    // are omit-when-skip on serialize; NO svgLayer, so neither renders.
    gingivalThickness: "unknown", // unknown | thin | medium | thick
    millerClass: "none", // none | i | ii | iii | iv
    // SP-perio P1 Task 1: per-tooth, per-site periodontal probing data —
    // deliberately a SEPARATE sub-record from the 5-surface caries maps
    // above (perio sites are a different geometry: 6 fixed probing points,
    // not tooth surfaces). `pd` (probing depth, mm) is the CHARTING key: a
    // site exists in this record iff `pd` has an entry for it — "absence
    // means not charted", never zero. `gm` (gingival margin offset, mm;
    // signed — positive = recession, negative = coronal/pseudopocket)
    // defaults to 0 when unset. Clinical attachment level (CAL = pd + gm) is
    // ALWAYS derived (see getToothCal()) — never stored. `bop`/`sup`
    // (bleeding/suppuration on probing) are membership-only Sets, and are
    // only ever meaningful for a charted site (see setPerioSite()).
    perio: { pd: new Map(), gm: new Map(), bop: new Set(), sup: new Set() },
    // SP-perio P2b Task 2: per-entrance Glickman furcation involvement grade
    // (I-IV, stored as integer 1-4). Keyed by entrance ("mesial"/"distal"/
    // "buccal"/"lingual" — see furcationEntrances()); an entrance absent
    // from this map is "not recorded", never grade 0. Separate sub-record
    // from `perio` (different geometry: furcation entrances, not the 6
    // fixed probing sites) but follows the exact same omit-when-empty /
    // dual-state conventions.
    furcation: new Map(), // entrance -> grade 1-4
    // SP-perio P2b Task 3: per-surface O'Leary plaque-index presence — a
    // plain 4-surface membership Set (surface in the set = plaque present on
    // it; absence = clean/not recorded — NOT "known absent", same
    // "absence means not charted" convention `perio`/`furcation` use). The
    // 4 surfaces (VALID_PLAQUE_SURFACE below) are the SAME fixed set for
    // EVERY tooth — deliberately distinct from both the 6-site perio-probing
    // geometry and the 5-surface caries/filling geometry, and unlike
    // furcation's position-gated entrance set, no per-tooth gating function
    // is needed here.
    plaque: new Set(), // Set<"mesial"|"distal"|"buccal"|"lingual">
    // Bead odontogram-gry: Papillenverlust nach Nordland & Tarnow (Klasse
    // I-III, als 1-3), je Zwischenraum. Der BEOBACHTETE Befund neben der
    // abgeleiteten Cairo-Klasse: `getToothRecessionType` braucht sechs
    // sondierte Stellen, das schwarze Dreieck sieht man vorher. Eine Seite
    // ohne Eintrag heisst nicht erhoben, nie Klasse 0 - dieselbe Regel wie
    // bei `furcation` daneben.
    papillaLoss: new Map(), // "mesial"|"distal" -> Nordland & Tarnow 1-3
    // SP-perio PG-D Task 1: Silness-Löe Plaque Index (`pi`) and Löe-Silness
    // Gingival Index (`gi`) — per-surface GRADED indices (1-3), over the
    // SAME 4 fixed surfaces as the O'Leary `plaque` boolean above but
    // DELIBERATELY SEPARATE from it (different clinical instrument; a tooth
    // can carry both). Grade 0 (healthy/absent) is never stored — a surface
    // absent from the map means grade 0, same "absence means not charted"
    // convention `perio`/`furcation`/`plaque` all use.
    pi: new Map(), // surface -> Silness-Löe plaque grade 1-3 (absent = 0)
    gi: new Map(), // surface -> Löe-Silness gingival grade 1-3 (absent = 0)
    mpi: new Map(), // implant-only: Mombelli modified plaque index, surface -> grade 1-3 (absent = 0)
    mbi: new Map(), // implant-only: Mombelli modified sulcus bleeding index, surface -> grade 1-3
    // SP-perio PG-D Task 2: keratinized gingiva width — a single per-tooth
    // BUCCAL mm scalar (integer, clamped 0-15), deliberately NOT per-site/
    // per-surface unlike pi/gi/perio above. `null` = not charted (never a
    // stored 0 vs "uncharted" ambiguity — see clampKg()/setKeratinizedWidth()).
    kg: null as number | null,
    // odontogram-im1: WHICH implant is in the tooth, kept apart from the
    // fact that one is there. `null` throughout, and it stays null: Dirk
    // asked for it to be recorded when WE place an implant and to be
    // allowed to stay open when the implant arrived with the patient - not
    // every patient carries an implant passport. So nothing here is ever
    // required, and an empty record is a legitimate, complete state.
    implantProduct: null as ImplantProduct | null,
    // Bead odontogram-99h: WELCHES Produkt, nicht nur welche Klasse.
    restorationProduct: null as RestorationProduct | null,
    // Je Fuellmaterial ein Produkt (odontogram-99h).
    fillingProducts: new Map<string, RestorationProduct>(),
    // Bead odontogram-2vd: explicit ASSESSMENT status per periodontal axis (and
    // measurement point), for the cases the value itself cannot express —
    // assessed-normal (probed, did not bleed), unmeasurable (the point exists
    // but could not be read) and not-applicable. "Not assessed" is the default
    // and is never stored, so this map stays empty for an ordinary chart and
    // the payload stays byte-identical. Keyed `axis` or `axis:qualifier` — see
    // setAssessmentStatus()/getAssessmentStatus().
    assessment: new Map(), // "pd:MB" | "mobility" -> AssessmentStatus
    customStates: {} as Record<string, unknown>,
    note: "",
  };
}

// ---- DOM helpers ----
const $ = (sel: string, el: ParentNode = document) => el.querySelector(sel) as any;
const $$ = (sel: string, el: ParentNode = document) => Array.from(el.querySelectorAll(sel)) as any[];

function el(tag: Any, attrs: Any = {}, children: Any[] = []){
  const n=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==="class") n.className=v;
    else if(k==="text") n.textContent=v;
    else if(k.startsWith("on") && typeof v==="function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k,v);
  }
  for(const c of children) n.appendChild(c);
  return n;
}

function setActive(node: Any, on: Any){
  if(!node) return;
  node.setAttribute("data-active", on ? "1":"0");
}

function stripDisplayNoneToDataActive(root: Any){
  // Convert inline style display:none -> data-active=0, and remove display property from style.
  const nodes = $$("[id]", root);
  for(const n of nodes){
    const style = n.getAttribute("style");
    if(style && /display\s*:\s*none/i.test(style)){
      n.setAttribute("data-active","0");
      // remove display: none; (and possible surrounding semicolons/spaces)
      const newStyle = style
        .replace(/display\s*:\s*none\s*;?/ig, "")
        .replace(/;;+/g,";")
        .trim();
      if(newStyle) n.setAttribute("style", newStyle);
      else n.removeAttribute("style");
    }
  }
}

function ensureDataActiveForSwitchables(root: Any){
  // Every element that is inside these switchable groups and has an id should get data-active (default 0 if missing)
  const switchableGroups = ["mods","tooth-variants","endos","surfaces","restorations","specials"];
  for(const gId of switchableGroups){
    const g = root.getElementById ? root.getElementById(gId) : $("#"+gId, root);
    if(!g) continue;
    for(const n of $$("[id]", g)){
      if(!n.hasAttribute("data-active")) n.setAttribute("data-active","0");
    }
  }
  // Tooth base + pulps should also be consistent
  for(const id of ["tooth-base","tooth-healthy-pulp","tooth-inflam-pulp","milktooth-base","milktooth-beauty","milktooth-healthy-pulp","milktooth-inflam-pulp","tooth-bruxism-wear","tooth-bruxism-neck-wear"]){
    const n = $("#"+id, root);
    if(n && !n.hasAttribute("data-active")) n.setAttribute("data-active","0");
  }
}

function rotate180(svgRoot: Any){
  // rotate around center using a wrapper group
  const vb = svgRoot.getAttribute("viewBox") || "0 0 32 64";
  const parts = vb.trim().split(/\s+/).map(Number);
  const cx = parts[0] + parts[2]/2;
  const cy = parts[1] + parts[3]/2;
  // wrap existing content into a new group
  const g = document.createElementNS("http://www.w3.org/2000/svg","g");
  while(svgRoot.firstChild){
    g.appendChild(svgRoot.firstChild);
  }
  g.setAttribute("transform", `rotate(180 ${cx} ${cy})`);
  svgRoot.appendChild(g);
}

function mirrorVertical(svgRoot: Any){
  // mirror vertically (left-right) around center using a wrapper group
  const vb = svgRoot.getAttribute("viewBox") || "0 0 32 64";
  const parts = vb.trim().split(/\s+/).map(Number);
  const cx = parts[0] + parts[2]/2;
  const g = document.createElementNS("http://www.w3.org/2000/svg","g");
  while(svgRoot.firstChild){
    g.appendChild(svgRoot.firstChild);
  }
  g.setAttribute("transform", `scale(-1 1) translate(${-2*cx} 0)`);
  svgRoot.appendChild(g);
}

function svgGetById(root: Any, id: Any){
  return root.getElementById ? root.getElementById(id) : $("#"+id, root);
}

// ---- App state ----
// R2-A Task 1: dual-state core. The chart now carries two PARALLEL per-case
// states — "status" (findings as they are) and "plan" (proposed treatment) —
// stored in `charts`. `toothState` is kept as a module-scoped, REASSIGNABLE
// ALIAS to whichever chart is currently active, so every existing
// `toothState.get/set/has/delete/clear/keys/values/entries`/`for...of
// toothState` site (~78 of them) keeps compiling and operating on the active
// chart unchanged — only the declaration (`const` -> `let`) and the addition
// of `setChartMode()` reassigning it are new. Render/edit logic is untouched.
// Map key is typed `Any` (not `number`) deliberately: the pre-existing
// `const toothState = new Map()` had NO type parameters, so both key and
// value inferred as `any` — several long-standing call sites pass an
// untyped `Set`/array element (e.g. `selectedTeeth`, declared `Set()` with
// no type param) as the key. Typing the key `number` here would newly
// reject those ~78-unchanged call sites under `tsc -b --noEmit`, which is
// exactly the compile-unchanged guarantee this task must preserve.
const charts: Record<"status" | "plan", Map<Any, Any>> = {
  status: new Map(),
  plan: new Map(),
};
let toothState = charts.status; // active-chart ALIAS — reassigned by setChartMode()
export type ChartMode = "status" | "plan";
let chartMode: ChartMode = "status";

// ---- P4a Task 1: case-level metadata object -------------------------------
// The engine's FIRST case-level object: a single SHARED module-level record
// (NOT per-tooth, NOT part of the status/plan dual-state) for chart-independent
// case context — patient age, smoking, diabetes/HbA1c, and perio summary stats
// (tooth loss attributable to periodontitis, max radiographic bone loss %).
// Mirrors the existing top-level `globals` payload key: one shared block,
// serialized once into the payload's top-level `case` key (omit-when-empty),
// hydrated in the shared `hydrateImportedCharts` data-path used by both
// `importStatus()` and `__hydrateImportedChartsForTest()`.
type CaseMeta = {
  age: number | null;
  smokingStatus: "unknown" | "never" | "former" | "current";
  cigarettesPerDay: number | null;
  diabetesStatus: "unknown" | "none" | "present";
  hba1c: number | null;
  toothLossPerio: number | null;
  maxRblPercent: number | null;
  /** P4b Task 2: per-axis clinician overrides for the 2017 World Workshop
   *  periodontal classification (`getPerioClassification()`). Each is either
   *  a valid enum value for that axis or `null` (not overridden — the
   *  derived value from `derivePerioClassification` wins). Shared caseMeta
   *  fields exactly like the rest of this object — NOT DS-1 gated. */
  diagnosisOverride: string | null;
  stageOverride: string | null;
  gradeOverride: string | null;
  extentOverride: string | null;
  /** UI-3b: chart identity — patient display name + exam date (ISO
   *  `YYYY-MM-DD`). Additive caseMeta fields; NOT emitted to FHIR. */
  patientName: string | null;
  /** 2.2.1: patient date of birth (ISO `YYYY-MM-DD`). Chart identity
   *  only, like patientName/examDate — additive, NOT emitted to FHIR. */
  patientDob: string | null;
  examDate: string | null;
};
function defaultCaseMeta(): CaseMeta {
  return { age: null, smokingStatus: "unknown", cigarettesPerDay: null,
    diabetesStatus: "unknown", hba1c: null, toothLossPerio: null, maxRblPercent: null,
    diagnosisOverride: null, stageOverride: null, gradeOverride: null, extentOverride: null,
    patientName: null, patientDob: null, examDate: null };
}
let caseMeta: CaseMeta = defaultCaseMeta();
const VALID_SMOKING = new Set(["unknown", "never", "former", "current"]);
const VALID_DIABETES = new Set(["unknown", "none", "present"]);
/** P4b Task 2: valid enum values for the four classification override axes —
 *  mirrors `PerioDiagnosis`/`PerioStage`/`PerioGrade`/`PerioExtent` in
 *  `perioClassification.ts` MINUS their non-authorable derived-only values
 *  (`"na"`, `"indeterminate"`) — an override always names a concrete clinical
 *  value, never one of those computed placeholders. */
const VALID_DIAGNOSIS = new Set(["health", "gingivitis", "periodontitis"]);
const VALID_STAGE = new Set(["I", "II", "III", "IV"]);
const VALID_GRADE = new Set(["A", "B", "C"]);
const VALID_EXTENT = new Set(["localized", "generalized", "molar-incisor"]);
function clampInt(v: unknown, lo: number, hi: number): number | null {
  const n = Number(v);
  if(!Number.isFinite(n)) return null;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
function setNumField(cur: number | null, v: unknown, lo: number, hi: number): number | null {
  // non-finite (bad keystroke) is a no-op: keep current; explicit null clears.
  if(v === null) return null;
  const c = clampInt(v, lo, hi);
  return c === null ? cur : c;
}
/** Current shared case-level metadata (age/smoking/diabetes/HbA1c/perio
 *  summary stats). Not part of the status/plan dual-state — chart-independent. */
export function getCaseMeta(): CaseMeta { return { ...caseMeta }; }
export function setCaseAge(v: number | null): void { const n = setNumField(caseMeta.age, v, 0, 120); if(n !== caseMeta.age){ caseMeta.age = n; notifyStateChange(); } }
export function setCigarettesPerDay(v: number | null): void { const n = setNumField(caseMeta.cigarettesPerDay, v, 0, 99); if(n !== caseMeta.cigarettesPerDay){ caseMeta.cigarettesPerDay = n; notifyStateChange(); } }
export function setToothLossPerio(v: number | null): void { const n = setNumField(caseMeta.toothLossPerio, v, 0, 32); if(n !== caseMeta.toothLossPerio){ caseMeta.toothLossPerio = n; notifyStateChange(); } }
export function setMaxRblPercent(v: number | null): void { const n = setNumField(caseMeta.maxRblPercent, v, 0, 100); if(n !== caseMeta.maxRblPercent){ caseMeta.maxRblPercent = n; notifyStateChange(); } }
export function setHba1c(v: number | null): void {
  // one-decimal % in 3.0–20.0; non-finite no-op, null clears.
  if(v === null){ if(caseMeta.hba1c !== null){ caseMeta.hba1c = null; notifyStateChange(); } return; }
  const n = Number(v);
  if(!Number.isFinite(n)) return;
  const clamped = Math.max(3, Math.min(20, Math.round(n * 10) / 10));
  if(clamped !== caseMeta.hba1c){ caseMeta.hba1c = clamped; notifyStateChange(); }
}
export function setSmokingStatus(v: string): void { if(VALID_SMOKING.has(v) && v !== caseMeta.smokingStatus){ caseMeta.smokingStatus = v as CaseMeta["smokingStatus"]; notifyStateChange(); } }
export function setDiabetesStatus(v: string): void { if(VALID_DIABETES.has(v) && v !== caseMeta.diabetesStatus){ caseMeta.diabetesStatus = v as CaseMeta["diabetesStatus"]; notifyStateChange(); } }
/** P4b Task 2: per-axis classification override setters. Each accepts either
 *  a valid enum value for that axis (see `VALID_DIAGNOSIS`/`VALID_STAGE`/
 *  `VALID_GRADE`/`VALID_EXTENT`) OR `null` (clears the override, reverting
 *  that axis to the derived value). An invalid non-null value is a silent
 *  no-op — mirrors `setSmokingStatus`/`setDiabetesStatus` above. Shared
 *  caseMeta fields, NOT DS-1 gated (same as every other caseMeta setter). */
export function setDiagnosisOverride(v: string | null): void {
  if(v === null){ if(caseMeta.diagnosisOverride !== null){ caseMeta.diagnosisOverride = null; notifyStateChange(); } return; }
  if(VALID_DIAGNOSIS.has(v) && v !== caseMeta.diagnosisOverride){ caseMeta.diagnosisOverride = v; notifyStateChange(); }
}
export function setStageOverride(v: string | null): void {
  if(v === null){ if(caseMeta.stageOverride !== null){ caseMeta.stageOverride = null; notifyStateChange(); } return; }
  if(VALID_STAGE.has(v) && v !== caseMeta.stageOverride){ caseMeta.stageOverride = v; notifyStateChange(); }
}
export function setGradeOverride(v: string | null): void {
  if(v === null){ if(caseMeta.gradeOverride !== null){ caseMeta.gradeOverride = null; notifyStateChange(); } return; }
  if(VALID_GRADE.has(v) && v !== caseMeta.gradeOverride){ caseMeta.gradeOverride = v; notifyStateChange(); }
}
export function setExtentOverride(v: string | null): void {
  if(v === null){ if(caseMeta.extentOverride !== null){ caseMeta.extentOverride = null; notifyStateChange(); } return; }
  if(VALID_EXTENT.has(v) && v !== caseMeta.extentOverride){ caseMeta.extentOverride = v; notifyStateChange(); }
}
/** UI-3b Task 1: patient display name + exam date setters. Mirror the
 *  existing caseMeta setter pattern — trim, `null`-clears, malformed
 *  exam-date values are a silent no-op (mirrors `setSmokingStatus`). */
export function setPatientName(v: string | null): void {
  const next = (v === null) ? null : (v.trim() === "" ? null : v.trim());
  if(next !== caseMeta.patientName){ caseMeta.patientName = next; notifyStateChange(); }
}
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function setExamDate(v: string | null): void {
  if(v === null){ if(caseMeta.examDate !== null){ caseMeta.examDate = null; notifyStateChange(); } return; }
  if(v.trim() === ""){ if(caseMeta.examDate !== null){ caseMeta.examDate = null; notifyStateChange(); } return; }
  if(!ISO_DATE.test(v.trim())) return;  // malformed → no-op (mirrors setSmokingStatus)
  const next = v.trim();
  if(next !== caseMeta.examDate){ caseMeta.examDate = next; notifyStateChange(); }
}
/** 2.2.1: patient date-of-birth setter — same ISO-validate/null-clear contract
 *  as {@link setExamDate}; malformed values are a silent no-op. */
export function setPatientDob(v: string | null): void {
  if(v === null){ if(caseMeta.patientDob !== null){ caseMeta.patientDob = null; notifyStateChange(); } return; }
  if(v.trim() === ""){ if(caseMeta.patientDob !== null){ caseMeta.patientDob = null; notifyStateChange(); } return; }
  if(!ISO_DATE.test(v.trim())) return;  // malformed → no-op
  const next = v.trim();
  if(next !== caseMeta.patientDob){ caseMeta.patientDob = next; notifyStateChange(); }
}
export function resetCaseMeta(): void { caseMeta = defaultCaseMeta(); }
function caseMetaIsEmpty(c: CaseMeta): boolean {
  return c.age === null && c.smokingStatus === "unknown" && c.cigarettesPerDay === null
    && c.diabetesStatus === "unknown" && c.hba1c === null && c.toothLossPerio === null && c.maxRblPercent === null
    && c.diagnosisOverride === null && c.stageOverride === null && c.gradeOverride === null && c.extentOverride === null
    && c.patientName === null && c.patientDob === null && c.examDate === null;
}
function serializeCaseMeta(c: CaseMeta): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if(c.age !== null) o.age = c.age;
  if(c.smokingStatus !== "unknown") o.smokingStatus = c.smokingStatus;
  if(c.cigarettesPerDay !== null) o.cigarettesPerDay = c.cigarettesPerDay;
  if(c.diabetesStatus !== "unknown") o.diabetesStatus = c.diabetesStatus;
  if(c.hba1c !== null) o.hba1c = c.hba1c;
  if(c.toothLossPerio !== null) o.toothLossPerio = c.toothLossPerio;
  if(c.maxRblPercent !== null) o.maxRblPercent = c.maxRblPercent;
  if(c.diagnosisOverride !== null) o.diagnosisOverride = c.diagnosisOverride;
  if(c.stageOverride !== null) o.stageOverride = c.stageOverride;
  if(c.gradeOverride !== null) o.gradeOverride = c.gradeOverride;
  if(c.extentOverride !== null) o.extentOverride = c.extentOverride;
  if(c.patientName !== null) o.patientName = c.patientName;
  if(c.patientDob !== null) o.patientDob = c.patientDob;
  if(c.examDate !== null) o.examDate = c.examDate;
  return o;
}
function readCaseMeta(raw: Any): CaseMeta {
  const c = defaultCaseMeta();
  if(!raw || typeof raw !== "object") return c;
  c.age = clampInt(raw.age, 0, 120);
  if(VALID_SMOKING.has(raw.smokingStatus)) c.smokingStatus = raw.smokingStatus;
  c.cigarettesPerDay = clampInt(raw.cigarettesPerDay, 0, 99);
  if(VALID_DIABETES.has(raw.diabetesStatus)) c.diabetesStatus = raw.diabetesStatus;
  { const n = Number(raw.hba1c); c.hba1c = Number.isFinite(n) ? Math.max(3, Math.min(20, Math.round(n * 10) / 10)) : null; }
  c.toothLossPerio = clampInt(raw.toothLossPerio, 0, 32);
  c.maxRblPercent = clampInt(raw.maxRblPercent, 0, 100);
  c.diagnosisOverride = VALID_DIAGNOSIS.has(raw.diagnosisOverride) ? raw.diagnosisOverride : null;
  c.stageOverride = VALID_STAGE.has(raw.stageOverride) ? raw.stageOverride : null;
  c.gradeOverride = VALID_GRADE.has(raw.gradeOverride) ? raw.gradeOverride : null;
  c.extentOverride = VALID_EXTENT.has(raw.extentOverride) ? raw.extentOverride : null;
  c.patientName = (typeof raw.patientName === "string" && raw.patientName.trim() !== "") ? raw.patientName.trim() : null;
  c.patientDob = (typeof raw.patientDob === "string" && ISO_DATE.test(raw.patientDob.trim())) ? raw.patientDob.trim() : null;
  c.examDate = (typeof raw.examDate === "string" && ISO_DATE.test(raw.examDate.trim())) ? raw.examDate.trim() : null;
  return c;
}
function hydrateCaseMeta(raw: Any): void {
  caseMeta = readCaseMeta(raw);
}
/** P4a Task 2: builds the compact, labelled case-context fragment
 *  (e.g. "Age 54 · current smoker (12/day) · diabetic (HbA1c 7.8%) · max
 *  RBL 45% · 3 teeth lost to perio") appended to {@link getOdontogramSummary}'s
 *  `periodontalText` whenever `!caseMetaIsEmpty(caseMeta)`. Skips any field
 *  still at its default (age null, smoking/diabetes "unknown") — never claims
 *  a case fact that wasn't actually charted. */
function caseContextSummaryFragment(c: CaseMeta): string {
  const parts: string[] = [];
  if(c.age !== null) parts.push(t("case.summary.age", { age: c.age }));
  if(c.smokingStatus === "never") parts.push(t("case.summary.smokingNever"));
  else if(c.smokingStatus === "former") parts.push(t("case.summary.smokingFormer"));
  else if(c.smokingStatus === "current"){
    parts.push(c.cigarettesPerDay !== null
      ? t("case.summary.smokingCurrentCigs", { n: c.cigarettesPerDay })
      : t("case.summary.smokingCurrent"));
  }
  if(c.diabetesStatus === "none") parts.push(t("case.summary.diabetesNone"));
  else if(c.diabetesStatus === "present"){
    parts.push(c.hba1c !== null
      ? t("case.summary.diabetesPresentHba1c", { value: c.hba1c })
      : t("case.summary.diabetesPresent"));
  }
  if(c.maxRblPercent !== null) parts.push(t("case.summary.rbl", { value: c.maxRblPercent }));
  if(c.toothLossPerio !== null){
    parts.push(t(`case.summary.toothLoss${c.toothLossPerio === 1 ? "One" : "Other"}`, { n: c.toothLossPerio }));
  }
  return parts.join(" · ");
}
// ---- Bead odontogram-2vd: examination identity and context ---------------
// The engine's SECOND case-level object (after `caseMeta`): WHICH examination
// this document is, WHO performed and recorded it, WHEN it was effective, and
// in which encounter. Chart-independent exactly like `caseMeta` — status and
// plan are two views of ONE examination (current versus proposed), never two
// examinations — and serialized once into the payload's top-level
// `examination` key (omit-when-empty), hydrated through the shared
// `hydrateImportedCharts` data path.
//
// Every field is an OPAQUE host-owned identity string. The engine stores,
// validates the shape of, and round-trips them; it never interprets them and
// never turns them into clinical codes. `effectiveDateTime` is the one shaped
// field: an ISO date (`YYYY-MM-DD`) or date-time, mirroring `examDate`'s
// existing validate-or-no-op contract.
export type ExaminationContext = {
  /** Stable identifier for this examination, unique within the host's record. */
  id: string | null;
  /** The examined subject (e.g. a `Patient/<id>` reference the host owns). */
  subject: string | null;
  /** When the examination was clinically effective: ISO date or date-time. */
  effectiveDateTime: string | null;
  /** Who carried the examination out. */
  performer: string | null;
  /** Who entered the findings, when that is not the performer. */
  recorder: string | null;
  /** The encounter/visit the examination belongs to. */
  encounter: string | null;
  /** The `id` of the examination this one follows, for longitudinal linking. */
  previousExaminationId: string | null;
};

const EXAMINATION_FIELDS = [
  "id", "subject", "effectiveDateTime", "performer", "recorder", "encounter", "previousExaminationId",
] as const;
type ExaminationField = typeof EXAMINATION_FIELDS[number];

/** ISO date (`YYYY-MM-DD`) or date-time (`YYYY-MM-DDThh:mm[:ss[.sss]][Z|±hh:mm]`). */
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

function defaultExaminationContext(): ExaminationContext {
  return { id: null, subject: null, effectiveDateTime: null, performer: null,
    recorder: null, encounter: null, previousExaminationId: null };
}

let examinationContext: ExaminationContext = defaultExaminationContext();

/** Normalize ONE incoming examination field. `null`/blank clears it, a string
 *  is trimmed, and anything the field cannot hold (a non-string, or a
 *  malformed `effectiveDateTime`) returns `undefined` — the caller's signal to
 *  leave that field untouched, mirroring `setExamDate`'s malformed-is-a-no-op
 *  contract. */
function normalizeExaminationField(field: ExaminationField, v: unknown): string | null | undefined {
  if(v === null) return null;
  if(typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if(trimmed === "") return null;
  if(field === "effectiveDateTime" && !ISO_DATE_TIME.test(trimmed)) return undefined;
  return trimmed;
}

/** The current examination's identity and context. Not part of the status/plan
 *  dual-state — one document describes one examination. */
export function getExaminationContext(): ExaminationContext { return { ...examinationContext }; }

/**
 * Patch the examination context. Only the fields present on `patch` are
 * touched; `null` (or a blank string) clears a field, a string is trimmed, and
 * a value the field cannot hold is a silent no-op — the same contract every
 * other case-level setter in this file uses. Fires {@link onStateChange} only
 * when something actually changed.
 */
export function setExaminationContext(patch: Partial<Record<ExaminationField, string | null>>): void {
  if(!patch || typeof patch !== "object") return;
  let changed = false;
  const target = examinationContext as Record<string, string | null>;
  for(const field of EXAMINATION_FIELDS){
    if(!Object.prototype.hasOwnProperty.call(patch, field)) continue;
    const next = normalizeExaminationField(field, patch[field]);
    if(next === undefined) continue;
    if(target[field] !== next){ target[field] = next; changed = true; }
  }
  if(changed) notifyStateChange();
}

/** Clear the examination context back to "no examination identity recorded". */
export function resetExaminationContext(): void { examinationContext = defaultExaminationContext(); }

function examinationContextIsEmpty(c: ExaminationContext): boolean {
  const src = c as unknown as Record<string, string | null>;
  return EXAMINATION_FIELDS.every((f) => src[f] === null);
}

function serializeExaminationContext(c: ExaminationContext): Record<string, unknown> {
  const src = c as unknown as Record<string, string | null>;
  const o: Record<string, unknown> = {};
  for(const field of EXAMINATION_FIELDS){
    if(src[field] !== null) o[field] = src[field];
  }
  return o;
}

/** Read an examination context out of a raw payload block, self-healing every
 *  malformed value to `null` (never throws). A payload with no `examination`
 *  key at all — every document written before payload 2.21 — yields the empty
 *  context, which is exactly "this document records no examination identity". */
function readExaminationContext(raw: Any): ExaminationContext {
  const c = defaultExaminationContext();
  if(!raw || typeof raw !== "object") return c;
  const target = c as unknown as Record<string, string | null>;
  for(const field of EXAMINATION_FIELDS){
    const v = normalizeExaminationField(field, raw[field]);
    if(v !== undefined) target[field] = v;
  }
  return c;
}

// ---- Bead odontogram-2vd: dated examination snapshots --------------------
// A periodontal case is re-examined over years, and comparing today's pockets
// with the baseline is the whole point of charting them. The engine therefore
// keeps an ARCHIVE of examinations: each entry is an independent, dated
// snapshot of the whole-mouth findings plus the case context and examination
// identity they were recorded under.
//
// WHAT THIS IS NOT. It is not the plan chart. Status and plan mean current
// versus proposed within ONE examination and keep that meaning exactly:
// `captureExamination()` archives the STATUS chart explicitly (never the
// active-chart alias, never the plan), a snapshot carries no `plan` section,
// and capturing neither initializes the plan chart nor touches the chart mode.
// It is also not persistence: snapshots are pure in-document data that travel
// with the payload; storing, versioning and auditing them is the host's job.
type ExaminationSnapshot = {
  examination: ExaminationContext;
  globals: Record<string, boolean>;
  teeth: Record<string, Any>;
  case: Record<string, unknown> | null;
};

let examinations: ExaminationSnapshot[] = [];
let examinationSeq = 0;

function deepCopyJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Next unused generated examination id. Never collides with an id already in
 *  the archive (including one that arrived through an import). */
function nextExaminationId(): string {
  const taken = new Set(examinations.map((s) => s.examination.id));
  let id: string;
  do { id = `examination-${++examinationSeq}`; } while(taken.has(id));
  return id;
}

function serializeSnapshot(s: ExaminationSnapshot): ExaminationSnapshotRecord {
  return {
    examination: serializeExaminationContext(s.examination),
    globals: deepCopyJson(s.globals),
    teeth: deepCopyJson(s.teeth),
    ...(s.case === null ? {} : { case: deepCopyJson(s.case) }),
  } as ExaminationSnapshotRecord;
}

/** Read the archive out of a raw payload, dropping every entry that could not
 *  be a usable examination (not an object, no identity, no teeth, or a
 *  duplicate identity) instead of throwing — the same tolerant contract every
 *  other hydration path here has. */
function readExaminationSnapshots(raw: Any): ExaminationSnapshot[] {
  if(!Array.isArray(raw)) return [];
  const out: ExaminationSnapshot[] = [];
  const seen = new Set<string>();
  for(const entry of raw){
    if(!entry || typeof entry !== "object") continue;
    const examination = readExaminationContext((entry as Any).examination);
    if(examination.id === null || seen.has(examination.id)) continue;
    const teeth = (entry as Any).teeth;
    if(!teeth || typeof teeth !== "object") continue;
    const rawCase = (entry as Any).case;
    const rawGlobals = (entry as Any).globals;
    seen.add(examination.id);
    out.push({
      examination,
      globals: rawGlobals && typeof rawGlobals === "object"
        ? deepCopyJson(rawGlobals as Record<string, boolean>) : {},
      teeth: deepCopyJson(teeth as Record<string, Any>),
      case: rawCase && typeof rawCase === "object" ? deepCopyJson(rawCase as Record<string, unknown>) : null,
    });
  }
  return out;
}

/** Drop every archived examination (blank-slate reset / test seam). */
export function resetExaminations(): void {
  examinations = [];
  examinationSeq = 0;
  repaintForBaselineChange();   // the baseline is gone: un-hatch (odontogram-ap7)
}

/**
 * Archive the CURRENT status findings as a dated examination.
 *
 * `patch` is applied to the live examination context first, so the usual call
 * is `captureExamination({ effectiveDateTime: "2026-06-30" })`. When no `id`
 * has been recorded, one is generated and adopted, so the archived examination
 * and the live context always agree on which examination this is.
 *
 * An examination is NEVER silently overwritten. Capturing again while the live
 * identity is already archived files a NEW examination — a fresh id, linked to
 * the archived one through `previousExaminationId` — so the routine "capture at
 * every visit" call cannot destroy the baseline a trend depends on. Correcting
 * an already-archived examination is possible but must be explicit: pass its
 * `id` in `patch`, and that entry is replaced in place.
 *
 * Returns the archived examination's id.
 */
export function captureExamination(patch: Partial<Record<ExaminationField, string | null>> = {}): string {
  const explicitId = typeof patch.id === "string" && patch.id.trim() !== "" ? patch.id.trim() : null;
  setExaminationContext(patch);
  const liveId = examinationContext.id;
  const alreadyArchived = liveId !== null && examinations.some((s) => s.examination.id === liveId);
  if(liveId === null || (alreadyArchived && explicitId === null)){
    setExaminationContext({
      id: nextExaminationId(),
      ...(liveId !== null ? { previousExaminationId: liveId } : {}),
    });
  }
  const snapshot: ExaminationSnapshot = {
    examination: { ...examinationContext },
    // `globals` carries `edentulous`, a WHOLE-MOUTH clinical finding rather than
    // a view flag (see `loadLiveDocument`), so an examination that is not
    // snapshotting it would archive a full dentition for an edentulous mouth.
    globals: collectGlobals() as unknown as Record<string, boolean>,
    // The STATUS chart explicitly (like every export path here) — an
    // examination records what was observed, never what is proposed.
    teeth: deepCopyJson(collectTeeth(charts.status)),
    case: caseMetaIsEmpty(caseMeta) ? null : serializeCaseMeta(caseMeta),
  };
  const at = examinations.findIndex((s) => s.examination.id === snapshot.examination.id);
  if(at >= 0) examinations[at] = snapshot;
  else examinations.push(snapshot);
  repaintForBaselineChange();
  notifyStateChange();
  return snapshot.examination.id as string;
}

/** Repaint every tooth because the BASELINE moved (bead odontogram-ap7).
 *
 *  Archiving the first examination changes what every tooth on the chart
 *  MEANS — each finding either was there at intake or was not — so the archive
 *  can no more be changed without a repaint than the chart mode can. Without
 *  this, hatching appeared only on teeth that happened to be edited afterwards,
 *  which reads as an unreliable marking rather than as a missing repaint.
 *
 *  Cheap when nothing depends on it: `applyPreExistingStyling` returns at once
 *  while no examination is archived, so a host that never captures pays for one
 *  ordinary repaint. */
function repaintForBaselineChange(): void {
  if(toothSvgRoot.size === 0) return;   // no grid mounted (host API / tests)
  for(const toothNo of ALL_TEETH) applyStateToSvg(toothNo);
}

/**
 * Begin a NEW examination: clear the examination identity, link it to the most
 * recently archived examination through `previousExaminationId`, then apply
 * `patch`. The findings are deliberately left alone — a follow-up examination
 * starts from the mouth as last charted and is corrected chairside.
 *
 * Returns the new examination's id, or `null` when the caller supplied none
 * (an id is only minted when the examination is captured).
 */
export function startExamination(patch: Partial<Record<ExaminationField, string | null>> = {}): string | null {
  const previous = examinations.length > 0
    ? examinations[examinations.length - 1].examination.id
    : examinationContext.id;
  examinationContext = defaultExaminationContext();
  if(previous !== null) examinationContext.previousExaminationId = previous;
  setExaminationContext(patch);
  notifyStateChange();
  return examinationContext.id;
}

/** Every archived examination's identity/context, oldest first. Detached
 *  copies — mutating one can never reach the archive. */
export function listExaminations(): ExaminationContext[] {
  return examinations.map((s) => ({ ...s.examination }));
}

/** One archived examination in full (identity, findings, case context) as a
 *  detached copy, or `null` when no examination has that id. */
export function getExamination(id: string): ExaminationSnapshotRecord | null {
  const found = examinations.find((s) => s.examination.id === id);
  return found ? serializeSnapshot(found) : null;
}

/** Remove one archived examination. Returns whether it existed. */
export function removeExamination(id: string): boolean {
  const at = examinations.findIndex((s) => s.examination.id === id);
  if(at < 0) return false;
  examinations.splice(at, 1);
  // Removing the EARLIEST examination promotes the next one to baseline, so
  // what counts as pre-existing changes (odontogram-ap7).
  repaintForBaselineChange();
  notifyStateChange();
  return true;
}

/**
 * Load an archived examination back into the STATUS chart for review, through
 * the SAME hydration path an import uses. The archive itself is untouched —
 * the loaded examination stays in it, so reviewing a baseline can never
 * consume it. Like an import this replaces the whole case, so the plan chart
 * (a proposal about the CURRENT findings) is dropped rather than silently
 * re-attached to older findings.
 *
 * Returns whether an examination with that id existed.
 */
export function loadExamination(id: string): boolean {
  const found = examinations.find((s) => s.examination.id === id);
  if(!found) return false;
  const archive = examinations;
  loadLiveDocument({
    version: PAYLOAD_VERSION,
    globals: deepCopyJson(found.globals),
    teeth: deepCopyJson(found.teeth),
    ...(found.case === null ? {} : { case: deepCopyJson(found.case) }),
    examination: serializeExaminationContext(found.examination),
  } as OdontogramDocument);
  examinations = archive;
  notifyStateChange();
  return true;
}

// ---- Bead odontogram-ap7: correcting the initial examination ----
//
// A finding mis-charted at intake and put right later would otherwise derive
// as "found under our care", which is the opposite of the truth. Dirk chose to
// solve it by making the initial examination itself correctable rather than by
// adding a per-tooth override: an examination is an examination, and there
// should be one account of what the patient arrived with — not a second note
// beside it that can contradict the first.
//
// The whole round trip lives here rather than in the UI because it has an
// invariant the caller must not be able to get wrong: `loadExamination`
// replaces the live case, so entering a correction without stashing today's
// findings would DESTROY them. Stash, load, correct, re-archive, restore.

let baselineCorrectionStash: OdontogramDocument | null = null;
let baselineCorrectionId: string | null = null;

/** Whether a baseline correction is in progress — the chart currently shows
 *  the initial examination, not today's findings. */
export function isCorrectingBaseline(): boolean { return baselineCorrectionId !== null; }

/**
 * Enter baseline-correction mode: stash today's findings and load the initial
 * examination into the chart so it can be edited.
 *
 * Returns `false` when there is no baseline to correct, or when a correction
 * is already running (entering twice would overwrite the stash with the
 * baseline itself — the one way to lose today's findings).
 *
 * The stash is runtime-only and deliberately not serialized: a correction is a
 * moment at the chair, not a document state. A host that reloads mid-correction
 * gets the baseline as its chart, so the UI must make the mode unmissable.
 */
export function beginBaselineCorrection(): boolean {
  if(baselineCorrectionId !== null) return false;
  const baseline = getBaselineExamination();
  if(!baseline || baseline.id === null) return false;
  baselineCorrectionStash = collectExportPayload() as OdontogramDocument;
  baselineCorrectionId = baseline.id;
  loadExamination(baseline.id);
  return true;
}

/** Restore today's findings, leaving the archive exactly as it was. Returns
 *  whether a correction was in progress. */
export function cancelBaselineCorrection(): boolean {
  if(baselineCorrectionId === null || !baselineCorrectionStash) return false;
  const archive = examinations;
  loadLiveDocument(baselineCorrectionStash);
  examinations = archive;
  baselineCorrectionStash = null;
  baselineCorrectionId = null;
  repaintForBaselineChange();
  notifyStateChange();
  return true;
}

/**
 * Re-archive the corrected chart AS the initial examination — passing its own
 * id, which `captureExamination` replaces in place rather than filing a new
 * one — then restore today's findings.
 *
 * The examination keeps its identity and its date: this is a correction of the
 * record, not a second examination on a later day.
 */
export function commitBaselineCorrection(): boolean {
  if(baselineCorrectionId === null || !baselineCorrectionStash) return false;
  captureExamination({ id: baselineCorrectionId });
  return cancelBaselineCorrection();
}

// Plan chart is lazily deep-cloned from status the FIRST time plan mode is
// entered; subsequent entries reuse whatever is already in charts.plan (so
// plan edits are never silently overwritten by re-cloning from status).
let planInitialized = false;

function readLiveChartMode(): ChartMode { return chartMode; }

/** Current active chart mode ("status" | "plan"). */
export function getChartMode(): ChartMode {
  return getActiveOdontogramSession().getChartMode();
}

/** Deep-copy every tooth from `src` into `dst` via the proven
 *  serializeState/hydrateState round-trip, so the two charts never share
 *  Sets/Maps/objects (mutating one tooth's state can never leak into the
 *  other chart's copy). */
function cloneChart(src: Map<Any, Any>, dst: Map<Any, Any>): void {
  dst.clear();
  for(const [n, s] of src) dst.set(n, hydrateState(serializeState(s)));
}

// ---- DS-1 Task 1: status->plan edit gate + propagation --------------------
// The set of teeth that have been EXPLICITLY edited while `chartMode === "plan"`.
// Runtime-only — NEVER serialized (parity: SVG/FHIR/roundtrip goldens are
// unaffected). It records which plan teeth the user has intentionally diverged
// from status, so a later STATUS edit on such a tooth is allowed to diverge
// (rather than silently overwriting the plan by mirroring). A tooth NOT in this
// set still has its plan tracking status, so a status edit safely mirrors into
// plan (keeping the two charts in sync until the user deliberately plans that
// tooth). Cleared whenever the plan is (re)initialized, reset, or replaced by
// an import — a fresh plan carries no plan-edits.
let planEditedTeeth = new Set<number>();

// ---- Planalternativen (Phase 1, 16.09.2026) --------------------------------
// From ONE plan to N NAMED alternatives against the same Befund (status):
// "Bruecke" beside "Implantat" beside "Prothese". `charts.plan` and
// `planEditedTeeth` stay ALIASES to the ACTIVE alternative - exactly the way
// `toothState` aliases the active chart - so every existing "the plan" call
// site (gate, mirror, undo snapshot, export of the active plan) keeps operating
// unchanged; only WHICH alternative that is changes when the user switches.
//
// The odontogram never classifies an alternative as Regelversorgung /
// gleichartig / andersartig: that is the job of a downstream planning service, downstream of the
// FHIR store (Dirk, 16.09.2026). Here an alternative is a free name and a chart.
export interface PlanAlternative { id: string; name: string }
interface PlanAlternativeEntry { id: string; name: string; chart: Map<Any, Any>; editedTeeth: Set<number> }
/** Insertion order is display order. */
const planAlternatives: Map<string, PlanAlternativeEntry> = new Map();
let activePlanId: string | null = null;
let planIdSeq = 0;

function newPlanId(): string {
  let id: string;
  do { id = `plan-${++planIdSeq}`; } while(planAlternatives.has(id));
  return id;
}

/** "Plan 1", "Plan 2", ... - the name an alternative gets when none is given. */
function defaultPlanName(): string { return `Plan ${planAlternatives.size + 1}`; }

/** Point the plan aliases at `entry`; in plan mode the active-chart alias follows. */
function activatePlanEntry(entry: PlanAlternativeEntry): void {
  activePlanId = entry.id;
  charts.plan = entry.chart;
  planEditedTeeth = entry.editedTeeth;
  planInitialized = true;
  if(chartMode === "plan") toothState = charts.plan;
}

/** Drop EVERY alternative: the aliases point at fresh empties and the plan is
 *  uninitialized again - the one rule for every reset/teardown/import path. */
function clearPlanAlternatives(): void {
  planAlternatives.clear();
  activePlanId = null;
  charts.plan = new Map();
  planEditedTeeth = new Set<number>();
  planInitialized = false;
  // The active-chart alias must never dangle on a map that was just replaced.
  if(chartMode === "plan") toothState = charts.plan;
}

/** A fresh alternative starts as a deep copy of the CURRENT status (a plan
 *  begins as the Befund, like the very first plan always did) and becomes
 *  active. `name` empty -> "Plan n". */
function createPlanEntry(name?: string): PlanAlternativeEntry {
  const entry: PlanAlternativeEntry = {
    id: newPlanId(),
    name: (name ?? "").trim() || defaultPlanName(),
    chart: new Map(),
    editedTeeth: new Set<number>(),
  };
  cloneChart(charts.status, entry.chart);
  planAlternatives.set(entry.id, entry);
  activatePlanEntry(entry);
  return entry;
}

/** Build the alternatives an imported document carries. `plans` (an array of
 *  `{id, name, teeth}`, active one named by `activePlanId`) wins; a legacy
 *  single `plan` (payload 2.11 .. the last single-plan version) becomes one
 *  alternative "Plan 1". Assumes `clearPlanAlternatives()` ran first. Ids are
 *  kept where they are usable, so a re-import keeps referring to the same
 *  alternative; `planIdSeq` is advanced past any imported `plan-N` so a later
 *  `newPlanId()` cannot collide. */
function hydratePlanAlternatives(data: Any, inferLegacySecondaryCaries: boolean): void {
  const plans = Array.isArray(data?.plans) ? data.plans : null;
  if(plans && plans.length > 0){
    let activate: PlanAlternativeEntry | null = null;
    for(const p of plans){
      if(!p || typeof p !== "object") continue;
      const wantedId = typeof p.id === "string" ? p.id.trim() : "";
      const id = wantedId && !planAlternatives.has(wantedId) ? wantedId : newPlanId();
      const m = /^plan-(\d+)$/.exec(id);
      if(m) planIdSeq = Math.max(planIdSeq, Number(m[1]));
      const entry: PlanAlternativeEntry = {
        id,
        name: (typeof p.name === "string" && p.name.trim()) || defaultPlanName(),
        chart: new Map(),
        editedTeeth: new Set<number>(),
      };
      const teeth = p.teeth && typeof p.teeth === "object" ? p.teeth : {};
      for(const toothNo of ALL_TEETH){
        entry.chart.set(toothNo, hydrateState(teeth[toothNo], inferLegacySecondaryCaries));
      }
      planAlternatives.set(entry.id, entry);
      if(!activate || entry.id === data.activePlanId) activate = entry;
    }
    if(activate) activatePlanEntry(activate);
    return;
  }
  if(data?.plan && typeof data.plan === "object"){
    const entry: PlanAlternativeEntry = {
      id: newPlanId(), name: defaultPlanName(), chart: new Map(), editedTeeth: new Set<number>(),
    };
    for(const toothNo of ALL_TEETH){
      entry.chart.set(toothNo, hydrateState(data.plan[toothNo], inferLegacySecondaryCaries));
    }
    planAlternatives.set(entry.id, entry);
    activatePlanEntry(entry);
  }
}

/** Repaint every tooth from the ACTIVE chart - the same full-repaint loop
 *  `importStatus()` and `applyLiveChartMode()` use, so no new render path. */
function repaintActiveChart(): void {
  for(const toothNo of ALL_TEETH){
    applyStateToSvg(toothNo);
    updateToothTileNumber(toothNo);
    updateToothLabelNoteIcon(toothNo);
  }
  refreshToothSelectOptions();
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}

/** The alternatives in display order. */
export function listPlans(): PlanAlternative[] {
  return Array.from(planAlternatives.values()).map((e) => ({ id: e.id, name: e.name }));
}

/** The active alternative's id, or `null` while no plan exists. */
export function getActivePlanId(): string | null { return activePlanId; }

/** Create a new alternative (a copy of the status) and make it active. In plan
 *  mode the chart repaints to it at once. */
export function createPlan(name?: string): PlanAlternative {
  const entry = createPlanEntry(name);
  resetShorthandInput();
  pendingDualStateConfirm = null;
  if(chartMode === "plan") repaintActiveChart();
  notifyStateChange();
  return { id: entry.id, name: entry.name };
}

/** Rename an alternative. An empty name is refused (`false`). */
export function renamePlan(id: string, name: string): boolean {
  const entry = planAlternatives.get(id);
  const next = (name ?? "").trim();
  if(!entry || !next) return false;
  if(entry.name === next) return true;
  entry.name = next;
  notifyStateChange();
  return true;
}

/** Make another alternative the active one. Unknown id -> `false`. */
export function setActivePlan(id: string): boolean {
  const entry = planAlternatives.get(id);
  if(!entry) return false;
  if(entry.id === activePlanId) return true;
  activatePlanEntry(entry);
  // The typing mode and a deferred confirm both belong to the alternative they
  // were taken on; carrying either across a switch would apply it elsewhere.
  resetShorthandInput();
  pendingDualStateConfirm = null;
  if(chartMode === "plan") repaintActiveChart();
  notifyStateChange();
  return true;
}

/** Delete an alternative. Deleting the active one activates the next in order;
 *  deleting the last one leaves no plan (and, in plan mode, returns to status). */
export function deletePlan(id: string): boolean {
  const entry = planAlternatives.get(id);
  if(!entry) return false;
  planAlternatives.delete(id);
  if(activePlanId === id){
    const next = planAlternatives.values().next().value as PlanAlternativeEntry | undefined;
    if(next){
      activatePlanEntry(next);
    }else{
      clearPlanAlternatives();
      if(chartMode === "plan"){ chartMode = "status"; toothState = charts.status; syncChartModeUi(); }
    }
    resetShorthandInput();
    pendingDualStateConfirm = null;
    repaintActiveChart();
  }
  notifyStateChange();
  return true;
}

/** Deep-copy tooth `toothNo`'s STATUS state into the PLAN chart via the proven
 *  serializeState -> hydrateState round-trip (fresh Maps/Sets, no shared refs —
 *  same guarantee as {@link cloneChart}). Passes `false` for
 *  `inferLegacySecondaryCaries`: the source is a live, fully-hydrated in-memory
 *  state whose recurrent-caries severities are already explicit, so no legacy
 *  inference is wanted. A status tooth with no entry mirrors a `defaultState()`
 *  into the plan (so the plan tooth exists and matches "sound"). */
function mirrorStatusToPlan(toothNo: number): void {
  charts.plan.set(toothNo, hydrateState(serializeState(charts.status.get(toothNo) ?? defaultState()), false));
}

/** DS-1 central edit GATE for a SINGLE interactive per-tooth edit. Every
 *  interactive per-tooth mutator routes its mutation through here so the
 *  status<->plan propagation policy lives in exactly one place. See the
 *  `planEditedTeeth` comment above for the policy. When the plan is
 *  uninitialized this is a pure passthrough (byte-identical to the
 *  pre-dual-state behavior). `applyFn` performs the actual mutation (+ any
 *  render) on the ACTIVE chart. */
function gateToothEdit(toothNo: number, applyFn: () => boolean | void): void {
  // `applyFn` may report `false` to signal it made NO change (a rejected /
  // no-op edit — e.g. an out-of-range perio value): in that case the tooth is
  // neither marked plan-edited nor mirrored. Any other return (incl. void) is
  // treated as a real edit.
  if(chartMode === "plan"){
    if(applyFn() !== false) planEditedTeeth.add(toothNo);
    return;
  }
  // chartMode === "status"
  if(!planInitialized || !planEditedTeeth.has(toothNo)){
    const changed = applyFn() !== false;
    if(planInitialized && changed) mirrorStatusToPlan(toothNo);
    return;
  }
  // status edit on a plan-edited tooth -> the status edit would DIVERGE from the
  // plan (the user has deliberately planned this tooth). T2: confirm BEFORE
  // applying. `applyFn` is deferred — accept applies it (status only; the plan
  // stays as planned, so they diverge and the diff shows it), cancel re-syncs
  // the active tooth's controls so the just-changed control snaps back.
  requestDualStateConfirm(
    () => { applyFn(); },
    revertActiveControls,
  );
}

/** DS-1 central edit GATE for a BATCH interactive edit spanning several teeth
 *  (e.g. `applyToSelected`). `applyFn` mutates ALL `toothNos` in one pass. In
 *  plan mode every touched tooth is marked plan-edited; in status mode (plan
 *  initialized) every tooth NOT already plan-edited mirrors status->plan after
 *  the batch (planned teeth diverge). Uninitialized plan -> pure passthrough.
 *  T2: a batch touching >=1 plan-edited tooth is CONFIRMED ONCE before applying
 *  (accept applies all + mirrors the un-planned teeth; cancel applies none +
 *  re-syncs the active tooth's controls). */
function gateToothEditBatch(toothNos: number[], applyFn: () => void): void {
  if(chartMode === "plan"){
    applyFn();
    for(const toothNo of toothNos) planEditedTeeth.add(toothNo);
    return;
  }
  // chartMode === "status"
  if(!planInitialized){
    applyFn();
    return;
  }
  const mirrorUnplanned = () => {
    for(const toothNo of toothNos){
      if(!planEditedTeeth.has(toothNo)) mirrorStatusToPlan(toothNo);
    }
  };
  // A batch touching >=1 plan-edited tooth would DIVERGE the plan -> confirm
  // ONCE before applying. Otherwise apply immediately and mirror the un-planned
  // teeth (T1 behavior — planned teeth diverge, un-planned mirror).
  if(toothNos.some(toothNo => planEditedTeeth.has(toothNo))){
    requestDualStateConfirm(
      () => { applyFn(); mirrorUnplanned(); },
      revertActiveControls,
    );
    return;
  }
  applyFn();
  mirrorUnplanned();
}

// ---- DS-1 Task 2: blocking confirm before a status edit on a plan-edited
// tooth ---------------------------------------------------------------------
// A status-mode edit on a tooth the user has deliberately planned (a member of
// `planEditedTeeth`) must be CONFIRMED before it applies, because it makes the
// status chart DIVERGE from the plan. The actual mutation (`apply`) and the
// control-revert (`revert`) are DEFERRED: the gate stores them here and
// notifies, the host surfaces a modal (driven by `isDualStateConfirmPending()`),
// and the user's choice runs exactly one of them. Runtime-only — never
// serialized (SVG/FHIR/roundtrip goldens are unaffected).
let pendingDualStateConfirm: { apply: () => void; revert: () => void } | null = null;

/** Whether a status-vs-plan divergence confirm is awaiting the user's choice. */
export function isDualStateConfirmPending(): boolean {
  return pendingDualStateConfirm !== null;
}

/** Store a deferred confirm (apply/revert) and notify so the host opens the
 *  modal. A second request while one is already pending is ignored — the modal
 *  is blocking so this cannot happen from the UI; the guard is defensive. */
function requestDualStateConfirm(apply: () => void, revert: () => void): void {
  if(pendingDualStateConfirm) return;
  pendingDualStateConfirm = { apply, revert };
  notifyStateChange();
}

/** User accepted the divergence: run the deferred edit (status only — the plan
 *  stays as planned), then notify (post-edit refresh + close the modal). No-op
 *  when nothing is pending. */
export function acceptDualStateConfirm(): void {
  const pending = pendingDualStateConfirm;
  pendingDualStateConfirm = null;
  if(pending) pending.apply();
  notifyStateChange();
}

/** User cancelled: do NOT apply the edit; re-sync the active tooth's controls
 *  from stored state so the control the user just changed snaps back (no stale
 *  UI), then notify (refresh + close the modal). No-op when nothing is pending. */
export function cancelDualStateConfirm(): void {
  const pending = pendingDualStateConfirm;
  pendingDualStateConfirm = null;
  if(pending) pending.revert();
  notifyStateChange();
}

/** Re-sync the active tooth's DOM controls from its stored state (the revert
 *  used on cancel). Null-safe: with no active tooth (headless module tests) it
 *  is a no-op; in the live app the full control DOM always exists. */
function revertActiveControls(): void {
  if(activeTooth != null) syncControlsFromState(toothState.get(activeTooth));
}

/** R2-A Task 3: sync the `Status | Plan` toggle in the chart-header with the
 *  current `chartMode` — `.is-active` on whichever of #chartModeStatus /
 *  #chartModePlan matches and `.plan-mode` on the chart card (`.chart`, the
 *  visual border/tint cue). The separate "TERV/PLAN" badge that once sat
 *  beside the toggle is gone (4.1.0): the highlighted Plan button and the
 *  plan-alternative chips already say it, and Dirk read the third "PLAN" as
 *  a duplicate. Every lookup is null-safe: `setChartMode()` (and therefore
 *  this function) is exercised by module-state tests (e.g.
 *  r2a-dual-state.test.ts) with no DOM mounted at all, so a missing
 *  toggle/card must be a silent no-op, not a throw. Not part of the public
 *  API. */
function syncChartModeUi(): void {
  const isPlan = chartMode === "plan";
  const statusBtn = $("#chartModeStatus") as HTMLElement | null;
  const planBtn = $("#chartModePlan") as HTMLElement | null;
  const chartCard = $(".chart") as HTMLElement | null;
  if(statusBtn){
    statusBtn.classList.toggle("is-active", !isPlan);
    statusBtn.setAttribute("aria-selected", String(!isPlan));
  }
  if(planBtn){
    planBtn.classList.toggle("is-active", isPlan);
    planBtn.setAttribute("aria-selected", String(isPlan));
  }
  if(chartCard) chartCard.classList.toggle("plan-mode", isPlan);
}

/**
 * Switch the active chart between "status" (current findings) and "plan"
 * (proposed treatment). The first time "plan" is entered, it is deep-cloned
 * from "status" (see {@link cloneChart}); later switches reuse the existing
 * plan chart untouched. Re-renders every tooth from the newly active chart
 * via the SAME full-repaint mechanism `importStatus()` uses, so no new
 * render path is introduced and SVG output stays byte-identical to the
 * single-chart render (parity is unaffected — only WHICH chart is active
 * changes, never how a chart renders).
 *
 * @param mode - "status" or "plan"; any other value is ignored.
 */
function applyLiveChartMode(mode: ChartMode): void {
  if(mode !== "status" && mode !== "plan") return;
  if(mode === chartMode) return;
  if(mode === "plan" && !planInitialized){
    // Planalternativen: the first entry into plan mode creates the first
    // alternative ("Plan 1") as a deep copy of status and makes it active -
    // the lazy clone the single plan always was, now as one alternative among
    // possibly several. A fresh copy carries no plan-edits by construction.
    createPlanEntry();
    resetShorthandInput();
  }
  chartMode = mode;
  toothState = charts[mode];
  // Full repaint-all (the same loop importStatus() uses), plus the 2.2.1
  // mode-dependent tooth-base picker rebuild (Plan omits milk/subgingival).
  repaintActiveChart();
  notifyStateChange();
  syncChartModeUi();
}

export function setChartMode(mode: ChartMode): void {
  getActiveOdontogramSession().setChartMode(mode);
}

const toothSvgRoot = new Map(); // toothNo -> [svg elements]
const toothTile = new Map(); // toothNo -> [tile elements]
// Original DOM position of each SVG's "inflammation" group, so it can be
// restored after being temporarily lifted above the tooth (see z-order fix
// in applyStateToSvgSingle). Keyed by the group node itself.
const inflammationHome: Any = new WeakMap();
const toothLabelUpper = new Map(); // toothNo -> label element
const toothLabelLower = new Map(); // toothNo -> label element
let activeTooth = null;
let selectedTeeth = new Set();
let edentulous = false;
let wisdomVisible = true;
let showBase = true;
let occlusalVisible = true;
let showHealthyPulp = true;
let suppressEdentulousSync = false;
let numberingSystem: NumberingSystem = "FDI";
let readOnly = false;
let notesEnabled = false;
let icdasEnabled = false;
export function setIcdasEnabled(value: boolean){ icdasEnabled = !!value; if(activeTooth) syncControlsFromState(toothState.get(activeTooth)); }
export function getIcdasEnabled(): boolean { return icdasEnabled; }
// SP4 Task 5: pulp-detail level drives how the pulp control presents the pulp
// diagnosis — "simple" (healthy/pulpitis), "aae" (4 AAE pulpDx values, default)
// or "latin" (9 practical-Latin pulpLatin subtypes). Changing it re-syncs the
// active tooth's controls (the stored value is re-displayed collapsed to the
// new level; state is not mutated). Mirrors the `icdasEnabled` accessor pattern.
let pulpDetailLevel: PulpDetailLevel = "aae";
export function setPulpDetailLevel(value: PulpDetailLevel){
  pulpDetailLevel = (value === "simple" || value === "latin") ? value : "aae";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
  // SP17 Task 1 Fix #1: pulpDiagnosisLabel() reads getPulpDetailLevel() live to
  // pick Latin vs AAE wording — the whole-mouth summary panel and every
  // per-tooth tooltip must refresh too, not just the active tooth's picker.
  // Mirrors setSurfaceNotation() below exactly (same bug class, SP16 fix).
  notifyStateChange();
  for(const toothNo of ALL_TEETH){
    updateToothTooltip(toothNo);
  }
}
export function getPulpDetailLevel(): PulpDetailLevel { return pulpDetailLevel; }

// SP13 Task 2: wear/discoloration detail-level settings — each switches its
// control between the full-option <select> ("complex", default) and a
// yes/no checkbox ("simple"). wearDetailLevel drives BOTH wearEdge and
// wearCervical (one shared setting); discolorationDetailLevel is independent.
// Mirrors the pulpDetailLevel accessor pattern above: sanitize to the literal
// set, re-sync the active tooth's controls, never mutate stored state.
export type ToothDetailLevel = "simple" | "complex";
let wearDetailLevel: ToothDetailLevel = "complex";
export function setWearDetailLevel(value: ToothDetailLevel){
  wearDetailLevel = value === "simple" ? "simple" : "complex";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}
export function getWearDetailLevel(): ToothDetailLevel { return wearDetailLevel; }
let discolorationDetailLevel: ToothDetailLevel = "complex";
export function setDiscolorationDetailLevel(value: ToothDetailLevel){
  discolorationDetailLevel = value === "simple" ? "simple" : "complex";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}
export function getDiscolorationDetailLevel(): ToothDetailLevel { return discolorationDetailLevel; }

// SP16 Task 2: surface-notation setting — "full" (default) makes the
// caries/filling surface letters + captions POSITION-AWARE (incisal on an
// anterior tooth, labial on an anterior buccal surface, palatal on an upper
// lingual surface); "simple" always shows the tooth-independent B/O/L set.
// Mirrors the wearDetailLevel/discolorationDetailLevel accessor pattern
// above: sanitize to the literal set, re-sync the active tooth's controls,
// never mutate stored state.
export type SurfaceNotation = "simple" | "full";
let surfaceNotation: SurfaceNotation = "full";
export function setSurfaceNotation(value: SurfaceNotation){
  surfaceNotation = value === "simple" ? "simple" : "full";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
  // The new notation changes the caries/filling-defect LETTERS shown in the
  // whole-mouth summary panel and every per-tooth tooltip (both resolve
  // through surfaceLetter()/summarySurfaceLetter(), which read the module-
  // level `surfaceNotation`) — refresh both so they don't show stale letters
  // until the next tooth edit. notifyStateChange() fires the onStateChange
  // listeners the App uses to re-run getOdontogramSummary(); the per-tooth
  // loop mirrors the registerPlugins() pattern above.
  notifyStateChange();
  for(const toothNo of ALL_TEETH){
    updateToothTooltip(toothNo);
  }
}
export function getSurfaceNotation(): SurfaceNotation { return surfaceNotation; }

// SP5 Task 5: caries-granularity settings (modes). Each mode governs ONLY the
// option list its authoring control offers; it never mutates stored state.
// Non-collapsing: a stored value outside the current mode's list is preserved
// and re-displayed when the mode widens again (the SP4 pulpLatin pattern).
// `cariesDepthEnabled` additionally gates the visual caries-depth tier
// (opacity + deep contour) in the SVG render; `radiographicDepthMode !== "off"`
// gates the per-surface `data-radio` indicator badge. Each accessor re-syncs
// the active tooth's controls, mirroring `icdasEnabled`/`pulpDetailLevel`.
export type SecondaryCariesMode = "simple" | "standard" | "full";
export type RootCariesMode = "simple" | "severity";
export type RadiographicDepthMode = "off" | "threeLevel" | "detailed";

let secondaryCariesMode: SecondaryCariesMode = "standard";
export function setSecondaryCariesMode(value: SecondaryCariesMode){
  secondaryCariesMode = (value === "simple" || value === "full") ? value : "standard";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}
export function getSecondaryCariesMode(): SecondaryCariesMode { return secondaryCariesMode; }

let rootCariesMode: RootCariesMode = "simple";
export function setRootCariesMode(value: RootCariesMode){
  rootCariesMode = (value === "severity") ? value : "simple";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}
export function getRootCariesMode(): RootCariesMode { return rootCariesMode; }

let radiographicDepthMode: RadiographicDepthMode = "off";
export function setRadiographicDepthMode(value: RadiographicDepthMode){
  radiographicDepthMode = (value === "threeLevel" || value === "detailed") ? value : "off";
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}
export function getRadiographicDepthMode(): RadiographicDepthMode { return radiographicDepthMode; }

let cariesDepthEnabled = true;
export function setCariesDepthEnabled(value: boolean){
  cariesDepthEnabled = value !== false;
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
}
export function getCariesDepthEnabled(): boolean { return cariesDepthEnabled; }

let i18nUnsubscribe: (() => void) | null = null;

// ---- State-change subscription ----
// Listeners are notified after any change to tooth state (edits, edentulous
// toggle, import), so consumers like the "tooth information" panel can refresh.
// They are ALSO notified when an app-level session flag changes what a mounted
// view must show or allow — the detail levels, the surface notation, the perio
// view/row/index-name preferences, the perio overlay layer, and readOnly. None
// of those change the document; they change how it is presented or whether it
// is editable, and the views re-derive from the flag rather than caching it.
const stateChangeListeners = new Set<() => void>();

/**
 * Subscribe to odontogram state changes. The callback runs after any tooth
 * state edit, the edentulous toggle, or an import, and after an app-level
 * session flag that a mounted view has to re-derive from — the pulp/tooth
 * detail levels, the surface notation, the periodontal view mode, row
 * visibility, index-name mode and overlay layer, and read-only mode. A flag
 * change leaves the document itself untouched.
 *
 * @param cb - Callback invoked on each change.
 * @returns An unsubscribe function.
 */
export function onStateChange(cb: () => void): () => void {
  stateChangeListeners.add(cb);
  return () => { stateChangeListeners.delete(cb); };
}

function notifyStateChange(){
  for(const cb of stateChangeListeners){
    try{ cb(); }
    catch(e){ console.error("odontogram state-change listener failed", e); }
  }
  // Bead odontogram-3l1: the live edit belongs to exactly one case, so only the
  // session that owns the engine right now hears about it. A detached session
  // is notified by its own setDocument() instead.
  notifyActiveSession();
  // Redraw the multi-tooth bridge overlay after per-tooth renders settle.
  // notifyStateChange() is synchronous and is always invoked at the END of a
  // mutation batch (single edit :~1570, edentulous :~2298, import :~2850, init
  // :~3753), so tile geometry is current by this point. renderBridgeOverlay is
  // internally guarded, but wrap defensively so a geometry hiccup can never
  // break state notification.
  try{ updateBridgeOverlay(); }
  catch(e){ console.error("odontogram bridge overlay render failed", e); }
  // Bead odontogram-iqj: der Gebissvorschlag haengt am Geburtsdatum, und das
  // wird in der Parodontal-Seitenleiste gesetzt - also nicht auf dem Weg, den
  // `syncControlsFromState` nimmt. Hier ist die eine Stelle, durch die JEDE
  // Aenderung laeuft. Kostet eine Textzeile.
  try{ syncDentitionSuggestion(); }
  catch(e){ console.error("odontogram dentition suggestion failed", e); }
}

/** Bead odontogram-iqj: den Vorschlag anzeigen oder verbergen.
 *
 *  Er erscheint NUR, wo er etwas zu sagen hat: ein Alter muss bekannt sein, und
 *  `permanent` schlaegt nichts vor - das bleibende Gebiss ist der
 *  Ausgangszustand, und ein Knopf, der den ganzen Mund zuruecksetzt, waere dort
 *  keine Uebernahme, sondern ein Verlust. */
function syncDentitionSuggestion(): void {
  const zeile = $("#dentitionSuggestion");
  if(!zeile) return;
  const v = getDentitionSuggestion();
  const zeigen = !!v && v.kind !== "permanent";
  zeile.classList.toggle("hidden", !zeigen);
  if(!zeigen || !v) return;
  const text = $("#dentitionSuggestionText");
  const knopf = $("#btnApplyDentitionSuggestion");
  if(text) text.textContent = t("dentition.suggestion", {
    age: String(v.age), kind: t(`dentition.kind.${v.kind}`),
  });
  if(knopf) knopf.textContent = t("dentition.apply");
}

/** Read a tooth's state as the minimal shape the bridge overlay consumes. */
function bridgeStateFor(toothNo: number): BridgeToothState | undefined {
  return toothState.get(toothNo) as BridgeToothState | undefined;
}

/** (Re)draw the engine-owned multi-tooth bridge overlay over `#toothGrid`. */
function updateBridgeOverlay(){
  const grid = $("#toothGrid") as HTMLElement | null;
  // Die Baender ZUERST: sie liegen hinter allem, die beiden anderen Auflagen
  // darueber. Alle drei lesen dieselbe Kachelgeometrie.
  renderGumOverlay(grid);
  renderBridgeOverlay({ grid, getState: bridgeStateFor, materialColor: bridgeMaterialColor });
  updateRetentionBarOverlay(grid);
  updateSplintOverlay(grid);
  updateOcclusalSplintOverlay(grid);
  updateOrthoOverlay(grid);
}

/** Schiene (occlusal splint): a translucent guard band over the occlusal/incisal
 *  edge of each run of teeth under the appliance. The occlusal edge faces the
 *  arch midline — tile BOTTOM for the upper arch, TOP for the lower. */
function updateOcclusalSplintOverlay(grid: HTMLElement | null){
  if(!grid) return;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let overlay = grid.querySelector(":scope > svg.occlusal-splint-overlay") as SVGSVGElement | null;
  const spans = detectOcclusalSplintSpans((tn) => toothState.get(tn));
  if(spans.length === 0){
    if(overlay){ while(overlay.firstChild) overlay.removeChild(overlay.firstChild); }
    return;
  }
  const gridRect = grid.getBoundingClientRect();
  const rectFor = (tn: number) => tileRectFor(grid, gridRect, tn);
  if(!overlay){
    overlay = document.createElementNS(SVG_NS, "svg");
    overlay.setAttribute("class", "occlusal-splint-overlay");
    overlay.setAttribute("aria-hidden", "true");
    grid.appendChild(overlay);
  }
  while(overlay.firstChild) overlay.removeChild(overlay.firstChild);
  // viewBox only, never width/height attributes — the same rule
  // `renderGumOverlay`/`renderBridgeOverlay` follow. Pinning the SVG's size to
  // the SCREEN-space gridRect nailed it to the grid's layout box only where the
  // chart is NOT scaled; under the fit-to-window scale (clientWidth 1671 vs
  // bounding-rect 1370) the overlay covered ~82% of the grid and every bar
  // shifted up-and-left onto the wrong teeth. CSS (inset:0) stretches the SVG to
  // the layout box; the viewBox (screen space, same space tileRectFor reads the
  // bars in) then maps back 1:1. removeAttribute clears any stale sizing.
  overlay.removeAttribute("width");
  overlay.removeAttribute("height");
  overlay.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
  for(const span of spans){
    const rects = span.map(rectFor).filter((r): r is NonNullable<typeof r> => !!r);
    if(rects.length < 1) continue;
    const upper = span[0] < 30;
    const left = Math.min(...rects.map(r => r.x));
    const right = Math.max(...rects.map(r => r.x + r.width));
    const rTop = Math.min(...rects.map(r => r.y));
    const rH = rects[0].height;
    const bandH = rH * 0.14;
    const yMid = rTop + rH * (upper ? 0.86 : 0.14);
    const bar = document.createElementNS(SVG_NS, "rect");
    bar.setAttribute("class", "occlusal-splint-overlay-band");
    bar.setAttribute("x", String(left + 3));
    bar.setAttribute("y", String(yMid - bandH / 2));
    bar.setAttribute("width", String(Math.max(1, right - left - 6)));
    bar.setAttribute("height", String(bandH));
    bar.setAttribute("rx", String(bandH / 2));
    overlay.appendChild(bar);
  }
}

/** Verblockung: a rigid grey bar across each run of adjacent splinted teeth,
 *  drawn in its own overlay with the SAME tile geometry the bridge/retention
 *  overlays read (`tileRectFor`). Sits near the occlusal third (splints are
 *  bonded coronally), clear of the gingival retention bar. */
function updateSplintOverlay(grid: HTMLElement | null){
  if(!grid) return;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let overlay = grid.querySelector(":scope > svg.splint-overlay") as SVGSVGElement | null;
  const spans = detectSplintSpans((tn) => toothState.get(tn));
  if(spans.length === 0){
    if(overlay){ while(overlay.firstChild) overlay.removeChild(overlay.firstChild); }
    return;
  }
  const gridRect = grid.getBoundingClientRect();
  const rectFor = (tn: number) => tileRectFor(grid, gridRect, tn);
  if(!overlay){
    overlay = document.createElementNS(SVG_NS, "svg");
    overlay.setAttribute("class", "splint-overlay");
    overlay.setAttribute("aria-hidden", "true");
    grid.appendChild(overlay);
  }
  while(overlay.firstChild) overlay.removeChild(overlay.firstChild);
  // viewBox only, never width/height attributes — the same rule
  // `renderGumOverlay`/`renderBridgeOverlay` follow. Pinning the SVG's size to
  // the SCREEN-space gridRect nailed it to the grid's layout box only where the
  // chart is NOT scaled; under the fit-to-window scale (clientWidth 1671 vs
  // bounding-rect 1370) the overlay covered ~82% of the grid and every bar
  // shifted up-and-left onto the wrong teeth. CSS (inset:0) stretches the SVG to
  // the layout box; the viewBox (screen space, same space tileRectFor reads the
  // bars in) then maps back 1:1. removeAttribute clears any stale sizing.
  overlay.removeAttribute("width");
  overlay.removeAttribute("height");
  overlay.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
  for(const span of spans){
    // tileRectFor returns GridRelativeRect {x,y,width,height} — already
    // grid-relative, so no further gridRect subtraction.
    const rects = span.map(rectFor).filter((r): r is NonNullable<typeof r> => !!r);
    if(rects.length < 2) continue;
    const upper = span[0] < 30;                       // upper quadrants 1/2
    const left = Math.min(...rects.map(r => r.x));
    const right = Math.max(...rects.map(r => r.x + r.width));
    const rTop = Math.min(...rects.map(r => r.y));
    const rH = rects[0].height;
    // coronal third: for the upper arch that is the LOWER part of the tile,
    // for the lower arch the UPPER part (crowns face the occlusal plane).
    const y = rTop + rH * (upper ? 0.66 : 0.30);
    const bar = document.createElementNS(SVG_NS, "rect");
    bar.setAttribute("class", "splint-overlay-bar");
    bar.setAttribute("x", String(left + 6));
    bar.setAttribute("y", String(y - 2.5));
    bar.setAttribute("width", String(Math.max(1, right - left - 12)));
    bar.setAttribute("height", "5");
    bar.setAttribute("rx", "2.5");
    overlay.appendChild(bar);
  }
}

/** Bead odontogram-dma: (re)draw the derived bar (Steg) over `#toothGrid`.
 *
 *  Its own overlay `<svg>`, but the SAME tile geometry the bridge saddle reads
 *  (`tileRectFor`), so the two can never drift apart — one source for where a
 *  tile is, two things drawn on it. Idempotent: cleared and redrawn on every
 *  call, and it creates nothing while no bar is charted. */
function updateRetentionBarOverlay(grid: HTMLElement | null){
  if(!grid) return;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let overlay = grid.querySelector(":scope > svg.retention-overlay") as SVGSVGElement | null;
  const spans = detectBarSpans([UPPER_ARCH, LOWER_ARCH], (tn) => toothState.get(tn));
  const gridRect = grid.getBoundingClientRect();
  const rectFor = (tn: number) => tileRectFor(grid, gridRect, tn);
  const claspGlyphs = computeClaspGlyphs(
    ALL_TEETH as number[],
    (tn) => toothState.get(tn),
    rectFor,
    (tn) => toothState.get(tn)?.retentionSide ?? "none",
  );
  if(spans.length === 0 && claspGlyphs.length === 0){
    if(overlay){ while(overlay.firstChild) overlay.removeChild(overlay.firstChild); }
    return;
  }
  const bars = computeRetentionBars(spans, rectFor);
  if(!overlay){
    overlay = document.createElementNS(SVG_NS, "svg");
    overlay.setAttribute("class", "retention-overlay");
    overlay.setAttribute("aria-hidden", "true");
    grid.appendChild(overlay);
  }
  while(overlay.firstChild) overlay.removeChild(overlay.firstChild);
  // viewBox only, never width/height attributes — the same rule
  // `renderGumOverlay`/`renderBridgeOverlay` follow. Pinning the SVG's size to
  // the SCREEN-space gridRect nailed it to the grid's layout box only where the
  // chart is NOT scaled; under the fit-to-window scale (clientWidth 1671 vs
  // bounding-rect 1370) the overlay covered ~82% of the grid and every bar
  // shifted up-and-left onto the wrong teeth. CSS (inset:0) stretches the SVG to
  // the layout box; the viewBox (screen space, same space tileRectFor reads the
  // bars in) then maps back 1:1. removeAttribute clears any stale sizing.
  overlay.removeAttribute("width");
  overlay.removeAttribute("height");
  overlay.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
  for(const glyph of claspGlyphs){
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "retention-overlay-clasp");
    path.setAttribute("d", glyph.d);
    overlay.appendChild(path);
  }
  for(const bar of bars){
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "retention-overlay-bar");
    rect.setAttribute("x", String(bar.x));
    rect.setAttribute("y", String(bar.y));
    rect.setAttribute("width", String(bar.width));
    rect.setAttribute("height", String(bar.height));
    const r = Math.min(bar.height / 2, bar.width / 2);
    rect.setAttribute("rx", String(r));
    rect.setAttribute("ry", String(r));
    overlay.appendChild(rect);
  }
}

// ---- KFO: Bracket, Bogen und Band im Gitter-Overlay (Etappe 2) ----
// Konstruiert in Endkoordinaten, wie Zahnfleisch und Retentionsbuegel - nicht
// aus den Donor-Ebenen gewarpt. Die Seitenansicht-Ebenen `ortho-bracket`/
// `ortho-ring` sind dort per CSS ausgeblendet (der Fingerabdruck liest
// `data-active`, nicht die Anzeige - Paritaet byte-identisch), die
// Kauflaechenansicht behaelt sie.
//
// Der Bogen ist EINE durchgehende Linie je Kiefer ueber alle BUKKALEN
// Brackets, auf Slot-Hoehe - deckungsgleich mit jedem Bracket, so wie ein Bogen
// in echt durch die Slots laeuft. Lingual: das Bracket blass hinter dem Zahn,
// der Bogen wird NICHT gezeichnet (Dirk, 22.08.2026).
const ORTHO_BRACKET_Y_UPPER = 0.72;   // Anteil der Kachelhoehe: Mitte der Krone
const ORTHO_BRACKET_Y_LOWER = 0.28;
const ORTHO_CROWN_W = 0.60;           // Kronenbreite als Anteil der Kachelbreite
const ORTHO_BRACKET_W = 0.30;
const ORTHO_BRACKET_H = 0.055;        // Anteil der Kachelhoehe
// Das Band sitzt auf DERSELBEN Hoehe wie der Bogen (Dirk, 22.08.2026: weiter
// Richtung Kauflaeche), traegt einen Slot auf Bogenhoehe und ist hoeher als ein
// Bracket - es umfasst die Krone.
const ORTHO_BAND_H = 0.17;

function updateOrthoOverlay(grid: HTMLElement | null){
  if(!grid) return;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let overlay = grid.querySelector(":scope > svg.ortho-overlay") as SVGSVGElement | null;
  const gridRect = grid.getBoundingClientRect();
  const rectFor = (tn: number) => tileRectFor(grid, gridRect, tn);

  type Shape = { kind: "bracket" | "band"; tn: number; side: string };
  const shapes: Shape[] = [];
  for(const tn of ALL_TEETH as number[]){
    const st = toothState.get(tn);
    if(!st || !orthoAllowed(st)) continue;
    if(st.orthoAppliance === "bracket") shapes.push({ kind:"bracket", tn, side: st.orthoBracketSide ?? "buccal" });
    else if(st.orthoAppliance === "band") shapes.push({ kind:"band", tn, side:"" });
  }
  if(shapes.length === 0){
    if(overlay){ while(overlay.firstChild) overlay.removeChild(overlay.firstChild); }
    return;
  }
  if(!overlay){
    overlay = document.createElementNS(SVG_NS, "svg");
    overlay.setAttribute("class", "ortho-overlay");
    overlay.setAttribute("aria-hidden", "true");
    grid.appendChild(overlay);
  }
  while(overlay.firstChild) overlay.removeChild(overlay.firstChild);
  // viewBox only, never width/height attributes — the same rule
  // `renderGumOverlay`/`renderBridgeOverlay` follow. Pinning the SVG's size to
  // the SCREEN-space gridRect nailed it to the grid's layout box only where the
  // chart is NOT scaled; under the fit-to-window scale (clientWidth 1671 vs
  // bounding-rect 1370) the overlay covered ~82% of the grid and every bar
  // shifted up-and-left onto the wrong teeth. CSS (inset:0) stretches the SVG to
  // the layout box; the viewBox (screen space, same space tileRectFor reads the
  // bars in) then maps back 1:1. removeAttribute clears any stale sizing.
  overlay.removeAttribute("width");
  overlay.removeAttribute("height");
  overlay.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);

  const bracketY = (tn: number, r: {y:number;height:number}) =>
    r.y + r.height * (isUpperTooth(tn) ? ORTHO_BRACKET_Y_UPPER : ORTHO_BRACKET_Y_LOWER);

  // 1) Der durchgehende Bogen je Kiefer. Knoten ist ein BUKKALES Bracket - und
  //    ein BAND, das in Bogenordnung an ein bukkales Bracket grenzt (Dirk: der
  //    Sechser hinter der Bracket-Front). Der Bogen laeuft dann durch bis zum
  //    Band, auf dessen Slot (Bogenhoehe). Lingual traegt keinen Bogen.
  const istBukkalesBracket = (tn: number) =>
    !!shapes.find(sh => sh.tn === tn && sh.kind === "bracket" && sh.side === "buccal");
  const istBand = (tn: number) => !!shapes.find(sh => sh.tn === tn && sh.kind === "band");
  for(const arch of [UPPER_ARCH, LOWER_ARCH]){
    const a = arch as number[];
    const pts: { x:number; y:number }[] = [];
    for(let i=0; i<a.length; i++){
      const tn = a[i];
      let knoten = istBukkalesBracket(tn);
      if(!knoten && istBand(tn)){
        const vor = a[i-1], nach = a[i+1];
        if((vor != null && istBukkalesBracket(vor)) || (nach != null && istBukkalesBracket(nach))) knoten = true;
      }
      if(!knoten) continue;
      const r = rectFor(tn); if(!r) continue;
      pts.push({ x: r.x + r.width/2, y: bracketY(tn, r) });
    }
    if(pts.length >= 2){
      const wire = document.createElementNS(SVG_NS, "polyline");
      wire.setAttribute("class", "ortho-overlay-wire");
      wire.setAttribute("points", pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));
      overlay.appendChild(wire);
    }
  }

  // 2) Brackets und Baender je Zahn.
  for(const sh of shapes){
    const r = rectFor(sh.tn); if(!r) continue;
    const cx = r.x + r.width/2;
    if(sh.kind === "bracket"){
      const y = bracketY(sh.tn, r);
      const bw = r.width * ORTHO_BRACKET_W, bh = r.height * ORTHO_BRACKET_H;
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "ortho-overlay-bracket" + (sh.side === "lingual" ? " is-lingual" : ""));
      const body = document.createElementNS(SVG_NS, "rect");
      body.setAttribute("x", (cx - bw/2).toFixed(1));
      body.setAttribute("y", (y - bh/2).toFixed(1));
      body.setAttribute("width", bw.toFixed(1));
      body.setAttribute("height", bh.toFixed(1));
      body.setAttribute("rx", (bh*0.3).toFixed(1));
      g.appendChild(body);
      // Slot: eine waagerechte Linie mittig, so laeuft der Bogen sichtbar durch.
      const slot = document.createElementNS(SVG_NS, "line");
      slot.setAttribute("x1", (cx - bw/2).toFixed(1));
      slot.setAttribute("x2", (cx + bw/2).toFixed(1));
      slot.setAttribute("y1", y.toFixed(1));
      slot.setAttribute("y2", y.toFixed(1));
      slot.setAttribute("class", "ortho-overlay-slot");
      g.appendChild(slot);
      overlay.appendChild(g);
    } else {
      // Band: waagerechter Metallguertel auf Bogenhoehe (Richtung Kauflaeche),
      // mit einem Slot auf genau der Bogenhoehe, damit der Bogen sichtbar
      // hineinlaeuft.
      const y = bracketY(sh.tn, r);
      const cw = r.width * ORTHO_CROWN_W, ch = r.height * ORTHO_BAND_H;
      const band = document.createElementNS(SVG_NS, "rect");
      band.setAttribute("class", "ortho-overlay-band");
      band.setAttribute("x", (cx - cw/2).toFixed(1));
      band.setAttribute("y", (y - ch/2).toFixed(1));
      band.setAttribute("width", cw.toFixed(1));
      band.setAttribute("height", ch.toFixed(1));
      band.setAttribute("rx", (r.width*0.03).toFixed(1));
      overlay.appendChild(band);
      const slot = document.createElementNS(SVG_NS, "line");
      slot.setAttribute("class", "ortho-overlay-slot");
      slot.setAttribute("x1", (cx - cw/2).toFixed(1));
      slot.setAttribute("x2", (cx + cw/2).toFixed(1));
      slot.setAttribute("y1", y.toFixed(1));
      slot.setAttribute("y2", y.toFixed(1));
      overlay.appendChild(slot);
    }
  }
}

// ---- Bridge overlay resize handling ----
let bridgeOverlayResizeObserver: ResizeObserver | null = null;
let bridgeOverlayResizeTimer: ReturnType<typeof setTimeout> | null = null;

/** Observe `#toothGrid` and re-run the bridge overlay (debounced) on resize. */
function setupBridgeOverlayResize(){
  if(typeof ResizeObserver === "undefined") return;
  const grid = $("#toothGrid") as HTMLElement | null;
  if(!grid) return;
  teardownBridgeOverlayResize();
  bridgeOverlayResizeObserver = new ResizeObserver(() => {
    if(bridgeOverlayResizeTimer) clearTimeout(bridgeOverlayResizeTimer);
    bridgeOverlayResizeTimer = setTimeout(() => {
      bridgeOverlayResizeTimer = null;
      try{ updateBridgeOverlay(); }
      catch(e){ console.error("odontogram bridge overlay resize render failed", e); }
    }, 100);
  });
  bridgeOverlayResizeObserver.observe(grid);
}

/** Disconnect the bridge-overlay resize observer and cancel any pending redraw. */
function teardownBridgeOverlayResize(){
  if(bridgeOverlayResizeObserver){ bridgeOverlayResizeObserver.disconnect(); bridgeOverlayResizeObserver = null; }
  if(bridgeOverlayResizeTimer){ clearTimeout(bridgeOverlayResizeTimer); bridgeOverlayResizeTimer = null; }
}

// ---- Plugin state ----
let registeredPlugins: OdontogramPlugin[] = [];
// Map: toothNo -> Map: pluginId -> <g> element (inside the tooth SVG)
const pluginOverlays = new Map<number, Map<string, SVGGElement>>();

// ---- Touch state ----
const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches;
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
const LONG_PRESS_MS = 500;
const TOUCH_MOVE_THRESHOLD = 10;

// Pinch state
let pinchStartDist = 0;
let pinchScale = 1;
let isPinching = false;

// Arch toggle state
let archMode: "both" | "upper" | "lower" = "both";
let archToggleBar: HTMLElement | null = null;

// ---- UI builders ----
function buildRadios(container: Any, name: Any, options: Any, onChange: Any){
  container.innerHTML = "";
  for(const opt of options){
    const id = `${name}-${opt.value}`;
    const label = el("label", {}, [
      el("input", { type:"radio", name, id, value:opt.value }),
      el("span", { text: opt.label })
    ]);
    const input = label.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", (e)=>onChange((e.target as HTMLInputElement).value));
    container.appendChild(label);
  }
}

function buildChecks(container: Any, items: Any, onToggle: Any){
  container.innerHTML = "";
  for(const it of items){
    const id = `chk-${it.value}`;
    const labelId = `lbl-${it.value}`;
    const labelText = it.labelKey ? t(it.labelKey) : it.label;
    const label = el("label", {}, [
      el("input", { type:"checkbox", id, value:it.value }),
      el("span", { id: labelId, text: labelText })
    ]);
    const input = label.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", (e)=>onToggle(it.value, (e.target as HTMLInputElement).checked));
    if(container.id === "cariesChecks" && it.value === "caries-subcrown"){
      setDisabled(input, true);
    }
    container.appendChild(label);
  }
}

/**
 * Render surface toggles in an anatomical cross/plus layout:
 * buccal (top), mesial (left), occlusal (center), distal (right), lingual (bottom).
 * Each item: { value, labelKey?, label?, letter, pos }. `pos` is one of
 * buccal|mesial|occlusal|distal|lingual and drives grid placement via a CSS class.
 * Keeps a hidden checkbox input (value=item.value) so existing state-sync works.
 */
export function buildSurfaceCross(container: Any, items: Any, onToggle: Any){
  container.innerHTML = "";
  const cross = el("div", { class: "surface-cross" });
  for(const it of items){
    const id = `chk-${it.value}`;
    const labelId = `lbl-${it.value}`;
    const labelText = it.labelKey ? t(it.labelKey) : it.label;
    const label = el("label", { class: `surface-cell pos-${it.pos}` }, [
      el("input", { type:"checkbox", id, value:it.value }),
      el("span", { class:"surf-letter", text: it.letter }),
      el("span", { id: labelId, class:"surf-name", text: labelText }),
    ]);
    const input = label.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", (e)=>onToggle(it.value, (e.target as HTMLInputElement).checked));
    cross.appendChild(label);
  }
  container.appendChild(cross);
}

function buildSelect(selectEl: Any, options: Any, onChange: Any){
  // Same grouping as setSelectOptions, which rebuilds this element on every
  // tooth change - if only one of the two grouped, the list would regroup the
  // first time a tooth was clicked.
  setSelectOptions(selectEl, options, options[0]?.value);
  selectEl.addEventListener("change", (e)=>onChange((e.target as HTMLSelectElement).value));
}

// `data-icon-src` carries inlined SVG markup (from a `?raw` import in App.tsx),
// parsed directly — never fetched — so inline icons ship inside the JS bundle.
async function loadInlineIcon(button: Any){
  if(!button) return;
  const src = button.dataset.iconSrc;
  if(!src) return;
  try{
    const parser = new DOMParser();
    const doc = parser.parseFromString(src, "image/svg+xml");
    const svg = doc.documentElement;
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.classList.add("icon-svg");
    button.innerHTML = "";
    button.appendChild(svg);
  }catch(_e){
    // ignore icon parse failures
  }
}

function syncIconXLine(button: Any){
  if(!button || !button.dataset.xline) return;
  const pressed = button.getAttribute("aria-pressed") === "true";
  const line = button.querySelector("#x-line");
  if(line) line.style.display = pressed ? "none" : "";
}

function updateWarnings(state: Any){
  updateWarningsFromState(state);
}

function getControlLabel(control: Any){
  if(!control) return null;
  // Cache the control→label association on the element. A control's label never
  // moves for the element's lifetime, but the `for=` branch below is a
  // DOCUMENT-WIDE querySelector, and setControlsEnabled runs it for ~200 controls
  // on every selection change — ~800ms over the ~6400-node grid DOM in jsdom, a
  // real per-click lag in the browser too (bead odontogram-szc). Fresh nodes
  // (grid/panel rebuild) have no cache and recompute once.
  if(control.__labelEl !== undefined) return control.__labelEl;
  let label = control.closest ? control.closest("label") : null;
  if(!label && control.id) label = document.querySelector(`label[for="${control.id}"]`);
  control.__labelEl = label ?? null;
  return control.__labelEl;
}

function syncControlLabelVisibility(control: Any){
  const label = getControlLabel(control);
  if(!label) return;
  label.style.display = control.disabled ? "none" : "";
}

function setDisabled(control: Any, disabled: Any){
  if(!control) return;
  control.disabled = !!disabled;
  syncControlLabelVisibility(control);
}

function setToggleButton(btn: Any, on: Any){
  if(!btn) return;
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  syncIconXLine(btn);
}

function getToggleLabel(labelKey: Any, collapsed: Any){
  return t(collapsed ? "actions.expand" : "actions.collapse", { label: t(labelKey) });
}

function applyToggleA11y(btn: Any, labelKey: Any, collapsed: Any){
  if(!btn) return;
  const text = getToggleLabel(labelKey, collapsed);
  btn.setAttribute("title", text);
  btn.setAttribute("aria-label", text);
}

// Maps each collapse-toggle button id to the i18n key used for its a11y label.
const CARD_TOGGLE_LABELS: Record<string, string> = {
  btnToggleStatusCard: "status.title",
  btnToggleCariesCard: "caries.title",
  btnToggleFillingCard: "filling.title",
  btnToggleRootPeriodontiumCard: "card.rootPeriodontium",
};

// Delegated handler for all card collapse toggles. Attached once to `document`
// so it survives React StrictMode double-mount and async init timing — per-button
// listeners wired in wireControls() proved unreliable under those conditions.
function onCardToggleClick(e: Any){
  const target = e.target as Any;
  const btn = target?.closest?.(".icon-btn");
  if(!btn) return;
  const icon = btn.querySelector(".toggle-icon");
  // Controls card collapses its actions container (uses `.hidden`), not the card.
  if(btn.id === "btnToggleControlsCard"){
    const actions = document.querySelector("#controlsActions");
    if(!actions) return;
    const hidden = actions.classList.toggle("hidden");
    applyToggleA11y(btn, "panel.controls", hidden);
    if(icon) icon.textContent = hidden ? "+" : "−";
    return;
  }
  const labelKey = CARD_TOGGLE_LABELS[btn.id];
  if(!labelKey) return; // not a card collapse toggle
  const card = btn.closest(".card");
  if(!card) return;
  const collapsed = card.classList.toggle("collapsed");
  applyToggleA11y(btn, labelKey, collapsed);
  if(icon) icon.textContent = collapsed ? "+" : "−";
}

// Delegated handler for the global `setX(!current)` visibility toggles. A stable
// reference so addEventListener de-duplicates it — see onCardToggleClick.
function onGlobalToggleClick(e: Any){
  const btn = (e.target as Any)?.closest?.("button");
  if(!btn) return;
  switch(btn.id){
    case "btnWisdomVisible": setWisdomVisible(!wisdomVisible); break;
    case "btnOcclView": setOcclusalVisible(!occlusalVisible); break;
    case "btnBoneVisible": setShowBase(!showBase); break;
    case "btnPulpVisible": setHealthyPulpVisible(!showHealthyPulp); break;
    case "btnEdentulous": setEdentulous(!edentulous); break;
  }
}

function isToothPresent(sel: Any){
  // `not-erupted` joins `none` here: the position carries no tooth to chart a
  // finding on. It is kept apart from `none` only where the DIFFERENCE matters
  // - the whole-mouth summary, which must not call an unerupted tooth missing
  // (odontogram-8vu).
  return sel !== "none" && sel !== "not-erupted" && sel !== "implant";
}

/** SP7 Task 5 (extended by SP15 Task 3 / B4): hide the `mods.inflammation`
 *  checkbox's row (built by buildChecks() as a <label> wrapping the checkbox
 *  input) inside `#modsChecks` for a PRESENT tooth (tooth-base/milktooth) —
 *  apicalDx now drives the periapical glyph there, so the checkbox would be a
 *  redundant/confusing second control — AND for an implant, where the
 *  dedicated `periImplant` axis (peri-implantitis) already covers implant
 *  inflammation, making this toggle redundant there too. It stays VISIBLE for
 *  a missing tooth (`toothSelection === "none"`) and for an extraction-socket
 *  (`toothSelection === "no-tooth-after-extraction"`), where it marks
 *  periodontal inflammation in the socket — a finding neither `apicalDx` nor
 *  `periImplant` cover there (the label itself swaps to "periodontal
 *  inflammation" for that case — see the `#lbl-inflammation` relabel in
 *  syncControlsFromState()). MUST run AFTER syncPeriImplantVisibility() in
 *  syncControlsFromState(): that function's implant-only loop also toggles
 *  this same checkbox's `.hidden` class, so whichever of the two runs last
 *  wins for the inflammation checkbox specifically — this one is the
 *  authoritative, final word. */
function syncInflammationModVisibility(container: Element | null, toothSelection: Any): void {
  if(!container) return;
  const inflChk = container.querySelector('input[value="inflammation"]') as HTMLInputElement | null;
  if(!inflChk) return;
  const inflLabel = inflChk.closest("label") || inflChk.parentElement;
  // Hidden for a present tooth or an implant; visible for missing/socket.
  // isToothPresent() alone can't express the socket case: it returns true for
  // "no-tooth-after-extraction" (neither "none" nor "implant"), so isExtraction()
  // carves that value back out of the "present" bucket to keep it visible.
  const hidden = toothSelection === "implant"
    || (isToothPresent(toothSelection) && !isExtraction(toothSelection));
  if(inflLabel) inflLabel.classList.toggle("hidden", hidden);
}

/** TEST-ONLY: apply {@link syncInflammationModVisibility} to a hand-built
 *  `#modsChecks` DOM fragment, without requiring a live initOdontogram(). Not
 *  part of the public API. */
export function __syncInflammationModVisibilityForTest(container: Element, toothSelection: string): void {
  syncInflammationModVisibility(container, toothSelection);
}

/** SP8 Task 5: on an implant, the dedicated `periImplant` axis supersedes the
 *  parodontal/inflammation mods (they're migrated away for implants — see
 *  hydrateState's implant-mods migration), so show `#periImplantRow` only for
 *  an implant and hide BOTH mod checkboxes' rows there. Composes with
 *  {@link syncInflammationModVisibility} for the `parodontal` checkbox (order
 *  doesn't matter there — nothing else touches it). For `inflammation`,
 *  though, this function's blanket implant-only rule (visible for EVERY
 *  non-implant selection, including a present tooth) is deliberately
 *  overridden by syncInflammationModVisibility's more specific present/socket
 *  rule (SP15 Task 3 / B4) — syncControlsFromState() calls this function
 *  FIRST and syncInflammationModVisibility() AFTER, so the latter always has
 *  the final say for `inflammation`. */
function syncPeriImplantVisibility(periImplantRow: Element | null, modsContainer: Element | null, toothSelection: Any): void {
  const isImplantSel = toothSelection === "implant";
  if(periImplantRow) periImplantRow.classList.toggle("hidden", !isImplantSel);
  if(!modsContainer) return;
  for(const val of ["parodontal", "inflammation"]){
    const chk = modsContainer.querySelector(`input[value="${val}"]`) as HTMLInputElement | null;
    const lbl = chk ? (chk.closest("label") || chk.parentElement) : null;
    if(lbl) lbl.classList.toggle("hidden", isImplantSel);
  }
}

/** TEST-ONLY: apply {@link syncPeriImplantVisibility} to hand-built DOM
 *  fragments, without requiring a live initOdontogram(). Not part of the
 *  public API. */
export function __syncPeriImplantVisibilityForTest(periImplantRow: Element | null, modsContainer: Element | null, toothSelection: string): void {
  syncPeriImplantVisibility(periImplantRow, modsContainer, toothSelection);
}

function isUnderGum(sel: Any){
  return sel === "tooth-under-gum";
}

function isExtraction(sel: Any){
  return sel === "no-tooth-after-extraction";
}

// SP-perio P1 Task 2: #perioRow gate. Periodontal probing applies only to a
// tooth actually present in the mouth chairside — missing/implant/under-gum/
// extraction-socket teeth have no probing site to chart at all, so (unlike
// mobilityRowHidden, which stays visible-but-disabled for some of those) this
// hides the whole row outright. `!isToothPresent(sel)` covers BOTH "none"
// (missing) and "implant" in one check; isUnderGum/isExtraction carve out the
// remaining two non-present-but-not-"none" selections.
function perioRowHidden(s: Any): boolean {
  const sel = s?.toothSelection;
  return !isToothPresent(sel) || isUnderGum(sel) || isExtraction(sel);
}
export function __perioRowHiddenForTest(s: Record<string, unknown>): boolean {
  return perioRowHidden(s);
}

function getDisplayedToothNumber(toothNo: Any){
  const s = toothState.get(toothNo);
  if(!s || s.toothSelection !== "milktooth") return toothNo;
  const firstDigit = Math.floor(toothNo / 10);
  const secondDigit = toothNo % 10;
  const mappedFirst = firstDigit === 1 ? 5 : firstDigit === 2 ? 6 : firstDigit === 3 ? 7 : 8;
  return mappedFirst * 10 + secondDigit;
}

function updateToothTileNumber(toothNo: Any){
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const text = toLabel(getDisplayedToothNumber(toothNo), numberingSystem);
  // The accessible name follows the number the chart shows. It used to be set
  // once when the tile was built and never again, so a tooth charted as a milk
  // tooth read "51" and announced "11" (odontogram-e0a AC2).
  for(const tile of tiles){
    if(tile?.getAttribute?.("role") === "option") tile.setAttribute("aria-label", text);
  }
  const upper = toothLabelUpper.get(toothNo);
  if(upper) upper.textContent = text;
  const lower = toothLabelLower.get(toothNo);
  if(lower) lower.textContent = text;
  // Setting textContent above wipes the note icon span; re-add it if the tooth
  // still has a note, so the icon persists across state/label updates.
  updateToothLabelNoteIcon(toothNo);
}

function updateAllToothTileNumbers(){
  for(const toothNo of ALL_TEETH){
    updateToothTileNumber(toothNo);
  }
}

// An option may carry a `group`; consecutive options sharing one are wrapped in
// an <optgroup>. The restoration dropdown is 32 entries deep on a molar, and
// flat it hid what it contained - a dentist looking for a gold inlay found
// eight crowns, eight bridge units and gave up before reading to entry
// nineteen. Grouping is presentation only: every `value` is unchanged, so the
// change handler, the state model and the payload know nothing about it.
function setSelectOptions(selectEl: Any, options: Any, value: Any){
  if(!selectEl) return;
  // Rebuild the <option> DOM only when the option SET actually changed. On a
  // selection change almost every one of the ~30 selects gets the same options
  // it already had and only a new value — and clearing `innerHTML` + recreating
  // every <option>/<optgroup> for all of them cost ~950ms per selection in
  // jsdom, a visible lag in the browser too (bead odontogram-szc). The options
  // depend on the language and on state predicates (e.g. getRootOptions), so a
  // signature over value/label/group/title catches every real change; setting
  // the value stays cheap and runs every time. `__optSig` is a runtime expando
  // on the element, discarded when the grid is rebuilt with fresh nodes.
  const sig = options.map((o: Any) =>
    `${o.value}\u0001${o.label}\u0001${o.group ?? ""}\u0001${o.title ?? ""}`).join("\u0002");
  if(selectEl.__optSig !== sig){
    selectEl.__optSig = sig;
    selectEl.innerHTML = "";
    let group: Any = null;
    let groupLabel: string | null = null;
    for(const opt of options){
      const o = el("option", { value: opt.value, text: opt.label });
      if(opt.title) o.title = opt.title;
      if(opt.group){
        if(opt.group !== groupLabel){
          group = el("optgroup", { label: opt.group });
          groupLabel = opt.group;
          selectEl.appendChild(group);
        }
        group.appendChild(o);
        continue;
      }
      group = null;
      groupLabel = null;
      selectEl.appendChild(o);
    }
  }
  if(options.some((o: Any) => o.value === value)){
    selectEl.value = value;
  }else{
    selectEl.value = options[0]?.value ?? "";
  }
}

function getEndoOptions(isMilktooth: Any){
  return optionsFor("endo", { isMilktooth: !!isMilktooth }).map(o => ({ value: o.value, label: t(o.labelKey) }));
}

function getFillingOptions(isMilktooth: Any){
  if(isMilktooth){
    return [
      {value:"none", label:t("filling.option.none")},
      {value:"composite", label:t("filling.option.composite")},
      {value:"gic", label:t("filling.option.gic")},
      {value:"temporary", label:t("filling.option.temporary")},
    ];
  }
  return [
    {value:"none", label:t("filling.option.none")},
    {value:"amalgam", label:t("filling.option.amalgam")},
    {value:"composite", label:t("filling.option.composite")},
    {value:"gic", label:t("filling.option.gic")},
    {value:"temporary", label:t("filling.option.temporary")},
  ];
}

// Teeth that render an occlusal view (premolars + molars); their restoration
// dropdown offers occlusal-only types (onlay).
const OCCLUSAL_TEETH = new Set([14,15,24,25,34,35,44,45,16,17,18,26,27,28,36,37,38,46,47,48]);
function restorationViewFor(toothNo: Any): "front" | "occlusal"{
  return typeof toothNo === "number" && OCCLUSAL_TEETH.has(toothNo) ? "occlusal" : "front";
}

// Tooth-substrate control options (natural / radix / broken / crown-prep).
function getSubstrateOptions(){
  return [
    {value:"natural", label:t("substrate.natural")},
    {value:"radix", label:t("substrate.radix")},
    {value:"broken", label:t("substrate.broken")},
    {value:"crownprep", label:t("substrate.crownprep")},
  ];
}

// Combined restoration dropdown, generated from RESTORATION_MATRIX via
// restorationOptions(). Each option encodes `${type}|${material}` so a single
// select writes BOTH restorationType and restorationMaterial.
function getRestorationOptions(view: "front" | "occlusal", ctx: { isImplant?: boolean; toothSelection?: string } = {}){
  return restorationOptions(view, { isImplant: !!ctx.isImplant, view, toothSelection: ctx.toothSelection }).map(o => {
    // "Kivehető:" (removable) entry — encoded distinctly so the change handler
    // writes `s.prosthesis` (and clears restorationType/material) instead.
    if(o.prosthesis){
      return {
        value: `prosthesis|${o.prosthesis}`,
        group: t(o.prefixKey ?? "restoration.prefix.removable"),
        label: t(PROSTHESIS_SUMMARY_KEY[o.prosthesis] ?? o.prosthesis),
      };
    }
    if(o.restorationType === "none"){
      return { value: `${o.restorationType}|${o.restorationMaterial}`, label: t(o.labelKey) };
    }
    // odontogram-1u2. Dirk, 18.08.2026: "kein Goldinlay, kein Keramikinlay
    // waehlbar oder ich finde es nicht." Die Eintraege WAREN da und sogar schon
    // nach Art gruppiert - gefunden hat er sie trotzdem nicht, und daran sind
    // zwei Dinge schuld:
    //
    // 1. Jede der sechs festen Gruppen begann mit demselben Wort ("Fest: Krone",
    //    "Fest: Bruecke", "Fest: Inlay" ...). Ein Wort, das auf jeder
    //    Ueberschrift steht, unterscheidet nichts und muss bei jedem Lesen
    //    uebersprungen werden. Die Ueberschrift ist jetzt die Art selbst; die
    //    herausnehmbaren behalten ihre eigene, denn DA liegt der Unterschied.
    // 2. Die Zeile hiess nur "Gold" - und ein <select> vergleicht getippte
    //    Zeichen AUSSCHLIESSLICH mit dem Text der OPTION, nie mit dem Label der
    //    optgroup. Wer "Gold" tippte, landete deshalb immer auf der Krone, und
    //    das Goldinlay war von der Tastatur aus ueberhaupt nicht erreichbar.
    //    Jetzt nennt jede Zeile ihre Art mit.
    //
    // Der Text kommt aus `restorationSummaryLabel`, derselben Funktion, die
    // Kurzinfo und Zusammenfassung benutzen - eine zweite Fassung derselben
    // Beschriftung waere genau die Stelle, an der beide auseinanderlaufen.
    return {
      value: `${o.restorationType}|${o.restorationMaterial}`,
      group: t(o.typeLabelKey ?? ""),
      label: restorationSummaryLabel(o.restorationType, o.restorationMaterial),
    };
  });
}

/** TEST-ONLY: the composed entries of the combined restoration dropdown -
 *  value, group heading and visible label - exactly as `setSelectOptions`
 *  receives them. Not part of the public API. */
export function __getRestorationOptionsForTest(
  view: "front" | "occlusal",
  ctx: { isImplant?: boolean; toothSelection?: string } = {},
): { value: string; group?: string; label: string }[] {
  return getRestorationOptions(view, ctx) as { value: string; group?: string; label: string }[];
}

// SP15 Task 1 (B5/B7): #restorationRow visibility gate — extracted as a
// standalone predicate (mirrors wearRowAllowed) so it's independently unit
// testable. An implant IS allowed here (restorationOptions already restricts
// it to a crown/bridge + attachment set); milk teeth, under-gum,
// extraction-socket teeth, and a radix substrate (a broken root can't carry a
// restoration) are not.
function restorationRowHidden(s: Any): boolean {
  const isMilktooth = s?.toothSelection === "milktooth";
  const underGum = isUnderGum(s?.toothSelection);
  const extraction = isExtraction(s?.toothSelection) || (s?.toothSelection === "none" && s?.extractionWound);
  return isMilktooth || underGum || extraction || s?.toothSubstrate === "radix";
}
export function __restorationRowHiddenForTest(s: Record<string, unknown>): boolean {
  return restorationRowHidden(s);
}

// Apply a combined-dropdown value to a tooth state. The value is either a fixed
// restoration `${type}|${material}` or a "Kivehető:" prosthesis `prosthesis|<value>`.
// A tooth ends up with EITHER a fixed restoration OR a prosthesis, never both
// (coherence mirrored in hydrateState's FIX 4 guard). Pure mutation, shared by the
// #restorationSelect change handler and covered by __applyRestorationSelectionForTest.
function applyRestorationSelection(s: Any, value: string){
  if(value.startsWith("prosthesis|")){
    // "Kivehető:" entry — set the prosthesis axis, clear the fixed restoration.
    s.prosthesis = value.slice("prosthesis|".length);
    s.restorationType = "none";
    s.restorationMaterial = "none";
    s.bridgePillar = false;
    s.crownReplace = false;
    s.cantilever = false;
  }else{
    const [type, material] = value.split("|");
    s.restorationType = type || "none";
    s.restorationMaterial = material || "none";
    s.prosthesis = "none";
    // Bead odontogram-5rv: "schwebend" gehoert dem Brueckenglied. Wird die
    // Restauration etwas anderes, ist die Angabe gegenstandslos - so wie
    // `bridgePillar` und `crownReplace` daneben.
    if(s.restorationType !== "bridge") s.cantilever = false;
    if(s.restorationType === "none"){
      s.bridgePillar = false;
      s.crownReplace = false;
    }else{
      s.crownNeeded = false;
    }
  }
  // FIX 3: crown-leakage is a crown/bridge-only finding — clear it whenever the
  // restoration is no longer a crown or bridge (prevents a stale crown-leakage
  // FHIR finding on a non-crown tooth).
  if(s.restorationType !== "crown" && s.restorationType !== "bridge"){
    s.crownLeakage = false;
  }
}

/** TEST-ONLY: apply a combined restoration-dropdown value to a state object,
 *  exactly as the #restorationSelect change handler does. Not part of the public API. */
export function __applyRestorationSelectionForTest(s: Record<string, unknown>, value: string): void {
  applyRestorationSelection(s, value);
}

// "Type – Material" label for a fixed restoration (crown/inlay/onlay/veneer/bridge),
// shared by the tooltip summary and the tooth-information prosthetics section.
// Mirrors the label composition used by getRestorationOptions() above.
function restorationSummaryLabel(type: Any, material: Any): string {
  const materialKey = `restoration.material.${material === "metal-ceramic" ? "metalCeramic" : material}`;
  return `${t(`restoration.type.${type}`)} – ${t(materialKey)}`;
}

// SP9: shared clinical-axis summary labels, reused by the tooltip (getStateSummary)
// and the whole-mouth panel (getOdontogramSummary). Each returns null at the axis's
// skip value. Reuse the existing per-value i18n label families.
function pulpDiagnosisLabel(state: Any): string | null {
  if(getPulpDetailLevel() === "latin"){
    if(state.pulpLatin && state.pulpLatin !== "none"){
      return t("pulpLatin." + kebabToCamel(state.pulpLatin));
    }
    // FIX 2: latin mode but pulpLatin is unset ("none") — resolve the Latin
    // representative for the stored pulpDx (mirrors pulpDisplayValue's latin
    // branch) instead of falling through to the AAE label, so the tooltip/panel
    // never mix nomenclatures within the same detail level.
    if(state.pulpDx && state.pulpDx !== "normal"){
      const latinRepresentative = PULP_DX_TO_LATIN[state.pulpDx];
      if(latinRepresentative) return t("pulpLatin." + kebabToCamel(latinRepresentative));
    }
  }
  if(state.pulpDx && state.pulpDx !== "normal") return t("pulpDx." + kebabToCamel(state.pulpDx));
  return null;
}
function apicalDiagnosisLabel(state: Any): string | null {
  if(!state.apicalDx || state.apicalDx === "normal") return null;
  let label = t("apicalDx." + kebabToCamel(state.apicalDx));
  if(state.periapicalType && state.periapicalType !== "none"){
    label += " (" + t("periapical.type." + kebabToCamel(state.periapicalType)) + ")";
  }
  if(state.apicalRoot) label += wurzelZusatz(state.apicalRoot);   // charly: pro Wurzel
  return label;
}
function resorptionDiagnosisLabel(state: Any): string | null {
  if(!state.resorptionType || state.resorptionType === "none") return null;
  return t("resorption.type." + kebabToCamel(state.resorptionType));
}
// FIX 3: peri-implant status only applies to implants — a stray `periImplant`
// value on a non-implant tooth must render nothing, matching the SVG render
// (which gates the peri-implant-bone-loss layer on isImplant).
function periImplantSummaryLabel(state: Any): string | null {
  if(state.toothSelection !== "implant") return null;
  if(!state.periImplant || state.periImplant === "none") return null;
  return t("periImplant." + kebabToCamel(state.periImplant));
}
function implantPositionSummaryLabel(state: Any): string | null {
  if(state.toothSelection !== "implant") return null;
  const p = state.implantPosition ?? "center";
  if(p === "center") return null;
  return t("implantPosition.label") + ": " + t("implantPosition." + p);
}
// SP-perio PG-C Task 3: CEJ visibility + root concavity — periodontal
// root-surface data axes (T2 shipped set/get, no svgLayer). Surfaced the same
// way as periImplantSummaryLabel/getToothRecessionType above: a periodontal
// PRESENCE line, not a pulp/apical/resorption diagnosis, so these are pushed
// alongside peri-implant status / recession type (see getStateSummary /
// getOdontogramSummary's "inflamed" bucket below), never through
// diagnosisSummaryLabels.
function cejVisibilitySummaryLabel(state: Any): string | null {
  if(!state.cejVisibility || state.cejVisibility === "none") return null;
  return t("perio.cej." + kebabToCamel(state.cejVisibility));
}
function rootConcavitySummaryLabel(state: Any): string | null {
  if(!state.rootConcavity || state.rootConcavity === "none") return null;
  return t("perio.rootConcavity." + kebabToCamel(state.rootConcavity));
}
// SP-perio PG-D Task 5: PI/GI (per-surface graded 1-3) + KG (mm) + GT
// (biotype) + Miller (recession class) per-tooth summary lines — same
// periodontal DATA-axis grouping as cejVisibilitySummaryLabel/
// rootConcavitySummaryLabel above (surfaced in BOTH getStateSummary's
// tooltip and getOdontogramSummary's "inflamed" bucket, never through
// diagnosisSummaryLabels). Take `toothNo` (not `state`) since all five read
// through their own public getter (mirrors getToothRecessionType's
// toothNo-based call style, already used alongside the state-based helpers
// at the very same call sites).
/** PI/GI: summarize only the CHARTED (non-zero graded) surfaces of the fixed
 *  4-surface set, in the same display order the rest of the file's per-
 *  surface summaries use. `null` when nothing is charted on this tooth for
 *  this axis — never a "(PI)" line with an empty surface list. */
function graduatedSurfaceSummaryLine(toothNo: number, getter: (toothNo: number, surface: string) => 0|1|2|3, rowLabelKey: string): string | null {
  const parts: string[] = [];
  for(const surface of SUMMARY_SURFACE_ORDER){
    if(!VALID_PLAQUE_SURFACE.has(surface)) continue;
    const grade = getter(toothNo, surface);
    if(grade > 0) parts.push(`${summarySurfaceLetter(surface, toothNo)}: ${grade}`);
  }
  if(parts.length === 0) return null;
  return `${t(rowLabelKey)} (${parts.join(", ")})`;
}
/** Bead odontogram-gry: Papillenverlust je Zwischenraum, mit der roemischen
 *  Klasse, die auch die Bedienung zeigt. `null`, wenn an diesem Zahn keine
 *  Papille beurteilt ist - nie eine leere Zeile.
 *
 *  Gefiltert wird gegen `papillaSites(toothNo)`, nicht nur gegen die
 *  gespeicherten Schluessel: eine tolerant importierte distale Papille am
 *  letzten Zahn wird gespeichert, aber nirgends angezeigt, wo die Bedienung
 *  sie verweigert - dieselbe Regel wie bei der Retention. */
function papillaLossSummaryLine(toothNo: number): string | null {
  if(!papillaLossAllowed(toothNo)) return null;
  const graded = getToothPapillaLoss(toothNo);
  const parts: string[] = [];
  for(const site of papillaSites(toothNo)){
    const grade = graded[site];
    if(grade) parts.push(`${t(`papillaLoss.site.${site}`)}: ${t(`papillaLoss.class.${grade}`)}`);
  }
  if(parts.length === 0) return null;
  return `${t("papillaLoss.label")} (${parts.join(", ")})`;
}
function plaqueIndexSummaryLine(toothNo: number): string | null {
  return graduatedSurfaceSummaryLine(toothNo, getPlaqueIndex, "perio.pi.row");
}
function gingivalIndexSummaryLine(toothNo: number): string | null {
  return graduatedSurfaceSummaryLine(toothNo, getGingivalIndex, "perio.gi.row");
}
// SP-perio PG-E Task 3: mPI/mBI (Mombelli peri-implant indices) — same
// per-surface graded summary-line shape as PI/GI above, reusing
// graduatedSurfaceSummaryLine. Implant-gated at the setter (a non-implant
// tooth's mpi/mbi maps are always empty), so no extra guard is needed here:
// graduatedSurfaceSummaryLine already returns null when nothing is charted.
function periImplantPlaqueSummaryLine(toothNo: number): string | null {
  return graduatedSurfaceSummaryLine(toothNo, getPeriImplantPlaque, "perio.mpi.row");
}
function periImplantBleedingSummaryLine(toothNo: number): string | null {
  return graduatedSurfaceSummaryLine(toothNo, getPeriImplantBleeding, "perio.mbi.row");
}
/** KG: `null` when not charted (mirrors {@link getKeratinizedWidth}'s own
 *  "absence = not charted" semantics — never distinct from a stored 0mm). */
function keratinizedWidthSummaryLine(toothNo: number): string | null {
  const mm = getKeratinizedWidth(toothNo);
  if(mm === null) return null;
  return `${t("perio.kg.row")}: ${mm} mm`;
}
/** GT: skip value is `"unknown"` (not `"none"`, unlike every other enum axis
 *  here) — mirrors {@link getGingivalThickness}'s own default. */
function gingivalThicknessSummaryLabel(toothNo: number): string | null {
  const gt = getGingivalThickness(toothNo);
  if(gt === "unknown") return null;
  return t("perio.gt." + gt);
}
function millerClassSummaryLabel(toothNo: number): string | null {
  const mc = getMillerClass(toothNo);
  if(mc === "none") return null;
  return t("perio.miller." + mc);
}
/** All non-empty clinical diagnosis labels for a tooth, in a stable order.
 *  FIX 1: peri-implant status is deliberately NOT included here — it belongs to
 *  the periodontal grouping (see getOdontogramSummary's `inflamed` list and
 *  getStateSummary's dedicated push), not the pulp/apical/resorption diagnoses
 *  section, so an implant's periodontal state is reported consistently in one
 *  place instead of contradicting it elsewhere. */
/** Bead odontogram-fu1: das PRUEFERGEBNIS, nicht die Benennung.
 *
 *  Steht bei den Diagnosen, weil man es dort liest - der Perkussionsbefund ist
 *  die Begruendung fuer die apikale Diagnose direkt darueber. Aber es ist eine
 *  eigene Zeile: sie sagt, was geprueft wurde, jene, was daraus folgte. */
function sensibilitySummaryLabel(state: Any): string | null {
  if(!state.sensibility || state.sensibility === "none") return null;
  if(!sensibilityAllowed(state)) return null;
  return t("sensibility.summary." + kebabToCamel(state.sensibility));
}
function percussionSummaryLabel(state: Any): string | null {
  if(!state.percussion || state.percussion === "none") return null;
  if(!percussionAllowed(state)) return null;
  return t("percussion.summary." + kebabToCamel(state.percussion));
}

function wurzelZusatz(wurzel: string): string {
  return wurzel ? ` (${t("root." + kebabToCamel(wurzel))})` : "";
}
function rootFractureSummaryLabel(state: Any): string | null {
  if(!state.rootFracture || state.rootFracture === "none") return null;
  if(!rootFractureAllowed(state)) return null;
  return t("rootFracture.summary." + kebabToCamel(state.rootFracture))
    + wurzelZusatz(state.rootFractureRoot ?? "");
}
function rootResectionSummaryLabel(state: Any): string | null {
  if(!state.rootResection || state.rootResection === "none") return null;
  return t("rootResection.option." + kebabToCamel(state.rootResection))
    + wurzelZusatz(state.rootResectionRoot ?? "");
}

function diagnosisSummaryLabels(state: Any): string[] {
  return [
    sensibilitySummaryLabel(state),
    percussionSummaryLabel(state),
    pulpDiagnosisLabel(state),
    apicalDiagnosisLabel(state),
    resorptionDiagnosisLabel(state),
    rootFractureSummaryLabel(state),
    rootResectionSummaryLabel(state),
  ].filter((x): x is string => !!x);
}
/** Coarse 3-tier caries-severity qualifier (max across caried surfaces), or null. */
function cariesSeverityTierLabel(state: Any): string | null {
  if(!state.caries || state.caries.size === 0 || !state.cariesSeverity) return null;
  let max = 0;
  for(const c of state.caries){
    const surface = String(c).replace(/^caries-/, "");
    const sev = state.cariesSeverity.get(surface);
    if(typeof sev === "number" && sev > max) max = sev;
  }
  if(max <= 0) return null;
  const tier = max <= 2 ? "superficial" : max <= 4 ? "moderate" : "deep";
  return t("summary.severity." + tier);
}
/** Fracture presence label, or null. */
function fractureSummaryLabel(state: Any): string | null {
  const cft = state.crownFractureType && state.crownFractureType !== "none";
  if(!(state.brokenMesial || state.brokenIncisal || state.brokenDistal || cft)) return null;
  const base = t("summary.fracture");
  return cft ? `${base} (${t("crownFractureType.option." + state.crownFractureType)})` : base;
}

function getBrokenCrownVariant(state: Any){
  const m = !!state.brokenMesial;
  const i = !!state.brokenIncisal;
  const d = !!state.brokenDistal;
  if(m && d && i) return "tooth-broken-mesial-distal-incisal";
  if(m && d) return "tooth-broken-mesial-distal";
  if(d && i) return "tooth-broken-distal-incisal";
  if(m && i) return "tooth-broken-mesial-incisal";
  if(d) return "tooth-broken-distal";
  if(m) return "tooth-broken-mesial";
  if(i) return "tooth-broken-incisal";
  return null;
}

function getToothSelectOptions(){
  const all = optionsFor("toothSelection").map(o => ({ value: o.value, label: t(o.labelKey) }));
  if(getChartMode() !== "plan") return all;
  // 2.2.1 Plan-mode: a plan records what a dentist will DO, so the only base
  // states that make sense as a PLAN are extract (Missing), keep/restore a
  // permanent tooth, or place an Implant. Primary (milk) teeth and subgingival
  // remnants are status-only findings — omit them from the Plan base picker.
  // The active tooth's CURRENT base is always kept in the list so an
  // already-charted milk/under-gum tooth still displays (never silently blank).
  const allowed = new Set(["none", "tooth-base", "implant"]);
  const current = activeTooth ? toothState.get(activeTooth)?.toothSelection : undefined;
  if(current) allowed.add(current);
  return all.filter(o => allowed.has(o.value));
}

function getStatusExtras(){
  if(!STATUS_EXTRAS || !Array.isArray(STATUS_EXTRAS.options)) return [];
  return STATUS_EXTRAS.options.map((opt)=>({
    ...opt,
    label: t(opt.labelKey),
  }));
}

function getStatusExtrasMeta(){
  return STATUS_EXTRAS?.arches || null;
}

function getMobilityOptions(){
  return optionsFor("mobility").map(o => ({ value: o.value, label: t(o.labelKey) }));
}

// SP15 Task 1 (B5): #mobilityRow / #mobilitySelect gates — standard tooth
// mobility grading (Miller) applies to a natural tooth's periodontal
// ligament; an implant is osseointegrated and has no PDL, so the control is
// hidden/disabled there. Extracted as standalone predicates (mirrors
// wearRowAllowed) so they're independently unit testable. Hiding the control
// is enough — any previously stored mobility value is left untouched.
function mobilityRowHidden(s: Any): boolean {
  const isImplant = s?.toothSelection === "implant";
  const underGum = isUnderGum(s?.toothSelection);
  const extraction = isExtraction(s?.toothSelection) || (s?.toothSelection === "none" && s?.extractionWound);
  return isImplant || underGum || extraction;
}
export function __mobilityRowHiddenForTest(s: Record<string, unknown>): boolean {
  return mobilityRowHidden(s);
}

function mobilityDisabled(s: Any): boolean {
  const isImplant = s?.toothSelection === "implant";
  const extraction = isExtraction(s?.toothSelection) || (s?.toothSelection === "none" && s?.extractionWound);
  return s?.toothSelection === "none" || extraction || isImplant;
}
export function __mobilityDisabledForTest(s: Record<string, unknown>): boolean {
  return mobilityDisabled(s);
}

const VALID_ICDAS = new Set([1,2,3,4,5,6]);
export function icdasTier(code: number): 1|2|3 { return code <= 2 ? 1 : code <= 4 ? 2 : 3; }
export function threeLevelToIcdas(level: string): number { return level === "deep" ? 6 : level === "dentin" ? 4 : 2; }
export function icdasToThreeLevel(code: number): string { const t = icdasTier(code); return t === 3 ? "deep" : t === 2 ? "dentin" : "surface"; }

function getCariesDepthOptions(): Array<{ value: number; label: string; title?: string }>{
  if(icdasEnabled){
    return [1,2,3,4,5,6].map((n)=>({ value:n, label:`${n} — ${t(`icdas.code.${n}`)}`, title:t(`icdas.desc.${n}`) }));
  }
  return [
    {value:2, label:t("caries.depth.surface")},
    {value:4, label:t("caries.depth.dentin")},
    {value:6, label:t("caries.depth.deep")},
  ];
}

// ---- SP5 Task 5: caries-granularity option builders + surface-write helpers ----
// (kebabToCamel / VALID_ROOT_CARIES are declared below; both are resolved at
// call time, so the forward reference is safe.)
// SP6 Task 2 (step 5): the CARS 0..6 picker now reads the dedicated
// `caries.cars.{n}` ICDAS-based names (all 9 languages). Kept as a map so the
// score→key mapping stays explicit and unit-checkable.
const SECONDARY_CARS_LABEL_KEY: Record<number, string> = {
  0: "caries.cars.0",
  1: "caries.cars.1",
  2: "caries.cars.2",
  3: "caries.cars.3",
  4: "caries.cars.4",
  5: "caries.cars.5",
  6: "caries.cars.6",
};

/** CARS-score options for the per-surface secondary-caries picker at a given
 *  granularity mode (defaults to the module setting). simple -> [0,3];
 *  standard -> [0,1,3,6]; full -> [0..6]. Score 0 clears the surface. Pure. */
export function secondaryCariesOptions(mode: SecondaryCariesMode = secondaryCariesMode): { value: number; label: string }[]{
  const values = mode === "simple" ? [0, 3] : mode === "full" ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 3, 6];
  return values.map((v) => ({ value: v, label: t(SECONDARY_CARS_LABEL_KEY[v]) }));
}

/** Root-caries options at a given mode (defaults to the module setting).
 *  simple -> none / present (present writes the canonical "active-cavitated"
 *  enum — SP6 Task 3: the most-severe value, so simple-mode "present" renders
 *  at full opacity); severity -> the full rootCaries enum. Pure. */
export function rootCariesOptions(mode: RootCariesMode = rootCariesMode): { value: string; label: string }[]{
  if(mode === "severity"){
    return Array.from(VALID_ROOT_CARIES).map((v) => ({ value: v, label: t("rootCaries." + kebabToCamel(v)) }));
  }
  return [
    { value: "none", label: t("rootCaries.none") },
    { value: "active-cavitated", label: t("rootCaries.present") },
  ];
}

/** The rootCaries option value to SHOW for a stored value at a given mode
 *  (display-only collapse; never mutates state). simple buckets every non-none
 *  severity into the single "present" (=active-cavitated) option — matching the
 *  canonical value rootCariesOptions("simple") now writes (SP6 Task 3) — so the
 *  select's selected option always matches one of its own values; severity
 *  shows it verbatim. Mirrors pulpDisplayValue. */
export function rootCariesDisplayValue(mode: RootCariesMode, stored: string): string {
  if(mode === "simple") return stored && stored !== "none" ? "active-cavitated" : "none";
  return stored || "none";
}

/** Radiographic-depth options at a given mode (defaults to the module setting).
 *  off -> [] (the control is hidden); threeLevel -> none + superficial/middle/
 *  deep buckets (writing the representative E1/D1/D3 codes); detailed -> the
 *  full none/E1/E2/D1/D2/D3 scale. "none" clears the surface. Pure. */
export function radiographicDepthOptions(mode: RadiographicDepthMode = radiographicDepthMode): { value: string; label: string }[]{
  if(mode === "off") return [];
  if(mode === "threeLevel"){
    return [
      { value: "none", label: t("radiographicDepth.none") },
      { value: "E1", label: t("radiographicDepth.superficial") },
      { value: "D1", label: t("radiographicDepth.middle") },
      { value: "D3", label: t("radiographicDepth.deep") },
    ];
  }
  return ["none", "E1", "E2", "D1", "D2", "D3"].map((v) => ({ value: v, label: t("radiographicDepth." + v) }));
}

/** Set/clear a per-surface CARS secondary-caries score on `map` (score 0
 *  clears). Extracted so the surface-write path is unit-testable without the
 *  DOM. */
export function applySecondaryCariesScore(map: Map<string, number>, surface: string, score: number): void {
  if(score > 0) map.set(surface, score);
  else map.delete(surface);
}

/** SP6 Task 2: the recurrent (secondary) caries transition on a FILLED surface.
 *  The CARS group of the contextual popup drives the caries state-machine on a
 *  surface that carries a filling:
 *   - score 0 (Sound)  → remove the caries from the surface (revert to a plain
 *     filling) and clear its severity;
 *   - score > 0        → add the caries to the surface (becomes recurrent /
 *     `subcaries-{surface}`) and store the CARS value as its severity.
 *  Guarded on the filling actually being present, so a CARS score never lands
 *  on a surface without a filling (that would be primary caries, authored via
 *  the depth group instead). Mutates `state.caries` (Set of `caries-{surface}`)
 *  and `state.cariesSeverity` (Map surface→0..6). Extracted so the two
 *  transitions are unit-testable without the DOM. */
export function applyRecurrentCariesScore(
  state: { caries: Set<string>; cariesSeverity: Map<string, number>; fillingSurfaceMaterials: Map<string, string> },
  surface: string,
  score: number,
): void {
  if(!state.fillingSurfaceMaterials.has(surface)) return;
  const key = `caries-${surface}`;
  if(score > 0){
    state.caries.add(key);
    state.cariesSeverity.set(surface, score);
  }else{
    state.caries.delete(key);
    state.cariesSeverity.delete(surface);
  }
}

/** Set/clear a per-surface radiographic-depth value on `map` ("none"/empty
 *  clears). Extracted for unit-testing the surface-write path. */
export function applyRadiographicDepth(map: Map<string, string>, surface: string, value: string): void {
  if(value && value !== "none") map.set(surface, value);
  else map.delete(surface);
}

/** Set/clear a per-surface filling-defect value on `map` ("none"/empty clears).
 *  Extracted for unit-testing the surface-write path. */
export function applyFillingDefect(map: Map<string, string>, surface: string, value: string): void {
  if(value && value !== "none") map.set(surface, value);
  else map.delete(surface);
}

/** Bead odontogram-wxt: set/clear the cervical marker on one surface of an
 *  ALREADY-GATED state object — the write half of {@link setCervicalInvolvement},
 *  used by the popup, which runs inside `applyToSelected`'s batch gate and must
 *  not gate a second time. Silently ignores a surface the cervix does not
 *  border. Extracted for unit-testing the surface-write path. */
export function applyCervicalInvolvement(state: Any, surface: string, involved: boolean): void {
  if(!VALID_CERVICAL_SURFACES.has(surface)) return;
  if(!state.cervicalSurfaces) state.cervicalSurfaces = new Set();
  if(involved) state.cervicalSurfaces.add(surface);
  else state.cervicalSurfaces.delete(surface);
}

// ---- SP4 Task 5: pulp/apical/resorption diagnosis authoring ----
export type PulpDetailLevel = "simple" | "aae" | "latin";

// kebab-case value id -> camelCase i18n key suffix. Matches the keys Task 1
// added to translations.ts (e.g. "reversible-pulpitis" -> "reversiblePulpitis",
// "external-cervical" -> "externalCervical").
function kebabToCamel(id: string): string {
  return String(id).replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
}

// Each practical-Latin pulp subtype collapses to exactly one AAE `pulpDx`
// parent (spec §3.2 clinical grouping): pulpa-sana = normal; hyperaemia =
// reversible; every "pulpitis acuta/chronica" = irreversible; necrosis /
// gangraena = necrosis. "none" (no Latin subtype recorded) maps to the
// healthy parent.
export const PULP_LATIN_PARENT: Record<string, string> = {
  "none": "normal",
  "pulpa-sana": "normal",
  "hyperaemia-pulpae": "reversible-pulpitis",
  "pulpitis-acuta-serosa": "irreversible-pulpitis",
  "pulpitis-acuta-purulenta": "irreversible-pulpitis",
  "pulpitis-chronica-clausa": "irreversible-pulpitis",
  "pulpitis-chronica-ulcerosa": "irreversible-pulpitis",
  "pulpitis-chronica-hyperplastica": "irreversible-pulpitis",
  "necrosis-pulpae": "necrosis",
  "gangraena-pulpae": "necrosis",
};

// Representative Latin subtype per AAE parent — used ONLY to display an
// AAE/simple-authored value (pulpLatin:"none") when the panel is in "latin"
// mode. Never written back to state (display-only collapse).
const PULP_DX_TO_LATIN: Record<string, string> = {
  "normal": "pulpa-sana",
  "reversible-pulpitis": "hyperaemia-pulpae",
  "irreversible-pulpitis": "pulpitis-acuta-serosa",
  "necrosis": "necrosis-pulpae",
};

/** Option {value,labelKey} list for the pulp control at a given detail level.
 *  simple -> 2 (healthy / pulpitis); aae -> the 4 pulpDx values; latin -> the 9
 *  pulpLatin subtypes. The "latin" branch consults `ClinicalAxis.flag`
 *  (`isAxisFlagSatisfied` — the first consumer of the registry feature-flag
 *  gate). Pure; reads no module state. */
export function pulpSelectOptionValues(level: PulpDetailLevel): { value: string; labelKey: string }[] {
  if(level === "latin" && isAxisFlagSatisfied("pulpLatin", { latinPulpDetail: true })){
    return Array.from(VALID_PULP_LATIN).filter(v => v !== "none")
      .map(v => ({ value: v, labelKey: "pulpLatin." + kebabToCamel(v) }));
  }
  if(level === "simple"){
    return [
      { value: "normal", labelKey: "pulpDx.normal" },
      { value: "irreversible-pulpitis", labelKey: "pulpDx.irreversiblePulpitis" },
    ];
  }
  return Array.from(VALID_PULP_DX).map(v => ({ value: v, labelKey: "pulpDx." + kebabToCamel(v) }));
}

/** Maps a pulp-control selection to the {pulpDx,pulpLatin} it writes. At "latin"
 *  the selected Latin value sets `pulpLatin` and its parent `pulpDx`; at
 *  "simple"/"aae" the value is a `pulpDx` and `pulpLatin` is cleared to "none". */
/** SP7: the periapical lesion subtype (granuloma / cyst) is a refinement of
 *  apical periodontitis, so its row (#periapicalTypeRow) shows only when the
 *  apical diagnosis is symptomatic or asymptomatic apical periodontitis. Other
 *  apicalDx values (abscess forms, condensing osteitis, normal) carry no
 *  granuloma/cyst refinement. Non-present teeth keep apicalDx="normal" (their
 *  glyph is driven by mods.inflammation in the render, unchanged) so the row is
 *  hidden for them — subtype authoring on implant/missing is deferred to the
 *  peri-implantitis sub-project. */
export function periapicalRowVisible(state: Any): boolean {
  return state.apicalDx === "symptomatic-apical-periodontitis"
    || state.apicalDx === "asymptomatic-apical-periodontitis";
}

export function pulpSelectionToState(level: PulpDetailLevel, value: string): { pulpDx: string; pulpLatin: string }{
  if(level === "latin"){
    return { pulpLatin: value, pulpDx: PULP_LATIN_PARENT[value] ?? "normal" };
  }
  return { pulpDx: value, pulpLatin: "none" };
}

/** The option value to SHOW for a stored state at a given level (display-only
 *  collapse; never mutates state). latin -> stored pulpLatin (or a representative
 *  for pulpDx when only pulpDx is set); aae -> pulpDx; simple -> healthy vs. the
 *  single pulpitis bucket. */
export function pulpDisplayValue(level: PulpDetailLevel, state: { pulpDx?: string; pulpLatin?: string }): string {
  const pulpDx = state.pulpDx ?? "normal";
  const pulpLatin = state.pulpLatin ?? "none";
  if(level === "simple") return pulpDx === "normal" ? "normal" : "irreversible-pulpitis";
  if(level === "latin") return pulpLatin !== "none" ? pulpLatin : (PULP_DX_TO_LATIN[pulpDx] ?? "pulpa-sana");
  return pulpDx;
}

function getPulpOptions(): { value: string; label: string }[]{
  return pulpSelectOptionValues(pulpDetailLevel).map(o => ({ value: o.value, label: t(o.labelKey) }));
}

// SP7 Task 4: a value belongs to the "treated (endo)" branch iff it is a non-"none"
// endo value; otherwise it is a vital pulp value. `endo`/`pulpDx` never share
// a value, so this disambiguation is total.
export function isEndoValue(value: string): boolean {
  return value !== "none" && VALID_ENDO.has(value);
}

// Per-canal endo (endoCanals) collapsed to ONE whole-tooth endo value, so the
// anatomical view — whose endo artwork is one layer per finding-type across all
// canals — shows the tooth as treated even when only per-canal detail is
// charted. The Schema view shows WHICH canal; this makes both views agree. The
// scalar filling state wins when set; legacy combined post values project
// to a complete filling here and to their material in effectiveRootPostType().
export function effectiveEndo(state: Any): string {
  if(state.endo === "endo-glass-pin" || state.endo === "endo-metal-pin") return "endo-filling";
  if(state.endo && state.endo !== "none") return state.endo;
  const flat = (Object.values((state.endoCanals ?? {}) as Record<string, string[]>) as string[][]).flat();
  if(!flat.length) return "none";
  if(flat.includes("filling")) return "endo-filling";
  if(flat.includes("incomplete")) return "endo-filling-incomplete";
  if(flat.includes("temporary")) return "endo-medical-filling";
  if(flat.includes("post")) return "endo-filling";
  return "none";
}

/** Resolve the independent root-post material, including canal-detail input. */
export function effectiveRootPostType(state: Any): string {
  if(state.rootPostType && state.rootPostType !== "none") return state.rootPostType;
  if(state.endo === "endo-glass-pin") return "glass-fiber";
  if(state.endo === "endo-metal-pin") return "metal";
  const flat = (Object.values((state.endoCanals ?? {}) as Record<string, string[]>) as string[][]).flat();
  return flat.includes("post") ? "metal" : "none";
}

/** Localized independent root-post finding, or null when none is recorded. */
function rootPostSummaryLabel(state: Any): string | null {
  const rootPostType = effectiveRootPostType(state);
  return rootPostType !== "none"
    ? t(`rootPost.option.${kebabToCamel(rootPostType)}`)
    : null;
}

// Per-canal endo as ONE line of language-neutral clinical shorthand, like the
// schematic badge: canal by anatomical abbreviation (mb/db/p/m/d/b/l), finding
// by WF (filling) / St (post) / WFi (incomplete) / Med (temporary). Kept out of
// i18n on purpose — these abbreviations are the same in every dental language,
// and a 12-language expansion for a detail line is not worth it. "" when none.
const ENDO_CANAL_ABBR: Record<string, string> = {
  mesiobuccal: "mb", distobuccal: "db", palatal: "p", mesial: "m",
  distal: "d", buccal: "b", lingual: "l", single: "",
};
const ENDO_CANAL_FIND_ABBR: Record<string, string> = {
  filling: "WF", post: "St", incomplete: "WFi", temporary: "Med",
};
export function endoCanalSummaryParts(state: Any): string {
  const map = (state.endoCanals ?? {}) as Record<string, string[]>;
  const parts: string[] = [];
  for(const [canal, finds] of Object.entries(map)){
    if(!finds?.length) continue;
    const marks = finds.map(f => ENDO_CANAL_FIND_ABBR[f]).filter(Boolean).join("·");
    if(!marks) continue;
    const c = ENDO_CANAL_ABBR[canal] ?? canal;
    parts.push(c ? `${c}: ${marks}` : marks);
  }
  return parts.join(" · ");
}

// SP7 Task 4: the merged selector's displayed value. A treated tooth shows its
// endo value; otherwise the pulp value collapsed to the active detail level.
export function pulpEndoDisplayValue(state: Any): string {
  if(state.endo && state.endo !== "none") return state.endo;
  return pulpDisplayValue(pulpDetailLevel, state);
}

// SP7 Task 4: build/refresh the grouped #pulpEndoSelect. Two <optgroup>s: vital
// pulp diagnoses (at the active detail level) and treated endo options
// (non-"none", milktooth-filtered). Selection is applied by pulpEndoOnSelect.
export function buildPulpEndoSelect(sel: Any, isMilktooth: boolean, selected: string, omitPulpDx: boolean = false): void {
  if(!sel) return;
  sel.innerHTML = "";
  const mkGroup = (labelKey: string, opts: { value: string; label: string }[]) => {
    const g = document.createElement("optgroup");
    g.label = t(labelKey);
    for(const o of opts){
      const el = document.createElement("option");
      el.value = o.value; el.textContent = o.label;
      g.appendChild(el);
    }
    sel.appendChild(g);
  };
  if(!omitPulpDx){
    // Status: the vital-pulp DIAGNOSIS group + the treated-endo group.
    mkGroup("pulpEndo.groupVital", getPulpOptions());
    mkGroup("pulpEndo.groupTreated", getEndoOptions(isMilktooth).filter(o => o.value !== "none"));
    sel.value = selected;
  }else{
    // 2.2.1 Plan-mode: an ENDO TREATMENT picker only — the vital-pulp diagnosis
    // group (pulpitis/necrosis) is a status finding, out of scope for a plan.
    // A standalone "none" (no endo planned) plus the treated-endo options; the
    // displayed value collapses any non-endo (healthy/diseased-pulp) state to
    // "none" so a plan never shows a pulp diagnosis.
    const endoOpts = getEndoOptions(isMilktooth);
    const none = endoOpts.find(o => o.value === "none");
    if(none){
      const el = document.createElement("option");
      el.value = none.value; el.textContent = none.label;
      sel.appendChild(el);
    }
    mkGroup("pulpEndo.groupTreated", endoOpts.filter(o => o.value !== "none"));
    sel.value = isEndoValue(selected) ? selected : "none";
  }
}

// SP7 Task 4: apply a merged-selector choice, enforcing the mutual-exclusion
// invariant (mirrors the hydrate-time normalize at s.endo assignment, above).
export function pulpEndoOnSelect(s: Any, value: string): void {
  if(value === "none"){
    // 2.2.1 Plan-mode "no endo planned": clear the endo treatment, leave the
    // (Plan-hidden) pulp diagnosis untouched. In Status the vital group's
    // healthy option is used instead, so this branch is Plan-only in practice.
    s.endo = "none";
    return;
  }
  if(isEndoValue(value)){
    s.endo = value;
    s.pulpDx = "normal";
    s.pulpLatin = "none";
  }else{
    s.endo = "none";
    const mapped = pulpSelectionToState(pulpDetailLevel, value);
    s.pulpDx = mapped.pulpDx;
    s.pulpLatin = mapped.pulpLatin;
  }
}

function getApicalDxOptions(): { value: string; label: string }[]{
  return Array.from(VALID_APICAL_DX).map(v => ({ value: v, label: t("apicalDx." + kebabToCamel(v)) }));
}
/** Die Wurzeln einer Position als Auswahl, mit einem leeren ersten Eintrag -
 *  "welche, ist noch nicht gesagt" ist ein zulaessiger Zustand. */
function getRootOptions(toothNo: number | null): { value: string; label: string }[]{
  const wurzeln = toothNo ? rootsOf(toothNo) : [];
  return [{ value: "", label: t("root.unspecified") }]
    .concat(wurzeln.map(w => ({ value: w, label: t("root." + kebabToCamel(w)) })));
}
function getRootFractureOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ROOT_FRACTURE).map(v => ({ value: v, label: t("rootFracture.option." + kebabToCamel(v)) }));
}
function getRootPostOptions(isMilktooth: boolean): { value: string; label: string }[]{
  return optionsFor("rootPostType", { isMilktooth }).map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));
}
function getCrownFractureTypeOptions(): { value: string; label: string }[]{
  return ["none", "crack", "split", "fracture"].map(v =>
    ({ value: v, label: t("crownFractureType.option." + v) }));
}
function getOcclusalFunctionOptions(): { value: string; label: string }[]{
  return ["none", "premature", "interference", "overload"].map(v =>
    ({ value: v, label: t("occlusalFunction.option." + v) }));
}
function getCrownMarginTypeOptions(): { value: string; label: string }[]{
  return ["none", "overhang", "caries", "filling"].map(v =>
    ({ value: v, label: t("crownMarginType.option." + v) }));
}
function getCrownMarginSideOptions(): { value: string; label: string }[]{
  return [{ value: "", label: t("root.unspecified") }]
    .concat(["mesial", "distal", "buccal", "lingual"].map(v => ({ value: v, label: t("surface." + v) })));
}
function getRootResectionOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ROOT_RESECTION).map(v => ({ value: v, label: t("rootResection.option." + kebabToCamel(v)) }));
}
/** Bead odontogram-gry: 0 heisst NICHT BEURTEILT, nicht "keine Papille" -
 *  dieselbe Unterscheidung wie beim Sondieren, wo eine leere Stelle nicht
 *  null Millimeter heisst. */
function getEruptionOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ERUPTION_STAGE).map(v => ({ value: v, label: t("eruptionStage.option." + kebabToCamel(v)) }));
}
function getPapillaLossOptions(): { value: string; label: string }[]{
  return ["0", "1", "2", "3"].map(v => ({ value: v, label: t("papillaLoss.class." + v) }));
}
function getSensibilityOptions(): { value: string; label: string }[]{
  return Array.from(VALID_SENSIBILITY).map(v => ({ value: v, label: t("sensibility.option." + kebabToCamel(v)) }));
}
function getPercussionOptions(): { value: string; label: string }[]{
  return Array.from(VALID_PERCUSSION).map(v => ({ value: v, label: t("percussion.option." + kebabToCamel(v)) }));
}
function getResorptionOptions(): { value: string; label: string }[]{
  return Array.from(VALID_RESORPTION_TYPE).map(v => ({ value: v, label: t("resorption.type." + kebabToCamel(v)) }));
}
function getWearEdgeOptions(): { value: string; label: string }[]{
  return Array.from(VALID_WEAR_EDGE).map(v => ({ value: v, label: t("wearType." + v) }));
}
function getWearCervicalOptions(): { value: string; label: string }[]{
  return Array.from(VALID_WEAR_CERVICAL).map(v => ({ value: v, label: t("wearType." + v) }));
}
function getDiscolorationOptions(): { value: string; label: string }[]{
  return Array.from(VALID_DISCOLORATION).map(v => ({ value: v, label: t("discoloration." + v) }));
}

// SP14 Task 1: orthodontic axes foundation (additive; render lands in Task 2).
function getOrthoApplianceOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ORTHO_APPLIANCE).map(v => ({ value: v, label: t("ortho.appliance." + v) }));
}
function getOrthoDriftOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ORTHO_DRIFT).map(v => ({ value: v, label: t("ortho.drift." + v) }));
}
function getOrthoVerticalOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ORTHO_VERTICAL).map(v => ({ value: v, label: t("ortho.vertical." + v) }));
}
function getOrthoBracketSideOptions(): { value: string; label: string }[]{
  return Array.from(VALID_ORTHO_BRACKET_SIDE).map(v => ({ value: v, label: t("ortho.bracketSide." + v) }));
}

// SP11 Task 3: #bruxismRow visibility gate — aligned to the render gate
// (__renderActiveLayers' wearAllowed, ~line 1355) by requiring
// toothSubstrate === "natural" too; the row gate previously omitted it.
function wearRowAllowed(s: Any): boolean{
  return s?.toothSelection === "tooth-base" && s?.restorationType === "none" && s?.toothSubstrate === "natural";
}
export function __wearRowAllowedForTest(s: Record<string, unknown>): boolean {
  return wearRowAllowed(s);
}

// SP12: discoloration crown tint. Fill is NOT recorded by the SVG-fingerprint
// (collectActiveLayers captures id/opacity/cls only) — parity-safe. Applies to the
// natural crown of a permanent OR milk tooth (no restoration, natural substrate).
// Pulp diagnosis: TINT the drawn pulp instead of swapping in another shape.
//
// Dirk, 18.08.2026: "Ich habe keine Ahnung, wie das abgeleitet wird, aber
// einfacherweise musst du nur den gezeichneten Pulpa-Umriss anders einfaerben."
//
// Until then a diseased pulp showed `tooth-inflam-pulp` — a SEPARATE shape from
// the donor template, with flame sublayers. It never matched the pulp Dirk drew,
// which is what `tooth-healthy-pulp` carries, so the pulp changed SHAPE when a
// diagnosis was set. Tinting keeps his outline and says the diagnosis in colour,
// the same way SP12 says discoloration on the crown. Fill is not part of the
// SVG fingerprint (id/opacity/class only), so the tint itself is parity-safe —
// what does move the fingerprint is that `tooth-inflam-pulp` no longer switches
// on and `tooth-healthy-pulp` now stays on.
//
// Keyed on the LATIN subtype first, because it is the finer statement and
// Dirk asked for gangrene as its own reading; the AAE value is the fallback.
const PULP_TINT: Record<string, string> = {
  // AAE (pulpDx)
  "reversible-pulpitis": "#e8776a",
  "irreversible-pulpitis": "#b3241a",
  necrosis: "#8d7f72",
  // practical Latin (pulpLatin), where it says more than its AAE parent
  "hyperaemia-pulpae": "#e8776a",
  "pulpitis-acuta-serosa": "#c8352a",
  "pulpitis-acuta-purulenta": "#a81d14",
  "pulpitis-chronica-clausa": "#b3241a",
  "pulpitis-chronica-ulcerosa": "#b3241a",
  "pulpitis-chronica-hyperplastica": "#b3241a",
  "necrosis-pulpae": "#8d7f72",
  "gangraena-pulpae": "#5d5a4c",
};

// Wurzelbehandlung: die gezeichnete Pulpa bekommt die Farbe der Wurzelfuellung.
//
// Dirk, 18.08.2026: "Wurzelbehandlung: einfach die blassrosa Pulpa durch die
// Farbe fuer die Wurzelfuellung ersetzen, oder?" - Die Werte sind aus den
// Ebenen des Templates abgelesen, nicht gewaehlt, damit die getoente Pulpa und
// die Endo-Zeichnung darueber dieselbe Farbe haben.
const ENDO_TINT: Record<string, string> = {
  "endo-medical-filling": "#ffffff",       // medikamentoese Einlage
  "endo-filling": "#388aca",               // Wurzelfuellung
  "endo-filling-incomplete": "#388aca",    // unvollstaendig - dieselbe Farbe, die Ebene sagt es
  "endo-glass-pin": "#c8c9c9",             // Glasfaserstift
  "endo-metal-pin": "#3951a3",             // Metallstift
};

/** The colour the drawn pulp is filled with, or "" when it is untreated and
 *  healthy. A treated tooth wins over a diagnosis: it has no vital pulp. */
function pulpTint(s: Any): string {
  { const eff = effectiveEndo(s); if(eff !== "none") return ENDO_TINT[eff] || ENDO_TINT["endo-filling"]; }
  if(s?.pulpLatin && s.pulpLatin !== "none" && PULP_TINT[s.pulpLatin]) return PULP_TINT[s.pulpLatin];
  if(s?.pulpDx && s.pulpDx !== "normal") return PULP_TINT[s.pulpDx] || PULP_TINT["irreversible-pulpitis"];
  return "";
}
export function __pulpTintForTest(s: Record<string, unknown>): string { return pulpTint(s); }

const DISCOLORATION_TINT: Record<string, string> = {
  tetracycline: "#9c8f7a", fluorosis: "#d9c9a3", nonvital: "#a89a8a", extrinsic: "#c2a86a", other: "#b5a894",
};
function discolorationAllowed(s: Any): boolean {
  return (s?.toothSelection === "tooth-base" || s?.toothSelection === "milktooth")
    && s?.restorationType === "none" && s?.toothSubstrate === "natural";
}
export function __discolorationAllowedForTest(s: Record<string, unknown>): boolean { return discolorationAllowed(s); }
// SP12 Task 3: named alias for the #discolorationRow visibility-gate test seam
// (mirrors __wearRowAllowedForTest); same underlying predicate as the render
// gate above — the row's visibility must never contradict the chart.
export function __discolorationRowAllowedForTest(s: Record<string, unknown>): boolean { return discolorationAllowed(s); }

// SP14: orthodontic glyphs (appliance/drift/vertical/rotation) — gated to a
// present natural tooth (permanent or milk), same shape as discolorationAllowed
// above minus the restoration/substrate constraints (ortho hardware can sit on
// a restored tooth). ONE shared predicate reused by the Task 3 UI picker and
// the Task 4 whole-mouth summary (SP9/10/11 lesson: don't fork the gate).
function orthoAllowed(s: Any): boolean {
  return s?.toothSelection === "tooth-base" || s?.toothSelection === "milktooth";
}
export function __orthoAllowedForTest(s: Record<string, unknown>): boolean { return orthoAllowed(s); }
// SP14 Task 3: named alias for the #orthoCard visibility-gate test seam
// (mirrors __discolorationRowAllowedForTest); same underlying predicate as
// the render gate above — the card's visibility must never contradict the
// chart.
export function __orthoCardAllowedForTest(s: Record<string, unknown>): boolean { return orthoAllowed(s); }

function getPeriImplantOptions(): { value: string; label: string }[]{
  return Array.from(VALID_PERI_IMPLANT).map(v => ({ value: v, label: t("periImplant." + kebabToCamel(v)) }));
}

function getImplantPositionOptions(): { value: string; label: string }[]{
  return ["center", "mesial", "distal", "both"].map(v => ({ value: v, label: t("implantPosition." + v) }));
}

// Pure mutation for #periImplantSelect's change handler — mirrors
// applyRestorationSelection's role/shape and __applyRestorationSelectionForTest.
function applyPeriImplantSelection(s: Any, value: string){
  s.periImplant = value;
}

/** TEST-ONLY: apply a #periImplantSelect value to a state object, exactly as
 *  the change handler does. Not part of the public API. */
export function __applyPeriImplantSelectionForTest(s: Record<string, unknown>, value: string): void {
  applyPeriImplantSelection(s, value);
}

// SP7 (fixed post-review): symmetrically set the 8 flame sublayers (and their
// "-N1" variants) of the tooth-inflam-pulp / milktooth-inflam-pulp group to
// `active`. The mild (reversible) tier turns them OFF, every other diseased
// tier turns them ON. Must be called unconditionally on every diseased-pulp
// render — the live app reuses one persistent SVG DOM node per tooth, so a
// one-directional (deactivate-only) helper left the flames stuck off after a
// mild render even when a later render is full-severity. Missing ids no-op
// (setActive tolerates null), so teeth without the full set are unaffected.
function setPulpInflamPaths(svg: Any, active: boolean){
  for(let n = 1; n <= 8; n++){
    setActive(svgGetById(svg, "pulp-inflam-path-" + n), active);
    setActive(svgGetById(svg, "pulp-inflam-path-" + n + "1"), active);
  }
}

// ---- SVG apply logic ----
let clipNsZaehler = 0;

function applyStateToSvgSingle(toothNo: Any, svg: Any, state: Any = toothState.get(toothNo)){
  if(!state || !svg) return;

  // 0) Start from a clean baseline: turn OFF all switchables, then apply ON flags.
  // (Base stays as in SVG; we don't toggle #base)
  const switchable = ["mods","tooth-variants","endos","surfaces","restorations","tooth"];
  for(const gId of switchable){
    const g = svgGetById(svg, gId);
    if(!g) continue;
    // Keep group itself active; we toggle children by id
    // But for simplicity, if group has data-active, keep at 1 so children can show.
    if(g.hasAttribute("data-active")) g.setAttribute("data-active","1");
  }

  // Turn OFF all known switchable layers (derived from the registry + fixed non-axis set).
  for (const id of allClearLayers()) setActive(svgGetById(svg, id), false);

  const hasCrown = state.restorationType !== "none";
  const brokenVariant = state.toothSubstrate === "broken" ? getBrokenCrownVariant(state) : null;
  const isImplant = state.toothSelection === "implant";
  const isMilktooth = state.toothSelection === "milktooth";
  const underGum = isUnderGum(state.toothSelection);
  const extraction = isExtraction(state.toothSelection) || (state.toothSelection === "none" && state.extractionWound);
  const hasRemovable = state.toothSelection === "none"
    && (state.prosthesis === "removable-partial" || state.prosthesis === "removable-full");
  const isNone = state.toothSelection === "none";
  const hasRestoration = hasCrown || hasRemovable;
  // Occlusal-view SVGs are the only templates carrying `*-onlay` layers; the
  // presence of one tells composeRestorationLayers to include occlusal-only types.
  const restorationView: "front" | "occlusal" = svg.querySelector('[id$="-onlay"]') ? "occlusal" : "front";

  const flagDeps = {
    setActive, svgGetById, isToothPresent, isUnderGum, isExtraction,
    fissureAllowedTeeth: FISSURE_ALLOWED, brokenVariants: BROKEN_VARIANTS,
  };
  applyFlagLayers(svg, state, buildFlagCtx(state, toothNo, flagDeps), flagDeps);

  // SP4 Task 2: resorptionType (enum) replaces the retired rootResorption
  // boolean. applyFlagLayers only auto-activates boolean-kind axes' svgLayer,
  // so this enum axis needs explicit activation here. Both "internal" and
  // "external-cervical" render the SAME endo-resorption layer (visually
  // identical; only the data model distinguishes them) — byte-identical to
  // the retired rootResorption:true render (same appliesWhen: toothPresent).
  if(state.resorptionType !== "none" && isToothPresent(state.toothSelection)){
    setActive(svgGetById(svg, "endo-resorption"), true);
  }

  // SP11: tooth wear (per location; reuses the two existing wear layers). Same
  // gate the retired booleans used (bruxismAllowed) so migrated legacy states
  // render byte-identically.
  const wearAllowed = state.toothSelection === "tooth-base" && state.restorationType === "none" && state.toothSubstrate === "natural";
  if(wearAllowed){
    if(state.wearEdge !== "none") setActive(svgGetById(svg, "tooth-bruxism-wear"), true);
    if(state.wearCervical !== "none") setActive(svgGetById(svg, "tooth-bruxism-neck-wear"), true);
  }

  // SP5 Task 2: rootCaries (enum) wires the previously-dormant `caries-root`
  // artwork layer (present since v2.5.0, but only in the 4 main-view templates
  // — 11/13/14/16 — never in the 2 occlusal templates, and never toggled by
  // any code until now). Same enum-explicit-activation pattern as
  // resorptionType above: applyFlagLayers only auto-activates boolean-kind
  // axes, so this enum axis (appliesWhen: toothPresent, mirrored from
  // src/registry/axes.ts) needs an explicit setActive here. Additionally
  // gated on restorationView === "front" (the same occlusal-vs-main-view
  // detection composeRestorationLayers uses, see :952) since the occlusal
  // templates carry no caries-root artwork at all — svgGetById would return
  // null there and setActive is a no-op on null, but the explicit gate keeps
  // intent clear and matches the brief.
  if(state.rootCaries !== "none" && isToothPresent(state.toothSelection) && restorationView === "front"){
    const rootEl = svgGetById(svg, "caries-root") as SVGElement | null;
    setActive(rootEl, true);
    // SP6 Task 3: severity-based opacity, same style.opacity mechanism as the
    // caries-surface / subcaries opacity above. `active-cavitated` is the most
    // severe (fully opaque); `active` is the least severe (most translucent).
    // Simple-mode "present" is stored canonically as `active-cavitated` (see
    // rootCariesOptions), so it renders at full opacity like severity mode's
    // most-severe option.
    if(rootEl){
      rootEl.style.opacity = state.rootCaries === "active" ? "0.5"
        : state.rootCaries === "arrested" ? "0.7"
        : "1";
    }
  }

  // SP8: peri-implant disease (implants only). mucositis = soft-tissue inflammation
  // (reuse the existing `parodontal` gum glyph); peri-implantitis adds crestal bone
  // loss at severity-scaled opacity. Set both the active flag and opacity every
  // render (the live app reuses one SVG DOM node per tooth — SP7 lesson).
  if(isImplant && state.periImplant !== "none"){
    setActive(svgGetById(svg, "parodontal"), true);
    const boneEl = svgGetById(svg, "peri-implant-bone-loss") as SVGElement | null;
    const boneOpacity = state.periImplant === "peri-implantitis-mild" ? "0.4"
      : state.periImplant === "peri-implantitis-moderate" ? "0.7"
      : state.periImplant === "peri-implantitis-severe" ? "1"
      : ""; // mucositis → no bone loss
    setActive(boneEl, boneOpacity !== "");
    if(boneEl && boneOpacity !== "") boneEl.style.opacity = boneOpacity;
  }

  // SP4 Task 3: pulpDx (enum) replaces the retired pulpInflam boolean. Any
  // non-"normal" pulpDx value is clinically "diseased pulp" for rendering
  // purposes — the same single condition the old boolean encoded — so a
  // plain boolean gate here is byte-identical to the retired render. The
  // bespoke milktooth/permanent split + showHealthyPulp gating below is
  // otherwise unchanged.
  // AUCH die lateinische Achse. `pulpLatin` traegt dieselbe Aussage wie
  // `pulpDx`, nur in der Vokabel, die der Detailgrad `latin` anbietet - und sie
  // fehlte hier. Mit ausgeschaltetem Pulpa-Schalter verschwand deshalb eine
  // Pulpa, an der `Gangraena pulpae` befundet war: die FAERBUNG kannte
  // `pulpLatin` (sie hat einen eigenen Ton dafuer), die SICHTBARKEIT nicht.
  // Dirk, 18.08.2026, Bead odontogram-dl1: "Erst wenn eine Behandlung befundet
  // ist, muss sie immer dargestellt sein." Eine Diagnose ist ein Befund, und in
  // welcher Sprache sie gestellt wurde, darf daran nichts aendern.
  const pulpDiseased = state.pulpDx !== "normal"
    || (!!state.pulpLatin && state.pulpLatin !== "none" && state.pulpLatin !== "pulpa-sana");

  // SP7: reversible pulpitis (and its Latin equivalent, hyperaemia pulpae) is a
  // mild, reversible state — render a reduced glyph (the base inflamed-pulp
  // shape without the flame sublayers). Every other diseased state renders the
  // full glyph, as before. Checking both fields keeps this correct in aae and
  // latin modes regardless of the Latin->AAE parent mapping.
  const pulpTierMild = state.pulpDx === "reversible-pulpitis" || state.pulpLatin === "hyperaemia-pulpae";
  // SP7: a root-treated tooth has no vital pulp — its endo artwork represents
  // the canal, so suppress both pulp glyphs.
  const endoTreated = effectiveEndo(state) !== "none";

  // base visibility toggle
  setActive(svgGetById(svg, "base"), showBase);

  // 1) Tooth selection
  setActive(svgGetById(svg, "implant"), isImplant);
  setActive(svgGetById(svg, "milktooth"), isMilktooth);

  if(isImplant){
    setActive(svgGetById(svg, "implant-base"), true);
    // Implantatposition: shift the implant group mesial/distal. It carries its
    // own matrix (implantate.py, "senkrecht+mittig"); we PREPEND a translate so
    // that matrix is untouched. Captured once so re-renders don't accumulate.
    // "both" stays centred here — the single template implant can't split; the
    // schematic draws two. Transform is not in the SVG fingerprint → parity-safe.
    const implG = svgGetById(svg, "implant") as SVGGraphicsElement | null;
    if(implG){
      const baseTf = implG.getAttribute("data-impl-base-tf")
        ?? (implG.setAttribute("data-impl-base-tf", implG.getAttribute("transform") ?? ""), implG.getAttribute("transform") ?? "");
      const pos = state.implantPosition ?? "center";
      const q = Math.floor(toothNo / 10);
      const upper = q === 1 || q === 2;
      const mesialRight = q === 1 || q === 4;          // mesial toward midline = +x on screen
      const screenDir = pos === "mesial" ? (mesialRight ? 1 : -1)
        : pos === "distal" ? (mesialRight ? -1 : 1) : 0;
      const dx = (upper ? screenDir : -screenDir) * 8;  // lower jaw is rotate180 → invert x
      implG.setAttribute("transform", dx ? `translate(${dx} 0) ${baseTf}` : baseTf);
    }
  }else if(isMilktooth){
    setActive(svgGetById(svg, "milktooth-base"), true);
    setActive(svgGetById(svg, "milktooth-beauty"), true);
    // Die GEZEICHNETE Pulpa bleibt stehen, auch wenn sie krank ist - die
    // Diagnose sagt die Farbe (siehe PULP_TINT). `milktooth-inflam-pulp` wird
    // nicht mehr eingeblendet; es ist eine andere Form.
    if(showHealthyPulp || pulpDiseased || endoTreated){
      setActive(svgGetById(svg, "milktooth-healthy-pulp"), true);
    }
  }else if(isToothPresent(state.toothSelection)){
    if(state.toothSelection === "tooth-base"){
      setActive(svgGetById(svg, "tooth-base"), true);
      // Gloss only on an intact natural crown — not on broken/radix/prepared
      // substrates or a prosthetic restoration.
      setActive(svgGetById(svg, "tooth-base-beauty"), state.toothSubstrate === "natural" && state.restorationType === "none");
    }else{
      setActive(svgGetById(svg, state.toothSelection), true);
    }
    if(!underGum && !extraction){
      // Pulpa: a diseased-pulp glyph is suppressed on an endodontically treated
      // tooth (the endo artwork represents the filled canal). The healthy-pulp
      // glyph is unchanged (legacy behaviour — a treated tooth may still show it
      // under the endo layer).
      // Siehe oben beim Milchzahn: gezeichnete Pulpa behalten, Diagnose faerben.
      if(showHealthyPulp || pulpDiseased || endoTreated){
        setActive(svgGetById(svg, "tooth-healthy-pulp"), true);
      }
    }
  }
  if(brokenVariant && state.toothSelection === "tooth-base"){
    setActive(svgGetById(svg, "tooth-base"), false);
    setActive(svgGetById(svg, brokenVariant), true);
  }
  if(state.toothSubstrate === "radix" && state.toothSelection === "tooth-base"){
    setActive(svgGetById(svg, "tooth-base"), false);
    setActive(svgGetById(svg, "tooth-radix"), true);
  }
  // "Prepared for crown" is a substrate state on a permanent tooth: hide the
  // natural crown and show the crown-prep layer. Its properties mirror "broken".
  if(state.toothSubstrate === "crownprep" && state.toothSelection === "tooth-base"){
    setActive(svgGetById(svg, "tooth-base"), false);
    setActive(svgGetById(svg, "tooth-crownprep"), true);
  }
  if(state.toothSelection === "none" && state.extractionWound){
    setActive(svgGetById(svg, "no-tooth-after-extraction"), true);
  }

  // SP12: discoloration — tint the shown natural crown's fill. Symmetric: reset
  // BOTH crown paths every render so a reused per-tooth node never keeps a stale
  // tint (permanent<->milk switch, or cleared). Fill isn't fingerprinted (parity-safe).
  //
  // IMPORTANT: each crown path carries its base color ONLY as an inline `style`
  // attribute baked into the SVG asset (e.g. tooth-base: "fill: #ebebeb; ...";
  // milktooth-base: "fill: #fff; ..."); no CSS rule supplies it. Setting
  // `el.style.fill = ""` DELETES the inline `fill` longhand (CSSOM), it does NOT
  // revert to the asset's original color — the crown falls back to the SVG
  // initial value (black). Since this block runs on every render and
  // `discoloration` defaults to "none", clearing to "" would blacken every
  // tooth's crown on first render. Instead, capture each element's own
  // asset-original fill ONCE (this block is the sole writer of these elements'
  // `.style.fill` — verified via grep) and restore THAT on every non-tinted
  // render. The capture is stashed in a `data-base-fill` attribute so it
  // survives the reused-node lifecycle; that attribute is not part of the
  // parity fingerprint (collectActiveLayers only reads id/opacity/class).
  {
    const tintOn = discolorationAllowed(state) && state.discoloration !== "none";
    const tint = tintOn ? (DISCOLORATION_TINT[state.discoloration] || "") : "";
    const activeId = state.toothSelection === "milktooth" ? "milktooth-base" : "tooth-base";
    for(const id of ["tooth-base", "milktooth-base"]){
      const el = svgGetById(svg, id) as SVGElement | null;
      if(!el) continue;
      if(el.getAttribute("data-base-fill") === null){
        el.setAttribute("data-base-fill", el.style.fill || "");
      }
      const base = el.getAttribute("data-base-fill") || "";
      el.style.fill = (tintOn && id === activeId) ? tint : base;
    }
  }

  // Laufende Nummer fuer die Beschnitt-ids, siehe unten.
  // (Modulweit, damit zwei Odontogramme im selben Dokument sich nicht ins
  // Gehege kommen.)
  // BESCHNITT: nichts darf ueber den Zahn hinausragen.
  //
  // Dirk, 18.08.2026, an 46 mit einer OD-Fuellung: "Das ist leider komplett
  // druebergezeichnet." Die okklusale Fuellungsflaeche misst dort 44,9
  // Einheiten bei einer Krone von 36,3 - das Verformungsfeld zieht an genau
  // diesem Template das gesamte Zahninnere 25 Prozent zu breit (gemessener
  // Median 1,25 gegen 0,99-1,08 bei allen anderen fuenfzehn; Ursache noch
  // offen, eigener Bead). Bis die Ursache gefunden ist, haelt der Beschnitt
  // die Fuellung im Zahn.
  //
  // Er ist aber nicht nur ein Notbehelf: eine Fuellung KANN nicht ueber die
  // Zahnoberflaeche hinausreichen, und eine Pulpa auch nicht. Deshalb wird auf
  // die GERADE GEZEIGTE Form beschnitten - damit bleibt die Pulpa auch beim
  // praeparierten Zahn geschlossen, wo sie bisher herausschaute ("Die Pulpa
  // muss geschlossen bleiben"), und ebenso bei `broken` und `radix`.
  //
  // clip-path ist weder id noch opacity noch class - der Fingerabdruck sieht
  // es nicht, der Beschnitt ist parity-frei.
  {
    const shownId = isImplant ? "implant-base"
      : isMilktooth ? "milktooth-base"
      : state.toothSubstrate === "radix" && state.toothSelection === "tooth-base" ? "tooth-radix"
      : state.toothSubstrate === "crownprep" && state.toothSelection === "tooth-base" ? "tooth-crownprep"
      : brokenVariant && state.toothSelection === "tooth-base" ? brokenVariant
      : "tooth-base";
    const shape = svgGetById(svg, shownId) as Any;
    const d = shape?.getAttribute?.("d") || "";
    let clipId = "";
    if(d){
      // Ein <clipPath> je gezeigter Form, in <defs> abgelegt und
      // wiederverwendet: der Knoten wird bei jedem Rendern erneut besucht, und
      // fuer jeden Zustand einen neuen anzulegen liesse sie sich anhaeufen.
      // Die id muss JE ZAHN eindeutig sein. Alle 32 Zaehne stehen in EINEM
      // Dokument, und `url(#clip-tooth-base)` greift dann bei jedem den
      // erstbesten - also die Form eines fremden Zahns. Genau dieselbe Falle,
      // gegen die `namespacePaintServers` die Gradienten schuetzt; der
      // Beschnitt entsteht erst beim Rendern und lief daran vorbei.
      let ns = svg.getAttribute("data-clip-ns");
      if(!ns){ ns = String(++clipNsZaehler); svg.setAttribute("data-clip-ns", ns); }
      clipId = `clip-${ns}-${shownId}`;
      let defs = svg.querySelector("defs");
      if(!defs){
        defs = svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.insertBefore(defs, svg.firstChild);
      }
      let cp = svg.querySelector(`#${clipId}`) as Any;
      if(!cp){
        cp = svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        cp.setAttribute("id", clipId);
        cp.appendChild(svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path"));
        defs.appendChild(cp);
      }
      (cp.firstChild as Any)?.setAttribute?.("d", d);
    }
    for(const el of Array.from(svg.querySelectorAll("[id]")) as Any[]){
      const id = el.getAttribute("id") || "";
      if(!/^(filling-|caries-|subcaries-|defect-)/.test(id)
         && id !== "tooth-healthy-pulp" && id !== "milktooth-healthy-pulp") continue;
      if(clipId) el.setAttribute("clip-path", `url(#${clipId})`);
      else el.removeAttribute("clip-path");
    }
  }

  // Die Pulpa nach der Diagnose faerben - dieselbe Bauart wie die Verfaerbung
  // darueber, einschliesslich des capture-once in `data-base-pulpfill`: ein
  // leerer `style.fill` wuerde die Farbe aus dem Asset LOESCHEN und die Pulpa
  // schwarz machen, nicht zuruecksetzen. Die Ebene ist am Schneidezahn ein
  // <path> und am Molaren eine <g> mit mehreren Pfaden, also werden alle
  // zeichnenden Nachkommen mitgenommen.
  {
    const tint = pulpTint(state);
    for(const id of ["tooth-healthy-pulp", "milktooth-healthy-pulp"]){
      const wurzel = svgGetById(svg, id) as SVGElement | null;
      if(!wurzel) continue;
      const teile: SVGElement[] = wurzel.tagName?.toLowerCase() === "g"
        ? Array.from(wurzel.querySelectorAll("path, circle, ellipse, polygon, rect")) as Any
        : [wurzel];
      for(const el of teile){
        if(el.getAttribute("data-base-pulpfill") === null){
          el.setAttribute("data-base-pulpfill", el.style.fill || "");
        }
        el.style.fill = tint || (el.getAttribute("data-base-pulpfill") || "");
      }
    }
  }

  // SP14: orthodontic glyphs (dormant since v2.5.0). Explicit + symmetric; null-guarded
  // (occlusal templates lack ring/bracket/up/down — 4 of the 7 ids — so every lookup
  // must be guarded). Gate: present natural tooth (orthoAllowed, shared w/ Task 3/4).
  //
  // extrusion/intrusion <-> arrow-up/arrow-down binding (verified from 11.svg geometry,
  // viewBox "0 0 39.2 62.7"): the crown/incisal edge sits at LARGER y (e.g. crown-needed
  // spans y~34.5-61, near the bottom of the 62.7-tall canvas) and the root/apex at
  // SMALLER y. Group "arrow-up" has its 2-line chevron vertex (tip) at y~60.2-60.3 with
  // the shaft's tail at y~53.6 — tip toward LARGER y (incisal edge) => this glyph visually
  // points toward the crown => extrusion. Group "arrow-down" has its chevron vertex at
  // y~54.5-54.7 with the shaft's tail at y~61.2 — tip toward SMALLER y (apex) => this
  // glyph visually points toward the root => intrusion. (The layer *ids* arrow-up/
  // arrow-down don't literally match their visual direction; binding by drawn geometry,
  // not by id text, per Step 1's instruction.)
  {
    const ok = orthoAllowed(state);
    const set = (id: string, on: boolean) => { const el = svgGetById(svg, id); if(el) setActive(el, on); };
    set("ortho-bracket", ok && state.orthoAppliance === "bracket");
    set("ortho-ring",    ok && state.orthoAppliance === "band");
    set("arrow-mesial",  ok && state.orthoDrift === "mesial");
    set("arrow-distal",  ok && state.orthoDrift === "distal");
    set("arrow-up",      ok && state.orthoVertical === "extrusion");
    set("arrow-down",    ok && state.orthoVertical === "intrusion");
    set("arrow-rotation",ok && state.orthoRotation === true);
  }

  // 2) Mods — periapical glyph.
  // SP4 Task 4: on a PRESENT tooth the `apicalDx` clinical axis (not
  // `mods.inflammation`) drives the periapical glyph. On a NON-present tooth
  // (missing / implant) `mods.inflammation` retains its SECOND, PERIODONTAL
  // role and still drives the glyph exactly as before — the label switches to
  // "periodontal inflammation" in updateInflammationSection, but the glyph is
  // unchanged. This split is byte-identical to the pre-rewrite single block:
  // migration derives apicalDx from a present tooth's legacy mods.inflammation
  // (and strips that mod), while a non-present tooth keeps mods.inflammation
  // with apicalDx left at "normal". `periapicalType` still selects the lesion
  // subtype glyph; when it is unset, apicalDx suggests abscess-vs-granuloma.
  // SP8: an implant no longer shows the periapical (apical-lesion) glyph — its
  // inflammation is expressed via the periImplant axis. Missing / extraction-socket
  // teeth keep the mods.inflammation-driven periapical/residual glyph (SP4).
  const periapicalGlyphActive = isToothPresent(state.toothSelection)
    ? state.apicalDx !== "normal"
    : (state.toothSelection === "implant" ? false : state.mods.has("inflammation"));
  if(periapicalGlyphActive){
    // The `inflammation` container group is the glyph's parent; collectActiveLayers
    // hides any child whose ancestor is inactive. On the non-present path it is
    // already activated by applyFlagLayers via the `mods.inflammation` set entry;
    // on the present (apicalDx) path — where migration has stripped that mod —
    // we must activate the group here so the glyph is not hidden. Idempotent when
    // both fire, so the collected layers stay byte-identical to the old render.
    setActive(svgGetById(svg, "inflammation"), true);
    const glyph = state.periapicalType === "cyst" ? "cysta"
      : (state.periapicalType === "abscess"
          || state.apicalDx === "acute-apical-abscess"
          || state.apicalDx === "chronic-apical-abscess") ? "abscess"
      : "granuloma"; // default incl. "none" and "granuloma"
    setActive(svgGetById(svg, glyph), true);
  } else if(isImplant){
    // SP8: applyFlagLayers (the generic mods-set pass) unconditionally activates
    // the shared "inflammation" container for ANY tooth carrying a legacy/imported
    // `mods.inflammation` entry, independent of periapicalGlyphActive above. Since
    // an implant's periapical glyph is retired (finding now expressed via
    // periImplant), explicitly retire the container too, so a stray implant
    // mods.inflammation entry renders no glyph at all instead of an orphaned
    // empty-of-children-but-active "inflammation" group.
    setActive(svgGetById(svg, "inflammation"), false);
  }
  // SP15 wholebranch fix: mobilityRowHidden() also hides the mobility control
  // on an implant (osseointegrated, no PDL) — gate the render the same way.
  // The stored value is deliberately left untouched (T1's choice), just not
  // drawn/summarized on an implant.
  // Bead odontogram-7xl: die Lockerung wird NICHT MEHR GEZEICHNET, sondern als
  // roemische Ziffer an die Kachel geschrieben - siehe `updateToothMobilityMark`.
  //
  // Der Anlass war Dirks Frage nach der Darstellung ("Mir faellt nichts ein, wie
  // man Lockerung sonst graphisch darstellen koennte"), der Grund ist beim
  // Nachsehen dazugekommen: die Gruppe `mobility` hat GENAU ZWEI Kinder,
  // `tooth-mobility-1` und `-2`, und beide standen immer auf aktiv. Die Gruppe
  // wurde als Ganzes eingeschaltet, unabhaengig vom Grad - M1, M2 und M3 haben
  // also seit jeher DASSELBE Bild gezeichnet. Der Grad war nie zu sehen.
  //
  // Eine Ziffer kann, was die Zeichnung nicht konnte.

  // 3) Endo exclusivity (only if tooth present)
  if(isToothPresent(state.toothSelection) && !underGum && !extraction){
    const eff = effectiveEndo(state);
    if(eff === "endo-medical-filling"){
      setActive(svgGetById(svg, "endo-medical-filling"), true);
    } else if(eff === "endo-filling"){
      setActive(svgGetById(svg, "endo-filling"), true);
    } else if(eff === "endo-filling-incomplete"){
      setActive(svgGetById(svg, "endo-filling-incomplete"), true);
    }
    const post = effectiveRootPostType(state);
    setActive(svgGetById(svg, "endo-glass-pin"), post === "glass-fiber");
    setActive(svgGetById(svg, "endo-metal-pin"), post === "metal");
  }

  // A typed crown-margin finding (charly überstehend/Karies/Füllung) lights the
  // same anatomical `crown-leakage` slab the boolean crownLeakage axis drives —
  // so the finding shows anatomically; its TYPE and SIDE live in the Schema view
  // and the tooltip. Runs AFTER the registry svgLayer pass, which would have set
  // the slab inactive when crownLeakage itself is false.
  if(state.crownMarginType && state.crownMarginType !== "none" && crownMarginAllowed(state)){
    setActive(svgGetById(svg, "crown-leakage"), true);
  }

  // 4) Removable prosthesis
  if(hasRemovable){
    setActive(svgGetById(svg, "prosthesis"), true);
    setActive(svgGetById(svg, "prosthesis-crown"), true);
    setActive(svgGetById(svg, "prosthesis-connector"), true);
  }

  // Implant attachments (healing-abutment / locator / bar) — SP3b: render off the
  // dedicated `prosthesis` axis (field-move from the legacy `crownMaterial`,
  // byte-identical to the pre-move layer sets). Fixed implant crowns/bridges
  // (Task 3) are first-class in the restoration model: only the connector is
  // implant-specific here — the crown/bridge material layers themselves flow
  // through the shared restoration composition below (same as non-implant teeth).
  if(isImplant){
    if(state.prosthesis === "healing-abutment"){
      setActive(svgGetById(svg, "implant-healing-abutment"), true);
    } else if(state.restorationType === "crown" || state.restorationType === "bridge"){
      setActive(svgGetById(svg, "implant-connector"), true);
    } else if(state.prosthesis === "locator"){
      setActive(svgGetById(svg, "restorations"), true);
      setActive(svgGetById(svg, "implant"), true);
      setActive(svgGetById(svg, "implant-connector"), true);
      setActive(svgGetById(svg, "implant-locator-screw"), true);
    } else if(state.prosthesis === "locator-denture"){
      setActive(svgGetById(svg, "restorations"), true);
      setActive(svgGetById(svg, "implant"), true);
      setActive(svgGetById(svg, "implant-connector"), true);
      setActive(svgGetById(svg, "implant-locator-screw"), true);
      setActive(svgGetById(svg, "prosthesis-implant"), true);
      setActive(svgGetById(svg, "prosthesis-implant-crown"), true);
      setActive(svgGetById(svg, "prosthesis-implant-gum"), true);
    } else if(state.prosthesis === "bar"){
      setActive(svgGetById(svg, "restorations"), true);
      setActive(svgGetById(svg, "implant"), true);
      setActive(svgGetById(svg, "implant-connector"), true);
      setActive(svgGetById(svg, "implant-locator-screw"), true);
      setActive(svgGetById(svg, "implant-bar"), true);
    } else if(state.prosthesis === "bar-denture"){
      setActive(svgGetById(svg, "restorations"), true);
      setActive(svgGetById(svg, "implant"), true);
      setActive(svgGetById(svg, "implant-connector"), true);
      setActive(svgGetById(svg, "implant-locator-screw"), true);
      setActive(svgGetById(svg, "implant-bar"), true);
      setActive(svgGetById(svg, "prosthesis-implant"), true);
      setActive(svgGetById(svg, "prosthesis-implant-crown"), true);
      setActive(svgGetById(svg, "prosthesis-implant-gum"), true);
    }
  }
  if(isNone){
    setActive(svgGetById(svg, "restorations"), true);
    // Removable/bar prosthesis on a gap — SP3b: render off `prosthesis` (field-move
    // from the legacy `bridgeUnit`). Fixed bridge values flow through the
    // composition below. Note this branch's layer set intentionally differs from
    // the isImplant "bar"/"bar-denture" branch above (no connector/locator-screw
    // on a gap tooth) — matches the pre-move `bridgeUnit` render exactly.
    if(state.prosthesis === "bar"){
      setActive(svgGetById(svg, "implant"), true);
      setActive(svgGetById(svg, "implant-bar"), true);
    } else if(state.prosthesis === "bar-denture"){
      setActive(svgGetById(svg, "implant"), true);
      setActive(svgGetById(svg, "implant-bar"), true);
      setActive(svgGetById(svg, "prosthesis-implant"), true);
      setActive(svgGetById(svg, "prosthesis-implant-crown"), true);
      setActive(svgGetById(svg, "prosthesis-implant-gum"), true);
    }
  }

  // Restoration composition (crown / inlay / onlay / veneer / bridge × material).
  // composeRestorationLayers is the single source of truth for which SVG layer
  // ids activate; the chosen material's wrapper <g> is turned on so its children
  // (cleared to off in the clear-set) become visible. `restorations` stays on.
  if(state.restorationType !== "none" && state.restorationMaterial !== "none"){
    const wrapper = RESTORATION_WRAPPER_GROUP[state.restorationMaterial];
    const ids = composeRestorationLayers(state.restorationType, state.restorationMaterial, restorationView);
    if(wrapper && ids.length){
      setActive(svgGetById(svg, "restorations"), true);
      setActive(svgGetById(svg, wrapper), true);
      for(const id of ids) setActive(svgGetById(svg, id), true);
    }
  }

  // 5) Surfaces
  if(!isImplant && !underGum && !extraction && state.toothSelection !== "none"){
    // Caries: if any restoration active => disable surface caries (except subcrown allowed)
    for(const id of state.caries){
      if(id === "caries-subcrown"){
        if(hasCrown){
          setActive(svgGetById(svg, "caries-subcrown"), true);
        }
        continue;
      }
      if(hasRestoration || hasCrown) continue;
      // SP6 Task 1: per-surface caries STATE MACHINE. A caried surface is either
      // PRIMARY caries (no filling) or RECURRENT/secondary caries (a filling on
      // the same surface). Recurrence is DERIVED from the filling — never a
      // separate stored flag — so a surface is NEVER both `caries-X` and
      // `subcaries-X`. The single `state.cariesSeverity` score (default 2) is
      // read as CARS when a filling is present and as ICDAS otherwise.
      const surface = id.replace("caries-", ""); // e.g. caries-mesial -> mesial
      const hasFilling = state.fillingSurfaceMaterials.has(surface);
      const sev = state.cariesSeverity.get(surface) ?? 2; // ICDAS-2 / CARS-2 representative
      if(hasFilling){
        // Recurrent path: the `subcaries-{surface}` layer, opacity encodes the
        // CARS score (score 1 -> 0.30 … score 6 -> 1.0). The primary
        // `caries-{surface}` layer is deliberately NOT activated here.
        const subEl = svgGetById(svg, `subcaries-${surface}`) as SVGElement | null;
        setActive(subEl, true);
        if(subEl && sev > 0){
          const carsOpacity = 0.30 + ((sev - 1) / 5) * 0.70;
          subEl.style.opacity = String(Math.round(carsOpacity * 100) / 100);
        }
      }else{
        const surfEl = svgGetById(svg, id) as SVGElement | null;
        setActive(surfEl, true);
        // Primary caries depth: opacity encodes the ICDAS depth; "deep" recolors
        // the contour. SP5 Task 5: the whole depth-tier encoding is gated by the
        // `cariesDepthEnabled` setting — with it OFF, caried surfaces render at
        // the SVG default (no opacity/contour tier). Default ON = unchanged.
        if(surfEl && cariesDepthEnabled){
          const tier = icdasTier(sev);
          surfEl.style.opacity = tier === 3 ? "1" : tier === 2 ? "0.7" : "0.45";
          surfEl.classList.toggle("caries-deep", tier === 3);
        }
      }
    }

    // Fillings: each surface rendered with its own material
    if(state.fillingSurfaceMaterials.size > 0 && !hasCrown){
      for(const [s, mat] of state.fillingSurfaceMaterials){
        setActive(svgGetById(svg, `filling-${mat}-${s}`), true);
      }
    }

    // SP10: per-surface filling defect — activate the (already-present, dormant)
    // defect-{surface} marker on a filled surface with a recorded defect. Generic
    // marker (type lives in the data / summary), no opacity. Independent of
    // secondary caries (both may be active on the same surface).
    if(state.fillingDefect && state.fillingDefect.size > 0 && !hasCrown){
      for(const [s, val] of state.fillingDefect){
        if(val && val !== "none" && state.fillingSurfaceMaterials.has(s)){
          setActive(svgGetById(svg, `defect-${s}`), true);
        }
      }
    }

  }

  // Periapical inflammation lives in the `mods` group, which paints beneath the
  // `tooth` group — so an active endo-resection or endo-resorption layer (both
  // inside `tooth`) would cover the glyph. ONLY when inflammation coincides with
  // one of those two layers, lift the inflammation group to the end of the SVG
  // so the glyph stays on top; in every other case keep its original position.
  const inflammation = svgGetById(svg, "inflammation");
  if(inflammation){
    if(!inflammationHome.has(inflammation) && inflammation.parentElement){
      inflammationHome.set(inflammation, { parent: inflammation.parentElement, next: inflammation.nextSibling });
    }
    const resectionActive = state.endoResection && isToothPresent(state.toothSelection) && !underGum && !extraction;
    const resorptionActive = state.resorptionType !== "none" && isToothPresent(state.toothSelection);
    // SP4 Task 4: the lift now keys off the SAME `periapicalGlyphActive`
    // predicate that gates the glyph render above (was `mods.inflammation`).
    // Both resection/resorption are toothPresent-gated, so this reduces to
    // `apicalDx !== "normal"` on a present tooth — byte-identical to the old
    // `mods.inflammation` gate after migration moves that lesion into apicalDx.
    const lift = (resectionActive || resorptionActive) && periapicalGlyphActive;
    if(lift){
      // Move inflammation to the END of the `tooth` group's own parent, so it
      // paints in front of the whole tooth group (including the endo-resection /
      // endo-resorption layers, and the `endos` root-filling group that usually
      // accompanies a resection). Using tooth's parent — not the svg root —
      // keeps the glyph inside the lower-tooth mirroring <g transform> wrapper,
      // so it stays correctly positioned.
      const toothGroup = svgGetById(svg, "tooth");
      const container = (toothGroup && toothGroup.parentElement) || svg;
      if(container.lastElementChild !== inflammation){
        container.appendChild(inflammation);
      }
    }else{
      const home = inflammationHome.get(inflammation);
      if(home && home.parent){
        const ref = home.next && home.next.parentElement === home.parent ? home.next : null;
        if(inflammation.parentElement !== home.parent || inflammation.nextSibling !== ref){
          home.parent.insertBefore(inflammation, ref);
        }
      }
    }
  }

  updateWarnings(state);
}

// R2-C Task 1: proposed-layer styling. In Plan mode, a layer that is active
// in the PLAN chart but NOT in the STATUS chart (a "plan add" — e.g. a crown
// proposed on a tooth that is sound in status) gets a distinct dashed+tinted
// look, so a plan reads as PROPOSED treatment rather than as-if-already-done
// findings. PARITY IS SACRED: `collectActiveLayers` (below) fingerprints only
// id/opacity/class, so this marking uses ONLY `style.strokeDasharray` +
// `style.stroke` — never `style.opacity` and never a CSS class — and the
// whole pass is gated on `chartMode === "plan" && planInitialized`, so
// status-mode rendering (including the parity capture, which always renders
// in status mode) is a byte-identical no-op.
const PROPOSED_DASH = "4 2";
const PROPOSED_TINT = "#5b7a9d";

/** Restore every previously-marked layer in `svg` to its captured base style,
 *  then drop the `data-proposed` marker. Runs FIRST on every
 *  `applyProposedStyling` call (symmetric reset — SP12 discoloration
 *  capture-once pattern, see the discoloration tint block above): this is
 *  what un-dashes a layer when switching plan -> status, or when a plan edit
 *  is reverted back to match status. */
function clearProposedStyling(svg: Any){
  const marked = svg.querySelectorAll ? svg.querySelectorAll('[data-proposed="1"]') : [];
  for(const el of Array.from(marked) as Any[]){
    if(el.getAttribute("data-base-dash") !== null){ el.style.strokeDasharray = el.getAttribute("data-base-dash") || ""; }
    if(el.getAttribute("data-base-pstroke") !== null){ el.style.stroke = el.getAttribute("data-base-pstroke") || ""; }
    el.removeAttribute("data-proposed");
  }
}

/** Mark `el` as a proposed (plan-only) layer: capture its base
 *  strokeDasharray/stroke ONCE (data-base-dash/data-base-pstroke — mirrors
 *  the SP12 `data-base-fill` pattern so a reused node's second render doesn't
 *  capture an already-tinted value as "base"), then apply the dashed+tint
 *  treatment. Neither captured/written attribute is part of the SVG
 *  fingerprint (`collectActiveLayers` reads only id/opacity/class). */
function markProposed(el: Any){
  if(el.getAttribute("data-proposed") === "1") return;
  if(el.getAttribute("data-base-dash") === null) el.setAttribute("data-base-dash", el.style.strokeDasharray || "");
  if(el.getAttribute("data-base-pstroke") === null) el.setAttribute("data-base-pstroke", el.style.stroke || "");
  el.style.strokeDasharray = PROPOSED_DASH;
  el.style.stroke = PROPOSED_TINT;
  el.setAttribute("data-proposed", "1");
}

/** Compute which of `svg`'s currently-active layers (already painted with
 *  the ACTIVE chart's state by the caller — see `applyStateToSvg`) are
 *  present in the PLAN chart but absent from the STATUS chart, and mark only
 *  those as "proposed". Always resets first (symmetric — see
 *  `clearProposedStyling`), then gates on Plan mode being active. The
 *  `charts.status.get(toothNo) ?? defaultState()` fallback is required: an
 *  absent status tooth passed as `undefined` makes `applyStateToSvgSingle`
 *  early-return, which would leave the clone showing the (already-painted)
 *  PLAN layers — collapsing statusIds to planIds and marking nothing. */
function applyProposedStyling(toothNo: Any, svg: Any){
  clearProposedStyling(svg);
  if(chartMode !== "plan" || !planInitialized) return;
  const planIds = new Set(collectActiveLayers(svg).map((l) => l.id));
  const clone = svg.cloneNode(true); // detached; getElementById/querySelectorAll work on the clone's own subtree
  applyStateToSvgSingle(toothNo, clone, charts.status.get(toothNo) ?? defaultState());
  const statusIds = new Set(collectActiveLayers(clone).map((l) => l.id));
  for(const id of planIds){
    if(statusIds.has(id)) continue;
    const el = svgGetById(svg, id);
    if(el) markProposed(el);
  }
}

/** TEST-ONLY: invoke `applyProposedStyling` directly on a detached, already-
 *  painted svg node (as returned by `__parseSvgForTest` + `__renderActiveLayersOnNode`),
 *  without requiring a live grid (`toothSvgRoot`/`applyStateToSvg` needs
 *  registered DOM roots — see addTile()). Reads the module's live
 *  `charts`/`chartMode`/`planInitialized`, exactly as the real
 *  `applyStateToSvg` roots loop does. Not part of the public API. */
export function __applyProposedStylingForTest(toothNo: Any, svg: Any): void {
  applyProposedStyling(toothNo, svg);
}

// ---- Bead odontogram-ap7: hatching what the patient arrived with ----
//
// PARITY IS SACRED, and this pass respects it the same way the proposed
// styling above does, through a different channel. `collectActiveLayers`
// fingerprints id/opacity/class only, so the marking uses ONLY `style.fill`
// (never opacity, never a class), and the `<pattern>` it points at lives in
// `<defs>`, which the fingerprint walk skips outright. The whole pass is also
// gated on an archived examination existing, and the parity fixtures archive
// none, so the capture is a byte-identical no-op.
//
// Fill is the right channel for a second reason: it is in neither the
// fingerprint NOR the tooth generator's frozen geometry digests,
// so hatching cannot disturb the generator's contracts either.
//
// It deliberately does not run in Plan mode. A tooth can carry a proposed
// finding, a pre-existing one and a discoloration tint at once, and three
// simultaneous treatments read as noise rather than as three facts. The plan
// is about the future and provenance about the past, so each owns the tooth in
// its own mode; discoloration is unaffected either way, since it tints
// `tooth-base`, which is anatomy and never a finding.

/** Hatch geometry, in template units (the drawings are ~40-80 units wide).
 *
 *  The marking has to be legible WITHOUT swallowing the colour underneath it —
 *  the colour is what says gold from amalgam from composite, and a hatch that
 *  costs the reader that has taken more than it gave. Line over pitch is the
 *  ink budget: 0.45 of 3.2 covers about 14% of the area, and the half-opaque
 *  line halves that again, so roughly 7% of the finding is actually painted
 *  over. Wide and faint reads as a texture; narrow and solid reads as a
 *  repaint. */
const PREEXIST_PITCH = 3.2;
const PREEXIST_STROKE = 0.45;
const PREEXIST_LINE_OPACITY = "0.5";

/** Shape elements whose fill is worth swapping. A `<g>` carries no paint of
 *  its own in these drawings — every layer's colour sits on its child paths. */
const PREEXIST_SHAPES = "path,polygon,rect,circle,ellipse";

/** Endodontic and adhesive work placed IN the tooth. Root fillings belong in
 *  the hatch as much as a crown does — they are treatment somebody carried
 *  out, and whether it was ours is the same question (Dirk, 2026-08-11). */
const PREEXIST_ENDO_LAYERS = [
  "endo-medical-filling", "endo-filling", "endo-filling-incomplete",
  "endo-glass-pin", "endo-metal-pin", "parapulpal-pin", "endo-resection",
  "fissure-sealing",
];

/** The per-material wrapper `<g>`s the composed restorations live inside. */
const PREEXIST_RESTORATION_GROUPS = [
  "emax", "gold", "gradia", "metal-ceramic", "zircon", "metal", "telescope",
];

/**
 * Whether a layer is RESTORATIVE WORK — something a dentist placed in or on
 * the tooth — as opposed to the tooth itself or a disease finding.
 *
 * This is the hatch's scope, and it is narrower than the derivation's on
 * purpose. Hatching every non-healthy layer marked the whole tooth body
 * wherever the baseline held a radix or an implant, which is precisely what a
 * provenance marking must not do: the question is which WORK the patient
 * arrived with, and a tooth is not work. Caries, calculus and the periodontal
 * findings are excluded for the same reason from the other side — they are
 * disease, not something anyone placed.
 *
 * The set is read off the existing registries rather than typed out, so a
 * restoration added later is covered without a second list to maintain.
 * `getPreExistingAxes()` stays broad and still reports presence, substrate,
 * caries and the rest — the chart narrows, the record does not.
 */
function isRestorativeLayer(id: string): boolean {
  if(id.startsWith("filling-")) return true;                       // direct fillings
  if(PREEXIST_ENDO_LAYERS.includes(id)) return true;
  if(PREEXIST_RESTORATION_GROUPS.includes(id)) return true;
  return allRestorationLayers().includes(id);                      // crown/inlay/onlay/veneer/bridge
}

/** Whether `el` is actually VISIBLE inside `layer` — no ancestor up to and
 *  including the layer is switched off. Without this the per-material wrapper
 *  `<g id="gold">` would hatch its inactive siblings too (`gold-inlay`,
 *  `gold-veneer`, `gold-bridge-connector`), painting shapes nobody can see. */
function isActiveWithin(el: Any, layer: Any): boolean {
  for(let cur: Any = el; cur; cur = cur.parentElement){
    if(cur.getAttribute && cur.getAttribute("data-active") === "0") return false;
    if(cur === layer) return true;
  }
  return true;
}

/** Perceived lightness of a fill, 0-1, or `null` when the value names no
 *  colour at all (`none`, a `url()`, a keyword, empty). Decides whether the
 *  hatch lines go dark or light: one fixed line colour disappears on either
 *  the near-black caries shape or the near-white enamel one.
 *
 *  BOTH notations are parsed, and that is not defensive padding. The drawings
 *  author `fill: #cfe3ee`, but `style.fill` reads back as `rgb(207, 227, 238)`
 *  — every engine normalizes it, jsdom included. Accepting only hex would make
 *  this return `null` for essentially every real layer, and the pattern would
 *  then drop the background rect and paint the hatch over bare nothing,
 *  discarding the colour that says which material the filling is. */
function fillLightness(value: string): number | null {
  // Bead odontogram-sjr made every restoration fill a CSS variable, so a layer
  // now reads back as `var(--odon-rest-gold, #e0a80d)`. The FALLBACK is the
  // colour to judge by: it is what the layer renders unless the practice picked
  // something, and no script here can resolve a custom property the cascade
  // owns. Without this the hatch loses the colour on exactly the layers it is
  // drawn over most - the restorations.
  const varFallback = /^var\(\s*--[^,]+,\s*([^)]+)\)$/.exec((value || "").trim());
  const raw = (varFallback ? varFallback[1] : (value || "")).trim();
  let rgb: number[] | null = null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if(hex){
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }else{
    const fn = /^rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i.exec(raw);
    if(fn) rgb = [1, 2, 3].map((i) => Number(fn[i]) / 255);
  }
  if(!rgb || rgb.some((c) => !Number.isFinite(c))) return null;
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** Ensure `svg` holds a hatch pattern over `base` and return its id. One
 *  pattern per underlying colour, created once and reused — the pattern paints
 *  the original colour back underneath the lines, so a pre-existing amalgam
 *  filling still reads as amalgam. */
function ensureHatchPattern(svg: Any, base: string): string {
  const doc = svg.ownerDocument || document;
  const NS = "http://www.w3.org/2000/svg";
  const key = (base || "none").replace(/[^a-z0-9]/gi, "") || "none";
  const id = `odon-preexist-${key}`;
  if(svgGetById(svg, id)) return id;
  let defs = svg.querySelector("defs");
  if(!defs){
    defs = doc.createElementNS(NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  const light = fillLightness(base);
  const line = light !== null && light < 0.5 ? "#f2f5f8" : "#1e2a3a";
  const pattern = doc.createElementNS(NS, "pattern");
  pattern.setAttribute("id", id);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", String(PREEXIST_PITCH));
  pattern.setAttribute("height", String(PREEXIST_PITCH));
  pattern.setAttribute("patternTransform", "rotate(45)");
  if(light !== null){
    const bg = doc.createElementNS(NS, "rect");
    bg.setAttribute("width", String(PREEXIST_PITCH));
    bg.setAttribute("height", String(PREEXIST_PITCH));
    bg.setAttribute("fill", base);
    pattern.appendChild(bg);
  }
  const bar = doc.createElementNS(NS, "rect");
  bar.setAttribute("width", String(PREEXIST_STROKE));
  bar.setAttribute("height", String(PREEXIST_PITCH));
  bar.setAttribute("fill", line);
  bar.setAttribute("fill-opacity", PREEXIST_LINE_OPACITY);
  pattern.appendChild(bar);
  defs.appendChild(pattern);
  return id;
}

/** Restore every hatched shape to its captured base fill and drop the marker.
 *  Runs FIRST on every {@link applyPreExistingStyling} call — symmetric, so
 *  archiving a correction, or a finding replaced under our care, leaves no
 *  stray hatch behind. */
function clearPreExistingStyling(svg: Any){
  const marked = svg.querySelectorAll ? svg.querySelectorAll('[data-preexisting="1"]') : [];
  for(const el of Array.from(marked) as Any[]){
    if(el.getAttribute("data-base-pfill") !== null){ el.style.fill = el.getAttribute("data-base-pfill") || ""; }
    el.removeAttribute("data-preexisting");
  }
}

/** Hatch one finding layer: every shape under it captures its base fill ONCE
 *  (`data-base-pfill`, the capture-once pattern SP12's discoloration tint and
 *  the proposed styling both follow, so a reused node's second render cannot
 *  capture an already-hatched value as "base") and is repainted with a pattern
 *  built over that same colour. */
function markPreExisting(svg: Any, layer: Any){
  const shapes = [layer, ...Array.from(layer.querySelectorAll?.(PREEXIST_SHAPES) ?? [])] as Any[];
  for(const el of shapes){
    if(!el.style || !PREEXIST_SHAPES.includes(el.tagName?.replace(/^.*:/, "").toLowerCase())) continue;
    if(el.getAttribute("data-preexisting") === "1") continue;
    if(!isActiveWithin(el, layer)) continue;
    if(el.getAttribute("data-base-pfill") === null) el.setAttribute("data-base-pfill", el.style.fill || "");
    const base = el.getAttribute("data-base-pfill") || "";
    el.style.fill = `url(#${ensureHatchPattern(svg, base)})`;
    el.setAttribute("data-preexisting", "1");
  }
}

/** The layers a HEALTHY tooth already draws, per template and position. They
 *  are anatomy, not findings, so hatching them would hatch the whole tooth —
 *  the one thing that would make the marking unreadable. Cached because the
 *  answer depends only on the drawing and the position, never on the chart. */
const healthyLayerCache = new Map<string, Set<string>>();

function healthyLayerIds(toothNo: Any, svg: Any): Set<string> {
  const key = `${svg.getAttribute?.("data-tooth-template") ?? "?"}|${toothNo}`;
  const hit = healthyLayerCache.get(key);
  if(hit) return hit;
  const clone = svg.cloneNode(true);
  applyStateToSvgSingle(toothNo, clone, drawnState(clone, defaultState()));
  const ids = new Set(collectActiveLayers(clone).map((l) => l.id));
  healthyLayerCache.set(key, ids);
  return ids;
}

/** Hatch the layers of `svg` that were ALREADY active in the baseline
 *  examination — what the patient arrived with — having excluded the anatomy a
 *  healthy tooth draws anyway. `svg` has already been painted with the active
 *  chart's state by the caller (see `applyStateToSvg`). Always resets first. */
function applyPreExistingStyling(toothNo: Any, svg: Any){
  clearPreExistingStyling(svg);
  if(chartMode !== "status") return;      // Plan mode: the dashed channel owns the tooth
  const base = baselineToothState(toothNo);
  if(!base) return;                       // no examination archived: nothing to derive from
  const nowIds = collectActiveLayers(svg).map((l) => l.id);
  const clone = svg.cloneNode(true);
  applyStateToSvgSingle(toothNo, clone, drawnState(clone, base));
  const baseIds = new Set(collectActiveLayers(clone).map((l) => l.id));
  const healthy = healthyLayerIds(toothNo, svg);
  for(const id of nowIds){
    if(!baseIds.has(id) || healthy.has(id)) continue;
    if(!isRestorativeLayer(id)) continue;   // work, never the tooth or the disease
    const el = svgGetById(svg, id);
    if(el) markPreExisting(svg, el);
  }
}

/** TEST-ONLY sibling of {@link __applyProposedStylingForTest} for the
 *  pre-existing hatch. Reads the module's live archive and `chartMode`,
 *  exactly as the real `applyStateToSvg` roots loop does. Not part of the
 *  public API. */
export function __applyPreExistingStylingForTest(toothNo: Any, svg: Any): void {
  applyPreExistingStyling(toothNo, svg);
}

/** Parsed tooth templates, module-scoped so a tile can be re-mounted from a
 *  different drawing after it was built (see `syncToothTemplate`). */
const tplCache = new Map<number, Any>();

/** Deciduous drawings whose fetch is already running, so a repaint storm asks
 *  for each one once. */
const primaryLoadsInFlight = new Set<number>();

/** Parsed OCCLUSAL templates, module-scoped for the same reason as `tplCache`:
 *  an occlusal tile used to be built once in `buildGrid` and never re-templated,
 *  so charting a milk tooth left the permanent top view standing. Keyed by
 *  template number (14, 16, 51, 84 ...), holding the artwork of `<n>_occl.svg`. */
const occlCache = new Map<number, Any>();

/** Deciduous OCCLUSAL drawings already being fetched - the same guard as
 *  `primaryLoadsInFlight`, kept separate because the two sets hold different
 *  artwork for the same template number. */
const primaryOcclLoadsInFlight = new Set<number>();

const PRIMARY_TEMPLATE_KEYS = new Set(
  Array.from(PRIMARY_TEMPLATE.values(), (n) => String(n)),
);

/** Whether the mounted drawing is a deciduous template rather than a permanent
 *  one. Read off the generator's own `data-tooth-template` stamp, so it is the
 *  drawing that answers and not a second table that could drift from it.
 *
 *  The `_occl` suffix is stripped before the lookup: an occlusal drawing stamps
 *  `51_occl` while the table holds `51`, and without this a deciduous TOP VIEW
 *  was not recognised as deciduous. It then took the old milktooth-layer branch
 *  and rendered the DONOR's artwork - a premolar fissure pattern on a milk
 *  incisor - or, where the donor carries no milktooth layers at all (16_occl,
 *  46_occl), nothing whatsoever. Dirk, 19.08.2026: "die Schneidezaehne zeigen
 *  nicht die richtigen Kauflaechen sondern Molarenkauflaechen". */
function isPrimaryTemplate(svg: Any): boolean {
  const key = svg?.getAttribute?.("data-tooth-template");
  if(!key) return false;
  return PRIMARY_TEMPLATE_KEYS.has(key.endsWith("_occl") ? key.slice(0, -5) : key);
}

/** The state to DRAW a given svg with.
 *
 *  A milk tooth used to be drawn by switching on the `milktooth-*` layers
 *  embedded in its successor's permanent template. Where a dedicated primary
 *  drawing is mounted, those layers are the old workaround and the drawing
 *  itself is the milk tooth, so it is drawn as an ordinary present tooth. Two
 *  reasons this is not optional: source 16 carries no milktooth layers at all,
 *  so templates 55, 74 and 75 would render nothing but gum; and where the
 *  layers do exist they hold the legacy small tooth rather than the measured
 *  anatomy the template exists for.
 *
 *  Substituted here rather than inside the renderer so the stored state is
 *  untouched - the tooth is still charted as a milk tooth everywhere else, from
 *  the tooltip to the payload. */
function drawnState(svg: Any, state: Any): Any {
  if(!state || state.toothSelection !== "milktooth" || !isPrimaryTemplate(svg)) return state;
  return { ...state, toothSelection: "tooth-base" };
}

/** Mount the drawing the tooth's CURRENT state calls for.
 *
 *  A milk tooth used to be drawn by switching the `milktooth-*` layers on
 *  inside its successor's permanent template, which is why the deciduous
 *  dentition had no anatomy of its own. It has one now, so charting a tooth as
 *  a milk tooth swaps the whole drawing instead - and swapping back is the same
 *  operation, since the wanted template is derived from the state each time
 *  rather than remembered.
 *
 *  Side-view tiles only. The occlusal tiles have their own two templates and no
 *  deciduous counterpart. */
function syncToothTemplate(toothNo: Any){
  const base = TOOTH_TEMPLATE.get(toothNo);
  if(!base) return;
  const state = toothState.get(toothNo);
  const primary = PRIMARY_TEMPLATE.get(toothNo);
  if(state?.toothSelection === "milktooth" && primary != null && !tplCache.has(primary)){
    // First milk tooth charted at this position: fetch the drawing, then repaint
    // the tooth. Until it arrives the permanent template stays mounted, which is
    // what was shown a moment ago anyway - one frame, not a blank tile.
    if(!primaryLoadsInFlight.has(primary)){
      const loader = primaryTemplateLoader(primary);
      if(loader){
        primaryLoadsInFlight.add(primary);
        loader().then((markup) => {
          tplCache.set(primary, parseSvgTemplate(markup));
          primaryLoadsInFlight.delete(primary);
          for(const tn of PRIMARY_TEMPLATE.keys()){
            if(PRIMARY_TEMPLATE.get(tn) === primary) applyStateToSvg(tn);
          }
        }).catch(() => primaryLoadsInFlight.delete(primary));
      }
    }
  }
  const want =
    state?.toothSelection === "milktooth" && primary != null && tplCache.has(primary)
      ? primary
      : base.tpl;

  const tiles = toothTile.get(toothNo);
  const roots = toothSvgRoot.get(toothNo);
  if(!tiles || !roots) return;

  for(let i = 0; i < tiles.length; i++){
    const tile = tiles[i];
    if(!tile?.classList?.contains("side-view")) continue;
    if(tile.classList.contains(`tpl-${want}`)) continue;
    const tpl = tplCache.get(want);
    if(!tpl) continue;

    const svg = tpl.cloneNode(true);
    namespacePaintServers(svg, `tooth-${toothNo}-side-`);
    if(base.rot === 180) rotate180(svg);
    if(base.mirror) mirrorVertical(svg);

    const host = $(".tooth-svg", tile);
    if(!host) continue;
    host.replaceChildren(svg);
    for(const cls of Array.from(tile.classList) as string[]){
      if(/^tpl-\d+$/.test(cls)) tile.classList.remove(cls);
    }
    tile.classList.add(`tpl-${want}`);
    roots[i] = svg;
  }

  syncOcclusalTemplate(toothNo, tiles, roots);
}

/** The same swap for the OCCLUSAL tile.
 *
 *  Until 2026-08-19 an occlusal tile was built once in `buildGrid` and never
 *  re-templated, so charting a milk tooth left the PERMANENT top view standing -
 *  a milk molar showed the artwork of its successor, and once the deciduous top
 *  views existed the six milk front teeth did too. Dirk: "Die Kachel muss den
 *  Milchzahn laden, wenn auf einen Milchzahn umgestellt wird."
 *
 *  Kept separate from the side-view loop above rather than folded into it,
 *  because almost nothing is shared: a different cache, a different loader, a
 *  different class name (`tpl-N-occl`), and a position whose orientation comes
 *  from `OCCLUSAL_TEMPLATE` - which is NOT the side view's, and in the lower
 *  arch deliberately carries no rotation at all. */
function syncOcclusalTemplate(toothNo: Any, tiles: Any[], roots: Any[]){
  const base = OCCLUSAL_TEMPLATE.get(toothNo);
  if(!base) return;
  const state = toothState.get(toothNo);
  const primary = PRIMARY_TEMPLATE.get(toothNo);
  const istMilch = state?.toothSelection === "milktooth" && primary != null;

  if(istMilch && !occlCache.has(primary as number)){
    // Same one-frame rule as the side view: fetch, and leave what is mounted
    // standing until it arrives. A blank tile would be worse than a stale one.
    if(!primaryOcclLoadsInFlight.has(primary as number)){
      const loader = occlusalTemplateLoader(primary as number);
      if(loader){
        primaryOcclLoadsInFlight.add(primary as number);
        loader().then((markup) => {
          occlCache.set(primary as number, parseSvgTemplate(markup));
          primaryOcclLoadsInFlight.delete(primary as number);
          for(const tn of PRIMARY_TEMPLATE.keys()){
            if(PRIMARY_TEMPLATE.get(tn) === primary) applyStateToSvg(tn);
          }
        }).catch(() => primaryOcclLoadsInFlight.delete(primary as number));
      }
    }
  }

  const want = istMilch && occlCache.has(primary as number) ? (primary as number) : base.tpl;

  for(let i = 0; i < tiles.length; i++){
    const tile = tiles[i];
    if(!tile?.classList?.contains("occl-view")) continue;
    if(tile.classList.contains(`tpl-${want}-occl`)) continue;
    const tpl = occlCache.get(want);
    if(!tpl) continue;

    const svg = tpl.cloneNode(true);
    namespacePaintServers(svg, `tooth-${toothNo}-occl-`);
    if(base.rot === 180) rotate180(svg);
    if(base.mirror) mirrorVertical(svg);

    const host = $(".tooth-svg", tile);
    if(!host) continue;
    host.replaceChildren(svg);
    for(const cls of Array.from(tile.classList) as string[]){
      if(/^tpl-\d+-occl$/.test(cls)) tile.classList.remove(cls);
    }
    tile.classList.add(`tpl-${want}-occl`);
    roots[i] = svg;
  }
}

function applyStateToSvg(toothNo: Any){
  syncToothTemplate(toothNo);
  const roots = toothSvgRoot.get(toothNo);
  if(!roots) return;
  for(const svg of roots){
    applyStateToSvgSingle(toothNo, svg, drawnState(svg, toothState.get(toothNo)));
    applyProposedStyling(toothNo, svg); // R2-C Task 1: dashed+tint plan-only layers (Plan mode only)
    applyPreExistingStyling(toothNo, svg); // odontogram-ap7: hatch what the patient arrived with (Status mode only)
  }
  applyPluginOverlays(toothNo);
  updateToothRetentionMark(toothNo);
  updateToothMobilityMark(toothNo);   // Bead odontogram-7xl
  updateToothOnlayClip(toothNo);      // Bead odontogram-bbd
  syncHemisectionClip(toothNo);   // Bead odontogram-ca0
  syncFractureMark(toothNo);      // Bead odontogram-t6y
  syncPapillaMark(toothNo);       // Bead odontogram-gry
  syncEruptionMark(toothNo);      // Bead odontogram-0n8
  syncOcclusalRelief(toothNo);    // Bead odontogram-qvr
  syncPonticMark(toothNo);        // Bead odontogram-5hm
  syncOcclBracketSide(toothNo);   // KFO: Bracket in der Draufsicht buccal/lingual
  updateToothTooltip(toothNo);
}

/** Bead odontogram-qvr: Fissuren und Hoecker auch UNTER der Restauration.
 *
 *  Dirk, 21.08.2026: "Bei Kronen und Onlays auf Praemolaren und Molaren sollte
 *  die Fissur- und Hoeckerkonfiguration die wir haben auch in der Kauflaeche in
 *  dem gewaehlten Material sichtbar sein. Das wuerde richtig elegant aussehen
 *  und das hat sonst niemand."
 *
 *  GEZEICHNET WIRD NICHTS NEUES. Die Kauflaechenvorlage traegt die Hoeckerfelder
 *  laengst als eigene Formen (`g#cusps`, sechs beim Sechser) und die Fissuren
 *  als eigene Zuege (`g#fissure`); beide bleiben unter einer Restauration sogar
 *  AKTIV - die Krone deckt sie nur zu, weil sie im Dokument spaeter steht und
 *  die ganze Kautafel fuellt.
 *
 *  Also wird sie durchsichtig gemacht: die Kachel bekommt `data-occl-resto` mit
 *  dem Material, und die Regeln in index.css nehmen der Kappe ihre Fuellung und
 *  geben sie den Hoeckern. Kein Element wird ein- oder ausgeschaltet, keine id
 *  angefasst - der SVG-Fingerabdruck haelt `id`, `opacity` und `class` fest, und
 *  ein `data-` am DIV der Kachel steht ohnehin ausserhalb des SVG.
 *
 *  AUCH IN DER FRONT, seit Dirks Nachtrag am selben Tag: "Mach bitte bei Kronen
 *  in der Front, 13-23, 33-43 auch die feine Zeichnung der Incisalkante mit in
 *  die okklusale Ansicht. Das sieht besser aus."
 *
 *  Der erste Wurf hatte die Front ausgenommen, weil sie keine Fissuren hat.
 *  Nachgesehen traegt jede Frontzahn-Draufsicht sehr wohl beide Gruppen - vier
 *  Felder in `cusps`, drei Zuege in `fissure` -, und das IST die Zeichnung der
 *  Schneidekante. Sie fehlt einer Krone genauso wie dem Molaren sein
 *  Fissurenmuster. Also kein Gatter mehr: jede Kauflaechenkachel zeigt ihr
 *  eigenes Relief im Material. */
function syncOcclusalRelief(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const typ = String(st?.restorationType ?? "none");
  const material = String(st?.restorationMaterial ?? "none");
  const zeigen = (typ === "crown" || typ === "bridge" || typ === "onlay")
    && material !== "none";
  for(const tile of tiles){
    if(zeigen && tile.classList.contains("occl-view")){
      tile.dataset.occlResto = material;
    }else{
      delete tile.dataset.occlResto;
    }
  }
}

/** Bead odontogram-5hm: das Brueckenglied ist ein SCHWEBENDES Stueck - keine
 *  praeparierte Krone. Dirk, 23.08.2026: die alte Krone darunter ausblenden und
 *  ein Stueck als Brueckenglied einsetzen, mit einem schmalen Streifen
 *  Zahnfleisch darunter. Umgesetzt per Clip: die zervikale Partie der
 *  Pontic-Krone wird abgeschnitten (`data-pontic` + Regel in index.css), sodass
 *  zwischen Zahnfleischband und Glied ein Streifen Gingiva frei bleibt und die
 *  Krone als schwebendes Glied liest. Nur ein `data-` am DIV - ausserhalb des
 *  SVG, der Fingerabdruck sieht es nicht. */
function syncPonticMark(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const istPontic = st?.toothSelection === "none" && st?.restorationType === "bridge";
  for(const tile of tiles){
    if(istPontic) tile.dataset.pontic = "1";
    else delete tile.dataset.pontic;
  }
}


/**
 * KFO: die Seite des Brackets in der KAUFLAECHENANSICHT (Dirk, 22.08.2026).
 *
 * Die Vorlage zeichnet das Bracket immer BUKKAL in ihrem eigenen Rahmen. Der
 * Unterkiefer wird per `rotate180` gedreht (base.rot === 180), wodurch das
 * Bracket dort visuell LINGUAL erscheint - das ist der Grund, warum es im UK
 * schon fuer "buccal" auf der falschen Seite stand.
 *
 * Also: was ANGEZEIGT wird, ist ohne Drehung buccal, mit Drehung lingual. Wir
 * spiegeln genau dann, wenn das Angezeigte nicht der GEWUENSCHTEN Seite
 * entspricht. Ein `data`-Attribut auf der Kachel, gespiegelt per CSS (scaleY um
 * die viewBox-Mitte, bukkolinguale Achse) - der CSS-Transform komponiert unter
 * dem Attribut-Transform der Drehung, also im EIGENEN Rahmen der Vorlage, wie
 * beim Onlay-Clip. Kein Fingerabdruck (id/opacity/class unveraendert).
 */
function syncOcclBracketSide(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const base = TOOTH_TEMPLATE.get(toothNo);
  const istBracket = st?.orthoAppliance === "bracket" && orthoAllowed(st);
  const gewuenscht = (st?.orthoBracketSide as string) ?? "buccal";
  const angezeigt = base?.rot === 180 ? "lingual" : "buccal";
  const spiegeln = istBracket && angezeigt !== gewuenscht;
  for(const tile of tiles){
    if(!tile.classList.contains("occl-view")) continue;
    if(spiegeln) tile.dataset.orthoBracketFlip = "1";
    else delete tile.dataset.orthoBracketFlip;
  }
}

/** Bead odontogram-dma: put the retention element on the tile in charly's own
 *  notation. There is no clasp or attachment artwork in any template, and
 *  inventing some would be a drawing nobody verified; the marker is honest and
 *  reads the way Dirk's own records do. It is a `data-retention` attribute on
 *  the tile `<div>` rendered by CSS, so it lives in the panel DOM and never
 *  touches `__renderActiveLayers` — outside the SVG fingerprint entirely. */
function updateToothRetentionMark(toothNo: Any){
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const state = toothState.get(toothNo);
  const mark = state ? retentionMark(state, state.retentionSide ?? "none") : "";
  for(const tile of tiles){
    if(!tile?.setAttribute) continue;
    if(mark) tile.setAttribute("data-retention", mark);
    else tile.removeAttribute("data-retention");
  }
}

/** Bead odontogram-bbd: das Onlay in der Seitenansicht.
 *
 *  Dirk, 21.08.2026: "Onlay kann ueber 4 Flaechen gehen, z.B. modl, modv, odlv
 *  usw." Ein modv hat einen vestibulaeren Anteil, den man von der Seite sieht -
 *  dort fehlte dem Onlay bisher nur die FORM, nicht die Berechtigung.
 *
 *  Sie wird nicht gezeichnet, sondern GESCHNITTEN: ein Onlay ist die Krone ohne
 *  ihr zervikales Drittel. Dirk, 22.08.2026: "Das Onlay soll auf 2/3 der
 *  bukkalen Flaeche reichen. Ich denke, das ist ein guter Kompromiss."
 *
 *  `composeRestorationLayers` schaltet dafuer in der Seitenansicht die
 *  KRONEN-Ebene ein; hier bekommt die Kachel `data-onlay`, und der Schnitt
 *  steht in index.css - dieselbe Aufgabenteilung wie bei der Hemisektion, und
 *  aus demselben Grund: etwas wegzunehmen kann keine Auflage, dafuer braucht es
 *  einen Schnitt. */
function updateToothOnlayClip(toothNo: Any){
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const onlay = st?.restorationType === "onlay"
    && String(st?.restorationMaterial ?? "none") !== "none"
    && !restorationRowHidden(st);
  for(const tile of tiles){
    if(!tile?.setAttribute) continue;
    if(onlay && tile.classList?.contains("side-view")) tile.setAttribute("data-onlay", "1");
    else tile.removeAttribute("data-onlay");
  }
}

/** Bead odontogram-7xl: der Lockerungsgrad als roemische Ziffer an der Kachel.
 *
 *  Dirk, 22.08.2026: "Wir schreiben eine roemische Ziffer I - III in das
 *  Kaestchen des Zahnes, unten in eine Ecke. Mir faellt nichts ein, wie man
 *  Lockerung sonst graphisch darstellen koennte."
 *
 *  Es ist nicht nur die huebschere Loesung, sondern die einzige, die den GRAD
 *  zeigt: die gezeichnete Gruppe hatte zwei Kinder, beide immer aktiv, und wurde
 *  als Ganzes eingeschaltet - M1, M2 und M3 sahen gleich aus.
 *
 *  Gebaut wie `updateToothRetentionMark` daneben: ein data-Attribut am DIV der
 *  Kachel, von CSS gezeichnet. Damit steht es ausserhalb des SVG, und der
 *  Fingerabdruck sieht es nicht.
 *
 *  DIESELBE BEDINGUNG wie vorher die Ebene: kein Implantat (osseointegriert,
 *  kein Desmodont), keine Luecke, keine frische Extraktionswunde. */
const MOBILITAETSZIFFER: Record<string, string> = { m1: "I", m2: "II", m3: "III" };

function updateToothMobilityMark(toothNo: Any){
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const ziffer = MOBILITAETSZIFFER[String(st?.mobility ?? "none")] ?? "";
  const zeigen = !!ziffer
    && st?.toothSelection !== "none"
    && st?.toothSelection !== "implant"
    && !isExtraction(st?.toothSelection)
    && !st?.extractionWound;
  for(const tile of tiles){
    if(!tile?.setAttribute) continue;
    if(zeigen) tile.setAttribute("data-mobility", ziffer);
    else tile.removeAttribute("data-mobility");
  }
}

/** TEST-ONLY seam over updateToothMobilityMark. Not part of the public API. */
export function __updateToothMobilityMarkForTest(toothNo: number): void {
  updateToothMobilityMark(toothNo);
}

/** TEST-ONLY seam over {@link updateToothRetentionMark}. Not part of the
 *  public API. */
export function __updateToothRetentionMarkForTest(toothNo: number): void {
  updateToothRetentionMark(toothNo);
}

/** Collect, IN DOCUMENT ORDER (not sorted — order captures z-order/re-parenting),
 *  one entry per id'd element that is visible after render: self and every ancestor
 *  have data-active !== "0", excluding <defs> and non-visual defs elements. Each
 *  entry also carries the element's inline `opacity` (parsed from the style
 *  attribute, "" if none) and its `class` ("" if none), so per-surface caries-depth
 *  encoding (style.opacity / classList "caries-deep") is visible to the fingerprint. */
function collectActiveLayers(svg: Any): { id: string; opacity: string; cls: string }[] {
  const NONVISUAL = new Set(["defs","linearGradient","radialGradient","stop","clipPath","mask","style","title","desc","metadata"]);
  const localName = (el: Element) => el.tagName.replace(/^.*:/, "").toLowerCase();
  const out: { id: string; opacity: string; cls: string }[] = [];
  for (const n of Array.from(svg.querySelectorAll("[id]")) as Element[]) {
    if (NONVISUAL.has(localName(n))) continue;
    let inDefs = false, hidden = false;
    for (let cur: Element | null = n; cur && cur !== (svg.parentElement as Element | null); cur = cur.parentElement) {
      if (localName(cur) === "defs") { inDefs = true; break; }
      if (cur.getAttribute && cur.getAttribute("data-active") === "0") { hidden = true; break; }
    }
    if (inDefs || hidden) continue;
    const style = n.getAttribute("style") || "";
    const m = style.match(/opacity:\s*([0-9.]+)/);
    out.push({ id: n.getAttribute("id") as string, opacity: m ? m[1] : "", cls: n.getAttribute("class") || "" });
  }
  return out; // document order — NOT sorted
}

/** TEST-ONLY: render `serialized` state onto a fresh copy of `rawSvgText` and return the
 *  in-document-order active-layer fingerprint (id + opacity + class per element). Used by
 *  the SP2 parity harness; not part of the public API. */
export function __renderActiveLayers(rawSvgText: string, toothNo: number, serialized: Record<string, unknown>): { id: string; opacity: string; cls: string }[] {
  const parsed = new DOMParser().parseFromString(rawSvgText, "image/svg+xml");
  const svg = parsed.documentElement as unknown as Any;
  stripDisplayNoneToDataActive(svg);
  ensureDataActiveForSwitchables(svg);
  const state = hydrateState(serialized as Any);
  applyStateToSvgSingle(toothNo, svg, state);
  return collectActiveLayers(svg);
}

/** TEST-ONLY: parse `rawSvgText` once (same prep `__renderActiveLayers` does —
 *  strip display:none to data-active, seed missing data-active defaults) and
 *  return the live parsed element. Pair with `__renderActiveLayersOnNode` to
 *  render multiple states onto the SAME node, reproducing how the live app
 *  reuses one persistent SVG DOM node per tooth across renders (unlike
 *  `__renderActiveLayers`, which re-parses a fresh node every call and so
 *  cannot catch a render that fails to reset state a prior render left
 *  behind). Not part of the public API. */
export function __parseSvgForTest(rawSvgText: string): Any {
  const parsed = new DOMParser().parseFromString(rawSvgText, "image/svg+xml");
  const svg = parsed.documentElement as unknown as Any;
  stripDisplayNoneToDataActive(svg);
  ensureDataActiveForSwitchables(svg);
  return svg;
}

/** TEST-ONLY: hydrate `serialized` and render it onto an already-parsed `svg`
 *  node (as returned by `__parseSvgForTest`), reusing that SAME node — see
 *  `__parseSvgForTest` for why this matters. Returns the in-document-order
 *  active-layer fingerprint, same shape as `__renderActiveLayers`. Not part
 *  of the public API. */
export function __renderActiveLayersOnNode(svg: Any, toothNo: number, serialized: Record<string, unknown>): { id: string; opacity: string; cls: string }[] {
  const state = hydrateState(serialized as Any);
  applyStateToSvgSingle(toothNo, svg, state);
  return collectActiveLayers(svg);
}

/** TEST-ONLY: hydrate `raw` and store it as `toothNo`'s state directly in the
 *  module-level state map, bypassing all DOM/UI wiring (no initOdontogram()
 *  required). Lets summary/warning getters be exercised without a live SVG grid.
 *  Not part of the public API. */
export function __setToothStateForTest(toothNo: number, raw: Record<string, unknown>, version?: string): void {
  // `version` drives FIX 1's legacy secondary-caries gate exactly as importStatus
  // does (per-tooth call of the same decision). Omitting it → legacy (infer),
  // preserving every existing caller's default-true behavior.
  toothState.set(toothNo, hydrateState(raw, isLegacyPayloadVersion(version)));
}

/** TEST-ONLY: fire the change notification without mutating anything.
 *  `__setToothStateForTest` writes straight into the Map and deliberately stays
 *  silent — several tests count notifications and would break if it spoke. A
 *  test that needs a SUBSCRIBER to see the seam's write (a mounted component
 *  reacting to a tooth becoming absent, say) calls this straight after.
 *  Production never needs it: every real edit notifies through its own setter. */
export function __notifyStateChangeForTest(): void {
  notifyStateChange();
}

/** TEST-ONLY: convert a hydrated state object to a plain object (Sets/Maps
 *  converted to arrays/objects for easy assertions). Shared by
 *  __getToothStateForTest and the R2-A __getStatusStateForTest/
 *  __getPlanStateForTest seams below. Not part of the public API. */
function __plainStateForTest(s: Any): Record<string, unknown> {
  return {
    ...s,
    caries: Array.from(s.caries ?? []),
    fillingSurfaces: Array.from(s.fillingSurfaces ?? []),
    fillingSurfaceMaterials: Object.fromEntries(s.fillingSurfaceMaterials ?? []),
    cariesSeverity: Object.fromEntries(s.cariesSeverity ?? []),
    fillingDefect: Object.fromEntries(s.fillingDefect ?? []),
    cervicalSurfaces: Array.from(s.cervicalSurfaces ?? []),
    cervicalSideUnknown: Array.from(s.cervicalSideUnknown ?? []),
    mods: Array.from(s.mods ?? []),
  };
}

/** TEST-ONLY: read back a tooth's current state as a plain object (Sets/Maps
 *  converted to arrays/objects for easy assertions). Not part of the public API. */
export function __getToothStateForTest(toothNo: number): Record<string, unknown> | undefined {
  const s = toothState.get(toothNo);
  if(!s) return undefined;
  return __plainStateForTest(s);
}

/** TEST-ONLY (R2-A Task 1 seam, kept until T2's public getStatusChart()
 *  supersedes it): read back a tooth's state from the STATUS chart
 *  regardless of which chart is currently active. Not part of the public API. */
export function __getStatusStateForTest(toothNo: number): Record<string, unknown> | undefined {
  const s = charts.status.get(toothNo);
  if(!s) return undefined;
  return __plainStateForTest(s);
}

/** TEST-ONLY (R2-A Task 1 seam, kept until T2's public getPlanChart()
 *  supersedes it): read back a tooth's state from the PLAN chart regardless
 *  of which chart is currently active. Not part of the public API. */
export function __getPlanStateForTest(toothNo: number): Record<string, unknown> | undefined {
  const s = charts.plan.get(toothNo);
  if(!s) return undefined;
  return __plainStateForTest(s);
}

/** TEST-ONLY (R2-A Task 1 seam): fully reset the dual-chart container —
 *  clears BOTH charts, drops `planInitialized`, and returns to "status"
 *  mode — without requiring a live DOM/initToken the way destroyOdontogram()
 *  does. Lets each test in a suite start from a clean slate instead of
 *  leaking `planInitialized`/chart contents across tests in the same module
 *  instance. Not part of the public API. */
export function __resetChartStateForTest(): void {
  charts.status.clear();
  clearPlanAlternatives();
  resetShorthandInput();
  pendingDualStateConfirm = null;
  chartMode = "status";
  toothState = charts.status;
  resetCaseMeta();
  resetToothWidths(); // measured crown widths are session state, cleared with everything else
  resetOcclusalMeasurements();
  resetExaminationContext();
  resetExaminations();
  // Bead odontogram-3l1: hand the engine back to the default session and drop
  // any restore stack or ownership claim, so one test's sessions cannot leak
  // into the next.
  activeSession = defaultSession;
  defaultSession.storedChartMode = "status";
  sessionStack.length = 0;
  engineOwner = null;
  engineWaiters.length = 0;
}

/** TEST-ONLY (DS-1 Task 2 seam): set the active tooth (and lazily vivify its
 *  state) so a control-revert test can exercise `revertActiveControls()`
 *  against a real active tooth without going through the DOM tooth grid. Not
 *  part of the public API. */
export function __setActiveToothForTest(toothNo: number | null): void {
  activeTooth = toothNo;
  if(toothNo != null && !toothState.get(toothNo)) toothState.set(toothNo, defaultState());
}

/** TEST-ONLY (DS-1 Task 1 seam): snapshot of the teeth currently flagged as
 *  plan-edited (a COPY — mutating it never touches module state). Not part of
 *  the public API. */
export function __planEditedTeethForTest(): number[] {
  return Array.from(planEditedTeeth);
}

/** TEST-ONLY (DS-1 Task 1 seam): invoke {@link mirrorStatusToPlan} directly so
 *  the deep-copy behavior can be exercised without going through the gate. Not
 *  part of the public API. */
export function __mirrorStatusToPlanForTest(toothNo: number): void {
  mirrorStatusToPlan(toothNo);
}

/** TEST-ONLY (DS-1 review-fix seam): drive {@link setEdentulous} directly so the
 *  gated whole-mouth structural edit can be exercised without a live DOM/
 *  initOdontogram() token. Not part of the public API. */
export function __setEdentulousForTest(on: boolean): void {
  setEdentulous(on);
}

/** TEST-ONLY (DS-1 review-fix seam): drive the single-tooth reset through the
 *  same code path as the zoom-popover / context-menu reset buttons, without a
 *  live DOM/initOdontogram() token. Not part of the public API. */
export function __resetToothForTest(toothNo: number): void {
  resetToothGated(toothNo);
}

/** TEST-ONLY (DS-1 review-fix seam): drive the multi-tooth (selection) reset
 *  through the same code path as the "Reset selected teeth" button, without a
 *  live DOM/initOdontogram() token. Not part of the public API. */
export function __resetTeethForTest(toothNos: number[]): void {
  resetTeethGated(toothNos);
}

/**
 * Bead odontogram-iqj: welches Gebiss zum Alter des Patienten passt, und
 * woher das Alter kommt.
 *
 * VORSCHLAGEN, NIE ANWENDEN. Ein Geburtsdatum wird nachgetragen und
 * korrigiert, und ein Umschalten der Dentition setzt JEDEN Zahn auf
 * `defaultState()` zurueck - wer das Datum nachtraegt, hat womoeglich schon
 * befundet. Eine Automatik loeschte hier Arbeit. Deshalb liefert diese
 * Funktion nur die Auskunft; angewandt wird sie erst durch den Knopf, und der
 * laeuft durch dieselbe DS-1-Bahn wie die Presets selbst.
 *
 * Das GEBURTSDATUM geht dem eingetragenen Alter vor, wo beide da sind: es ist
 * die genauere Angabe und altert von selbst mit. Beide bleiben nebeneinander
 * bestehen - `age` wird von der Parodontalklassifikation gelesen und darf von
 * Hand gesetzt werden, wenn nur das Alter bekannt ist.
 *
 * `today` wird HEREINGEREICHT (ISO `YYYY-MM-DD`); ohne Angabe nimmt die
 * Funktion den heutigen Tag. Der Parameter ist da, damit sich das Ergebnis
 * pruefen laesst, ohne die Uhr zu stellen.
 */
export function getDentitionSuggestion(today?: string): {
  kind: DentitionKind; age: number; source: "dob" | "age";
} | null {
  const dob = caseMeta.patientDob;
  if(dob){
    const stichtag = today ?? new Date().toISOString().slice(0, 10);
    const alter = ageFromDob(dob, stichtag);
    const kind = suggestDentition(alter);
    if(alter !== null && kind) return { kind, age: alter, source: "dob" };
  }
  const kind = suggestDentition(caseMeta.age);
  if(kind && caseMeta.age !== null) return { kind, age: caseMeta.age, source: "age" };
  return null;
}

/** Bead odontogram-iqj: den Vorschlag anwenden - derselbe Weg, den die beiden
 *  Preset-Knoepfe nehmen, also durch die DS-1-Bahn. Ein `permanent`-Vorschlag
 *  wendet NICHTS an: das bleibende Gebiss ist der Ausgangszustand, und ein
 *  Zuruecksetzen des ganzen Mundes waere hier keine Uebernahme, sondern ein
 *  Verlust. Wer das will, hat den Knopf "Alles zuruecksetzen" daneben. */
export function applyDentitionSuggestion(kind: DentitionKind): void {
  if(kind === "primary") applyPrimaryDentition();
  else if(kind === "mixed") applyMixedDentition();
}

/** TEST-ONLY (DS-1 review-fix seam): drive a dentition preset through the same
 *  code path as the #btnPrimaryDentition / #btnMixedDentition buttons, without a
 *  live DOM/initOdontogram() token. Not part of the public API. */
export function __applyDentitionPresetForTest(kind: "primary" | "mixed"): void {
  if(kind === "primary") applyPrimaryDentition();
  else applyMixedDentition();
}

/** TEST-ONLY: set the module-level `showHealthyPulp` flag directly, without the
 *  DOM/all-teeth side effects `setHealthyPulpVisible` performs (button toggle
 *  state, re-rendering every tooth in `ALL_TEETH`) — needed so `__renderActiveLayers`
 *  callers can exercise both the "healthy pulp shown" and "hidden" render paths
 *  in isolation. Not part of the public API. */
export function __setShowHealthyPulpForTest(on: boolean): void {
  showHealthyPulp = !!on;
}

// ---- Plugin overlay rendering ----
function applyPluginOverlays(toothNo: number){
  if(registeredPlugins.length === 0) return;
  const roots = toothSvgRoot.get(toothNo);
  if(!roots) return;
  const state = toothState.get(toothNo);
  const quadrant = getQuadrant(toothNo);

  for(const svg of roots){
    let overlayMap = pluginOverlays.get(toothNo);
    if(!overlayMap){
      overlayMap = new Map();
      pluginOverlays.set(toothNo, overlayMap);
    }

    for(const plugin of registeredPlugins){
      // Remove previous overlay for this plugin
      const existing = overlayMap.get(plugin.id);
      if(existing && existing.parentElement) existing.remove();

      const customState = state?.customStates?.[plugin.id];
      let svgContent: string | null | undefined;
      try{
        svgContent = plugin.renderSvg(toothNo, quadrant, customState);
      }catch(_e){
        // Plugin render error — skip silently
        continue;
      }
      if(!svgContent) continue;

      // Security: plugin output is third-party content — sanitize before the
      // innerHTML sink. An entirely-malicious fragment sanitizes to "" and the
      // overlay is skipped rather than inserted empty.
      const cleanSvg = sanitizePluginSvg(svgContent);
      if(!cleanSvg) continue;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-plugin", plugin.id);
      g.setAttribute("data-layer", plugin.layer);
      g.innerHTML = cleanSvg;

      // Insert into SVG at the correct z-position based on layer
      insertPluginGroup(svg, g, plugin.layer);
      overlayMap.set(plugin.id, g);
    }
  }
}

function insertPluginGroup(svg: SVGElement, g: SVGGElement, layer: string){
  const z = LAYER_Z[layer as keyof typeof LAYER_Z] ?? 6;
  // Find the right insertion point based on layer order:
  // base(0) < tooth(1) < endo(2) < restoration(3) < crown(4) < caries(5) < overlay(6)
  // Plugin groups are appended; overlay goes last, base goes first.
  const existingPlugins = svg.querySelectorAll("g[data-plugin]");
  let inserted = false;
  for(const ep of existingPlugins){
    const epLayer = ep.getAttribute("data-layer") || "overlay";
    const epZ = LAYER_Z[epLayer as keyof typeof LAYER_Z] ?? 6;
    if(epZ > z){
      ep.parentElement?.insertBefore(g, ep);
      inserted = true;
      break;
    }
  }
  if(!inserted){
    // For overlay: append at end. For base: insert before first child group.
    if(layer === "base" && svg.firstChild){
      svg.insertBefore(g, svg.firstChild);
    }else{
      svg.appendChild(g);
    }
  }
}

// ---- State tooltip ----
function getStateSummary(toothNo: number): string[]{
  const state = toothState.get(toothNo);
  if(!state) return [];
  const summary: string[] = [];

  // Tooth base
  if(state.toothSelection === "none") summary.push(t("toothSelect.none"));
  else if(state.toothSelection === "milktooth") summary.push(t("toothSelect.milk"));
  else if(state.toothSelection === "implant") summary.push(t("toothSelect.implant"));
  else if(state.toothSelection === "tooth-under-gum") summary.push(t("toothSelect.underGum"));

  // Bead odontogram-0n8: der Durchbruchsstand, direkt bei der Anwesenheit -
  // er beantwortet dieselbe Frage eine Stufe feiner. Gezeigt nur, wo die
  // Bedienung ihn auch anbietet: eine tolerant importierte Stufe an einer
  // Luecke ist gespeichert und bleibt unsichtbar.
  if(state.eruptionStage && state.eruptionStage !== "none" && eruptionAllowed(state)){
    summary.push(`${t("eruptionStage.label")}: ${t("eruptionStage.option." + kebabToCamel(state.eruptionStage))}`);
  }

  // Tooth substrate (radix / broken / crown-prep) — independent of any restoration.
  if(state.toothSubstrate !== "natural"){
    summary.push(t(`substrate.${state.toothSubstrate}`));
  }

  // Fixed restoration (crown / inlay / onlay / veneer / bridge)
  if(state.restorationType !== "none"){
    summary.push(restorationSummaryLabel(state.restorationType, state.restorationMaterial));
  }

  // Prosthesis / implant attachment (healing-abutment/locator/bar attachments and
  // removable/bar-retained dentures) — SP3b: reads the dedicated `prosthesis` axis
  // (field-move from the legacy `crownMaterial`/`bridgeUnit`).
  if(state.prosthesis !== "none"){
    const prosthesisKey = PROSTHESIS_SUMMARY_KEY[state.prosthesis];
    if(prosthesisKey) summary.push(t(prosthesisKey));
  }

  // Bead odontogram-dma: what holds a removable denture here. Gated on the
  // SAME predicate the picker uses, so a tolerantly-imported element the tooth
  // cannot carry never surfaces where the control itself refuses it. The
  // telescope is named too — it is a crown material in the model, but
  // clinically it IS the retention, and a summary that omitted it would read
  // as "this abutment holds nothing".
  if(state.retention && state.retention !== "none" && retentionAllowed(state, state.retention)){
    const side = state.retentionSide && state.retentionSide !== "none"
      ? ` (${t("retentionSide." + state.retentionSide)})` : "";
    summary.push(`${t("retention." + kebabToCamel(state.retention))}${side}`);
  }else if(isTelescopeRetention(state)){
    summary.push(t("retention.telescope"));
  }

  // Endo — the whole-tooth status line uses the effective value, so a tooth
  // charted ONLY per canal still shows a status here (both views agree).
  const endoEff = effectiveEndo(state);
  if(endoEff !== "none"){
    const endoKey = {
      "endo-medical-filling": "endo.option.medicalFilling",
      "endo-filling": "endo.option.filling",
      "endo-filling-incomplete": "endo.option.incompleteFilling",
      "endo-glass-pin": "endo.option.glassPin",
      "endo-metal-pin": "endo.option.metalPin",
    }[endoEff];
    if(endoKey) summary.push(t(endoKey));
  }
  { const rootPost = rootPostSummaryLabel(state); if(rootPost) summary.push(rootPost); }
  { const parts = endoCanalSummaryParts(state); if(parts) summary.push(`Endo: ${parts}`); }

  // Filling
  if(state.fillingMaterial !== "none"){
    const fillKey = {
      amalgam: "filling.option.amalgam", composite: "filling.option.composite",
      gic: "filling.option.gic", temporary: "filling.option.temporary",
    }[state.fillingMaterial];
    if(fillKey) summary.push(t(fillKey));
  }

  // SP10: filling defects (per filled surface). Gated on !hasCrown to match
  // the render (applyStateToSvgSingle), which suppresses fillings/defects
  // entirely under a crown/bridge — a crowned tooth's stored filling defect
  // must not be surfaced here when the chart shows nothing for it.
  if(state.fillingDefect && state.fillingDefect.size > 0 && state.restorationType === "none"){
    for(const [surf, val] of state.fillingDefect){
      if(val && val !== "none" && state.fillingSurfaceMaterials.has(surf)){
        summary.push(`${t("fillingDefect.label")} (${summarySurfaceLetter(surf, toothNo)}: ${t("fillingDefect." + val)})`);
      }
    }
  }

  // Bead odontogram-wxt: cervical involvement, gated on the SAME predicate as
  // the control — the surface must still carry the filling or the caries the
  // marker qualifies. Named as one line over both surfaces rather than one
  // line each, because it is one finding about the tooth's neck.
  if(state.cervicalSurfaces && state.cervicalSurfaces.size > 0){
    const surfaces = SUMMARY_SURFACE_ORDER
      .filter((surf) => state.cervicalSurfaces.has(surf) && cervicalInvolvementApplies(state, surf))
      .map((surf) => summarySurfaceLetter(surf, toothNo));
    if(surfaces.length) summary.push(`${t("cervical.label")} (${surfaces.join(", ")})`);
  }
  // Bead odontogram-d1b: cervical, side not documented — an open finding.
  if(cervicalSideUnknownAllowed(state) && state.cervicalSideUnknown?.size > 0){
    const kinds = CERVICAL_UNKNOWN_KINDS.filter((k) => state.cervicalSideUnknown.has(k))
      .map((k) => t("cervical.unknown." + k));
    summary.push(`${t("cervical.unknown.label")} (${kinds.join(", ")})`);
  }

  // Caries (+ SP9 coarse severity qualifier)
  if(state.caries.size > 0){
    const sev = cariesSeverityTierLabel(state);
    summary.push(sev ? `${t("caries.title")} (${sev})` : t("caries.title"));
  }
  // Root caries — SP9: show the value (active/arrested/active-cavitated), not just the generic label.
  if(state.rootCaries && state.rootCaries !== "none"){
    summary.push(`${t("caries.rootLabel")} (${t("rootCaries." + kebabToCamel(state.rootCaries))})`);
  }
  // SP9: clinical diagnoses (pulp / apical / resorption / peri-implant).
  for(const dx of diagnosisSummaryLabels(state)) summary.push(dx);

  // Mods
  if(state.mods.size > 0){
    for(const mod of state.mods){
      if(mod === "parodontal") summary.push(t("mods.parodontal"));
      else if(mod === "inflammation") summary.push(t("mods.periapicalInflammation"));
    }
  }
  // SP15 wholebranch fix: mobilityRowHidden() hides the mobility control on
  // an implant — the summary must not contradict that hidden control, so
  // suppress the line there too (stored value stays untouched, per T1).
  if(state.mobility !== "none" && state.toothSelection !== "implant") summary.push(t("inflammation.mobilityLabel") + " " + t(`mobility.${state.mobility}`));

  // SP9: previously-invisible findings.
  if(state.calculus) summary.push(t("calculus.label"));
  // FIX 1(d): peri-implant status is no longer in diagnosisSummaryLabels (it now
  // groups with periodontal findings), so push it here explicitly to keep the
  // tooltip showing it, alongside the other periodontal presence lines.
  { const pi = periImplantSummaryLabel(state); if(pi) summary.push(pi); }
  { const ip = implantPositionSummaryLabel(state); if(ip) summary.push(ip); }
  // SP-perio PG-C Task 1: derived Cairo recession TYPE (RT1-3), a periodontal
  // presence line alongside peri-implant status above — never stored, just
  // read via getToothRecessionType (see its doc comment for the rule).
  { const rt = getToothRecessionType(toothNo); if(rt !== "none") summary.push(t(`perio.recession.${rt}`)); }
  // SP-perio PG-C Task 3: CEJ visibility / root concavity — same periodontal
  // presence grouping as peri-implant status / recession type above.
  { const cej = cejVisibilitySummaryLabel(state); if(cej) summary.push(cej); }
  { const rc = rootConcavitySummaryLabel(state); if(rc) summary.push(rc); }
  // SP-perio PG-D Task 5: PI/GI (per-surface graded) + KG (mm) + GT
  // (biotype) + Miller (recession class) — same periodontal-presence
  // grouping as CEJ visibility / root concavity above.
  { const pi = plaqueIndexSummaryLine(toothNo); if(pi) summary.push(pi); }
  { const gi = gingivalIndexSummaryLine(toothNo); if(gi) summary.push(gi); }
  { const kg = keratinizedWidthSummaryLine(toothNo); if(kg) summary.push(kg); }
  { const gt = gingivalThicknessSummaryLabel(toothNo); if(gt) summary.push(gt); }
  { const mc = millerClassSummaryLabel(toothNo); if(mc) summary.push(mc); }
  // Bead odontogram-gry: Papillenverlust - der beobachtete Befund, in
  // derselben parodontalen Gruppe wie die abgeleitete Cairo-Klasse darueber.
  { const pl = papillaLossSummaryLine(toothNo); if(pl) summary.push(pl); }
  // SP-perio PG-E Task 3: mPI/mBI (Mombelli peri-implant indices) — same
  // periodontal-presence grouping as PI/GI/KG/GT/Miller above.
  { const mpi = periImplantPlaqueSummaryLine(toothNo); if(mpi) summary.push(mpi); }
  { const mbi = periImplantBleedingSummaryLine(toothNo); if(mbi) summary.push(mbi); }
  // Bead odontogram-vnt: what the periodontal VALUES above cannot say —
  // examined and normal, could not be measured, no such measurement point.
  // Last in the periodontal grouping, since it qualifies the lines above it.
  for(const line of assessmentSummaryLines(toothNo)) summary.push(line);
  // SP17 Task 1 Fix #2 (gate-parity follow-up): gate on the SAME FULL predicate
  // the #crownLeakageRow control uses (crownLeakageAllowed, ~line 2974) —
  // !restorationRowHidden(state) AND crown/bridge. Checking crown/bridge alone
  // is not enough: a tooth reachable via import/hydrate with a stale
  // restorationType of "crown"/"bridge" but a hidden restoration row (e.g.
  // milktooth, under-gum, extraction socket, or radix substrate) must not
  // show this line either. The stored crownLeakage value is left untouched.
  if(state.crownLeakage && !restorationRowHidden(state) && (state.restorationType === "crown" || state.restorationType === "bridge")) summary.push(t("crownLeakage.label"));
  if(state.crownMarginType && state.crownMarginType !== "none" && crownMarginAllowed(state)){
    const side = state.crownMarginSide ? " " + t("surface." + state.crownMarginSide) : "";
    summary.push(t("crownMarginType.label") + ": " + t("crownMarginType.option." + state.crownMarginType) + side);
  }
  if(state.splinted && isToothPresent(state.toothSelection)) summary.push(t("splint.label"));
  if(state.occlusalSplint && isToothPresent(state.toothSelection)) summary.push(t("occlusalSplint.label"));
  if(state.occlusalFunction && state.occlusalFunction !== "none" && isToothPresent(state.toothSelection)){
    summary.push(t("occlusalFunction.label") + ": " + t("occlusalFunction.option." + state.occlusalFunction));
  }
  if(state.rootCap && rootCapAllowed(state)) summary.push(t("rootCap.label"));
  if(onlayCoverageAllowed(state) && Array.isArray(state.onlayCoverage) && state.onlayCoverage.length){
    const surfs = state.onlayCoverage.map((sf: string) => t("surface." + sf)).join(", ");
    summary.push(t("onlayCoverage.label") + ": " + surfs);
  }
  if(inlayCoverageAllowed(state) && Array.isArray(state.inlayCoverage) && state.inlayCoverage.length){
    const surfs = state.inlayCoverage.map((sf: string) => t("surface." + sf)).join(", ");
    summary.push(t("inlayCoverage.label") + ": " + surfs);
  }
  if(veneerCoverageAllowed(state) && Array.isArray(state.veneerCoverage) && state.veneerCoverage.length){
    const surfs = state.veneerCoverage.map((sf: string) => t("surface." + sf)).join(", ");
    summary.push(t("veneerCoverage.label") + ": " + surfs);
  }
  if(state.endoResection) summary.push(t("endo.resection"));
  if(state.fissureSealing) summary.push(t("filling.fissureSealing"));
  if(state.parapulpalPin) summary.push(t("endo.parapulpalPin"));
  { const fx = fractureSummaryLabel(state); if(fx) summary.push(fx); }
  if(state.contactMesial) summary.push(t("tooth.contact.mesialMissing"));
  if(state.contactDistal) summary.push(t("tooth.contact.distalMissing"));
  // Review fix (post-SP11): gate wear on the same wearRowAllowed predicate the
  // render/UI row use — a crowned/non-natural-substrate tooth must not surface
  // a stored wearEdge/wearCervical value that the chart itself hides.
  if(wearRowAllowed(state)){
    if(state.wearEdge !== "none") summary.push(`${t("tooth.bruxism.edgeWear")}: ${t("wearType." + state.wearEdge)}`);
    if(state.wearCervical !== "none") summary.push(`${t("tooth.bruxism.neckWear")}: ${t("wearType." + state.wearCervical)}`);
  }
  // SP12 Task 4: gate discoloration on the same discolorationAllowed predicate
  // the render tint and UI row use — a crowned/non-natural-substrate tooth must
  // not surface a stored discoloration value that the chart itself hides.
  if(discolorationAllowed(state) && state.discoloration !== "none"){
    summary.push(`${t("discoloration.label")}: ${t("discoloration." + state.discoloration)}`);
  }
  // SP14 Task 4: gate orthodontic findings on the same orthoAllowed predicate
  // the render glyphs and the Ortho UI card use — an implant/missing/pontic
  // tooth must not surface a stored ortho value the chart itself hides.
  if(orthoAllowed(state)){
    const prog = state.orthoProgressive ? " (" + t("ortho.progressive.label") + ")" : "";
    const hasMove = state.orthoDrift !== "none" || state.orthoVertical !== "none" || state.orthoRotation === true;
    if(state.orthoAppliance !== "none") summary.push(`${t("ortho.appliance.label")}: ${t("ortho.appliance." + state.orthoAppliance)}`);
    if(state.orthoDrift !== "none") summary.push(`${t("ortho.drift.label")}: ${t("ortho.drift." + state.orthoDrift)}${prog}`);
    if(state.orthoVertical !== "none") summary.push(`${t("ortho.vertical.label")}: ${t("ortho.vertical." + state.orthoVertical)}${prog}`);
    if(state.orthoRotation === true) summary.push(t("ortho.rotation.label") + prog);
    // progressive with no movement charted yet: still surface it, so it isn't lost
    if(state.orthoProgressive && !hasMove) summary.push(t("ortho.progressive.label"));
  }

  // Flags
  if(state.extractionPlan) summary.push(t("tooth.extractionPlan"));
  if(state.crownReplace) summary.push(t("tooth.crownReplace"));
  if(state.crownNeeded) summary.push(t("tooth.crownNeeded"));
  if(state.bridgePillar) summary.push(t("tooth.bridgePillar"));
  if(state.extractionWound) summary.push(t("tooth.extractionWound"));
  if(state.missingClosed) summary.push(t("tooth.missingClosed"));

  // Plugin states
  const lang = getI18nLanguage();
  for(const plugin of registeredPlugins){
    const cs = state.customStates?.[plugin.id];
    if(cs !== undefined && cs !== null){
      const label = plugin.label[lang] || plugin.label["en"] || plugin.id;
      summary.push(label);
    }
  }

  return summary;
}

function updateToothTooltip(toothNo: number){
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const summary = getStateSummary(toothNo);
  const state = toothState.get(toothNo);
  const note = notesEnabled && state?.note ? state.note : "";
  let text = summary.length > 0 ? summary.join(" · ") : "";
  if(note) text = text ? text + "\n\u{1F4DD} " + note : "\u{1F4DD} " + note;
  for(const tile of tiles){
    if(text) tile.setAttribute("title", text);
    else tile.removeAttribute("title");
  }
}

function updateToothLabelNoteIcon(toothNo: number){
  const state = toothState.get(toothNo);
  const hasNote = notesEnabled && !!state?.note;
  // Update both upper and lower label maps
  for(const labelMap of [toothLabelUpper, toothLabelLower]){
    const cell = labelMap.get(toothNo);
    if(!cell) continue;
    let icon = cell.querySelector(".tooth-note-icon") as HTMLElement | null;
    if(hasNote){
      if(!icon){
        icon = el("span", { class: "tooth-note-icon", "aria-hidden": "true" });
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>';
        cell.appendChild(icon);
      }
    }else{
      if(icon) icon.remove();
    }
  }
}

// ---- State validation ----
function getStateWarnings(state: Any): string[]{
  const warnings: string[] = [];
  const isPresent = isToothPresent(state.toothSelection);
  const isNone = state.toothSelection === "none";
  const isImplant = state.toothSelection === "implant";

  // Endo on missing or implant tooth
  if(state.endo !== "none" && (isNone || isImplant)){
    warnings.push(t("warn.endoOnMissing"));
  }
  // Filling on missing tooth
  if(state.fillingMaterial !== "none" && isNone){
    warnings.push(t("warn.fillingOnMissing"));
  }
  // Crown replace without a fixed restoration present (mirrors the crownReplace
  // axis's appliesWhen in src/registry/axes.ts: tooth-base + restorationType !== "none").
  if(state.crownReplace && !(state.toothSelection === "tooth-base" && state.restorationType !== "none")){
    warnings.push(t("warn.crownReplaceNoCrown"));
  }
  // Caries on missing tooth
  if(state.caries.size > 0 && isNone){
    warnings.push(t("warn.cariesOnMissing"));
  }
  // Bridge pillar without a fixed restoration present (same tooth-base + restoration gate).
  if(state.bridgePillar && !(state.toothSelection === "tooth-base" && state.restorationType !== "none")){
    warnings.push(t("warn.pillarNoCrown"));
  }
  // Invalid restoration type/material combo (SP3b Task 6, spec §9 gap). Defense
  // in depth: hydrateState() already coerces an invalid pair on import, so this
  // should never fire for a state that only ever went through hydrateState —
  // but it reuses the SAME warning mechanism as every other check here as a
  // safety net for any other path (plugins, direct programmatic state writes)
  // that could still produce one. View-agnostic ("occlusal") for the same
  // reason as hydrateState's coercion: view is a render/UI concern, not a
  // data-validity one.
  if(!isValidRestoration(state.restorationType, state.restorationMaterial, "occlusal")){
    warnings.push(t("warn.invalidRestorationCombo"));
  }

  return warnings;
}

/** TEST-ONLY: run the clinical-consistency warning checks against a plain state
 *  object (no DOM/SVG involved). Not part of the public API. */
export function __getStateWarnings(state: Any): string[]{
  return getStateWarnings(state);
}

function updateWarningsFromState(state: Any){
  const w = $("#warnings");
  if(!w) return;
  const warnings = getStateWarnings(state);
  w.innerHTML = "";
  for(const msg of warnings){
    const item = el("div", { class: "warning-item", text: "⚠ " + msg });
    w.appendChild(item);
  }
}

// ---- Control sync ----

/** Apply the per-surface caries-depth indicator attributes to one
 *  `.surface-cell` (the ICDAS/3-bar `data-depth`/`data-icdas` badge, plus the
 *  SP5 Task 4 `data-radio` radiographic-depth attribute) for `cell`'s surface,
 *  read off `state`. `radiographicDepth` is a SEPARATE, independent per-surface
 *  scale from the unified visual severity `cariesSeverity` — no crosswalk between them
 *  (constitution); `data-radio` never touches `data-depth`/`data-icdas`/opacity
 *  or the SVG-fingerprint render (it lives outside `__renderActiveLayers`).
 *  Extracted out of `syncControlsFromState` so it can be exercised without the
 *  full DOM/asset-fetch wiring `initOdontogram()` needs (see
 *  `__syncSurfaceDepthIndicatorForTest`). */
function syncSurfaceDepthIndicator(cell: Element, state: Any): void {
  const c = cell.querySelector("input[type=checkbox]") as HTMLInputElement | null;
  const ind = cell.querySelector(".surf-depth") as HTMLElement | null;
  if(c && ind){
    const surface = String(c.value).replace("caries-", "");
    const code = state.cariesSeverity.get(surface) || 2;
    ind.setAttribute("data-depth", icdasToThreeLevel(code)); // drives 3-bar CSS
    ind.setAttribute("data-icdas", String(code));            // drives the badge
    ind.classList.toggle("icdas", icdasEnabled);
    ind.textContent = ""; // clear
    if(icdasEnabled){ ind.textContent = String(code); }      // badge number
    else { ind.innerHTML = "<i></i><i></i><i></i>"; }        // 3 bars
    // SP5 Task 5: `data-radio` reflects the surface's `radiographicDepth` value
    // (when set and not "none"), but ONLY when the radiographic-depth mode is on
    // (`!== "off"`). With the mode off (default) the badge is never emitted.
    const radio = state.radiographicDepth?.get(surface);
    if(radiographicDepthMode !== "off" && radio && radio !== "none"){ ind.setAttribute("data-radio", radio); }
    else { ind.removeAttribute("data-radio"); }
  }
}

/** TEST-ONLY: apply `syncSurfaceDepthIndicator`'s per-surface indicator-attribute
 *  logic (ICDAS `data-depth`/`data-icdas` badge + SP5 Task 4 `data-radio`) to a
 *  single hand-built `.surface-cell` element, without requiring a live grid /
 *  `initOdontogram()` (which needs real SVG-asset fetches). Not part of the
 *  public API. */
export function __syncSurfaceDepthIndicatorForTest(cell: Element, state: Record<string, unknown>): void {
  syncSurfaceDepthIndicator(cell, state as Any);
}

/** SP6 Task 2 (step 2): sync the recurrent-caries indicator on ONE
 *  filling-surface `.surface-cell`. The `.surf-depth` span is shown by CSS
 *  whenever the filling checkbox is checked (a filling exists on the surface),
 *  so the picker is always reachable to author recurrent caries. When the
 *  surface ALSO carries caries (`caries ∩ fillingSurfaceMaterials` → recurrent /
 *  `subcaries-{surface}`) it gets the `.has-subcaries` dark border and shows the
 *  CARS severity badge/bars; otherwise it renders a neutral (empty) affordance.
 *  Extracted for DOM-free unit testing. */
function syncFillingSubcariesIndicator(cell: Element, state: Any): void {
  const c = cell.querySelector("input[type=checkbox]") as HTMLInputElement | null;
  const ind = cell.querySelector(".surf-depth") as HTMLElement | null;
  if(!c || !ind) return;
  const surface = String(c.value);
  const hasSubcaries = !!state.fillingSurfaceMaterials?.has(surface) && !!state.caries?.has(`caries-${surface}`);
  ind.classList.toggle("has-subcaries", hasSubcaries);
  if(hasSubcaries){
    const code = state.cariesSeverity.get(surface) || 2;
    ind.setAttribute("data-depth", icdasToThreeLevel(code));
    ind.setAttribute("data-icdas", String(code));
    ind.classList.toggle("icdas", icdasEnabled);
    ind.textContent = "";
    if(icdasEnabled){ ind.textContent = String(code); }
    else { ind.innerHTML = "<i></i><i></i><i></i>"; }
  }else{
    // Neutral affordance: no CARS badge, just the faint 3-bar hint to click.
    ind.removeAttribute("data-depth");
    ind.removeAttribute("data-icdas");
    ind.classList.remove("icdas");
    ind.innerHTML = "<i></i><i></i><i></i>";
  }
}

/** TEST-ONLY sibling of {@link __syncSurfaceDepthIndicatorForTest} for the
 *  filling-surface recurrent-caries indicator. Not part of the public API. */
export function __syncFillingSubcariesIndicatorForTest(cell: Element, state: Record<string, unknown>): void {
  syncFillingSubcariesIndicator(cell, state as Any);
}

/** SP10 Task 3: sync the LEFT-side structural filling-defect indicator on ONE
 *  filling-surface `.surface-cell` (`.surf-defect`, mirroring the RIGHT-side
 *  `.surf-depth` / {@link syncFillingSubcariesIndicator}). A surface carries a
 *  defect only when it BOTH has a filling (`fillingSurfaceMaterials`) AND a
 *  non-"none" `fillingDefect` value — a defect value on an un-filled surface
 *  (stale/orphaned state) is defensively ignored. Extracted for DOM-free unit
 *  testing. */
function syncFillingDefectIndicator(cell: Element, state: Any): void {
  const c = cell.querySelector("input[type=checkbox]") as HTMLInputElement | null;
  const ind = cell.querySelector(".surf-defect") as HTMLElement | null;
  if(!c || !ind) return;
  const surface = String(c.value);
  const val = state.fillingDefect?.get(surface);
  const hasDefect = !!state.fillingSurfaceMaterials?.has(surface) && !!val && val !== "none";
  ind.classList.toggle("has-defect", hasDefect);
  if(hasDefect) ind.setAttribute("data-defect", String(val));
  else ind.removeAttribute("data-defect");
}

/** TEST-ONLY sibling of {@link __syncFillingSubcariesIndicatorForTest} for the
 *  filling-defect indicator. Not part of the public API. */
export function __syncFillingDefectIndicatorForTest(cell: Element, state: Record<string, unknown>): void {
  syncFillingDefectIndicator(cell, state as Any);
}

/** Bead odontogram-wxt: mark ONE `.surface-cell` as carrying the cervical
 *  marker, via a `data-cervical` attribute CSS renders as the BEMA suffix
 *  letter. Serves the caries cross and the filling cross alike — a caries
 *  checkbox's value is `caries-{surface}`, a filling checkbox's is the bare
 *  surface, so the prefix is stripped rather than assumed away.
 *
 *  The attribute is set only while the marker APPLIES (see
 *  `cervicalInvolvementApplies`), so clearing the last filling and the last
 *  caries lesion off a surface removes the badge even though the stored
 *  membership survives — the same display-gates-on-the-control's-predicate
 *  policy `crownLeakage` follows. This lives in the panel DOM, never in
 *  `__renderActiveLayers`, so it is outside the SVG fingerprint entirely. */
function syncCervicalIndicator(cell: Element, state: Any): void {
  const c = cell.querySelector("input[type=checkbox]") as HTMLInputElement | null;
  if(!c) return;
  const surface = String(c.value).replace(/^caries-/, "");
  const on = !!state.cervicalSurfaces?.has(surface) && cervicalInvolvementApplies(state, surface);
  if(on) cell.setAttribute("data-cervical", CERVICAL_MARKER);
  else cell.removeAttribute("data-cervical");
}

/** The letter BEMA writes for the cervical suffix ("vz"/"lz"). Held as a
 *  constant because it is a citation, not a style choice. */
const CERVICAL_MARKER = "z";

/** TEST-ONLY sibling of {@link __syncFillingDefectIndicatorForTest} for the
 *  cervical marker. Not part of the public API. */
export function __syncCervicalIndicatorForTest(cell: Element, state: Record<string, unknown>): void {
  syncCervicalIndicator(cell, state as Any);
}

/** A minimal shape covering what {@link subcariesLettersForTooth} and
 *  {@link computeFillingSubcariesSummaryLine} read from a tooth state. */
type SubcariesStateLike = { caries?: Set<string>; fillingSurfaceMaterials?: Map<string, string> } | undefined | null;

/** SP6 Task 4 (§7): the recurrent ("sub") caries surfaces on ONE tooth — a
 *  surface carries BOTH caries and a filling (`state.caries` has
 *  `caries-{surface}` AND `state.fillingSurfaceMaterials` has `{surface}`).
 *  Returns the surfaces' letters, in the codebase's existing anatomical order
 *  (`SUMMARY_SURFACE_ORDER`: B, M, O, D, L), concatenated with no separator
 *  (e.g. "MOD", "B"); "" when the tooth has no recurrent-caries surface.
 *  On an anterior tooth (§8) the occlusal/incisal surface's letter is "I"
 *  instead of "O" (the stored value is still plain "occlusal"). Pure and
 *  exported for direct unit testing. */
export function subcariesLettersForTooth(toothNo: number, state: SubcariesStateLike): string {
  if(!state || !state.caries || !state.fillingSurfaceMaterials) return "";
  const letters: string[] = [];
  for(const surface of SUMMARY_SURFACE_ORDER){
    if(surface === "subcrown") continue; // fillings never target subcrown
    if(state.caries.has(`caries-${surface}`) && state.fillingSurfaceMaterials.has(surface)){
      letters.push(summarySurfaceLetter(surface, toothNo));
    }
  }
  return letters.join("");
}

/** SP6 Task 4 (§7): the "Fillings and restorative" panel's informational
 *  subcaries-summary line — one entry per SELECTED tooth that has recurrent
 *  caries (see {@link subcariesLettersForTooth}), in `ALL_TEETH` order, styled
 *  "{FDI} ({letters})" and joined with ", ". Uses the singular phrasing
 *  (`filling.subcariesSummarySingle`) for exactly one such tooth, the plural
 *  (`filling.subcariesSummaryMultiple`) for more than one, and returns "" (no
 *  line — purely informational, hidden when empty) when none of the selected
 *  teeth have a recurrent-caries surface.
 *
 *  Pure/testable: takes the selected tooth numbers and a state lookup instead
 *  of reading the module's `selectedTeeth`/`toothState` globals directly. */
export function computeFillingSubcariesSummaryLine(
  selectedToothNos: Iterable<number>,
  getState: (toothNo: number) => SubcariesStateLike,
): string {
  const selected = new Set(selectedToothNos);
  const entries: string[] = [];
  for(const toothNo of ALL_TEETH){
    if(!selected.has(toothNo)) continue;
    const letters = subcariesLettersForTooth(toothNo, getState(toothNo));
    if(letters) entries.push(`${toothNo} (${letters})`);
  }
  if(entries.length === 0) return "";
  const key = entries.length > 1 ? "filling.subcariesSummaryMultiple" : "filling.subcariesSummarySingle";
  return t(key, { teeth: entries.join(", ") });
}

/** DOM sync for the fillings-panel subcaries-summary line (`#fillingSubcariesSummary`).
 *  No-op when the element isn't present (e.g. in a DOM-free test harness). */
function updateFillingSubcariesSummary(): void {
  const lineEl = $("#fillingSubcariesSummary");
  if(!lineEl) return;
  const line = computeFillingSubcariesSummaryLine(Array.from(selectedTeeth) as number[], (toothNo) => toothState.get(toothNo));
  lineEl.textContent = line;
  lineEl.classList.toggle("hidden", !line);
}

/** A minimal shape covering what {@link fillingDefectLettersForTooth} and
 *  {@link computeFillingDefectSummaryLine} read from a tooth state. */
type FillingDefectStateLike =
  | { fillingDefect?: Map<string, string>; fillingSurfaceMaterials?: Map<string, string>; restorationType?: string }
  | undefined
  | null;

/** SP16 Task 1: the filling-defect surfaces on ONE tooth, parallel to
 *  {@link subcariesLettersForTooth} — a surface carries a defect when it is
 *  BOTH present in `fillingSurfaceMaterials` AND has a non-"none"
 *  `fillingDefect` entry, gated the SAME way the existing whole-mouth
 *  filling-defect summary is (`restorationType === "none"`, i.e. defects are
 *  suppressed under a crown/bridge — see the `defects` derivation in
 *  {@link getOdontogramSummary}). Returns the surfaces' letters in
 *  `SUMMARY_SURFACE_ORDER`, concatenated with no separator; "" when the tooth
 *  has no defect surface (or no state). Pure and exported for direct unit
 *  testing. */
export function fillingDefectLettersForTooth(toothNo: number, state: FillingDefectStateLike): string {
  if(!state || !state.fillingDefect || !state.fillingSurfaceMaterials) return "";
  if(state.restorationType && state.restorationType !== "none") return "";
  const letters: string[] = [];
  for(const surface of SUMMARY_SURFACE_ORDER){
    if(surface === "subcrown") continue; // fillings never target subcrown
    if(state.fillingDefect.has(surface) && state.fillingSurfaceMaterials.has(surface)){
      letters.push(summarySurfaceLetter(surface, toothNo));
    }
  }
  return letters.join("");
}

/** SP16 Task 1: the "Fillings and restorative" panel's informational
 *  filling-defect-summary line, parallel to {@link computeFillingSubcariesSummaryLine}
 *  — one entry per SELECTED tooth that has a filling-defect surface (see
 *  {@link fillingDefectLettersForTooth}), in `ALL_TEETH` order, styled
 *  "{FDI} ({letters})" and joined with ", ". Uses the singular phrasing
 *  (`filling.fillingDefectSummarySingle`) for exactly one such tooth, the
 *  plural (`filling.fillingDefectSummaryMultiple`) for more than one, and
 *  returns "" (no line — purely informational, hidden when empty) when none
 *  of the selected teeth have a defect surface.
 *
 *  Pure/testable: takes the selected tooth numbers and a state lookup instead
 *  of reading the module's `selectedTeeth`/`toothState` globals directly. */
export function computeFillingDefectSummaryLine(
  selectedToothNos: Iterable<number>,
  getState: (toothNo: number) => FillingDefectStateLike,
): string {
  const selected = new Set(selectedToothNos);
  const entries: string[] = [];
  for(const toothNo of ALL_TEETH){
    if(!selected.has(toothNo)) continue;
    const letters = fillingDefectLettersForTooth(toothNo, getState(toothNo));
    if(letters) entries.push(`${toothNo} (${letters})`);
  }
  if(entries.length === 0) return "";
  const key = entries.length > 1 ? "filling.fillingDefectSummaryMultiple" : "filling.fillingDefectSummarySingle";
  return t(key, { teeth: entries.join(", ") });
}

/** DOM sync for the fillings-panel filling-defect-summary line
 *  (`#fillingDefectSummary`), parallel to {@link updateFillingSubcariesSummary}.
 *  No-op when the element isn't present (e.g. in a DOM-free test harness). */
function updateFillingDefectSummary(): void {
  const lineEl = $("#fillingDefectSummary");
  if(!lineEl) return;
  const line = computeFillingDefectSummaryLine(Array.from(selectedTeeth) as number[], (toothNo) => toothState.get(toothNo));
  lineEl.textContent = line;
  lineEl.classList.toggle("hidden", !line);
}

/** SP13 Task 2: toggle the wear (edge + cervical, shared wearDetailLevel) and
 *  discoloration (own discolorationDetailLevel) controls between their
 *  "complex" <select> and "simple" checkbox presentation, and derive each
 *  checkbox's `.checked` from the stored value. Non-collapsing: this ONLY
 *  flips `.hidden`/`.checked` — it never mutates `state`, so switching levels
 *  back and forth cannot lose/rewrite a stored value. Mirrors
 *  syncInflammationModVisibility / syncPeriImplantVisibility (small
 *  standalone syncs called from syncControlsFromState, independently
 *  testable since no full-DOM initOdontogram() mount harness exists for the
 *  tooth panel — see __syncInflammationModVisibilityForTest). */
function syncToothDetailControls(state: Any): void {
  const wearSimple = getWearDetailLevel() === "simple";
  $("#wearEdgeSelectLabel").classList.toggle("hidden", wearSimple);
  $("#wearEdgeToggleLabel").classList.toggle("hidden", !wearSimple);
  $("#wearCervicalSelectLabel").classList.toggle("hidden", wearSimple);
  $("#wearCervicalToggleLabel").classList.toggle("hidden", !wearSimple);
  ($("#wearEdgeToggle") as HTMLInputElement).checked = state.wearEdge !== "none";
  ($("#wearCervicalToggle") as HTMLInputElement).checked = state.wearCervical !== "none";
  const discoSimple = getDiscolorationDetailLevel() === "simple";
  $("#discolorationSelectLabel").classList.toggle("hidden", discoSimple);
  $("#discolorationToggleLabel").classList.toggle("hidden", !discoSimple);
  ($("#discolorationToggle") as HTMLInputElement).checked = state.discoloration !== "none";
}

/** TEST-ONLY: apply {@link syncToothDetailControls} to a hand-built DOM
 *  fragment (the wear/discoloration select+toggle labels and checkboxes),
 *  without requiring a live initOdontogram(). Mirrors
 *  __syncInflammationModVisibilityForTest. Not part of the public API. */
export function __syncToothDetailControlsForTest(state: Record<string, unknown>): void {
  syncToothDetailControls(state);
}

/**
 * SP-perio P1 Task 2: sync the #perioRow six-site PD/GM/BOP/SUP grid (built
 * once by {@link buildPerioGrid}) + the live derived read-out (per-site CAL,
 * tooth %BOP) for `toothNo`. Values are read via the SAME public
 * getToothPerio()/getToothCal() API the write path (buildPerioGrid's change
 * listeners) and later FHIR/export tasks use — this never re-derives CAL or
 * %BOP itself, it only formats what those functions already return. The row
 * is hidden via {@link perioRowHidden} (missing/implant/under-gum/
 * extraction-socket teeth have no probing site to chart); when hidden (or
 * `toothNo` is unset — e.g. no active tooth yet) the per-input sync is
 * skipped, mirroring syncToothDetailControls' small-standalone-sync shape.
 * Null-safe throughout (no-op when the grid/row/readout elements aren't
 * mounted — e.g. a DOM-free test harness), exactly like every other small
 * sync helper called from syncControlsFromState.
 */
function syncPerioRow(state: Any, toothNo: Any = activeTooth): void {
  const row = $("#perioRow");
  const hidden = perioRowHidden(state);
  if(row) row.classList.toggle("hidden", hidden);
  if(hidden || toothNo == null) return;
  const perio = getToothPerio(toothNo);
  const cal = getToothCal(toothNo);
  for(const site of PERIO_SITES){
    const pdInput = $(`#perio-pd-${site}`) as HTMLInputElement | null;
    if(!pdInput) continue; // grid not built (e.g. DOM-free test harness)
    const gmInput = $(`#perio-gm-${site}`) as HTMLInputElement;
    const bopInput = $(`#perio-bop-${site}`) as HTMLInputElement;
    const supInput = $(`#perio-sup-${site}`) as HTMLInputElement;
    const charted = Object.prototype.hasOwnProperty.call(perio.pd, site);
    pdInput.value = charted ? String(perio.pd[site]) : "";
    gmInput.value = (charted && Object.prototype.hasOwnProperty.call(perio.gm, site)) ? String(perio.gm[site]) : "";
    bopInput.checked = perio.bop.includes(site);
    supInput.checked = perio.sup.includes(site);
    // GM/BOP/SUP only ever apply to an already-charted site (see
    // setPerioSite's own contract) — disable them until PD is set, so an
    // edit there can never be a silent no-op the user doesn't understand.
    setDisabled(gmInput, !charted);
    setDisabled(bopInput, !charted);
    setDisabled(supInput, !charted);
  }
  const readoutEl = $("#perioReadout");
  if(readoutEl){
    const chartedSites = (PERIO_SITES as readonly string[]).filter((s) => Object.prototype.hasOwnProperty.call(perio.pd, s));
    if(chartedSites.length === 0){
      readoutEl.textContent = t("perio.readout.empty");
    }else{
      const calStr = chartedSites.map((s) => `${s} ${t("perio.cal")} ${cal.get(s)}`).join("   ");
      const bopCount = perio.bop.length;
      const pct = Math.round((bopCount / chartedSites.length) * 1000) / 10;
      readoutEl.textContent = `${calStr}   ${t("perio.bopPercent")} ${pct}% (${bopCount}/${chartedSites.length})`;
    }
  }
}

/** TEST-ONLY: apply {@link syncPerioRow} to a hand-built #perioRow DOM
 *  fragment for a given `toothNo`, without requiring a live initOdontogram()
 *  or a real `activeTooth`. Mirrors __syncToothDetailControlsForTest /
 *  __syncInflammationModVisibilityForTest. Not part of the public API. */
export function __syncPerioRowForTest(state: Record<string, unknown>, toothNo: number): void {
  syncPerioRow(state, toothNo);
}

/**
 * SP-perio P1 Task 2: build the static 6-site PD/GM/BOP/SUP grid ONCE — site
 * identities never change across teeth, mirroring buildSurfaceCross/
 * buildChecks building their option lists once in wireControls(); per-tooth
 * VALUES are synced separately by {@link syncPerioRow} (called from
 * syncControlsFromState on tooth select), exactly like the caries/filling
 * surface checkboxes' `.checked` is synced from state while the surface list
 * itself is built once. Two site-group rows in PERIO_SITES' own canonical
 * order (buccal MB/B/DB, then lingual/palatal ML/L/DL). Every control calls
 * setPerioSite(activeTooth, site, patch) DIRECTLY — NOT applyToSelected():
 * perio is inherently single-tooth, per-site data, not a bulk-across-
 * selection axis like mobility/caries — then re-syncs the row immediately,
 * since setPerioSite deliberately never touches DOM/SVG itself (see its own
 * doc comment).
 */
function buildPerioGrid(container: Any): void {
  if(!container) return;
  container.innerHTML = "";
  const buildSiteRow = (sites: readonly string[], rowClass: string) => {
    const rowEl = el("div", { class: `perio-site-row ${rowClass}` });
    for(const site of sites){
      const cell = el("div", { class: "perio-site-cell", "data-site": site }, [
        el("div", { class: "perio-site-label", title: t(`perio.site.${site}`), text: site }),
      ]);

      const pdInput = el("input", { type: "number", id: `perio-pd-${site}`, "data-site": site, "data-field": "pd", min: "1", max: "15", step: "1" });
      cell.appendChild(el("label", { class: "perio-field" }, [ el("span", { text: t("perio.pd") }), pdInput ]));

      const gmInput = el("input", { type: "number", id: `perio-gm-${site}`, "data-site": site, "data-field": "gm", min: "-10", max: "20", step: "1" });
      cell.appendChild(el("label", { class: "perio-field" }, [ el("span", { text: t("perio.gm") }), gmInput ]));

      const bopInput = el("input", { type: "checkbox", id: `perio-bop-${site}`, "data-site": site, "data-field": "bop" });
      cell.appendChild(el("label", { class: "perio-check" }, [ bopInput, el("span", { text: t("perio.bop") }) ]));

      const supInput = el("input", { type: "checkbox", id: `perio-sup-${site}`, "data-site": site, "data-field": "sup" });
      cell.appendChild(el("label", { class: "perio-check" }, [ supInput, el("span", { text: t("perio.sup") }) ]));

      const resync = () => {
        if(activeTooth == null) return;
        syncPerioRow(toothState.get(activeTooth), activeTooth);
      };
      pdInput.addEventListener("change", ()=>{
        if(activeTooth == null) return;
        const raw = pdInput.value.trim();
        setPerioSite(activeTooth, site, { pd: raw === "" ? null : Number(raw) });
        resync();
      });
      gmInput.addEventListener("change", ()=>{
        if(activeTooth == null) return;
        const raw = gmInput.value.trim();
        if(raw === "") return; // no explicit gm edit -> no-op (gm has no "unset" signal)
        setPerioSite(activeTooth, site, { gm: Number(raw) });
        resync();
      });
      bopInput.addEventListener("change", ()=>{
        if(activeTooth == null) return;
        setPerioSite(activeTooth, site, { bop: bopInput.checked });
        resync();
      });
      supInput.addEventListener("change", ()=>{
        if(activeTooth == null) return;
        setPerioSite(activeTooth, site, { sup: supInput.checked });
        resync();
      });

      rowEl.appendChild(cell);
    }
    container.appendChild(rowEl);
  };
  buildSiteRow(PERIO_SITES.slice(0, 3), "perio-buccal-row");
  buildSiteRow(PERIO_SITES.slice(3, 6), "perio-lingual-row");
}

/** TEST-ONLY: apply {@link buildPerioGrid} to a hand-built container, without
 *  requiring a live initOdontogram() (there is no full-DOM mount harness for
 *  the tooth panel — see sp14-ortho-ui.test.ts's header comment). Lets a test
 *  verify the real grid-building DOM shape (ids/data-attributes/types) that
 *  production wireControls() builds once at init. Not part of the public API. */
export function __buildPerioGridForTest(container: Element): void {
  buildPerioGrid(container);
}

function syncControlsFromState(state: Any){
  // 2.2.1 Plan-mode gating: the Plan chart records TREATMENT ("what a dentist
  // will DO"), so diagnosis-only / status-only controls are hidden while in
  // Plan. Woven into the individual show/hide predicates below (Base picker,
  // caries, wear, discoloration, pulp/apical/resorption diagnosis, and the
  // whole perio block) rather than a single post-hoc sweep, so each control's
  // Status behavior is untouched. See the tagged sites for specifics.
  const isPlan = getChartMode() === "plan";
  // Bead odontogram-fu1: die beiden Pruefzeilen. Sie werden AUSGEBLENDET, wo
  // die Pruefung nicht geht - an einer Luecke laesst sich nichts pruefen, und
  // ein Implantat hat keine Pulpa. Die Perkussion bleibt am Implantat, dort
  // ist Klopfempfindlichkeit ein periimplantaeres Zeichen.
  setSelectOptions($("#rootFractureSelect"), getRootFractureOptions(), state.rootFracture ?? "none");
  setSelectOptions($("#rootResectionSelect"), getRootResectionOptions(), state.rootResection ?? "none");
  $("#rootFractureRow").classList.toggle("hidden", !rootFractureAllowed(state));
  // Die Resektionszeile haengt am ZAHN, nicht nur am Zustand: an einem
  // Einwurzler ist keines der drei Verfahren moeglich.
  $("#rootResectionRow").classList.toggle(
    "hidden", !(activeTooth && rootResectionAllowed(state, activeTooth)));
  // Die beiden Wurzelschalter: nur bei mehr als einer Wurzel, und nur wenn der
  // Befund darueber ueberhaupt gesetzt ist. Bei der Praemolarisierung nicht -
  // dort wird keine Wurzel entfernt.
  const mehrwurzelig = !!activeTooth && rootsOf(activeTooth).length > 1;
  setSelectOptions($("#rootFractureRootSelect"), getRootOptions(activeTooth),
                   state.rootFractureRoot ?? "");
  setSelectOptions($("#rootResectionRootSelect"), getRootOptions(activeTooth),
                   state.rootResectionRoot ?? "");
  $("#rootFractureRootRow").classList.toggle(
    "hidden", !(mehrwurzelig && rootFractureAllowed(state) && state.rootFracture !== "none"));
  $("#rootResectionRootRow").classList.toggle(
    "hidden", !(mehrwurzelig && (state.rootResection === "hemisection"
                                 || state.rootResection === "amputation")));
  // Bead odontogram-0n8: nur an einem vorhandenen natuerlichen Zahn.
  setSelectOptions($("#eruptionSelect"), getEruptionOptions(), state.eruptionStage ?? "none");
  $("#eruptionRow").classList.toggle("hidden", !eruptionAllowed(state));
  // Bead odontogram-gry: je Zwischenraum eine Zeile. Der letzte Zahn im Bogen
  // hat distal keinen Nachbarn, also auch keine Papille - `papillaSites`
  // entscheidet, nicht der Zustand.
  {
    const erlaubt = !!activeTooth && papillaLossAllowed(activeTooth);
    const graded = activeTooth ? getToothPapillaLoss(activeTooth) : {};
    const stellen = activeTooth ? papillaSites(activeTooth) : [];
    for(const site of ["mesial", "distal"]){
      const gross = site === "mesial" ? "Mesial" : "Distal";
      setSelectOptions($(`#papilla${gross}Select`), getPapillaLossOptions(),
                       String(graded[site] ?? 0));
      $(`#papilla${gross}Row`).classList.toggle(
        "hidden", !(erlaubt && stellen.includes(site)));
    }
  }
  setSelectOptions($("#sensibilitySelect"), getSensibilityOptions(), state.sensibility ?? "none");
  setSelectOptions($("#percussionSelect"), getPercussionOptions(), state.percussion ?? "none");
  $("#sensibilityRow").classList.toggle("hidden", !sensibilityAllowed(state));
  $("#percussionRow").classList.toggle("hidden", !percussionAllowed(state));

  // SP4 Task 5: apical (AAE) diagnosis picker.
  setSelectOptions($("#apicalDxSelect"), getApicalDxOptions(), state.apicalDx);
  if($("#apicalDxSelect").value !== state.apicalDx){
    state.apicalDx = $("#apicalDxSelect").value;
  }
  $("#endoResection").checked = !!state.endoResection;
  $("#fissureSealing").checked = !!state.fissureSealing;
  $("#contactMesial").checked = !!state.contactMesial;
  $("#contactDistal").checked = !!state.contactDistal;
  setSelectOptions($("#wearEdgeSelect"), getWearEdgeOptions(), state.wearEdge);
  if($("#wearEdgeSelect").value !== state.wearEdge) state.wearEdge = $("#wearEdgeSelect").value;
  setSelectOptions($("#wearCervicalSelect"), getWearCervicalOptions(), state.wearCervical);
  if($("#wearCervicalSelect").value !== state.wearCervical) state.wearCervical = $("#wearCervicalSelect").value;
  setSelectOptions($("#discolorationSelect"), getDiscolorationOptions(), state.discoloration);
  if($("#discolorationSelect").value !== state.discoloration) state.discoloration = $("#discolorationSelect").value;
  setSelectOptions($("#orthoApplianceSelect"), getOrthoApplianceOptions(), state.orthoAppliance);
  if($("#orthoApplianceSelect").value !== state.orthoAppliance) state.orthoAppliance = $("#orthoApplianceSelect").value;
  setSelectOptions($("#orthoDriftSelect"), getOrthoDriftOptions(), state.orthoDrift);
  if($("#orthoDriftSelect").value !== state.orthoDrift) state.orthoDrift = $("#orthoDriftSelect").value;
  setSelectOptions($("#orthoVerticalSelect"), getOrthoVerticalOptions(), state.orthoVertical);
  if($("#orthoVerticalSelect").value !== state.orthoVertical) state.orthoVertical = $("#orthoVerticalSelect").value;
  setSelectOptions($("#orthoBracketSideSelect"), getOrthoBracketSideOptions(), state.orthoBracketSide ?? "buccal");
  if($("#orthoBracketSideSelect").value !== (state.orthoBracketSide ?? "buccal")) state.orthoBracketSide = $("#orthoBracketSideSelect").value;
  // Nur sichtbar, wenn ueberhaupt ein Bracket sitzt - ein Band hat keine Seite.
  $("#orthoBracketSideRow").classList.toggle("hidden", !(orthoAllowed(state) && state.orthoAppliance === "bracket"));
  ($("#orthoRotationToggle") as HTMLInputElement).checked = state.orthoRotation === true;
  ($("#orthoProgressiveToggle") as HTMLInputElement).checked = state.orthoProgressive === true;
  syncToothDetailControls(state);
  $("#brokenMesial").checked = !!state.brokenMesial;
  $("#brokenIncisal").checked = !!state.brokenIncisal;
  $("#brokenDistal").checked = !!state.brokenDistal;
  setSelectOptions($("#crownFractureTypeSelect"), getCrownFractureTypeOptions(), state.crownFractureType ?? "none");
  $("#crownFractureTypeRow").classList.toggle("hidden", !(activeTooth && isToothPresent(state.toothSelection)));
  $("#extractionWound").checked = !!state.extractionWound;
  $("#extractionPlan").checked = !!state.extractionPlan;
  $("#parapulpalPin").checked = !!state.parapulpalPin;
  $("#crownReplace").checked = !!state.crownReplace;
  $("#crownNeeded").checked = !!state.crownNeeded;
  $("#missingClosed").checked = !!state.missingClosed;
  $("#bridgePillar").checked = !!state.bridgePillar;
  $("#crownLeakage").checked = !!state.crownLeakage;
  $("#splinted").checked = !!state.splinted;
  $("#splintedRow").classList.toggle("hidden", !(activeTooth && isToothPresent(state.toothSelection)));
  $("#occlusalSplint").checked = !!state.occlusalSplint;
  $("#occlusalSplintRow").classList.toggle("hidden", !(activeTooth && isToothPresent(state.toothSelection)));
  setSelectOptions($("#occlusalFunctionSelect"), getOcclusalFunctionOptions(), state.occlusalFunction ?? "none");
  $("#occlusalFunctionRow").classList.toggle("hidden", !(activeTooth && isToothPresent(state.toothSelection)));
  $("#rootCap").checked = !!state.rootCap;
  $("#rootCapRow").classList.toggle("hidden", !(activeTooth && rootCapAllowed(state)));
  {
    const caps: Record<string, string> = { mesial: "Mesial", distal: "Distal", buccal: "Buccal", lingual: "Lingual", occlusal: "Occlusal" };
    const onCov: string[] = Array.isArray(state.onlayCoverage) ? state.onlayCoverage : [];
    for(const sf of Object.keys(caps)) $(`#onlayCov${caps[sf]}`).checked = onCov.includes(sf);
    $("#onlayCoverageRow").classList.toggle("hidden", !(activeTooth && onlayCoverageAllowed(state)));
    const inCov: string[] = Array.isArray(state.inlayCoverage) ? state.inlayCoverage : [];
    for(const sf of Object.keys(caps)) $(`#inlayCov${caps[sf]}`).checked = inCov.includes(sf);
    $("#inlayCoverageRow").classList.toggle("hidden", !(activeTooth && inlayCoverageAllowed(state)));
    const veCov: string[] = Array.isArray(state.veneerCoverage) ? state.veneerCoverage : [];
    for(const sf of Object.keys(caps)) $(`#veneerCov${caps[sf]}`).checked = veCov.includes(sf);
    $("#veneerCoverageRow").classList.toggle("hidden", !(activeTooth && veneerCoverageAllowed(state)));
  }
  const isMilktooth = state.toothSelection === "milktooth";
  const isImplant = state.toothSelection === "implant";
  const underGum = isUnderGum(state.toothSelection);
  const extraction = isExtraction(state.toothSelection) || (state.toothSelection === "none" && state.extractionWound);

  // tooth selection
  $("#toothSelect").value = state.toothSelection;

  // Substrate control (natural / radix / broken / crown-prep).
  setSelectOptions($("#substrateSelect"), getSubstrateOptions(), state.toothSubstrate);
  if($("#substrateSelect").value !== state.toothSubstrate){
    state.toothSubstrate = $("#substrateSelect").value;
  }

  // Combined restoration dropdown — one <select> encodes `${type}|${material}`
  // and writes BOTH fields. Options are filtered by the active tooth's view.
  const restoView = restorationViewFor(activeTooth);
  // The ONE dropdown reflects EITHER a fixed restoration OR a "Kivehető:"
  // prosthesis (never both — FIX 4 coherence). Prefer the prosthesis encoding
  // when one is set.
  const restoSelected = state.prosthesis && state.prosthesis !== "none"
    ? `prosthesis|${state.prosthesis}`
    : `${state.restorationType}|${state.restorationMaterial}`;
  setSelectOptions($("#restorationSelect"), getRestorationOptions(restoView, { isImplant, toothSelection: state.toothSelection }), restoSelected);
  {
    const val = String($("#restorationSelect").value);
    if(val.startsWith("prosthesis|")){
      const p = val.slice("prosthesis|".length);
      if(state.prosthesis !== p){ state.prosthesis = p; }
      state.restorationType = "none";
      state.restorationMaterial = "none";
    }else{
      const [selType, selMat] = val.split("|");
      if(selType !== state.restorationType || selMat !== state.restorationMaterial){
        state.restorationType = selType || "none";
        state.restorationMaterial = selMat || "none";
      }
      if(state.prosthesis !== "none"){ state.prosthesis = "none"; }
    }
  }

  // Gating: milktooth / under-gum / extraction / radix substrate carry no
  // fixed restoration (mirrors the old crownMaterial="natural" reset).
  // Implants are exempt — a fixed crown/bridge on an abutment is
  // first-class (Task 3): the restorationOptions(ctx) call above already
  // restricts an implant's dropdown to crown/bridge × material. A radix
  // substrate (root remnant) is included here (SP15 wholebranch fix): the
  // restoration row is hidden for it (restorationRowHidden above), so a
  // stored crown must be cleared too — otherwise it keeps rendering
  // (emax-crown over tooth-radix) with no control left to clear it.
  if(isMilktooth || underGum || extraction || state.toothSubstrate === "radix"){
    state.restorationType = "none";
    state.restorationMaterial = "none";
    $("#restorationSelect").value = "none|none";
  }
  // Substrate applies only to a present permanent tooth.
  if(state.toothSelection !== "tooth-base"){
    state.toothSubstrate = "natural";
    $("#substrateSelect").value = "natural";
  }
  // SP7 Task 4: merged pulp/endo status selector (two optgroups). Displayed
  // value derives from (endo, pulpDx) via pulpEndoDisplayValue; the change
  // handler (wireControls) routes selection through pulpEndoOnSelect, which
  // enforces the mutual-exclusion invariant, so no post-sync normalization is
  // needed here (unlike the old #endoSelect block this replaces).
  buildPulpEndoSelect($("#pulpEndoSelect"), isMilktooth, pulpEndoDisplayValue(state), isPlan);
  setSelectOptions($("#rootPostSelect"), getRootPostOptions(isMilktooth), state.rootPostType ?? "none");
  setSelectOptions($("#fillingSelect"), getFillingOptions(isMilktooth), state.fillingMaterial);
  if($("#fillingSelect").value !== state.fillingMaterial){
    state.fillingMaterial = $("#fillingSelect").value;
  }
  setSelectOptions($("#mobilitySelect"), getMobilityOptions(), state.mobility);
  if($("#mobilitySelect").value !== state.mobility){
    state.mobility = $("#mobilitySelect").value;
  }
  // mods
  $$("#modsChecks input[type=checkbox]").forEach(c => c.checked = state.mods.has(c.value));
  // SP4: the periapical lesion-subtype row follows the apical diagnosis on a
  // present tooth (apicalDx !== "normal"). A non-present tooth (implant/missing)
  // never derives apicalDx but CAN still carry `mods.inflammation` (peri-implant /
  // periodontal, still toggleable) — for those, keep the pre-SP4 behaviour and
  // show the subtype row when the inflammation mod is set, so the lesion subtype
  // stays authorable (regression fix).
  $("#periapicalTypeRow").classList.toggle("hidden", !periapicalRowVisible(state) || isPlan);
  setSelectOptions($("#periapicalTypeSelect"), getPeriapicalTypeOptions(), state.periapicalType);
  if($("#periapicalTypeSelect").value !== state.periapicalType){
    state.periapicalType = $("#periapicalTypeSelect").value;
  }
  // Apikal pro Wurzel: which root carries the lesion — only on a multi-rooted
  // tooth with an apical diagnosis charted.
  const apicalRootVisible = !!activeTooth && (state.apicalDx ?? "normal") !== "normal" && rootsOf(activeTooth).length > 1;
  setSelectOptions($("#apicalRootSelect"), getRootOptions(activeTooth), state.apicalRoot ?? "");
  $("#apicalRootRow").classList.toggle("hidden", !apicalRootVisible || isPlan);
  $("#calculusToggle").checked = !!state.calculus;
  const calculusAllowed = state.toothSelection === "tooth-base" || state.toothSelection === "milktooth";
  $("#calculusRow").classList.toggle("hidden", !calculusAllowed);
  // Bead odontogram-d1b: cervical, side not documented — one switch in each
  // of the caries and fillings cards, on the same predicate as the setter.
  const cervUnknownAllowed = cervicalSideUnknownAllowed(state);
  for(const [kind, id] of [["filling", "Filling"], ["caries", "Caries"]] as const){
    const box = $("#cervicalUnknown" + id) as HTMLInputElement | null;
    if(box) box.checked = cervUnknownAllowed && !!state.cervicalSideUnknown?.has(kind);
    $("#cervicalUnknown" + id + "Row")?.classList.toggle("hidden", !cervUnknownAllowed);
  }
  // SP8 Task 5: periImplant (enum) is authored via a picker, shown only for an
  // implant; on an implant it also supersedes the parodontal/inflammation mods.
  setSelectOptions($("#periImplantSelect"), getPeriImplantOptions(), state.periImplant);
  if($("#periImplantSelect").value !== state.periImplant){
    state.periImplant = $("#periImplantSelect").value;
  }
  syncPeriImplantVisibility($("#periImplantRow"), $("#modsChecks"), state.toothSelection);
  // Implantatposition — same implant-only gate as #periImplantRow.
  setSelectOptions($("#implantPositionSelect"), getImplantPositionOptions(), state.implantPosition ?? "center");
  $("#implantPositionRow")?.classList.toggle("hidden", state.toothSelection !== "implant");
  syncImplantProduct(state);
  syncRestorationProduct(state);   // Bead odontogram-99h
  syncFillingProduct(activeTooth);  // Bead odontogram-99h, zweiter Teil
  // SP7 Task 5 (extended by SP15 Task 3 / B4): the periapical-inflammation mod
  // is retired as an authoring control on a PRESENT tooth (apicalDx drives the
  // glyph) AND on an implant (periImplant covers implant inflammation). It
  // stays visible for a missing tooth or an extraction-socket, where it marks
  // periodontal inflammation that neither apicalDx nor periImplant cover.
  // MUST run after syncPeriImplantVisibility() above — see that function's and
  // syncInflammationModVisibility's doc comments for why the order matters.
  syncInflammationModVisibility($("#modsChecks"), state.toothSelection);
  // SP4 Task 5: resorptionType (enum) is authored via a none/internal/
  // external-cervical picker (both subtypes render identically; the picker only
  // records which). Replaces the interim on/off checkbox.
  setSelectOptions($("#resorptionSelect"), getResorptionOptions(), state.resorptionType);
  if($("#resorptionSelect").value !== state.resorptionType){
    state.resorptionType = $("#resorptionSelect").value;
  }

  // caries (cross surfaces + the separate subcrown row) + per-surface depth indicator
  // (ICDAS `data-depth`/`data-icdas` badge + SP5 Task 4 `data-radio` — see
  // syncSurfaceDepthIndicator())
  $$("#cariesChecks input[type=checkbox], #cariesSubcrownRow input[type=checkbox]").forEach(c => c.checked = state.caries.has(c.value));
  $$("#cariesChecks .surface-cell").forEach(cell => syncSurfaceDepthIndicator(cell, state));
  // Bead odontogram-wxt: the cervical marker badge, on the caries cross.
  $$("#cariesChecks .surface-cell").forEach(cell => syncCervicalIndicator(cell, state));

  // Depth selector at the top sets the DEFAULT depth for newly tapped surfaces.
  // SP5 Task 5: the whole visual caries-depth UI is gated by `cariesDepthEnabled`.
  $("#cariesDepthRow").classList.toggle("hidden", !cariesDepthEnabled || isPlan);
  setSelectOptions($("#cariesDepthSelect"), getCariesDepthOptions(), state.cariesActiveDepth);
  if($("#cariesDepthSelect").value !== String(state.cariesActiveDepth)){
    state.cariesActiveDepth = Number($("#cariesDepthSelect").value);
  }

  // SP5 Task 5: per-tooth root-caries picker. Options come from the current
  // `rootCariesMode`; the stored value is displayed collapsed to that list but
  // NEVER written back (non-collapsing — widening the mode reveals it again).
  // Shown only on a present tooth (mirrors the endo/pulp per-tooth controls).
  setSelectOptions($("#rootCariesSelect"), rootCariesOptions(), rootCariesDisplayValue(rootCariesMode, state.rootCaries));
  $("#rootCariesRow").classList.toggle("hidden", !isToothPresent(state.toothSelection) || isPlan);

  // filling surfaces
  $$("#fillingSurfaceChecks input[type=checkbox]").forEach(c => {
    c.checked = state.fillingSurfaceMaterials.has(c.value);
    const cell = c.closest(".surface-cell") as HTMLElement | null;
    if(cell){
      const mat = state.fillingSurfaceMaterials.get(c.value);
      cell.setAttribute("data-material", mat || "");
    }
  });
  // SP6 Task 2 (step 2): recurrent-caries dark-border indicator on filled surfaces.
  $$("#fillingSurfaceChecks .surface-cell").forEach(cell => syncFillingSubcariesIndicator(cell, state));
  // SP10 Task 3: structural filling-defect dark-border indicator (LEFT side).
  $$("#fillingSurfaceChecks .surface-cell").forEach(cell => syncFillingDefectIndicator(cell, state));
  // Bead odontogram-wxt: the same cervical marker badge, on the filling cross.
  $$("#fillingSurfaceChecks .surface-cell").forEach(cell => syncCervicalIndicator(cell, state));

  // disable logic in UI
  const hasCrown = state.restorationType !== "none";
  const hasRemovable = state.toothSelection === "none"
    && (state.prosthesis === "removable-partial" || state.prosthesis === "removable-full");
  const hasRestoration = hasCrown || hasRemovable;
  $$("#cariesChecks input[type=checkbox], #cariesSubcrownRow input[type=checkbox]").forEach(c => {
    if(c.value === "caries-subcrown") setDisabled(c, !hasCrown);
    else setDisabled(c, hasRestoration || hasCrown);
  });
  const showFillingSurfaces = state.fillingMaterial !== "none" && !hasCrown;
  $("#fillingSurfaceChecks").classList.toggle("hidden", !showFillingSurfaces);

  // endo only if tooth present
  const endoDisabled = !isToothPresent(state.toothSelection) || underGum || extraction;
  setDisabled($("#pulpEndoSelect"), endoDisabled);
  // Imported milk-tooth posts are valid in the document, Dental Core mapping,
  // and shipped primary-tooth artwork. Keep the control enabled so it honestly
  // represents and can clear/change the value already shown on the tooth.
  setDisabled($("#rootPostSelect"), endoDisabled);
  setDisabled($("#apicalDxSelect"), endoDisabled);
  setDisabled($("#resorptionSelect"), endoDisabled);
  setDisabled($("#endoResection"), endoDisabled);
  setDisabled($("#parapulpalPin"), endoDisabled);
  setDisabled($("#mobilitySelect"), mobilityDisabled(state));

  const selectedArr = selectedTeeth.size > 0 ? Array.from(selectedTeeth) : [];
  const hiddenSelected = selectedArr.length > 0 && selectedArr.some(tn => {
    const sel = toothState.get(tn)?.toothSelection;
    return sel === "implant" || sel === "none" || sel === "tooth-under-gum" || sel === "no-tooth-after-extraction";
  });
  const hideByBase = state.toothSelection === "implant" || state.toothSelection === "none" || underGum || extraction || hiddenSelected;
  const noneSelected = selectedArr.length > 0 && selectedArr.some(tn => toothState.get(tn)?.toothSelection === "none");
  const hideByNone = state.toothSelection === "none" || noneSelected;
  const hideByRadix = state.toothSubstrate === "radix";
  // 2.2.1 Plan-mode: caries is a status finding (a diagnosis), so the whole
  // caries section is hidden in Plan — a filling/restoration is still plannable
  // via the Fillings + Restoration controls, which stay visible.
  $("#cariesSection").classList.toggle("hidden", hideByBase || hideByRadix || isPlan);
  const hideFillingsByCrown = state.toothSelection === "tooth-base" && hasCrown;
  $("#fillingSection").classList.toggle("hidden", hideByBase || hideFillingsByCrown);
  // Combined restoration dropdown: available on a present permanent tooth and on
  // a gap (bridge pontic); hidden for milk/implant/under-gum/extraction.
  const hideRestorationRow = restorationRowHidden(state);
  $("#restorationRow").classList.toggle("hidden", hideRestorationRow);
  // Substrate control: only for a present permanent tooth.
  const hideSubstrateRow = state.toothSelection !== "tooth-base";
  $("#substrateRow").classList.toggle("hidden", hideSubstrateRow);
  $("#brokenCrownRow").classList.toggle("hidden", state.toothSubstrate !== "broken" || hideSubstrateRow);
  $("#extractionRow").classList.toggle("hidden", state.toothSelection !== "none");
  // SP7 Task 5: the merged Root+Periodontium card reconciles the two original
  // cards' different hide predicates — the root block (endo/apical/lesion/
  // resorption/resection/pin) keeps the old #endoSection predicate
  // (hideByBase), the perio block (mobility/mods/calculus) keeps the old
  // #inflammationSection predicate (hideByNone); the card itself only
  // collapses away when BOTH blocks would be empty.
  $("#rpRootBlock").classList.toggle("hidden", hideByBase);
  // 2.2.1 Plan-mode: the entire periodontal block (mobility, 6-site probing
  // grid, inflammation/parodontal mods, calculus, peri-implant status) is
  // status-only diagnosis — hidden in Plan. The root block stays visible so
  // endo TREATMENT remains plannable.
  $("#rpPerioBlock").classList.toggle("hidden", hideByNone || isPlan);
  // Section collapses only when BOTH blocks are gone; in Plan the root block
  // still shows, so the section stays (unless the base already hides it).
  $("#rootPeriodontiumSection").classList.toggle("hidden", hideByBase && (hideByNone || isPlan));
  // 2.2.1 Plan-mode: inside the still-visible root block, hide the diagnosis-
  // only rows (apical diagnosis, periapical lesion subtype above, root
  // resorption). Endo TREATMENT (root canal/post via #pulpEndoSelect,
  // apicoectomy, parapulpal pin) stays plannable.
  $("#apicalDxRow").classList.toggle("hidden", isPlan);
  $("#resorptionRow").classList.toggle("hidden", isPlan);
  const selectedList = selectedArr.length > 0 ? selectedArr : (activeTooth ? [activeTooth] : []);
  const contactAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    const allowedBase = s && (s.toothSelection === "tooth-base" || s.toothSelection === "milktooth" || BROKEN_VARIANTS.has(s.toothSelection));
    if(!allowedBase) return false;
    if(s.toothSelection === "tooth-base" && s.restorationType !== "none") return false;
    return true;
  });
  // 2.2.1 Plan-mode: tooth wear is a status finding — not plannable treatment.
  const bruxismAllowed = !isPlan && selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && wearRowAllowed(s);
  });
  // SP12 Task 3: #discolorationRow visibility gate — reuses the same
  // discolorationAllowed predicate the render tint and tooltip use, so the
  // dropdown's visibility never contradicts the chart (SP9/10/11 lesson).
  // 2.2.1 Plan-mode: discoloration is a status finding — hidden in Plan.
  const discolorationRowAllowed = !isPlan && selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && discolorationAllowed(s);
  });
  // SP14 Task 3: #orthoCard visibility gate — reuses the same orthoAllowed
  // predicate the render glyphs and tooltip use (Task 2/4), so the card's
  // visibility never contradicts the chart (SP9/10/11 lesson).
  const orthoCardAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && orthoAllowed(s);
  });
  const fissureAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && s.toothSelection === "tooth-base" && FISSURE_ALLOWED.has(tn);
  });
  $("#contactPointRow").classList.toggle("hidden", !contactAllowed);
  $("#bruxismRow").classList.toggle("hidden", !bruxismAllowed);
  $("#discolorationRow").classList.toggle("hidden", !discolorationRowAllowed);
  $("#orthoCard").classList.toggle("hidden", !orthoCardAllowed);
  $("#fissureSealingRow").classList.toggle("hidden", !fissureAllowed);
  const extractionPlanAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && ["tooth-base","milktooth","implant","tooth-under-gum"].includes(s.toothSelection);
  });
  $("#extractionPlanRow").classList.toggle("hidden", !extractionPlanAllowed);
  // crown-replace: visible when permanent tooth carries a fixed restoration
  const crownReplaceAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && s.toothSelection === "tooth-base" && s.restorationType !== "none";
  });
  $("#crownReplaceRow").classList.toggle("hidden", !crownReplaceAllowed);
  // crown-needed: visible when permanent tooth has no restoration yet (natural/broken/crown-prep substrate)
  const crownNeededAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && s.toothSelection === "tooth-base" && s.restorationType === "none" && ["natural","broken","crownprep"].includes(s.toothSubstrate);
  });
  $("#crownNeededRow").classList.toggle("hidden", !crownNeededAllowed);
  // missing-closed: visible when foghiány
  const missingClosedAllowed = selectedList.length > 0 && selectedList.every(tn => {
    const s = toothState.get(tn);
    return s && s.toothSelection === "none";
  });
  $("#missingClosedRow").classList.toggle("hidden", !missingClosedAllowed);
  const restorationRowCurrentlyHidden = $("#restorationRow").classList.contains("hidden");
  const bridgePillarAllowed = !restorationRowCurrentlyHidden && state.restorationType !== "none";
  $("#bridgePillarRow").classList.toggle("hidden", !bridgePillarAllowed);
  // Bead odontogram-5rv: "schwebend" nur am Brueckenglied, und der Hinweis nur
  // dort, wo die Spanne wirklich einen verdient.
  $("#cantilever").checked = !!state.cantilever;
  $("#cantileverRow").classList.toggle("hidden", !cantileverAllowed(state));
  {
    const el = $("#bridgeSupportGap");
    if(el){
      const luecke = activeTooth != null ? bridgeSupportGap(activeTooth) : null;
      el.classList.toggle("hidden", !luecke);
      if(luecke) el.textContent = t(`bridgeSupport.${luecke}`);
    }
  }
  // Crown-leakage toggle: only meaningful on a fixed crown/bridge restoration
  // (mirrors the crownLeakage axis's appliesWhen in src/registry/axes.ts).
  const crownLeakageAllowed = !restorationRowCurrentlyHidden && (state.restorationType === "crown" || state.restorationType === "bridge");
  $("#crownLeakageRow").classList.toggle("hidden", !crownLeakageAllowed);
  setSelectOptions($("#crownMarginTypeSelect"), getCrownMarginTypeOptions(), state.crownMarginType ?? "none");
  setSelectOptions($("#crownMarginSideSelect"), getCrownMarginSideOptions(), state.crownMarginSide ?? "");
  $("#crownMarginRow").classList.toggle("hidden", !crownLeakageAllowed);
  // Bead odontogram-dma: the retention row offers exactly what THIS tooth can
  // carry — one predicate, shared with the setter, so the picker can never show
  // an element the setter would drop. Hidden entirely on a tooth that can hold
  // nothing (a gap, an implant, an un-erupted position).
  const retentionChoices = retentionOptions(state);
  const retentionAllowedHere = retentionChoices.length > 1;
  $("#retentionRow").classList.toggle("hidden", !retentionAllowedHere || isPlan);
  if(retentionAllowedHere){
    setSelectOptions($("#retentionSelect"),
      retentionChoices.map((v) => ({ value: v, label: t("retention." + kebabToCamel(v)) })),
      retentionAllowed(state, state.retention) ? state.retention : "none");
    // The side only means something once an element engages one.
    const sideEl = $("#retentionSideSelect") as HTMLSelectElement;
    const hasElement = state.retention !== "none" && retentionAllowed(state, state.retention);
    setSelectOptions(sideEl,
      ["none", "mesial", "distal", "both"].map((v) => ({ value: v, label: t("retentionSide." + v) })),
      hasElement ? (state.retentionSide ?? "none") : "none");
    sideEl.disabled = !hasElement || readOnly;
  }

  const extractionPlanRow = $("#extractionPlanRow");
  const brokenCrownRow = $("#brokenCrownRow");
  const bruxismRow = $("#bruxismRow");
  const crownActionsRow = $("#crownActionsRow");
  if(extractionPlanRow && brokenCrownRow && bruxismRow && crownActionsRow){
    const brokenMode = state.toothSubstrate === "broken" && state.toothSelection === "tooth-base";
    if(brokenMode){
      if(extractionPlanRow.parentElement !== brokenCrownRow){
        brokenCrownRow.appendChild(extractionPlanRow);
      }
      crownActionsRow.classList.add("hidden");
    }else if(!bruxismRow.classList.contains("hidden")){
      if(extractionPlanRow.parentElement !== bruxismRow){
        bruxismRow.appendChild(extractionPlanRow);
      }
      crownActionsRow.classList.add("hidden");
    }else{
      if(extractionPlanRow.parentElement !== crownActionsRow){
        crownActionsRow.appendChild(extractionPlanRow);
      }
      crownActionsRow.classList.toggle("hidden", !extractionPlanAllowed);
    }
    extractionPlanRow.classList.toggle("hidden", !extractionPlanAllowed);
  }
  // SP8 Task 5: the dedicated periImplant axis now owns "peri-implantitis";
  // the parodontal mod keeps its plain label on every tooth type.
  const parodontLabel = $("#lbl-parodontal");
  if(parodontLabel){ parodontLabel.textContent = t("mods.parodontal"); }

  const milkOption = $("#toothSelect").querySelector('option[value="milktooth"]');
  if(milkOption){
    const anyBlocked = selectedArr.length > 0
      ? selectedArr.some(tn => MILKTOOTH_BLOCKED.has(Number(tn)))
      : (activeTooth ? MILKTOOTH_BLOCKED.has(activeTooth) : false);
    milkOption.disabled = anyBlocked;
  }

  const inflammationLabel = $("#lbl-inflammation");
  if(inflammationLabel){
    inflammationLabel.textContent = extraction ? t("mods.periodontalInflammation") : t("mods.periapicalInflammation");
  }
  $("#mobilityRow").classList.toggle("hidden", mobilityRowHidden(state));
  // SP-perio P1 Task 2: sync the #perioRow six-site grid + derived read-out
  // from state on every syncControlsFromState() call — i.e. on tooth select,
  // mirroring exactly how mobility syncs its own control above.
  syncPerioRow(state);
  const parodontalInput = $("#chk-parodontal");
  if(parodontalInput){
    setDisabled(parodontalInput, extraction);
  }
  if(extraction){
    const inflammationInput = $("#chk-inflammation");
    if(inflammationInput) setDisabled(inflammationInput, false);
  }

  // SP6 Task 4 (§8): re-resolve the "occlusal"/"incisal" surface-picker labels
  // for the (possibly just-changed) active tooth — anterior vs. posterior only
  // affects the displayed label, never the stored surface value.
  refreshCheckLabels();
  // SP6 Task 4 (§7): the "Fillings and restorative" panel's informational
  // subcaries-summary line depends on ALL selected teeth, not just the active
  // one, so it reads `selectedTeeth`/`toothState` directly rather than `state`.
  updateFillingSubcariesSummary();
  // SP16 Task 1: parallel filling-defect-summary line, same all-selected-teeth
  // rationale as updateFillingSubcariesSummary above.
  updateFillingDefectSummary();
}

// ---- Event handlers ----
function applyAndSync(toothNo: Any){
  applyStateToSvg(toothNo);
  updateToothTileNumber(toothNo);
  if(toothNo === activeTooth){
    syncControlsFromState(toothState.get(toothNo));
  }
  if(edentulous && !suppressEdentulousSync){
    setEdentulous(false);
  }
  updateSelectionFilterButtons();
}

function applyToSelected(fn: Any){
  if(selectedTeeth.size === 0) return;
  // DS-1: route the whole selection edit through the batch gate — in plan mode
  // every selected tooth is marked plan-edited; in status mode (plan
  // initialized) every selected tooth that is NOT already plan-edited mirrors
  // status->plan after the batch (planned teeth diverge). Uninitialized plan is
  // a pure passthrough (byte-identical to the pre-dual-state behavior).
  const toothNos = Array.from(selectedTeeth) as number[];
  gateToothEditBatch(toothNos, () => {
    for(const toothNo of toothNos){
      const s = toothState.get(toothNo);
      if(!s) continue;
      fn(s, toothNo);
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
    }
    if(activeTooth && selectedTeeth.has(activeTooth)){
      syncControlsFromState(toothState.get(activeTooth));
    }
    if(edentulous && !suppressEdentulousSync){
      setEdentulous(false);
    }
    updateSelectionFilterButtons();
    notifyStateChange();
  });
}

/** DS-1 (review Fix 1): reset a SINGLE tooth to `defaultState()`, routed through
 *  the edit {@link gateToothEdit} so a per-tooth reset behaves like every other
 *  edit — on an un-planned tooth it mirrors status->plan (no spurious diff), on
 *  a plan-edited tooth it CONFIRMS before applying (parity with clearing the
 *  tooth via the restoration dropdown). Render + control-sync live INSIDE the
 *  gated closure so on the deferred-confirm path they run only on Accept.
 *  Shared by the zoom-popover and context-menu single-tooth reset buttons + the
 *  `__resetToothForTest` seam. */
function resetToothGated(toothNo: number): void {
  gateToothEdit(toothNo, () => {
    toothState.set(toothNo, defaultState());
    applyStateToSvg(toothNo);
    updateToothTileNumber(toothNo);
    if(activeTooth === toothNo) syncControlsFromState(toothState.get(toothNo));
  });
}

/** DS-1 (review Fix 1): reset a SET of selected teeth to `defaultState()`,
 *  routed through {@link gateToothEditBatch} — one confirm covers the whole set
 *  when it touches a plan-edited tooth; un-planned teeth mirror status->plan.
 *  The `edentulous` flip + render + control-sync all live INSIDE the gated
 *  closure so on the deferred-confirm path they take effect only on Accept
 *  (no flag/teeth mismatch on Cancel — same rationale as `setEdentulous` and
 *  the dentition presets). Shared by the "Reset selected teeth" button + the
 *  `__resetTeethForTest` seam. */
function resetTeethGated(toothNos: number[]): void {
  if(toothNos.length === 0) return;
  gateToothEditBatch(toothNos, () => {
    if(edentulous){
      edentulous = false;
      setToggleButton($("#btnEdentulous"), edentulous);
    }
    for(const toothNo of toothNos){
      toothState.set(toothNo, defaultState());
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
    }
    if(activeTooth){
      setControlsEnabled(true);
      syncControlsFromState(toothState.get(activeTooth));
    }
    notifyStateChange();
  });
}

/** DS-1: apply the PRIMARY (deciduous) dentition preset — a STRUCTURAL
 *  interactive edit (not a reset), routed through the batch gate. `targetFor`
 *  is the state each tooth ends up in; only teeth that actually change are
 *  passed to the gate so unchanged teeth are not marked plan-edited / mirrored
 *  (per-tooth no-op signaling). Uninitialized plan stays a pure passthrough.
 *  DS-1 (review Fix 3): the `edentulous` flip + button state live INSIDE the
 *  gated closure so on the deferred-confirm path they take effect only on
 *  Accept — otherwise Cancel would leave `edentulous` flipped while every tooth
 *  is untouched (flag/teeth mismatch). `notifyStateChange()` moves inside too so
 *  the whole-mouth refresh fires when the batch actually applies. */
function applyPrimaryDentition(): void {
  const targetFor = (toothNo: number)=>{
    const s = defaultState();
    // The twelve positions a primary dentition leaves empty are the six-year
    // molars and behind. They have not erupted; they are not missing, and
    // recording them as `none` made a healthy chart report twelve missing teeth
    // (odontogram-8vu).
    s.toothSelection = PRIMARY_MILK.has(toothNo) ? "milktooth" : "not-erupted";
    return s;
  };
  const changed = ALL_TEETH.filter(tn => JSON.stringify(serializeState(toothState.get(tn) ?? defaultState())) !== JSON.stringify(serializeState(targetFor(tn))));
  gateToothEditBatch(changed, ()=>{
    edentulous = false;
    setToggleButton($("#btnEdentulous"), edentulous);
    suppressEdentulousSync = true;
    for(const toothNo of ALL_TEETH){
      toothState.set(toothNo, targetFor(toothNo));
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
    }
    suppressEdentulousSync = false;
    if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
    notifyStateChange();
  });
}

/** DS-1: apply the MIXED dentition preset — see {@link applyPrimaryDentition};
 *  gated STRUCTURAL edit with per-tooth no-op signaling and (Fix 3) the
 *  `edentulous` flip inside the gated closure. */
function applyMixedDentition(): void {
  const targetFor = (toothNo: number)=>{
    const s = defaultState();
    if(MIXED_PERMANENT.has(toothNo)){
      s.toothSelection = "tooth-base";
    }else if(MIXED_MILK.has(toothNo)){
      s.toothSelection = "milktooth";
    }else if(MIXED_NONE.has(toothNo)){
      // Second and third molars in a mixed dentition: not yet erupted rather
      // than missing, for the same reason as the primary preset above.
      s.toothSelection = "not-erupted";
    }
    return s;
  };
  const changed = ALL_TEETH.filter(tn => JSON.stringify(serializeState(toothState.get(tn) ?? defaultState())) !== JSON.stringify(serializeState(targetFor(tn))));
  gateToothEditBatch(changed, ()=>{
    edentulous = false;
    setToggleButton($("#btnEdentulous"), edentulous);
    suppressEdentulousSync = true;
    for(const toothNo of ALL_TEETH){
      toothState.set(toothNo, targetFor(toothNo));
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
    }
    suppressEdentulousSync = false;
    if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
    notifyStateChange();
  });
}

function updateActiveLabel(){
  const label = $("#activeToothLabel");
  if(!label) return;
  if(selectedTeeth.size === 0){
    label.textContent = t("selection.none");
  }else if(selectedTeeth.size === 1){
    const toothNo = activeTooth ?? Array.from(selectedTeeth)[0];
    label.textContent = toLabel(getDisplayedToothNumber(toothNo), numberingSystem);
  }else{
    label.textContent = t("selection.count", { count: selectedTeeth.size });
  }
}

function updateSelectionFilterButtons(){
  let hasPresent = false;
  let hasMissing = false;
  let hasPermanent = false;
  let hasMilk = false;
  let hasImplant = false;
  for(const toothNo of ALL_TEETH){
    const sel = toothState.get(toothNo)?.toothSelection;
    if(sel === "none"){
      hasMissing = true;
    }else{
      hasPresent = true;
    }
    if(sel === "tooth-base") hasPermanent = true;
    if(sel === "milktooth") hasMilk = true;
    if(sel === "implant") hasImplant = true;
  }
  $("#btnSelectAllPresent")?.classList.toggle("is-hidden", !hasPresent);
  $("#btnSelectAllMissing")?.classList.toggle("is-hidden", !hasMissing);
  $("#btnSelectPermanent")?.classList.toggle("is-hidden", !hasPermanent);
  $("#btnSelectMilk")?.classList.toggle("is-hidden", !hasMilk);
  $("#btnSelectImplants")?.classList.toggle("is-hidden", !hasImplant);
}

function setControlsEnabled(enabled: Any){
  // Scope the walk to the panel SUBTREE. The old
  // `$$(".panel-body input, .panel-body select")` is a descendant selector
  // evaluated against the WHOLE document, so it traversed the ~6400 grid SVG
  // nodes too — ~800ms on every selection change (bead odontogram-szc). Matching
  // "input, select" WITHIN each .panel-body is the identical set at a fraction of
  // the cost. `$$(".panel-body")` is a plain class match, not a descendant scan.
  $$(".panel-body").forEach(panel => {
    (panel as HTMLElement).querySelectorAll("input, select").forEach(el => {
      if((el as HTMLElement).id === "statusExtraSelect") return;
      setDisabled(el, !enabled);
    });
  });
}

function refreshCheckLabels(){
  for(const opt of MOD_OPTIONS){
    const label = $(`#lbl-${opt.value}`);
    if(label) label.textContent = t(opt.labelKey);
  }
  for(const opt of CARIES_OPTIONS){
    const label = $(`#lbl-${opt.value}`);
    if(!label) continue;
    const surface = opt.value.replace("caries-", "");
    // SP6 Task 4 (§8) / SP16 Task 2: occlusal, buccal, and lingual all resolve
    // through surfaceLabelKey — arch/anterior-aware in "full" notation mode
    // ("incisal"/"labial"/"palatal"); mesial/distal/subcrown are
    // position-independent and keep their own generic labelKey.
    const key = (surface === "occlusal" || surface === "buccal" || surface === "lingual")
      ? surfaceLabelKey(surface, activeTooth)
      : opt.labelKey;
    label.textContent = t(key);
    // SP16 Task 2: the boxed `.surf-letter` span is set once at build time
    // (buildSurfaceCross) and was never refreshed per-tooth — rewrite it here
    // too, so it tracks the active tooth's position + the surfaceNotation
    // setting (subcrown has no `.surf-letter` sibling, so this is a no-op there).
    const letterEl = label.parentElement?.querySelector(".surf-letter");
    if(letterEl) letterEl.textContent = surfaceLetter(surface, activeTooth);
  }
  for(const surface of GROUPS.fillingSurfaces){
    const label = $(`#lbl-${surface}`);
    if(!label) continue;
    // SP6 Task 4 (§8) / SP16 Task 2: mirrors the caries-picker swap above.
    const key = (surface === "occlusal" || surface === "buccal" || surface === "lingual")
      ? surfaceLabelKey(surface, activeTooth)
      : (FILLING_SURFACE_LABELS[surface] || "surface.mesial");
    label.textContent = t(key);
    const letterEl = label.parentElement?.querySelector(".surf-letter");
    if(letterEl) letterEl.textContent = surfaceLetter(surface, activeTooth);
  }
}

function refreshToothSelectOptions(){
  const toothSelect = $("#toothSelect");
  if(!toothSelect) return;
  const value = toothSelect.value;
  setSelectOptions(toothSelect, getToothSelectOptions(), value);
}

function refreshStatusExtraOptions(){
  const selectEl = $("#statusExtraSelect");
  if(!selectEl) return;
  const statusExtras = getStatusExtras();
  if(!statusExtras.length) return;
  const options = statusExtras.map((opt)=>({ value: opt.id, label: opt.label }));
  const value = selectEl.value || options[0]?.value;
  setSelectOptions(selectEl, options, value);
}

function refreshToggleLabels(){
  const statusCard = $("#statusCard");
  const statusToggle = $("#btnToggleStatusCard");
  if(statusCard && statusToggle){
    applyToggleA11y(statusToggle, "status.title", statusCard.classList.contains("collapsed"));
  }
  const controlsActions = $("#controlsActions");
  const controlsToggle = $("#btnToggleControlsCard");
  if(controlsActions && controlsToggle){
    applyToggleA11y(controlsToggle, "panel.controls", controlsActions.classList.contains("hidden"));
  }
  const cardConfig = [
    { card: "#cariesSection", btn: "#btnToggleCariesCard", labelKey: "caries.title" },
    { card: "#fillingSection", btn: "#btnToggleFillingCard", labelKey: "filling.title" },
    { card: "#rootPeriodontiumSection", btn: "#btnToggleRootPeriodontiumCard", labelKey: "card.rootPeriodontium" },
  ];
  for(const cfg of cardConfig){
    const cardEl = $(cfg.card);
    const btnEl = $(cfg.btn);
    if(!cardEl || !btnEl) continue;
    applyToggleA11y(btnEl, cfg.labelKey, cardEl.classList.contains("collapsed"));
  }
}

function refreshAllSelectOptions(){
  refreshToothSelectOptions();
  refreshStatusExtraOptions();
  const state = activeTooth ? toothState.get(activeTooth) : null;
  const isMilktooth = state?.toothSelection === "milktooth";
  const substrateEl = $("#substrateSelect");
  if(substrateEl) setSelectOptions(substrateEl, getSubstrateOptions(), substrateEl.value);
  const restorationEl = $("#restorationSelect");
  if(restorationEl) setSelectOptions(restorationEl, getRestorationOptions(restorationViewFor(activeTooth), { isImplant: state?.toothSelection === "implant", toothSelection: state?.toothSelection }), restorationEl.value);
  const fillingEl = $("#fillingSelect");
  if(fillingEl) setSelectOptions(fillingEl, getFillingOptions(isMilktooth), fillingEl.value);
  const mobilityEl = $("#mobilitySelect");
  if(mobilityEl) setSelectOptions(mobilityEl, getMobilityOptions(), mobilityEl.value);
  const periapicalEl = $("#periapicalTypeSelect");
  if(periapicalEl) setSelectOptions(periapicalEl, getPeriapicalTypeOptions(), periapicalEl.value);
  // SP7 Task 4: merged pulp/endo selector — rebuild both optgroups, preserving
  // the currently selected value (mirrors the other re-localize-in-place calls
  // in this function).
  const pulpEndoEl = $("#pulpEndoSelect");
  if(pulpEndoEl) buildPulpEndoSelect(pulpEndoEl, isMilktooth, pulpEndoEl.value);
  const rootPostEl = $("#rootPostSelect");
  if(rootPostEl) setSelectOptions(rootPostEl, getRootPostOptions(isMilktooth), rootPostEl.value);
  const apicalEl = $("#apicalDxSelect");
  if(apicalEl) setSelectOptions(apicalEl, getApicalDxOptions(), apicalEl.value);
  const resorptionEl = $("#resorptionSelect");
  if(resorptionEl) setSelectOptions(resorptionEl, getResorptionOptions(), resorptionEl.value);
  const cariesDepthEl = $("#cariesDepthSelect");
  if(cariesDepthEl) setSelectOptions(cariesDepthEl, getCariesDepthOptions(), Number(cariesDepthEl.value));
}

function refreshLocalizedContent(){
  refreshAllSelectOptions();
  refreshCheckLabels();
  refreshToggleLabels();
  updateActiveLabel();
  refreshArchToggleLabels();
  if(activeTooth){
    syncControlsFromState(toothState.get(activeTooth));
  }
}

function updateSelectionUI(){
  $$(".tooth-tile").forEach(tile => {
    const toothNo = Number(tile.dataset.tooth);
    const isSelected = selectedTeeth.has(toothNo);
    tile.classList.toggle("active", isSelected);
    if(tile.hasAttribute("role")) tile.setAttribute("aria-selected", String(isSelected));
  });
  updateSelectionFilterButtons();
  updateActiveLabel();
  if(activeTooth && selectedTeeth.has(activeTooth)){
    setControlsEnabled(true);
    syncControlsFromState(toothState.get(activeTooth));
  }else{
    syncControlsFromState(defaultState());
    setControlsEnabled(false);
  }
  const at = (activeTooth && selectedTeeth.has(activeTooth)) ? activeTooth : null;
  const teeth = [...selectedTeeth] as number[];
  for(const cb of chartSelectionObservers) { try{ cb(at, teeth); }catch{ /* observer must not break selection */ } }
}

// A React view (the Befund-Dock, the schematic chart and its keypad) subscribes
// here to learn the selection in ANY view — a plain selection fires no
// state-change, so this is the bridge.
//
// The WHOLE set rides along, not only the primary tooth. A view that kept its
// own copy of the selection and only refreshed the primary from here went out
// of step with the engine the moment the selection was made anywhere else —
// the batch buttons ("Oberkiefer Front 6"), a Shift+arrow walk, a drag over the
// anatomical grid. The engine owns the selection; this is the one place a view
// reads it from, so there is nothing left to keep in step.
const chartSelectionObservers = new Set<(toothNo: number | null, teeth: number[]) => void>();
export function onChartSelectionChange(
  cb: (toothNo: number | null, teeth: number[]) => void,
): () => void {
  chartSelectionObservers.add(cb);
  return () => { chartSelectionObservers.delete(cb); };
}

// Befund-Dock (Dirk 30.08.2026): show the finding keypad BELOW the anatomical
// chart too (not only the schematic view). Session flag, controlled by the
// Settings switch (`settings.befundDock`).
//
// Defaults ON in this fork (Dirk 02.09.2026), for the same reason the shorthand
// flags do: this is Dirk's chart and he wants charly's always-visible finding
// dock under the odontogram. A host that wants the tall right control panel
// instead flips it at mount with `setBefundDockEnabled(false)`. Session state
// like `perioViewMode`, never part of the payload.
let befundDockEnabled = true;
export function getBefundDockEnabled(): boolean { return befundDockEnabled; }
export function setBefundDockEnabled(on: boolean): void {
  if(befundDockEnabled === !!on) return;
  befundDockEnabled = !!on;
  notifyStateChange();
}

/** Select a single tooth from a view OUTSIDE the grid — the schematic chart
 *  (bead odontogram-ip3, Phase 2). It does exactly what a single grid-tile
 *  click does: sets the selection + active tooth + anchor and repaints the
 *  control panel through updateSelectionUI()/syncControlsFromState(). Editing
 *  then flows through the SAME wired controls and the DS-1 gate — there is no
 *  second mutation path, only a second way to pick the tooth. */
export function selectToothInChart(toothNo: number): void {
  selectedTeeth = new Set([toothNo]);
  activeTooth = toothNo;
  selectionAnchor = toothNo;
  updateSelectionUI();
}

/** Set the whole selection from a view OUTSIDE the grid (the schematic chart's
 *  multi-select — drag / shift / ctrl). Mirrors what the grid's own pointer
 *  handlers do, but driven from the schematic. `primary` is the active tooth
 *  (defaults to the last in the set); `anchor` is the range anchor for the next
 *  shift-select (defaults to `primary`). Editing still flows through the same
 *  wired controls / applyShorthand over `selectedTeeth`, so nothing new mutates. */
export function setChartSelection(toothNos: number[], primary: number | null = null, anchor: number | null = null): void {
  selectedTeeth = new Set(toothNos);
  activeTooth = primary ?? (toothNos.length ? toothNos[toothNos.length - 1] : null);
  selectionAnchor = anchor ?? activeTooth;
  updateSelectionUI();
}

/** The current selection as an array, in no guaranteed order. */
export function getSelectedTeeth(): number[] { return [...selectedTeeth] as number[]; }

/** The currently active (single) tooth, or null. Read-only; the schematic
 *  keypad uses it to label itself and to gate its buttons. */
export function getActiveTooth(): number | null { return activeTooth; }

const VALID_IMPLANT_POSITION = new Set(["center", "mesial", "distal", "both"]);
/** Implantatposition (charly BefundAngabeImplantat) — where the fixture sits in
 *  the socket. Gated to implant teeth (guard BEFORE the DS-1 gate, like
 *  setRetention). center | mesial | distal | both. Renders in both views. */
export function setImplantPosition(toothNo: number, value: string): void {
  if(!VALID_IMPLANT_POSITION.has(value)) return;
  const s = toothState.get(toothNo);
  if(!s || s.toothSelection !== "implant") return;
  gateToothEdit(toothNo, () => {
    if((s.implantPosition ?? "center") === value) return false;
    s.implantPosition = value;
    applyStateToSvg(toothNo);
    notifyStateChange();
    return true;
  });
}
export function getImplantPosition(toothNo: number): string {
  return String(toothState.get(toothNo)?.implantPosition ?? "center");
}

const VALID_CROWN_FRACTURE_TYPE = new Set(["none", "crack", "split", "fracture"]);
/** Kronenfraktur-Schwere (charly dreistufig: Riss / gesplittert / Bruch). A
 *  severity qualifier on the crown-fracture finding — orthogonal to WHERE the
 *  crown is broken (brokenMesial/Incisal/Distal). Present natural/milk tooth. */
export function setCrownFractureType(toothNo: number, value: string): void {
  if(!VALID_CROWN_FRACTURE_TYPE.has(value)) return;
  const s = toothState.get(toothNo);
  if(!s || !isToothPresent(s.toothSelection)) return;
  gateToothEdit(toothNo, () => {
    if((s.crownFractureType ?? "none") === value) return false;
    s.crownFractureType = value;
    notifyStateChange();
    return true;
  });
}
export function getCrownFractureType(toothNo: number): string {
  return String(toothState.get(toothNo)?.crownFractureType ?? "none");
}

const VALID_CROWN_MARGIN_TYPE = new Set(["none", "overhang", "caries", "filling"]);
const VALID_CROWN_MARGIN_SIDE = new Set(["", "mesial", "distal", "buccal", "lingual"]);
/** A crown/bridge margin finding can be typed (charly überstehend/Karies/Füllung)
 *  and sided. Gated exactly like crownLeakage (crown/bridge, restoration row
 *  shown). Setting a type also lights the anatomical `crown-leakage` slab. */
export function crownMarginAllowed(state: Any): boolean {
  return !restorationRowHidden(state) && (state.restorationType === "crown" || state.restorationType === "bridge");
}
export function setCrownMarginType(toothNo: number, value: string): void {
  if(!VALID_CROWN_MARGIN_TYPE.has(value)) return;
  const s = toothState.get(toothNo);
  if(!s || !crownMarginAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if((s.crownMarginType ?? "none") === value) return false;
    s.crownMarginType = value;
    if(value === "none") s.crownMarginSide = "";
    applyStateToSvg(toothNo);
    notifyStateChange();
    return true;
  });
}
export function setCrownMarginSide(toothNo: number, side: string): void {
  if(!VALID_CROWN_MARGIN_SIDE.has(side)) return;
  const s = toothState.get(toothNo);
  if(!s || !crownMarginAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if((s.crownMarginSide ?? "") === side) return false;
    s.crownMarginSide = side;
    notifyStateChange();
    return true;
  });
}
export function getCrownMarginType(toothNo: number): string {
  return String(toothState.get(toothNo)?.crownMarginType ?? "none");
}
export function getCrownMarginSide(toothNo: number): string {
  return String(toothState.get(toothNo)?.crownMarginSide ?? "");
}

/** charly „Verblockung" (Splinting): a rigid connection to the neighbours. Any
 *  present tooth or implant may be splinted; the connecting bar is DERIVED over
 *  adjacent splinted teeth. Through the DS-1 gate. */
export function setSplinted(toothNo: number, on: boolean): void {
  const s = toothState.get(toothNo);
  if(!s || !isToothPresent(s.toothSelection)) return;
  gateToothEdit(toothNo, () => {
    if(!!s.splinted === !!on) return false;
    s.splinted = !!on;
    notifyStateChange();
    return true;
  });
}
export function getSplinted(toothNo: number): boolean {
  return !!toothState.get(toothNo)?.splinted;
}

/** charly „Schiene": this tooth lies under an occlusal splint. Any present tooth
 *  or implant. The band is DERIVED over adjacent marked teeth. DS-1 gate. */
export function setOcclusalSplint(toothNo: number, on: boolean): void {
  const s = toothState.get(toothNo);
  if(!s || !isToothPresent(s.toothSelection)) return;
  gateToothEdit(toothNo, () => {
    if(!!s.occlusalSplint === !!on) return false;
    s.occlusalSplint = !!on;
    notifyStateChange();
    return true;
  });
}
export function getOcclusalSplint(toothNo: number): boolean {
  return !!toothState.get(toothNo)?.occlusalSplint;
}

const VALID_OCCLUSAL_FUNCTION = new Set(["none", "premature", "interference", "overload"]);
/** charly Funktion: an occlusal function finding — Frühkontakt (premature
 *  contact), Gleithindernis (excursive interference), Belastung (overload).
 *  Present tooth or implant. DS-1 gate. */
export function setOcclusalFunction(toothNo: number, value: string): void {
  if(!VALID_OCCLUSAL_FUNCTION.has(value)) return;
  const s = toothState.get(toothNo);
  if(!s || !isToothPresent(s.toothSelection)) return;
  gateToothEdit(toothNo, () => {
    if((s.occlusalFunction ?? "none") === value) return false;
    s.occlusalFunction = value;
    notifyStateChange();
    return true;
  });
}
export function getOcclusalFunction(toothNo: number): string {
  return String(toothState.get(toothNo)?.occlusalFunction ?? "none");
}

/** charly „zunehmend": the ortho movement (drift/tipping/rotation) is worsening.
 *  A qualifier on the ortho axes; gated on orthoAllowed. DS-1 gate. */
export function setOrthoProgressive(toothNo: number, on: boolean): void {
  const s = toothState.get(toothNo);
  if(!s || !orthoAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if(!!s.orthoProgressive === !!on) return false;
    s.orthoProgressive = !!on;
    notifyStateChange();
    return true;
  });
}
export function getOrthoProgressive(toothNo: number): boolean {
  return !!toothState.get(toothNo)?.orthoProgressive;
}

/** charly: the apical lesion sits on a NAMED root (multi-rooted tooth). Only
 *  when an apical diagnosis is charted and the root belongs to this tooth; ""
 *  clears it. Gated before the DS-1 gate. */
export function setApicalRoot(toothNo: number, root: string): void {
  const s = toothState.get(toothNo);
  if(!s) return;
  const roots = rootsOf(toothNo);
  const val = root && roots.includes(root) ? root : "";
  if(val && (s.apicalDx ?? "normal") === "normal") return;   // no lesion to place
  gateToothEdit(toothNo, () => {
    if((s.apicalRoot ?? "") === val) return false;
    s.apicalRoot = val;
    notifyStateChange();
    return true;
  });
}
export function getApicalRoot(toothNo: number): string {
  return String(toothState.get(toothNo)?.apicalRoot ?? "");
}

/** charly „Wurzelkappe": a coping over a root remnant. Allowed only on a radix
 *  substrate (the restoration control is hidden there, so this is its own axis).
 *  Through the DS-1 gate. */
export function rootCapAllowed(state: Any): boolean {
  return isToothPresent(state.toothSelection) && state.toothSubstrate === "radix";
}
export function setRootCap(toothNo: number, on: boolean): void {
  const s = toothState.get(toothNo);
  if(!s || !rootCapAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if(!!s.rootCap === !!on) return false;
    s.rootCap = !!on;
    notifyStateChange();
    return true;
  });
}
export function getRootCap(toothNo: number): boolean {
  return !!toothState.get(toothNo)?.rootCap;
}

const ONLAY_SURFACES = ["mesial", "distal", "buccal", "lingual", "occlusal"];
/** charly TEILKRONE per surface: which surfaces the partial crown (onlay) covers.
 *  Empty = the whole occlusal table (the prior behaviour). Only on an onlay. */
export function onlayCoverageAllowed(state: Any): boolean {
  return state.restorationType === "onlay";
}
export function toggleOnlaySurface(toothNo: number, surface: string): void {
  if(!ONLAY_SURFACES.includes(surface)) return;
  const s = toothState.get(toothNo);
  if(!s || !onlayCoverageAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    const cur: string[] = Array.isArray(s.onlayCoverage) ? s.onlayCoverage : [];
    const has = cur.includes(surface);
    s.onlayCoverage = has ? cur.filter((x: string) => x !== surface) : [...cur, surface];
    notifyStateChange();
    return true;
  });
}
export function getOnlayCoverage(toothNo: number): string[] {
  const v = toothState.get(toothNo)?.onlayCoverage;
  return Array.isArray(v) ? [...v] : [];
}

/** Inlay-Flächen (Dirk, 31.08.2026): welche Flächen das Inlay umfasst. Nur auf
 *  einem Inlay; die Engine braucht sie für den Kostenplan („Inlay n-flächig"). */
export function inlayCoverageAllowed(state: Any): boolean {
  return state.restorationType === "inlay";
}
export function toggleInlaySurface(toothNo: number, surface: string): void {
  if(!ONLAY_SURFACES.includes(surface)) return;
  const s = toothState.get(toothNo);
  if(!s || !inlayCoverageAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    const cur: string[] = Array.isArray(s.inlayCoverage) ? s.inlayCoverage : [];
    const has = cur.includes(surface);
    s.inlayCoverage = has ? cur.filter((x: string) => x !== surface) : [...cur, surface];
    notifyStateChange();
    return true;
  });
}
export function getInlayCoverage(toothNo: number): string[] {
  const v = toothState.get(toothNo)?.inlayCoverage;
  return Array.isArray(v) ? [...v] : [];
}

/** Veneer-Flächen (Dirk, 31.08.2026): welche Flächen das Veneer bedeckt — für
 *  den Kostenplan. Nur auf einem Veneer. */
export function veneerCoverageAllowed(state: Any): boolean {
  return state.restorationType === "veneer";
}
export function toggleVeneerSurface(toothNo: number, surface: string): void {
  if(!ONLAY_SURFACES.includes(surface)) return;
  const s = toothState.get(toothNo);
  if(!s || !veneerCoverageAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    const cur: string[] = Array.isArray(s.veneerCoverage) ? s.veneerCoverage : [];
    const has = cur.includes(surface);
    s.veneerCoverage = has ? cur.filter((x: string) => x !== surface) : [...cur, surface];
    notifyStateChange();
    return true;
  });
}
export function getVeneerCoverage(toothNo: number): string[] {
  const v = toothState.get(toothNo)?.veneerCoverage;
  return Array.isArray(v) ? [...v] : [];
}

const VALID_ENDO_CANAL = new Set(["filling", "post", "incomplete", "temporary"]);
/** Set a single canal's endo findings (charly WURZELZUSTAND per root). The three
 *  fill-types (filling/incomplete/temporary) are mutually exclusive; `post`
 *  coexists (WF + Stift). Empty clears the canal. Through the DS-1 gate. */
export function setEndoCanal(toothNo: number, canal: string, findings: string[]): void {
  const s = toothState.get(toothNo);
  if(!s || !canal) return;
  const clean = (findings ?? []).filter(f => VALID_ENDO_CANAL.has(f));
  const fills = ["filling", "incomplete", "temporary"].filter(f => clean.includes(f));
  const norm = [...(fills.length ? [fills[fills.length - 1]] : []), ...(clean.includes("post") ? ["post"] : [])];
  gateToothEdit(toothNo, () => {
    const cur = (s.endoCanals?.[canal] ?? []) as string[];
    if(cur.length === norm.length && cur.every((v, i) => v === norm[i])) return false;
    if(!s.endoCanals) s.endoCanals = {};
    if(norm.length) s.endoCanals[canal] = norm; else delete s.endoCanals[canal];
    applyStateToSvg(toothNo);
    notifyStateChange();
    return true;
  });
}
export function getEndoCanals(toothNo: number): Record<string, string[]> {
  const src = (toothState.get(toothNo)?.endoCanals ?? {}) as Record<string, string[]>;
  return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, [...v]]));
}
// Clinical cycle for a click on a canal: untreated → WF → WF+Stift → WFi (insuff.)
// → med. Einlage → untreated. `setEndoCanal` normalises, so passing these is safe.
const ENDO_CANAL_CYCLE: string[][] = [[], ["filling"], ["filling", "post"], ["incomplete"], ["temporary"]];
/** Advance one canal to the next state in the clinical cycle — the schematic's
 *  "click a root / press wf to step through the canals" gesture. */
export function cycleEndoCanal(toothNo: number, canal: string): void {
  const cur = (toothState.get(toothNo)?.endoCanals?.[canal] ?? []) as string[];
  const idx = ENDO_CANAL_CYCLE.findIndex(c => c.length === cur.length && c.every((v, i) => v === cur[i]));
  setEndoCanal(toothNo, canal, ENDO_CANAL_CYCLE[(idx + 1) % ENDO_CANAL_CYCLE.length]);
}

// ---- Touch: Zoom Popover ----
function showZoomPopover(toothNo: number){
  hideZoomPopover();
  hideContextMenu();
  const svgs = toothSvgRoot.get(toothNo);
  const sideSvg = svgs?.find((_s: Any, i: number) => {
    const tiles = toothTile.get(toothNo);
    return tiles?.[i]?.classList.contains("side-view");
  }) || svgs?.[0];
  if(!sideSvg) return;

  const overlay = el("div", { class: "odon-zoom-overlay" });
  const popover = el("div", { class: "odon-zoom-popover" });

  // Header
  const label = toLabel(toothNo, numberingSystem);
  const header = el("div", { class: "odon-zoom-header" });
  const title = el("span", { class: "odon-zoom-title", text: t("touch.zoom.title", { tooth: label }) });
  const closeBtn = el("button", { class: "odon-zoom-close", text: "✕" });
  closeBtn.addEventListener("click", hideZoomPopover);
  header.appendChild(title);
  header.appendChild(closeBtn);

  // SVG clone
  const svgWrap = el("div", { class: "odon-zoom-svg" });
  const clonedSvg = sideSvg.cloneNode(true) as SVGElement;
  svgWrap.appendChild(clonedSvg);

  // Actions
  const actions = el("div", { class: "odon-zoom-actions" });

  const isSelected = selectedTeeth.has(toothNo);
  const selectBtn = el("button", {
    class: isSelected ? "odon-zoom-btn active" : "odon-zoom-btn",
    text: isSelected ? t("touch.zoom.deselect") : t("touch.zoom.select"),
  });
  selectBtn.addEventListener("click", () => {
    if(selectedTeeth.has(toothNo)){
      selectedTeeth.delete(toothNo);
      if(activeTooth === toothNo) activeTooth = selectedTeeth.values().next().value ?? null;
    }else{
      selectedTeeth.add(toothNo);
      activeTooth = toothNo;
    }
    updateSelectionUI();
    hideZoomPopover();
  });

  const infoBtn = el("button", { class: "odon-zoom-btn", text: t("touch.zoom.info") });
  infoBtn.addEventListener("click", () => {
    selectedTeeth = new Set([toothNo]);
    activeTooth = toothNo;
    updateSelectionUI();
    hideZoomPopover();
    // Scroll controls panel into view
    const panel = $("#controlsActions");
    if(panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const resetBtn = el("button", { class: "odon-zoom-btn danger", text: t("touch.ctx.reset") });
  resetBtn.addEventListener("click", () => {
    resetToothGated(toothNo);
    hideZoomPopover();
  });

  const closeActionBtn = el("button", { class: "odon-zoom-btn", text: t("touch.zoom.close") });
  closeActionBtn.addEventListener("click", hideZoomPopover);

  actions.appendChild(selectBtn);
  actions.appendChild(infoBtn);
  if(notesEnabled && !readOnly){
    const noteBtn = el("button", { class: "odon-zoom-btn", text: t("note.title") });
    noteBtn.addEventListener("click", () => {
      hideZoomPopover();
      showNoteEditor(toothNo);
    });
    actions.appendChild(noteBtn);
  }
  actions.appendChild(resetBtn);
  actions.appendChild(closeActionBtn);

  popover.appendChild(header);
  popover.appendChild(svgWrap);
  popover.appendChild(actions);

  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) hideZoomPopover();
  });

  overlay.appendChild(popover);
  appendPortal(overlay);
}

function hideZoomPopover(){
  const overlay = document.querySelector(".odon-zoom-overlay");
  if(overlay) overlay.remove();
}

// ---- Touch: Context Menu ----
function showContextMenu(toothNo: number, touch: Touch){
  hideContextMenu();
  hideZoomPopover();

  const menu = el("div", { class: "odon-ctx-menu" });
  const isSelected = selectedTeeth.has(toothNo);

  if(isSelected){
    const multiItem = el("button", { class: "odon-ctx-item", text: t("touch.ctx.deselect") });
    multiItem.addEventListener("click", () => {
      selectedTeeth.delete(toothNo);
      if(activeTooth === toothNo) activeTooth = selectedTeeth.values().next().value ?? null;
      updateSelectionUI();
      hideContextMenu();
    });
    menu.appendChild(multiItem);
  }else{
    const selectItem = el("button", { class: "odon-ctx-item", text: t("touch.ctx.select") });
    selectItem.addEventListener("click", () => {
      selectedTeeth = new Set([toothNo]);
      activeTooth = toothNo;
      updateSelectionUI();
      hideContextMenu();
    });
    menu.appendChild(selectItem);

    if(selectedTeeth.size > 0){
      const multiItem = el("button", { class: "odon-ctx-item", text: t("touch.ctx.multiSelect") });
      multiItem.addEventListener("click", () => {
        selectedTeeth.add(toothNo);
        activeTooth = toothNo;
        updateSelectionUI();
        hideContextMenu();
      });
      menu.appendChild(multiItem);
    }
  }

  menu.appendChild(el("div", { class: "odon-ctx-divider" }));

  const resetItem = el("button", { class: "odon-ctx-item danger", text: t("touch.ctx.reset") });
  resetItem.addEventListener("click", () => {
    resetToothGated(toothNo);
    hideContextMenu();
  });
  menu.appendChild(resetItem);

  // Position the menu near the touch point
  const x = Math.min(touch.clientX, window.innerWidth - 200);
  const y = Math.min(touch.clientY - 10, window.innerHeight - 200);
  menu.style.left = x + "px";
  menu.style.top = y + "px";

  appendPortal(menu);

  // Close on outside tap
  const closeHandler = (e: Event) => {
    if(!menu.contains(e.target as Node)){
      hideContextMenu();
      document.removeEventListener("touchstart", closeHandler, true);
      document.removeEventListener("click", closeHandler, true);
    }
  };
  setTimeout(() => {
    document.addEventListener("touchstart", closeHandler, true);
    document.addEventListener("click", closeHandler, true);
  }, 50);
}

function hideContextMenu(){
  const menu = document.querySelector(".odon-ctx-menu");
  if(menu) menu.remove();
}

// ---- Note Editor Popover ----
function showNoteEditor(toothNo: number){
  hideNoteEditor();
  if(!notesEnabled || readOnly) return;
  const state = toothState.get(toothNo);
  if(!state) return;

  // Find the side-view tile for positioning
  const tiles = toothTile.get(toothNo);
  const anchorTile = tiles?.find((t: HTMLElement) => t.classList.contains("side-view")) || tiles?.[0];

  const label = toLabel(toothNo, numberingSystem);
  const popover = el("div", { class: "odon-note-popover" });

  const header = el("div", { class: "odon-note-header" });
  const title = el("span", { class: "odon-note-title", text: t("note.title") + " \u2014 " + label });
  const closeBtn = el("button", { class: "odon-zoom-close", text: "\u2715" });
  closeBtn.addEventListener("click", hideNoteEditor);
  header.appendChild(title);
  header.appendChild(closeBtn);

  const textarea = document.createElement("textarea");
  textarea.className = "odon-note-textarea";
  textarea.value = state.note || "";
  textarea.placeholder = t("note.placeholder");
  textarea.rows = 3;

  const actions = el("div", { class: "odon-note-actions" });
  const saveBtn = el("button", { class: "odon-zoom-btn", text: t("note.save") });
  saveBtn.addEventListener("click", () => {
    state.note = textarea.value.trim();
    updateToothTooltip(toothNo);
    updateToothLabelNoteIcon(toothNo);
    hideNoteEditor();
  });
  const deleteBtn = el("button", { class: "odon-zoom-btn danger", text: t("note.delete") });
  deleteBtn.addEventListener("click", () => {
    state.note = "";
    updateToothTooltip(toothNo);
    updateToothLabelNoteIcon(toothNo);
    hideNoteEditor();
  });
  actions.appendChild(saveBtn);
  actions.appendChild(deleteBtn);

  popover.appendChild(header);
  popover.appendChild(textarea);
  popover.appendChild(actions);

  // Backdrop
  const backdrop = el("div", { class: "odon-note-backdrop" });
  backdrop.addEventListener("click", hideNoteEditor);
  backdrop.appendChild(popover);
  appendPortal(backdrop);

  popover.addEventListener("click", (e) => e.stopPropagation());

  // Position popover near the tooth tile
  if(anchorTile){
    const rect = anchorTile.getBoundingClientRect();
    const pw = 320; // popover width
    let left = rect.left + rect.width / 2 - pw / 2;
    let top = rect.bottom + 8;
    // Clamp to viewport
    if(left < 8) left = 8;
    if(left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if(top + 200 > window.innerHeight) top = rect.top - 208;
    popover.style.position = "fixed";
    popover.style.left = left + "px";
    popover.style.top = top + "px";
  }

  textarea.focus();
}

function hideNoteEditor(){
  const backdrop = document.querySelector(".odon-note-backdrop");
  if(backdrop) backdrop.remove();
}

function hideCariesDepthPopup(){
  const p = document.querySelector(".odon-depth-popup");
  if(p) p.remove();
}

/** Popup to author a single caries surface on the selected teeth. Beyond the
 *  original visual caries-depth (ICDAS/3-level) picker it now offers, in the
 *  SAME anchored popup (SP5 Task 5): a per-surface secondary-caries CARS-score
 *  picker and — only when `radiographicDepthMode !== "off"` — a per-surface
 *  radiographic-depth picker. Each group's option list follows its granularity
 *  mode; the depth group itself is hidden when `cariesDepthEnabled` is off. */
/** SP16 Task 2: resolves the DISPLAY LETTER for a caries/filling surface,
 *  respecting the `surfaceNotation` setting ("full", default) and — in full
 *  mode — the tooth's arch (upper/lower) and anterior/posterior position.
 *
 *  FULL: occlusal -> "I" (incisal) on an anterior tooth, else "O" (occlusal);
 *  buccal -> "L" (labial) on an anterior tooth, else "B" (buccal); lingual ->
 *  "P" (palatal) on an upper tooth, else "L" (lingual) — on a LOWER ANTERIOR
 *  tooth this means BOTH buccal(labial) and lingual(lingual) letter as "L"
 *  (ratified: position in the surface-cross and the caption disambiguate; a
 *  "(L, L)"-style summary is inherently ambiguous, which is accepted).
 *  mesial -> "M", distal -> "D", subcrown -> "SC" always.
 *
 *  SIMPLE: always the tooth-independent B/M/O/D/L/SC set, regardless of
 *  position. Exported so both {@link summarySurfaceLetter} and the live
 *  surface-cross UI (buildSurfaceCross/refreshCheckLabels) share one source
 *  of truth. */
export function surfaceLetter(surface: string, toothNo?: number | null): string {
  if(surface === "subcrown") return "SC";
  if(surfaceNotation === "simple"){
    const map: Record<string, string> = { buccal: "B", mesial: "M", occlusal: "O", distal: "D", lingual: "L" };
    return map[surface] || surface;
  }
  const anterior = toothNo != null && isAnteriorTooth(toothNo);
  const upper = toothNo != null && isUpperTooth(toothNo);
  if(surface === "occlusal") return anterior ? "I" : "O";
  if(surface === "buccal") return anterior ? "L" : "B";
  if(surface === "lingual") return upper ? "P" : "L";
  if(surface === "mesial") return "M";
  if(surface === "distal") return "D";
  return surface;
}

/** Maps a caries surface identifier to its existing i18n surface-label key,
 *  so the popup header can read e.g. "Caries details – Buccal". Falls back to
 *  the raw surface string for any (unexpected) unmapped value.
 *
 *  SP6 Task 4 (§8): when `toothNo` is given and is an anterior tooth
 *  (incisor/canine), the "occlusal" surface DISPLAYS as "incisal"
 *  (`surface.incisal`) instead of `surface.occlusal` — the stored surface
 *  value is unaffected, this only changes which i18n key the label resolves
 *  to.
 *
 *  SP16 Task 2: extended to be arch/anterior-aware for ALL of
 *  occlusal/buccal/lingual, gated on the `surfaceNotation` setting. In
 *  "full" mode (default): occlusal -> incisal (anterior), buccal -> labial
 *  (anterior), lingual -> palatal (upper) / lingual (lower, a NEW key
 *  separate from the combined `surface.lingualPalatal`). In "simple" mode
 *  the generic, tooth-independent keys are always used
 *  (buccal/occlusal/lingualPalatal). Exported so it can be unit-tested
 *  directly. */
export function surfaceLabelKey(surface: string, toothNo?: number | null): string {
  if(surfaceNotation === "full"){
    const anterior = toothNo != null && isAnteriorTooth(toothNo);
    const upper = toothNo != null && isUpperTooth(toothNo);
    if(surface === "occlusal") return anterior ? "surface.incisal" : "surface.occlusal";
    if(surface === "buccal") return anterior ? "surface.labial" : "surface.buccal";
    if(surface === "lingual") return upper ? "surface.palatal" : "surface.lingual";
  }
  const map: Record<string, string> = {
    buccal: "surface.buccal",
    lingual: "surface.lingualPalatal",
    mesial: "surface.mesial",
    distal: "surface.distal",
    occlusal: "surface.occlusal",
  };
  return map[surface] || surface;
}

function showCariesDepthPopup(surface: string, anchor: HTMLElement, toothNo?: number | null){
  hideCariesDepthPopup();
  const rect = anchor.getBoundingClientRect();
  const popup = el("div", { class: "odon-depth-popup" });
  const active = activeTooth != null ? toothState.get(activeTooth) : null;
  // SP6 Task 2 (step 1): the popup is CONTEXTUAL. A surface that carries a
  // filling is a (potential) recurrent-caries surface → show the CARS group and
  // the "Recurrent caries – {surface}" title; a filling-free surface is primary
  // caries → show the depth group and the "Caries – {surface}" title. Never both.
  const hasFilling = !!active?.fillingSurfaceMaterials?.has(surface);
  const titleKey = hasFilling ? "caries.recurrentTitle" : "caries.primaryTitle";
  popup.appendChild(el("div", { class: "odon-depth-title", text: `${t(titleKey)} – ${t(surfaceLabelKey(surface, toothNo))}` }));
  const addGroup = (
    labelKey: string,
    options: Array<{ value: Any; label: string; title?: string }>,
    current: Any,
    onPick: (value: Any) => void,
  ) => {
    if(!options || options.length === 0) return;
    popup.appendChild(el("div", { class: "odon-depth-group-label", text: t(labelKey) }));
    for(const opt of options){
      const btn = el("button", { class: "odon-depth-option", text: opt.label }) as HTMLButtonElement;
      btn.title = opt.title || "";
      if(current != null && String(opt.value) === String(current)) btn.classList.add("is-active");
      btn.addEventListener("click", (e: Any)=>{
        e.stopPropagation();
        onPick(opt.value);
        hideCariesDepthPopup();
      });
      popup.appendChild(btn);
    }
  };

  // SP6 Task 2 (step 1): show exactly ONE severity group by context. Both groups
  // write the single unified `cariesSeverity` (read as ICDAS on a primary
  // surface, CARS on a recurrent one); the context — filling present or not —
  // decides which labels the user sees and which transition a pick performs.
  if(hasFilling){
    // Recurrent (secondary) caries: CARS 0..6 only. Score 0 removes the caries
    // from the surface (revert to a plain filling); score > 0 adds it (→ becomes
    // recurrent, `subcaries-{surface}`). A filling-only surface reaches this via
    // its own dark-border indicator, so recurrent caries can be authored here.
    addGroup("caries.secondaryLabel", secondaryCariesOptions(), active?.cariesSeverity?.get(surface) ?? 0, (value)=>{
      applyToSelected((s)=>{ applyRecurrentCariesScore(s, surface, Number(value)); });
    });
  }else if(cariesDepthEnabled){
    // Primary caries: visual depth (ICDAS / 3-level) only — gated by
    // `cariesDepthEnabled`. Writes the ICDAS value onto the caried surface.
    addGroup("caries.depthLabel", getCariesDepthOptions(), active?.cariesSeverity?.get(surface), (value)=>{
      applyToSelected((s)=>{
        if(s.caries.has(`caries-${surface}`)) s.cariesSeverity.set(surface, Number(value));
      });
    });
  }
  // Radiographic depth — only when the mode is on (else options is []).
  addGroup("caries.radiographicLabel", radiographicDepthOptions(), active?.radiographicDepth?.get(surface) ?? "none", (value)=>{
    applyToSelected((s)=>{ applyRadiographicDepth(s.radiographicDepth, surface, String(value)); });
  });
  // Bead odontogram-wxt: cervical involvement. Authored HERE, in the one popup
  // both the caries cell and the filling cell open, because the marker sits on
  // the SURFACE and qualifies whichever of the two the surface carries. Offered
  // only on the vestibular/oral surfaces, and only once the surface actually
  // carries a finding — the same predicate the setter enforces.
  if(active && cervicalInvolvementApplies(active, surface)){
    addGroup("cervical.label", [
      { value: "no", label: t("cervical.no") },
      { value: "yes", label: t("cervical.yes"), title: t("cervical.hint") },
    ], active.cervicalSurfaces?.has(surface) ? "yes" : "no", (value)=>{
      applyToSelected((s: Any)=>{ applyCervicalInvolvement(s, surface, value === "yes"); });
    });
  }

  appendPortal(popup);
  // Position below-right of the indicator, clamped to the viewport.
  const pw = popup.offsetWidth || 140;
  const left = Math.min(rect.left, window.innerWidth - pw - 8);
  const top = Math.min(rect.bottom + 4, window.innerHeight - popup.offsetHeight - 8);
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.top = `${Math.max(8, top)}px`;
  // Close on outside click / Escape.
  const onDoc = (e: Any)=>{ if(!popup.contains(e.target)){ cleanup(); } };
  const onKey = (e: Any)=>{ if(e.key === "Escape") cleanup(); };
  function cleanup(){
    hideCariesDepthPopup();
    document.removeEventListener("mousedown", onDoc, true);
    document.removeEventListener("keydown", onKey, true);
  }
  setTimeout(()=>{
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onKey, true);
  }, 0);
}

/** SP10 Task 3: small dedicated anchored popup to author the structural
 *  filling-defect (`none` | `marginal` | `fracture` | `wear`) on ONE filled
 *  surface, opened from the LEFT-side `.surf-defect` indicator. Reuses
 *  {@link hideCariesDepthPopup}'s shared close/teardown, and the SAME
 *  positioning + outside-click/Escape close registration as
 *  {@link showCariesDepthPopup} — only the option set differs. */
function showFillingDefectPopup(surface: string, anchor: HTMLElement, toothNo?: number | null){
  hideCariesDepthPopup(); // reuse the shared close/teardown
  const active = activeTooth != null ? toothState.get(activeTooth) : null;
  if(!active?.fillingSurfaceMaterials?.has(surface)) return;
  const rect = anchor.getBoundingClientRect();
  const popup = el("div", { class: "odon-depth-popup" });
  popup.appendChild(el("div", { class: "odon-depth-title", text: `${t("fillingDefect.label")} – ${t(surfaceLabelKey(surface, toothNo))}` }));
  const current = active?.fillingDefect?.get(surface) ?? "none";
  const group = el("div", { class: "odon-depth-group" });
  for(const value of ["none", "marginal", "fracture", "wear"]){
    const btn = el("button", { class: "odon-depth-option" + (value === current ? " is-active" : ""), text: t("fillingDefect." + value) }) as HTMLButtonElement;
    btn.addEventListener("click", (e: Any)=>{
      e.stopPropagation();
      applyToSelected((s)=>{ applyFillingDefect(s.fillingDefect, surface, value); });
      hideCariesDepthPopup();
    });
    group.appendChild(btn);
  }
  popup.appendChild(group);
  appendPortal(popup);
  // Position below-right of the indicator, clamped to the viewport — same as showCariesDepthPopup.
  const pw = popup.offsetWidth || 140;
  const left = Math.min(rect.left, window.innerWidth - pw - 8);
  const top = Math.min(rect.bottom + 4, window.innerHeight - popup.offsetHeight - 8);
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.top = `${Math.max(8, top)}px`;
  // Close on outside click / Escape — same registration as showCariesDepthPopup.
  const onDoc = (e: Any)=>{ if(!popup.contains(e.target)){ cleanup(); } };
  const onKey = (e: Any)=>{ if(e.key === "Escape") cleanup(); };
  function cleanup(){
    hideCariesDepthPopup();
    document.removeEventListener("mousedown", onDoc, true);
    document.removeEventListener("keydown", onKey, true);
  }
  setTimeout(()=>{
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onKey, true);
  }, 0);
}

// ---- Touch: Pinch-to-zoom ----
function getTouchDist(t1: Touch, t2: Touch){
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onGridTouchStart(e: TouchEvent){
  if(e.touches.length === 2){
    isPinching = true;
    pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
    const grid = $("#toothGrid") as HTMLElement | null;
    if(grid) grid.classList.add("odon-pinch-active");
    e.preventDefault();
  }
}

function onGridTouchMove(e: TouchEvent){
  if(isPinching && e.touches.length === 2){
    const dist = getTouchDist(e.touches[0], e.touches[1]);
    const scale = Math.max(0.5, Math.min(3, (dist / pinchStartDist) * pinchScale));
    const grid = $("#toothGrid") as HTMLElement | null;
    if(grid) grid.style.transform = `scale(${scale})`;
    e.preventDefault();
  }
}

function onGridTouchEnd(e: TouchEvent){
  if(isPinching && e.touches.length < 2){
    isPinching = false;
    const grid = $("#toothGrid") as HTMLElement | null;
    if(grid){
      // Read current scale from transform
      const match = grid.style.transform.match(/scale\(([\d.]+)\)/);
      pinchScale = match ? parseFloat(match[1]) : 1;
      // Snap back to 1 if close
      if(pinchScale > 0.9 && pinchScale < 1.1){
        pinchScale = 1;
        grid.style.transform = "";
        grid.classList.remove("odon-pinch-active");
      }
    }
  }
}

// ---- Touch: Arch toggle bar ----
function buildArchToggle(){
  const grid = $("#toothGrid") as HTMLElement | null;
  if(!grid) return;
  // Remove existing
  if(archToggleBar) archToggleBar.remove();

  archToggleBar = el("div", { class: "odon-arch-toggle" });
  const btnUpper = el("button", { class: "odon-arch-btn", text: t("touch.arch.upper") });
  const btnLower = el("button", { class: "odon-arch-btn", text: t("touch.arch.lower") });
  const btnBoth = el("button", { class: "odon-arch-btn active", text: t("touch.arch.both") });

  function setArch(mode: "both" | "upper" | "lower"){
    archMode = mode;
    btnUpper.classList.toggle("active", mode === "upper");
    btnLower.classList.toggle("active", mode === "lower");
    btnBoth.classList.toggle("active", mode === "both");
    grid!.classList.toggle("odon-arch-upper", mode === "upper");
    grid!.classList.toggle("odon-arch-lower", mode === "lower");
  }

  btnUpper.addEventListener("click", () => setArch(archMode === "upper" ? "both" : "upper"));
  btnLower.addEventListener("click", () => setArch(archMode === "lower" ? "both" : "lower"));
  btnBoth.addEventListener("click", () => setArch("both"));

  archToggleBar.appendChild(btnUpper);
  archToggleBar.appendChild(btnBoth);
  archToggleBar.appendChild(btnLower);

  // Insert before the grid
  grid.parentElement?.insertBefore(archToggleBar, grid);
}

function refreshArchToggleLabels(){
  if(!archToggleBar) return;
  const btns = archToggleBar.querySelectorAll(".odon-arch-btn");
  if(btns[0]) btns[0].textContent = t("touch.arch.upper");
  if(btns[1]) btns[1].textContent = t("touch.arch.both");
  if(btns[2]) btns[2].textContent = t("touch.arch.lower");
}

// ---- Touch: tile event wiring ----
function addTouchToTile(tile: HTMLElement, toothNo: number){
  tile.addEventListener("touchstart", (e: TouchEvent) => {
    if(readOnly) return;
    if(e.touches.length !== 1) return;
    touchStartTime = Date.now();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;

    const touch = e.touches[0];
    longPressTimer = setTimeout(() => {
      if(!touchMoved){
        showContextMenu(toothNo, touch);
      }
    }, LONG_PRESS_MS);
  }, { passive: true });

  tile.addEventListener("touchmove", (e: TouchEvent) => {
    if(e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if(Math.abs(dx) > TOUCH_MOVE_THRESHOLD || Math.abs(dy) > TOUCH_MOVE_THRESHOLD){
      touchMoved = true;
      if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
    }
  }, { passive: true });

  tile.addEventListener("touchend", (e: TouchEvent) => {
    if(readOnly) return;
    if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
    const elapsed = Date.now() - touchStartTime;
    if(!touchMoved && elapsed < LONG_PRESS_MS){
      // Short tap — show zoom popover on touch devices
      e.preventDefault(); // prevent click from also firing
      showZoomPopover(toothNo);
    }
  });
}

// ---- Bead odontogram-apn: selecting a span ---------------------------------
//
// Dirk, 19.08.2026: "linke Maustaste und ueber die betreffenden Zaehne mit
// gedrueckter linker Maustaste ziehen. Loslassen, alle beruehrten sind
// markiert, dann z.B. mod und alle haben eine Fuellung mit dem vorher
// gewaehlten Material." — the gesture that makes the shorthand worth having.
//
// The span is taken in ARCH ORDER, from the tooth the drag began on to the one
// under the pointer, not as a rectangle over the tiles: with two arches a
// rectangle picks up the opposing jaw as soon as the pointer strays, which is
// never what was meant. See `teethBetween`.
//
// This is PURE OPERATION, not a new mutation path: everything still goes
// through `selectedTeeth` + `updateSelectionUI()`, so the batch actions and the
// DS-1 lane are untouched.

const DRAG_THRESHOLD_PX = 4;

let dragAnchor: number | null = null;
let dragBase: Set<number> = new Set();
let dragOrigin: { x: number; y: number } | null = null;
let dragging = false;
/** A drag ends in a `click` on the tile it stopped over; without this the
 *  click would collapse the span back to one tooth. */
let suppressNextToothClick = false;

function toothFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const tile = el?.closest?.(".tooth-tile") as HTMLElement | null;
  if(!tile) return null;
  if(tile.classList.contains("wisdom-hidden") || tile.classList.contains("placeholder")) return null;
  const n = Number(tile.dataset.tooth);
  return Number.isFinite(n) ? n : null;
}

function endDrag(){
  dragAnchor = null;
  dragOrigin = null;
  dragging = false;
  dragBase = new Set();
  document.removeEventListener("pointermove", onGridPointerMove);
  document.removeEventListener("pointerup", onGridPointerUp);
  document.removeEventListener("keydown", onDragKeydown, true);
  document.body.classList.remove("odon-dragging");
}

function onDragKeydown(evt: KeyboardEvent){
  if(evt.key !== "Escape" || dragAnchor === null) return;
  // Abort: put back what was selected before the drag began.
  evt.preventDefault();
  evt.stopPropagation();
  selectedTeeth = new Set(dragBase);
  activeTooth = selectedTeeth.size > 0 ? (selectedTeeth.values().next().value as number) : null;
  updateSelectionUI();
  suppressNextToothClick = dragging;
  endDrag();
}

function onGridPointerDown(evt: PointerEvent){
  if(readOnly || evt.button !== 0) return;
  const toothNo = toothFromPoint(evt.clientX, evt.clientY);
  if(toothNo === null) return;
  dragAnchor = toothNo;
  dragOrigin = { x: evt.clientX, y: evt.clientY };
  dragging = false;
  // Shift adds to what is already selected, exactly as a shift-click does.
  dragBase = evt.shiftKey ? new Set(selectedTeeth as Set<number>) : new Set();
  selectionAnchor = toothNo;
  document.addEventListener("pointermove", onGridPointerMove);
  document.addEventListener("pointerup", onGridPointerUp);
  document.addEventListener("keydown", onDragKeydown, true);
}

function onGridPointerMove(evt: PointerEvent){
  if(dragAnchor === null || !dragOrigin) return;
  if(!dragging){
    const dx = evt.clientX - dragOrigin.x;
    const dy = evt.clientY - dragOrigin.y;
    // Below the threshold it is still a click, not a drag — otherwise every
    // click would arrive as a one-tooth span and swallow the shift-click path.
    if(Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    dragging = true;
    document.body.classList.add("odon-dragging");
  }
  const over = toothFromPoint(evt.clientX, evt.clientY);
  const span = teethBetween(dragAnchor, over ?? dragAnchor, isTileNavigable);
  selectedTeeth = new Set([...dragBase, ...span]);
  activeTooth = span.length > 0 ? span[span.length - 1] : dragAnchor;
  updateSelectionUI();
}

function onGridPointerUp(){
  suppressNextToothClick = dragging;
  endDrag();
}

function onToothClick(toothNo: Any, evt: Any){
  if(readOnly) return;
  if(suppressNextToothClick){ suppressNextToothClick = false; return; }
  // Shift-click takes the span from the anchor, the same convention as
  // Shift+arrow and as every list the user already knows (odontogram-apn).
  if(evt.shiftKey && selectionAnchor !== null && !(evt.metaKey || evt.ctrlKey)){
    const span = teethBetween(selectionAnchor, toothNo, isTileNavigable);
    if(span.length > 0){
      selectedTeeth = new Set(span);
      activeTooth = toothNo;
      updateSelectionUI();
      focusTooth(toothNo);
      return;
    }
  }
  const multi = evt.metaKey || evt.ctrlKey;
  if(multi){
    if(selectedTeeth.has(toothNo)){
      selectedTeeth.delete(toothNo);
    }else{
      selectedTeeth.add(toothNo);
      activeTooth = toothNo;
    }
  }else{
    selectedTeeth = new Set([toothNo]);
    activeTooth = toothNo;
  }
  if(activeTooth && !selectedTeeth.has(activeTooth)){
    activeTooth = selectedTeeth.values().next().value ?? null;
  }
  selectionAnchor = toothNo;
  updateSelectionUI();
  // Put keyboard focus on the tooth's canonical (side-view) tile — the same
  // tile the Tab walk focuses. Without this, a click on the OCCLUSAL tile or
  // the number label selects the tooth but focuses nothing (only the side view
  // carries tabindex), so shorthand typed afterwards lands nowhere and a Tab
  // step walks from the wrong tooth. Selection and the typing focus must agree.
  if(activeTooth != null) focusTooth(activeTooth);
}

// ---- Keyboard accessibility ----
// One table, not two: the arrow keys and the Tab walk (odontogram-t8y) read the
// same arch order, so they can never disagree about where a tooth is.
const NAV_ROWS = ARCH_ROWS;

function isTileNavigable(toothNo: number): boolean{
  const tiles = toothTile.get(toothNo);
  if(!tiles || tiles.length === 0) return false;
  return tiles.some(t => !t.classList.contains("wisdom-hidden") && !t.classList.contains("placeholder"));
}

function findNavTarget(currentTooth: number, direction: string): number | null {
  const rowIdx = NAV_ROWS.findIndex(r => r.includes(currentTooth));
  if(rowIdx < 0) return null;
  const row = NAV_ROWS[rowIdx];
  const colIdx = row.indexOf(currentTooth);

  let targetTooth: number | null = null;
  if(direction === "ArrowRight"){
    for(let i = colIdx + 1; i < row.length; i++){
      if(isTileNavigable(row[i])){ targetTooth = row[i]; break; }
    }
  }else if(direction === "ArrowLeft"){
    for(let i = colIdx - 1; i >= 0; i--){
      if(isTileNavigable(row[i])){ targetTooth = row[i]; break; }
    }
  }else if(direction === "ArrowDown"){
    if(rowIdx < NAV_ROWS.length - 1){
      const nextRow = NAV_ROWS[rowIdx + 1];
      const nextCol = Math.min(colIdx, nextRow.length - 1);
      for(let i = nextCol; i < nextRow.length; i++){
        if(isTileNavigable(nextRow[i])){ targetTooth = nextRow[i]; break; }
      }
      if(!targetTooth){
        for(let i = nextCol - 1; i >= 0; i--){
          if(isTileNavigable(nextRow[i])){ targetTooth = nextRow[i]; break; }
        }
      }
    }
  }else if(direction === "ArrowUp"){
    if(rowIdx > 0){
      const prevRow = NAV_ROWS[rowIdx - 1];
      const prevCol = Math.min(colIdx, prevRow.length - 1);
      for(let i = prevCol; i < prevRow.length; i++){
        if(isTileNavigable(prevRow[i])){ targetTooth = prevRow[i]; break; }
      }
      if(!targetTooth){
        for(let i = prevCol - 1; i >= 0; i--){
          if(isTileNavigable(prevRow[i])){ targetTooth = prevRow[i]; break; }
        }
      }
    }
  }

  return targetTooth;
}

function navigateToTooth(currentTooth: number, direction: string){
  const targetTooth = findNavTarget(currentTooth, direction);
  if(targetTooth !== null) focusTooth(targetTooth);
}

function focusTooth(toothNo: number){
  const tiles = toothTile.get(toothNo);
  const sideTile = tiles?.find((t: HTMLElement) => t.classList.contains("side-view"));
  if(sideTile) sideTile.focus();
}

/**
 * Shift + arrow extends the selection instead of moving through it — the
 * Windows convention Dirk names (19.08.2026: "In Windows nutze ich die Shift
 * Taste und gehe mit der Pfeiltaste weiter").
 *
 * It extends from an ANCHOR, not from the tooth last reached: holding Shift
 * and going right then left has to shrink the span again, which only works if
 * the far end stays put. The anchor is set by every plain selection — a click,
 * a Tab step, an unshifted arrow.
 */
let selectionAnchor: number | null = null;

function extendSelectionTo(target: number){
  const anchor = selectionAnchor ?? target;
  const span = teethBetween(anchor, target, isTileNavigable);
  selectedTeeth = new Set(span);
  activeTooth = target;
  updateSelectionUI();
  focusTooth(target);
}

// ---- Bead odontogram-t8y: charting by shorthand -----------------------------
//
// Dirk's workflow at the chair, in his own words (19.08.2026): walk the arch
// with Tab starting at 18, Shift+Tab to step back, and type the finding as
// shorthand on the tooth you are standing on. `k`, Tab, `b` is a crown with a
// cantilever pontic on its neighbour — one gesture, not two mouse selections.
//
// THE TAB WALK MOVES THE SELECTION, not merely the focus. Dirk: "Wo er dann
// steht ist egal, aber der gewaehlte Zahn ist immer hervorgehoben, so dass ich
// sehe, wo ich gerade bin." So the walked tooth IS the selected tooth, and the
// existing `.active` styling shows where you are — no second notion of a
// "current tooth" beside the one that already exists.
//
// The arrow keys are untouched. They are the map (two rows, spatial, no wrap);
// Tab is the round (one chain, around the mouth, wraps). Different intents.

// Zoltán Dul, 19.08.2026, on the upstream issue: "The one firm principle,
// whatever we add here: it has to be flexible and fully configurable in
// Settings, never hard-wired. If you want to build a keyboard-entry path, that
// is the bar. Someone who wants it can switch it on and shape it, and someone
// who does not never has to see it."
//
// He is right beyond the upstream question. Typing letters on a tile is
// additive — nothing else uses those keys — but the Tab walk OVERRIDES a
// standard navigation key, and a chart nobody types on should not have to.
//
// Both default ON in this fork, because this is Dirk's chart and he asked for
// them; a host that wants the upstream default flips them at mount. Session
// state like `perioViewMode`, never part of the payload.
// Dirk, 20.08.2026: "Das Odontogramm wirkt absolut zweidimensional. Koennte man
// ueber optische Traicks an den Wurzeln und den anderen Flaechen die Illusion
// einer dritten Dimension erzeugen?" - und gleich danach die richtige Frage:
// "Aber das laesst sich alles an und abschalten?"
//
// Ja. Der Tiefenreiz ist eine DARSTELLUNGSSACHE und traegt keinen Befund; wer
// den flachen Schnitt lieber liest, bekommt ihn. Sitzungszustand wie
// `perioViewMode`, nie Teil der Nutzlast. Geschaltet wird ueber eine Klasse am
// Raster, damit im Renderpfad kein JavaScript laeuft - dieselbe Bauweise wie
// bei den Restaurationsfarben.
let toothDepth = true;

export function getToothDepth(): boolean { return toothDepth; }
export function setToothDepth(on: boolean): void {
  const next = !!on;
  if(next === toothDepth) return;
  toothDepth = next;
  syncToothDepthClass();
  updateBridgeOverlay();   // zeichnet die Auflagen neu, samt Halsverschattung
  notifyStateChange();
}

function syncToothDepthClass(): void {
  const grid = document.getElementById("toothGrid");
  if(grid) grid.classList.toggle("odon-depth", toothDepth);
  if(grid) grid.classList.toggle("odon-style-v1", anatomicalStyle === "draft-v1");
}

// Anatomical display style (Claude Design "Entwurf v1", 26.09.2026). A THIRD
// look beside the classic one, never a replacement: session state like the
// depth switch, default "classic", and everything the draft changes hangs off
// ONE class on #toothGrid (`odon-style-v1`, rules in index.css) plus the
// draft palette above — switching back removes both and the chart is exactly
// what it was. Colours and strokes only: no layer is switched and no template
// is touched, so the SVG fingerprint (id/opacity/class) is byte-identical.
export type AnatomicalStyle = "classic" | "draft-v1";
export const ANATOMICAL_STYLES: readonly AnatomicalStyle[] = ["classic", "draft-v1"];
let anatomicalStyle: AnatomicalStyle = "classic";

export function getAnatomicalStyle(): AnatomicalStyle { return anatomicalStyle; }
export function setAnatomicalStyle(style: AnatomicalStyle): void {
  if(!ANATOMICAL_STYLES.includes(style) || style === anatomicalStyle) return;
  anatomicalStyle = style;
  syncToothDepthClass();
  syncRestorationPalette();
  updateBridgeOverlay();   // connectors carry the material colour
  notifyStateChange();
}

/** The bridge connectors are painted from a material NAME, not the cascade. */
function bridgeMaterialColor(material: string): string {
  if(usesDraftPalette() && DRAFT_V1_MATERIAL[material]) return DRAFT_V1_MATERIAL[material];
  return defaultMaterialColor(material);
}

let shorthandEnabled = true;
let shorthandTabWalk = true;

export function getShorthandEnabled(): boolean { return shorthandEnabled; }
export function setShorthandEnabled(on: boolean): void {
  const next = !!on;
  if(next === shorthandEnabled) return;
  shorthandEnabled = next;
  // Switching it off must not leave half-typed keys or a material mode
  // standing, invisible and waiting to be applied by the next switch-on.
  if(!next) resetShorthandInput();
  notifyStateChange();
}

export function getShorthandTabWalk(): boolean { return shorthandTabWalk; }
export function setShorthandTabWalk(on: boolean): void {
  const next = !!on;
  if(next === shorthandTabWalk) return;
  shorthandTabWalk = next;
  notifyStateChange();
}

/** The material mode, as charly carries it: chosen once, then it stands. Session
 *  state — never serialized, like `perioViewMode` and friends. */
let shorthandMaterial: MaterialKey | null = null;
/** Keystrokes not yet committed. Multi-character keys (`mod`, `Twf`, `K3`) mean
 *  a keystroke cannot be applied on its own; the buffer is committed by Tab
 *  (apply and advance) or Enter (apply and stay). */
let shorthandBuffer = "";

export function getShorthandMaterial(): MaterialKey | null { return shorthandMaterial; }
export function getShorthandBuffer(): string { return shorthandBuffer; }

// The Befund-Dock's material chip and the keyboard's material MODE are one and
// the same (Dirk, 31.08.2026): arming a material in the dock arms it for the
// keyboard too, so typing `k`/`b`/… then applies the finding IN that material —
// in Status and, above all, in Plan mode (where the work is entered). The dock
// keys are single letters (K/A/G/E); the mode stores charly's MaterialKey.
const DOCK_CHAR_TO_MATERIAL: Record<string, MaterialKey> = { A: "Am", K: "Kst", G: "G", E: "Ker", Zir: "Zir", NEM: "NEM" };
const MATERIAL_TO_DOCK_CHAR: Record<string, string> = { Am: "A", Kst: "K", G: "G", Ker: "E", Zir: "Zir", NEM: "NEM" };
export function setShorthandMaterial(ch: string | null): void {
  const next = (ch && DOCK_CHAR_TO_MATERIAL[ch]) ? DOCK_CHAR_TO_MATERIAL[ch] : null;
  if(shorthandMaterial === next) return;
  shorthandMaterial = next;
  syncShorthandReadout();
  notifyStateChange();   // so the dock chip mirrors a keyboard-armed material
}
/** The armed material as a dock chip char (K/A/G/E), or null. */
export function getShorthandMaterialChar(): string | null {
  return shorthandMaterial ? (MATERIAL_TO_DOCK_CHAR[shorthandMaterial] ?? null) : null;
}

function shorthandReadoutEl(): HTMLElement | null {
  return document.getElementById("shorthandBuffer");
}

/** A message that overrides the read-out for a moment — a key that did nothing
 *  has to SAY so. At the chair one keeps typing otherwise and notices only at
 *  the finished chart. */
let shorthandNotice = "";
let shorthandNoticeTimer: ReturnType<typeof setTimeout> | null = null;

/** A React view without the anatomical read-out element (the schematic
 *  keypad) subscribes here to show what is being typed. */
export interface ShorthandReadout { material: string | null; buffer: string; notice: string }
const shorthandReadoutObservers = new Set<(r: ShorthandReadout) => void>();
export function onShorthandReadout(cb: (r: ShorthandReadout) => void): () => void {
  shorthandReadoutObservers.add(cb);
  return () => { shorthandReadoutObservers.delete(cb); };
}

function syncShorthandReadout(){
  const snapshot: ShorthandReadout = { material: shorthandMaterial, buffer: shorthandBuffer, notice: shorthandNotice };
  for(const cb of shorthandReadoutObservers){ try{ cb(snapshot); }catch{ /* an observer must not break typing */ } }
  const el = shorthandReadoutEl();
  if(!el) return;
  if(shorthandNotice){
    el.textContent = shorthandNotice;
    el.classList.remove("empty");
    el.classList.add("notice");
    return;
  }
  el.classList.remove("notice");
  const mat = shorthandMaterial ? shorthandMaterial : "";
  el.textContent = (mat ? mat + " " : "") + shorthandBuffer;
  el.classList.toggle("empty", !mat && !shorthandBuffer);
}

/** Says what a keystroke did NOT do. The two cases are kept apart on purpose:
 *  a typo and a key whose axis we have not built yet are different situations,
 *  and only one of them is the user's mistake. */
function reportShorthand(r: { unknown: string[]; pending: { token: string; bead: string }[]; needsMaterial?: string[] }): void {
  const parts: string[] = [];
  if(r.needsMaterial && r.needsMaterial.length > 0){
    parts.push(t("shorthand.needsMaterial").replace("{keys}", r.needsMaterial.join(" ")));
  }
  if(r.pending.length > 0){
    parts.push(t("shorthand.pending").replace("{keys}", r.pending.map(p => p.token).join(" ")));
  }
  if(r.unknown.length > 0){
    parts.push(t("shorthand.unknown").replace("{keys}", r.unknown.join(" ")));
  }
  if(parts.length === 0) return;
  reportShorthandMessage(parts.join(" · "));
}

/** Shows a message in the read-out for a moment, in place of the buffer. */
function reportShorthandMessage(text: string): void {
  shorthandNotice = text;
  if(shorthandNoticeTimer) clearTimeout(shorthandNoticeTimer);
  shorthandNoticeTimer = setTimeout(() => {
    shorthandNotice = "";
    syncShorthandReadout();
  }, 2500);
  syncShorthandReadout();
}

/** Writes one parsed edit onto a tooth's state. Kept beside the gate rather
 *  than inside `shorthand.ts`, which never touches state. */
function writeShorthandEdit(s: Any, edit: ShorthandEdit, toothNo: number): void {
  if(edit.kind === "denture"){
    // A gap carrying a denture tooth. The registry forbids a fixed restoration
    // beside a prosthesis, so both are cleared rather than left standing.
    s.toothSelection = "none";
    s.restorationType = "none";
    s.restorationMaterial = "none";
    s.prosthesis = dentureValueFor(toothNo, selectedTeeth as Set<number>, isTileNavigable);
    return;
  }
  if(edit.kind === "axis"){
    // `MZ`: a milk tooth exists only on positions 1-5 (PRIMARY_MILK); on a
    // molar position the key writes nothing rather than an impossible tooth.
    if(edit.field === "toothSelection" && edit.value === "milktooth" && !PRIMARY_MILK.has(toothNo)) return;
    s[edit.field] = edit.value;
    return;
  }
  if(edit.kind === "surfaces" && edit.target === "filling"){
    s.fillingMaterial = edit.material;
    for(const surf of edit.surfaces){
      s.fillingSurfaces.add(surf);
      s.fillingSurfaceMaterials.set(surf, edit.material);
    }
    return;
  }
  if(edit.kind === "surfaces" && edit.target === "caries"){
    for(const surf of edit.surfaces){
      s.caries.add(`caries-${surf}`);
      if(edit.severity !== null) s.cariesSeverity.set(surf, edit.severity);
    }
    return;
  }
  if(edit.kind === "surfaces" && edit.target === "restoration-coverage"){
    // Surfaces of a partial restoration (restoration material + surfaces): they
    // are the restoration's extent, stored for the cost plan (Dirk, 31.08.2026).
    // Which coverage depends on what the tooth already is — a veneer stays a
    // veneer, an onlay an onlay; anything else becomes an inlay.
    const rt = s.restorationType;
    const field = rt === "veneer" ? "veneerCoverage" : rt === "onlay" ? "onlayCoverage" : "inlayCoverage";
    if(rt !== "veneer" && rt !== "onlay" && rt !== "inlay") s.restorationType = "inlay";
    const cur: string[] = Array.isArray(s[field]) ? s[field] : [];
    const set = new Set<string>(cur);
    for(const surf of edit.surfaces) set.add(surf);
    s[field] = [...set];
    return;
  }
}

// ---- Widerruf ---------------------------------------------------------------
//
// The bead asks for one, and without it the shorthand fails at exactly the
// point it was built for: a mistyped key would be corrected through the click
// paths the shorthand exists to avoid.
//
// A step snapshots what the edit COULD have touched, not what it did: both
// charts and the plan-edited marks of the affected teeth. Undo then restores
// them wholesale. It is deliberately NOT routed through `gateToothEdit` — an
// undo is not a new edit but the withdrawal of one, and running it through the
// gate would ask the dual-state question a second time about a decision the
// user has just taken back.

interface ShorthandUndoStep {
  teeth: number[];
  status: Map<number, Any>;
  /** `null` while the plan chart is uninitialized — there was nothing to save. */
  plan: Map<number, Any> | null;
  planEdited: Set<number>;
  material: MaterialKey | null;
}

/** Twenty steps. Deep enough for a slip a few teeth back, shallow enough that
 *  a session cannot grow a copy of the whole mouth many times over. */
const SHORTHAND_UNDO_DEPTH = 20;
const shorthandUndoStack: ShorthandUndoStep[] = [];

function snapshotTeeth(chart: Map<number, Any>, teeth: number[]): Map<number, Any> {
  const out = new Map<number, Any>();
  for(const toothNo of teeth){
    const st = chart.get(toothNo);
    if(st) out.set(toothNo, serializeState(st));
  }
  return out;
}

function pushShorthandUndo(teeth: number[]): void {
  if(teeth.length === 0) return;
  shorthandUndoStack.push({
    teeth: [...teeth],
    status: snapshotTeeth(charts.status, teeth),
    plan: planInitialized ? snapshotTeeth(charts.plan, teeth) : null,
    planEdited: new Set(teeth.filter(t => planEditedTeeth.has(t))),
    material: shorthandMaterial,
  });
  if(shorthandUndoStack.length > SHORTHAND_UNDO_DEPTH) shorthandUndoStack.shift();
}

/** Drops the history AND the input state. Called wherever `planEditedTeeth` is
 *  cleared — a reset, an import or a plan (re)initialisation changes the case
 *  under the typist, and both halves would be wrong afterwards: a step kept
 *  across that restores teeth out of a DIFFERENT case, and a material mode kept
 *  across it silently makes the next crown gold because of a case that is gone.
 *  One rule for all five sites rather than an exception to remember. */
function resetShorthandInput(): void {
  shorthandUndoStack.length = 0;
  shorthandMaterial = null;
  shorthandBuffer = "";
  syncShorthandReadout();
}

/** How many shorthand steps can still be taken back. */
export function getShorthandUndoDepth(): number { return shorthandUndoStack.length; }

/**
 * Takes back the last shorthand entry, over every tooth it touched.
 *
 * Returns `false` when there is nothing to take back, so a caller can say so
 * instead of a keystroke going nowhere.
 */
export function undoShorthand(): boolean {
  const step = shorthandUndoStack.pop();
  if(!step) return false;
  for(const toothNo of step.teeth){
    const st = step.status.get(toothNo);
    if(st) charts.status.set(toothNo, hydrateState(st, false));
    else charts.status.delete(toothNo);
    if(step.plan){
      const pl = step.plan.get(toothNo);
      if(pl) charts.plan.set(toothNo, hydrateState(pl, false));
      else charts.plan.delete(toothNo);
    }
    // The marks too: an edit that made a tooth plan-edited must not leave it
    // marked once it has been taken back.
    if(step.planEdited.has(toothNo)) planEditedTeeth.add(toothNo);
    else planEditedTeeth.delete(toothNo);
    applyStateToSvg(toothNo);
    updateToothTileNumber(toothNo);
  }
  // The material mode is part of the step: `G k` taken back must not leave gold
  // standing, or the next crown would silently be gold as well.
  shorthandMaterial = step.material;
  if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
  updateSelectionFilterButtons();
  syncShorthandReadout();
  notifyStateChange();
  return true;
}

/**
 * Applies shorthand to the current selection. The material mode is carried in
 * and out, so it survives across teeth exactly as it does on charly's keypad.
 *
 * Returns what could not be applied, so a caller can say WHY nothing happened:
 * a typo and a key whose axis we have not built yet are different situations
 * (see `SHORTHAND_PENDING`).
 */
export function applyShorthand(input: string): { unknown: string[]; pending: { token: string; bead: string }[]; needsMaterial: string[] } {
  // A read-only chart is read-only through EVERY interactive path. The engine's
  // own DOM handlers (`onToothClick`, `onToothKeydown`, the touch wiring) each
  // guard here, but the schematic keypad is a React component that calls this
  // exported mutator directly, so without this guard a locked chart still took
  // findings from the keypad. Nothing is parsed or applied, and the caller gets
  // the empty report of a token that changed nothing.
  if(readOnly) return { unknown: [], pending: [], needsMaterial: [] };
  const r = parseShorthand(input, { material: shorthandMaterial });
  // Snapshot BEFORE the mode changes, so taking the step back restores the
  // material that was standing when it was typed.
  if(r.edits.length > 0 || r.material !== shorthandMaterial){
    pushShorthandUndo(Array.from(selectedTeeth) as number[]);
  }
  shorthandMaterial = r.material;
  // `MZ` is a SWITCH (Dirk, 25.09.2026: "vom permanenten zum Milchzahn, aber
  // nicht zurueck"): when every selected tooth that can be one already IS a
  // milk tooth, it turns them back into permanent teeth; otherwise it makes
  // them milk teeth. One direction for the whole selection, decided before
  // writing, so a mixed selection never flips half one way and half the other.
  // The findings on the teeth stay — `o.B.` was the only way back and wiped them.
  for(const e of r.edits as Any[]){
    if(e.kind === "axis" && e.field === "toothSelection" && e.value === "milktooth"){
      const eligible = (Array.from(selectedTeeth) as number[]).filter(tn => PRIMARY_MILK.has(tn));
      const allMilk = eligible.length > 0 && eligible.every(tn => toothState.get(tn)?.toothSelection === "milktooth");
      if(allMilk) e.value = "tooth-base";
    }
  }
  if(r.edits.length > 0){
    // `o.B.` resets the whole tooth, so it cannot ride the per-field writer.
    const reset = r.edits.some(e => e.kind === "reset");
    applyToSelected((st: Any, toothNo: number) => {
      if(reset){
        toothState.set(toothNo, defaultState());
        return;
      }
      for(const e of r.edits) writeShorthandEdit(st, e, toothNo);
    });
    if(reset){
      // defaultState() replaced the object applyToSelected handed us; repaint
      // from the new one.
      for(const toothNo of Array.from(selectedTeeth) as number[]){
        applyStateToSvg(toothNo);
        updateToothTileNumber(toothNo);
      }
      if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
    }
  }
  syncShorthandReadout();
  return { unknown: r.unknown, pending: r.pending, needsMaterial: r.needsMaterial };
}

/** A mouse click on a surface in the schematic view. The token is the one the
 *  keypad's surface keys emit (`Ko`, `co`, `cK3o`), but a CLICK is a toggle:
 *  when the clicked tooth already carries exactly that finding on every surface
 *  of the token — caries there, or a filling of that material — the click takes
 *  it off again, across the selection. Before, a click could only add, so a
 *  surface clicked by mistake could not be taken back by mouse (Dirk,
 *  25.09.2026). The keyboard stays additive — typing `co` twice must not undo
 *  itself — which is why this is its own entry point rather than a change to
 *  `applyShorthand`. Same gate (`applyToSelected` → DS-1) and the same undo
 *  step as the shorthand. Anything else (a restoration coverage surface) is
 *  applied exactly as the shorthand does. */
export function toggleSurfaceShorthand(toothNo: number, token: string): "added" | "removed" {
  const r = parseShorthand(token, { material: shorthandMaterial });
  const edit: Any = r.edits.find((e: Any) => e.kind === "surfaces");
  const st: Any = toothState.get(toothNo);
  if(edit && st && (edit.target === "caries" || edit.target === "filling")){
    const carries = (x: Any, surf: string) => edit.target === "caries"
      ? x.caries.has(`caries-${surf}`)
      : x.fillingSurfaces.has(surf) && x.fillingSurfaceMaterials.get(surf) === edit.material;
    if(edit.surfaces.length > 0 && edit.surfaces.every((surf: string) => carries(st, surf))){
      pushShorthandUndo(Array.from(selectedTeeth) as number[]);
      applyToSelected((x: Any) => {
        for(const surf of edit.surfaces){
          if(!carries(x, surf)) continue;
          if(edit.target === "caries"){
            x.caries.delete(`caries-${surf}`);
            x.cariesSeverity.delete(surf);
          }else{
            x.fillingSurfaces.delete(surf);
            x.fillingSurfaceMaterials.delete(surf);
          }
        }
      });
      syncShorthandReadout();
      return "removed";
    }
  }
  applyShorthand(token);
  return "added";
}

/** Selects a single tooth and puts the focus on it — what the Tab walk does. */
function selectToothForWalk(toothNo: number): void {
  selectedTeeth = new Set([toothNo]);
  activeTooth = toothNo;
  selectionAnchor = toothNo;
  updateSelectionUI();
  const tiles = toothTile.get(toothNo);
  const sideTile = tiles?.find((t: HTMLElement) => t.classList.contains("side-view"));
  if(sideTile) sideTile.focus();
}

/** Commits the buffer, then steps one tooth in charting order. */
function shorthandStep(from: number, direction: 1 | -1): void {
  if(shorthandBuffer) reportShorthand(applyShorthand(shorthandBuffer));
  shorthandBuffer = "";
  const next = nextChartTooth(from, direction, isTileNavigable);
  if(next !== null) selectToothForWalk(next);
  syncShorthandReadout();
}

/** True for a key that belongs in the shorthand buffer rather than to the
 *  browser: a single printable character, unmodified. */
function isShorthandKey(evt: KeyboardEvent): boolean {
  if(evt.ctrlKey || evt.metaKey || evt.altKey) return false;
  return evt.key.length === 1 && evt.key !== " ";
}

/** Cmd/Strg+Z on a tile — the withdrawal every program uses the same key for.
 *  Returns whether it was handled, so the caller can fall through otherwise. */
function handleShorthandUndoKey(evt: KeyboardEvent): boolean {
  if(!(evt.metaKey || evt.ctrlKey) || evt.altKey) return false;
  if(evt.key !== "z" && evt.key !== "Z") return false;
  evt.preventDefault();
  // An uncommitted buffer is taken back first: it is the more recent thing,
  // and taking back a written finding while unwritten keys still stand would
  // read as the wrong step having been undone.
  if(shorthandBuffer){
    shorthandBuffer = "";
    syncShorthandReadout();
    return true;
  }
  if(!undoShorthand()) reportShorthandMessage(t("shorthand.nothingToUndo"));
  return true;
}

/** The caries surfaces the last keystrokes entered on the current selection,
 *  so a stage typed AFTER them grades them (`mod K3`, Dirk's charly order).
 *  Consecutive surface keys add up (`m`, then `od`); anything else clears it. */
let lastCariesRun: { teeth: string; surfaces: string[] } | null = null;
const selectionKey = () => (Array.from(selectedTeeth) as number[]).sort((a, b) => a - b).join(",");

/** Applies what is in the buffer to the selection and empties it. */
function commitShorthandBuffer(): void {
  if(shorthandIdleTimer){ clearTimeout(shorthandIdleTimer); shorthandIdleTimer = null; }
  if(!shorthandBuffer) return;
  const matBefore = shorthandMaterial;
  const parsed = parseShorthand(shorthandBuffer, { material: shorthandMaterial });
  const ungraded = parsed.edits.filter((e: Any) => e.kind === "surfaces" && e.target === "caries" && e.severity === null);
  if(ungraded.length > 0 && ungraded.length === parsed.edits.length){
    const key = selectionKey();
    const prior = lastCariesRun && lastCariesRun.teeth === key ? lastCariesRun.surfaces : [];
    const surfaces = new Set<string>(prior);
    for(const e of ungraded) for(const surf of (e as Any).surfaces) surfaces.add(surf);
    lastCariesRun = { teeth: key, surfaces: [...surfaces] };
  }else if(parsed.edits.length > 0){
    lastCariesRun = null;
  }
  reportShorthand(applyShorthand(shorthandBuffer));
  shorthandBuffer = "";
  // A typed material key (`K`, `G`, …) arms the dock chip too.
  if(shorthandMaterial !== matBefore) notifyStateChange();
}

/** How long a buffer that is complete but COULD still grow (`o` → `o.B.`,
 *  `K` → `K3`) waits for a further key before it is applied on its own. */
const SHORTHAND_IDLE_MS = 600;
let shorthandIdleTimer: ReturnType<typeof setTimeout> | null = null;

/** One typed shorthand key, the same on a tooth tile and in the schematic view.
 *  A key that is a finding on its own applies at once — six anteriors marked
 *  and one `k` is the whole gesture — and so does a SURFACE (Dirk, 25.09.2026:
 *  "Ich aktiviere Karies und druecke m o d und nichts erscheint"). What waits:
 *  a run opener (`c`, a stage), and a key some longer key begins with. The
 *  latter is applied after a short pause if nothing follows, since at the end
 *  of `mod` — or after a lone `o` — there is no next keystroke to resolve it. */
function typeShorthandKey(key: string): void {
  if(shorthandIdleTimer){ clearTimeout(shorthandIdleTimer); shorthandIdleTimer = null; }
  shorthandBuffer += key;
  // A stage right after caries surfaces grades those surfaces: `mod`, then `K3`.
  const stage = loneSeverity(shorthandBuffer);
  if(stage !== null && lastCariesRun && lastCariesRun.teeth === selectionKey()){
    const surfaces = lastCariesRun.surfaces;
    pushShorthandUndo(Array.from(selectedTeeth) as number[]);
    applyToSelected((x: Any) => {
      for(const surf of surfaces){
        if(x.caries.has(`caries-${surf}`)) x.cariesSeverity.set(surf, stage);
      }
    });
    shorthandBuffer = "";
    syncShorthandReadout();
    return;
  }
  if(shouldCommit(shorthandBuffer)){
    commitShorthandBuffer();
  }else if(isCompleteShorthand(shorthandBuffer)){
    const waiting = shorthandBuffer;
    shorthandIdleTimer = setTimeout(() => {
      shorthandIdleTimer = null;
      if(shorthandBuffer !== waiting) return;
      commitShorthandBuffer();
      syncShorthandReadout();
    }, SHORTHAND_IDLE_MS);
  }
  syncShorthandReadout();
}

function onToothKeydown(toothNo: number, evt: KeyboardEvent){
  if(readOnly) return;
  if(shorthandEnabled && handleShorthandUndoKey(evt)) return;
  switch(evt.key){
    case "Enter":
    case " ":
      evt.preventDefault();
      if(shorthandEnabled && shorthandBuffer){
        // Apply without advancing — the other half of Tab.
        reportShorthand(applyShorthand(shorthandBuffer));
        shorthandBuffer = "";
        syncShorthandReadout();
      }else{
        onToothClick(toothNo, evt);
      }
      break;
    case "ArrowRight":
    case "ArrowLeft":
    case "ArrowUp":
    case "ArrowDown": {
      evt.preventDefault();
      const target = findNavTarget(toothNo, evt.key);
      if(target === null) break;
      if(evt.shiftKey){
        extendSelectionTo(target);
      }else{
        // A plain arrow moves the focus only, as it always has — and sets the
        // anchor, so a Shift that follows extends from where one stands.
        selectionAnchor = target;
        focusTooth(target);
      }
      break;
    }
    case "Tab":
      // A deliberate departure from the usual ARIA rule that Tab LEAVES a
      // composite widget — which is exactly why it is switchable. Off, Tab
      // does what it does everywhere else and leaves the chart.
      if(!shorthandEnabled || !shorthandTabWalk) break;
      evt.preventDefault();
      shorthandStep(toothNo, evt.shiftKey ? -1 : 1);
      break;
    case "Backspace":
      if(shorthandEnabled && shorthandBuffer){
        evt.preventDefault();
        shorthandBuffer = shorthandBuffer.slice(0, -1);
        syncShorthandReadout();
      }
      break;
    case "Escape":
      evt.preventDefault();
      if(shorthandEnabled && (shorthandBuffer || shorthandMaterial)){
        shorthandBuffer = "";
        shorthandMaterial = null;
        syncShorthandReadout();
      }else{
        clearSelection();
      }
      break;
    default:
      if(shorthandEnabled && isShorthandKey(evt)){
        evt.preventDefault();
        typeShorthandKey(evt.key);
      }
      break;
  }
}

/**
 * Keyboard entry for a view with no focused tooth tile — the schematic view.
 * Dirk, 25.09.2026: "ich brauche auch die Tastatur wie in charly"; his recorded
 * session shows `k`, `k`, `m` typed and nothing happening each time, because
 * every key handler hung on the anatomical tile that holds the focus, and the
 * schematic view has none. Same buffer, same commit rule, same Tab walk (from
 * 18 when nothing is selected) and the same Cmd/Strg+Z as `onToothKeydown`.
 * Two differences, both because there is no focus ring to follow: a plain
 * arrow MOVES THE SELECTION (on a tile it only moves the focus), and — like
 * Tab — it commits a pending buffer first, so keys typed for one tooth never
 * land on the next. Returns whether the key was consumed; the caller leaves
 * everything else (Enter on a focused button, typing in a field) alone.
 */
export function handleChartKeydown(evt: KeyboardEvent): boolean {
  if(readOnly || !shorthandEnabled) return false;
  if(handleShorthandUndoKey(evt)) return true;
  const cur = (activeTooth && selectedTeeth.has(activeTooth)) ? activeTooth : null;
  const commit = commitShorthandBuffer;
  switch(evt.key){
    case "Tab": {
      if(!shorthandTabWalk) return false;
      evt.preventDefault();
      if(cur === null){
        commit();
        const first = ARCH_ROWS[0].find(isTileNavigable);
        if(first !== undefined) selectToothForWalk(first);
        syncShorthandReadout();
      }else{
        shorthandStep(cur, evt.shiftKey ? -1 : 1);
      }
      return true;
    }
    case "ArrowRight":
    case "ArrowLeft":
    case "ArrowUp":
    case "ArrowDown": {
      if(cur === null) return false;
      evt.preventDefault();
      const target = findNavTarget(cur, evt.key);
      if(target === null) return true;
      if(evt.shiftKey){
        extendSelectionTo(target);
      }else{
        commit();
        selectToothForWalk(target);
      }
      syncShorthandReadout();
      return true;
    }
    case "Enter":
      if(!shorthandBuffer) return false;
      evt.preventDefault();
      commit();
      syncShorthandReadout();
      return true;
    case "Backspace":
      if(!shorthandBuffer) return false;
      evt.preventDefault();
      shorthandBuffer = shorthandBuffer.slice(0, -1);
      syncShorthandReadout();
      return true;
    case "Escape":
      if(shorthandBuffer || shorthandMaterial){
        evt.preventDefault();
        const hadMaterial = !!shorthandMaterial;
        shorthandBuffer = "";
        shorthandMaterial = null;
        syncShorthandReadout();
        if(hadMaterial) notifyStateChange();   // the dock chip un-arms with it
        return true;
      }
      return false;
    default: {
      if(!isShorthandKey(evt)) return false;
      evt.preventDefault();
      if(cur === null){
        reportShorthandMessage(t("schematic.keypad.pickTooth"));
        return true;
      }
      typeShorthandKey(evt.key);
      return true;
    }
  }
}

/**
 * Bead odontogram-ca0: die entfernte Wurzel wird WEGGESCHNITTEN.
 *
 * Dirk, 20.08.2026: "Bei der Hemisektion wird an der Furkation durchtrennt und
 * eine Wurzel entfernt." Etwas wegzunehmen kann eine Auflage nicht - eine
 * Auflage legt auf. Deshalb ein `clip-path` an der Kachel selbst.
 *
 * Hier steht nur, WELCHE SEITE weg soll; die Form des Schnitts steht in der
 * CSS. Das ist Absicht: eine Schnittfuehrung stellt man am Bild ein, und in der
 * CSS kostet das ein Neuladen statt eines Generatorlaufs.
 *
 * Der anatomische Name allein reicht zum Zeichnen nicht - eine Seitenansicht
 * kennt links und rechts, und mesial liegt je nach Quadrant anders (siehe
 * `rootSideOf`). Die palatinale Wurzel steht in dieser Ansicht hinter der
 * bukkalen und hat gar keine eigene Seite; dort wird nichts geschnitten,
 * sondern der Befund bleibt als Text stehen.
 */
/** Bead odontogram-t6y: Art und Seite der Bruchlinie an die Kachel schreiben.
 *  Gezeichnet wird sie in der Auflage (`gumOverlay.ts`); hier steht nur, WAS
 *  und WO - dieselbe Aufgabenteilung wie bei der Hemisektionsmaske. */
function syncFractureMark(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const art = (st?.rootFracture as string) ?? "none";
  const wurzel = (st?.rootFractureRoot as string) ?? "";
  const zeigen = art !== "none" && rootFractureAllowed(st ?? defaultState());
  for(const tile of tiles){
    if(zeigen && tile.classList.contains("side-view")){
      tile.dataset.fractureKind = art;
      tile.dataset.fractureSide = wurzel ? rootSideOf(toothNo, wurzel) : "mitte";
    }else{
      delete tile.dataset.fractureKind;
      delete tile.dataset.fractureSide;
    }
  }
}

/** Bead odontogram-0n8: den Durchbruchsstand an die Kachel schreiben.
 *
 *  Gezeichnet wird er in der CSS, nicht hier: ein durchbrechender Zahn ist
 *  derselbe Zahn, nur weiter apikal, und das ist eine Verschiebung - keine
 *  neue Zeichnung. Dirk am 21.08.2026: "Wir setzen die Zahnkrone in Relation
 *  zum Kiefer und Zahnfleisch auf eine niedrigere Hoehe und maskieren die
 *  Wurzel, die sonst aus dem Kasten nach oben ragen wuerde."
 *
 *  Die Alternative - Krone ueber die Wurzel schieben - haette den Umriss in
 *  zwei Teile schneiden muessen. Der ist EIN durchgehender Pfad, und
 *  `verify_redraw.py` besteht darauf; an Vorlage 14 allein kreuzen ausserdem
 *  41 Ebenen die Schmelz-Zement-Grenze und muessten alle mitgeschnitten
 *  werden. Und ein durchbrechender Zahn wird nicht kuerzer, er wandert. */
/** Wie hoch die Krone eines Templates ueber dem Zahnfleischrand steht, in
 *  Template-Einheiten. Je Vorlage einmal gerechnet und gemerkt.
 *
 *  Gelesen wird das ATTRIBUT `d` des Zahnfleischbandes, nicht die gerenderte
 *  Geometrie: eine CSS-Verschiebung an den Ebenen wuerde eine Messung am Bild
 *  in sich selbst zurueckfuehren. Der koronale Rand des Bandes ist sein
 *  groesstes y (die Papille), die Kauebene liegt `OCCL_MARGIN` ueber dem
 *  unteren viewBox-Rand - das ist die eine Zahl, die alle Vorlagen teilen, und
 *  `verify.py` besteht darauf. */
const OCCL_MARGIN_UNITS = 8;
const kronenhoehe = new Map<string, number>();
function sichtbareKrone(svg: Element): number | null {
  const tpl = svg.getAttribute("data-tooth-template") ?? "";
  const gemerkt = kronenhoehe.get(tpl);
  if(gemerkt !== undefined) return gemerkt;
  const vb = (svg.getAttribute("viewBox") || "").trim().split(/\s+/).map(Number);
  const band = svg.querySelector('[id="gum-base"]')?.getAttribute("d");
  if(vb.length !== 4 || vb.some((n) => !Number.isFinite(n)) || !band) return null;
  let yPap = -Infinity;
  for(const paar of band.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)){
    const y = Number(paar[2]);
    if(Number.isFinite(y) && y > yPap) yPap = y;
  }
  if(!Number.isFinite(yPap)) return null;
  const hoehe = (vb[1] + vb[3] - OCCL_MARGIN_UNITS) - yPap;
  if(tpl) kronenhoehe.set(tpl, hoehe);
  return hoehe;
}

/** Wie weit eine Stufe den Zahn zurueckstellt, als ANTEIL der sichtbaren Krone.
 *
 *  Ein Anteil und keine Strecke, weil Dirks Einteilung am sichtbaren
 *  Kronenanteil misst - und weil die Kronen zwischen 16 Einheiten (unterer
 *  Milchschneidezahn) und 28,6 (Eckzahn) streuen. Gemessen mit einer festen
 *  Strecke von 20 Einheiten war an 14 nichts mehr zu sehen und an 13 mehr als
 *  die Haelfte; an einem Milchzahn waere er ganz verschwunden. Im
 *  Wechselgebiss - dem einzigen Ort, an dem diese Achse gebraucht wird - stehen
 *  beide nebeneinander. */
const ERUPTION_ANTEIL: Record<string, number> = {
  "emerging": 0.92,     // nur die Spitze steht heraus
  "half-crown": 0.5,
  "full-crown": 0.12,   // Krone frei, aber sichtbar kuerzer als die Reihe
};

function syncEruptionMark(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const stufe = (st?.eruptionStage as string) ?? "none";
  const zeigen = stufe !== "none" && eruptionAllowed(st ?? defaultState());
  for(const tile of tiles){
    if(zeigen && tile.classList.contains("side-view")){
      tile.dataset.eruption = stufe;
      const svg = tile.querySelector("svg");
      const krone = svg ? sichtbareKrone(svg) : null;
      const anteil = ERUPTION_ANTEIL[stufe] ?? 0;
      if(krone !== null && krone > 0){
        tile.style.setProperty("--erupt-shift", `${(krone * anteil).toFixed(2)}px`);
      }else{
        tile.style.removeProperty("--erupt-shift");
      }
    }else{
      delete tile.dataset.eruption;
      tile.style.removeProperty("--erupt-shift");
    }
  }
}

/** Bead odontogram-gry: den Papillenverlust an die Kachel schreiben, als
 *  LINKS/RECHTS statt mesial/distal. Gezeichnet wird er in der Auflage
 *  (`gumOverlay.ts`) - dieselbe Aufgabenteilung wie bei der Bruchlinie, und
 *  aus demselben Grund: eine Seitenansicht kennt keine Himmelsrichtungen.
 *
 *  Beide Nachbarn schreiben ihre Haelfte derselben Papille an ihre eigene
 *  Kachel. Die Auflage zeichnet an einem Gelenk daher unter Umstaenden zwei
 *  Dreiecke uebereinander - und wenn die beiden verschieden beurteilt sind,
 *  gewinnt das groessere, weil der Verlust der Papille die schlechtere der
 *  beiden Beobachtungen ist. */
function syncPapillaMark(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const graded = papillaLossAllowed(toothNo) ? getToothPapillaLoss(toothNo) : {};
  const links = mesialIsLeft(toothNo) ? graded.mesial : graded.distal;
  const rechts = mesialIsLeft(toothNo) ? graded.distal : graded.mesial;
  for(const tile of tiles){
    const zeigen = tile.classList.contains("side-view");
    if(zeigen && links) tile.dataset.papillaLeft = String(links);
    else delete tile.dataset.papillaLeft;
    if(zeigen && rechts) tile.dataset.papillaRight = String(rechts);
    else delete tile.dataset.papillaRight;
  }
}

function syncHemisectionClip(toothNo: number): void {
  const tiles = toothTile.get(toothNo);
  if(!tiles) return;
  const st = toothState.get(toothNo);
  const wert = st?.rootResection ?? "none";
  const wurzel = (st?.rootResectionRoot as string) ?? "";
  const nimmtWeg = (wert === "hemisection" || wert === "amputation") && !!wurzel;
  const seite = nimmtWeg ? rootSideOf(toothNo, wurzel) : "mitte";
  for(const tile of tiles){
    if(nimmtWeg && seite !== "mitte") tile.dataset.hemiSide = seite;
    else delete tile.dataset.hemiSide;
  }
}

function updateToothTileVisibility(){
  const hiddenSet = new Set([18,28,38,48]);
  for(const toothNo of ALL_TEETH){
    const tiles = toothTile.get(toothNo);
    if(!tiles) continue;
    const hide = !wisdomVisible && hiddenSet.has(toothNo);
    for(const tile of tiles){
      tile.classList.toggle("wisdom-hidden", hide);
      if(tile.hasAttribute("role")){
        tile.setAttribute("tabindex", hide || readOnly ? "-1" : "0");
        if(hide) tile.setAttribute("aria-hidden", "true");
        else tile.removeAttribute("aria-hidden");
      }
    }
  }
  selectedTeeth = new Set([...selectedTeeth].filter(tn => {
    const tiles = toothTile.get(tn);
    if(!tiles || tiles.length === 0) return true;
    return !tiles.every(tile => tile.classList.contains("wisdom-hidden"));
  }));
  if(activeTooth && !selectedTeeth.has(activeTooth)){
    activeTooth = selectedTeeth.values().next().value ?? null;
  }
  updateSelectionUI();
}

function setEdentulous(on: Any){
  if(on){
    // DS-1: turning on whole-mouth edentulous is a STRUCTURAL interactive edit
    // (not a reset), so route it through the batch gate — in plan mode every
    // changed tooth is marked plan-edited; in status mode (plan initialized)
    // every changed tooth NOT already plan-edited mirrors status->plan (planned
    // teeth diverge). Only teeth that ACTUALLY change (were not already sound-
    // missing) are passed to the gate, so an already-missing tooth's plan is
    // left untouched (per-tooth no-op signaling). Uninitialized plan stays a
    // pure passthrough (byte-identical to the pre-dual-state behavior).
    const missingKey = JSON.stringify(serializeState((()=>{ const s = defaultState(); s.toothSelection = "none"; return s; })()));
    const changed = ALL_TEETH.filter(tn => JSON.stringify(serializeState(toothState.get(tn) ?? defaultState())) !== missingKey);
    // DS-1 (review Fix 3): set the `edentulous` global + the toggle-button state
    // INSIDE the gated closure, NOT synchronously before it resolves. On the
    // deferred-confirm path they must take effect only on Accept — otherwise
    // Cancel (which never runs this closure) would leave `edentulous === true`
    // while every tooth is untouched, so getStatusChart().globals.edentulous
    // would export a wrong flag. `notifyStateChange()` also moves inside so the
    // whole-mouth refresh fires when the batch actually applies.
    gateToothEditBatch(changed, ()=>{
      edentulous = true;
      setToggleButton($("#btnEdentulous"), edentulous);
      suppressEdentulousSync = true;
      for(const toothNo of ALL_TEETH){
        const s = defaultState();
        s.toothSelection = "none";
        toothState.set(toothNo, s);
        applyStateToSvg(toothNo);
        updateToothTileNumber(toothNo);
      }
      suppressEdentulousSync = false;
      if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
      notifyStateChange();
    });
    return;
  }
  // Un-setting edentulous is not a per-tooth structural edit (it touches no tooth
  // state here), so it applies immediately and is never gated.
  edentulous = false;
  setToggleButton($("#btnEdentulous"), edentulous);
  notifyStateChange();
}

/** Toggle visibility of wisdom teeth (18, 28, 38, 48). */
function setWisdomVisible(on: Any){
  wisdomVisible = !!on;
  setToggleButton($("#btnWisdomVisible"), wisdomVisible);
  updateToothTileVisibility();
  // Wisdom teeth fade via opacity (no size change), so the ResizeObserver won't
  // fire — redraw the bridge overlay explicitly so a span onto a wisdom tooth stays current.
  updateBridgeOverlay();
  // The schematic view draws from state, not from the tiles: tell it.
  notifyStateChange();
}
/** Whether wisdom teeth (18/28/38/48) are shown — read by the schematic view,
 *  which hides them exactly like the anatomical grid does. */
export function getWisdomVisible(): boolean { return wisdomVisible; }

/** Toggle visibility of the bone/gum base layer on all teeth. */
function setShowBase(on: Any){
  showBase = on;
  setToggleButton($("#btnBoneVisible"), showBase);
  for(const toothNo of ALL_TEETH){
    applyStateToSvg(toothNo);
  }
}

/** Toggle visibility of occlusal-view tiles (premolars and molars). */
function setOcclusalVisible(on: Any){
  occlusalVisible = !!on;
  setToggleButton($("#btnOcclView"), occlusalVisible);
  $$(".tooth-tile.occl-view").forEach(tile => {
    tile.classList.toggle("occl-hidden", !occlusalVisible);
  });
  // Occlusal rows change grid height — redraw immediately instead of waiting for
  // the debounced ResizeObserver, so bridge bars don't sit at a stale Y.
  updateBridgeOverlay();
}

/** Toggle visibility of the healthy-pulp layer on all teeth. */
function setHealthyPulpVisible(on: Any){
  showHealthyPulp = !!on;
  setToggleButton($("#btnPulpVisible"), showHealthyPulp);
  for(const toothNo of ALL_TEETH){
    applyStateToSvg(toothNo);
  }
}

function serializeState(s: Any){
  return {
    toothSelection: s.toothSelection,
    pulpDx: s.pulpDx,
    // SP4 Task 5: pulpLatin (practical-Latin subtype) and apicalDx (apical AAE
    // diagnosis) are now authorable in the diagnosis UI, so they join the
    // serialized payload — this is also what feeds the FHIR export (both are
    // already mapped in FIELD_MAPPINGS). Both round-trip via fromRaw below.
    pulpLatin: s.pulpLatin,
    apicalDx: s.apicalDx,
    endoResection: !!s.endoResection,
    resorptionType: s.resorptionType,
    // SP18: peri-implant status (mucositis / peri-implantitis staging) was
    // authored, rendered, and read back by hydrateState, but omitted here —
    // an SP8 omission that silently dropped it on export/import. Fixed by
    // adding it alongside the other enum-axis fields.
    periImplant: s.periImplant,
    mods: Array.from(s.mods || []),
    periapicalType: s.periapicalType,
    endo: s.endo,
    caries: Array.from(s.caries || []),
    cariesActiveDepth: s.cariesActiveDepth,
    // SP6 Task 1: the unified per-surface severity replaces the SP5
    // `cariesDepths` + `secondaryCaries` pair. Serialized like `cariesDepths`
    // was (Record<surface,number>). Payload version bumped to 2.4.
    cariesSeverity: Object.fromEntries(s.cariesSeverity || new Map()),
    fillingMaterial: s.fillingMaterial,
    fillingSurfaces: Array.from(s.fillingSurfaces || []),
    fillingSurfaceMaterials: Object.fromEntries(s.fillingSurfaceMaterials || new Map()),
    fissureSealing: !!s.fissureSealing,
    calculus: !!s.calculus,
    contactMesial: !!s.contactMesial,
    contactDistal: !!s.contactDistal,
    wearEdge: s.wearEdge,
    wearCervical: s.wearCervical,
    discoloration: s.discoloration,
    orthoAppliance: s.orthoAppliance,
    orthoDrift: s.orthoDrift,
    orthoVertical: s.orthoVertical,
    orthoRotation: !!s.orthoRotation,
    orthoBracketSide: s.orthoBracketSide,
    brokenMesial: !!s.brokenMesial,
    brokenIncisal: !!s.brokenIncisal,
    brokenDistal: !!s.brokenDistal,
    extractionWound: !!s.extractionWound,
    extractionPlan: !!s.extractionPlan,
    parapulpalPin: !!s.parapulpalPin,
    crownReplace: !!s.crownReplace,
    crownNeeded: !!s.crownNeeded,
    missingClosed: !!s.missingClosed,
    bridgePillar: !!s.bridgePillar,
    // Bead odontogram-5rv: nur wenn gesetzt, damit eine Karte ohne
    // Schwebebruecke byte-gleich bleibt bis auf die Version.
    ...(s.cantilever ? { cantilever: true } : {}),
    ...(s.splinted ? { splinted: true } : {}),
    ...(s.apicalRoot ? { apicalRoot: s.apicalRoot } : {}),
    ...(s.orthoProgressive ? { orthoProgressive: true } : {}),
    ...(s.occlusalSplint ? { occlusalSplint: true } : {}),
    ...(s.occlusalFunction && s.occlusalFunction !== "none" ? { occlusalFunction: s.occlusalFunction } : {}),
    ...(s.rootCap ? { rootCap: true } : {}),
    ...(Array.isArray(s.onlayCoverage) && s.onlayCoverage.length ? { onlayCoverage: [...s.onlayCoverage] } : {}),
    ...(Array.isArray(s.inlayCoverage) && s.inlayCoverage.length ? { inlayCoverage: [...s.inlayCoverage] } : {}),
    ...(Array.isArray(s.veneerCoverage) && s.veneerCoverage.length ? { veneerCoverage: [...s.veneerCoverage] } : {}),
    prosthesis: s.prosthesis,
    mobility: s.mobility,
    toothSubstrate: s.toothSubstrate,
    restorationType: s.restorationType,
    restorationMaterial: s.restorationMaterial,
    crownLeakage: !!s.crownLeakage,
    rootCaries: s.rootCaries,
    radiographicDepth: Object.fromEntries(s.radiographicDepth || new Map()),
    fillingDefect: Object.fromEntries(s.fillingDefect || new Map()),
    // Bead odontogram-wxt: omitted ENTIRELY when no surface carries the marker,
    // the same omit-when-empty convention as perio/furcation/plaque below — a
    // chart that never records cervical involvement stays byte-identical apart
    // from the version field (payload 2.24).
    ...((s.cervicalSurfaces?.size ?? 0) > 0 ? { cervicalSurfaces: Array.from(s.cervicalSurfaces) } : {}),
    // Bead odontogram-d1b: omit-when-empty (payload 2.48), like the line above.
    ...((s.cervicalSideUnknown?.size ?? 0) > 0 ? { cervicalSideUnknown: CERVICAL_UNKNOWN_KINDS.filter((k) => s.cervicalSideUnknown.has(k)) } : {}),
    // SP-perio P1 Task 1: omitted ENTIRELY when no site is charted (mirrors
    // the customStates/note pattern below) — a no-perio tooth/payload stays
    // byte-identical to its pre-perio serialization.
    ...((s.perio?.pd?.size ?? 0) > 0 ? { perio: {
      pd: Object.fromEntries(s.perio.pd),
      gm: Object.fromEntries(s.perio.gm),
      bop: Array.from(s.perio.bop),
      sup: Array.from(s.perio.sup),
    } } : {}),
    // SP-perio P2b Task 2: omitted ENTIRELY when no entrance is graded, same
    // convention as `perio` above — a no-furcation tooth/payload stays
    // byte-identical to its pre-furcation serialization.
    ...((s.furcation?.size ?? 0) > 0 ? { furcation: Object.fromEntries(s.furcation) } : {}),
    // SP-perio P2b Task 3: omitted ENTIRELY when no surface has plaque, same
    // convention as `perio`/`furcation` above (additive) — a no-plaque
    // tooth/payload stays byte-identical apart from the version field.
    ...((s.plaque?.size ?? 0) > 0 ? { plaque: Array.from(s.plaque) } : {}),
    // Bead odontogram-gry: omit-when-empty wie `furcation` darueber - ein
    // Zahn ohne beurteilte Papille bleibt byte-gleich bis auf die Version.
    ...((s.papillaLoss?.size ?? 0) > 0 ? { papillaLoss: Object.fromEntries(s.papillaLoss) } : {}),
    // SP-perio PG-D Task 1: pi/gi are emitted ONLY when at least one surface
    // is graded, same omit-when-empty convention as perio/furcation/plaque
    // above — a tooth never touched by PI/GI stays byte-identical apart from
    // the version bump (payload 2.15).
    ...((s.pi?.size ?? 0) > 0 ? { pi: Object.fromEntries(s.pi) } : {}),
    ...((s.gi?.size ?? 0) > 0 ? { gi: Object.fromEntries(s.gi) } : {}),
    ...((s.mpi?.size ?? 0) > 0 ? { mpi: Object.fromEntries(s.mpi) } : {}),
    ...((s.mbi?.size ?? 0) > 0 ? { mbi: Object.fromEntries(s.mbi) } : {}),
    // SP-perio PG-D Task 2: keratinized gingiva width — omitted ENTIRELY when
    // not charted (null), same omit-when-empty convention as pi/gi above — a
    // tooth never touched by KG stays byte-identical (payload stays 2.15,
    // Task 1 already bumped it).
    ...(s.kg != null ? { kg: s.kg } : {}),
    // odontogram-im1: omitted ENTIRELY when nothing is known about the
    // product, same omit-when-empty convention as perio/furcation/kg above
    // - a chart that never names an implant stays byte-identical apart
    // from the version field.
    ...(!isEmptyImplantProduct(s.implantProduct) ? { implantProduct: s.implantProduct } : {}),
    ...(!isEmptyRestorationProduct(s.restorationProduct) ? { restorationProduct: s.restorationProduct } : {}),
    ...(s.fillingProducts?.size ? { fillingProducts: Object.fromEntries(s.fillingProducts) } : {}),
    // SP-perio PG-C Task 2: cejVisibility/rootConcavity are emitted ONLY when set
    // (!== "none"), like the omit-when-empty perio fields above — a default tooth
    // stays byte-identical (payload bumped to 2.14). Both round-trip via
    // validateEnum in hydrateState (default "none").
    // Bead odontogram-dma: omit-when-none, so a chart with no removable work
    // stays byte-identical apart from the version field.
    ...(s.retention && s.retention !== "none" ? { retention: s.retention } : {}),
    ...(s.retentionSide && s.retentionSide !== "none" ? { retentionSide: s.retentionSide } : {}),
    // Implantatposition: omit-when-"center", so a chart with no repositioned
    // implant stays byte-identical apart from the version field.
    ...(s.implantPosition && s.implantPosition !== "center" ? { implantPosition: s.implantPosition } : {}),
    ...(s.crownFractureType && s.crownFractureType !== "none" ? { crownFractureType: s.crownFractureType } : {}),
    ...(s.crownMarginType && s.crownMarginType !== "none" ? { crownMarginType: s.crownMarginType } : {}),
    ...(s.crownMarginSide ? { crownMarginSide: s.crownMarginSide } : {}),
    // Endo pro Kanal: omit-when-empty (a chart with no per-canal detail stays
    // byte-identical apart from the version field).
    ...(s.endoCanals && Object.keys(s.endoCanals).length ? { endoCanals: s.endoCanals } : {}),
    ...(s.rootPostType && s.rootPostType !== "none" ? { rootPostType: s.rootPostType } : {}),
    // Bead odontogram-0n8: omit-when-none - eine Karte ohne Wechselgebiss
    // bleibt byte-gleich bis auf die Version.
    ...(s.eruptionStage && s.eruptionStage !== "none" ? { eruptionStage: s.eruptionStage } : {}),
    ...(s.rootFracture && s.rootFracture !== "none" ? { rootFracture: s.rootFracture } : {}),
    ...(s.rootFractureRoot ? { rootFractureRoot: s.rootFractureRoot } : {}),
    ...(s.rootResection && s.rootResection !== "none" ? { rootResection: s.rootResection } : {}),
    ...(s.rootResectionRoot ? { rootResectionRoot: s.rootResectionRoot } : {}),
    ...(s.sensibility && s.sensibility !== "none" ? { sensibility: s.sensibility } : {}),
    ...(s.percussion && s.percussion !== "none" ? { percussion: s.percussion } : {}),
    ...(s.cejVisibility && s.cejVisibility !== "none" ? { cejVisibility: s.cejVisibility } : {}),
    ...(s.rootConcavity && s.rootConcavity !== "none" ? { rootConcavity: s.rootConcavity } : {}),
    // SP-perio PG-D Task 3: gingivalThickness/millerClass are emitted ONLY
    // when set (!== their skip value), like cejVisibility/rootConcavity above
    // — a default tooth stays byte-identical (payload stays 2.15). Both
    // round-trip via validateEnum in hydrateState.
    ...(s.gingivalThickness && s.gingivalThickness !== "unknown" ? { gingivalThickness: s.gingivalThickness } : {}),
    ...(s.millerClass && s.millerClass !== "none" ? { millerClass: s.millerClass } : {}),
    // Bead odontogram-2vd: explicit assessment status per axis/measurement
    // point. "Not assessed" is the default and is never stored, so an ordinary
    // chart emits no `assessment` key at all and stays byte-identical.
    ...((s.assessment?.size ?? 0) > 0 ? { assessment: Object.fromEntries(s.assessment) } : {}),
    ...(Object.keys(s.customStates || {}).length > 0 ? { customStates: s.customStates } : {}),
    ...(s.note ? { note: s.note } : {}),
  };
}

// Allowed values for imported state fields
export const VALID_TOOTH_SELECTION = validValues("toothSelection");
export const VALID_ENDO = validValues("endo");
export const VALID_ROOT_POST_TYPE = validValues("rootPostType");
export const VALID_FILLING_MATERIAL = validValues("fillingMaterial");
export const VALID_PROSTHESIS = validValues("prosthesis");
export const VALID_MOBILITY = validValues("mobility");
export const VALID_TOOTH_SUBSTRATE = validValues("toothSubstrate");
export const VALID_RESTORATION_TYPE = validValues("restorationType");
export const VALID_RESTORATION_MATERIAL = validValues("restorationMaterial");
export const VALID_MODS = validValues("mods");
export const VALID_PERIAPICAL_TYPE = validValues("periapicalType");
export const VALID_CARIES = validValues("caries");
// SP4 Task 1: pulp/apical/resorption diagnosis axes (additive; unused until
// later SP4 tasks wire up render/migration/validate).
export const VALID_PULP_DX = validValues("pulpDx");
export const VALID_PULP_LATIN = validValues("pulpLatin");
export const VALID_APICAL_DX = validValues("apicalDx");
export const VALID_RESORPTION_TYPE = validValues("resorptionType");
export const VALID_WEAR_EDGE = validValues("wearEdge");
export const VALID_WEAR_CERVICAL = validValues("wearCervical");
export const VALID_DISCOLORATION = validValues("discoloration");
// SP14 Task 1: orthodontic axes foundation (additive; see registry/axes.ts).
export const VALID_ORTHO_APPLIANCE = validValues("orthoAppliance");
export const VALID_ORTHO_BRACKET_SIDE = validValues("orthoBracketSide");
export const VALID_ORTHO_DRIFT = validValues("orthoDrift");
export const VALID_ORTHO_VERTICAL = validValues("orthoVertical");
const VALID_CARIES_DEPTH = new Set(["surface","dentin","deep"]);
export const VALID_FILLING_SURFACES = validSurfaces();
// SP5/SP6: caries fields. `rootCaries` is a registered axis, so it reads from
// AXES like every other enum. `cariesSeverity` (unified 0..6 visual severity)
// and `radiographicDepth` are per-surface scalar-map fields with no axis of
// their own, so their valid sets are literal here. `VALID_CARS` is retained for
// reading the retired SP5 `secondaryCaries` map off legacy raw payloads during
// migration (see hydrateState).
export const VALID_ROOT_CARIES = validValues("rootCaries");
// SP8 Task 1: peri-implantitis foundation (registry axis; unused until later
// SP8 tasks wire up render/migration/UI).
export const VALID_PERI_IMPLANT = validValues("periImplant");
// SP-perio PG-C Task 2: the two new categorical data axes (registry axes; read
// from AXES like every other enum).
export const VALID_RETENTION = validValues("retention");
export const VALID_RETENTION_SIDE = validValues("retentionSide");
export const VALID_ERUPTION_STAGE = validValues("eruptionStage");   // Bead odontogram-0n8
export const VALID_ROOT_FRACTURE = validValues("rootFracture");
export const VALID_ROOT_RESECTION = validValues("rootResection");
export const VALID_SENSIBILITY = validValues("sensibility");
export const VALID_PERCUSSION = validValues("percussion");
export const VALID_CEJ_VISIBILITY = validValues("cejVisibility");
export const VALID_ROOT_CONCAVITY = validValues("rootConcavity");
// SP-perio PG-D Task 3: the two new categorical data axes (registry axes; read
// from AXES like every other enum).
export const VALID_GINGIVAL_THICKNESS = validValues("gingivalThickness");
export const VALID_MILLER_CLASS = validValues("millerClass");
export const VALID_CARS = new Set([0, 1, 2, 3, 4, 5, 6]);
export const VALID_CARIES_SEVERITY = new Set([0, 1, 2, 3, 4, 5, 6]);
export const VALID_RADIOGRAPHIC_DEPTH = new Set(["none", "E1", "E2", "D1", "D2", "D3"]);
export const VALID_FILLING_DEFECT = new Set(["none", "marginal", "fracture", "wear"]);
export const VALID_FILLING_DEFECT_SET = new Set(["marginal", "fracture", "wear"]); // non-none, valid stored values
/** Bead odontogram-wxt: the surfaces on which cervical involvement is a
 *  meaningful statement. The cervix is NOT a surface of its own — it is a
 *  MARKER on the vestibular or oral surface (BEMA writes it as the suffix
 *  "z"/"7": "vz"/"47", "lz"/"57"). Modelling it as a sixth surface would
 *  inflate the surface count and so the position tier, which is exactly the
 *  error this set exists to prevent. Occlusal is absent because an occlusal
 *  cavity cannot reach the neck. MESIAL and DISTAL joined on 03.10.2026
 *  (bead odontogram-d1b): charly's treatment record names `mz`/`dz` per side,
 *  134 of 621 cervical fillings on the production clone sit there, and the
 *  decoder used to reject the whole bundle for one. */
export const VALID_CERVICAL_SURFACES = new Set(["buccal", "lingual", "mesial", "distal"]);
/** Bead odontogram-d1b: what a "cervical, side not documented" finding can be
 *  — in this order everywhere it is listed. */
export const CERVICAL_UNKNOWN_KINDS = ["filling", "caries"] as const;
const VALID_CERVICAL_UNKNOWN = new Set<string>(CERVICAL_UNKNOWN_KINDS);
// SP-perio P2b Task 2: the union of every entrance value furcationEntrances()
// can ever return, across all tooth positions — used by hydrateState to
// validate a raw payload's `furcation` keys generically (hydrateState has no
// tooth-position context to call furcationEntrances(toothNo) itself, exactly
// like VALID_FILLING_SURFACES/VALID_RADIOGRAPHIC_DEPTH above are validated
// against a tooth-independent set, not a per-tooth one). setFurcation(), by
// contrast, DOES know the tooth and validates against the exact per-tooth set.
export const VALID_FURCATION_ENTRANCE = new Set(["mesial", "distal", "buccal", "lingual"]);
export const VALID_FURCATION_GRADE = new Set([1, 2, 3, 4]); // Glickman I-IV
// SP-perio P2b Task 3: the 4 fixed O'Leary plaque-index surfaces — the SAME
// set for every tooth (unlike VALID_FURCATION_ENTRANCE, which is filtered
// per-tooth-position by furcationEntrances()), so both setPlaque() and
// hydrateState() validate directly against this one constant.
export const VALID_PLAQUE_SURFACE = new Set(["mesial", "distal", "buccal", "lingual"]);

// Bead odontogram-gry: the two interdental spaces a tooth borders, and the
// three Nordland & Tarnow classes of papilla loss.
//
// Tooth-INDEPENDENT, for hydration, exactly like VALID_FURCATION_ENTRANCE
// above: papillaSites(toothNo) knows the tooth and drops the distal papilla of
// the last tooth in the arch, hydrateState does not.
export const VALID_PAPILLA_SITE = new Set(["mesial", "distal"]);
export const VALID_PAPILLA_LOSS = new Set([1, 2, 3]); // Nordland & Tarnow I-III

function filterSet(arr: Any, allowed: Set<string>): Set<string>{
  if(!Array.isArray(arr)) return new Set();
  return new Set(arr.filter((v: Any) => typeof v === "string" && allowed.has(v)));
}

function validateEnum(value: Any, allowed: Set<string>, fallback: string): string{
  return typeof value === "string" && allowed.has(value) ? value : fallback;
}

// SP-perio P1 Task 1: clinical ranges for the two perio scalar fields.
type PerioField = "pd" | "gm";
const PERIO_RANGES: Record<PerioField, [number, number]> = { pd: [1, 15], gm: [-10, 20] };

/**
 * Validate + clamp a perio `pd`/`gm` value. Returns the clamped integer
 * within the field's clinical range, or `null` for a value the field can't
 * represent at all: a non-integer/non-finite `v` (reject signal — the caller
 * must leave state untouched), or — for `pd` specifically — a value below the
 * minimum (0, negative), which doubles as the "un-chart this site" signal
 * `setPerioSite`/`hydrateState` rely on (a probing depth of 0 isn't a
 * clinical reading, it's "not probed"). `gm` has no such floor signal: it
 * clamps to its minimum like its maximum, since a coronal/pseudopocket
 * reading past -10mm is still a valid (if extreme) reading, not an absence.
 * Shared verbatim by setPerioSite (live edits) and hydrateState (payload
 * import), so both paths enforce identical bounds.
 */
function clampPerio(field: PerioField, v: unknown): number | null {
  if(typeof v !== "number" || !Number.isFinite(v) || !Number.isInteger(v)) return null;
  const [min, max] = PERIO_RANGES[field];
  if(field === "pd" && v < min) return null;
  return Math.min(max, Math.max(min, v));
}

/**
 * SP5 final review (FIX 1): is a payload version older than 2.3?
 *
 * Payloads before 2.3 never stored an explicit per-surface `secondaryCaries`
 * CARS score — recurrent/secondary caries was DERIVED at render/summary time
 * from `caries ∩ fillingSurfaceMaterials`. So for a legacy payload we must
 * re-infer that intersection into an explicit score 3 on hydrate. A native 2.3+
 * payload, by contrast, stores the score deliberately: a caried surface with a
 * filling and NO recurrent score means the clinician left it primary, and we
 * must NOT flip it to recurrent on export→reimport.
 *
 * A missing/blank/non-string version is treated as legacy (pre-versioned or
 * pre-2.3 payloads had no version tag). Comparison is dotted-numeric so 1.4 <
 * 2.2 < 2.3 < 2.10 order correctly (not string-lexicographic).
 */
function isLegacyPayloadVersion(version: unknown): boolean {
  if(typeof version !== "string" || version.trim() === "") return true;
  const parse = (v: string) => v.split(".").map((p) => { const n = parseInt(p, 10); return Number.isFinite(n) ? n : 0; });
  const a = parse(version);
  const b = [2, 3, 0]; // threshold: 2.3.0
  for(let i = 0; i < Math.max(a.length, b.length); i++){
    const x = a[i] ?? 0, y = b[i] ?? 0;
    if(x !== y) return x < y;
  }
  return false; // exactly 2.3.0 → not legacy
}

/**
 * @param inferLegacySecondaryCaries When true (the DEFAULT — preserves every
 *   internal seam/preset/version-less caller and the existing SVG goldens), a
 *   surface present in BOTH `caries` and `fillingSurfaceMaterials` with no
 *   stored severity is given the canonical recurrent `cariesSeverity` value 3
 *   (SP6 Task 1: the surface is recurrent regardless — this only fixes its CARS
 *   opacity). The JSON/FHIR import path passes `false` for native ≥2.3 payloads
 *   so a caried+filled surface with no stored value keeps the render default.
 */
function hydrateState(raw: Any, inferLegacySecondaryCaries = true){
  const s = defaultState();
  if(!raw || typeof raw !== "object") return s;
  // Legacy migration (payload < 2.0): the flat `crownMaterial` enum and the
  // FIXED `bridgeUnit` values split into `toothSubstrate` +
  // `restorationType`×`restorationMaterial`. Detected by the absence of the new
  // `restorationType` field (mirrors the fillingSurfaceMaterials v1.3 fallback).
  // Unknown/absent values fall through to defaults; never throws.
  const legacyFixedBridge = raw.bridgeUnit === "zircon" || raw.bridgeUnit === "metal" || raw.bridgeUnit === "temporary";
  if(raw.restorationType === undefined && (raw.crownMaterial !== undefined || legacyFixedBridge)){
    const cm = typeof raw.crownMaterial === "string" ? raw.crownMaterial : "natural";
    if(cm === "natural" || cm === "radix" || cm === "broken" || cm === "crownprep"){
      raw.toothSubstrate = cm;
      raw.restorationType = "none";
      raw.restorationMaterial = "none";
      raw.crownMaterial = "natural";
    }else if(cm === "metal"){
      // Legacy "metal" crown = PFM → metal-ceramic (deliberate rename).
      raw.toothSubstrate = "crownprep";
      raw.restorationType = "crown";
      raw.restorationMaterial = "metal-ceramic";
      raw.crownMaterial = "natural";
    }else if(["emax","zircon","temporary","telescope","gold","gradia"].includes(cm)){
      raw.toothSubstrate = "crownprep";
      raw.restorationType = "crown";
      raw.restorationMaterial = cm;
      raw.crownMaterial = "natural";
    }else{
      // Implant attachments (healing-abutment/locator/bar…): preserved in
      // `crownMaterial` for the interim render path (absorbed by SP3b).
      raw.restorationType = "none";
      raw.restorationMaterial = "none";
    }
    // Fixed bridge values fold into restorationType:bridge × material; removable/
    // bar values stay on `bridgeUnit` (legacy path, retained through SP3a).
    if(raw.bridgeUnit === "zircon" || raw.bridgeUnit === "metal" || raw.bridgeUnit === "temporary"){
      raw.restorationType = "bridge";
      raw.restorationMaterial = raw.bridgeUnit === "metal" ? "metal-ceramic" : raw.bridgeUnit;
      raw.bridgeUnit = "none";
    }
  }
  // SP3b FIX 1: a v1.14.0 (payload 2.0) implant FIXED crown was serialized by the
  // SP3a interim defer as {toothSelection:"implant", restorationType:"none",
  // restorationMaterial:"none", crownMaterial:<fixed material>}. The legacy block
  // above is gated on restorationType===undefined so it skips this (restorationType
  // is "none", not absent), and the prosthesis-migration below only maps ATTACHMENT
  // crownMaterial values — so the crown would silently vanish. Fold a fixed-crown
  // crownMaterial on an implant (restorationType absent OR "none") into
  // restorationType:"crown" × material, mirroring the 1.4 fold + metal→metal-ceramic
  // rename. Attachment crownMaterial values (healing-abutment/locator/bar…) are not
  // in this set, so they fall through to the prosthesis migration untouched.
  const FIXED_CROWN_MATERIALS = ["emax", "zircon", "gold", "gradia", "metal", "telescope", "temporary"];
  if(raw.toothSelection === "implant"
     && (raw.restorationType === undefined || raw.restorationType === "none")
     && typeof raw.crownMaterial === "string"
     && FIXED_CROWN_MATERIALS.includes(raw.crownMaterial)){
    raw.restorationType = "crown";
    raw.restorationMaterial = raw.crownMaterial === "metal" ? "metal-ceramic" : raw.crownMaterial;
    raw.crownMaterial = "natural";
  }
  // SP3b field-move: migrate the legacy implant-attachment (`crownMaterial` on an
  // implant tooth) and removable/bar-denture (`bridgeUnit` on a gap tooth) values
  // onto the new `prosthesis` axis when no explicit `prosthesis` was supplied —
  // whether this payload is old-format (migrated above) or was written by the
  // interim SP3a/SP3b-foundation engine (restorationType already defined, but
  // `prosthesis` never serialized before this task). Gated by the SAME context
  // the legacy render branches required (isImplant / isNone): an attachment value
  // sitting on an unrelated toothSelection (only reachable via crafted/imported
  // payloads, never the UI) must not gain a `prosthesis` value it never rendered.
  if(raw.prosthesis === undefined){
    const CROWN_MATERIAL_TO_PROSTHESIS: Record<string, string> = {
      "healing-abutment": "healing-abutment",
      "locator": "locator",
      "locator-prosthesis": "locator-denture",
      "bar": "bar",
      "bar-prosthesis": "bar-denture",
    };
    const BRIDGE_UNIT_TO_PROSTHESIS: Record<string, string> = {
      "removable": "removable-partial",
      "bar": "bar",
      "bar-prosthesis": "bar-denture",
    };
    if(raw.toothSelection === "implant" && typeof raw.crownMaterial === "string" && CROWN_MATERIAL_TO_PROSTHESIS[raw.crownMaterial]){
      raw.prosthesis = CROWN_MATERIAL_TO_PROSTHESIS[raw.crownMaterial];
    }else if(raw.toothSelection === "none" && typeof raw.bridgeUnit === "string" && BRIDGE_UNIT_TO_PROSTHESIS[raw.bridgeUnit]){
      raw.prosthesis = BRIDGE_UNIT_TO_PROSTHESIS[raw.bridgeUnit];
    }
  }
  s.toothSelection = validateEnum(raw.toothSelection, VALID_TOOTH_SELECTION, s.toothSelection);
  // SP4 Task 3: pulpInflam (boolean) retired in favor of pulpDx (enum).
  // Legacy true -> "irreversible-pulpitis" (the only condition state the
  // old boolean could represent); false/absent -> "normal". A modern
  // payload's own pulpDx (if present and valid) wins over the migrated
  // legacy value.
  const migratedPulpDx = raw.pulpInflam ? "irreversible-pulpitis" : "normal";
  s.pulpDx = validateEnum(raw.pulpDx, VALID_PULP_DX, migratedPulpDx);
  // SP4 Task 5: pulpLatin (practical-Latin subtype) round-trips independently of
  // the pulp-detail level. It has no legacy predecessor, so absent/invalid -> "none".
  s.pulpLatin = validateEnum(raw.pulpLatin, VALID_PULP_LATIN, "none");
  s.endoResection = !!raw.endoResection;
  // SP4 Task 2: rootResorption (boolean) retired in favor of resorptionType
  // (enum). Legacy true -> "external-cervical" (the only subtype the old
  // boolean could represent); false/absent -> "none". A modern payload's own
  // resorptionType (if present and valid) wins over the migrated legacy value.
  const migratedResorptionType = raw.rootResorption ? "external-cervical" : "none";
  s.resorptionType = validateEnum(raw.resorptionType, VALID_RESORPTION_TYPE, migratedResorptionType);
  s.mods = filterSet(raw.mods, VALID_MODS);
  s.periapicalType = validateEnum(raw.periapicalType, VALID_PERIAPICAL_TYPE, "none");
  // SP4 Task 4: `apicalDx` (enum) drives the periapical glyph on a PRESENT
  // tooth, decoupled from `mods.inflammation`. Derive it from the legacy
  // pairing of mods.inflammation + periapicalType: on a present tooth, a set
  // `inflammation` mod meant an apical lesion — the "abscess" subtype maps to
  // acute-apical-abscess, every other subtype (granuloma / cyst / unset) to
  // asymptomatic-apical-periodontitis. The `inflammation` mod is then REMOVED
  // from a present tooth's mods (the lesion is fully represented by apicalDx;
  // keeping it would double-encode and re-fire the retired render path). On a
  // NON-present tooth (missing / implant) `inflammation` keeps its SECOND role
  // — periodontal inflammation — so it is LEFT untouched and apicalDx stays
  // "normal". periapicalType is preserved as the histological lesion subtype.
  // A modern payload's own apicalDx (if present and valid) wins over the derived value.
  let migratedApicalDx = "normal";
  if(s.mods.has("inflammation") && isToothPresent(s.toothSelection)){
    migratedApicalDx = s.periapicalType === "abscess" ? "acute-apical-abscess" : "asymptomatic-apical-periodontitis";
    s.mods.delete("inflammation");
  }
  s.apicalDx = validateEnum(raw.apicalDx, VALID_APICAL_DX, migratedApicalDx);
  // SP7: enforce the lesion-subtype invariant on read. On a PRESENT tooth the
  // granuloma/cyst subtype (including the legacy `abscess` subtype) is valid
  // only under symptomatic/asymptomatic apical periodontitis; otherwise it is
  // cleared to "none". Non-present teeth are left untouched (their stored
  // subtype still feeds the unchanged non-present render path). Never throws.
  if(isToothPresent(s.toothSelection)){
    if(s.apicalDx !== "symptomatic-apical-periodontitis"
        && s.apicalDx !== "asymptomatic-apical-periodontitis"){
      s.periapicalType = "none";
    }
  }
  s.endo = validateEnum(raw.endo, VALID_ENDO, s.endo);
  s.rootPostType = validateEnum(raw.rootPostType, VALID_ROOT_POST_TYPE, "none");
  if(s.endo === "endo-glass-pin" || s.endo === "endo-metal-pin"){
    if(s.rootPostType === "none") s.rootPostType = s.endo === "endo-glass-pin" ? "glass-fiber" : "metal";
    s.endo = "endo-filling";
  }
  // SP7: enforce the endo/pulp mutual-exclusion invariant on read. A tooth with
  // any endodontic treatment (endo !== "none") has no vital pulp, so it cannot
  // carry a pulpitis/necrosis diagnosis. Normalize to "normal" (also clears any
  // Latin subtype). Runs unconditionally — a conformant payload never violates
  // this, so it is a no-op except on contradictory legacy/hand-edited data.
  // NOTE: placed here (after s.endo is assigned from `raw`, not immediately
  // after the s.pulpDx assignment above) because s.endo is not populated from
  // `raw.endo` until this line — checking it any earlier would only ever see
  // defaultState()'s "none" placeholder and never normalize a real payload.
  if(s.endo && s.endo !== "none" && (s.pulpDx !== "normal" || s.pulpLatin !== "none")){
    s.pulpDx = "normal";
    s.pulpLatin = "none";
  }
  s.caries = filterSet(raw.caries, VALID_CARIES);
  const toIcdas = (v: Any): number | null => {
    if(typeof v === "number" && VALID_ICDAS.has(v)) return v;
    if(typeof v === "string"){
      if(v === "surface" || v === "dentin" || v === "deep") return threeLevelToIcdas(v);
      const n = Number(v); if(VALID_ICDAS.has(n)) return n;
    }
    return null;
  };
  s.cariesActiveDepth = toIcdas(raw.cariesActiveDepth) ?? 2;
  // SP6 Task 1 migration inputs. The unified `cariesSeverity` is built AFTER
  // `fillingSurfaceMaterials` (below), merging three raw sources per surface:
  //   - `raw.cariesSeverity` (native 2.4 unified field) — always wins,
  //   - `raw.cariesDepths`   (retired SP5 ICDAS map)    — primary fallback,
  //   - `raw.secondaryCaries` (retired SP5 CARS map)    — recurrent fallback.
  // These are parsed into locals here; only `cariesSeverity` survives on state.
  const rawSeverity = new Map<string, number>();
  if(raw.cariesSeverity && typeof raw.cariesSeverity === "object"){
    for(const [surf, val] of Object.entries(raw.cariesSeverity)){
      const num = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
      if(VALID_FILLING_SURFACES.has(surf) && VALID_CARIES_SEVERITY.has(num)) rawSeverity.set(surf, num);
    }
  }
  const rawDepths = new Map<string, number>();
  if(raw.cariesDepths && typeof raw.cariesDepths === "object"){
    for(const [surf, val] of Object.entries(raw.cariesDepths)){
      const code = toIcdas(val);
      if(VALID_FILLING_SURFACES.has(surf) && code !== null) rawDepths.set(surf, code);
    }
  }
  const rawSecondary = new Map<string, number>();
  if(raw.secondaryCaries && typeof raw.secondaryCaries === "object"){
    for(const [surf, val] of Object.entries(raw.secondaryCaries)){
      const num = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
      if(VALID_FILLING_SURFACES.has(surf) && VALID_CARS.has(num)) rawSecondary.set(surf, num);
    }
  }
  // SP5 Task 1: `rootCaries` is a normal enum. `radiographicDepth` is a
  // per-surface scalar map, independent of the unified visual severity.
  s.rootCaries = validateEnum(raw.rootCaries, VALID_ROOT_CARIES, "none");
  // SP8 Task 3: peri-implant disease (enum, implant-only). Additive axis — a
  // legacy payload never had this field, so absent/invalid -> "none" (no
  // change in render for pre-SP8 payloads).
  s.periImplant = validateEnum(raw.periImplant, VALID_PERI_IMPLANT, "none");
  // SP8 Task 4: migrate pre-SP8 implant signals. An implant tooth that carried
  // mods.inflammation or mods.parodontal recorded soft-tissue inflammation with
  // no bone-loss grade, so it becomes peri-implant mucositis and the mod is
  // removed (non-implant teeth keep their mods). Runs unconditionally — a modern
  // 2.6 payload never has those mods on an implant, so it's a no-op there.
  if(s.toothSelection === "implant" && s.periImplant === "none"){
    if(s.mods.has("inflammation")){ s.periImplant = "mucositis"; s.mods.delete("inflammation"); }
    if(s.mods.has("parodontal")){ s.periImplant = "mucositis"; s.mods.delete("parodontal"); }
  }
  // SP-perio PG-C Task 2: cejVisibility/rootConcavity (additive enum axes). A
  // legacy payload (<=2.13) never carried these fields, so absent/invalid ->
  // "none". No migration needed.
  // Bead odontogram-dma: additive enum axes; a legacy payload carries neither
  // key, which reads as "no retention element recorded".
  s.retention = validateEnum(raw.retention, VALID_RETENTION, "none");
  s.implantPosition = validateEnum(raw.implantPosition, VALID_IMPLANT_POSITION, "center");
  s.crownFractureType = validateEnum(raw.crownFractureType, VALID_CROWN_FRACTURE_TYPE, "none");
  s.crownMarginType = validateEnum(raw.crownMarginType, VALID_CROWN_MARGIN_TYPE, "none");
  s.crownMarginSide = validateEnum(raw.crownMarginSide, VALID_CROWN_MARGIN_SIDE, "");
  s.endoCanals = {};
  if(raw.endoCanals && typeof raw.endoCanals === "object"){
    for(const [k, v] of Object.entries(raw.endoCanals as Record<string, unknown>)){
      if(Object.prototype.hasOwnProperty.call(Object.prototype, k)) continue;
      if(Array.isArray(v)){
        const c = v.filter((x): x is string => typeof x === "string" && VALID_ENDO_CANAL.has(x));
        if(c.length) s.endoCanals[k] = c;
      }
    }
  }
  s.retentionSide = validateEnum(raw.retentionSide, VALID_RETENTION_SIDE, "none");
  // Bead odontogram-0n8: tolerant wie jede Enum-Achse. Dass ein nicht
  // durchgebrochener Zahn keine Stufe TRAEGT, erzwingt der Setter, nicht der
  // Import - dieselbe Arbeitsteilung wie ueberall sonst hier.
  s.eruptionStage = validateEnum(raw.eruptionStage, VALID_ERUPTION_STAGE, "none");
  s.rootFracture = validateEnum(raw.rootFracture, VALID_ROOT_FRACTURE, "none");
  s.rootResection = validateEnum(raw.rootResection, VALID_ROOT_RESECTION, "none");
  // Die Wurzelangaben werden hier TOLERANT uebernommen und erst beim Schreiben
  // gegen die Position geprueft - wie ueberall sonst: ein Import darf tragen,
  // was er traegt, und die Bedienung zeigt nur, was sie zulaesst.
  s.rootFractureRoot = typeof raw.rootFractureRoot === "string" ? raw.rootFractureRoot : "";
  s.rootResectionRoot = typeof raw.rootResectionRoot === "string" ? raw.rootResectionRoot : "";
  s.sensibility = validateEnum(raw.sensibility, VALID_SENSIBILITY, "none");
  s.percussion = validateEnum(raw.percussion, VALID_PERCUSSION, "none");
  s.cejVisibility = validateEnum(raw.cejVisibility, VALID_CEJ_VISIBILITY, "none");
  s.rootConcavity = validateEnum(raw.rootConcavity, VALID_ROOT_CONCAVITY, "none");
  // SP-perio PG-D Task 3: gingivalThickness/millerClass (additive enum axes).
  // Absent/legacy payloads have no key -> stays the default (no throw); an
  // unrecognized value self-heals to the default, same tolerant-hydrate
  // policy as every other axis above.
  s.gingivalThickness = validateEnum(raw.gingivalThickness, VALID_GINGIVAL_THICKNESS, "unknown");
  s.millerClass = validateEnum(raw.millerClass, VALID_MILLER_CLASS, "none");
  s.radiographicDepth = new Map();
  if(raw.radiographicDepth && typeof raw.radiographicDepth === "object"){
    for(const [surf, val] of Object.entries(raw.radiographicDepth)){
      if(VALID_FILLING_SURFACES.has(surf) && typeof val === "string" && VALID_RADIOGRAPHIC_DEPTH.has(val)) s.radiographicDepth.set(surf, val);
    }
  }
  // SP10: per-surface filling defect (additive; legacy payloads have none).
  s.fillingDefect = new Map();
  if(raw.fillingDefect && typeof raw.fillingDefect === "object"){
    for(const [surf, val] of Object.entries(raw.fillingDefect)){
      if(VALID_FILLING_SURFACES.has(surf) && typeof val === "string" && VALID_FILLING_DEFECT_SET.has(val)) s.fillingDefect.set(surf, val);
    }
  }
  // Bead odontogram-wxt: cervical involvement (additive; legacy payloads have
  // none). Validated against VALID_CERVICAL_SURFACES, not the full surface set:
  // a hand-edited payload claiming an occlusal cervix is dropped rather than
  // stored, because there is no control that could ever author it.
  s.cervicalSurfaces = filterSet(raw.cervicalSurfaces, VALID_CERVICAL_SURFACES);
  // Bead odontogram-d1b (payload 2.48): additive, legacy payloads have none.
  s.cervicalSideUnknown = filterSet(raw.cervicalSideUnknown, VALID_CERVICAL_UNKNOWN);
  s.fillingMaterial = validateEnum(raw.fillingMaterial, VALID_FILLING_MATERIAL, s.fillingMaterial);
  s.fillingSurfaces = filterSet(raw.fillingSurfaces, VALID_FILLING_SURFACES);
  s.fillingSurfaceMaterials = new Map();
  const rawFSM = raw.fillingSurfaceMaterials;
  if(rawFSM && typeof rawFSM === "object"){
    // v1.4 format
    for(const [surf, mat] of Object.entries(rawFSM)){
      if(VALID_FILLING_SURFACES.has(surf) && typeof mat === "string" && VALID_FILLING_MATERIAL.has(mat) && mat !== "none"){
        s.fillingSurfaceMaterials.set(surf, mat);
      }
    }
  }else if(s.fillingMaterial !== "none" && s.fillingSurfaces.size > 0){
    // legacy v1.3: one material applied to all filled surfaces
    for(const surf of s.fillingSurfaces){
      s.fillingSurfaceMaterials.set(surf, s.fillingMaterial);
    }
  }
  // keep fillingSurfaces in sync with the map keys
  s.fillingSurfaces = new Set(s.fillingSurfaceMaterials.keys());
  // SP6 Task 1 migration: build the unified per-surface `cariesSeverity` from
  // the three raw sources (parsed above), now that `caries` and
  // `fillingSurfaceMaterials` are finalized. Per surface the value is resolved
  // by the state machine:
  //   - a native `raw.cariesSeverity` value ALWAYS wins (round-trips 2.4),
  //   - otherwise a RECURRENT surface (has a filling) prefers the retired CARS
  //     score, then the retired ICDAS depth, then a representative default,
  //   - a PRIMARY surface (no filling) takes the retired ICDAS depth.
  // Only surfaces with an explicit source value get an entry — a caried surface
  // with no source resolves to the render/summary default (2) via `?? 2`, so
  // omitting it is render-identical and preserves byte-compat.
  //
  // FIX 1 (data integrity, carried from SP5): the legacy caries∩filling → score
  // inference (there is no stored recurrent value on a <2.3 payload) fires ONLY
  // for legacy callers. `inferLegacySecondaryCaries` defaults to `true`
  // (internal seams/presets/version-less callers, preserving goldens), while the
  // JSON/FHIR import path passes `false` for native ≥2.3 payloads where a caried
  // + filled surface with no recurrent score is a deliberate primary lesion.
  s.cariesSeverity = new Map();
  const severitySurfaces = new Set<string>([
    ...rawSeverity.keys(), ...rawDepths.keys(), ...rawSecondary.keys(),
  ]);
  for(const surf of s.fillingSurfaceMaterials.keys()){
    if(inferLegacySecondaryCaries && s.caries.has("caries-" + surf)) severitySurfaces.add(surf);
  }
  for(const surf of severitySurfaces){
    if(rawSeverity.has(surf)){ s.cariesSeverity.set(surf, rawSeverity.get(surf)!); continue; }
    const hasFilling = s.fillingSurfaceMaterials.has(surf);
    if(hasFilling){
      // Recurrent: prefer the stored CARS score, then the ICDAS depth, then the
      // legacy caries∩filling inference (default recurrent score 3).
      if(rawSecondary.has(surf)){ s.cariesSeverity.set(surf, rawSecondary.get(surf)!); }
      else if(rawDepths.has(surf)){ s.cariesSeverity.set(surf, rawDepths.get(surf)!); }
      else if(inferLegacySecondaryCaries && s.caries.has("caries-" + surf)){ s.cariesSeverity.set(surf, 3); }
    }else{
      // Primary: the ICDAS depth.
      if(rawDepths.has(surf)){ s.cariesSeverity.set(surf, rawDepths.get(surf)!); }
    }
  }
  // FIX 2 (final review, minor): normalize a contradictory legacy input — a
  // surface that's both in `caries` and filled (i.e. recurrent) but whose
  // resolved severity is an explicit CARS 0 (Sound). That combination is only
  // reachable via a raw payload (the popup can't produce it — picking CARS 0
  // there already removes the caries via `applyRecurrentCariesScore`), and
  // left as-is it renders `subcaries-{surface}` at the SVG's default opacity,
  // silently keeping a caries indicator that should have been cleared.
  // Resolve it the same way the popup does (score 0 removes the surface from
  // `caries` and clears its severity — same transition as
  // `applyRecurrentCariesScore`, inlined here to avoid a `Set<unknown>` vs
  // `Set<string>` type mismatch against `defaultState()`'s untyped `caries`).
  // Input-side only — does not touch render/state-machine/popup logic.
  for(const surf of s.fillingSurfaceMaterials.keys()){
    if(s.caries.has("caries-" + surf) && s.cariesSeverity.get(surf) === 0){
      s.caries.delete("caries-" + surf);
      s.cariesSeverity.delete(surf);
    }
  }
  s.fissureSealing = !!raw.fissureSealing;
  s.calculus = !!raw.calculus;
  s.contactMesial = !!raw.contactMesial;
  s.contactDistal = !!raw.contactDistal;
  // SP11: bruxismWear/bruxismNeckWear (booleans) retired in favor of the
  // wearEdge/wearCervical type enums. Legacy edge boolean -> attrition (dominant
  // bruxism edge wear); cervical boolean -> abrasion (generic cervical wear);
  // false/absent -> none. A modern payload's own valid value wins.
  const migratedWearEdge = raw.bruxismWear ? "attrition" : "none";
  s.wearEdge = validateEnum(raw.wearEdge, VALID_WEAR_EDGE, migratedWearEdge);
  const migratedWearCervical = raw.bruxismNeckWear ? "abrasion" : "none";
  s.wearCervical = validateEnum(raw.wearCervical, VALID_WEAR_CERVICAL, migratedWearCervical);
  s.discoloration = validateEnum(raw.discoloration, VALID_DISCOLORATION, "none");
  // SP14 Task 1: orthodontic axes foundation (additive; no legacy fields to migrate).
  s.orthoAppliance = validateEnum(raw.orthoAppliance, VALID_ORTHO_APPLIANCE, "none");
  s.orthoDrift = validateEnum(raw.orthoDrift, VALID_ORTHO_DRIFT, "none");
  s.orthoVertical = validateEnum(raw.orthoVertical, VALID_ORTHO_VERTICAL, "none");
  s.orthoRotation = raw.orthoRotation === true;
  s.orthoProgressive = raw.orthoProgressive === true;
  s.apicalRoot = typeof raw.apicalRoot === "string" ? raw.apicalRoot : ""; // Apikal pro Wurzel
  s.orthoBracketSide = validateEnum(raw.orthoBracketSide, VALID_ORTHO_BRACKET_SIDE, "buccal");
  s.brokenMesial = !!raw.brokenMesial;
  s.brokenIncisal = !!raw.brokenIncisal;
  s.brokenDistal = !!raw.brokenDistal;
  s.extractionWound = !!raw.extractionWound;
  s.extractionPlan = !!raw.extractionPlan;
  s.parapulpalPin = !!raw.parapulpalPin;
  s.crownReplace = !!raw.crownReplace;
  s.crownNeeded = !!raw.crownNeeded;
  s.missingClosed = !!raw.missingClosed;
  s.bridgePillar = !!raw.bridgePillar;
  s.cantilever = !!raw.cantilever;                      // Bead odontogram-5rv
  s.splinted = !!raw.splinted;                          // Verblockung
  s.occlusalSplint = !!raw.occlusalSplint;              // Schiene
  s.occlusalFunction = validateEnum(raw.occlusalFunction, VALID_OCCLUSAL_FUNCTION, "none"); // Funktion
  s.rootCap = !!raw.rootCap;                            // Wurzelkappe
  s.onlayCoverage = Array.isArray(raw.onlayCoverage)    // Teilkrone pro Fläche
    ? raw.onlayCoverage.filter((x: unknown): x is string => typeof x === "string" && ONLAY_SURFACES.includes(x))
    : [];
  s.inlayCoverage = Array.isArray(raw.inlayCoverage)    // Inlay-Flächen
    ? raw.inlayCoverage.filter((x: unknown): x is string => typeof x === "string" && ONLAY_SURFACES.includes(x))
    : [];
  s.veneerCoverage = Array.isArray(raw.veneerCoverage)  // Veneer-Flächen
    ? raw.veneerCoverage.filter((x: unknown): x is string => typeof x === "string" && ONLAY_SURFACES.includes(x))
    : [];
  s.prosthesis = validateEnum(raw.prosthesis, VALID_PROSTHESIS, "none");
  s.mobility = validateEnum(raw.mobility, VALID_MOBILITY, s.mobility);
  s.toothSubstrate = validateEnum(raw.toothSubstrate, VALID_TOOTH_SUBSTRATE, s.toothSubstrate);
  s.restorationType = validateEnum(raw.restorationType, VALID_RESTORATION_TYPE, s.restorationType);
  s.restorationMaterial = validateEnum(raw.restorationMaterial, VALID_RESTORATION_MATERIAL, s.restorationMaterial);
  // SP15 wholebranch fix: a radix substrate (broken root remnant) can't carry
  // a fixed restoration — restorationRowHidden() hides the restoration
  // control for it (B7), and syncControlsFromState's reset block clears a
  // LIVE crown/bridge when the substrate select changes to radix. Mirror that
  // guard here too so a crafted/imported/directly-hydrated radix+crown payload
  // self-heals on hydrate, the same way FIX 4 below self-heals a
  // crown+prosthesis payload — a stale crown must never render over a
  // tooth-radix layer nor appear alongside "Radix" in the summary.
  if(s.toothSubstrate === "radix" && s.restorationType !== "none"){
    s.restorationType = "none";
    s.restorationMaterial = "none";
  }
  // SP3b Task 6 (spec §9 gap): the two fields above are validated independently
  // against their own enums, so a hand-edited/imported payload can still pair a
  // legal type with a material that type never supports (e.g. inlay+metal — the
  // matrix only allows inlay in emax/gold/gradia/zircon/temporary). Guard the
  // (type, material) PAIR here so an invalid combo never reaches state/render —
  // composeRestorationLayers() already no-ops on one, but a "sane-looking but
  // impossible" state is still worth correcting rather than leaving in place.
  // isValidRestoration() also takes a `view` (onlay is occlusal-only), but view
  // is a render/UI concern, not a data-validity one: a stored/imported state has
  // no notion of which template will eventually draw it, so validate here with
  // "occlusal" (the permissive superset of front) so a valid onlay+material pair
  // is never rejected just because we don't yet know the view.
  if(!isValidRestoration(s.restorationType as RestorationType, s.restorationMaterial as RestorationMaterial, "occlusal")){
    const spec = RESTORATION_MATRIX[s.restorationType as Exclude<RestorationType, "none">];
    if(spec && spec.materials.length > 0){
      // Type is legitimate, material is not: keep the type, fall back to its
      // first valid material (deterministic — RESTORATION_MATRIX order).
      s.restorationMaterial = spec.materials[0];
    }else{
      // No type (or a type with no valid materials at all, which today's
      // matrix never produces) — drop both to "none" rather than guess.
      s.restorationType = "none";
      s.restorationMaterial = "none";
    }
  }
  // SP3b FIX 4: cross-field coherence — a tooth has EITHER a fixed restoration OR a
  // prosthesis, never both. A crafted/imported payload can pair both; keep the
  // restoration and clear the prosthesis (restoration wins, matching render
  // precedence). Never throws.
  if((s.restorationType === "crown" || s.restorationType === "bridge") && s.prosthesis !== "none"){
    s.prosthesis = "none";
  }
  s.crownLeakage = !!raw.crownLeakage;
  // SP-perio P1 Task 1: restore the per-site perio sub-record. Absent/legacy
  // (<=2.11) payloads have no `perio` key at all -> stays the empty default
  // (no throw). Every raw value is independently validated: `pd` is charted
  // only through clampPerio's own rules (out-of-range/non-integer/unknown
  // site dropped, never orphaning a bad entry); `gm`/`bop`/`sup` are ONLY
  // ever kept for a site that resolved a valid `pd` above — a crafted/foreign
  // payload can never sneak in an orphaned gm/bop/sup on an un-charted site.
  const rawPerio = raw.perio;
  if(rawPerio && typeof rawPerio === "object"){
    if(rawPerio.pd && typeof rawPerio.pd === "object"){
      for(const [site, val] of Object.entries(rawPerio.pd)){
        if(!(PERIO_SITES as readonly string[]).includes(site)) continue;
        const num = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
        const clamped = clampPerio("pd", num);
        if(clamped !== null) s.perio.pd.set(site, clamped);
      }
    }
    if(rawPerio.gm && typeof rawPerio.gm === "object"){
      for(const [site, val] of Object.entries(rawPerio.gm)){
        if(!s.perio.pd.has(site)) continue; // no orphan gm without a charted pd
        const num = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
        const clamped = clampPerio("gm", num);
        if(clamped !== null) s.perio.gm.set(site, clamped);
      }
    }
    if(Array.isArray(rawPerio.bop)){
      for(const site of rawPerio.bop){
        if(typeof site === "string" && s.perio.pd.has(site)) s.perio.bop.add(site);
      }
    }
    if(Array.isArray(rawPerio.sup)){
      for(const site of rawPerio.sup){
        if(typeof site === "string" && s.perio.pd.has(site)) s.perio.sup.add(site);
      }
    }
  }
  // SP-perio P2b Task 2: restore the per-entrance furcation grade map.
  // Absent/legacy (<=2.12) payloads have no `furcation` key -> stays the
  // empty default (no throw). Validated against the tooth-independent
  // VALID_FURCATION_ENTRANCE/VALID_FURCATION_GRADE sets (see their doc
  // comment above) — hydrateState has no toothNo to call
  // furcationEntrances(toothNo) itself; a crafted/foreign entrance for a
  // tooth position that doesn't actually offer it is harmless dead data,
  // exactly like an out-of-position radiographicDepth/fillingDefect surface.
  const rawFurcation = raw.furcation;
  if(rawFurcation && typeof rawFurcation === "object"){
    for(const [entrance, val] of Object.entries(rawFurcation)){
      if(!VALID_FURCATION_ENTRANCE.has(entrance)) continue;
      const num = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
      if(Number.isInteger(num) && VALID_FURCATION_GRADE.has(num)) s.furcation.set(entrance, num);
    }
  }
  // Bead odontogram-gry: Papillenverlust wiederherstellen. Gegen die
  // zahnunabhaengigen Mengen geprueft, aus demselben Grund wie die Furkation
  // darueber: eine distale Papille am letzten Zahn ist hier harmlose tote
  // Angabe, und die Bedienung zeigt sie ohnehin nicht.
  const rawPapilla = raw.papillaLoss;
  if(rawPapilla && typeof rawPapilla === "object"){
    for(const [site, val] of Object.entries(rawPapilla)){
      if(!VALID_PAPILLA_SITE.has(site)) continue;
      const num = typeof val === "number" ? val : (typeof val === "string" ? Number(val) : NaN);
      if(Number.isInteger(num) && VALID_PAPILLA_LOSS.has(num)) s.papillaLoss.set(site, num);
    }
  }
  // SP-perio P2b Task 3: restore the O'Leary plaque-surface presence set.
  // Absent/legacy payloads have no `plaque` key -> stays the empty default
  // (no throw). Validated against VALID_PLAQUE_SURFACE — an unrecognized
  // entry (foreign/crafted string) is silently dropped, never throws.
  const rawPlaque = raw.plaque;
  if(Array.isArray(rawPlaque)){
    for(const surface of rawPlaque){
      if(typeof surface === "string" && VALID_PLAQUE_SURFACE.has(surface)) s.plaque.add(surface);
    }
  }
  // SP-perio PG-D Task 1: restore the graded PI/GI surface maps. Absent/legacy
  // (<=2.14) payloads have no `pi`/`gi` key -> stays the empty default (no
  // throw). Validated against VALID_PLAQUE_SURFACE (same fixed 4-surface set
  // `plaque` uses) + grade in {1,2,3} — an unrecognized surface or an
  // out-of-range/non-integer grade (including a stored 0, which should never
  // happen but is tolerated as "drop it") is silently dropped, never throws.
  if(raw.pi && typeof raw.pi === "object"){
    for(const [surface, g] of Object.entries(raw.pi)){
      if(VALID_PLAQUE_SURFACE.has(surface) && (g === 1 || g === 2 || g === 3)) s.pi.set(surface, g);
    }
  }
  if(raw.gi && typeof raw.gi === "object"){
    for(const [surface, g] of Object.entries(raw.gi)){
      if(VALID_PLAQUE_SURFACE.has(surface) && (g === 1 || g === 2 || g === 3)) s.gi.set(surface, g);
    }
  }
  // SP-perio PG-E Task 1: restore the peri-implant mPI/mBI graded surface
  // maps, same tolerant parsing as pi/gi above. Hydrate is a non-interactive
  // path (not gated) — the implant-only restriction is enforced only by the
  // SETTER, not by hydrate/import, matching every other axis's hydrate
  // tolerance policy in this file.
  if(raw.mpi && typeof raw.mpi === "object"){
    for(const [surface, g] of Object.entries(raw.mpi)){
      if(VALID_PLAQUE_SURFACE.has(surface) && (g === 1 || g === 2 || g === 3)) s.mpi.set(surface, g);
    }
  }
  if(raw.mbi && typeof raw.mbi === "object"){
    for(const [surface, g] of Object.entries(raw.mbi)){
      if(VALID_PLAQUE_SURFACE.has(surface) && (g === 1 || g === 2 || g === 3)) s.mbi.set(surface, g);
    }
  }
  // Bead odontogram-2vd: restore the explicit assessment-status map. Absent
  // (every payload <= 2.20) means "nothing but the values themselves was
  // recorded", which is exactly the empty default. Each entry is validated
  // against the axis/qualifier grammar and the four known statuses; anything
  // else (unknown axis, foreign qualifier, unknown status) is dropped, never
  // throws. The qualifier is checked tooth-INDEPENDENTLY here for the same
  // reason furcation is: hydrateState has no tooth number.
  const rawAssessment = raw.assessment;
  if(rawAssessment && typeof rawAssessment === "object"){
    for(const [key, status] of Object.entries(rawAssessment)){
      if(typeof status !== "string" || !ASSESSMENT_STATUSES.has(status)) continue;
      if(!assessmentKeyValid(key)) continue;
      s.assessment.set(key, status);
    }
  }
  // SP-perio PG-D Task 2: restore keratinized gingiva width. Absent/legacy
  // payloads have no `kg` key -> stays the default null (no throw).
  // `clampKg` tolerates any input (non-numeric/out-of-range) and returns
  // null for it, same tolerant-hydrate policy as every other axis above.
  s.kg = clampKg(raw.kg);
  // odontogram-im1. NOT implant-gated: hydrate is the tolerant path, as it
  // is for the Mombelli indices - only the SETTER enforces that a product
  // belongs to an implant. normalizeImplantProduct drops blanks and rereads
  // the UDI, so a hand-edited payload cannot carry a lot number that
  // disagrees with the carrier it came from.
  s.implantProduct = raw.implantProduct && typeof raw.implantProduct === "object"
    ? normalizeImplantProduct(raw.implantProduct as ImplantProduct)
    : null;
  // Dasselbe fuer das Restaurationsprodukt (odontogram-99h). Tolerant wie
  // ueberall beim Import: was nicht lesbar ist, faellt weg, statt den Zahn
  // mitzureissen.
  s.restorationProduct = raw.restorationProduct && typeof raw.restorationProduct === "object"
    ? normalizeRestorationProduct(raw.restorationProduct as RestorationProduct)
    : null;
  // Je Material ein Satz, und jeder einzeln geradegerueckt: ein unlesbarer
  // Eintrag faellt weg, statt die uebrigen mitzureissen.
  s.fillingProducts = new Map<string, RestorationProduct>();
  const rohFP = raw.fillingProducts;
  if(rohFP && typeof rohFP === "object" && !Array.isArray(rohFP)){
    for(const [mat, wert] of Object.entries(rohFP as Record<string, unknown>)){
      if(!VALID_FILLING_MATERIALS.has(mat)) continue;
      const norm = wert && typeof wert === "object"
        ? normalizeRestorationProduct(wert as RestorationProduct) : null;
      if(norm) s.fillingProducts.set(mat, norm);
    }
  }
  // Restore note
  if(typeof raw.note === "string") s.note = raw.note;
  // Restore plugin custom states (only for registered plugin IDs)
  if(raw.customStates && typeof raw.customStates === "object"){
    const validIds = new Set(registeredPlugins.map(p => p.id));
    for(const [key, val] of Object.entries(raw.customStates)){
      if(validIds.has(key)){
        s.customStates[key] = val;
      }
    }
  }
  return s;
}

/** R2-A Task 2: per-tooth serialize loop, parameterized over a chart map so
 *  the same collection logic serves the STATUS export, the PLAN export
 *  (getPlanChart()), and the plan-vs-status diff check in
 *  collectExportPayload() below — instead of three copies of the loop. */
function collectTeeth(chart: Map<Any, Any>){
  const teeth: Record<string, Any> = {};
  for(const toothNo of ALL_TEETH){
    const s = chart.get(toothNo) ?? defaultState();
    teeth[toothNo] = serializeState(s);
  }
  return teeth;
}

/** Current global settings, shared verbatim by every payload shape below
 *  (status export, plan export) — these are session/app-level, not owned by
 *  either chart. */
function collectGlobals(){
  return {
    wisdomVisible,
    showBase,
    occlusalVisible,
    showHealthyPulp,
    edentulous,
  };
}

/**
 * R2-A Task 2 (D3, RATIFIED): export/import stay STATUS-PRIMARY — `teeth`
 * is always built from `charts.status` explicitly (NOT the active-chart
 * alias `toothState`), so exporting while in PLAN mode still yields the
 * STATUS as the primary payload. The `plan` section is a NEW, additive,
 * separately-addressable layer: it is only appended when the plan chart has
 * actually been initialized AND differs from status, so a status-only case
 * (the overwhelming majority, including every existing caller/golden) stays
 * byte-identical apart from the version bump.
 */
function collectExportPayload(){
  const statusTeeth = collectTeeth(charts.status);
  const statusJson = JSON.stringify(statusTeeth);
  const planTeeth = planInitialized ? collectTeeth(charts.plan) : null;
  const planDiffers = planTeeth !== null && JSON.stringify(planTeeth) !== statusJson;
  // Planalternativen (2.47): every alternative by name, the active one by id.
  // Emitted only when it carries more than `plan` does - a second alternative,
  // or one that differs from the status - so a status-only document and one
  // where plan mode was entered but nothing planned stay byte-identical.
  const plansOut = Array.from(planAlternatives.values())
    .map((e) => ({ id: e.id, name: e.name, teeth: collectTeeth(e.chart) }));
  const emitPlans = plansOut.length > 1 || plansOut.some((p) => JSON.stringify(p.teeth) !== statusJson);
  return {
    version: PAYLOAD_VERSION,
    globals: collectGlobals(),
    teeth: statusTeeth,
    ...(caseMetaIsEmpty(caseMeta) ? {} : { case: serializeCaseMeta(caseMeta) }),
    ...(examinationContextIsEmpty(examinationContext)
      ? {} : { examination: serializeExaminationContext(examinationContext) }),
    // The archive of earlier examinations belongs to the DOCUMENT, not to
    // either chart, so it rides on the status-primary payload only (like
    // `teeth` itself) and is omitted entirely when nothing was captured.
    ...(examinations.length === 0 ? {} : { examinations: examinations.map(serializeSnapshot) }),
    ...(planDiffers ? { plan: planTeeth } : {}),
    ...(emitPlans ? { plans: plansOut, ...(activePlanId ? { activePlanId } : {}) } : {}),
  };
}

/** TEST-ONLY: collect the full export payload ({version, globals, teeth[,
 *  plan]}) exactly as exportStatus() would serialize it.
 *  Not part of the public API. */
export function __collectExportPayloadForTest(): Any {
  return collectExportPayload();
}

/**
 * Export the STATUS chart's payload — identical to exportStatus()'s JSON
 * (status-primary; unaffected by the current chart mode).
 */
export function getStatusChart(): Any {
  return collectExportPayload();
}

/**
 * Export the PLAN chart's payload alone: same shape as the status export
 * (`{version, globals, teeth}`), but `teeth` is collected from `charts.plan`.
 * `globals` are shared app-level settings, not owned by either chart.
 */
function readLivePlanChart(): Any {
  return {
    version: PAYLOAD_VERSION,
    globals: collectGlobals(),
    teeth: collectTeeth(charts.plan),
    ...(caseMetaIsEmpty(caseMeta) ? {} : { case: serializeCaseMeta(caseMeta) }),
    ...(examinationContextIsEmpty(examinationContext)
      ? {} : { examination: serializeExaminationContext(examinationContext) }),
  };
}

function toothRaw(teeth: Record<string, unknown> | undefined, toothNo: number): Any {
  if(!teeth || typeof teeth !== "object") return {};
  const raw = (teeth as Any)[toothNo] ?? (teeth as Any)[String(toothNo)] ?? {};
  if(!raw || typeof raw !== "object") return {};
  // `hydrateState` writes legacy migrations onto `raw`. Clone so an inactive
  // plan-chart read cannot mutate the session document.
  return JSON.parse(JSON.stringify(raw));
}

function chartFromTeeth(teeth: Record<string, unknown> | undefined, inferLegacySecondaryCaries: boolean): Map<Any, Any> {
  const chart = new Map();
  for(const toothNo of ALL_TEETH){
    chart.set(toothNo, hydrateState(toothRaw(teeth, toothNo), inferLegacySecondaryCaries));
  }
  return chart;
}

function documentGlobals(doc: OdontogramDocument): Record<string, boolean> {
  return {
    wisdomVisible: doc.globals?.wisdomVisible ?? true,
    showBase: doc.globals?.showBase ?? true,
    occlusalVisible: doc.globals?.occlusalVisible ?? true,
    showHealthyPulp: doc.globals?.showHealthyPulp ?? true,
    edentulous: doc.globals?.edentulous ?? false,
  };
}

function planChartFromDocument(doc: OdontogramDocument): Any {
  const inferLegacySecondaryCaries = isLegacyPayloadVersion(doc.version);
  // Planalternativen: "the plan chart" of a 2.47 document is its ACTIVE
  // alternative (by activePlanId, else the first in `plans`); a document of
  // the older shape carries the single `plan`.
  const plans = Array.isArray(doc.plans) ? doc.plans : null;
  const activeAlt = plans && plans.length > 0
    ? (plans.find((p) => p && p.id === doc.activePlanId) ?? plans[0])
    : null;
  const planTeeth = activeAlt && activeAlt.teeth && typeof activeAlt.teeth === "object"
    ? activeAlt.teeth
    : (doc.plan && typeof doc.plan === "object" ? doc.plan : undefined);
  const caseBlock = readCaseMeta(doc.case);
  const examination = readExaminationContext(doc.examination);
  return JSON.parse(JSON.stringify({
    version: PAYLOAD_VERSION,
    globals: documentGlobals(doc),
    teeth: collectTeeth(chartFromTeeth(planTeeth, inferLegacySecondaryCaries)),
    ...(caseMetaIsEmpty(caseBlock) ? {} : { case: serializeCaseMeta(caseBlock) }),
    ...(examinationContextIsEmpty(examination) ? {} : { examination: serializeExaminationContext(examination) }),
  }));
}

export function getPlanChart(): Any {
  return getActiveOdontogramSession().getPlanChart();
}

/**
 * Hydrate `payload.teeth` into the PLAN chart ONLY (status is left
 * untouched), mirroring the per-tooth hydrate importStatus() performs for
 * the status chart. Marks the plan chart initialized. Repaints the DOM only
 * when PLAN is the currently active chart mode — hydrating a chart that
 * isn't on screen must not visibly disturb whatever IS on screen (mirrors
 * setChartMode()'s own full-repaint-on-activation behavior).
 */
export function setPlanChart(payload: Any): void {
  if(!payload || typeof payload !== "object") return;
  const inferLegacySecondaryCaries = isLegacyPayloadVersion(payload.version);
  const teeth = payload.teeth || {};
  // Planalternativen: hydrate into the ACTIVE alternative; with none yet, a
  // fresh one is created first so there is a plan to replace.
  if(!planInitialized) createPlanEntry();
  for(const toothNo of ALL_TEETH){
    const raw = teeth[toothNo];
    charts.plan.set(toothNo, hydrateState(raw, inferLegacySecondaryCaries));
  }
  planInitialized = true;
  // DS-1: replacing the plan chart wholesale resets any runtime plan-edits.
  planEditedTeeth.clear();
  resetShorthandInput();
  // DS-1 (review Fix 2): drop any pending dual-state confirm — its deferred
  // `applyFn` was captured against the pre-replace plan and must not run against
  // the freshly-hydrated plan chart via a later acceptDualStateConfirm().
  pendingDualStateConfirm = null;
  if(getChartMode() === "plan"){
    for(const toothNo of ALL_TEETH){
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
      updateToothLabelNoteIcon(toothNo);
    }
    if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
    notifyStateChange();
  }
}

// R2-B Task 1: pure, read-only status->plan diff engine. Reuses the SAME
// summary-label helpers the tooltip (getStateSummary) and whole-mouth panel
// (getOdontogramSummary) already use for these axes, so a diff entry never
// invents new copy — it just reports "the same label the UI would already
// show changed from X to Y". Adds no render/state mutation whatsoever; a
// treatment-oriented axis list (not a raw field-by-field diff), curated to
// the clinically relevant axes a "what changed" review would care about.
export type PlanChange = { toothNo: number; axis: string; from: string; to: string };

/** toothSelection value -> its i18n label key, mirrored from
 *  optionsFor("toothSelection") (see registry/axes.ts / ui-options.test.ts)
 *  so the "presence" diff axis names a value exactly the way the #toothSelect
 *  picker itself does. A value outside this set (e.g. the legacy/import-only
 *  "no-tooth-after-extraction") falls back to the "missing" label — closest
 *  existing semantics ("no tooth present") without inventing new copy. */
const TOOTH_SELECT_LABEL_KEY: Record<string, string> = Object.fromEntries(
  optionsFor("toothSelection").map((o) => [o.value, o.labelKey])
);

/** SP-perio P1 Task 1: SUMMARY-level (never per-site) perio label for a
 *  SINGLE tooth's state, used only by DIFF_AXES' `perio` entry below — so a
 *  status->plan perio edit narrates as ONE diff entry per tooth ("3 sites,
 *  BOP 33.3%, worst CAL 8") instead of exploding into up to 6 per-site
 *  entries. "Nothing charted" renders the same `planChange.none` sentinel
 *  every other axis uses. */
function perioSummaryLabel(s: Any): string {
  const perio = s.perio;
  if(!perio || !perio.pd || perio.pd.size === 0) return t("planChange.none");
  let bleeding = 0;
  let worstCal: number | null = null;
  for(const [site, pd] of perio.pd as Map<string, number>){
    if((perio.bop as Set<string>).has(site)) bleeding++;
    const cal = pd + ((perio.gm as Map<string, number>).get(site) ?? 0);
    if(worstCal === null || cal > worstCal) worstCal = cal;
  }
  const bopPct = Math.round((bleeding / perio.pd.size) * 1000) / 10;
  return t("planChange.perioSummary", { sites: perio.pd.size, bop: bopPct, cal: worstCal ?? 0 });
}

/** SP-perio P2b Task 4: SUMMARY-level (never per-entrance) furcation label
 *  for a SINGLE tooth's state, used only by DIFF_AXES' `furcation` entry
 *  below — mirrors {@link perioSummaryLabel}'s "one line per tooth, not one
 *  per site/entrance" shape. Reports only the tooth's HIGHEST Glickman grade
 *  (reusing the exact same `furcation.grade.N` copy the furcation picker
 *  itself already shows), not a per-entrance breakdown. "Nothing charted"
 *  renders the shared `planChange.none` sentinel every other axis uses. */
/** Bead odontogram-gry: ZUSAMMENFASSENDE Papillen-Beschriftung fuer EINEN
 *  Zahnzustand, nur fuer den `papillaLoss`-Eintrag in DIFF_AXES - dieselbe
 *  roemische Klasse, die auch die Bedienung zeigt. Zustandsbasiert und ohne
 *  Zahnnummer, wie `furcationSummaryLabel` daneben, weil der Vergleich zwei
 *  Zustaende gegeneinander haelt und keinen Zahn kennt. */
function papillaLossSummaryLabel(s: Any): string {
  const papilla = s.papillaLoss as Map<string, number> | undefined;
  if(!papilla || papilla.size === 0) return t("planChange.none");
  let maxGrade = 0;
  for(const grade of papilla.values()){
    if(typeof grade === "number" && grade > maxGrade) maxGrade = grade;
  }
  return maxGrade > 0 ? t(`papillaLoss.class.${maxGrade}`) : t("planChange.none");
}

function furcationSummaryLabel(s: Any): string {
  const furcation = s.furcation as Map<string, number> | undefined;
  if(!furcation || furcation.size === 0) return t("planChange.none");
  let maxGrade = 0;
  for(const grade of furcation.values()){
    if(grade > maxGrade) maxGrade = grade;
  }
  return maxGrade > 0 ? t(`furcation.grade.${maxGrade}`) : t("planChange.none");
}

/** SP-perio P2b Task 4: SUMMARY-level (never per-surface) O'Leary plaque
 *  label for a SINGLE tooth's state, used only by DIFF_AXES' `plaque` entry
 *  below — reports a compact "N/4 surfaces" count rather than exploding
 *  into up to 4 per-surface entries. "Nothing charted" renders the shared
 *  `planChange.none` sentinel every other axis uses. */
function plaqueSummaryLabel(s: Any): string {
  const plaque = s.plaque as Set<string> | undefined;
  if(!plaque || plaque.size === 0) return t("planChange.none");
  return `${plaque.size}/4`;
}

/** Curated, treatment-relevant diff axes for {@link getPlanChanges}. Each
 *  `label(state)` returns a short human string for that axis's value in the
 *  CURRENT UI language — reusing the exact same per-value i18n lookups
 *  getStateSummary()/getOdontogramSummary() already use for that axis, so the
 *  diff never renders text the rest of the app wouldn't also show. An
 *  axis at its "nothing recorded" value renders the shared
 *  `t("planChange.none")` sentinel so a from->to reads cleanly (e.g.
 *  "— → korona (cirkónium)") instead of an empty string. */
const DIFF_AXES: { key: string; labelKey: string; label: (s: Any) => string }[] = [
  {
    key: "presence", labelKey: "planChange.axis.presence",
    label: (s) => {
      const base = t(TOOTH_SELECT_LABEL_KEY[s.toothSelection] ?? "toothSelect.none");
      return s.extractionPlan ? `${base} (${t("tooth.extractionPlan")})` : base;
    },
  },
  {
    // Bead odontogram-0n8: EIGENE Zeile, nicht an die Anwesenheit gehaengt.
    // Ein Plan, der einen Zahn durchbrechen laesst, aendert nicht seine
    // Anwesenheit - er war schon da.
    key: "eruptionStage", labelKey: "eruptionStage.label",
    label: (s) => (s.eruptionStage && s.eruptionStage !== "none"
      ? t("eruptionStage.option." + kebabToCamel(s.eruptionStage))
      : t("planChange.none")),
  },
  {
    key: "substrate", labelKey: "planChange.axis.substrate",
    label: (s) => t(`substrate.${s.toothSubstrate}`),
  },
  {
    key: "restoration", labelKey: "planChange.axis.restoration",
    label: (s) => s.restorationType === "none" ? t("planChange.none") : restorationSummaryLabel(s.restorationType, s.restorationMaterial),
  },
  {
    key: "prosthesis", labelKey: "planChange.axis.prosthesis",
    label: (s) => {
      const prosthesisKey = PROSTHESIS_SUMMARY_KEY[s.prosthesis];
      return prosthesisKey ? t(prosthesisKey) : t("planChange.none");
    },
  },
  {
    key: "crownAction", labelKey: "planChange.axis.crownAction",
    label: (s) => {
      const parts: string[] = [];
      if(s.crownNeeded) parts.push(t("tooth.crownNeeded"));
      if(s.crownReplace) parts.push(t("tooth.crownReplace"));
      return parts.length > 0 ? parts.join(", ") : t("planChange.none");
    },
  },
  {
    key: "ortho", labelKey: "planChange.axis.ortho",
    label: (s) => {
      const parts: string[] = [];
      if(s.orthoAppliance && s.orthoAppliance !== "none") parts.push(t("ortho.appliance." + s.orthoAppliance));
      if(s.orthoDrift && s.orthoDrift !== "none") parts.push(t("ortho.drift." + s.orthoDrift));
      if(s.orthoVertical && s.orthoVertical !== "none") parts.push(t("ortho.vertical." + s.orthoVertical));
      if(s.orthoRotation === true) parts.push(t("ortho.rotation.label"));
      return parts.length > 0 ? parts.join(", ") : t("planChange.none");
    },
  },
  {
    key: "pulpEndo", labelKey: "planChange.axis.pulpEndo",
    label: (s) => {
      if(s.endo && s.endo !== "none"){
        const endoKey = SUMMARY_ENDO_KEY[s.endo];
        return endoKey ? t(endoKey) : t("planChange.none");
      }
      return pulpDiagnosisLabel(s) ?? t("planChange.none");
    },
  },
  {
    key: "rootPostType", labelKey: "rootPost.label",
    label: (s) => rootPostSummaryLabel(s) ?? t("planChange.none"),
  },
  {
    key: "apical", labelKey: "planChange.axis.apical",
    label: (s) => apicalDiagnosisLabel(s) ?? t("planChange.none"),
  },
  {
    // SP-perio P1 Task 1: ONE summary-level entry per tooth (see
    // perioSummaryLabel above) — never 6 per-site entries.
    key: "perio", labelKey: "planChange.axis.perio",
    label: (s) => perioSummaryLabel(s),
  },
  {
    // SP-perio P2b Task 4: ONE summary-level entry per tooth (see
    // furcationSummaryLabel above) — never one per entrance.
    key: "furcation", labelKey: "planChange.axis.furcation",
    label: (s) => furcationSummaryLabel(s),
  },
  {
    // SP-perio P2b Task 4: ONE summary-level entry per tooth (see
    // plaqueSummaryLabel above) — never one per surface.
    key: "plaque", labelKey: "planChange.axis.plaque",
    label: (s) => plaqueSummaryLabel(s),
  },
  {
    // Bead odontogram-gry: EINE Zeile je Zahn, nie eine je Zwischenraum -
    // dieselbe Bauart wie Furkation und Belag darueber. Die schlechtere der
    // beiden Papillen steht darin, weil ein Plan an einem Zahn ansetzt.
    key: "papillaLoss", labelKey: "planChange.axis.papillaLoss",
    label: (s) => papillaLossSummaryLabel(s),
  },
];

/**
 * Compare the "status" chart against the "plan" chart, tooth by tooth and
 * axis by axis (see {@link DIFF_AXES}), and report every axis whose label
 * differs. Pure and read-only: never mutates either chart, never touches the
 * DOM, never renders — a `parity.test.ts`-safe addition.
 *
 * Returns `[]` whenever the plan chart hasn't been initialized yet (no plan
 * exists to diff against). A tooth absent from either chart resolves via
 * `defaultState()`, so a status-only or plan-only tooth still diffs correctly
 * against the clinical default rather than throwing.
 *
 * Iterates the fixed `ALL_TEETH` list (not chart key insertion order), so
 * results are always grouped by tooth in the same stable clinical order the
 * rest of the app already uses (quadrant-by-quadrant); within a tooth,
 * entries follow `DIFF_AXES` order.
 */
function planChangesFromCharts(statusChart: Map<Any, Any>, planChart: Map<Any, Any>): PlanChange[] {
  const out: PlanChange[] = [];
  for(const toothNo of ALL_TEETH){
    const st = statusChart.get(toothNo) ?? defaultState();
    const pl = planChart.get(toothNo) ?? defaultState();
    for(const axis of DIFF_AXES){
      const from = axis.label(st);
      const to = axis.label(pl);
      if(from !== to) out.push({ toothNo, axis: axis.key, from, to });
    }
  }
  return out;
}

function readLivePlanChanges(): PlanChange[] {
  if(!planInitialized) return [];
  return planChangesFromCharts(charts.status, charts.plan);
}

function planChangesFromDocument(doc: OdontogramDocument): PlanChange[] {
  if(!doc.plan || typeof doc.plan !== "object") return [];
  const inferLegacySecondaryCaries = isLegacyPayloadVersion(doc.version);
  return planChangesFromCharts(
    chartFromTeeth(doc.teeth, inferLegacySecondaryCaries),
    chartFromTeeth(doc.plan, inferLegacySecondaryCaries),
  );
}

export function getPlanChanges(): PlanChange[] {
  return getActiveOdontogramSession().getPlanChanges();
}

// ---- Bead odontogram-sjr: choosable restoration colours ----

/** The element the palette is written on: the component root, so a host that
 *  mounts several odontograms is not forced to share one palette through
 *  `document`. Falls back to the document element before the grid exists. */
function paletteRoot(): { style: CSSStyleDeclaration } | null {
  const grid = $("#toothGrid") as HTMLElement | null;
  const root = (grid?.closest(".odon-root") as HTMLElement | null)
    ?? (typeof document !== "undefined" ? document.documentElement : null);
  return root as { style: CSSStyleDeclaration } | null;
}

/** Push the palette onto the DOM. Nothing else has to run: every restoration
 *  fill in the assets reads its variable, so the cascade repaints. */
function syncRestorationPalette(): void {
  if(usesDraftPalette()) applyPaletteVars(paletteRoot(), DRAFT_V1_PALETTE);
  else applyRestorationPalette(paletteRoot());
}

/** The draft's palette replaces the FORK DEFAULT only: a practice that chose
 *  its own colours keeps them in either style (Claude Design's handover:
 *  "Die neue Standardpalette gilt nur dort, wo die Praxis nichts eingestellt
 *  hat"). */
function usesDraftPalette(): boolean {
  return anatomicalStyle === "draft-v1" && paletteIsDefault();
}

/** Every colour a practice can choose, in picker order, with the colour each
 *  currently shows (chosen, else the shipped default). */
export function getRestorationColours(): { key: string; value: string }[] {
  return RESTORATION_PALETTE.map((e) => ({ key: e.key, value: restorationColour(e.key) }));
}

/** The colour `key` currently renders, chosen or shipped. */
export function getRestorationColour(key: string): string { return restorationColour(key); }

/** Choose a restoration colour, or clear it back to the shipped default with
 *  `null`. A ramp material (e.max, metal-ceramic) keeps its lightness sweep
 *  and takes only the hue — flattening a nine-stop ceramic ramp to one colour
 *  would cost exactly what makes it read as ceramic. */
export function setRestorationColour(key: string, hex: string | null): void {
  if(!paletteEntry(key)) return;
  if(!setRestorationColourValue(key, hex)) return;
  syncRestorationPalette();
  notifyStateChange();
}

/** Restore the fork default palette (Dirk's colours); the chart returns to the
 *  standard set. */
export function resetRestorationColours(): void {
  if(!resetRestorationPaletteValues()) return;
  syncRestorationPalette();
  notifyStateChange();
}

/** Whether the palette equals the fork default — nothing customised beyond it.
 *  Drives the "Reset to defaults" button's enabled state. */
export function isRestorationPaletteDefault(): boolean { return paletteIsDefault(); }

/** The chosen colours, for a host that persists practice preferences. */
export function getRestorationPalette(): Record<string, string> { return paletteValues(); }

/** Restore a persisted palette. Tolerant: unknown keys and unparsable colours
 *  are dropped rather than stored. */
export function setRestorationPalette(next: Record<string, string> | null | undefined): void {
  setRestorationPaletteValues(next);
  syncRestorationPalette();
  notifyStateChange();
}

// ---- Bead odontogram-dma: retention elements ----
//
// The gating and the derivation live in `src/retention.ts`, DOM-free, so the
// renderer and the tests share one answer. Only the chart plumbing is here.

/** The retention elements `toothNo` can carry, in picker order. `["none"]` on
 *  a tooth that can carry none — an implant answers this on the existing
 *  `prosthesis` axis instead. */
export function getRetentionOptions(toothNo: number): RetentionValue[] {
  return retentionOptions(toothState.get(toothNo));
}

/** What holds a denture to `toothNo`, and the side it engages. */
export function getRetention(toothNo: number): { retention: string; side: string } {
  const s = toothState.get(toothNo);
  return { retention: s?.retention ?? "none", side: s?.retentionSide ?? "none" };
}

/**
 * Record (or clear) the retention element on one tooth.
 *
 * A silent no-op for an element the tooth cannot carry — an attachment or a
 * bar needs a crown to be built into, a clasp only needs the tooth to be
 * there. The guard runs BEFORE the DS-1 gate, so a rejected call marks nothing
 * plan-edited and fires no state-change notification.
 *
 * Setting the element to `none` clears the side with it: a side with no
 * element to engage is an orphan, exactly as an un-charted perio site clears
 * its own gm/bop/sup rather than leaving them behind.
 */
export function setRetention(toothNo: number, value: string, side: string = "none"): void {
  // Same lock as applyShorthand: the keypad's clasp/bar keys call this exported
  // setter directly rather than through a guarded DOM handler.
  if(readOnly) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(!retentionAllowed(s, value)) return;
  const nextSide = value === "none" ? "none" : (VALID_RETENTION_SIDE.has(side) ? side : "none");
  gateToothEdit(toothNo, () => {
    if(s.retention === value && s.retentionSide === nextSide) return false;
    s.retention = value;
    s.retentionSide = nextSide;
    applyStateToSvg(toothNo);
    notifyStateChange();
    return true;
  });
}

/**
 * The bar spans this chart carries, derived from per-tooth state — never
 * stored, exactly as a bridge span is. See `detectBarSpans` for why a bar's
 * abutments are connected across the gap rather than required to be adjacent.
 */
export function getBarSpans(): number[][] {
  return detectBarSpans([UPPER_ARCH, LOWER_ARCH], (tn) => toothState.get(tn));
}

// ---- Bead odontogram-ap7: what the patient arrived with ----
//
// Whether a crown, a filling or a caries lesion was already there at intake is
// a liability and documentation question, and until now the chart could not
// answer it: a finding entered at the first visit and one entered three years
// later looked identical.
//
// It is DERIVED, never stored. Bead odontogram-2vd already archives dated
// examinations, so "pre-existing" is a comparison against the earliest one —
// which means nothing new to serialize, no payload bump, no FHIR mapping, and
// no second record that could drift out of agreement with the archive.
//
// The comparison is against the STATUS chart explicitly, never the active-chart
// alias: an examination records what was OBSERVED, and provenance is a fact
// about the past that a proposal cannot change.

/** The examination every finding is judged against — the EARLIEST archived
 *  one, since that is the mouth as the patient brought it. `null` when nothing
 *  has been archived, which is simply "this case has no baseline yet" and not
 *  an error: every derivation below then reports nothing at all. */
export function getBaselineExamination(): ExaminationContext | null {
  return examinations.length > 0 ? { ...examinations[0].examination } : null;
}

/** The baseline's record for one tooth, hydrated into a comparable state. A
 *  tooth absent from the baseline resolves to `defaultState()` — the same
 *  fallback `getPlanChanges` uses — so a tooth first charted after intake
 *  compares against the clinical default rather than throwing. */
function baselineToothState(toothNo: number): Any | null {
  if(examinations.length === 0) return null;
  const raw = examinations[0].teeth[String(toothNo)];
  return raw ? hydrateState(deepCopyJson(raw)) : defaultState();
}

/** A tooth's filled surfaces / caried surfaces as ONE compact label each, in
 *  the same "summary-level, never per-surface" shape `plaqueSummaryLabel`
 *  already uses for the diff. Tooth-independent letters (`surfaceLetter` with
 *  no tooth number) because a `DIFF_AXES`-shaped label only ever sees a state. */
function surfaceSetLabel(surfaces: Iterable<string> | undefined, strip = ""): string {
  const seen = new Set<string>();
  for(const raw of surfaces ?? []) seen.add(strip ? String(raw).replace(strip, "") : String(raw));
  if(seen.size === 0) return t("planChange.none");
  return SUMMARY_SURFACE_ORDER.filter((s) => seen.has(s)).map((s) => surfaceLetter(s)).join(", ");
}

/**
 * The axes provenance is judged over: the curated treatment-plan diff, PLUS
 * the two findings it does not carry.
 *
 * `DIFF_AXES` is deliberately left alone — it answers "what does the plan
 * change", where a filling and a caries lesion are not treatment-plan axes.
 * Provenance asks a different question, and the two findings a clinician is
 * most often asked about years later are exactly a filling and a caries
 * lesion, alongside the crown. Extending `DIFF_AXES` in place would silently
 * change the "What changes" box; appending here changes nothing else.
 */
const PROVENANCE_AXES: { key: string; labelKey: string; label: (s: Any) => string }[] = [
  ...DIFF_AXES,
  {
    key: "fillings", labelKey: "planChange.axis.fillings",
    label: (s) => surfaceSetLabel((s.fillingSurfaceMaterials as Map<string, string> | undefined)?.keys()),
  },
  {
    key: "caries", labelKey: "planChange.axis.caries",
    label: (s) => surfaceSetLabel(s.caries as Set<string> | undefined, "caries-"),
  },
];

/** Whether `label` says an axis carries an actual finding, judged against what
 *  that axis reads on a healthy default tooth.
 *
 *  The `planChange.none` sentinel alone is not enough, and getting this wrong
 *  is not subtle: `presence` reads "Tooth" and `substrate` reads "natural" on
 *  an untouched tooth, so a sentinel test would report every healthy tooth in
 *  the mouth as carrying two pre-existing findings. Deriving the neutral value
 *  from `defaultState()` instead means a newly-added axis needs no entry in a
 *  second table that could fall behind. */
function axisCarriesFinding(axis: { label: (s: Any) => string }, label: string): boolean {
  return label !== axis.label(defaultState());
}

/**
 * The treatment axes of `toothNo` that carry a finding the patient ARRIVED
 * with: recorded in the baseline examination and unchanged since.
 *
 * An axis sitting at the value a healthy tooth shows is not a pre-existing
 * finding, it is the absence of one, so it never appears here (see
 * {@link axisCarriesFinding}). Returns `[]` when no examination has been
 * archived.
 *
 * Pure and read-only: never mutates a chart, never touches the DOM, never
 * renders.
 */
export function getPreExistingAxes(toothNo: number): string[] {
  const base = baselineToothState(toothNo);
  if(!base) return [];
  const now = charts.status.get(toothNo) ?? defaultState();
  const out: string[] = [];
  for(const axis of PROVENANCE_AXES){
    const then = axis.label(base);
    if(!axisCarriesFinding(axis, then)) continue;   // nothing was there to arrive with
    if(axis.label(now) === then) out.push(axis.key);
  }
  return out;
}

/**
 * Everything that has CHANGED since the baseline examination, in the same
 * shape and stable tooth-then-axis order as {@link getPlanChanges} — one entry
 * per tooth per axis, `from` being the baseline's value and `to` today's.
 *
 * This is the complement of {@link getPreExistingAxes}: what was found or done
 * under our care. Returns `[]` when no examination has been archived.
 */
export function getChangesSinceBaseline(): PlanChange[] {
  if(examinations.length === 0) return [];
  const out: PlanChange[] = [];
  for(const toothNo of ALL_TEETH){
    const base = baselineToothState(toothNo) as Any;
    const now = charts.status.get(toothNo) ?? defaultState();
    for(const axis of PROVENANCE_AXES){
      const from = axis.label(base);
      const to = axis.label(now);
      if(from !== to) out.push({ toothNo, axis: axis.key, from, to });
    }
  }
  return out;
}

/**
 * Whether `toothNo` carries any finding the patient arrived with. The cheap
 * question the tooltip and the whole-mouth summary ask before spending a full
 * axis walk, and the one `odontogram-im1` needs: an implant present at the
 * baseline arrived with the patient, so an empty implant product on it is a
 * complete record rather than a gap.
 */
export function isToothPreExisting(toothNo: number): boolean {
  return getPreExistingAxes(toothNo).length > 0;
}

// ---- SP-perio P1 Task 1: periodontal data-core public API ----
// All five functions below operate on the ACTIVE-chart `toothState` alias
// (not `charts.status` directly), exactly like every pre-existing per-tooth
// getter/setter in this file — so they transparently participate in the
// Status/Plan dual-state model (R2-A): called while `chartMode === "plan"`
// they read/write the plan chart, and vice versa. Pure data — no SVG/DOM
// touched, no render triggered (parity-safe: perio has no chart layer yet).

type PerioSitePatch = { pd?: number | null; gm?: number; bop?: boolean; sup?: boolean };
type PlainPerio = { pd: Record<string, number>; gm: Record<string, number>; bop: string[]; sup: string[] };

/**
 * Set/clear one perio site's reading(s) on the active chart's tooth.
 *
 * - `pd` is the CHARTING key. `null`/`undefined`/any value `< 1` UN-CHARTS
 *   the site — it is removed from `pd`, `gm`, `bop`, AND `sup` in one atomic
 *   step (never leaves an orphaned gm/bop/sup behind). A non-integer `pd`
 *   (e.g. 6.5) is instead REJECTED outright: the whole call is a no-op and
 *   state stays unchanged (no partial write). A valid integer `pd` is
 *   clamped to 1–15.
 * - `gm`/`bop`/`sup` only ever apply to an ALREADY-charted site (this call's
 *   own `pd`, or a previously-charted one) — supplying them for a site with
 *   no charted `pd` is a silent no-op, preserving the "absence = not
 *   charted" invariant. `gm` is clamped to −10…+20; a non-integer `gm` is
 *   rejected (that one field is left unset/unchanged, the rest of the patch
 *   still applies).
 * - An unrecognized `site` (not one of {@link PERIO_SITES}) is a silent no-op.
 *
 * Fires {@link onStateChange} listeners (via `notifyStateChange()`) whenever
 * it actually mutates state; never on a rejected/no-op call.
 */
export function setPerioSite(toothNo: number, site: string, patch: PerioSitePatch): void {
  if(!(PERIO_SITES as readonly string[]).includes(site)) return;
  // Bead odontogram-2vd: the capability matrix decides which axes this tooth
  // HAS, so a measurement the chart shows as inapplicable can never be written
  // through the API either. Probing depth is the charting key, so a tooth
  // without it takes no part of the patch at all; the gingival margin is
  // measured from the CEJ and is therefore refused on an implant while its
  // probing depth, bleeding and suppuration are accepted.
  if(!perioAxisApplies(toothNo, "pd")) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  // DS-1: route the actual mutation through the status->plan gate. The closure
  // returns whether it changed state so a rejected/no-op edit neither marks the
  // tooth plan-edited nor mirrors it (preserving the "notify only on change"
  // contract). The lazy vivify above stays OUTSIDE the gate (not a user edit).
  gateToothEdit(toothNo, () => {
    const perio = s.perio;
    let changed = false;

    if("pd" in patch){
      const pd = patch.pd;
      if(pd === null || pd === undefined || (typeof pd === "number" && pd < 1)){
        if(perio.pd.has(site) || perio.gm.has(site) || perio.bop.has(site) || perio.sup.has(site)){
          perio.pd.delete(site);
          perio.gm.delete(site);
          perio.bop.delete(site);
          perio.sup.delete(site);
          changed = true;
        }
        if(changed) notifyStateChange();
        return changed;
      }
      const clampedPd = clampPerio("pd", pd);
      if(clampedPd === null) return false; // non-integer pd -> reject the WHOLE call
      if(perio.pd.get(site) !== clampedPd){ perio.pd.set(site, clampedPd); changed = true; }
    }

    if(!perio.pd.has(site)){
      if(changed) notifyStateChange();
      return changed; // never orphan gm/bop/sup onto an un-charted site
    }

    if(patch.gm !== undefined && perioAxisApplies(toothNo, "gm")){
      const clampedGm = clampPerio("gm", patch.gm);
      if(clampedGm !== null && perio.gm.get(site) !== clampedGm){ perio.gm.set(site, clampedGm); changed = true; }
    }
    if(patch.bop !== undefined && perioAxisApplies(toothNo, "bop")){
      if(patch.bop){ if(!perio.bop.has(site)){ perio.bop.add(site); changed = true; } }
      else if(perio.bop.has(site)){ perio.bop.delete(site); changed = true; }
    }
    if(patch.sup !== undefined && perioAxisApplies(toothNo, "sup")){
      if(patch.sup){ if(!perio.sup.has(site)){ perio.sup.add(site); changed = true; } }
      else if(perio.sup.has(site)){ perio.sup.delete(site); changed = true; }
    }
    if(changed) notifyStateChange();
    return changed;
  });
}

/** Read a tooth's perio sub-record from the active chart as a PLAIN object
 *  (Maps/Sets converted to a fresh Record/Array each call — safe to mutate,
 *  never aliases live state). A tooth with no charted sites (or never
 *  touched at all) returns the empty-but-defined shape, never `undefined`. */
export function getToothPerio(toothNo: number): PlainPerio {
  const s = toothState.get(toothNo);
  const perio = s?.perio;
  if(!perio || perio.pd.size === 0) return { pd: {}, gm: {}, bop: [], sup: [] };
  return {
    pd: Object.fromEntries(perio.pd),
    gm: Object.fromEntries(perio.gm),
    bop: Array.from(perio.bop),
    sup: Array.from(perio.sup),
  };
}

// ---- SP-perio P2b Task 2: furcation involvement (Glickman I-IV, per
// entrance) public API. Operates on the ACTIVE-chart `toothState` alias,
// exactly like the perio-site API above — transparently Status/Plan
// dual-state aware. Pure data — no SVG/DOM touched, no render triggered
// (parity-safe: furcation has no chart layer yet, that's Task 4).

/**
 * Set/clear one furcation entrance's Glickman grade on the active chart's
 * tooth.
 *
 * - `entrance` must be one of {@link furcationEntrances}(toothNo) for THIS
 *   tooth (position-gated — e.g. "lingual" is rejected on an upper molar,
 *   which only ever offers mesial/distal/buccal). Any other entrance,
 *   including one valid for a different tooth position, is a silent no-op.
 * - `grade` must be an integer 1-4 (Glickman I-IV) to set/overwrite the
 *   entrance; `null`/`undefined` clears it; anything else (non-integer,
 *   out-of-range) is a silent no-op — state stays unchanged.
 *
 * Fires {@link notifyStateChange} whenever it actually mutates state; never
 * on a rejected/no-op call.
 */
export function setFurcation(toothNo: number, entrance: string, grade: number | null | undefined): void {
  if(!furcationEntrances(toothNo).includes(entrance)) return;
  if(!perioAxisApplies(toothNo, "furcation")) return; // see setPerioSite
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  // DS-1: gate the mutation (see setPerioSite). Returns whether it changed so a
  // rejected/no-op edit is neither marked plan-edited nor mirrored.
  gateToothEdit(toothNo, () => {
    const furcation = s.furcation as Map<string, number>;

    if(grade === null || grade === undefined){
      if(furcation.has(entrance)){ furcation.delete(entrance); notifyStateChange(); return true; }
      return false;
    }
    if(!Number.isInteger(grade) || !VALID_FURCATION_GRADE.has(grade)) return false;
    if(furcation.get(entrance) !== grade){ furcation.set(entrance, grade); notifyStateChange(); return true; }
    return false;
  });
}

/** Read a tooth's furcation sub-record from the active chart as a PLAIN
 *  object (entrance -> grade), safe to mutate, never aliases live state. A
 *  tooth with no graded entrance (or never touched at all) returns `{}`. */
export function getToothFurcation(toothNo: number): Record<string, number> {
  const s = toothState.get(toothNo);
  const furcation = s?.furcation as Map<string, number> | undefined;
  if(!furcation || furcation.size === 0) return {};
  return Object.fromEntries(furcation);
}

// ---- Bead odontogram-gry: Papillenverlust (Nordland & Tarnow I-III, je
// Zwischenraum). Der BEOBACHTETE Befund neben der abgeleiteten Cairo-Klasse.

/**
 * Ob an diesem Zahn eine Papille zu beurteilen ist.
 *
 * EIGENER Waechter statt `perioAxisApplies`, wie `sensibilityAllowed` und
 * `retentionAllowed`: das ist die Faehigkeitsmatrix des Parodontalrasters, und
 * dieser Befund wird am Stuhl erhoben, bevor eine Sonde in der Hand war - er
 * gehoert nicht in ein Raster, dessen Zellen sechs sondierte Stellen
 * voraussetzen.
 *
 * Das IMPLANTAT ist ausdruecklich eingeschlossen. Es hat keine Pulpa und keinen
 * Zahnfleischrand gegen eine Schmelz-Zement-Grenze, aber es hat sehr wohl eine
 * Papille - und deren Verlust ist die haeufigste aesthetische Beschwerde nach
 * einer Implantation. Ein Befund, den man an der Stelle nicht erheben koennte,
 * waere hier der Fehler.
 */
export function papillaLossAllowed(toothNo: number): boolean {
  const s = toothState.get(toothNo);
  if(!s) return false;
  if(s.toothSelection === "implant") return true;
  // Sonst dieselbe Grenze wie beim Sondieren: ein fehlender, ein nicht
  // durchgebrochener und ein frisch extrahierter Platz hat keine Papille.
  return !perioRowHidden(s);
}

/**
 * Eine Papille beurteilen oder die Beurteilung zuruecknehmen.
 *
 * - `site` muss zu {@link papillaSites}(toothNo) gehoeren; der letzte Zahn im
 *   Bogen hat distal keinen Nachbarn und damit keine Papille.
 * - `grade` ist 1-3 (Nordland & Tarnow I-III); `null`/`undefined` nimmt den
 *   Eintrag zurueck. Alles andere ist ein stiller Leerlauf.
 *
 * Der Waechter steht VOR der DS-1-Schranke, damit er auch fuer die Tastatur
 * gilt - dieselbe Anordnung wie bei `setRetention`.
 */
export function setPapillaLoss(toothNo: number, site: string, grade: number | null | undefined): void {
  if(!papillaSites(toothNo).includes(site)) return;
  if(!papillaLossAllowed(toothNo)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  gateToothEdit(toothNo, () => {
    const papilla = s.papillaLoss as Map<string, number>;
    if(grade === null || grade === undefined){
      if(papilla.has(site)){ papilla.delete(site); notifyStateChange(); return true; }
      return false;
    }
    if(!Number.isInteger(grade) || !VALID_PAPILLA_LOSS.has(grade)) return false;
    if(papilla.get(site) !== grade){ papilla.set(site, grade); notifyStateChange(); return true; }
    return false;
  });
}

/** Die beurteilten Papillen eines Zahns als einfaches Objekt (Seite -> Klasse),
 *  gefahrlos veraenderbar, nie ein Verweis auf den lebenden Zustand. Ein Zahn
 *  ohne Beurteilung liefert `{}`. */
export function getToothPapillaLoss(toothNo: number): Record<string, number> {
  const s = toothState.get(toothNo);
  const papilla = s?.papillaLoss as Map<string, number> | undefined;
  if(!papilla || papilla.size === 0) return {};
  return Object.fromEntries(papilla);
}

// ---- SP-perio P2b Task 3: O'Leary plaque-index (per-surface presence)
// public API. Operates on the ACTIVE-chart `toothState` alias, exactly like
// the perio-site/furcation APIs above — transparently Status/Plan dual-state
// aware. Pure data — no SVG/DOM touched, no render triggered (parity-safe:
// plaque has no chart layer yet, that's Task 4).

/**
 * Set/clear one O'Leary plaque-index surface's presence on the active
 * chart's tooth.
 *
 * - `surface` must be one of {@link VALID_PLAQUE_SURFACE} (mesial/distal/
 *   buccal/lingual — the SAME fixed set for every tooth, no per-tooth-
 *   position gating like furcation's entrances). Any other value is a
 *   silent no-op.
 * - `present` truthy adds the surface to the set (plaque present); falsy
 *   removes it (clean/not recorded).
 *
 * Fires {@link notifyStateChange} whenever it actually mutates state; never
 * on a rejected/no-op call.
 */
export function setPlaque(toothNo: number, surface: string, present: boolean): void {
  if(!VALID_PLAQUE_SURFACE.has(surface)) return;
  if(!perioAxisApplies(toothNo, "plaque")) return; // see setPerioSite
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  // DS-1: gate the mutation (see setPerioSite). Returns whether it changed so a
  // no-op edit is neither marked plan-edited nor mirrored.
  gateToothEdit(toothNo, () => {
    const plaque = s.plaque as Set<string>;
    if(present){
      if(!plaque.has(surface)){ plaque.add(surface); notifyStateChange(); return true; }
    }else{
      if(plaque.has(surface)){ plaque.delete(surface); notifyStateChange(); return true; }
    }
    return false;
  });
}

/** Read a tooth's plaque sub-record from the active chart as a PLAIN array
 *  of present surfaces, safe to mutate, never aliases live state. A tooth
 *  with no plaque surface (or never touched at all) returns `[]`. */
export function getToothPlaque(toothNo: number): string[] {
  const s = toothState.get(toothNo);
  const plaque = s?.plaque as Set<string> | undefined;
  if(!plaque || plaque.size === 0) return [];
  return Array.from(plaque);
}

// ---- Bead odontogram-wxt: cervical involvement of a filling or a caries
// lesion. The clinical rule this models is BEMA's: the cervical region is NOT
// a surface for fee purposes. The four or five regular surfaces determine the
// surface count and therefore the position tier (13a-d / 13e-h); the cervix is
// recorded as a SUFFIX on an existing surface ("vz"/"47", "lz"/"57"). So a
// single-surface vestibular filling that reaches the neck stays a
// SINGLE-surface filling, and the whole point of this axis is that it cannot
// change that number — see getFillingSurfaceCount() below, which is the count
// such a mapping consumes and which never reads this set.
//
// It is documentation and justification, not a fee item: on a repeat filling
// it is what shows that no treatment error is implied, and it carries weight
// for more-than-three-surface fillings, incisal corner build-ups and
// circumstances such as bruxism or pre-existing disease.

/** Whether cervical involvement is a meaningful statement about `surface` on
 *  this tooth: the surface must be one the cervix borders (vestibular/oral)
 *  AND must actually carry a finding — a filling, a caries lesion, or both.
 *  ONE predicate, used by the control, the tooltip and the whole-mouth summary
 *  alike, so a tolerantly-imported marker on a bare surface can never surface
 *  somewhere the control itself refuses to show it (the `crownLeakage`
 *  precedent). */
function cervicalInvolvementApplies(state: Any, surface: string): boolean {
  if(!state || !VALID_CERVICAL_SURFACES.has(surface)) return false;
  return !!state.fillingSurfaceMaterials?.has(surface) || !!state.caries?.has(`caries-${surface}`);
}

/** TEST-ONLY seam over {@link cervicalInvolvementApplies}, so the gate can be
 *  exercised against a hand-built state without a live grid. */
export function __cervicalInvolvementAppliesForTest(state: Record<string, unknown>, surface: string): boolean {
  return cervicalInvolvementApplies(state as Any, surface);
}

/** The surfaces of `toothNo` whose finding extends into the cervical region,
 *  as a plain array in the canonical surface order. Never aliases live state.
 *  Returns only surfaces the marker still APPLIES to (see
 *  {@link cervicalInvolvementApplies}) — a stored marker on a surface that has
 *  since lost its filling and its caries is dormant, not reported. */
export function getCervicalSurfaces(toothNo: number): string[] {
  const s = toothState.get(toothNo);
  const set = s?.cervicalSurfaces as Set<string> | undefined;
  if(!set || set.size === 0) return [];
  return SUMMARY_SURFACE_ORDER.filter((surf) => set.has(surf) && cervicalInvolvementApplies(s, surf));
}

/** Record (or clear) cervical involvement on one surface of one tooth.
 *
 *  A silent no-op on any surface outside {@link VALID_CERVICAL_SURFACES}, and
 *  on a surface that carries neither a filling nor caries — there is nothing
 *  for the marker to qualify. The guards run BEFORE the DS-1 gate, so a
 *  rejected call marks nothing plan-edited and fires no state-change
 *  notification (the `setPeriImplantPlaque` precedent). */
export function setCervicalInvolvement(toothNo: number, surface: string, involved: boolean): void {
  if(!VALID_CERVICAL_SURFACES.has(surface)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(!cervicalInvolvementApplies(s, surface)) return;
  gateToothEdit(toothNo, () => {
    const set = s.cervicalSurfaces as Set<string>;
    if(involved){
      if(!set.has(surface)){ set.add(surface); notifyStateChange(); return true; }
    }else{
      if(set.has(surface)){ set.delete(surface); notifyStateChange(); return true; }
    }
    return false;
  });
}

/** Bead odontogram-d1b: whether "cervical, side not documented" can be said
 *  of this tooth at all — a PRESENT natural or milk tooth. Not gated on a
 *  charted surface: the cervical filling IS often the tooth's only filling,
 *  and charly simply did not say on which side. ONE predicate for the
 *  control, the setter, the tooltip and the summary. */
function cervicalSideUnknownAllowed(state: Any): boolean {
  return !!state && (state.toothSelection === "tooth-base" || state.toothSelection === "milktooth");
}

/** The kinds (`filling`, `caries`) recorded as "cervical, side not
 *  documented" on `toothNo`, in that order; empty where the predicate refuses. */
export function getCervicalSideUnknown(toothNo: number): string[] {
  const s = toothState.get(toothNo);
  if(!cervicalSideUnknownAllowed(s)) return [];
  return CERVICAL_UNKNOWN_KINDS.filter((k) => s.cervicalSideUnknown?.has(k));
}

/** Record (or clear) "cervical, side not documented" for a filling or a
 *  caries lesion. Guards BEFORE the DS-1 gate (the `setRetention` precedent),
 *  so a refused call marks nothing plan-edited and does not notify. It is
 *  never a surface: nothing is drawn on one, and the surface count a fee
 *  mapping reads ({@link getFillingSurfaceCount}) does not see it. */
export function setCervicalSideUnknown(toothNo: number, kind: string, on: boolean): void {
  if(!VALID_CERVICAL_UNKNOWN.has(kind)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(!cervicalSideUnknownAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if(!s.cervicalSideUnknown) s.cervicalSideUnknown = new Set();
    const set = s.cervicalSideUnknown as Set<string>;
    if(on === set.has(kind)) return false;
    if(on) set.add(kind); else set.delete(kind);
    notifyStateChange();
    return true;
  });
}

/** How many surfaces the tooth's direct restoration covers — the number a
 *  BEMA/GOZ position mapping would consume to pick a tier.
 *
 *  It reads `fillingSurfaceMaterials` and NOTHING else. That is the assertion,
 *  not an implementation detail: a vestibular filling marked as reaching the
 *  cervix counts ONE, exactly as it did before the marker existed. The mapping
 *  itself is deliberately out of scope and out of this engine (project rule: no
 *  dependencies on external dental systems); this is the charting figure such
 *  a mapping needs. */
export function getFillingSurfaceCount(toothNo: number): number {
  const s = toothState.get(toothNo);
  const fsm = s?.fillingSurfaceMaterials as Map<string, string> | undefined;
  return fsm ? fsm.size : 0;
}

// ---- SP-perio PG-D Task 1: Silness-Löe Plaque Index (PI) + Löe-Silness
// Gingival Index (GI) public API. Both are per-surface GRADED (1-3) axes over
// the SAME fixed 4-surface set as O'Leary `plaque` above, but a separate
// sub-record — this coexists intentionally with `plaque` (different clinical
// instrument), never merged with it. Operates on the ACTIVE-chart `toothState`
// alias, exactly like the perio-site/furcation/plaque APIs above —
// transparently Status/Plan dual-state aware. Pure data — no SVG/DOM touched,
// no render triggered (parity-safe: neither axis has a chart layer).

/** Read one graded surface off a Map, defaulting an absent/invalid entry to 0. */
function getSurfaceGrade(map: Map<string, number>, surface: string): 0|1|2|3 {
  const g = map.get(surface);
  return (g === 1 || g === 2 || g === 3) ? g : 0;
}

/**
 * Set/clear one graded surface (PI or GI, selected by `mapKey`) on the
 * active chart's tooth, through the DS-1 gate.
 *
 * - `surface` must be one of {@link VALID_PLAQUE_SURFACE}; any other value
 *   is a silent no-op.
 * - `grade` 0 clears the surface (absence = healthy); 1/2/3 sets it; any
 *   other value (non-integer, out of range) is a silent no-op.
 *
 * Fires {@link notifyStateChange} whenever it actually mutates state; never
 * on a rejected/no-op call — `gateToothEdit`'s `applyFn` returns `false` for
 * a no-op so the DS-1 protocol never marks/mirrors a tooth that didn't change.
 */
function setSurfaceGrade(toothNo: number, mapKey: "pi"|"gi"|"mpi"|"mbi", surface: string, grade: number): void {
  if(!VALID_PLAQUE_SURFACE.has(surface)) return;
  // Bead odontogram-2vd: the capability matrix subsumes PG-E's bespoke implant
  // guard — it reports mPI/mBI on implants only and PI/GI on natural teeth
  // only, so one predicate now covers both directions (see setPerioSite).
  if(!perioAxisApplies(toothNo, mapKey)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  gateToothEdit(toothNo, () => {
    const map = s[mapKey] as Map<string, number>;
    if(grade === 0){
      if(map.has(surface)){ map.delete(surface); notifyStateChange(); return true; }
      return false;
    }
    if(grade === 1 || grade === 2 || grade === 3){
      if(map.get(surface) !== grade){ map.set(surface, grade); notifyStateChange(); return true; }
    }
    return false;
  });
}

/** Read a tooth's Silness-Löe Plaque Index grade on one surface from the
 *  active chart. Grade 0 (default) means healthy/absent — never distinct
 *  from "never charted". */
export function getPlaqueIndex(toothNo: number, surface: string): 0|1|2|3 {
  return getSurfaceGrade((toothState.get(toothNo)?.pi as Map<string, number>) ?? new Map(), surface);
}

/** Set/clear a tooth's Silness-Löe Plaque Index grade on one surface on the
 *  active chart. See {@link setSurfaceGrade} for validation/no-op semantics. */
export function setPlaqueIndex(toothNo: number, surface: string, grade: number): void {
  setSurfaceGrade(toothNo, "pi", surface, grade);
}

/** Read a tooth's Löe-Silness Gingival Index grade on one surface from the
 *  active chart. Grade 0 (default) means healthy/absent — never distinct
 *  from "never charted". */
export function getGingivalIndex(toothNo: number, surface: string): 0|1|2|3 {
  return getSurfaceGrade((toothState.get(toothNo)?.gi as Map<string, number>) ?? new Map(), surface);
}

/** Set/clear a tooth's Löe-Silness Gingival Index grade on one surface on the
 *  active chart. See {@link setSurfaceGrade} for validation/no-op semantics. */
export function setGingivalIndex(toothNo: number, surface: string, grade: number): void {
  setSurfaceGrade(toothNo, "gi", surface, grade);
}

// ---- SP-perio PG-E Task 1: peri-implant Mombelli indices (mPI/mBI) public
// API. Reuse the exact same per-surface graded machinery as PI/GI above
// (`setSurfaceGrade`), with one additional guard: mPI/mBI are implant-only —
// the setter is a silent no-op on any tooth that isn't `toothSelection ===
// "implant"` (including a never-touched tooth number, which lazily vivifies
// as a non-implant default and therefore also no-ops). See `setSurfaceGrade`
// for full validation/no-op semantics (invalid surface/grade).

/** Read a tooth's Mombelli modified Plaque Index grade on one surface from
 *  the active chart. Grade 0 (default) means healthy/absent — never distinct
 *  from "never charted". Implant-only in practice (see setter), but the
 *  getter itself is unconditional (mirrors PI/GI/every other graded axis). */
export function getPeriImplantPlaque(toothNo: number, surface: string): 0|1|2|3 {
  return getSurfaceGrade((toothState.get(toothNo)?.mpi as Map<string, number>) ?? new Map(), surface);
}

/** Set/clear a tooth's Mombelli modified Plaque Index grade on one surface on
 *  the active chart. Silent no-op unless the tooth is an implant
 *  (`toothSelection === "implant"`) — see `setSurfaceGrade` for the guard. */
export function setPeriImplantPlaque(toothNo: number, surface: string, grade: number): void {
  setSurfaceGrade(toothNo, "mpi", surface, grade);
}

/** Read a tooth's Mombelli modified sulcus Bleeding Index grade on one
 *  surface from the active chart. Grade 0 (default) means healthy/absent —
 *  never distinct from "never charted". */
export function getPeriImplantBleeding(toothNo: number, surface: string): 0|1|2|3 {
  return getSurfaceGrade((toothState.get(toothNo)?.mbi as Map<string, number>) ?? new Map(), surface);
}

/** Set/clear a tooth's Mombelli modified sulcus Bleeding Index grade on one
 *  surface on the active chart. Silent no-op unless the tooth is an implant
 *  (`toothSelection === "implant"`) — see `setSurfaceGrade` for the guard. */
export function setPeriImplantBleeding(toothNo: number, surface: string, grade: number): void {
  setSurfaceGrade(toothNo, "mbi", surface, grade);
}

// ---- SP-perio PG-D Task 2: keratinized gingiva width (KG) public API.
// A single per-tooth BUCCAL mm scalar (integer, clamped 0-15) — deliberately
// NOT per-site/per-surface, unlike pi/gi above or the 6-site perio-probing
// record. `null` = not charted, never a stored 0 (mirrors every other
// "absence means not charted" axis in this file). Operates on the ACTIVE-chart
// `toothState` alias, transparently Status/Plan dual-state aware. Interactive
// edits route through the DS-1 gate `gateToothEdit`. Pure data — no SVG/DOM
// touched, no render triggered (no svgLayer for this axis -> parity byte-
// identical).

/** Clamp an arbitrary input to an integer 0-15, or `null` for anything that
 *  isn't a finite number (including `null`/`undefined`) — used by both the
 *  setter (rejecting a non-finite EDIT as a no-op) and hydrate (tolerating a
 *  malformed/out-of-range STORED value by dropping it to null). */
function clampKg(mm: unknown): number | null {
  if(mm === null || mm === undefined) return null;
  const n = Number(mm);
  if(!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(15, Math.round(n)));
}

/** Read a tooth's keratinized gingiva width (mm) from the active chart.
 *  `null` means not charted. */
export function getKeratinizedWidth(toothNo: number): number | null {
  const v = toothState.get(toothNo)?.kg;
  return typeof v === "number" ? v : null;
}

/**
 * Set/clear a tooth's keratinized gingiva width (mm) on the active chart.
 *
 * - `mm === null` explicitly clears it (not charted).
 * - Any other value is clamped to an integer 0-15 via {@link clampKg}.
 * - A non-finite number (e.g. `NaN` from a bad keystroke) is a silent no-op
 *   — it must NOT clear an existing value, unlike an explicit `null`.
 *
 * Fires {@link notifyStateChange} whenever it actually mutates state; never
 * on a rejected/no-op call — `gateToothEdit`'s `applyFn` returns `false` for
 * a no-op so the DS-1 protocol never marks/mirrors a tooth that didn't change.
 */
export function setKeratinizedWidth(toothNo: number, mm: number | null): void {
  if(!perioAxisApplies(toothNo, "kg")) return; // see setPerioSite
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  const next = mm === null ? null : clampKg(mm);
  // non-finite number → no-op (do not clear an existing value on a bad keystroke)
  if(mm !== null && next === null) return;
  gateToothEdit(toothNo, () => {
    if(s.kg === next) return false;
    s.kg = next; notifyStateChange(); return true;
  });
}

// ---- odontogram-im1: which implant is in the tooth ----------------------
//
// A separate assertion from the fact that one is there, and one the chart could
// not make. See src/implantProduct.ts for the record and the UDI reader.
//
// Nothing here is ever required. Dirk's constraint (2026-08-11): record it when
// WE place an implant, let it stay open when the implant arrived with the
// patient, because not every patient carries an implant passport. An empty
// record is therefore a COMPLETE state, not a gap — and the engine deliberately
// does not warn about one, because it cannot yet tell the two empties apart.
// Telling them apart needs provenance, which is odontogram-ap7's axis, not a
// second flag grown here.

/** Read a tooth's implant product from the active chart. `null` means nothing
 *  is known about it — which is a legitimate answer, not a missing one. */
export function getImplantProduct(toothNo: number): ImplantProduct | null {
  const p = toothState.get(toothNo)?.implantProduct;
  return p ? { ...p } : null;
}

/**
 * Set/clear a tooth's implant product on the active chart.
 *
 * Silent no-op unless the tooth is an implant — the guard runs BEFORE the DS-1
 * gate, mirroring the Mombelli indices, so a gated call on a natural tooth
 * marks nothing and fires no state-change notification.
 *
 * The record is normalized on the way in: blanks are dropped, dimensions must
 * be positive, and the UDI is re-read so lot and expiry always agree with the
 * carrier they came from. A record that says nothing at all is stored as
 * `null`, which is how it stays out of the payload.
 */
export function setImplantProduct(toothNo: number, product: ImplantProduct | null): void {
  if(toothState.get(toothNo)?.toothSelection !== "implant") return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  const next = normalizeImplantProduct(product);
  gateToothEdit(toothNo, () => {
    if(JSON.stringify(s.implantProduct ?? null) === JSON.stringify(next)) return false;
    s.implantProduct = next; notifyStateChange(); return true;
  });
}

/** Every implant product charted in the active chart, for `knownSystems` —
 *  the list of systems a practice actually places, which is what replaces a
 *  catalogue nobody would maintain. */
export function getChartedImplantProducts(): ImplantProduct[] {
  const out: ImplantProduct[] = [];
  for(const st of toothState.values()){
    if(st?.implantProduct) out.push(st.implantProduct);
  }
  return out;
}

/** Paint the implant-product block from a tooth state, and hide it unless the
 *  tooth is an implant — the same gate `#periImplantRow` uses. */
function syncImplantProduct(state: Any): void {
  const block = $("#implantProductBlock");
  if(!block) return;
  const isImplant = state?.toothSelection === "implant";
  block.classList.toggle("hidden", !isImplant);
  if(!isImplant) return;

  const p: ImplantProduct = state.implantProduct ?? {};
  const put = (sel: string, v: unknown) => {
    const elx = $(sel) as HTMLInputElement | null;
    if(!elx) return;
    const next = v == null ? "" : String(v);
    // Never overwrite what the clinician is typing.
    if(document.activeElement !== elx && elx.value !== next) elx.value = next;
  };
  put("#implantManufacturer", p.manufacturer);
  put("#implantSystem", p.system);
  put("#implantDiameter", p.diameterMm);
  put("#implantLength", p.lengthMm);
  put("#implantUdi", p.udi);

  // What the carrier gave up, shown so a scan visibly did something.
  const bits: string[] = [];
  if(p.lot) bits.push(`${t("implantProduct.lot")}: ${p.lot}`);
  if(p.expiry) bits.push(`${t("implantProduct.expiry")}: ${p.expiry}`);
  const readout = $("#implantUdiReadout");
  if(readout) readout.textContent = bits.join("  ·  ");

  // odontogram-im1 + ap7: say so only where an empty product is actually a gap.
  const gapEl = $("#implantProductGap");
  if(gapEl){
    const gap = activeTooth != null && isImplantProductGap(activeTooth);
    gapEl.classList.toggle("hidden", !gap);
    if(gap) gapEl.textContent = t("implantProduct.gapHint");
  }

  fillDatalist("#implantManufacturerList", (x)=>x.manufacturer);
  fillDatalist("#implantSystemList", (x)=>x.system);
}

/**
 * Whether this tooth's implant product is a GAP worth surfacing — bead
 * odontogram-im1's one remaining rule, and the reason it waited for
 * odontogram-ap7.
 *
 * Two empties look alike and are not alike:
 *
 *   we placed it, nothing recorded      an INCOMPLETE record — show it
 *   it came with the patient, unknown   a COMPLETE record — nothing is missing
 *
 * Not every patient carries an implant passport (Dirk), so an empty product on
 * an implant the practice inherited is a fact, not an omission. Telling the
 * two apart needs to know WHO placed it, which is provenance, and provenance
 * is derived from the initial examination — never a second flag stored here,
 * because two places recording "who found this" would drift.
 *
 * Silent whenever provenance is genuinely unknown: with no examination
 * archived there is no baseline to judge against, and warning then would be a
 * guess dressed as a finding. That is the same silence im1 kept before ap7
 * existed, now conditioned on the archive rather than on the calendar.
 */
// ---- Bead odontogram-5rv: die Schwebebruecke und der Hinweis auf fehlende
// Pfeiler.

/** Wo "schwebend" ueberhaupt angegeben werden kann: an einem BRUECKENGLIED,
 *  also an einer Luecke, die als Bruecke gechartet ist. An einem Pfeilerzahn
 *  ist die Angabe sinnlos - er traegt, er haengt nicht. */
export function cantileverAllowed(state: Any): boolean {
  if(!state) return false;
  return state.restorationType === "bridge"
    && (state.toothSelection === "none" || state.toothSelection === "no-tooth-after-extraction");
}

/** Ein Brueckenglied als schwebend erklaeren oder die Erklaerung zuruecknehmen.
 *
 *  Der Waechter steht VOR der DS-1-Schranke, damit er auch fuer die Tastatur
 *  gilt - dieselbe Anordnung wie bei `setRetention` und `setPapillaLoss`. */
export function setCantilever(toothNo: number, value: boolean): void {
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(!cantileverAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    const neu = !!value;
    if(!!s.cantilever === neu) return false;
    s.cantilever = neu;
    notifyStateChange();
    return true;
  });
}

export function getCantilever(toothNo: number): boolean {
  return !!toothState.get(toothNo)?.cantilever;
}

/** Jede Brueckenspanne im aktiven Chart mit ihrer Lagerung. Reine Ableitung -
 *  liest nur Zustand, aendert nichts, zeichnet nichts. */
export function getBridgeSpanChecks(): BridgeSpanCheck[] {
  return checkBridgeSpans(bridgeStateFor);
}

/** Kostenplan-relevante Zusammenfassung der Brücken im aktiven Chart (Dirk,
 *  31.08.2026): Anzahl der SPANNEN, GLIEDER (pontics) und PFEILER (abutments) —
 *  reine Ableitung. Die FESTZUSCHUSS-Berechnung gehört NICHT hierher, sondern in
 *  einen nachgelagerten Dienst, der diese Struktur (via FHIR) konsumiert; die Library bleibt
 *  abrechnungs-agnostisch. */
export function getBridgeSummary(): { spans: number; pontics: number; abutments: number } {
  const checks = getBridgeSpanChecks();
  const abut = new Set<number>(), pont = new Set<number>();
  for(const c of checks){ c.abutments.forEach(a => abut.add(a)); c.pontics.forEach(p => pont.add(p)); }
  return { spans: checks.length, pontics: pont.size, abutments: abut.size };
}

/** Ob dieser Zahn zu einer Spanne gehoert, die einen Hinweis verdient - ein
 *  Glied ohne jeden Pfeiler, oder eine einseitige Lagerung, die niemand als
 *  gewollt erklaert hat. `null`, wenn es nichts zu melden gibt.
 *
 *  Der Hinweis haengt am ZAHN, nicht an der Spanne, weil die Bedienung immer
 *  einen Zahn ausgewaehlt hat und nie eine Spanne. */
export function bridgeSupportGap(toothNo: number): "unsupported" | "cantilever" | null {
  for(const check of getBridgeSpanChecks()){
    if(!check.span.includes(toothNo)) continue;
    if(!bridgeSpanNeedsAttention(check)) continue;
    return check.support === "unsupported" ? "unsupported" : "cantilever";
  }
  return null;
}

/** Die vier Fuellmaterialien, die dieses Programm kennt. Eigene Konstante statt
 *  einer Liste im Import: sie wird von der Hydration und vom Produktsetter
 *  gelesen, und zwei Listen ueber dieselbe Frage sind eine zu viel. */
const VALID_FILLING_MATERIALS = new Set(["amalgam", "composite", "gic", "temporary"]);

// ---- odontogram-99h: WELCHES Produkt in der Restauration steckt -----------
//
// Die zweite Haelfte dessen, was odontogram-im1 fuer das Implantat gebaut hat.
// `restorationMaterial` sagt die KLASSE, dieses Feld das PRODUKT - siehe
// src/restorationProduct.ts fuer den Satz und die UDI-Lesung.
//
// NICHTS DAVON IST PFLICHT. Dirk, 21.08.2026: "eine derartige Versorgung muss
// auch gueltig sein, wenn sie nicht erhoben wird. Bei einem Eingangsbefund wird
// sie mit grosser Wahrscheinlichkeit sowieso nicht zu ermitteln sein." Eine
// Krone ohne Produktangabe ist deshalb ein VOLLSTAENDIGER Befund, und die
// Ableitung unten sagt, wann das trotzdem eine Luecke ist.

/** Das Produkt eines Zahns aus dem aktiven Chart. `null` heisst, es ist nichts
 *  darueber bekannt - eine gueltige Antwort, keine fehlende. */
export function getRestorationProduct(toothNo: number): RestorationProduct | null {
  const p = toothState.get(toothNo)?.restorationProduct;
  return p ? { ...p } : null;
}

/** Ob an diesem Zahn ueberhaupt etwas steht, dem ein Produkt zugeordnet werden
 *  kann. Eigenes Praedikat statt einer Bedingung im Setter, damit Bedienung,
 *  Setter und Zusammenfassung dieselbe Frage stellen - wie bei `retentionAllowed`
 *  daneben. */
export function restorationProductAllowed(state: Any): boolean {
  const typ = String(state?.restorationType ?? "none");
  const material = String(state?.restorationMaterial ?? "none");
  return typ !== "none" && material !== "none" && !restorationRowHidden(state);
}

/**
 * Produkt setzen oder loeschen, im aktiven Chart.
 *
 * Leerlauf, solange keine Restauration dasteht - die Wache laeuft VOR dem
 * DS-1-Gatter, wie bei `setRetention` und den Mombelli-Indizes, damit ein
 * abgewiesener Aufruf nichts markiert und keine Benachrichtigung ausloest.
 *
 * `null` loescht. Der Satz wird beim Hereinkommen geradegerueckt: Leerraum weg,
 * leere Felder weg, und die UDI neu gelesen, damit Charge und Verfall nie etwas
 * anderes sagen als ihr Traeger.
 */
export function setRestorationProduct(toothNo: number, product: RestorationProduct | null): void {
  const cur = toothState.get(toothNo);
  if(!restorationProductAllowed(cur ?? defaultState())) return;
  let s = cur;
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  const next = normalizeRestorationProduct(product);
  gateToothEdit(toothNo, () => {
    if(JSON.stringify(s.restorationProduct ?? null) === JSON.stringify(next)) return false;
    s.restorationProduct = next; notifyStateChange(); return true;
  });
}

/** Jedes Restaurationsprodukt im aktiven Chart, fuer `knownProducts`/`knownLabs` -
 *  die Liste, die einen Katalog ersetzt, den niemand pflegen wuerde. */
export function getChartedRestorationProducts(): RestorationProduct[] {
  const out: RestorationProduct[] = [];
  for(const st of toothState.values()){
    if(st?.restorationProduct) out.push(st.restorationProduct);
  }
  return out;
}

/**
 * Fehlt die Produktangabe an Arbeit, die DIESE Praxis gemacht hat?
 *
 * Wortgleich zur Ueberlegung hinter `isImplantProductGap`, und aus demselben
 * Grund abgeleitet statt gespeichert: "wir haben es eingegliedert, nichts
 * notiert" ist unvollstaendig, "es kam mit dem Patienten" ist vollstaendig -
 * und welches von beiden gilt, weiss das dazu angelegte Archiv (odontogram-ap7),
 * nicht ein zweites Kennzeichen hier.
 *
 * `false`, solange es keine Eingangsuntersuchung gibt: ohne Vergleichspunkt
 * waere die Warnung geraten. Genau Dirks Fall - "bei einem Eingangsbefund wird
 * sie sowieso nicht zu ermitteln sein".
 */
/**
 * Bead odontogram-99h, zweiter Teil: das Produkt einer DIREKTEN Fuellung.
 *
 * Dirk, 21.08.2026: *"Ja, beim Komposit machen wir es der Vollstaendigkeit
 * halber mit dazu, erlauben aber, dass es fehlt."*
 *
 * JE MATERIAL, NICHT JE FLAECHE. Eine Spritze fuellt mehrere Flaechen, und ihre
 * Charge gilt fuer alle davon - `mod` ist EINE Fuellung, nicht drei. Je Flaeche
 * zu speichern hiesse, dieselbe Chargennummer dreimal zu fuehren und sie
 * dreimal auseinanderlaufen zu lassen. Umgekehrt genuegt EIN Satz je Zahn
 * nicht: ein Zahn kann mesial Komposit und distal Glasionomer tragen, und das
 * sind zwei Produkte.
 *
 * UND ES GIBT KEINEN LUECKENHINWEIS. Das ist der Unterschied zur Laborarbeit:
 * dort meldet `isRestorationProductGap`, was diese Praxis eingegliedert hat,
 * ohne etwas zu notieren. Eine Fuellung ohne Produktangabe ist dagegen nie ein
 * Mangel - "erlauben, dass es fehlt" heisst, dass niemand daran erinnert wird.
 */
export function getFillingProduct(toothNo: number, material: string): RestorationProduct | null {
  const p = toothState.get(toothNo)?.fillingProducts?.get(material);
  return p ? { ...p } : null;
}

/** Alle Produkte eines Zahns, nach Material. */
export function getFillingProducts(toothNo: number): Record<string, RestorationProduct> {
  return Object.fromEntries(toothState.get(toothNo)?.fillingProducts ?? []);
}

/** Wo ein Fuellungsprodukt ueberhaupt angegeben werden kann: das Material muss
 *  an diesem Zahn auch wirklich auf einer Flaeche liegen. */
export function fillingProductAllowed(state: Any, material: string): boolean {
  if(!VALID_FILLING_MATERIALS.has(material)) return false;
  // Nimmt die LEBENDE Form (Map) wie die serialisierte (Objekt): das Praedikat
  // ist oeffentlich, und ein Aufrufer, der eine exportierte Nutzlast in der Hand
  // hat, soll dieselbe Frage stellen duerfen wie die Bedienung.
  const fsm = state?.fillingSurfaceMaterials;
  if(!fsm) return false;
  const werte = fsm instanceof Map ? [...fsm.values()] : Object.values(fsm as Record<string, string>);
  return werte.some((mat) => mat === material);
}

/** Die Fuellmaterialien, die an diesem Zahn wirklich liegen - in fester
 *  Reihenfolge, damit die Bedienung nicht springt. */
export function fillingMaterialsOn(toothNo: number): string[] {
  const fsm = toothState.get(toothNo)?.fillingSurfaceMaterials as Map<string, string> | undefined;
  if(!fsm) return [];
  const da = new Set(fsm.values());
  return ["composite", "gic", "amalgam", "temporary"].filter((m) => da.has(m));
}

/** Setzen oder loeschen. Wache VOR dem DS-1-Gatter, wie ueberall hier. */
export function setFillingProduct(toothNo: number, material: string, product: RestorationProduct | null): void {
  const cur = toothState.get(toothNo);
  if(!fillingProductAllowed(cur ?? defaultState(), material)) return;
  let s = cur;
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  const next = normalizeRestorationProduct(product);
  gateToothEdit(toothNo, () => {
    const vorher = s.fillingProducts?.get(material) ?? null;
    if(JSON.stringify(vorher) === JSON.stringify(next)) return false;
    if(!s.fillingProducts) s.fillingProducts = new Map<string, RestorationProduct>();
    if(next) s.fillingProducts.set(material, next); else s.fillingProducts.delete(material);
    notifyStateChange();
    return true;
  });
}

/** Jedes Fuellungsprodukt im aktiven Chart - dieselbe Quelle fuer
 *  `knownProducts`/`knownLabs` wie bei der Laborarbeit, damit die Vorschlaege
 *  einer Praxis EINE Liste sind und nicht zwei. */
export function getChartedFillingProducts(): RestorationProduct[] {
  const out: RestorationProduct[] = [];
  for(const st of toothState.values()){
    for(const p of (st?.fillingProducts ?? new Map<string, RestorationProduct>()).values()) out.push(p);
  }
  return out;
}

export function isRestorationProductGap(toothNo: number): boolean {
  if(!getBaselineExamination()) return false;
  const s = toothState.get(toothNo);
  if(!restorationProductAllowed(s ?? defaultState())) return false;
  if(!isEmptyRestorationProduct(s?.restorationProduct)) return false;
  // Schon beim Eingang da => der Patient hat sie mitgebracht => vollstaendig.
  return !getPreExistingAxes(toothNo).includes("restoration");
}

export function isImplantProductGap(toothNo: number): boolean {
  if(!getBaselineExamination()) return false;         // provenance unknown
  const s = toothState.get(toothNo);
  if(s?.toothSelection !== "implant") return false;
  if(!isEmptyImplantProduct(s.implantProduct)) return false;
  // Present at intake => it arrived with the patient => complete as it stands.
  return !getPreExistingAxes(toothNo).includes("presence");
}

/** Offer what this practice has already placed, gathered from the charts. */
function fillDatalist(sel: string, pick: (p: ImplantProduct)=>string | undefined): void {
  const list = $(sel);
  if(!list) return;
  const seen = new Map<string, string>();
  for(const p of getChartedImplantProducts()){
    const v = pick(p);
    if(v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
  }
  const values = [...seen.values()].sort((a, b)=>a.localeCompare(b));
  if(list.dataset.values === values.join("\u0000")) return;
  list.dataset.values = values.join("\u0000");
  list.innerHTML = "";
  for(const v of values) list.appendChild(el("option", { value: v }));
}

/** Read the block back onto every selected implant. */
function commitImplantProduct(): void {
  const val = (sel: string) => ((($(sel) as HTMLInputElement | null)?.value) ?? "").trim();
  const num = (sel: string) => {
    const raw = val(sel);
    return raw === "" ? undefined : Number(raw.replace(",", "."));
  };
  const product: ImplantProduct = {
    manufacturer: val("#implantManufacturer") || undefined,
    system: val("#implantSystem") || undefined,
    diameterMm: num("#implantDiameter"),
    lengthMm: num("#implantLength"),
    udi: val("#implantUdi") || undefined,
  };
  for(const toothNo of selectedTeeth) setImplantProduct(Number(toothNo), product);
  const active = activeTooth ?? [...selectedTeeth][0];
  if(active != null) syncImplantProduct(toothState.get(active));
}

/** Bead odontogram-99h: den Produktblock der Restauration fuellen.
 *
 *  Wortgleich zu `syncImplantProduct` gebaut, und das ist Absicht - es ist
 *  dieselbe Aufgabe an einer anderen Achse, und zwei verschiedene Bauweisen
 *  fuer dieselbe Sache waeren zwei Stellen, an denen sie auseinanderlaufen. */
function syncRestorationProduct(state: Any): void {
  const block = $("#restorationProductBlock");
  if(!block) return;
  const erlaubt = restorationProductAllowed(state ?? defaultState());
  block.classList.toggle("hidden", !erlaubt);
  if(!erlaubt) return;

  const p: RestorationProduct = state.restorationProduct ?? {};
  const put = (sel: string, v: unknown) => {
    const elx = $(sel) as HTMLInputElement | null;
    if(!elx) return;
    const next = v == null ? "" : String(v);
    if(document.activeElement !== elx && elx.value !== next) elx.value = next;
  };
  put("#restProdManufacturer", p.manufacturer);
  put("#restProdProduct", p.product);
  put("#restProdShade", p.shade);
  put("#restProdLab", p.lab);
  put("#restProdUdi", p.udi);

  // Was der Traeger hergegeben hat, angezeigt, damit ein Scan sichtbar etwas tut.
  const bits: string[] = [];
  if(p.lot) bits.push(`${t("restorationProduct.lot")}: ${p.lot}`);
  if(p.expiry) bits.push(`${t("restorationProduct.expiry")}: ${p.expiry}`);
  const readout = $("#restProdReadout");
  if(readout) readout.textContent = bits.join("  ·  ");

  const gapEl = $("#restorationProductGap");
  if(gapEl){
    const gap = activeTooth != null && isRestorationProductGap(activeTooth);
    gapEl.classList.toggle("hidden", !gap);
    if(gap) gapEl.textContent = t("restorationProduct.gapHint");
  }

  const liste = (sel: string, pick: (x: RestorationProduct)=>string | undefined) => {
    const el2 = $(sel);
    if(!el2) return;
    const seen = new Map<string, string>();
    for(const x of getChartedRestorationProducts()){
      const v = pick(x);
      if(v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
    }
    el2.innerHTML = "";
    for(const v of [...seen.values()].sort((a, b)=>a.localeCompare(b))){
      el2.appendChild(el("option", { value: v }));
    }
  };
  liste("#restProdManufacturerList", (x)=>x.manufacturer);
  liste("#restProdProductList", (x)=>x.product);
  liste("#restProdLabList", (x)=>x.lab);
}

/** Den Block auf jede ausgewaehlte Restauration zurueckschreiben. */
function commitRestorationProduct(): void {
  const val = (sel: string) => ((($(sel) as HTMLInputElement | null)?.value) ?? "").trim();
  const product: RestorationProduct = {
    manufacturer: val("#restProdManufacturer") || undefined,
    product: val("#restProdProduct") || undefined,
    shade: val("#restProdShade") || undefined,
    lab: val("#restProdLab") || undefined,
    udi: val("#restProdUdi") || undefined,
  };
  for(const toothNo of selectedTeeth) setRestorationProduct(Number(toothNo), product);
  const active = activeTooth ?? [...selectedTeeth][0];
  if(active != null) syncRestorationProduct(toothState.get(active));
}

/** Welches Material der Fuellungs-Produktblock gerade bearbeitet. Reiner
 *  Bedienzustand - er gehoert keinem Zahn und wird nie gespeichert. */
let fillProdMaterial = "";

/** Bead odontogram-99h, zweiter Teil: den Produktblock der Fuellung fuellen. */
function syncFillingProduct(toothNo: number | null): void {
  const block = $("#fillingProductBlock");
  if(!block) return;
  const materialien = toothNo == null ? [] : fillingMaterialsOn(toothNo);
  block.classList.toggle("hidden", materialien.length === 0);
  if(materialien.length === 0 || toothNo == null){ fillProdMaterial = ""; return; }
  if(!materialien.includes(fillProdMaterial)) fillProdMaterial = materialien[0];

  const sel = $("#fillProdMaterial") as HTMLSelectElement | null;
  if(sel){
    const soll = materialien.join("|");
    if(sel.dataset.built !== soll){
      sel.innerHTML = "";
      for(const m of materialien) sel.appendChild(el("option", { value: m, text: t("filling.option." + m) }));
      sel.dataset.built = soll;
    }
    if(sel.value !== fillProdMaterial) sel.value = fillProdMaterial;
  }

  const p: RestorationProduct = getFillingProduct(toothNo, fillProdMaterial) ?? {};
  const put = (s2: string, v: unknown) => {
    const elx = $(s2) as HTMLInputElement | null;
    if(!elx) return;
    const next = v == null ? "" : String(v);
    if(document.activeElement !== elx && elx.value !== next) elx.value = next;
  };
  put("#fillProdManufacturer", p.manufacturer);
  put("#fillProdProduct", p.product);
  put("#fillProdShade", p.shade);
  put("#fillProdUdi", p.udi);

  const bits: string[] = [];
  if(p.lot) bits.push(`${t("restorationProduct.lot")}: ${p.lot}`);
  if(p.expiry) bits.push(`${t("restorationProduct.expiry")}: ${p.expiry}`);
  const readout = $("#fillProdReadout");
  if(readout) readout.textContent = bits.join("  ·  ");
}

/** Den Block auf jeden ausgewaehlten Zahn zurueckschreiben - aber nur dort, wo
 *  das gewaehlte Material wirklich liegt; `setFillingProduct` weist den Rest ab. */
function commitFillingProduct(): void {
  if(!fillProdMaterial) return;
  const val = (sel: string) => ((($(sel) as HTMLInputElement | null)?.value) ?? "").trim();
  const product: RestorationProduct = {
    manufacturer: val("#fillProdManufacturer") || undefined,
    product: val("#fillProdProduct") || undefined,
    shade: val("#fillProdShade") || undefined,
    udi: val("#fillProdUdi") || undefined,
  };
  for(const toothNo of selectedTeeth) setFillingProduct(Number(toothNo), fillProdMaterial, product);
  const active = activeTooth ?? [...selectedTeeth][0];
  if(active != null) syncFillingProduct(Number(active));
}

// ---- Bead odontogram-2vd: explicit assessment status --------------------
// Periodontal charting stores findings, not the act of looking. A site with no
// probing depth, a surface with no plaque and a tooth with mobility "none" all
// look identical to a site nobody probed, a surface nobody disclosed and a
// tooth nobody tested — yet clinically they are opposites, and a follow-up
// examination compares against them. This axis records what the value cannot:
//
//   assessed        the axis WAS examined. Either a value is stored (the usual
//                   case) or the finding is normal/negative and stores none,
//                   which is recorded explicitly here — "assessed-normal".
//   not-assessed    nobody looked. The default; never stored.
//   unmeasurable    the measurement point exists but could not be read.
//   not-applicable  the tooth has no such measurement point at all.
//
// It is deliberately a GENERIC assessment axis, not a set of renderer-invented
// clinical codes: exchange formats already model exactly this (FHIR's
// `dataAbsentReason`), and inventing a local "could not probe" finding code
// would be the renderer claiming terminology it has no authority over.
export type AssessmentStatus = "assessed" | "not-assessed" | "unmeasurable" | "not-applicable";

/** The periodontal / peri-implant axes this assessment status applies to. */
export const PERIO_ASSESSMENT_AXES = [
  "pd", "gm", "bop", "sup", "mobility", "furcation", "plaque", "pi", "gi", "mpi", "mbi", "kg",
] as const;
export type PerioAssessmentAxis = typeof PERIO_ASSESSMENT_AXES[number];

const ASSESSMENT_STATUSES = new Set<string>(["assessed", "not-assessed", "unmeasurable", "not-applicable"]);

/** What a given axis is measured AT: one of the six probing sites, one of the
 *  four index surfaces, a furcation entrance, or the tooth as a whole. */
const ASSESSMENT_AXIS_KIND: Record<PerioAssessmentAxis, "site" | "surface" | "entrance" | "tooth"> = {
  pd: "site", gm: "site", bop: "site", sup: "site",
  plaque: "surface", pi: "surface", gi: "surface", mpi: "surface", mbi: "surface",
  furcation: "entrance",
  mobility: "tooth", kg: "tooth",
};

/** The peri-implant examination includes probing depth, bleeding,
 *  suppuration, implant mobility, keratinized tissue width, and the two
 *  Mombelli indices. Everything else in {@link PERIO_ASSESSMENT_AXES} is
 *  natural-tooth-only — the gingival margin is measured against the CEJ, which
 *  an implant does not have, and plaque/PI/GI have mPI/mBI as their
 *  peri-implant equivalents. */
const IMPLANT_PERIO_AXES = new Set<string>(["pd", "bop", "sup", "mobility", "kg", "mpi", "mbi"]);

function isPerioAssessmentAxis(axis: string): axis is PerioAssessmentAxis {
  return Object.prototype.hasOwnProperty.call(ASSESSMENT_AXIS_KIND, axis);
}

/**
 * Whether a periodontal axis has a measurement point on this tooth at all — the
 * single capability matrix the assessment status, every interactive periodontal
 * setter and the full-mouth grid's enabled cells all read, so the UI can never
 * offer a measurement the domain refuses (or refuse one the domain accepts).
 *
 * The exporters deliberately do NOT consult it: serialization reports what is
 * stored, and hydration stays tolerant of foreign data, exactly like every
 * other axis in this engine. The matrix is enforced at the edit boundary.
 */
export function perioAxisApplies(toothNo: number, axis: string): boolean {
  if(!isPerioAssessmentAxis(axis)) return false;
  const s = toothState.get(toothNo);
  if(s?.toothSelection === "implant") return IMPLANT_PERIO_AXES.has(axis);
  // Missing, unerupted/under-gum and post-extraction positions have no
  // periodontium to examine at all.
  if(perioRowHidden(s)) return false;
  if(axis === "mpi" || axis === "mbi") return false;
  if(axis === "furcation") return furcationEntrances(toothNo).length > 0;
  return true;
}

/** Whether `qualifier` names a real measurement point for `axis` ON THIS TOOTH
 *  (furcation entrances are position-dependent). A per-tooth axis takes no
 *  qualifier. */
function assessmentQualifierValid(toothNo: number, axis: PerioAssessmentAxis, qualifier: string | null): boolean {
  switch(ASSESSMENT_AXIS_KIND[axis]){
    case "site": return qualifier !== null && (PERIO_SITES as readonly string[]).includes(qualifier);
    case "surface": return qualifier !== null && VALID_PLAQUE_SURFACE.has(qualifier);
    case "entrance": return qualifier !== null && furcationEntrances(toothNo).includes(qualifier);
    default: return qualifier === null || qualifier === undefined;
  }
}

function assessmentKey(axis: PerioAssessmentAxis, qualifier: string | null): string {
  return ASSESSMENT_AXIS_KIND[axis] === "tooth" ? axis : `${axis}:${qualifier}`;
}

/** Tooth-INDEPENDENT key validation for hydration (see hydrateState). */
function assessmentKeyValid(key: string): boolean {
  const at = key.indexOf(":");
  const axis = at < 0 ? key : key.slice(0, at);
  const qualifier = at < 0 ? null : key.slice(at + 1);
  if(!isPerioAssessmentAxis(axis)) return false;
  switch(ASSESSMENT_AXIS_KIND[axis]){
    case "site": return qualifier !== null && (PERIO_SITES as readonly string[]).includes(qualifier);
    case "surface": return qualifier !== null && VALID_PLAQUE_SURFACE.has(qualifier);
    case "entrance": return qualifier !== null && VALID_FURCATION_ENTRANCE.has(qualifier);
    default: return qualifier === null;
  }
}

/** Whether the axis actually holds a charted value at that measurement point —
 *  the strongest possible evidence that it was assessed.
 *
 *  Bleeding and suppuration are the one place where "holds a value" is not the
 *  same as "is in the set": both are membership-only Sets over a site that was
 *  PROBED, and probing depth is the charting key for that site. The rest of the
 *  engine already reads them that way — `getPerioSummary()` divides bleeding
 *  sites by CHARTED sites, so a charted site with no bleeding entry counts as an
 *  assessed negative — and so does the FHIR export, which emits an explicit
 *  `false` for every charted site. Resolving them from the set alone here would
 *  have made this axis contradict both. */
function assessmentValuePresent(s: Any, axis: PerioAssessmentAxis, qualifier: string | null): boolean {
  if(!s) return false;
  switch(axis){
    case "pd": return s.perio?.pd?.has(qualifier) ?? false;
    case "gm": return s.perio?.gm?.has(qualifier) ?? false;
    case "bop": case "sup": return s.perio?.pd?.has(qualifier) ?? false;
    case "plaque": return s.plaque?.has(qualifier) ?? false;
    case "furcation": return s.furcation?.has(qualifier) ?? false;
    case "pi": case "gi": case "mpi": case "mbi": return (s[axis] as Map<string, number> | undefined)?.has(qualifier as string) ?? false;
    case "mobility": return typeof s.mobility === "string" && s.mobility !== "none";
    case "kg": return s.kg !== null && s.kg !== undefined;
    default: return false;
  }
}

/**
 * Resolve one axis's assessment status on the active chart, in this order:
 *
 * 1. the tooth has no such measurement point -> `not-applicable`;
 * 2. a value is charted there -> `assessed`;
 * 3. an explicitly recorded status (assessed-normal / unmeasurable /
 *    not-applicable) -> that status;
 * 4. otherwise -> `not-assessed`.
 *
 * Structure therefore beats a stored status, and an actual measurement beats a
 * recorded gap — a chart can never claim a tooth was unmeasurable at a point
 * where it holds a measurement.
 */
export function getAssessmentStatus(toothNo: number, axis: string, qualifier: string | null = null): AssessmentStatus {
  if(!isPerioAssessmentAxis(axis)) return "not-applicable";
  if(!perioAxisApplies(toothNo, axis)) return "not-applicable";
  if(!assessmentQualifierValid(toothNo, axis, qualifier)) return "not-applicable";
  const s = toothState.get(toothNo);
  if(assessmentValuePresent(s, axis, qualifier)) return "assessed";
  const stored = (s?.assessment as Map<string, AssessmentStatus> | undefined)?.get(assessmentKey(axis, qualifier));
  return stored ?? "not-assessed";
}

/**
 * Record an axis's assessment status on the active chart. `"not-assessed"`
 * clears the record (it is the default and is never stored). An unknown axis,
 * status, or measurement point — and any axis the tooth does not have — is a
 * silent no-op, exactly like every other per-tooth setter here. Routes through
 * the DS-1 status/plan gate, so it participates in the dual-state model like
 * any other clinical edit.
 */
export function setAssessmentStatus(
  toothNo: number, axis: string, qualifier: string | null, status: AssessmentStatus,
): void {
  if(!ASSESSMENT_STATUSES.has(status)) return;
  if(!isPerioAssessmentAxis(axis)) return;
  if(!perioAxisApplies(toothNo, axis)) return;
  if(!assessmentQualifierValid(toothNo, axis, qualifier)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  const key = assessmentKey(axis, qualifier);
  gateToothEdit(toothNo, () => {
    const map = s.assessment as Map<string, AssessmentStatus>;
    if(status === "not-assessed"){
      if(map.has(key)){ map.delete(key); notifyStateChange(); return true; }
      return false;
    }
    if(map.get(key) === status) return false;
    map.set(key, status);
    notifyStateChange();
    return true;
  });
}

/**
 * Bead odontogram-vnt: whether the axis already holds a charted value at that
 * measurement point — the one case where recording a status would contradict
 * the record itself, since {@link getAssessmentStatus} resolves a measurement
 * ahead of any stored status. The authoring UI reads this to LOCK the control
 * there rather than offer a click whose result the domain would discard.
 *
 * Read-only and derived: it adds no storage and no new value; it is the same
 * `assessmentValuePresent` rule the resolver uses, exposed instead of
 * re-derived per axis in the view. `false` for an axis the tooth does not have
 * or a measurement point it does not own — there is no value there to protect.
 */
export function isAssessmentCharted(toothNo: number, axis: string, qualifier: string | null = null): boolean {
  if(!isPerioAssessmentAxis(axis)) return false;
  if(!perioAxisApplies(toothNo, axis)) return false;
  if(!assessmentQualifierValid(toothNo, axis, qualifier)) return false;
  return assessmentValuePresent(toothState.get(toothNo), axis, qualifier);
}

/** Every explicitly recorded assessment status on this tooth, keyed `axis` or
 *  `axis:qualifier`. A plain detached object; `{}` when nothing was recorded. */
export function getToothAssessments(toothNo: number): Record<string, AssessmentStatus> {
  const map = toothState.get(toothNo)?.assessment as Map<string, AssessmentStatus> | undefined;
  if(!map || map.size === 0) return {};
  return Object.fromEntries(map);
}

/** Bead odontogram-vnt: the localized name of ONE measurement point — the
 *  index plus, for every axis that is not per-tooth, the site / surface /
 *  furcation entrance it was measured at. Reuses the exact same `t(...)` keys
 *  the perio chart labels its own rows and cells with. */
function assessmentPointLabel(axis: PerioAssessmentAxis, qualifier: string | null): string {
  const index = t(PERIO_INDEX_LABEL_KEYS[axis]);
  switch(ASSESSMENT_AXIS_KIND[axis]){
    case "site": return `${index} (${t(`perio.site.${qualifier}`)})`;
    case "surface": return `${index} (${t(`surface.${qualifier}`)})`;
    case "entrance": return `${index} (${t(`furcation.entrance.${qualifier}`)})`;
    default: return index;
  }
}

/** The order recorded statuses are reported in. `"not-assessed"` is the
 *  default and is never stored, so it is never reported. */
const REPORTED_ASSESSMENT_STATUSES: readonly AssessmentStatus[] = ["assessed", "unmeasurable", "not-applicable"];

/**
 * Bead odontogram-vnt: every measurement point on one tooth whose assessment
 * status is worth SAYING — a recorded status on a point that holds no value.
 *
 * A point that holds a measurement is deliberately excluded: the value is
 * already shown, {@link getAssessmentStatus} resolves it to `"assessed"`
 * regardless of what was recorded, and repeating that in prose would only
 * restate the number next to it. What is left is exactly what the values
 * cannot express — examined and normal, could not be measured, no such
 * measurement point.
 *
 * Reads through {@link getAssessmentStatus}, so the capability matrix gates
 * this exactly as it gates the control: a tooth whose axis the UI refuses to
 * author can never surface a status here either, however tolerant the import
 * that carried it was.
 */
function assessmentSummaryEntries(toothNo: number): { status: AssessmentStatus; label: string }[] {
  const recorded = toothState.get(toothNo)?.assessment as Map<string, AssessmentStatus> | undefined;
  if(!recorded || recorded.size === 0) return [];
  const entries: { status: AssessmentStatus; label: string }[] = [];
  for(const axis of PERIO_ASSESSMENT_AXES){
    const qualifiers: (string | null)[] =
      ASSESSMENT_AXIS_KIND[axis] === "site" ? [...PERIO_SITES] :
      ASSESSMENT_AXIS_KIND[axis] === "surface" ? [...VALID_PLAQUE_SURFACE] :
      ASSESSMENT_AXIS_KIND[axis] === "entrance" ? furcationEntrances(toothNo) :
      [null];
    for(const qualifier of qualifiers){
      if(!recorded.has(assessmentKey(axis, qualifier))) continue;
      if(isAssessmentCharted(toothNo, axis, qualifier)) continue;
      const status = getAssessmentStatus(toothNo, axis, qualifier);
      if(status === "not-assessed") continue;
      entries.push({ status, label: assessmentPointLabel(axis, qualifier) });
    }
  }
  return entries;
}

/** Bead odontogram-vnt: the tooltip lines for one tooth — one line per
 *  recorded status, listing the measurement points it was recorded at
 *  ("Assessment – unmeasurable: PD (Mesio-buccal), Furcation (Buccal)").
 *  Grouped by status rather than one line per point, so a full-mouth review
 *  pass does not bury the rest of the tooltip. */
function assessmentSummaryLines(toothNo: number): string[] {
  const entries = assessmentSummaryEntries(toothNo);
  if(entries.length === 0) return [];
  const lines: string[] = [];
  for(const status of REPORTED_ASSESSMENT_STATUSES){
    const points = entries.filter((entry) => entry.status === status).map((entry) => entry.label);
    if(points.length === 0) continue;
    lines.push(t("assessment.line", { status: t(`assessment.status.${status}`), points: points.join(", ") }));
  }
  return lines;
}

/** Bead odontogram-vnt: the whole-mouth fragment appended to
 *  {@link getOdontogramSummary}'s `periodontalText` — a per-status count over
 *  the active chart ("Assessment: assessed (normal) 2 · unmeasurable 1").
 *  `""` (nothing appended) when no tooth carries a reportable status, so a
 *  chart that never used this axis reads byte-identical to before. */
function assessmentSummaryFragment(): string {
  const counts = new Map<AssessmentStatus, number>();
  for(const toothNo of ALL_TEETH){
    for(const entry of assessmentSummaryEntries(toothNo)){
      counts.set(entry.status, (counts.get(entry.status) ?? 0) + 1);
    }
  }
  const parts = REPORTED_ASSESSMENT_STATUSES
    .filter((status) => (counts.get(status) ?? 0) > 0)
    .map((status) => `${t(`assessment.status.${status}`)} ${counts.get(status)}`);
  return parts.length === 0 ? "" : `${t("assessment.label")}: ${parts.join(" · ")}`;
}

// ---- SP-perio PG-C Task 2: cejVisibility + rootConcavity public API.
// Two per-tooth categorical DATA axes (data + registry + FHIR + payload only;
// the Dental Chart rows/UI are PG-C Task 3). Both operate on the ACTIVE-chart
// `toothState` alias like the perio/furcation/plaque APIs above — transparently
// Status/Plan dual-state aware. Interactive per-tooth edits, so they route
// through the DS-1 gate `gateToothEdit` exactly like setFurcation/setPlaque.
// Pure data — no SVG/DOM touched, no render triggered (neither axis has a chart
// layer: NO svgLayer → parity byte-identical).

/**
 * Set a tooth's CEJ-visibility on the active chart. `value` must be one of
 * {@link VALID_CEJ_VISIBILITY} (none | detectable | not-detectable); anything
 * else is a silent no-op (state unchanged). Fires {@link notifyStateChange}
 * only when it actually changes state; never on a rejected/no-op call.
 */
/** Ob dieser Zahn eine Wurzel hat, die brechen kann.
 *
 *  Ein Wurzelrest ZAEHLT - er ist Wurzel und sonst nichts, und gerade dort ist
 *  eine Laengsfraktur die Frage. Deshalb haengt es an der Anwesenheit eines
 *  natuerlichen Zahns, nicht am Substrat. Ein Implantat hat keine Wurzel; was
 *  dort bricht, ist ein Fabrikteil und ein anderer Befund. */
export function rootFractureAllowed(state: Any): boolean {
  const sel = state?.toothSelection;
  return sel === "tooth-base" || sel === "milktooth";
}

/** Ob an diesem Zahn ein resektives Verfahren ueberhaupt moeglich ist.
 *
 *  Nur an einem MEHRWURZELIGEN Zahn - eine Hemisektion an einem Einwurzler ist
 *  keine Behandlung, sondern eine Extraktion. Gemessen wird das an
 *  `furcationEntrances(toothNo)`: die Tabelle steht schon da, sie ist
 *  positionsbasiert, und "hat eine Furkation" ist genau dasselbe wie "hat mehr
 *  als eine Wurzel". Zwei Tabellen fuer dieselbe Frage waeren zwei Tabellen,
 *  die auseinanderlaufen koennen. */
export function rootResectionAllowed(state: Any, toothNo: number): boolean {
  const sel = state?.toothSelection;
  if(sel !== "tooth-base" && sel !== "milktooth") return false;
  return furcationEntrances(toothNo).length > 0;
}

/**
 * Bead odontogram-t6y: die Wurzelfraktur.
 *
 * `brokenMesial`/`brokenIncisal`/`brokenDistal` meinen die KRONE. Laengs oder
 * quer ist hier der Unterschied, der zaehlt: die Laengsfraktur ist der
 * Extraktionsgrund, die Querfraktur kann je nach Hoehe erhalten werden.
 */
/** Bead odontogram-0n8: wo ein Durchbruchsstand ueberhaupt abzustufen ist.
 *
 *  Ein VORHANDENER natuerlicher Zahn - bleibend oder Milchzahn. Nicht am
 *  Implantat (ein Fabrikteil bricht nicht durch), nicht an einer Luecke, und
 *  ausdruecklich NICHT an `not-erupted`: das heisst, dass gar nichts zu sehen
 *  ist, und diese Achse stuft ab, was zu sehen IST. Die beiden ueberschneiden
 *  sich damit nicht - eine Frage, zwei Werte, aber kein Wert an zwei Orten.
 *
 *  Die Leiter liest sich: `not-erupted` -> emerging -> half-crown ->
 *  full-crown -> `none` (in Okklusion). */
export function eruptionAllowed(state: Any): boolean {
  if(!state) return false;
  const sel = state.toothSelection;
  return sel === "tooth-base" || sel === "milktooth";
}

/** Den Durchbruchsstand setzen. Der Waechter steht VOR der DS-1-Schranke,
 *  damit er auch fuer die Tastatur gilt. */
export function setEruptionStage(toothNo: number, value: string): void {
  if(!VALID_ERUPTION_STAGE.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(value !== "none" && !eruptionAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if(s.eruptionStage === value) return false;
    s.eruptionStage = value;
    notifyStateChange();
    return true;
  });
}

export function getEruptionStage(toothNo: number): string {
  return (toothState.get(toothNo)?.eruptionStage as string) ?? "none";
}

export function setRootFracture(toothNo: number, value: string, root = ""): void {
  if(!VALID_ROOT_FRACTURE.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(value !== "none" && !rootFractureAllowed(s)) return;
  // Die Wurzel muss es an DIESER Position geben. Ein Einwurzler nimmt keine
  // Angabe an - dort gibt es nichts zu unterscheiden.
  //
  // Und an einem MEHRWURZELIGEN Zahn wird sie VORBELEGT, statt leer zu bleiben:
  // eine Fraktur sitzt in EINER Wurzel, und "nicht angegeben" hiesse beim
  // Zeichnen "Mitte" - bei einem unteren Molaren also zwischen den Wurzeln, wo
  // gar keine ist. Genau das hat Dirk am 20.08.2026 gesehen. Die Vorbelegung
  // ist am Bild sofort sichtbar und mit einem Griff zu berichtigen; nichts zu
  // zeichnen ist es nicht.
  const wurzeln = rootsOf(toothNo);
  const neueWurzel = value === "none" ? ""
    : (wurzeln.includes(root) ? root : (wurzeln[0] ?? ""));
  gateToothEdit(toothNo, () => {
    if(s.rootFracture === value && s.rootFractureRoot === neueWurzel) return false;
    s.rootFracture = value;
    s.rootFractureRoot = neueWurzel;
    notifyStateChange();
    return true;
  });
}

/** Welche Wurzel die Fraktur traegt; "" bei einem Einwurzler oder solange es
 *  nicht gesagt ist. */
export function getRootFractureRoot(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.rootFractureRoot as string) ?? "";
}

/** Liest die Wurzelfraktur aus dem aktiven Chart. */
export function getRootFracture(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.rootFracture as string) ?? "none";
}

/**
 * Bead odontogram-ca0: Hemisektion, Wurzelamputation, Praemolarisierung.
 *
 * EINE Achse fuer alle drei, weil sie einander ausschliessen und weil die
 * Abgrenzung sonst nirgends stuende. NICHT dasselbe wie `endoResection`: das
 * ist die Wurzelspitzenresektion, dort wird die Spitze gekappt und der Zahn
 * bleibt ganz - hier wird er geteilt.
 */
export function setRootResection(toothNo: number, value: string, root = ""): void {
  if(!VALID_ROOT_RESECTION.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(value !== "none" && !rootResectionAllowed(s, toothNo)) return;
  const wurzeln = rootsOf(toothNo);
  // Bei der Praemolarisierung wird KEINE Wurzel entfernt - beide Haelften
  // bleiben stehen. Eine Angabe waere dort schlicht falsch.
  //
  // Bei den anderen beiden wird sie VORBELEGT: eine Hemisektion entfernt eine
  // Wurzel, "nicht angegeben" ist also kein Zustand, sondern eine
  // unvollstaendige Eingabe - und das Bild zeigte dann gar nichts, was wie ein
  // Fehler aussieht (Dirk, 20.08.2026: "Hemisection 37 not visible").
  const nimmtWurzel = value === "hemisection" || value === "amputation";
  const neueWurzel = !nimmtWurzel ? ""
    : (wurzeln.includes(root) ? root : (wurzeln[0] ?? ""));
  gateToothEdit(toothNo, () => {
    if(s.rootResection === value && s.rootResectionRoot === neueWurzel) return false;
    s.rootResection = value;
    s.rootResectionRoot = neueWurzel;
    notifyStateChange();
    return true;
  });
}

/** Die ENTFERNTE Wurzel; "" bei der Praemolarisierung und solange es nicht
 *  gesagt ist. */
export function getRootResectionRoot(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.rootResectionRoot as string) ?? "";
}

/** Liest das resektive Verfahren aus dem aktiven Chart. */
export function getRootResection(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.rootResection as string) ?? "none";
}

/** Ob an diesem Zahn ueberhaupt eine Pulpapruefung sinnvoll ist.
 *
 *  Ein Implantat hat keine Pulpa, eine Luecke auch nicht. Ein Wurzelrest
 *  dagegen SCHON - man prueft ihn, und das Ergebnis ist ein Befund. Deshalb
 *  haengt es an der ANWESENHEIT eines natuerlichen Zahns, nicht am Substrat. */
export function sensibilityAllowed(state: Any): boolean {
  const sel = state?.toothSelection;
  return sel === "tooth-base" || sel === "milktooth";
}

/** Perkussion geht weiter als die Sensibilitaet: ein Implantat laesst sich
 *  klopfen, und Klopfempfindlichkeit ist dort ein periimplantaeres Zeichen. */
export function percussionAllowed(state: Any): boolean {
  const sel = state?.toothSelection;
  return sel === "tooth-base" || sel === "milktooth" || sel === "implant";
}

/**
 * Bead odontogram-fu1: das Ergebnis der Sensibilitaetspruefung.
 *
 * `none` heisst NICHT GEPRUEFT. Wer "geprueft und vital" meint, waehlt `vital`.
 * Diese Unterscheidung ist dieselbe, auf der der ganze parodontale Teil
 * besteht, und sie ist der Grund, warum es die Achse gibt: `pulpDx` trug bisher
 * die Benennung, aber nirgends stand, ob je jemand geprueft hat.
 *
 * Die Sperre steht VOR dem DS-1-Gate, wie bei `setRetention`: ein tolerant
 * importierter Wert an einem Implantat wird gespeichert, aber nicht
 * beschreibbar - und ueberall dort unsichtbar, wo die Bedienung ihn ablehnt.
 */
export function setSensibility(toothNo: number, value: string): void {
  if(!VALID_SENSIBILITY.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(value !== "none" && !sensibilityAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if(s.sensibility === value) return false;
    s.sensibility = value;
    notifyStateChange();
    return true;
  });
}

/** KFO: an welcher Flaeche das Bracket klebt. Nur sinnvoll mit Bracket. */
export function orthoBracketSideAllowed(state: Any): boolean {
  return orthoAllowed(state) && state?.orthoAppliance === "bracket";
}

/** Setzt die Bracket-Seite (buccal | lingual). Sperre VOR dem DS-1-Gate. */
export function setOrthoBracketSide(toothNo: number, value: string): void {
  if(!VALID_ORTHO_BRACKET_SIDE.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(value !== "buccal" && !orthoBracketSideAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if((s.orthoBracketSide ?? "buccal") === value) return false;
    s.orthoBracketSide = value;
    notifyStateChange();
    return true;
  });
}

/** Liest die Bracket-Seite aus dem aktiven Chart. */
export function getOrthoBracketSide(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.orthoBracketSide as string) ?? "buccal";
}

/** Liest die Sensibilitaetspruefung aus dem aktiven Chart. */
export function getSensibility(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.sensibility as string) ?? "none";
}

/**
 * Bead odontogram-fu1: die Perkussionspruefung.
 *
 * EIGENE Achse neben der Sensibilitaet, nicht ein Wert davon: ein vitaler Zahn
 * kann perkussionsempfindlich sein. Und `negative` ist ein eigener Wert, weil
 * geprueft und nicht klopfempfindlich ein Befund ist - genau der, an dem die
 * AAE symptomatische von asymptomatischer apikaler Parodontitis unterscheidet.
 */
export function setPercussion(toothNo: number, value: string): void {
  if(!VALID_PERCUSSION.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(value !== "none" && !percussionAllowed(s)) return;
  gateToothEdit(toothNo, () => {
    if(s.percussion === value) return false;
    s.percussion = value;
    notifyStateChange();
    return true;
  });
}

/** Liest die Perkussionspruefung aus dem aktiven Chart. */
export function getPercussion(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.percussion as string) ?? "none";
}

export function setCejVisibility(toothNo: number, value: string): void {
  if(!VALID_CEJ_VISIBILITY.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  // DS-1: gate the mutation (see setFurcation/setPlaque). Returns whether it
  // changed so a no-op edit is neither marked plan-edited nor mirrored.
  gateToothEdit(toothNo, () => {
    if(s.cejVisibility === value) return false;
    s.cejVisibility = value;
    notifyStateChange();
    return true;
  });
}

/** Read a tooth's CEJ-visibility from the active chart. A tooth never touched
 *  (or with the default) returns "none". */
export function getCejVisibility(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.cejVisibility as string) ?? "none";
}

/**
 * Set a tooth's root-concavity on the active chart. `value` must be one of
 * {@link VALID_ROOT_CONCAVITY} (none | mild | deep); anything else is a silent
 * no-op (state unchanged). Fires {@link notifyStateChange} only when it
 * actually changes state; never on a rejected/no-op call.
 */
export function setRootConcavity(toothNo: number, value: string): void {
  if(!VALID_ROOT_CONCAVITY.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  gateToothEdit(toothNo, () => {
    if(s.rootConcavity === value) return false;
    s.rootConcavity = value;
    notifyStateChange();
    return true;
  });
}

/** Read a tooth's root-concavity from the active chart. A tooth never touched
 *  (or with the default) returns "none". */
export function getRootConcavity(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.rootConcavity as string) ?? "none";
}

// ---- SP-perio PG-D Task 3: gingivalThickness + millerClass public API.
// Two per-tooth categorical DATA axes (data + registry + FHIR + payload only;
// the Dental Chart rows/UI land in later PG-D tasks). Both operate on the
// ACTIVE-chart `toothState` alias like the cejVisibility/rootConcavity APIs
// above — transparently Status/Plan dual-state aware. Interactive per-tooth
// edits, so they route through the DS-1 gate `gateToothEdit`. Pure data — no
// SVG/DOM touched, no render triggered (neither axis has a chart layer: NO
// svgLayer → parity byte-identical).

/**
 * Set a tooth's gingival-thickness on the active chart. `value` must be one
 * of {@link VALID_GINGIVAL_THICKNESS} (unknown | thin | medium | thick);
 * anything else is a silent no-op (state unchanged). Fires
 * {@link notifyStateChange} only when it actually changes state; never on a
 * rejected/no-op call.
 */
export function setGingivalThickness(toothNo: number, value: string): void {
  if(!VALID_GINGIVAL_THICKNESS.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  gateToothEdit(toothNo, () => {
    if(s.gingivalThickness === value) return false;
    s.gingivalThickness = value;
    notifyStateChange();
    return true;
  });
}

/** Read a tooth's gingival-thickness from the active chart. A tooth never
 *  touched (or with the default) returns "unknown". */
export function getGingivalThickness(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.gingivalThickness as string) ?? "unknown";
}

/**
 * Set a tooth's Miller recession class on the active chart. `value` must be
 * one of {@link VALID_MILLER_CLASS} (none | i | ii | iii | iv); anything else
 * is a silent no-op (state unchanged). Fires {@link notifyStateChange} only
 * when it actually changes state; never on a rejected/no-op call.
 */
export function setMillerClass(toothNo: number, value: string): void {
  if(!VALID_MILLER_CLASS.has(value)) return;
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  gateToothEdit(toothNo, () => {
    if(s.millerClass === value) return false;
    s.millerClass = value;
    notifyStateChange();
    return true;
  });
}

/** Read a tooth's Miller recession class from the active chart. A tooth never
 *  touched (or with the default) returns "none". */
export function getMillerClass(toothNo: number): string {
  const s = toothState.get(toothNo);
  return (s?.millerClass as string) ?? "none";
}

/** Derive Clinical Attachment Level (CAL = pd + gm, gm signed and defaulting
 *  to 0) for every CHARTED site of a tooth on the active chart. CAL is never
 *  stored — this is the single source of truth for it. A site absent from
 *  `pd` (not charted) has NO entry in the returned Map (not a 0). */
export function getToothCal(toothNo: number): Map<string, number> {
  const cal = new Map<string, number>();
  const s = toothState.get(toothNo);
  if(!s || !s.perio) return cal;
  for(const [site, pd] of s.perio.pd as Map<string, number>){
    cal.set(site, pd + ((s.perio.gm as Map<string, number>).get(site) ?? 0));
  }
  return cal;
}

/** Cairo RT1 interproximal-CAL "approximately zero" threshold, in mm (SP-perio
 *  PG-C Task 1 — see {@link getToothRecessionType}). Below this the
 *  interproximal papilla is considered clinically intact (no measurable
 *  attachment loss). Small, explicit, and tunable by a maintainer — Cairo
 *  2011 does not itself prescribe a numeric epsilon for "zero". */
const CAIRO_RT1_INTERPROX_THRESHOLD_MM = 1;

/** Cairo (2011) gingival-recession TYPE — RT1/RT2/RT3 — or `"none"`. */
export type RecessionType = "none" | "rt1" | "rt2" | "rt3";

/**
 * SP-perio PG-C Task 1: the Cairo 2011 recession-TYPE classification,
 * DERIVED purely from the already-charted per-site CAL ({@link getToothCal})
 * plus the buccal gingival margin (`perio.gm.get("B")`) — never stored, no
 * new state/payload/FHIR axis (parity byte-identical). Pure + read-only:
 * this is the single source of truth for a tooth's RT, mirroring how
 * {@link getToothCal} is the single source of truth for CAL.
 *
 * Cairo classifies BUCCAL recession by comparing it to the WORSE (deeper) of
 * the two adjacent interproximal (mesio-/disto-buccal) attachment losses:
 *   - `"none"`: no buccal recession — `gm.B` is <= 0 (the margin is at/
 *     coronal to the CEJ, i.e. a pseudopocket, not recession) OR the buccal
 *     site simply isn't charted (`gm.B` undefined). Absence is treated the
 *     same as "no recession", not "unknown", since RT is a display-only
 *     derivation with no "uncharted" state of its own to represent.
 *   - `"rt1"`: buccal recession present, but the interproximal CAL
 *     (`max(CAL[MB], CAL[DB])`) is below {@link CAIRO_RT1_INTERPROX_THRESHOLD_MM}
 *     — essentially no interproximal attachment/papilla loss. An uncharted
 *     MB/DB site contributes `0` to that max (the most conservative/least
 *     severe reading), so "buccal recession + nothing charted
 *     interproximally" also reads as RT1.
 *   - `"rt2"`: interproximal CAL loss is <= the buccal CAL loss — the
 *     papilla still reaches (or nearly reaches) the contact point.
 *   - `"rt3"`: interproximal CAL loss EXCEEDS the buccal CAL loss — severe
 *     papilla loss, apical to the buccal margin.
 */
export function getToothRecessionType(toothNo: number): RecessionType {
  const s = toothState.get(toothNo);
  if(!s || !s.perio) return "none";
  const gmB = (s.perio.gm as Map<string, number>).get("B");
  if(gmB === undefined || gmB <= 0) return "none";
  const cal = getToothCal(toothNo);
  const buccal = cal.get("B") ?? 0;
  const interprox = Math.max(cal.get("MB") ?? 0, cal.get("DB") ?? 0);
  if(interprox < CAIRO_RT1_INTERPROX_THRESHOLD_MM) return "rt1";
  if(interprox <= buccal) return "rt2";
  return "rt3";
}

/**
 * Whole-mouth periodontal summary over the active chart: total charted
 * sites, how many bled on probing, the derived %BOP, and the single worst
 * (deepest) CAL reading with the tooth it's on, plus the deepest raw pocket
 * depth recorded anywhere. `%BOP = bleedingSites / chartedSites` — a site
 * flagged `bop` without ever being charted can't exist (see setPerioSite()),
 * so this ratio can never exceed 100%. Returns zeros/nulls (never `NaN`)
 * when nothing has been charted anywhere.
 *
 * `maxFurcation` (SP-perio P2b Task 2): the single highest Glickman grade
 * (1-4) recorded on ANY furcation entrance anywhere in the mouth, `null`
 * when nothing has been graded. Deliberately its own pass over `ALL_TEETH`
 * (not folded into the pd-site loop above) since a tooth can carry furcation
 * data independently of whether it has any charted perio site.
 *
 * `plaquePercent` (SP-perio P2b Task 3): whole-mouth O'Leary Plaque Index —
 * `(total plaque surfaces charted across present teeth) / (present-teeth *
 * 4) * 100`, one decimal (same rounding as `bopPercent` above), `0` when
 * there are no present teeth (NOT `null` — matches `bopPercent`'s
 * zero-not-null convention, unlike `avgPd`/`avgCal`). "Present" here means a
 * REAL tooth in the mouth — `toothSelection` is neither `"none"` (missing)
 * nor `"implant"` — deliberately the SAME predicate `isToothPresent()` uses
 * (O'Leary is a tooth-focused index: a missing tooth has no surfaces to
 * chart, an implant has no natural tooth surface). This is intentionally
 * looser than `perioRowHidden()` (which additionally excludes under-gum/
 * extraction-socket teeth, since THOSE have no probeable periodontal
 * pocket) — an under-gum or extraction-socket "tooth" still occupies a slot
 * in the arch and can carry visible/recorded plaque on the socket/gum
 * surface, so it still counts toward the denominator here. Deliberately its
 * own pass over `ALL_TEETH` (not folded into the pd-site loop above) since a
 * tooth can carry plaque data independently of whether it has any charted
 * perio site, mirroring `maxFurcation` above. A tooth never touched at all
 * (no entry in the active chart map) is skipped entirely, same convention
 * `maxFurcation`'s loop and `getOdontogramSummary()` use.
 *
 * SP-perio PG-D Task 5 additions (own pass over `ALL_TEETH`, same "absence =
 * not charted" convention as `maxFurcation`/`plaquePercent` above):
 *   - `piScore`/`giScore`: mean of ALL charted PI/GI surface grades across
 *     the whole mouth (sum of grades / number of CHARTED surfaces, one
 *     decimal) — `null` when nothing is charted anywhere (mirrors
 *     `avgPd`/`avgCal`'s null-when-none, NOT `bopPercent`/`plaquePercent`'s
 *     zero-when-none, since a 0 mean would misleadingly read as "all
 *     surfaces charted healthy").
 *   - `kgDeficientTeeth`: count of teeth with a charted `kg` narrower than
 *     2mm (`kg != null && kg < 2`) — an uncharted tooth (`kg === null`) is
 *     never counted.
 *   - `gtDistribution`/`millerDistribution`: per-value counts across the
 *     whole mouth, excluding the "not charted" skip value (`unknown`/
 *     `none` respectively) — mirrors how `maxFurcation`'s loop only counts
 *     graded entrances.
 *
 * SP-perio PG-E Task 3 addition (own pass, same convention):
 *   - `mpiScore`/`mbiScore`: mean of ALL charted mPI/mBI surface grades
 *     across implant teeth (sum of grades / number of CHARTED surfaces, one
 *     decimal) — `null` when nothing is charted anywhere, mirrors
 *     `piScore`/`giScore` exactly. mPI/mBI are implant-only axes (the setter
 *     is a no-op on a non-implant tooth), so guarding the accumulator on
 *     `s.toothSelection === "implant"` is belt-and-suspenders — a
 *     non-implant tooth's `mpi`/`mbi` maps can never be non-empty — but
 *     makes the implant-only intent explicit at the read site too.
 */
export function getPerioSummary(): {
  chartedSites: number; bleedingSites: number; bopPercent: number;
  worstCal: number | null; worstCalTooth: number | null; maxPd: number | null;
  avgPd: number | null; avgCal: number | null; maxFurcation: number | null;
  plaquePercent: number;
  piScore: number | null; giScore: number | null; kgDeficientTeeth: number;
  gtDistribution: { thin: number; medium: number; thick: number };
  millerDistribution: { i: number; ii: number; iii: number; iv: number };
  // SP-perio PG-E Task 3: mPI/mBI whole-mouth mean, implant-only — mirrors
  // piScore/giScore's mean-of-charted-grades definition above.
  mpiScore: number | null; mbiScore: number | null;
  // Bead odontogram-gry: die schlechteste beurteilte Papille und wie viele
  // ueberhaupt beurteilt sind. Zwei Zahlen, weil eine allein nicht sagt, ob
  // ueberhaupt hingesehen wurde - dieselbe Trennung wie chartedSites/maxPd.
  maxPapillaLoss: number | null; gradedPapillae: number;
} {
  let chartedSites = 0, bleedingSites = 0;
  let worstCal: number | null = null, worstCalTooth: number | null = null, maxPd: number | null = null;
  let sumPd = 0, sumCal = 0;
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s || !s.perio) continue;
    const pdMap = s.perio.pd as Map<string, number>;
    const gmMap = s.perio.gm as Map<string, number>;
    const bopSet = s.perio.bop as Set<string>;
    for(const [site, pd] of pdMap){
      chartedSites++;
      if(bopSet.has(site)) bleedingSites++;
      const cal = pd + (gmMap.get(site) ?? 0);
      sumPd += pd;
      sumCal += cal;
      if(worstCal === null || cal > worstCal){ worstCal = cal; worstCalTooth = toothNo; }
      if(maxPd === null || pd > maxPd) maxPd = pd;
    }
  }
  const bopPercent = chartedSites > 0 ? Math.round((bleedingSites / chartedSites) * 1000) / 10 : 0;
  // Averages over all charted sites, one decimal — null (not 0/NaN) when
  // nothing is charted, mirroring worstCal/maxPd's "absence = not charted".
  const avgPd = chartedSites > 0 ? Math.round((sumPd / chartedSites) * 10) / 10 : null;
  const avgCal = chartedSites > 0 ? Math.round((sumCal / chartedSites) * 10) / 10 : null;

  let maxFurcation: number | null = null;
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s || !s.furcation) continue;
    for(const grade of (s.furcation as Map<string, number>).values()){
      if(maxFurcation === null || grade > maxFurcation) maxFurcation = grade;
    }
  }

  // Bead odontogram-gry: Papillenverlust. Eigener Durchgang aus demselben
  // Grund wie bei der Furkation - er haengt nicht daran, ob an dem Zahn
  // ueberhaupt sondiert wurde.
  //
  // GEZAEHLT WIRD JE ZAHN UND SEITE, nicht je Zwischenraum, obwohl zwei
  // Nachbarn dieselbe Papille meinen. Zusammenzufassen hiesse zu entscheiden,
  // welche der beiden Beobachtungen gilt, und das ist nicht die Aufgabe einer
  // Zaehlung. Der Parodontalstatus zaehlt seine Stellen aus demselben Grund
  // doppelt.
  let maxPapillaLoss: number | null = null, gradedPapillae = 0;
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s || !s.papillaLoss) continue;
    for(const grade of (s.papillaLoss as Map<string, number>).values()){
      gradedPapillae++;
      if(maxPapillaLoss === null || grade > maxPapillaLoss) maxPapillaLoss = grade;
    }
  }

  // SP-perio P2b Task 3: O'Leary whole-mouth Plaque Index (see doc comment
  // above for the present-tooth definition/rationale).
  let presentTeeth = 0, plaqueSurfaces = 0;
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s) continue;
    if(!isToothPresent(s.toothSelection)) continue;
    presentTeeth++;
    plaqueSurfaces += (s.plaque as Set<string> | undefined)?.size ?? 0;
  }
  const plaquePercent = presentTeeth > 0 ? Math.round((plaqueSurfaces / (presentTeeth * 4)) * 1000) / 10 : 0;

  // SP-perio PG-D Task 5: PI/GI whole-mouth mean, KG-deficient tooth count,
  // GT/Miller distributions — deliberately their own pass over `ALL_TEETH`
  // (not folded into the pd-site loop above), same reasoning as
  // `maxFurcation`/`plaquePercent`: these axes are charted independently of
  // whether a tooth has any charted perio site.
  let piSum = 0, piCount = 0, giSum = 0, giCount = 0;
  let kgDeficientTeeth = 0;
  const gtDistribution = { thin: 0, medium: 0, thick: 0 };
  const millerDistribution = { i: 0, ii: 0, iii: 0, iv: 0 };
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s) continue;
    if(s.pi) for(const grade of (s.pi as Map<string, number>).values()){ piSum += grade; piCount++; }
    if(s.gi) for(const grade of (s.gi as Map<string, number>).values()){ giSum += grade; giCount++; }
    if(typeof s.kg === "number" && s.kg < 2) kgDeficientTeeth++;
    if(s.gingivalThickness === "thin") gtDistribution.thin++;
    else if(s.gingivalThickness === "medium") gtDistribution.medium++;
    else if(s.gingivalThickness === "thick") gtDistribution.thick++;
    if(s.millerClass === "i") millerDistribution.i++;
    else if(s.millerClass === "ii") millerDistribution.ii++;
    else if(s.millerClass === "iii") millerDistribution.iii++;
    else if(s.millerClass === "iv") millerDistribution.iv++;
  }
  const piScore = piCount > 0 ? Math.round((piSum / piCount) * 10) / 10 : null;
  const giScore = giCount > 0 ? Math.round((giSum / giCount) * 10) / 10 : null;

  // SP-perio PG-E Task 3: mPI/mBI whole-mouth mean, implant-only — own pass
  // over ALL_TEETH, same reasoning as the PI/GI pass above (mirrors it
  // exactly, just gated to implant teeth per the doc comment above).
  let mpiSum = 0, mpiCount = 0, mbiSum = 0, mbiCount = 0;
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s) continue;
    if(s.toothSelection !== "implant") continue;
    if(s.mpi) for(const grade of (s.mpi as Map<string, number>).values()){ mpiSum += grade; mpiCount++; }
    if(s.mbi) for(const grade of (s.mbi as Map<string, number>).values()){ mbiSum += grade; mbiCount++; }
  }
  const mpiScore = mpiCount > 0 ? Math.round((mpiSum / mpiCount) * 10) / 10 : null;
  const mbiScore = mbiCount > 0 ? Math.round((mbiSum / mbiCount) * 10) / 10 : null;

  return {
    chartedSites, bleedingSites, bopPercent, worstCal, worstCalTooth, maxPd, avgPd, avgCal, maxFurcation, plaquePercent,
    piScore, giScore, kgDeficientTeeth, gtDistribution, millerDistribution,
    mpiScore, mbiScore,
    maxPapillaLoss, gradedPapillae,
  };
}

/** UI-3b: true iff ANY periodontal axis has been charted anywhere in the
 *  mouth. Used to auto-skip the perio section of an export and to disable the
 *  perio image-export menu items on a blank chart. Derived entirely from
 *  `getPerioSummary()` — no new traversal. */
export function hasAnyPerioData(): boolean {
  const s = getPerioSummary();
  if(s.chartedSites > 0
    || s.maxFurcation !== null
    || s.plaquePercent > 0
    || s.piScore !== null
    || s.giScore !== null
    || s.kgDeficientTeeth > 0
    || s.gtDistribution.thin > 0 || s.gtDistribution.medium > 0 || s.gtDistribution.thick > 0
    || s.millerDistribution.i > 0 || s.millerDistribution.ii > 0
    || s.millerDistribution.iii > 0 || s.millerDistribution.iv > 0
    || s.mpiScore !== null
    || s.mbiScore !== null
    || s.gradedPapillae > 0) return true;
  // `getPerioSummary()` doesn't surface three independently-chartable perio
  // axes, so scan for them directly (else a chart with ONLY such a finding is
  // wrongly treated as "no perio data" and its export section auto-skipped):
  //   - cejVisibility / rootConcavity: registry enum axes ("none" default),
  //     charted with no dependency on any PD site;
  //   - a NON-deficient KG measurement: the summary only counts kg<2
  //     (`kgDeficientTeeth`), so a healthy charted width (e.g. 5 mm) is invisible
  //     to the checks above but is still charted perio data.
  for(const toothNo of ALL_TEETH){
    if(getKeratinizedWidth(toothNo) !== null) return true;
    if(getCejVisibility(toothNo) !== "none") return true;
    if(getRootConcavity(toothNo) !== "none") return true;
  }
  return false;
}

/** 2.2.1: `true` iff at least one tooth on the ACTIVE chart carries a
 *  non-blank free-text note AND the notes feature is enabled — mirrors the
 *  same gate the tooltip / whole-mouth summary use. */
export function hasAnyToothNote(): boolean {
  if(!notesEnabled) return false;
  for(const s of toothState.values()){
    if(s.note && s.note.trim() !== "") return true;
  }
  return false;
}

/** Per-tooth perio for every tooth on the active chart that has at least one
 *  charted site (an uncharted tooth is OMITTED, not present with empty
 *  maps — mirrors the same "absence = not charted" convention the payload's
 *  `perio` key follows). Keyed by tooth number (FDI), stringified (plain
 *  object keys are always strings), each value shaped like
 *  {@link getToothPerio}'s return. */
export function getPerioChart(): Record<string, PlainPerio> {
  const out: Record<string, PlainPerio> = {};
  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s || !s.perio || s.perio.pd.size === 0) continue;
    out[String(toothNo)] = {
      pd: Object.fromEntries(s.perio.pd),
      gm: Object.fromEntries(s.perio.gm),
      bop: Array.from(s.perio.bop),
      sup: Array.from(s.perio.sup),
    };
  }
  return out;
}

/**
 * SP-perio P4b Task 1: state adapter for the pure 2017 periodontal
 * classification derivation core (`derivePerioClassification` in
 * `perioClassification.ts`). Reduces the active chart's per-tooth CAL/PD +
 * the P4a case metadata into the pure {@link PerioDerivationInput} struct —
 * this is the ONLY place engine state is read for classification purposes;
 * `derivePerioClassification` itself never touches `toothState`/`caseMeta`
 * directly, so it stays callable from an arbitrary serialized snapshot (the
 * later FHIR Condition builder feeds it that way, not live module state).
 *
 * Per tooth: `interdentalCal` = worst (max) CAL over the 4 approximal sites
 * (MB/DB/ML/DL); `buccalOralCal` = worst (max) CAL over the 2 mid sites
 * (B/L); `maxPd` = worst (max) raw PD over any of the 6 sites (from
 * `s.perio.pd` directly, NOT derived CAL); `present` mirrors
 * `isToothPresent()`. A tooth never touched at all (no chart entry) reads
 * as present with all-zero perio fields — the same "never touched -> default
 * state" convention every other per-tooth read in this file uses.
 */
export function buildDerivationInputFromState(): PerioDerivationInput {
  const INTERDENTAL_SITES = ["MB", "DB", "ML", "DL"] as const;
  const BUCCAL_ORAL_SITES = ["B", "L"] as const;

  const teeth: ToothDerivationInput[] = ALL_TEETH.map((toothNo) => {
    const s = toothState.get(toothNo);
    const present = isToothPresent((s ?? defaultState()).toothSelection);

    const cal = getToothCal(toothNo);
    let interdentalCal = 0;
    for (const site of INTERDENTAL_SITES) {
      const v = cal.get(site);
      if (v !== undefined && v > interdentalCal) interdentalCal = v;
    }
    let buccalOralCal = 0;
    for (const site of BUCCAL_ORAL_SITES) {
      const v = cal.get(site);
      if (v !== undefined && v > buccalOralCal) buccalOralCal = v;
    }

    let maxPd = 0;
    if (s && s.perio) {
      for (const pd of (s.perio.pd as Map<string, number>).values()) {
        if (pd > maxPd) maxPd = pd;
      }
    }

    return { toothNo, interdentalCal, buccalOralCal, maxPd, present };
  });

  const summary = getPerioSummary();
  const meta = getCaseMeta();

  return {
    teeth,
    bopPercent: summary.bopPercent,
    maxFurcation: summary.maxFurcation,
    meta: {
      age: meta.age,
      maxRblPercent: meta.maxRblPercent,
      toothLossPerio: meta.toothLossPerio,
      smokingStatus: meta.smokingStatus,
      cigarettesPerDay: meta.cigarettesPerDay,
      diabetesStatus: meta.diabetesStatus,
      hba1c: meta.hba1c,
    },
  };
}

/** Final result of {@link getPerioClassification} — one axis result per axis,
 *  each either the clinician's override (when set) or the pure-derived value,
 *  plus the raw derivation and an `overridden` flag per axis so callers (T3's
 *  FHIR evidence, T4's UI) can tell which. */
export interface PerioClassificationResult {
  diagnosis: string;
  stage: string;
  grade: string;
  extent: string;
  derived: PerioClassification;
  overridden: { diagnosis: boolean; stage: boolean; grade: boolean; extent: boolean };
}

/**
 * SP-perio P4b Task 2: the final periodontal classification — per-axis
 * clinician override (`caseMeta.<axis>Override`) when set, else the pure
 * `derivePerioClassification` result (fed via `buildDerivationInputFromState`,
 * the same state adapter T1 built). Overrides never feed back into the
 * derivation itself — `derived` is always the untouched computed value, so
 * callers can always see both what the engine computed and what the
 * clinician actually chose.
 */
export function getPerioClassification(): PerioClassificationResult {
  const derived = derivePerioClassification(buildDerivationInputFromState());
  return {
    diagnosis: caseMeta.diagnosisOverride ?? derived.diagnosis,
    stage: caseMeta.stageOverride ?? derived.stage,
    grade: caseMeta.gradeOverride ?? derived.grade,
    extent: caseMeta.extentOverride ?? derived.extent,
    derived,
    overridden: {
      diagnosis: caseMeta.diagnosisOverride !== null,
      stage: caseMeta.stageOverride !== null,
      grade: caseMeta.gradeOverride !== null,
      extent: caseMeta.extentOverride !== null,
    },
  };
}

/** P4b Task 4: `"molar-incisor"` (the derived/override enum value, hyphenated)
 *  maps to the camelCase `perio.class.extent.molarIncisor` i18n key segment;
 *  every other extent value is used as-is. */
function extentI18nSegment(extent: string): string {
  return extent === "molar-incisor" ? "molarIncisor" : extent;
}

/**
 * P4b Task 4: builds the FINAL (override-aware) periodontal classification
 * fragment appended to `getOdontogramSummary()`'s `periodontalText` — e.g.
 * "Dx: periodontitis · Stage III · Grade B · generalized" for periodontitis,
 * "Dx: gingivitis" for gingivitis (2017 stage/grade/extent only apply once
 * periodontitis is the diagnosis), or "Dx: periodontally healthy" whenever a
 * clinician has explicitly overridden ANY axis — even to arrive back at
 * health — so their choice stays visible rather than silently reverting to
 * the plain base text.
 *
 * Returns `""` (nothing appended) for the ordinary untouched case — final
 * diagnosis health AND no override on any axis — leaving `periodontalText`
 * byte-identical to its pre-P4b "healthy" wording for every existing
 * fixture/test that never touches perio data or the classification axes.
 */
function classificationSummaryFragment(cls: PerioClassificationResult): string {
  const anyOverride = cls.overridden.diagnosis || cls.overridden.stage || cls.overridden.grade || cls.overridden.extent;
  if(cls.diagnosis === "health" && !anyOverride) return "";
  const parts = [t("perio.class.summary.dx", { dx: t(`perio.class.dx.${cls.diagnosis}`) })];
  // Stage/grade/extent are periodontitis-staging concepts, so they're normally
  // shown only for a periodontitis diagnosis. But an EXPLICIT per-axis override
  // must never be silently dropped from the summary — surface it even when the
  // diagnosis isn't periodontitis (the clinician deliberately set it).
  const showStaging = cls.diagnosis === "periodontitis";
  if((showStaging || cls.overridden.stage) && cls.stage !== "na" && cls.stage !== "indeterminate") parts.push(t("perio.class.summary.stage", { stage: cls.stage }));
  if((showStaging || cls.overridden.grade) && cls.grade !== "indeterminate") parts.push(t("perio.class.summary.grade", { grade: cls.grade }));
  if((showStaging || cls.overridden.extent) && cls.extent !== "na") parts.push(t(`perio.class.extent.${extentI18nSegment(cls.extent)}`));
  return parts.join(" · ");
}

// ---- Periodontal-arc sub-project P2, Task 3: keyboard charting order ----
// Explicit, pure charting-order table driving the full-mouth grid's keyboard
// auto-advance (PerioChart.tsx). There are two "rows" — pd, then gm. WITHIN
// a row: the buccal sites (MB,B,DB) are charted tooth-by-tooth across the
// arch order (upper then lower — `ALL_TEETH`, the exact array `PerioChart.tsx`
// mirrors as its own module-scope `UPPER_ARCH`/`LOWER_ARCH` concat) before
// moving on to the lingual sites (ML,L,DL) the same way; this mirrors the
// grid's own DOM layout (`buildArch`'s field-row loop: tooth outer, site
// inner) and `PERIO_SITES`' own MB/B/DB/ML/L/DL grouping. Once every lingual
// gm site of the last tooth is reached, the order ends (`nextPerioCell`
// returns `null` — deliberately NOT wrapping back to the first pd cell, so a
// clinician doing a final full-mouth charting pass gets an explicit "done"
// signal rather than looping silently).
//
// Built ONCE at module load (2 rows * 6 sites * 32 teeth = 384 entries) so
// `nextPerioCell`/`prevPerioCell` are plain array lookups, not a
// re-derivation per call. Pure/side-effect-free — no `toothState` read, no
// DOM — safe to unit-test directly, independent of the grid.
const PERIO_CHART_ROWS = ["pd", "gm"] as const;
const PERIO_SITE_GROUPS: readonly (readonly PerioSite[])[] = [
  ["MB", "B", "DB"],
  ["ML", "L", "DL"],
];

export type PerioCellCoord = { toothNo: number; site: PerioSite; row: "pd" | "gm" };

const PERIO_CELL_ORDER: PerioCellCoord[] = (() => {
  const order: PerioCellCoord[] = [];
  for(const row of PERIO_CHART_ROWS){
    for(const siteGroup of PERIO_SITE_GROUPS){
      for(const toothNo of ALL_TEETH){
        for(const site of siteGroup){
          order.push({ toothNo, site, row });
        }
      }
    }
  }
  return order;
})();

function perioCellKey(c: { toothNo: number; site: string; row: string }): string {
  return `${c.row}:${c.toothNo}:${c.site}`;
}

const PERIO_CELL_INDEX: Map<string, number> = new Map(
  PERIO_CELL_ORDER.map((c, i) => [perioCellKey(c), i]),
);

/**
 * Pure charting-order helper for the full-mouth perio grid's keyboard
 * auto-advance (PerioChart.tsx) — given the cell just charted, returns the
 * NEXT cell in charting order (see the order table comment above), or
 * `null` at the very end (last lingual gm site of the last tooth in the
 * arch order). An unrecognized `cur` (a site string not in {@link PERIO_SITES}
 * or a `row` other than "pd"/"gm") also returns `null`. Never mutates
 * state — a plain-object round trip, trivially unit-testable in isolation.
 */
export function nextPerioCell(cur: { toothNo: number; site: string; row: "pd" | "gm" }): PerioCellCoord | null {
  const idx = PERIO_CELL_INDEX.get(perioCellKey(cur));
  if(idx === undefined) return null;
  return PERIO_CELL_ORDER[idx + 1] ?? null;
}

/** Reverse of {@link nextPerioCell} — the grid's Left-arrow / previous-cell
 *  step. `null` for an unrecognized `cur` or at the very first cell. */
export function prevPerioCell(cur: { toothNo: number; site: string; row: "pd" | "gm" }): PerioCellCoord | null {
  const idx = PERIO_CELL_INDEX.get(perioCellKey(cur));
  if(idx === undefined || idx === 0) return null;
  return PERIO_CELL_ORDER[idx - 1] ?? null;
}

// ---- Periodontal-arc sub-project P2, Task 2: full-mouth grid support ----
// Two small production (non-test) reads/writes the perio-chart overlay's grid
// (PerioChart.tsx, a separate React component/module) needs, since it lives
// outside odontogram.ts and can't reach the private `toothState` map,
// `perioRowHidden`, or `applyToSelected` directly.

/** Whether tooth `toothNo`'s periodontal probing sites are chartable on the
 *  active chart — the SAME gate {@link perioRowHidden} applies to the
 *  tooth-info panel's `#perioRow` (missing/implant/under-gum/extraction-
 *  socket teeth have no probing site to chart). The full-mouth perio-chart
 *  overlay grid (P2 Task 2) disables a tooth's entire column (site cells +
 *  mobility cell) on this same predicate — a tooth never touched (no stored
 *  state yet) reads as present/chartable, mirroring every other per-tooth
 *  default read here. */
export function isPerioRowHidden(toothNo: number): boolean {
  return perioRowHidden(toothState.get(toothNo));
}

/** Whether tooth `toothNo` is an implant on the ACTIVE chart (status/plan
 *  aware, reading the SAME `toothState` the perio number rows read). The
 *  graphical Dental Chart (`PerioChart` / `perioGraphic.ts`) uses this to draw
 *  the implant fixture artwork (`#implant-base`) in place of the natural
 *  `#tooth-base` for an implant tooth — a read-only presentation concern,
 *  outside the tooth-info panel, so like `isPerioRowHidden`/`getToothMobility`
 *  above it needs a small public read since it can't reach `toothState`
 *  directly. A never-touched tooth defaults to non-implant. */
export function isToothImplant(toothNo: number): boolean {
  return toothState.get(toothNo)?.toothSelection === "implant";
}

/** Read tooth `toothNo`'s Miller mobility grade from the active chart
 *  ("none" for a never-touched tooth, matching {@link defaultState}). */
export function getToothMobility(toothNo: number): string {
  return toothState.get(toothNo)?.mobility ?? "none";
}

/**
 * Set tooth `toothNo`'s Miller mobility grade on the active chart from
 * OUTSIDE the tooth-info panel. The panel's own `#mobilitySelect` writes
 * mobility through `applyToSelected()`, which applies to the bulk
 * `selectedTeeth` set — unusable here, since the full-mouth perio-chart
 * overlay grid (P2 Task 2) edits one specific tooth at a time that is not
 * necessarily `activeTooth` or selected on the base chart. This reuses the
 * EXACT SAME mutation + render + notify steps that path takes
 * (`applyStateToSvg`, `updateToothTileNumber`, re-syncing the panel when
 * `toothNo` happens to be the active tooth, `notifyStateChange`) — no new
 * mobility derivation or render logic, just a single-tooth entry point into
 * it. Lazily initializes a never-touched tooth's state first, exactly like
 * `setPerioSite` does. An unrecognized `value` (not in {@link VALID_MOBILITY})
 * is a silent no-op, exactly like every other per-tooth enum setter here.
 */
export function setToothMobility(toothNo: number, value: string): void {
  if(!VALID_MOBILITY.has(value)) return;
  if(!perioAxisApplies(toothNo, "mobility")) return; // see setPerioSite
  let s = toothState.get(toothNo);
  if(!s){ s = defaultState(); toothState.set(toothNo, s); }
  if(s.mobility === value) return;
  gateToothEdit(toothNo, () => {
    s.mobility = value;
    applyStateToSvg(toothNo);
    updateToothTileNumber(toothNo);
    if(toothNo === activeTooth) syncControlsFromState(toothState.get(toothNo));
    notifyStateChange();
  });
}

// ---- Periodontal-arc sub-project P2, Task 1: perio-chart overlay open/close ----
// Separately-invocable imperative API so a host dental application can call up
// the perio overlay independently of the base odontogram (e.g. from its own
// menu/shortcut, without going through any odontogram-specific UI). The flag
// lives here (alongside the rest of the module-level session state) and reuses
// the existing `onStateChange` subscription — `App.tsx`'s demo subscribes and
// mirrors the flag into React state (`perioOpen`) so `<PerioChart/>` re-renders
// on open/close. No tooth-state mutation, no payload/FHIR change.
let perioOverlayOpen = false;

/** Open the perio-chart overlay. No-op (still notifies) if already open. */
export function openPerioOverlay(): void {
  perioOverlayOpen = true;
  notifyStateChange();
}

/** Close the perio-chart overlay. No-op (still notifies) if already closed. */
export function closePerioOverlay(): void {
  perioOverlayOpen = false;
  notifyStateChange();
}

/** Whether the perio-chart overlay is currently open. */
export function isPerioOverlayOpen(): boolean {
  return perioOverlayOpen;
}

// ---- Periodontal "Dental Chart" graphical redesign, Task 1: presentation ----
// Session-level UI preference (no payload/FHIR change) governing how the P2
// perio content is HOUSED: "toggle" (default) shows an Odontogram | Dental
// Chart segmented control that renders <PerioChart inline/> in the chart
// area (odontogram hidden via CSS, never unmounted); "popup" keeps P2's
// classic launch-button + modal-overlay housing. Lives alongside
// `perioOverlayOpen` (same session-state precedent) and reuses the existing
// `onStateChange` subscription — App.tsx mirrors it into React state exactly
// like `perioOpen` mirrors `isPerioOverlayOpen()`.
export type PerioViewMode = "toggle" | "popup";
let perioViewMode: PerioViewMode = "toggle";

/** Current perio-chart housing mode. Defaults to `"toggle"`. */
export function getPerioViewMode(): PerioViewMode {
  return perioViewMode;
}

/** Switch the perio-chart housing mode. No-op (still notifies) if unchanged. */
export function setPerioViewMode(mode: PerioViewMode): void {
  perioViewMode = mode;
  notifyStateChange();
}

// ---- Bead odontogram-c51.1: measured mesiodistal crown widths ----
// Session-level, DELIBERATELY not part of the export payload — the same
// standing as `perioViewMode` above, and for a recorded reason rather than
// convenience. c51's audit found that no published Dental Core profile authors
// model analysis, and c51's own rule is to stay blocked rather than ship a
// local-code persistence path. Keeping the widths in session state honours
// that: `collectExportPayload`/`getPlanChart`/hydrate never reference them, so
// the payload version, the FHIR bundle and the SVG fingerprints are all
// byte-identical, and no unmapped field is invented in the meantime.
//
// PROMOTION POINT. When a carrier is published, this map moves into the
// document and this comment goes away. Nothing else has to change: everything
// downstream reads `getToothWidths()`, and the analysis itself is derived
// (`deriveModelAnalysis` in `src/modelAnalysis.ts`), so no derived value is
// stored anywhere and none has to be migrated.
//
// ABSENCE = NOT MEASURED. A tooth with no entry has no key — never a stored 0,
// the same convention `radiographicDepth` and the perio maps use.
const toothWidths = new Map<number, number>();

/** Measured mesiodistal crown widths in mm, keyed by FDI. Omits unmeasured teeth. */
export function getToothWidths(): Record<number, number> {
  return Object.fromEntries(toothWidths);
}

/** One tooth's measured width in mm, or `null` when it has not been measured. */
export function getToothWidth(toothNo: number): number | null {
  const w = toothWidths.get(toothNo);
  return typeof w === "number" ? w : null;
}

/**
 * Record one tooth's mesiodistal width. `null` (or any non-finite or
 * non-positive value) clears the entry rather than storing a sentinel, so
 * "measured as nothing" can never be confused with "not measured".
 * Clamped to a plausible crown range; a caliper reading outside it is a
 * typing slip, not a finding.
 */
export function setToothWidth(toothNo: number, mm: number | null): void {
  if (!ALL_TEETH.includes(toothNo)) return;
  if (mm === null || !Number.isFinite(mm) || mm <= 0) {
    if (!toothWidths.delete(toothNo)) return;
    notifyStateChange();
    return;
  }
  const clamped = Math.min(20, Math.max(1, mm));
  if (toothWidths.get(toothNo) === clamped) return;
  toothWidths.set(toothNo, clamped);
  notifyStateChange();
}

/** Drop every measured width — part of the blank-slate reset path. */
export function resetToothWidths(): void {
  if (toothWidths.size === 0) return;
  toothWidths.clear();
  notifyStateChange();
}

/**
 * Whether tooth `toothNo` is something a caliper can actually be put on when
 * the plaster model is in your hand. FALSE for the four states that leave the
 * position empty — never erupted, lost after extraction, missing, or still
 * under the gum. This is what drives the contralateral substitution in
 * `resolveWidths` (bead odontogram-c51.1): a tooth that is not there takes its
 * width from the same tooth on the other side, so Tonn and Bolton still mean
 * something.
 *
 * IMPLANTS, ruled by Dirk 2026-08-12: an implant only counts once it carries a
 * crown, and then that crown's width is the reading. A bare fixture or a
 * healing abutment has no mesiodistal width to measure, so it substitutes from
 * the contralateral like any other empty position. He also notes this has not
 * come up once in over thirty years of practice — so it is written for
 * correctness, not because anything depends on it. Nothing here should be
 * elaborated on the assumption that it matters.
 */
export function isToothMeasurable(toothNo: number): boolean {
  const state = toothState.get(toothNo);
  const sel = state?.toothSelection ?? "tooth-base";
  if (sel === "none" || sel === "not-erupted"
    || sel === "no-tooth-after-extraction" || sel === "tooth-under-gum") return false;
  if (sel === "implant") {
    const restoration = state?.restorationType ?? "none";
    return restoration === "crown" || restoration === "bridge";
  }
  return true;
}

/** Every arch position that carries no measurable tooth, for the substitution. */
export function getAbsentTeeth(): number[] {
  return ALL_TEETH.filter(toothNo => !isToothMeasurable(toothNo));
}

// ---- Bead odontogram-c51.1: the occlusal measurements ----
// Overjet, overbite and the two dental midline deviations are DIRECT ENTRY —
// read off the model with a ruler, not computed from anything — so unlike the
// indices they are stored rather than derived. Session state on the same terms
// as the widths above, and cleared by the same reset path.
//
// SIGN CONVENTIONS, and each is a real clinical distinction rather than a
// storage detail:
//   overjet   negative = reversed, i.e. an anterior crossbite
//   overbite  negative = an open bite
//   midline   positive = deviated to the PATIENT's right
// `null` throughout means not measured — never 0, which is a perfectly normal
// reading and must stay distinguishable from an unrecorded one.
type OcclusalKey = "overjet" | "overbite" | "midlineUpper" | "midlineLower";
const occlusal: Record<OcclusalKey, number | null> = {
  overjet: null, overbite: null, midlineUpper: null, midlineLower: null,
};

/** The four recorded occlusal measurements in mm; `null` = not measured. */
export function getOcclusalMeasurements(): Record<OcclusalKey, number | null> {
  return { ...occlusal };
}

/**
 * Record one occlusal measurement in mm. `null` (or any non-finite value)
 * clears it. Clamped to ±20 mm — beyond that it is a typing slip, not a bite.
 */
export function setOcclusalMeasurement(key: OcclusalKey, mm: number | null): void {
  if (!(key in occlusal)) return;
  const next = mm === null || !Number.isFinite(mm) ? null : Math.min(20, Math.max(-20, mm));
  if (occlusal[key] === next) return;
  occlusal[key] = next;
  notifyStateChange();
}

/** Drop every occlusal measurement — part of the blank-slate reset path. */
export function resetOcclusalMeasurements(): void {
  if (Object.values(occlusal).every(v => v === null)) return;
  for (const key of Object.keys(occlusal) as OcclusalKey[]) occlusal[key] = null;
  notifyStateChange();
}

// ---- UI-2 Task 1: Settings -> Periodontal tab app-level preferences ----
// Two session-level UI preferences (no payload/FHIR change), mirroring the
// `perioViewMode` precedent immediately above: a module `let` + getter +
// setter that calls `notifyStateChange()`. Neither is part of the tooth
// state, so neither is ever serialized (`collectExportPayload`/
// `getPlanChart`/hydrate never reference these) — round-trip/FHIR/SVG
// goldens are unaffected. `perioRowVisibility` drives which perio-chart
// index rows the Dental Chart renders (T2); `perioIndexNameMode` drives
// whether index row labels show the localized name or a static
// English/Latin canonical name (T3). Both are wired into the Settings ->
// Periodontal tab via `SettingsState` in `SettingsModal.tsx`.

/** The 17 toggleable periodontal index rows the Dental Chart can show/hide. */
export type PerioRowId =
  | "plaque"
  | "bop"
  | "sup"
  | "cal"
  | "gm"
  | "pd"
  | "furcation"
  | "mobility"
  | "cej"
  | "rootConcavity"
  | "pi"
  | "gi"
  | "mpi"
  | "mbi"
  | "kg"
  | "gt"
  | "miller"
  | "papillaLoss";

const PERIO_ROW_IDS: readonly PerioRowId[] = [
  "plaque", "bop", "sup", "cal", "gm", "pd", "furcation", "mobility", "cej",
  "rootConcavity", "pi", "gi", "mpi", "mbi", "kg", "gt", "miller", "papillaLoss",
];

/**
 * The localized `t(...)` key naming each periodontal index — NOT a uniform
 * `perio.<id>.row` template, since several rows use a differently-shaped key
 * (plaque/furcation use `<x>.label`, pd/gm/cal/bop use the bare `perio.<x>`
 * abbreviation key, the rest use `perio.<x>.row`).
 *
 * Lives here, next to {@link PerioRowId} itself, because two consumers need
 * the same naming: `perioIndexNames.ts`'s `indexName()` (the chart's row
 * labels, in translated mode) and the assessment-status summary lines below
 * (bead odontogram-vnt), which name the same indices in the tooltip and the
 * whole-mouth summary. One table, so a renamed index can never read one way on
 * the chart and another way in the summary.
 */
export const PERIO_INDEX_LABEL_KEYS: Record<PerioRowId, string> = {
  plaque: "plaque.label",
  bop: "perio.bop",
  sup: "perio.sup.row",
  cal: "perio.cal",
  gm: "perio.gm",
  pd: "perio.pd",
  furcation: "furcation.label",
  mobility: "perio.mobility",
  cej: "perio.cej.label",
  rootConcavity: "perio.rootConcavity.label",
  pi: "perio.pi.row",
  gi: "perio.gi.row",
  mpi: "perio.mpi.row",
  mbi: "perio.mbi.row",
  kg: "perio.kg.row",
  gt: "perio.gt.row",
  miller: "perio.miller.row",
  papillaLoss: "papillaLoss.label",
};

function defaultPerioRowVisibility(): Record<PerioRowId, boolean> {
  const record = {} as Record<PerioRowId, boolean>;
  for (const id of PERIO_ROW_IDS) record[id] = true;
  return record;
}

let perioRowVisibility: Record<PerioRowId, boolean> = defaultPerioRowVisibility();

/** Current per-index perio-chart row visibility. Defaults to all-visible. */
export function getPerioRowVisibility(): Record<PerioRowId, boolean> {
  return perioRowVisibility;
}

/** Show/hide one perio-chart index row. No-op (still notifies) if unchanged. */
export function setPerioRowVisibility(id: PerioRowId, visible: boolean): void {
  perioRowVisibility = { ...perioRowVisibility, [id]: visible };
  notifyStateChange();
}

/** How perio-chart index row labels are rendered. */
export type PerioIndexNameMode = "translated" | "canonical";
let perioIndexNameMode: PerioIndexNameMode = "translated";

/** Current perio index-name display mode. Defaults to `"translated"`. */
export function getPerioIndexNameMode(): PerioIndexNameMode {
  return perioIndexNameMode;
}

/** Switch the perio index-name display mode. No-op (still notifies) if unchanged. */
export function setPerioIndexNameMode(mode: PerioIndexNameMode): void {
  perioIndexNameMode = mode;
  notifyStateChange();
}

// ---- Bead odontogram-vnt: assessment-status authoring rows ---------------
// A third session-level perio-chart UI preference, mirroring
// `perioRowVisibility`/`perioIndexNameMode` above exactly: a module `let` +
// getter + setter that calls `notifyStateChange()`, never part of the tooth
// state and therefore never serialized.
//
// Recording that an axis WAS examined is a deliberate second pass over a
// chart, not something a clinician does while probing — so the assessment
// rows are OPT-IN. Off by default, the perio chart renders exactly as it did
// before this bead; on, every visible index row for an axis in
// `PERIO_ASSESSMENT_AXES` gains a companion row of status cycle controls.

let perioAssessmentMode = false;

/** Whether the perio chart shows the per-axis assessment-status rows. */
export function getPerioAssessmentMode(): boolean {
  return perioAssessmentMode;
}

/** Show/hide the perio chart's assessment-status rows. No-op (still notifies)
 *  if unchanged. */
export function setPerioAssessmentMode(on: boolean): void {
  perioAssessmentMode = on;
  notifyStateChange();
}

// ---- Periodontal "Dental Chart" PG-B Task 2: the index-switcher overlay ----
// Session-level UI preference (no payload/FHIR change) selecting WHICH
// clinical index is highlighted OVER the Dental Chart arch graphic, on top of
// the always-drawn PD/GM curve. Purely a DISPLAY selector over existing perio
// data — it never mutates a tooth's state, adds an axis, or touches the live
// odontogram, so SVG-fingerprint / FHIR / round-trip goldens are unaffected.
//   - "none"    : no overlay (default).
//   - "plaque"  : marks on O'Leary plaque surfaces (getToothPlaque).
//   - "bop"     : dots on bleeding-on-probing sites (perio.bop).
//   - "pd5"/"pd6": highlight sites whose probing depth >= 5 / >= 6 mm.
//   - "pd"/"cal"/"gr": reserved for T3's continuous heat (no-op stubs here).
//   - "cairo"   : per-tooth Cairo (2011) recession TYPE (RT1-3), derived
//     from CAL (see getToothRecessionType) — a whole-tooth classification,
//     not a per-site reading (PG-C Task 1).
//   - "pi"/"gi" : per-surface graded Silness-Löe Plaque Index / Löe-Silness
//     Gingival Index (0-3, mesial/distal/buccal/lingual — getPlaqueIndex/
//     getGingivalIndex), heat-bucketed like the mm ramps (PG-D Task 4).
//   - "kg"      : per-tooth keratinized gingiva width in mm (getKeratinizedWidth),
//     heat-bucketed on a mucogingival-risk ramp (thin = severe) (PG-D Task 4).
//   - "mpi"/"mbi": per-surface graded Mombelli modified Plaque Index / modified
//     sulcus Bleeding Index (0-3, mesial/distal/buccal/lingual —
//     getPeriImplantPlaque/getPeriImplantBleeding), heat-bucketed like pi/gi.
//     IMPLANT-ONLY data, so marks only ever appear on implant teeth (PG-E).
// Lives alongside `perioViewMode` (same session-state precedent) and reuses
// the existing `onStateChange` subscription — PerioChart mirrors it into React
// state (for the active-button/read-out) and redraws the overlay on notify.
export type PerioOverlayLayer = "none" | "pd" | "cal" | "gr" | "cairo" | "kg" | "plaque" | "pi" | "gi" | "mpi" | "mbi" | "bop" | "pd5" | "pd6";
let perioOverlayLayer: PerioOverlayLayer = "none";

/** Current Dental Chart overlay layer. Defaults to `"none"`. */
export function getPerioOverlayLayer(): PerioOverlayLayer {
  return perioOverlayLayer;
}

/** Select the Dental Chart overlay layer. Always notifies (so the overlay
 *  redraws + the switcher's active state updates) even when unchanged. */
export function setPerioOverlayLayer(layer: PerioOverlayLayer): void {
  perioOverlayLayer = layer;
  notifyStateChange();
}

function downloadJson(payload: Any, filenamePrefix: string){
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `${filenamePrefix}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string){
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

let exportOverlayEl: HTMLElement | null = null;
let exportInProgress = false;

function showExportOverlay(){
  if(exportOverlayEl) return;
  const card = el("div", { class: "odon-export-card" }, [
    el("div", { class: "odon-export-title", text: t("export.progress.title") }),
    el("div", { class: "odon-export-pct", id: "odonExportPct", text: "0%" }),
    el("div", { class: "odon-export-phase", id: "odonExportPhase", text: t("export.progress.preparing") }),
  ]);
  exportOverlayEl = el("div", { class: "odon-export-overlay", role: "status", "aria-live": "polite" }, [card]);
  appendPortal(exportOverlayEl);
}
function setExportProgress(pct: number, phaseKey: string){
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const pctEl = exportOverlayEl?.querySelector("#odonExportPct");
  const phaseEl = exportOverlayEl?.querySelector("#odonExportPhase");
  if(pctEl) pctEl.textContent = `${p}%`;
  if(phaseEl) phaseEl.textContent = t(phaseKey);
}
function hideExportOverlay(){
  if(exportOverlayEl){ exportOverlayEl.remove(); exportOverlayEl = null; }
}

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Prune a cloned SVG subtree to match what is actually visible on screen.
 * Walks the live `original` and its `clone` in parallel and drops clone nodes
 * whose original element is hidden (display:none / visibility:hidden / opacity 0),
 * so the exported SVG reflects the current layer state without needing the
 * engine's CSS rules embedded.
 */
export function pruneHiddenClone(original: Element, clone: Element){
  const oChildren = Array.from(original.children);
  const cChildren = Array.from(clone.children);
  for(let i = 0; i < oChildren.length; i++){
    const o = oChildren[i];
    const c = cChildren[i];
    if(!c) continue;
    const cs = window.getComputedStyle(o);
    const hiddenByOpacity = cs.opacity !== "" && Number(cs.opacity) === 0;
    if(cs.display === "none" || cs.visibility === "hidden" || hiddenByOpacity){
      c.remove();
    }else{
      pruneHiddenClone(o, c);
    }
  }
}

/**
 * Prefix every id and id-reference inside a cloned subtree so that combining
 * many tiles (cloned from a few shared templates) into one SVG document does
 * not cause id collisions (gradients, clipPaths, etc.).
 */
export function namespaceIds(root: Element, prefix: string){
  const fixUrl = (v: string) => v.replace(/url\(#([^)]+)\)/g, (_m, id) => `url(#${prefix}${id})`);
  const refAttrs = ["fill","stroke","clip-path","mask","filter"];
  root.querySelectorAll("[id]").forEach((e) => {
    const oldId = e.getAttribute("id");
    if(oldId) e.setAttribute("id", prefix + oldId);
  });
  const nodes: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
  for(const e of nodes){
    for(const a of refAttrs){
      const v = e.getAttribute(a);
      if(v && v.includes("url(#")) e.setAttribute(a, fixUrl(v));
    }
    const style = e.getAttribute("style");
    if(style && style.includes("url(#")) e.setAttribute("style", fixUrl(style));
    const href = e.getAttribute("href") ?? e.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if(href && href.startsWith("#")){
      e.setAttribute("href", "#" + prefix + href.slice(1));
      e.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
    }
  }
}

/**
 * Serialize the on-screen odontogram tooth grid into a single, self-contained
 * SVG string (vector, no rasterization). Each tooth SVG is placed as a nested
 * `<svg>` at its laid-out position; tooth number labels are emitted as `<text>`.
 * Returns null if the grid is not present.
 */
export function buildOdontogramSvg(): { xml: string; width: number; height: number } | null {
  const grid = document.querySelector("#toothGrid, .tooth-grid") as HTMLElement | null;
  if(!grid) return null;
  const gridRect = grid.getBoundingClientRect();
  const W = Math.max(1, Math.round(gridRect.width));
  const H = Math.max(1, Math.round(gridRect.height));

  const out = document.createElementNS(SVG_NS, "svg");
  out.setAttribute("xmlns", SVG_NS);
  out.setAttribute("width", String(W));
  out.setAttribute("height", String(H));
  out.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
  bg.setAttribute("width", String(W)); bg.setAttribute("height", String(H));
  bg.setAttribute("fill", "#ffffff");
  out.appendChild(bg);

  // Tooth SVGs, positioned by their rendered box.
  let tileIndex = 0;
  grid.querySelectorAll(".tooth-svg > svg").forEach((svgEl) => {
    const r = svgEl.getBoundingClientRect();
    if(r.width === 0 || r.height === 0) return;
    const clone = svgEl.cloneNode(true) as Element;
    pruneHiddenClone(svgEl, clone);
    namespaceIds(clone, `t${tileIndex++}-`);
    const wrap = document.createElementNS(SVG_NS, "svg");
    wrap.setAttribute("x", String(r.left - gridRect.left));
    wrap.setAttribute("y", String(r.top - gridRect.top));
    wrap.setAttribute("width", String(r.width));
    wrap.setAttribute("height", String(r.height));
    const vb = svgEl.getAttribute("viewBox");
    if(vb) wrap.setAttribute("viewBox", vb);
    wrap.setAttribute("preserveAspectRatio", "xMidYMid meet");
    while(clone.firstChild) wrap.appendChild(clone.firstChild);
    out.appendChild(wrap);
  });

  // Multi-tooth bridge-span saddle bars. The export is allowlist-based (only the
  // tooth SVGs and label cells above are cloned), so the live `.bridge-overlay`
  // <svg> is silently excluded; we recompute the SAME bars from tooth geometry
  // (shared computeBridgeBars) and emit them as native <rect> so PNG/JPG/SVG all
  // include the bridge. Drawn after the teeth (mirrors the live z-order).
  const bridgeSpans = detectBridgeSpans(bridgeStateFor);
  if(bridgeSpans.length){
    const rectFor = (toothNo: number) => tileRectFor(grid, gridRect, toothNo);
    const bars = computeBridgeBars(bridgeSpans, bridgeStateFor, rectFor, bridgeMaterialColor);
    for(const bar of bars) out.appendChild(barRect(bar));
  }

  // Tooth number labels as text.
  grid.querySelectorAll(".tooth-label-cell").forEach((cell) => {
    const text = (cell.textContent || "").trim();
    if(!text) return;
    const r = cell.getBoundingClientRect();
    if(r.width === 0 || r.height === 0) return;
    const cs = window.getComputedStyle(cell);
    const txt = document.createElementNS(SVG_NS, "text");
    txt.setAttribute("x", String(r.left - gridRect.left + r.width / 2));
    txt.setAttribute("y", String(r.top - gridRect.top + r.height / 2));
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("dominant-baseline", "central");
    txt.setAttribute("font-family", cs.fontFamily);
    txt.setAttribute("font-size", cs.fontSize);
    txt.setAttribute("font-weight", cs.fontWeight);
    txt.setAttribute("fill", cs.color);
    txt.textContent = text;
    out.appendChild(txt);
  });

  const xml = new XMLSerializer().serializeToString(out);
  return { xml: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`, width: W, height: H };
}

/** Export the odontogram as a downloadable, scalable SVG file. */
export async function exportSvg(){
  if(exportInProgress) return;
  exportInProgress = true;
  showExportOverlay();
  setExportProgress(30, "export.progress.preparing");
  try{
    const built = buildOdontogramSvg();
    if(!built) throw new Error("Odontogram grid not found");
    setExportProgress(90, "export.progress.encoding");
    const blob = new Blob([built.xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `odontogram-${stamp}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportProgress(100, "export.progress.done");
    await new Promise((r) => window.setTimeout(r, 300));
  }finally{
    hideExportOverlay();
    exportInProgress = false;
  }
}

/**
 * Shared SVG→raster core — loads a serialized SVG (as a data
 * URI) into an off-screen `<canvas>` at `scale`×, painted over a white
 * background first (charts have transparent gaps), and returns the canvas so
 * callers can encode it as PNG or JPEG at whatever quality they need.
 */
async function rasterizeSvgToCanvas(xml: string, width: number, height: number, scale = 2): Promise<HTMLCanvasElement> {
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("SVG rasterization failed"));
    img.src = svgUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if(!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Export the odontogram as PNG or JPG. Renders the serialized SVG via the
 * browser's native rasterizer (Image → canvas) — much faster than the previous
 * html2canvas DOM rasterization, and sharper.
 */
export async function exportImage(format: "png" | "jpg" = "png"){
  if(exportInProgress) return;
  exportInProgress = true;
  showExportOverlay();
  setExportProgress(10, "export.progress.preparing");
  try{
    const built = buildOdontogramSvg();
    if(!built) throw new Error("Odontogram grid not found");
    setExportProgress(40, "export.progress.rendering");
    const canvas = await rasterizeSvgToCanvas(built.xml, built.width, built.height);
    setExportProgress(90, "export.progress.encoding");
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    if(format === "jpg"){
      downloadDataUrl(canvas.toDataURL("image/jpeg", 0.92), `odontogram-${stamp}.jpg`);
    }else{
      downloadDataUrl(canvas.toDataURL("image/png"), `odontogram-${stamp}.png`);
    }
    setExportProgress(100, "export.progress.done");
    await new Promise((r) => window.setTimeout(r, 300));
  }finally{
    hideExportOverlay();
    exportInProgress = false;
  }
}

export function exportStatus(){
  downloadJson(collectExportPayload(), "odontogram-status");
}

/**
 * R2-A Task 2 (D3, RATIFIED): the DATA-ONLY half of the import path — no
 * DOM/UI calls, so it is directly unit-testable without a live
 * initOdontogram() mount (mirrors why other module-state tests use
 * `__setToothStateForTest` instead of calling importStatus() itself: several
 * of importStatus()'s UI-sync tail calls, e.g. syncControlsFromState() via
 * updateSelectionUI(), assume a live control-panel DOM and are not part of
 * this task's scope to change).
 *
 * Hydrates `data.teeth` into `charts.status` EXPLICITLY (never the
 * active-chart alias), so importing a payload while in PLAN mode still loads
 * the STATUS chart correctly. A `plan` section (payload >=2.11) restores the
 * PLAN chart too. Its absence (e.g. a legacy <=2.10 payload, or a native
 * 2.11+ export where plan matched status and was omitted) leaves the plan
 * chart cleared/uninitialized, so the next setChartMode("plan") deep-copies
 * the freshly-imported status — it must never resurrect a stale plan left
 * over from before this import.
 */
function hydrateImportedCharts(data: Any): void {
  synchronizeActiveFhirIdentity(data.fhirIdentity);
  // FIX 1: only re-infer the legacy caries∩filling recurrent-caries intersection
  // for pre-2.3 payloads. A native ≥2.3 payload carries explicit `secondaryCaries`
  // unscored caried+filled surface stays PRIMARY. A missing version → legacy.
  const inferLegacySecondaryCaries = isLegacyPayloadVersion(data.version);
  const teeth = data.teeth || {};
  for(const toothNo of ALL_TEETH){
    const raw = teeth[toothNo];
    charts.status.set(toothNo, hydrateState(raw, inferLegacySecondaryCaries));
  }
  // P4a: shared case-level metadata — mirrors `globals`, hydrated once here
  // regardless of status/plan, self-healing any bad/missing values.
  hydrateCaseMeta(data.case);
  // Bead odontogram-2vd: the examination's identity/context and its archive of
  // previously captured examinations travel with the document exactly like
  // `case` above. A legacy document carries neither key, which correctly reads
  // as "no examination identity, no earlier examinations" — never as the
  // previous document's identity, so an import can't silently attribute one
  // patient's examination to another's chart.
  examinationContext = readExaminationContext(data.examination);
  examinations = readExaminationSnapshots(data.examinations);
  // Planalternativen: a document carries `plans` (several named alternatives,
  // the active one by `activePlanId`) or - legacy - a single `plan`, which reads
  // as one alternative "Plan 1". Either way the imported plans REPLACE whatever
  // alternatives stood before; a document with neither has no plan. DS-1: fresh
  // entries carry no runtime plan-edits by construction (never serialized).
  clearPlanAlternatives();
  hydratePlanAlternatives(data, inferLegacySecondaryCaries);
  resetShorthandInput();
  // DS-1 (review Fix 2): also drop any pending dual-state confirm. Its deferred
  // `applyFn` was captured against the PRE-import state; a later
  // acceptDualStateConfirm() must never run it against freshly-hydrated charts.
  pendingDualStateConfirm = null;
}

/**
 * R2-A whole-branch review fix: force the active chart back to STATUS
 * immediately after an import hydrates `charts`. An import is status-primary
 * and replaces the whole case, so it must always land the user on the
 * STATUS chart — even if Plan mode was active before the import. Without
 * this, importing a payload while in Plan mode left `chartMode` on "plan"
 * and `toothState` aliased to `charts.plan`; the post-hydrate repaint would
 * then draw from the (possibly just-cleared, by `hydrateImportedCharts`)
 * plan chart instead of the freshly-imported status data, stranding the
 * user on an empty/stale plan view with the toggle still reading "Plan".
 * Forcing status here makes every import land predictably; the user can
 * switch to Plan afterwards to see the imported plan section, if one was
 * present.
 *
 * Extracted into its own function (rather than inlined in `importStatus()`)
 * so the test seam below can exercise EXACTLY this state-only logic without
 * requiring `importStatus()`'s DOM-dependent UI-sync tail (e.g.
 * `updateSelectionUI()` -> `syncControlsFromState()`, which assumes a live
 * control-panel DOM — same reason `hydrateImportedCharts()` itself is a
 * separate, directly-testable function; see its docstring above).
 */
function resetActiveChartToStatusAfterImport(): void {
  chartMode = "status";
  toothState = charts.status;
}

// ---- Bead odontogram-ap7: an imported chart is somebody else's record ----
//
// A chart that arrives by import — JSON or FHIR from another program —
// carries no archive of its own, yet from this practice's point of view every
// finding in it is pre-existing by definition. That is also the NORMAL way a
// chart enters the program, so leaving it underived would make the whole
// marking useless for exactly the patients it matters most for.
//
// Dirk chose to ask rather than to decide silently (2026-08-11): the import
// menu carries a checkbox, default ON. A session flag, never serialized — it
// describes this import, not the document.
let importAsBaseline = true;

/** Whether the next import without an archive of its own is archived as the
 *  initial examination. */
export function getImportAsBaseline(): boolean { return importAsBaseline; }

/** Set the "this import is the initial examination" choice. */
export function setImportAsBaseline(value: boolean): void {
  importAsBaseline = !!value;
  notifyStateChange();
}

export function importStatus(data: Any){
  if(!data || typeof data !== "object") return;
  // Read BEFORE hydrating: hydrateImportedCharts replaces `examinations` with
  // whatever the document carries, so afterwards there is no way to tell an
  // archive that came with the document from one this import just created.
  const broughtItsOwnArchive = Array.isArray(data.examinations) && data.examinations.length > 0;
  hydrateImportedCharts(data);
  resetActiveChartToStatusAfterImport();
  // Full repaint-all — now guaranteed to draw the just-imported STATUS chart
  // regardless of which chart was active before the import.
  for(const toothNo of ALL_TEETH){
    applyStateToSvg(toothNo);
    updateToothTileNumber(toothNo);
    updateToothLabelNoteIcon(toothNo);
  }
  if(data.globals){
    if(typeof data.globals.wisdomVisible === "boolean") setWisdomVisible(data.globals.wisdomVisible);
    if(typeof data.globals.showBase === "boolean") setShowBase(data.globals.showBase);
    if(typeof data.globals.occlusalVisible === "boolean") setOcclusalVisible(data.globals.occlusalVisible);
    if(typeof data.globals.showHealthyPulp === "boolean") setHealthyPulpVisible(data.globals.showHealthyPulp);
    if(typeof data.globals.edentulous === "boolean"){
      edentulous = data.globals.edentulous;
      setToggleButton($("#btnEdentulous"), edentulous);
    }
  }
  // Bead odontogram-ap7. A document that brought its own archive keeps it —
  // re-archiving would file today's date over somebody's real intake date, and
  // a chart exported from this program and read back in is the commonest case
  // of that. The rule resolves itself: our own exports carry the archive,
  // a foreign chart does not.
  adoptImportAsBaseline(broughtItsOwnArchive);
  updateSelectionFilterButtons();
  updateSelectionUI();
  notifyStateChange();
  syncChartModeUi();
}

/** Archive the just-imported chart as the initial examination, unless the
 *  document brought an archive of its own or the choice is turned off.
 *
 *  Extracted so `importStatus` and its data-only test seam share ONE decision.
 *  Deliberately NOT folded into `hydrateImportedCharts`, which every load goes
 *  through — including `loadExamination` and the baseline-correction round
 *  trip, where archiving would file a new examination in the middle of
 *  correcting one. */
function adoptImportAsBaseline(broughtItsOwnArchive: boolean): void {
  if(!importAsBaseline || broughtItsOwnArchive) return;
  captureExamination({ effectiveDateTime: todayIso() });
}

/** Today as `YYYY-MM-DD`. The imported chart's own examination date is
 *  unknown — it is somebody else's record — so the date recorded is the day
 *  this practice took it over, which is the honest claim. */
function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** TEST-ONLY (R2-A Task 2 seam): exercise the DATA-ONLY import hydrate
 *  (status-primary teeth + conditional plan restore + planInitialized),
 *  without requiring a live DOM/initOdontogram() token. Not part of the
 *  public API. */
export function __hydrateImportedChartsForTest(data: Any): void {
  hydrateImportedCharts(data);
}

/** TEST-ONLY (whole-branch review fix seam): exercise the DATA-ONLY half of
 *  the import path's chart-mode fix — `hydrateImportedCharts()` followed by
 *  the new `resetActiveChartToStatusAfterImport()` step `importStatus()`
 *  now runs — without requiring a live DOM/initOdontogram() token.
 *  `importStatus()`'s own DOM-dependent UI-sync tail (`updateSelectionUI()`
 *  -> `syncControlsFromState()`) assumes a live control-panel DOM and is out
 *  of scope for this seam, same as `__hydrateImportedChartsForTest`. Not
 *  part of the public API. */
export function __importStatusForTest(data: Any): void {
  if(!data || typeof data !== "object") return;
  const broughtItsOwnArchive = Array.isArray(data.examinations) && data.examinations.length > 0;
  hydrateImportedCharts(data);
  resetActiveChartToStatusAfterImport();
  adoptImportAsBaseline(broughtItsOwnArchive);
}

function applyStatusExtra(option: Any){
  if(!option) return;
  const meta = getStatusExtrasMeta();
  const archTeeth = (arch)=> meta?.[arch] || [];
  const archWisdom = (arch)=> meta?.wisdom?.[arch] || [];

  // DS-1 (review Fix 1+2): a Statuses preset is a SINGLE atomic interactive edit
  // over a SET of teeth — it MUST go through the batch gate exactly once (like
  // setEdentulous / the dentition presets), NOT a per-tooth `gateToothEdit` loop.
  // Per-tooth gating was doubly broken: (1) a preset touching >=2 already
  // plan-edited teeth hit the confirm's single-slot guard on the 2nd+ tooth, so
  // that tooth's edit was silently discarded even after Accept (data loss);
  // (2) a preset touching a planned + an unplanned tooth applied the unplanned
  // tooth immediately (before the user answered the confirm), so Cancel left a
  // partial apply. The fix: PRECOMPUTE the set of teeth the preset will ACTUALLY
  // change (same skip/predicate/unchanged-value detection the per-tooth path
  // used, via a serialized before/after comparison, computed on a CLONE so
  // nothing is committed before the gate resolves), then apply ALL of them in
  // ONE `gateToothEditBatch` closure — ONE confirm if any changed tooth is
  // plan-edited, apply-all-or-none, and mark/mirror only the actually-changed
  // teeth. `changes` accumulates across the (possibly several) `collect()` calls
  // a single preset makes (bar-denture makes three), so the WHOLE preset is one
  // atomic batch. Uninitialized plan stays a pure passthrough (byte-identical).
  const changes = new Map<number, Any>(); // toothNo -> precomputed next state
  const collect = (teeth, fn)=>{
    for(const toothNo of teeth){
      // Base successive collects for the same tooth on the prior collect's result
      // (so multi-collect presets compose exactly like the old sequential
      // per-tooth application), else on the tooth's current committed state.
      const base = changes.get(toothNo) ?? toothState.get(toothNo) ?? defaultState();
      const clone = hydrateState(serializeState(base), false);
      const next = fn(clone, toothNo) || clone;
      changes.set(toothNo, next);
    }
  };
  const commit = ()=>{
    // Keep only teeth whose FINAL next state differs from what is committed now —
    // this uniformly drops the three no-op cases (wisdom skip, predicate
    // mismatch, unchanged value) so the gate never marks/mirrors an unchanged
    // tooth (mirroring how setPerioSite/setFurcation/setPlaque signal `changed`).
    const entries = [...changes.entries()].filter(([toothNo, next]) =>
      JSON.stringify(serializeState(next)) !== JSON.stringify(serializeState(toothState.get(toothNo) ?? defaultState())));
    const changed = entries.map(([toothNo]) => toothNo);
    gateToothEditBatch(changed, ()=>{
      for(const [toothNo, next] of entries){
        toothState.set(toothNo, next);
        applyStateToSvg(toothNo);
        updateToothTileNumber(toothNo);
      }
      if(activeTooth){
        syncControlsFromState(toothState.get(activeTooth));
      }
      updateSelectionFilterButtons();
      // B9: applyStateToSvg only touches per-tooth SVG; notifyStateChange() is
      // what drives updateBridgeOverlay() (the bridge-span connector) + every
      // listener. Fire it ONCE here, after all changed teeth are applied — and
      // INSIDE the gated closure so it runs when the batch actually applies
      // (synchronously on the immediate path; on Accept for a deferred confirm),
      // never while the confirm is still pending.
      notifyStateChange();
    });
  };

  // Legacy crownMaterial values only ever offered "zircon" | "metal" here; fold
  // the deliberate metal -> metal-ceramic rename (matches the hydrateState migration).
  const toRestorationMaterial = (material: Any) => material === "metal" ? "metal-ceramic" : material;

  // Pillar (abutment) tooth: a present tooth gets a crown restoration, flagged
  // as a bridge pillar. Full multi-tooth bridge-span rendering on a tooth-base
  // pillar is an SP3b concern; this only sets the new-model fields.
  const setBridgeCrown = (s, material)=>{
    s.toothSubstrate = "crownprep";
    s.restorationType = "crown";
    s.restorationMaterial = toRestorationMaterial(material);
    s.bridgePillar = true;
    s.brokenMesial = false;
    s.brokenIncisal = false;
    s.brokenDistal = false;
  };

  // Pontic (gap) tooth: a missing tooth gets a bridge-type restoration.
  const setBridgePontic = (s, material)=>{
    s.restorationType = "bridge";
    s.restorationMaterial = toRestorationMaterial(material);
  };

  if(option.type === "span"){
    collect(option.teeth || [], (s)=>{
      if(s.toothSelection === "tooth-base"){
        setBridgeCrown(s, option.material);
      }else if(s.toothSelection === "none"){
        setBridgePontic(s, option.material);
      }
    });
    commit();
    return;
  }

  if(option.type === "arch-bridge"){
    const teeth = archTeeth(option.arch);
    const wisdom = new Set(archWisdom(option.arch));
    const present = teeth.filter(tn => toothState.get(tn)?.toothSelection === "tooth-base");
    if(present.length >= 2){
      const first = present[0];
      const last = present[present.length - 1];
      const startIdx = teeth.indexOf(first);
      const endIdx = teeth.indexOf(last);
      const between = startIdx < endIdx ? teeth.slice(startIdx + 1, endIdx) : [];
      collect(teeth, (s, tn)=>{
        if(wisdom.has(tn)) return;
        if(s.toothSelection === "tooth-base"){
          setBridgeCrown(s, option.material);
        }else if(s.toothSelection === "none" && between.includes(tn)){
          setBridgePontic(s, option.missingMaterial || option.material);
        }
      });
    }else{
      collect(teeth, (s, tn)=>{
        if(wisdom.has(tn)) return;
        if(s.toothSelection === "tooth-base"){
          setBridgeCrown(s, option.material);
        }
      });
    }
    commit();
    return;
  }

  if(option.type === "partial-removable"){
    const teeth = archTeeth(option.arch);
    const wisdom = new Set(archWisdom(option.arch));
    collect(teeth, (s, tn)=>{
      if(wisdom.has(tn)) return;
      if(s.toothSelection === "none"){
        s.prosthesis = "removable-partial";
      }
    });
    commit();
    return;
  }

  if(option.type === "full-removable"){
    const teeth = archTeeth(option.arch);
    const wisdom = new Set(archWisdom(option.arch));
    collect(teeth, (_s, tn)=>{
      const next = defaultState();
      next.toothSelection = "none";
      next.prosthesis = wisdom.has(tn) ? "none" : "removable-full";
      return next;
    });
    commit();
    return;
  }

  if(option.type === "bar-denture"){
    const implantTeeth = option.implants || [];
    const missingTeeth = option.missing || [];
    const archTeeth = option.arch ? (getStatusExtrasMeta()?.[option.arch] || []) : [];
    const sevenEight = archTeeth.filter(tn => [7,8].includes(tn % 10));
    collect(implantTeeth, (_s, _tn)=>{
      const next = defaultState();
      next.toothSelection = "implant";
      next.prosthesis = "bar-denture";
      return next;
    });
    collect(missingTeeth, (_s, _tn)=>{
      const next = defaultState();
      next.toothSelection = "none";
      next.prosthesis = "bar-denture";
      return next;
    });
    collect(sevenEight, (_s, _tn)=>{
      const next = defaultState();
      next.toothSelection = "none";
      return next;
    });
    commit();
  }
}

/** TEST-ONLY: apply a clinical status-extra preset (span/arch-bridge/removable/
 *  bar-denture) directly against the module-level state map. Not part of the
 *  public API. */
export function __applyStatusExtraForTest(option: Any): void {
  applyStatusExtra(option);
}

// ---- Load and build grid ----
let initialized = false;
let controlsWired = false;
let initToken = 0;

// `svgText` is the inlined SVG markup from a `?raw` import (see TEMPLATES) —
// parsed directly, never fetched. Kept `async` so existing `await loadSvg(...)`
// call sites are unchanged.
/** Parse and normalize one inlined template. Synchronous - the markup is
 *  compiled in, nothing is fetched - so a template can also be parsed on demand
 *  from a synchronous render path (see `syncToothTemplate`). */
function parseSvgTemplate(svgText: Any){
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.documentElement;
  // Normalize ids/attrs
  stripDisplayNoneToDataActive(svg);
  ensureDataActiveForSwitchables(svg);
  return svg;
}

async function loadSvg(svgText: Any){
  return parseSvgTemplate(svgText);
}

/** Namespace only ids declared inside `defs` and their fragment references.
 * Clinical layer ids stay unchanged because state activation addresses them
 * within each tooth SVG. Paint-server references follow document-wide SVG id
 * resolution, so every rendered tooth instance needs its own namespace. */
export function namespacePaintServers(root: Element, prefix: string): void {
  const replacements = new Map<string, string>();
  root.querySelectorAll("defs [id]").forEach((element) => {
    const oldId = element.id;
    const newId = `${prefix}${oldId}`;
    replacements.set(oldId, newId);
    element.id = newId;
  });
  if (replacements.size === 0) return;

  const rewrite = (value: string): string => {
    let next = value.replace(/url\(#([^)]+)\)/g, (match, id: string) => {
      const replacement = replacements.get(id);
      return replacement ? `url(#${replacement})` : match;
    });
    if (next.startsWith("#")) {
      const replacement = replacements.get(next.slice(1));
      if (replacement) next = `#${replacement}`;
    }
    return next;
  };

  root.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const next = rewrite(attribute.value);
      if (next !== attribute.value) element.setAttribute(attribute.name, next);
    }
  });
}

async function buildGrid(token: number){
  if(!initialized || token !== initToken) return;
  const grid = $("#toothGrid");
  if(!grid) return;
  grid.innerHTML = "";

  // preload SVG templates in parallel. Both caches are module-scoped so a tile
  // can be re-mounted from a different drawing later (see `syncToothTemplate`).
  // Neither is cleared on a rebuild: the entries below are overwritten anyway,
  // and dropping a deciduous drawing that was already fetched would make it be
  // fetched again - and flash the permanent artwork while it is in flight.
  // Permanent templates only. The eight deciduous ones are parsed on demand by
  // `syncToothTemplate`, so a chart with no milk teeth - the common case - does
  // not pay for drawings it never mounts. Preloading all seventeen nearly
  // doubled the work at startup and pushed a two-instance mount test past its
  // five-second budget.
  const tplNos = [11,12,13,14,15,16,17,18,41,42,43,44,45,46,47,48] as const;
  // ABGELEITET, nicht gepflegt. Diese Liste war die dritte Stelle, an der stand,
  // welche Positionen eine Kauflaechenansicht haben - nach `OCCLUSAL_TEMPLATE`
  // und dem inzwischen entfernten Platzhaltersatz. Als die erste
  // Frontzahn-Draufsicht dazukam, war sie eingetragen, gemountet, ausgeliefert
  // und trotzdem unsichtbar, weil sie hier fehlte. Wer ein Template eintraegt,
  // soll nirgends sonst daran denken muessen.
  const occlNos = [...new Set([...OCCLUSAL_TEMPLATE.values()].map((m: Any) => m.tpl))];
  await Promise.all([
    ...tplNos.map(async (tplNo) => {
      tplCache.set(tplNo, await loadSvg(TEMPLATES[tplNo]));
    }),
    ...occlNos.map(async (tplNo) => {
      const loader = occlusalTemplateLoader(tplNo);
      if(loader) occlCache.set(tplNo, await loadSvg(await loader()));
    }),
  ]);
  if(!initialized || token !== initToken) return;

  // Each arch is its own grid. The two arches do NOT have the same columns and
  // cannot: the lower incisors are barely two thirds the width of the upper
  // ones, so one shared column list either leaves the lower front standing
  // apart or crushes the upper front. Giving each arch its own columns is also
  // what puts the lower canine where the mouth puts it - between the upper
  // lateral and the upper canine - because the lower arch then comes out
  // narrower by exactly the four incisors' difference. `role="presentation"`
  // so the tiles stay children of the listbox in the accessibility tree.
  const upperArch = el("div", { class:"tooth-arch upper-arch", role:"presentation" });
  const lowerArch = el("div", { class:"tooth-arch lower-arch", role:"presentation" });
  grid.appendChild(upperArch);
  grid.appendChild(lowerArch);
  let arch: Any = upperArch;

  function addTile({toothNo, tplNo, rot, mirror, view, clickable}: Any){
    if(!initialized || token !== initToken) return;
    const tpl = view === "occl" ? occlCache.get(tplNo) : tplCache.get(tplNo);
    if(!tpl){
      // Eine LEERE Kachel, nicht gar keine. Ein `return` liess die Zelle
      // ersatzlos entfallen, und weil der Bogen ein Raster mit fester
      // Spaltenzahl ist, rutschte alles dahinter nach links: als 11_occl beim
      // ersten Versuch nicht im Cache lag, stand unter Label 22 die 24. Dirk,
      // 18.08.2026: "Ich sehe 22 okklusal aber mit einem Bild, das wie ein
      // Praemolar aussieht." Ein fehlendes Template darf eine Luecke geben,
      // aber nie den ganzen Bogen verschieben.
      if(view === "occl") addPlaceholderTile();
      return;
    }
    const svg = tpl.cloneNode(true);
    namespacePaintServers(svg, `tooth-${toothNo}-${view}-`);
    if(rot === 180) rotate180(svg);
    if(mirror) mirrorVertical(svg);

    const tileClasses = [
      "tooth-tile",
      // An occlusal template is named for the same position as a side-view one,
      // so both would carry the class `tpl-16` and the side view's per-template
      // SIZE rule in src/index.css would win on the occlusal tile - equal
      // specificity, later in the file. That was already true of tpl 14, 16 and
      // 46 while only tpl 34 escaped it; with a template per position it would
      // hit every posterior tile. The occlusal tiles get their own name.
      view === "occl" ? `tpl-${tplNo}-occl` : `tpl-${tplNo}`,
      toothNo >= 31 ? "lower-row" : "upper-row",
      view === "occl" ? "occl-view" : "side-view"
    ];
    if(!clickable) tileClasses.push("placeholder");

    const tile = el("div", { class: tileClasses.join(" "), "data-tooth": String(toothNo) }, [
      el("div", { class:"tooth-svg" })
    ]);
    $(".tooth-svg", tile).appendChild(svg);

    if(clickable){
      tile.addEventListener("click", (e)=>onToothClick(toothNo, e));
      tile.addEventListener("dblclick", ()=>{
        if(!notesEnabled || readOnly) return;
        showNoteEditor(toothNo);
      });
      tile.addEventListener("keydown", (e)=>onToothKeydown(toothNo, e));
      if(view === "side"){
        tile.setAttribute("role", "option");
        tile.setAttribute("aria-selected", "false");
        tile.setAttribute("tabindex", readOnly ? "-1" : "0");
        tile.setAttribute("aria-label", toLabel(toothNo, numberingSystem));
      }
      if(isTouchDevice()) addTouchToTile(tile, toothNo);
    }else{
      tile.removeAttribute("data-tooth");
    }

    arch.appendChild(tile);

    if(!toothSvgRoot.has(toothNo)) toothSvgRoot.set(toothNo, []);
    toothSvgRoot.get(toothNo).push(svg);
    if(!toothTile.has(toothNo)) toothTile.set(toothNo, []);
    toothTile.get(toothNo).push(tile);

    if(!toothState.has(toothNo)) toothState.set(toothNo, defaultState());
    applyStateToSvg(toothNo);
  }

  function addRowSide(rowTeeth: Any){
    for(const toothNo of rowTeeth){
      const map = TOOTH_TEMPLATE.get(toothNo);
      const tplNo = map ? map.tpl : 16;
      addTile({ toothNo, tplNo, rot: map?.rot ?? 0, mirror: map?.mirror ?? false, view: "side", clickable: true });
    }
  }

  function addPlaceholderTile(){
    const tile = el("div", { class:"tooth-tile occl-view placeholder" }, [
      el("div", { class:"tooth-svg" })
    ]);
    arch.appendChild(tile);
  }

  // OHNE zweite Liste. Bis 18.08.2026 stand daneben ein handgepflegter Satz
  // `upperOcclPlaceholders`/`lowerOcclPlaceholders` mit den Frontzahn-
  // Positionen - und der hat die erste Frontzahn-Draufsicht verschluckt: das
  // Template war eingetragen, die Tests gruen, und im Bogen blieb die Kachel
  // leer, weil der Satz vorher greift. Zwei Listen ueber dieselbe Frage sind
  // eine zu viel. `OCCLUSAL_TEMPLATE` entscheidet allein.
  function addRowOccl(rowTeeth: Any){
    for(const toothNo of rowTeeth){
      const map = OCCLUSAL_TEMPLATE.get(toothNo);
      if(!map){
        addPlaceholderTile();
        continue;
      }
      addTile({ toothNo, tplNo: map.tpl, rot: map.rot, mirror: map.mirror, view: "occl", clickable: true });
    }
  }

  function addLabelRow(rowTeeth: Any, targetMap: Any){
    const row = el("div", { class:"tooth-label-row", "aria-hidden":"true" });
    for(const toothNo of rowTeeth){
      const cell = el("div", { class:"tooth-label-cell", text: toLabel(toothNo, numberingSystem), tabindex:"-1" });
      cell.addEventListener("click", (e)=>onToothClick(toothNo, e));
      row.appendChild(cell);
      targetMap.set(toothNo, cell);
    }
    arch.appendChild(row);
  }

  const upperSide = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const lowerSide = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

  if(!initialized || token !== initToken) return;
  arch = upperArch;
  addLabelRow(upperSide, toothLabelUpper);
  addRowSide(upperSide);
  addRowOccl(upperSide);
  arch = lowerArch;
  addRowOccl(lowerSide);
  addRowSide(lowerSide);
  addLabelRow(lowerSide, toothLabelLower);

  // ARIA on grid container
  grid.setAttribute("role", "listbox");
  grid.setAttribute("aria-multiselectable", "true");

  // start with no tooth selected
  selectedTeeth = new Set();
  activeTooth = null;
  updateSelectionUI();
  updateToothTileVisibility();
  setOcclusalVisible(occlusalVisible);
  setHealthyPulpVisible(showHealthyPulp);

  syncToothDepthClass();

  // Bead odontogram-apn: drag to select. pointer* rather than mouse*, so the
  // same code carries mouse and stylus, and the existing touch handling below
  // stays untouched instead of there being two paths for one gesture.
  grid.addEventListener("pointerdown", onGridPointerDown);

  // Wire touch interactions
  if(isTouchDevice()){
    grid.addEventListener("touchstart", onGridTouchStart, { passive: false });
    grid.addEventListener("touchmove", onGridTouchMove, { passive: false });
    grid.addEventListener("touchend", onGridTouchEnd);
    buildArchToggle();
  }
}

// ---- Controls wiring ----
function wireControls(){
  // Collapse toggles and the global visibility toggles use delegated listeners
  // with stable function references, so addEventListener de-duplicates them.
  // Register on every init because destroyOdontogram removes them; the DOM
  // guarantees only one live listener each. These handle the `setX(!current)`
  // toggles that would otherwise cancel themselves out under React StrictMode's
  // double mount-effect (which re-wires anonymous listeners onto the same nodes).
  document.addEventListener("click", onCardToggleClick);
  document.addEventListener("click", onGlobalToggleClick);
  // Note: buildChecks/buildSurfaceCross/buildSelect below self-clear and create
  // fresh nodes, so re-running wireControls per init is safe; destroyOdontogram
  // empties those containers and they are rebuilt here.
  if(controlsWired) return;
  controlsWired = true;
  const iconButtons = ["btnOcclView","btnWisdomVisible","btnBoneVisible","btnPulpVisible"];
  iconButtons.forEach((id)=>{
    const btn = $(`#${id}`);
    if(btn) loadInlineIcon(btn).then(()=>syncIconXLine(btn));
  });

  // Tooth base dropdown
  buildSelect($("#toothSelect"), getToothSelectOptions(), (value)=>{
    applyToSelected((s, toothNo)=>{
      if(value === "milktooth" && MILKTOOTH_BLOCKED.has(toothNo)){
        return;
      }
      const next = defaultState();
      next.toothSelection = value;
      if(!["tooth-base","milktooth","implant","tooth-under-gum"].includes(value)){
        next.extractionPlan = false;
      }
      if(value !== "none"){
        next.extractionWound = false;
      }
      if(value === "implant" || value === "none"){
        next.caries.clear();
        next.endo = "none";
        next.pulpDx = "normal";
        next.fillingMaterial = "none";
        next.fillingSurfaces.clear();
      }
      toothState.set(toothNo, next);
    });
    if(value !== "none") setEdentulous(false);
  });

  // Substrate dropdown (tooth condition: natural / radix / broken / crown-prep)
  buildSelect($("#substrateSelect"), getSubstrateOptions(), (value)=>{
    applyToSelected((s)=>{
      s.toothSubstrate = value;
      if(value !== "broken"){
        s.brokenMesial = false;
        s.brokenIncisal = false;
        s.brokenDistal = false;
      }
      // crown-needed only applies while a natural/broken/prepared tooth is unrestored
      if(!["natural","broken","crownprep"].includes(value) || s.restorationType !== "none"){
        s.crownNeeded = false;
      }
    });
    setEdentulous(false);
  });

  // Combined restoration dropdown (crown / inlay / onlay / veneer / bridge ×
  // material). Value encodes `${type}|${material}` and writes BOTH fields.
  // At initial wiring there is no active tooth yet (options get narrowed by
  // syncControlsFromState/refreshAllSelectOptions once one is selected), but
  // thread ctx consistently in case activeTooth is already set (e.g. re-wire).
  const initialToothState = activeTooth ? toothState.get(activeTooth) : null;
  buildSelect($("#restorationSelect"), getRestorationOptions("occlusal", { isImplant: initialToothState?.toothSelection === "implant", toothSelection: initialToothState?.toothSelection }), (value)=>{
    const v = String(value);
    applyToSelected((s)=>{ applyRestorationSelection(s, v); });
    setEdentulous(false);
  });

  // SP7 Task 4: merged pulp/endo status. Custom-built (optgroups) rather than
  // via buildSelect; the change handler routes to pulpEndoOnSelect, which
  // enforces the mutual-exclusion invariant (endo <-> vital pulpDx).
  {
    const sel = $("#pulpEndoSelect");
    sel.addEventListener("change", () => {
      const value = sel.value;
      applyToSelected((s)=>{ pulpEndoOnSelect(s, value); });
    });
  }
  buildSelect($("#rootPostSelect"), getRootPostOptions(false), (value)=>{
    applyToSelected((s)=>{ s.rootPostType = value; });
  });

  // Bead odontogram-fu1: die beiden Pruefungen. Sie gehen NICHT ueber
  // applyToSelected, sondern je Zahn ueber setSensibility/setPercussion -
  // dort sitzt die Sperre (kein Implantat hat eine Pulpa), und eine Sperre,
  // die nur im Bedienfeld haengt, gilt fuer die Tastatur nicht.
  // Diese vier gehen NICHT ueber `applyToSelected`, weil die Sperren in den
  // Settern sitzen (kein Einwurzler nimmt ein resektives Verfahren an) - und
  // eine Sperre, die nur im Bedienfeld haengt, gilt fuer die Tastatur nicht.
  //
  // Dafuer muessen sie NACHHOLEN, was applyToSelected sonst mitmacht: neu
  // zeichnen und die Auflagen erneuern. Ohne das aendert sich der Zustand und
  // das Bild nicht - genau der Fehler, den Dirk am 20.08.2026 gesehen hat
  // ("Hemisection on 36 is not visible, nor was fracture before").
  const nachZeichnen = (betroffen: number[]) => {
    for(const toothNo of betroffen){
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
    }
    updateBridgeOverlay();
    if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
    notifyStateChange();
  };

  buildSelect($("#rootFractureSelect"), getRootFractureOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setRootFracture(toothNo, value, getRootFractureRoot(toothNo));
    nachZeichnen(betroffen);
  });
  $("#rootFractureRootSelect").addEventListener("change", (e)=>{
    const wurzel = (e.target as HTMLSelectElement).value;
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setRootFracture(toothNo, getRootFracture(toothNo), wurzel);
    nachZeichnen(betroffen);
  });
  buildSelect($("#rootResectionSelect"), getRootResectionOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setRootResection(toothNo, value, getRootResectionRoot(toothNo));
    nachZeichnen(betroffen);
  });
  $("#rootResectionRootSelect").addEventListener("change", (e)=>{
    const wurzel = (e.target as HTMLSelectElement).value;
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setRootResection(toothNo, getRootResection(toothNo), wurzel);
    nachZeichnen(betroffen);
  });
  $("#apicalRootSelect").addEventListener("change", (e)=>{
    const wurzel = (e.target as HTMLSelectElement).value;
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setApicalRoot(toothNo, wurzel);
    nachZeichnen(betroffen);
  });

  buildSelect($("#crownFractureTypeSelect"), getCrownFractureTypeOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setCrownFractureType(toothNo, value);
    nachZeichnen(betroffen);
  });
  buildSelect($("#crownMarginTypeSelect"), getCrownMarginTypeOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setCrownMarginType(toothNo, value);
    nachZeichnen(betroffen);
  });
  buildSelect($("#crownMarginSideSelect"), getCrownMarginSideOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setCrownMarginSide(toothNo, value);
    nachZeichnen(betroffen);
  });

  buildSelect($("#eruptionSelect"), getEruptionOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setEruptionStage(toothNo, value);
    nachZeichnen(betroffen);
  });

  for(const site of ["mesial", "distal"]){
    const gross = site === "mesial" ? "Mesial" : "Distal";
    buildSelect($(`#papilla${gross}Select`), getPapillaLossOptions(), (value)=>{
      const klasse = Number(value);
      const betroffen = Array.from(selectedTeeth) as number[];
      for(const toothNo of betroffen) setPapillaLoss(toothNo, site, klasse > 0 ? klasse : null);
      nachZeichnen(betroffen);
    });
  }

  buildSelect($("#sensibilitySelect"), getSensibilityOptions(), (value)=>{
    for(const toothNo of Array.from(selectedTeeth) as number[]) setSensibility(toothNo, value);
    if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
  });
  buildSelect($("#percussionSelect"), getPercussionOptions(), (value)=>{
    for(const toothNo of Array.from(selectedTeeth) as number[]) setPercussion(toothNo, value);
    if(activeTooth) syncControlsFromState(toothState.get(activeTooth));
  });

  // Apical (AAE) diagnosis
  buildSelect($("#apicalDxSelect"), getApicalDxOptions(), (value)=>{
    applyToSelected((s)=>{
      s.apicalDx = value;
      // SP7: granuloma/cyst is a refinement of apical periodontitis only.
      if(value !== "symptomatic-apical-periodontitis" && value !== "asymptomatic-apical-periodontitis"){
        s.periapicalType = "none";
      }
    });
  });

  // Resection
  $("#endoResection").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.endoResection = (e.target as HTMLInputElement).checked;
    });
  });

  // Parapulpal pin
  $("#parapulpalPin").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.parapulpalPin = (e.target as HTMLInputElement).checked;
    });
  });

  // Root resorption (SP4 Task 5: resorptionType enum — none / internal /
  // external-cervical picker; both subtypes render identically).
  buildSelect($("#resorptionSelect"), getResorptionOptions(), (value)=>{
    applyToSelected((s)=>{ s.resorptionType = value; });
  });

  // Peri-implant status (SP8 Task 5: implants only — supersedes the parodontal/
  // inflammation mods there).
  // odontogram-im1: the implant product block. Free text with a datalist
  // rather than a catalogue — there are hundreds of implant systems and nobody
  // would maintain a list of them, so the list is gathered from what this
  // practice has actually placed and needs no maintenance.
  for(const id of ["#implantManufacturer","#implantSystem","#implantDiameter","#implantLength","#implantUdi"]){
    const elx = $(id) as HTMLInputElement | null;
    if(!elx) continue;
    // `change`, not `input`: committing on every keystroke would push a
    // half-typed system name through the DS-1 gate and, in status mode on a
    // plan-edited tooth, raise the blocking confirm once per character.
    elx.addEventListener("change", ()=>commitImplantProduct());
    elx.addEventListener("blur", ()=>commitImplantProduct());
  }

  // odontogram-99h: derselbe Block fuer die Restauration, dieselbe Begruendung
  // fuer `change` statt `input`.
  for(const id of ["#restProdManufacturer","#restProdProduct","#restProdShade","#restProdLab","#restProdUdi"]){
    const elx = $(id) as HTMLInputElement | null;
    if(!elx) continue;
    elx.addEventListener("change", ()=>commitRestorationProduct());
    elx.addEventListener("blur", ()=>commitRestorationProduct());
  }

  for(const id of ["#fillProdManufacturer","#fillProdProduct","#fillProdShade","#fillProdUdi"]){
    const elx = $(id) as HTMLInputElement | null;
    if(!elx) continue;
    elx.addEventListener("change", ()=>commitFillingProduct());
    elx.addEventListener("blur", ()=>commitFillingProduct());
  }
  const fpm = $("#fillProdMaterial") as HTMLSelectElement | null;
  if(fpm) fpm.addEventListener("change", ()=>{
    fillProdMaterial = fpm.value;
    syncFillingProduct(activeTooth);
  });

  buildSelect($("#periImplantSelect"), getPeriImplantOptions(), (value)=>{
    applyToSelected((s)=>{ applyPeriImplantSelection(s, value); });
  });

  buildSelect($("#implantPositionSelect"), getImplantPositionOptions(), (value)=>{
    applyToSelected((s)=>{ if(s.toothSelection === "implant") s.implantPosition = value; });
  });

  // Extraction wound
  $("#extractionWound").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.extractionWound = (e.target as HTMLInputElement).checked;
    });
  });

  // Extraction plan
  $("#extractionPlan").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.extractionPlan = (e.target as HTMLInputElement).checked;
    });
  });

  // Crown replace
  $("#crownReplace").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.crownReplace = (e.target as HTMLInputElement).checked;
    });
  });

  // Crown needed
  $("#crownNeeded").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.crownNeeded = (e.target as HTMLInputElement).checked;
    });
  });

  // Crown leakage (marginal leakage on a crown/bridge restoration)
  // Bead odontogram-dma: element and side are ONE finding, so both controls
  // write through the same path — picking `none` clears the side with it.
  $("#retentionSelect").addEventListener("change", (e)=>{
    const value = String((e.target as HTMLSelectElement).value);
    applyToSelected((s: Any)=>{
      if(!retentionAllowed(s, value)) return;
      s.retention = value;
      if(value === "none") s.retentionSide = "none";
    });
    updateBridgeOverlay();
  });
  $("#retentionSideSelect").addEventListener("change", (e)=>{
    const value = String((e.target as HTMLSelectElement).value);
    applyToSelected((s: Any)=>{
      if(s.retention === "none" || !retentionAllowed(s, s.retention)) return;
      if(VALID_RETENTION_SIDE.has(value)) s.retentionSide = value;
    });
  });
  $("#crownLeakage").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.crownLeakage = (e.target as HTMLInputElement).checked;
    });
  });

  $("#splinted").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ if(isToothPresent(s.toothSelection)) s.splinted = on; });
  });

  $("#rootCap").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ if(rootCapAllowed(s)) s.rootCap = on; });
  });

  $("#occlusalSplint").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ if(isToothPresent(s.toothSelection)) s.occlusalSplint = on; });
  });

  buildSelect($("#occlusalFunctionSelect"), getOcclusalFunctionOptions(), (value)=>{
    const betroffen = Array.from(selectedTeeth) as number[];
    for(const toothNo of betroffen) setOcclusalFunction(toothNo, value);
    nachZeichnen(betroffen);
  });

  for(const [sf, cap] of [["mesial","Mesial"],["distal","Distal"],["buccal","Buccal"],["lingual","Lingual"],["occlusal","Occlusal"]]){
    $(`#onlayCov${cap}`).addEventListener("change", ()=>{
      const betroffen = Array.from(selectedTeeth) as number[];
      for(const toothNo of betroffen) toggleOnlaySurface(toothNo, sf);
      nachZeichnen(betroffen);
    });
    $(`#inlayCov${cap}`).addEventListener("change", ()=>{
      const betroffen = Array.from(selectedTeeth) as number[];
      for(const toothNo of betroffen) toggleInlaySurface(toothNo, sf);
      nachZeichnen(betroffen);
    });
    $(`#veneerCov${cap}`).addEventListener("change", ()=>{
      const betroffen = Array.from(selectedTeeth) as number[];
      for(const toothNo of betroffen) toggleVeneerSurface(toothNo, sf);
      nachZeichnen(betroffen);
    });
  }

  // Missing closed
  $("#missingClosed").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.missingClosed = (e.target as HTMLInputElement).checked;
    });
  });

  // Mobility
  buildSelect($("#mobilitySelect"), getMobilityOptions(), (value)=>{
    applyToSelected((s)=>{
      s.mobility = value;
    });
  });

  // SP-perio P1 Task 2: the 6-site PD/GM/BOP/SUP grid — built once here
  // (site identities are static), values synced per-tooth by syncPerioRow()
  // inside syncControlsFromState(). See buildPerioGrid's own doc comment.
  buildPerioGrid($("#perioGrid"));

  // Inflammations
  buildChecks($("#modsChecks"), MOD_OPTIONS, (id, on)=>{
    applyToSelected((s)=>{
      if(on) s.mods.add(id); else s.mods.delete(id);
    });
  });
  buildSelect($("#periapicalTypeSelect"), getPeriapicalTypeOptions(), (val)=>{
    applyToSelected((s)=>{ s.periapicalType = val; });
  });

  // Caries surfaces in a cross layout; subcrown stays as a separate row.
  // Toggling a surface on records its severity (from the active-depth dropdown);
  // toggling off clears it. Subcrown carries no per-surface severity. SP6 Task 1:
  // the single unified `cariesSeverity` map (was `cariesDepths`).
  const cariesOnToggle = (id: Any, on: Any)=>{
    applyToSelected((s)=>{
      if(on){
        s.caries.add(id);
        if(id !== "caries-subcrown") s.cariesSeverity.set(id.replace("caries-",""), s.cariesActiveDepth);
      }else{
        s.caries.delete(id);
        s.cariesSeverity.delete(id.replace("caries-",""));
      }
    });
  };
  buildSurfaceCross($("#cariesChecks"), [
    { value: "caries-buccal", labelKey: "surface.buccal", letter: "B", pos: "buccal" },
    { value: "caries-mesial", labelKey: "surface.mesial", letter: "M", pos: "mesial" },
    { value: "caries-occlusal", labelKey: "surface.occlusal", letter: "O", pos: "occlusal" },
    { value: "caries-distal", labelKey: "surface.distal", letter: "D", pos: "distal" },
    { value: "caries-lingual", labelKey: "surface.lingualPalatal", letter: "L", pos: "lingual" },
  ], cariesOnToggle);
  // Add a per-surface depth indicator (3 stacked bars) inside each caries cell.
  // Clicking it opens a popup to change that surface's depth (only when caried).
  $$("#cariesChecks .surface-cell").forEach((cell) => {
    const input = cell.querySelector("input") as HTMLInputElement | null;
    if(!input) return;
    const surface = String(input.value).replace("caries-", "");
    const ind = el("span", { class: "surf-depth", title: t("caries.detailsHint") }, [ el("i"), el("i"), el("i") ]);
    ind.addEventListener("click", (e: Any)=>{
      e.preventDefault();
      e.stopPropagation();
      if(!input.checked || readOnly) return;
      showCariesDepthPopup(surface, ind, activeTooth);
    });
    cell.appendChild(ind);
  });
  buildChecks($("#cariesSubcrownRow"), [
    { value: "caries-subcrown", labelKey: "surface.subcrown" },
  ], cariesOnToggle);
  buildSelect($("#cariesDepthSelect"), getCariesDepthOptions(), (val)=>{
    applyToSelected((s)=>{ s.cariesActiveDepth = Number(val); });
  });
  // SP5 Task 5: per-tooth root-caries picker. On change the selected value is
  // the canonical rootCaries enum (simple mode's "present" already maps to
  // "active-cavitated" — SP6 Task 3), so it writes straight to state.
  buildSelect($("#rootCariesSelect"), rootCariesOptions(), (value)=>{
    applyToSelected((s)=>{ s.rootCaries = value; });
  });

  // Filling material dropdown
  buildSelect($("#fillingSelect"), getFillingOptions(false), (mat)=>{
    applyToSelected((s)=>{
      s.fillingMaterial = mat;
      // Clearing the active material removes any existing per-surface fillings,
      // otherwise they would become orphaned (surface UI hides but state lingers,
      // still rendering/serializing/exporting). Keeps the map and set in sync.
      if(mat === "none"){
        s.fillingSurfaces.clear();
        s.fillingSurfaceMaterials.clear();
      }
    });
  });

  // Filling surfaces in a cross layout.
  buildSurfaceCross($("#fillingSurfaceChecks"), [
    { value: "buccal", labelKey: "surface.buccal", letter: "B", pos: "buccal" },
    { value: "mesial", labelKey: "surface.mesial", letter: "M", pos: "mesial" },
    { value: "occlusal", labelKey: "surface.occlusal", letter: "O", pos: "occlusal" },
    { value: "distal", labelKey: "surface.distal", letter: "D", pos: "distal" },
    { value: "lingual", labelKey: "surface.lingualPalatal", letter: "L", pos: "lingual" },
  ], (surf: Any, on: Any)=>{
    applyToSelected((s)=>{
      if(on && s.fillingMaterial !== "none"){
        s.fillingSurfaces.add(surf);
        s.fillingSurfaceMaterials.set(surf, s.fillingMaterial);
      }else{
        s.fillingSurfaces.delete(surf);
        s.fillingSurfaceMaterials.delete(surf);
      }
    });
  });
  // SP6 Task 2 (step 2): mirror the caries-cell per-surface indicator onto each
  // FILLING-surface cell. It signposts (and, via the contextual popup, authors)
  // recurrent caries on a filled surface — CSS shows it only when the filling
  // checkbox is checked, and the dark border (`.has-subcaries`) is toggled in
  // syncFillingSubcariesIndicator when the surface actually has caries.
  $$("#fillingSurfaceChecks .surface-cell").forEach((cell) => {
    const input = cell.querySelector("input") as HTMLInputElement | null;
    if(!input) return;
    const surface = String(input.value);
    const ind = el("span", { class: "surf-depth", title: t("caries.recurrentHint") }, [ el("i"), el("i"), el("i") ]);
    ind.addEventListener("click", (e: Any)=>{
      e.preventDefault();
      e.stopPropagation();
      if(!input.checked || readOnly) return;
      showCariesDepthPopup(surface, ind, activeTooth);
    });
    cell.appendChild(ind);
  });
  // SP10: LEFT-side per-surface filling-defect indicator (the RIGHT-side .surf-depth
  // authors recurrent caries; this authors the structural defect). Shown by CSS only
  // when the filling checkbox is checked; the dark border (.has-defect) is toggled in
  // syncFillingDefectIndicator when the surface actually carries a defect.
  $$("#fillingSurfaceChecks .surface-cell").forEach((cell) => {
    const input = cell.querySelector("input") as HTMLInputElement | null;
    if(!input) return;
    const surface = String(input.value);
    const ind = el("span", { class: "surf-defect", title: t("fillingDefect.label") }, [ el("i") ]);
    ind.addEventListener("click", (e: Any)=>{
      e.preventDefault(); e.stopPropagation();
      if(!input.checked || readOnly) return;
      showFillingDefectPopup(surface, ind, activeTooth);
    });
    cell.insertBefore(ind, cell.firstChild); // LEFT side
  });

  // Fissure sealing
  $("#fissureSealing").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.fissureSealing = (e.target as HTMLInputElement).checked;
    });
  });

  // Bead odontogram-d1b: cervical, side not documented (filling / caries)
  for(const [kind, id] of [["filling", "Filling"], ["caries", "Caries"]] as const){
    $("#cervicalUnknown" + id)?.addEventListener("change", (e: Event)=>{
      const on = (e.target as HTMLInputElement).checked;
      applyToSelected((s: Any)=>{
        if(!cervicalSideUnknownAllowed(s)) return;
        if(!s.cervicalSideUnknown) s.cervicalSideUnknown = new Set();
        if(on) s.cervicalSideUnknown.add(kind); else s.cervicalSideUnknown.delete(kind);
      });
    });
  }

  // Calculus
  $("#calculusToggle").addEventListener("change", (e)=>{
    applyToSelected((s)=>{ s.calculus = (e.target as HTMLInputElement).checked; });
  });

  // Contact point missing
  $("#contactMesial").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.contactMesial = (e.target as HTMLInputElement).checked;
    });
  });
  $("#contactDistal").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.contactDistal = (e.target as HTMLInputElement).checked;
    });
  });

  // Wear (SP11 Task 3: wearEdge/wearCervical enum pickers — replaces the
  // bruxism checkboxes; mirrors the #resorptionSelect buildSelect wiring).
  buildSelect($("#wearEdgeSelect"), getWearEdgeOptions(), (value)=>{
    applyToSelected((s)=>{ s.wearEdge = value; });
  });
  buildSelect($("#wearCervicalSelect"), getWearCervicalOptions(), (value)=>{
    applyToSelected((s)=>{ s.wearCervical = value; });
  });

  // Wear simple-mode toggles (SP13 Task 2: yes/no checkboxes shown instead of
  // the selects above when wearDetailLevel === "simple"; write the canonical
  // simple value on check, "none" on uncheck).
  $("#wearEdgeToggle").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ s.wearEdge = on ? "attrition" : "none"; });
  });
  $("#wearCervicalToggle").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ s.wearCervical = on ? "abrasion" : "none"; });
  });

  // Discoloration (SP12 Task 3: discoloration enum picker — mirrors the
  // wearEdge/wearCervical buildSelect wiring above).
  buildSelect($("#discolorationSelect"), getDiscolorationOptions(), (value)=>{
    applyToSelected((s)=>{ s.discoloration = value; });
  });

  // Discoloration simple-mode toggle (SP13 Task 2: mirrors the wear toggles
  // above; independent discolorationDetailLevel setting).
  $("#discolorationToggle").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ s.discoloration = on ? "other" : "none"; });
  });

  // Ortho (SP14 Task 3: appliance/drift/vertical enum pickers + rotation
  // boolean toggle — mirrors the discoloration buildSelect/toggle wiring
  // above).
  buildSelect($("#orthoApplianceSelect"), getOrthoApplianceOptions(), (value)=>{
    applyToSelected((s)=>{ s.orthoAppliance = value; });
  });
  buildSelect($("#orthoDriftSelect"), getOrthoDriftOptions(), (value)=>{
    applyToSelected((s)=>{ s.orthoDrift = value; });
  });
  buildSelect($("#orthoVerticalSelect"), getOrthoVerticalOptions(), (value)=>{
    applyToSelected((s)=>{ s.orthoVertical = value; });
  });
  buildSelect($("#orthoBracketSideSelect"), getOrthoBracketSideOptions(), (value)=>{
    applyToSelected((s)=>{ s.orthoBracketSide = value; });
  });
  $("#orthoRotationToggle").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ s.orthoRotation = on; });
  });

  $("#orthoProgressiveToggle").addEventListener("change", (e)=>{
    const on = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{ if(orthoAllowed(s)) s.orthoProgressive = on; });
  });

  // Bridge pillar
  $("#bridgePillar").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.bridgePillar = (e.target as HTMLInputElement).checked;
    });
  });

  // Bead odontogram-5rv: ueber `applyToSelected` wie der Pfeilerschalter
  // daneben, also durch die DS-1-Schranke und ueber die ganze Auswahl. Der
  // Waechter steht IM Rueckruf, nicht davor: eine Auswahl kann Pfeiler und
  // Glieder mischen, und die Angabe gehoert nur den Gliedern.
  $("#cantilever").addEventListener("change", (e)=>{
    const an = (e.target as HTMLInputElement).checked;
    applyToSelected((s)=>{
      if(cantileverAllowed(s)) s.cantilever = an;
    });
  });

  // Broken crown parts
  $("#brokenMesial").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.brokenMesial = (e.target as HTMLInputElement).checked;
    });
  });
  $("#brokenIncisal").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.brokenIncisal = (e.target as HTMLInputElement).checked;
    });
  });
  $("#brokenDistal").addEventListener("change", (e)=>{
    applyToSelected((s)=>{
      s.brokenDistal = (e.target as HTMLInputElement).checked;
    });
  });

  // Reset buttons
  $("#btnResetTooth").addEventListener("click", ()=>{
    if(selectedTeeth.size === 0) return;
    resetTeethGated(Array.from(selectedTeeth) as number[]);
  });

  $("#btnResetAll").addEventListener("click", ()=>{
    setEdentulous(false);
    resetCaseMeta(); // case-level patient metadata is part of the blank-slate reset (like edentulous)
    resetToothWidths(); // ... as are the measured crown widths (bead odontogram-c51.1)
    resetOcclusalMeasurements();
    resetExaminationContext(); // ... as is the examination identity it was recorded under
    resetExaminations();
    for(const toothNo of ALL_TEETH){
      toothState.set(toothNo, defaultState());
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
    }
    if(activeTooth){
      setControlsEnabled(true);
      syncControlsFromState(toothState.get(activeTooth));
    }
    // caseMeta was cleared above (resetCaseMeta) AFTER setEdentulous's early
    // notify fired, so the mounted case-metadata panel would otherwise show
    // stale patient data until the next unrelated change — notify once more now
    // that all blank-slate resets are done, so subscribers re-read cleared state.
    notifyStateChange();
  });

  // Bead odontogram-iqj: der Vorschlag aus dem Alter, neben den Presets.
  $("#btnApplyDentitionSuggestion").addEventListener("click", ()=>{
    const v = getDentitionSuggestion();
    if(v) applyDentitionSuggestion(v.kind);
  });
  $("#btnPrimaryDentition").addEventListener("click", applyPrimaryDentition);

  $("#btnMixedDentition").addEventListener("click", applyMixedDentition);

  // Status extras
  const statusExtras = getStatusExtras();
  if(statusExtras.length){
    const statusOptions = statusExtras.map((opt)=>({ value: opt.id, label: opt.label }));
    buildSelect($("#statusExtraSelect"), statusOptions, ()=>{});
    setSelectOptions($("#statusExtraSelect"), statusOptions, statusOptions[0]?.value);
    $("#statusExtraApply").addEventListener("click", ()=>{
      const id = $("#statusExtraSelect").value;
      const option = statusExtras.find(o => o.id === id);
      applyStatusExtra(option);
    });
  }

  $("#btnSelectAll").addEventListener("click", ()=>{
    selectedTeeth = new Set(ALL_TEETH);
    activeTooth = ALL_TEETH[0];
    updateToothTileVisibility();
  });
  $("#btnSelectAllPresent").addEventListener("click", ()=>{
    const present = ALL_TEETH.filter(tn => toothState.get(tn)?.toothSelection !== "none");
    selectedTeeth = new Set(present);
    activeTooth = present[0] ?? null;
    updateToothTileVisibility();
  });
  $("#btnSelectPermanent").addEventListener("click", ()=>{
    const permanent = ALL_TEETH.filter(tn => toothState.get(tn)?.toothSelection === "tooth-base");
    selectedTeeth = new Set(permanent);
    activeTooth = permanent[0] ?? null;
    updateToothTileVisibility();
  });
  $("#btnSelectMilk").addEventListener("click", ()=>{
    const milk = ALL_TEETH.filter(tn => toothState.get(tn)?.toothSelection === "milktooth");
    selectedTeeth = new Set(milk);
    activeTooth = milk[0] ?? null;
    updateToothTileVisibility();
  });
  $("#btnSelectImplants").addEventListener("click", ()=>{
    const implants = ALL_TEETH.filter(tn => toothState.get(tn)?.toothSelection === "implant");
    selectedTeeth = new Set(implants);
    activeTooth = implants[0] ?? null;
    updateToothTileVisibility();
  });
  $("#btnSelectAllMissing").addEventListener("click", ()=>{
    const missing = ALL_TEETH.filter(tn => toothState.get(tn)?.toothSelection === "none");
    selectedTeeth = new Set(missing);
    activeTooth = missing[0] ?? null;
    updateToothTileVisibility();
  });
  $("#btnSelectUpper").addEventListener("click", ()=>{
    selectedTeeth = new Set(ALL_TEETH.filter(tn => tn >= 11 && tn <= 28));
    activeTooth = 11;
    updateToothTileVisibility();
  });
  $("#btnSelectUpperFront").addEventListener("click", ()=>{
    const front = [13,12,11,21,22,23];
    selectedTeeth = new Set(front);
    activeTooth = front[0];
    updateToothTileVisibility();
  });
  $("#btnSelectUpperMolar").addEventListener("click", ()=>{
    const molars = [18,17,16,26,27,28];
    selectedTeeth = new Set(molars);
    activeTooth = molars[0];
    updateToothTileVisibility();
  });
  $("#btnSelectLower").addEventListener("click", ()=>{
    selectedTeeth = new Set(ALL_TEETH.filter(tn => tn >= 31 && tn <= 48));
    activeTooth = 31;
    updateToothTileVisibility();
  });
  $("#btnSelectLowerFront").addEventListener("click", ()=>{
    const front = [43,42,41,31,32,33];
    selectedTeeth = new Set(front);
    activeTooth = front[0];
    updateToothTileVisibility();
  });
  $("#btnSelectLowerMolar").addEventListener("click", ()=>{
    const molars = [38,37,36,46,47,48];
    selectedTeeth = new Set(molars);
    activeTooth = molars[0];
    updateToothTileVisibility();
  });
  $("#btnSelectNone").addEventListener("click", ()=>{
    selectedTeeth = new Set();
    activeTooth = null;
    updateSelectionUI();
  });
  $("#btnSelectNoneChart").addEventListener("click", ()=>{
    selectedTeeth = new Set();
    activeTooth = null;
    updateSelectionUI();
  });

  // R2-A Task 3: Status | Plan chart-mode toggle (chart-header, separate from
  // both the topbar and the right Controls panel).
  $("#chartModeStatus").addEventListener("click", ()=>setChartMode("status"));
  $("#chartModePlan").addEventListener("click", ()=>setChartMode("plan"));

  // The global visibility toggles (edentulous / wisdom / occlusal / bone / pulp)
  // are handled by the delegated onGlobalToggleClick listener registered above.

  // Card collapse toggles use a single delegated listener on `document` (see
  // onCardToggleClick). Here we only set the initial a11y labels to match each
  // card's current collapsed state; the click handling is delegation-based.
  const statusCard = $("#statusCard");
  const statusToggle = $("#btnToggleStatusCard");
  if(statusCard && statusToggle){
    applyToggleA11y(statusToggle, "status.title", statusCard.classList.contains("collapsed"));
  }
  const controlsToggle = $("#btnToggleControlsCard");
  const controlsActions = $("#controlsActions");
  if(controlsToggle && controlsActions){
    applyToggleA11y(controlsToggle, "panel.controls", controlsActions.classList.contains("hidden"));
  }
  [
    { card: "#cariesSection", btn: "#btnToggleCariesCard", labelKey: "caries.title" },
    { card: "#fillingSection", btn: "#btnToggleFillingCard", labelKey: "filling.title" },
    { card: "#rootPeriodontiumSection", btn: "#btnToggleRootPeriodontiumCard", labelKey: "card.rootPeriodontium" },
  ].forEach(({card, btn, labelKey})=>{
    const cardEl = $(card);
    const btnEl = $(btn);
    if(!cardEl || !btnEl) return;
    applyToggleA11y(btnEl, labelKey, cardEl.classList.contains("collapsed"));
  });

  const exportBtn = $("#btnStatusExport") as HTMLButtonElement | null;
  const importBtn = $("#btnStatusImport") as HTMLButtonElement | null;
  const importInput = $("#statusImportInput") as HTMLInputElement | null;
  if(exportBtn){
    exportBtn.onclick = () => exportStatus();
  }
  const pngBtn = $("#btnStatusPngExport") as HTMLButtonElement | null;
  const jpgBtn = $("#btnStatusJpgExport") as HTMLButtonElement | null;
  const svgBtn = $("#btnStatusSvgExport") as HTMLButtonElement | null;
  if(pngBtn){
    pngBtn.onclick = () => { exportImage("png").catch((e)=>console.error("PNG export failed", e)); };
  }
  if(jpgBtn){
    jpgBtn.onclick = () => { exportImage("jpg").catch((e)=>console.error("JPG export failed", e)); };
  }
  if(svgBtn){
    svgBtn.onclick = () => { exportSvg().catch((e)=>console.error("SVG export failed", e)); };
  }
  if(importBtn && importInput){
    importBtn.onclick = () => {
      importInput.value = "";
      importInput.click();
    };
    importInput.onchange = async ()=>{
      const file = importInput.files?.[0];
      if(!file) return;
      try{
        const text = await file.text();
        const data = JSON.parse(text);
        importStatus(data);
      }catch(e){
        console.error("Odontogram import failed", e);
      }finally{
        importInput.value = "";
      }
    };
  }
}

/**
 * Switch the displayed tooth numbering system and re-render all tooth labels.
 * @param system - The target {@link NumberingSystem}.
 */
export function setNumberingSystem(system: NumberingSystem){
  if(system === numberingSystem) return;
  numberingSystem = system;
  updateAllToothTileNumbers();
  updateActiveLabel();
  // The schematic view and the summary print numbers from state: tell them.
  notifyStateChange();
}

/**
 * Initialise the odontogram engine: wire up DOM controls, build the SVG tooth
 * grid, and start listening for i18n changes. Safe to call multiple times
 * (subsequent calls are no-ops).
 */
export async function initOdontogram(){
  if(initialized) return;
  initialized = true;
  const token = ++initToken;
  wireControls();
  await buildGrid(token);
  if(!initialized || token !== initToken) return;
  // Paint the (fork default) restoration palette onto the freshly built grid.
  // Upstream shipped an empty palette, so init wrote nothing; this fork seeds
  // Dirk's colours, which must be pushed onto the cascade once #toothGrid exists.
  syncRestorationPalette();
  if(!i18nUnsubscribe){
    i18nUnsubscribe = onI18nChange(()=>refreshLocalizedContent());
  }
  refreshLocalizedContent();
  // ensure controls match initial active tooth (if any)
  if(activeTooth != null){
    const state = toothState.get(activeTooth);
    if(state){
      syncControlsFromState(state);
    }
  }
  setupBridgeOverlayResize();
  notifyStateChange();
  // R2-A Task 3: reflect the initial chart mode ("status") in the toggle UI
  // on first mount, same as any other setChartMode()-driven sync.
  syncChartModeUi();
}

/**
 * Tear down the odontogram engine: clear all DOM elements built by the engine,
 * unsubscribe from i18n changes, and reset internal state. After this call,
 * {@link initOdontogram} may be called again to re-initialise.
 */

export function destroyOdontogram(){
  if(!initialized) return;
  initialized = false;
  initToken++;
  controlsWired = false;
  teardownBridgeOverlayResize();
  document.removeEventListener("click", onCardToggleClick);
  document.removeEventListener("click", onGlobalToggleClick);
  if(i18nUnsubscribe){
    i18nUnsubscribe();
    i18nUnsubscribe = null;
  }
  // Clear DOM fragments built by the odontogram engine
  const grid = $("#toothGrid") as HTMLElement | null;
  if(grid){
    grid.removeEventListener("touchstart", onGridTouchStart);
    grid.removeEventListener("touchmove", onGridTouchMove);
    grid.removeEventListener("touchend", onGridTouchEnd);
    grid.style.transform = "";
    grid.classList.remove("odon-pinch-active", "odon-arch-upper", "odon-arch-lower");
    grid.innerHTML = "";
  }
  if(archToggleBar){ archToggleBar.remove(); archToggleBar = null; }
  hideZoomPopover();
  hideContextMenu();
  hideNoteEditor();
  if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
  pinchScale = 1;
  isPinching = false;
  archMode = "both";
  readOnly = false;
  notesEnabled = false;
  pluginOverlays.clear();
  const mods = $("#modsChecks") as HTMLElement | null;
  if(mods) mods.innerHTML = "";
  const caries = $("#cariesChecks") as HTMLElement | null;
  if(caries) caries.innerHTML = "";
  const cariesSub = $("#cariesSubcrownRow") as HTMLElement | null;
  if(cariesSub) cariesSub.innerHTML = "";
  const fillings = $("#fillingSurfaceChecks") as HTMLElement | null;
  if(fillings) fillings.innerHTML = "";
  const statusExtra = $("#statusExtraSelect") as HTMLSelectElement | null;
  if(statusExtra) statusExtra.innerHTML = "";
  // R2-A Task 1: a full teardown resets the whole case — BOTH charts, not
  // just the active one — and drops back to "status" mode so a subsequent
  // initOdontogram() starts clean (mirrors the pre-dual-state behavior of a
  // single cleared toothState).
  charts.status.clear();
  clearPlanAlternatives();
  resetShorthandInput();
  pendingDualStateConfirm = null;
  chartMode = "status";
  toothState = charts.status;
  resetCaseMeta();
  resetToothWidths(); // measured crown widths are session state, cleared with everything else
  resetOcclusalMeasurements();
  resetExaminationContext();
  resetExaminations();
  toothSvgRoot.clear();
  toothTile.clear();
  toothLabelUpper.clear();
  toothLabelLower.clear();
  selectedTeeth = new Set();
  activeTooth = null;
}

/**
 * Clear the current tooth selection and reset the active tooth. Useful when
 * switching to view or quote-builder mode from the host application.
 */
export function clearSelection(){
  selectedTeeth = new Set();
  activeTooth = null;
  selectionAnchor = null;
  updateSelectionUI();
}
/**
 * Register one or more custom SVG plugins. Plugins can inject visual overlays
 * into the tooth SVG and maintain per-tooth custom state included in export/import.
 *
 * @param plugins - Array of {@link OdontogramPlugin} definitions.
 */
export function registerPlugins(plugins: OdontogramPlugin[]){
  registeredPlugins = [...plugins];
  // Re-render plugin overlays for all teeth
  for(const toothNo of ALL_TEETH){
    applyPluginOverlays(toothNo);
    updateToothTooltip(toothNo);
  }
}

/**
 * Set a plugin's custom state for a specific tooth. Triggers SVG re-render
 * for that tooth and updates the tooltip.
 *
 * @param toothNo - The FDI tooth number (11–48).
 * @param pluginId - The plugin's unique identifier.
 * @param value - The custom state value (any JSON-serializable value, or `undefined` to clear).
 */
export function setPluginState(toothNo: number, pluginId: string, value: unknown){
  const state = toothState.get(toothNo);
  if(!state) return;
  if(value === undefined){
    delete state.customStates[pluginId];
  }else{
    state.customStates[pluginId] = value;
  }
  applyStateToSvg(toothNo);
  updateToothTileNumber(toothNo);
}

/**
 * Get a plugin's custom state for a specific tooth.
 *
 * @param toothNo - The FDI tooth number (11–48).
 * @param pluginId - The plugin's unique identifier.
 * @returns The custom state value, or `undefined` if not set.
 */
export function getPluginState(toothNo: number, pluginId: string): unknown{
  const state = toothState.get(toothNo);
  return state?.customStates?.[pluginId];
}

/**
 * Get a human-readable summary of all active states for a tooth.
 * Useful for building custom tooltip or info-panel UIs.
 *
 * @param toothNo - The FDI tooth number (11–48).
 * @returns Array of localized state description strings.
 */
export function getToothStateSummary(toothNo: number): string[]{
  return getStateSummary(toothNo);
}

/** Read-only, structured projection of a tooth's ACTIVE-chart state for a
 *  display renderer (the schematic chart). Sets become arrays, Maps become
 *  plain records — a DOM-free consumer can read it without touching the live
 *  Map objects. Absent = default; only the fields the schematic draws. */
export type ToothDisplayState = {
  toothSelection: string; toothSubstrate: string;
  restorationType: string; restorationMaterial: string;
  caries: string[]; cariesSeverity: Record<string, number>;
  fillingSurfaces: string[]; fillingSurfaceMaterials: Record<string, string>;
  rootCaries: string; endo: string; rootPostType: string;
  pulpDx: string; apicalDx: string; apicalRoot: string; periapicalType: string;
  extractionPlan: boolean; crownNeeded: boolean; crownReplace: boolean;
  crownLeakage: boolean; mobility: string; bridgePillar: boolean;
  cantilever: boolean; eruptionStage: string; prosthesis: string;
  calculus: boolean; retention: string;
  implantPosition: string;
  endoCanals: Record<string, string[]>;
  rootResection: string; rootResectionRoot: string; endoResection: boolean;
  brokenMesial: boolean; brokenIncisal: boolean; brokenDistal: boolean;
  crownFractureType: string;
  crownMarginType: string; crownMarginSide: string;
  splinted: boolean; occlusalSplint: boolean; occlusalFunction: string;
  rootCap: boolean; onlayCoverage: string[]; inlayCoverage: string[]; veneerCoverage: string[];
  // read by the schematic's shorthand lane (charly's `)L(`, `Fra`, `+ − ?`, `p`)
  missingClosed: boolean; rootFracture: string; sensibility: string; percussion: string;
  // bead odontogram-d1b: the cervical marker per surface (only where it still
  // applies) and the tooth-level "cervical, side not documented"
  cervicalSurfaces: string[]; cervicalSideUnknown: string[];
};

export function getToothDisplayState(toothNo: number): ToothDisplayState {
  const s: Any = toothState.get(toothNo) ?? defaultState();
  const arr = (v: Any): string[] => v instanceof Set ? [...v] : Array.isArray(v) ? v : [];
  const rec = (v: Any): Record<string, Any> => {
    if(v instanceof Map) return Object.fromEntries(v);
    return (v && typeof v === "object") ? { ...v } : {};
  };
  return {
    toothSelection: String(s.toothSelection ?? "tooth-base"),
    toothSubstrate: String(s.toothSubstrate ?? "natural"),
    restorationType: String(s.restorationType ?? "none"),
    restorationMaterial: String(s.restorationMaterial ?? "none"),
    caries: arr(s.caries),
    cariesSeverity: rec(s.cariesSeverity) as Record<string, number>,
    fillingSurfaces: arr(s.fillingSurfaces),
    fillingSurfaceMaterials: rec(s.fillingSurfaceMaterials) as Record<string, string>,
    rootCaries: String(s.rootCaries ?? "none"),
    endo: String(s.endo ?? "none"),
    rootPostType: String(s.rootPostType ?? "none"),
    pulpDx: String(s.pulpDx ?? "normal"),
    apicalDx: String(s.apicalDx ?? "normal"),
    apicalRoot: String(s.apicalRoot ?? ""),
    periapicalType: String(s.periapicalType ?? "none"),
    extractionPlan: !!s.extractionPlan,
    crownNeeded: !!s.crownNeeded,
    crownReplace: !!s.crownReplace,
    crownLeakage: !!s.crownLeakage,
    mobility: String(s.mobility ?? "none"),
    bridgePillar: !!s.bridgePillar,
    cantilever: !!s.cantilever,
    eruptionStage: String(s.eruptionStage ?? "none"),
    prosthesis: String(s.prosthesis ?? "none"),
    calculus: !!s.calculus,
    retention: String(s.retention ?? "none"),
    implantPosition: String(s.implantPosition ?? "center"),
    endoCanals: Object.fromEntries(
      Object.entries((s.endoCanals ?? {}) as Record<string, string[]>).map(([k, v]) => [k, [...(v ?? [])]]),
    ),
    rootResection: String(s.rootResection ?? "none"),
    rootResectionRoot: String(s.rootResectionRoot ?? ""),
    endoResection: !!s.endoResection,
    brokenMesial: !!s.brokenMesial,
    brokenIncisal: !!s.brokenIncisal,
    brokenDistal: !!s.brokenDistal,
    crownFractureType: String(s.crownFractureType ?? "none"),
    crownMarginType: String(s.crownMarginType ?? "none"),
    crownMarginSide: String(s.crownMarginSide ?? ""),
    splinted: !!s.splinted,
    occlusalSplint: !!s.occlusalSplint,
    occlusalFunction: String(s.occlusalFunction ?? "none"),
    rootCap: !!s.rootCap,
    onlayCoverage: Array.isArray(s.onlayCoverage) ? [...s.onlayCoverage] : [],
    inlayCoverage: Array.isArray(s.inlayCoverage) ? [...s.inlayCoverage] : [],
    veneerCoverage: Array.isArray(s.veneerCoverage) ? [...s.veneerCoverage] : [],
    missingClosed: !!s.missingClosed,
    rootFracture: String(s.rootFracture ?? "none"),
    sensibility: String(s.sensibility ?? "none"),
    percussion: String(s.percussion ?? "none"),
    cervicalSurfaces: SUMMARY_SURFACE_ORDER.filter((surf) => s.cervicalSurfaces?.has?.(surf) && cervicalInvolvementApplies(s, surf)),
    cervicalSideUnknown: cervicalSideUnknownAllowed(s)
      ? CERVICAL_UNKNOWN_KINDS.filter((k) => s.cervicalSideUnknown?.has?.(k)) : [],
  };
}

/** One heading + its per-tooth entries in the tooth-information summary. */
export type OdontogramSummarySection = {
  key: "caries" | "fillings" | "endo" | "diagnoses" | "wear" | "discoloration" | "orthodontics" | "prosthetics";
  heading: string;
  items: string[];
  /** Localized "no such tooth" sentence, shown when `items` is empty. */
  emptyText: string;
};

/** Structured, already-localized textual summary of the whole odontogram. */
export type OdontogramSummary = {
  overview: string;
  permanentList: string | null;
  missingList: string | null;
  /** Positions whose tooth has not erupted, e.g. the six-year molars in a
   *  milk dentition. Never counted among the missing ones. */
  uneruptedList: string | null;
  sections: OdontogramSummarySection[];
  /** Implants heading + list — only present when at least one implant exists. */
  implants: { heading: string; text: string } | null;
  periodontalTitle: string;
  periodontalText: string;
  /** R2-B Task 2: the status->plan diff (see {@link getPlanChanges}), verbatim.
   *  `[]` whenever the plan chart hasn't been initialized or plan === status —
   *  a distinct field, not a section, since it's a diff rather than a status
   *  list. The "What changes" box in App.tsx renders from this field only
   *  when it's non-empty. */
  plannedChanges: PlanChange[];
  /** 2.2.1: per-tooth free-text notes — one "&lt;tooth&gt;: &lt;note&gt;" line per tooth
   *  that carries a note (gated on the notes-enabled setting, like the tooltip).
   *  `null` when no tooth has a note, so the panel omits the section entirely. */
  individualNotes: { heading: string; items: string[] } | null;
};

const SUMMARY_SURFACE_ORDER = ["buccal", "mesial", "occlusal", "distal", "lingual", "subcrown"];
/** SP6 Task 4 (§8) / SP16 Task 2: the letter used for `surface` in a
 *  per-tooth "(...)" summary — delegates to {@link surfaceLetter}, which is
 *  position-aware (incisal/labial/palatal) in "full" notation mode (the
 *  default) and respects the `surfaceNotation` setting. Shared by
 *  {@link subcariesLettersForTooth} and {@link getOdontogramSummary}'s
 *  per-tooth caries/fillings/radiographic-depth lists, so every existing
 *  summary that names a surface picks up the position-aware letter too. */
function summarySurfaceLetter(surface: string, toothNo: number): string {
  return surfaceLetter(surface, toothNo);
}
const SUMMARY_ENDO_KEY: Record<string, string> = {
  "endo-medical-filling": "endo.option.medicalFilling",
  "endo-filling": "endo.option.filling",
  "endo-filling-incomplete": "endo.option.incompleteFilling",
  "endo-glass-pin": "endo.option.glassPin",
  "endo-metal-pin": "endo.option.metalPin",
};
// FIX 3: map the `rootCaries` enum value ("active-cavitated") to its i18n key
// ("rootCaries.activeCavitated") so a root-caries-only tooth isn't summary-invisible.
const SUMMARY_ROOT_CARIES_KEY: Record<string, string> = {
  active: "rootCaries.active",
  arrested: "rootCaries.arrested",
  "active-cavitated": "rootCaries.activeCavitated",
};
/** Formats a tooth number for display using the active numbering system AND
 *  the milktooth display-remap ({@link getDisplayedToothNumber}) — the exact
 *  same formatting {@link getOdontogramSummary} uses for every tooth number
 *  it prints (permanent/missing lists, per-section entries, implants). Exported
 *  so the "What changes" box in App.tsx can label a {@link PlanChange.toothNo}
 *  identically, without duplicating the numbering/milktooth logic. */
export function formatToothLabel(toothNo: number): string {
  return toLabel(getDisplayedToothNumber(toothNo), numberingSystem);
}

/**
 * Build a human-readable, localized summary of the current odontogram state:
 * tooth counts, present/missing lists, and caries / fillings / endo /
 * prosthetics / periodontal sections. Numbers respect the active numbering
 * system. Intended for the optional "tooth information" panel; call
 * {@link onStateChange} to refresh it on edits.
 */
export function getOdontogramSummary(): OdontogramSummary {
  const lbl = formatToothLabel;

  const permanent: number[] = [];
  const missing: number[] = [];
  /** Positions whose tooth has not erupted - distinct from missing. */
  const unerupted: number[] = [];
  const implants: number[] = [];
  let milkCount = 0;
  const caries: string[] = [];
  const fillings: string[] = [];
  const endo: string[] = [];
  const prosthetics: string[] = [];
  const inflamed: string[] = [];
  const diagnoses: string[] = [];
  const wear: string[] = [];
  const discoloration: string[] = [];
  const orthodontics: string[] = [];
  const notes: string[] = [];

  for(const toothNo of ALL_TEETH){
    const s = toothState.get(toothNo);
    if(!s) continue;
    // 2.2.1: per-tooth free-text note — gated on the notes-enabled setting,
    // mirroring the hover tooltip so a disabled feature never surfaces notes.
    if(notesEnabled && s.note && s.note.trim() !== "")
      notes.push(`${formatToothLabel(toothNo)}: ${s.note.trim()}`);
    const sel = s.toothSelection;
    const isMissing = sel === "none";
    const isImplant = sel === "implant";
    const isMilk = sel === "milktooth";
    // A tooth that has not erupted is counted apart from the missing ones.
    // Nothing was lost and nothing is absent that ought to be there, so a
    // healthy milk dentition must not report twelve missing teeth
    // (odontogram-8vu).
    const isUnerupted = sel === "not-erupted";
    if(isUnerupted) unerupted.push(toothNo);
    else if(isMissing) missing.push(toothNo);
    else if(isImplant) implants.push(toothNo);
    else if(isMilk) milkCount++;
    else permanent.push(toothNo);

    // Caries (primary vs. secondary). SP6 Task 1: a surface is RECURRENT
    // (secondary) caries when it also carries a filling — recurrence is DERIVED
    // from `caries ∩ fillingSurfaceMaterials` (the state machine), not from a
    // separate stored flag. The unified `cariesSeverity` is read as CARS there
    // and ICDAS on the primary (no-filling) surfaces.
    if(s.caries && s.caries.size > 0){
      const primary: string[] = [];
      const secondary: string[] = [];
      for(const surface of SUMMARY_SURFACE_ORDER){
        if(!s.caries.has("caries-" + surface)) continue;
        const letter = summarySurfaceLetter(surface, toothNo);
        if(s.fillingSurfaceMaterials && s.fillingSurfaceMaterials.has(surface)) secondary.push(letter);
        else primary.push(letter);
      }
      const parts: string[] = [];
      if(primary.length) parts.push(primary.join(", "));
      if(secondary.length) parts.push(secondary.join(", ") + " - " + t("toothInfo.secondary"));
      if(parts.length){
        const sev = cariesSeverityTierLabel(s);
        // Bead odontogram-wxt: a caries surface that reaches the neck says so
        // here. Only surfaces WITHOUT a filling — a filled one is reported on
        // the Fillings line below, and one finding must not be qualified twice.
        const cerv = SUMMARY_SURFACE_ORDER
          .filter((surface) => s.cervicalSurfaces?.has(surface)
            && s.caries.has("caries-" + surface)
            && !s.fillingSurfaceMaterials?.has(surface))
          .map((surface) => summarySurfaceLetter(surface, toothNo));
        const cervSuffix = cerv.length ? ` – ${t("cervical.label")}: ${cerv.join(", ")}` : "";
        caries.push(`${lbl(toothNo)} (${parts.join("; ")})${sev ? " – " + sev : ""}${cervSuffix}`);
      }
    }

    // Root caries (FIX 3) — a present-tooth finding independent of surface
    // caries, so a tooth with ONLY root caries would otherwise never appear in
    // the caries section. Follows the surface-caries "label (detail)" style.
    if(s.rootCaries && s.rootCaries !== "none"){
      const rootKey = SUMMARY_ROOT_CARIES_KEY[s.rootCaries];
      if(rootKey) caries.push(`${lbl(toothNo)} (${t(rootKey)})`);
    }

    // Radiographic caries depth (FIX 3) — per-surface, independent of the
    // visual caries layer; surface any recorded depth so it isn't summary-
    // invisible. Style: "16 (M: Dentin, outer third (D1))".
    if(s.radiographicDepth && s.radiographicDepth.size > 0){
      const depths = SUMMARY_SURFACE_ORDER
        .filter((surface) => s.radiographicDepth.has(surface))
        .map((surface) => `${summarySurfaceLetter(surface, toothNo)}: ${t("radiographicDepth." + s.radiographicDepth.get(surface))}`);
      if(depths.length) caries.push(`${lbl(toothNo)} (${depths.join(", ")})`);
    }

    // Fillings (surfaces)
    if(s.fillingSurfaceMaterials && s.fillingSurfaceMaterials.size > 0){
      const letters = SUMMARY_SURFACE_ORDER
        .filter((surface) => s.fillingSurfaceMaterials.has(surface))
        .map((surface) => summarySurfaceLetter(surface, toothNo));
      if(letters.length){
        // SP10: defect suffix gated on !hasCrown to match the render
        // (applyStateToSvgSingle), which suppresses fillings/defects entirely
        // under a crown/bridge; the base filling-presence line above stays
        // unchanged (pre-existing behavior, out of scope for this fix).
        const defects = s.restorationType === "none"
          ? SUMMARY_SURFACE_ORDER
              .filter((surface) => s.fillingDefect?.has(surface) && s.fillingSurfaceMaterials.has(surface))
              .map((surface) => `${summarySurfaceLetter(surface, toothNo)}: ${t("fillingDefect." + s.fillingDefect.get(surface))}`)
          : [];
        // SP15 Task 5 (B3): name the finding explicitly with the
        // fillingDefect.label qualifier, the same way secondary caries always
        // names itself (toothInfo.secondary) on the Caries line — a bare
        // "surface: type" suffix read as generic filling info, not a defect.
        const suffix = defects.length ? ` – ${t("fillingDefect.label")}: ${defects.join(", ")}` : "";
        // Bead odontogram-wxt: the cervical marker rides the filling it
        // qualifies, exactly as BEMA's "vz"/"lz" suffix rides the surface —
        // and note that `letters` above, the surface COUNT a fee mapping
        // reads, is built without it.
        const cerv = SUMMARY_SURFACE_ORDER
          .filter((surface) => s.cervicalSurfaces?.has(surface) && s.fillingSurfaceMaterials.has(surface))
          .map((surface) => summarySurfaceLetter(surface, toothNo));
        const cervSuffix = cerv.length ? ` – ${t("cervical.label")}: ${cerv.join(", ")}` : "";
        fillings.push(`${lbl(toothNo)} (${letters.join(", ")})${suffix}${cervSuffix}`);
      }
    }

    // Bead odontogram-d1b: "cervical, side not documented" is its own entry
    // under fillings or caries — never folded into a surface list, because it
    // names no surface, and never counted as one.
    if(cervicalSideUnknownAllowed(s) && s.cervicalSideUnknown?.size > 0){
      const open = `${lbl(toothNo)} (${t("cervical.unknown.label")})`;
      if(s.cervicalSideUnknown.has("filling")) fillings.push(open);
      if(s.cervicalSideUnknown.has("caries")) caries.push(open);
    }

    // Endo and the independent root-post material share the treatment section,
    // but remain separate findings so a post-only state is not summary-invisible.
    const endoParts: string[] = [];
    const endoValue = effectiveEndo(s);
    const endoKey = SUMMARY_ENDO_KEY[endoValue];
    if(endoKey) endoParts.push(t(endoKey));
    if(endoValue === "endo-resection") endoParts.push(t("toothInfo.resected"));
    else if(s.endoResection) endoParts.push(t("toothInfo.resected"));
    const rootPost = rootPostSummaryLabel(s);
    if(rootPost) endoParts.push(rootPost);
    if(endoParts.length) endo.push(`${lbl(toothNo)} (${endoParts.join(", ")})`);

    // Prosthetics (fixed restorations — crown/inlay/onlay/veneer/bridge — +
    // implant attachments / removable / bar-retained dentures via `prosthesis`)
    if(s.restorationType && s.restorationType !== "none"){
      prosthetics.push(`${lbl(toothNo)}: ${restorationSummaryLabel(s.restorationType, s.restorationMaterial)}`);
    }
    // Bead odontogram-dma: retention elements read with the prosthetics, since
    // that is the case they belong to — a partial denture at the gap and the
    // clasp that holds it are one treatment, and listing them apart is how the
    // chart lost the connection in the first place.
    if(s.retention && s.retention !== "none" && retentionAllowed(s, s.retention)){
      const side = s.retentionSide && s.retentionSide !== "none"
        ? ` (${t("retentionSide." + s.retentionSide)})` : "";
      prosthetics.push(`${lbl(toothNo)}: ${t("retention." + kebabToCamel(s.retention))}${side}`);
    }else if(isTelescopeRetention(s)){
      prosthetics.push(`${lbl(toothNo)}: ${t("retention.telescope")}`);
    }
    if(s.prosthesis && s.prosthesis !== "none"){
      prosthetics.push(`${lbl(toothNo)}: ${t(PROSTHESIS_SUMMARY_KEY[s.prosthesis] || s.prosthesis)}`);
    }
    // SP17 Task 1 Fix #2 (gate-parity follow-up): same FULL gate as
    // getStateSummary above — mirrors the #crownLeakageRow control's own
    // visibility gate in full (!restorationRowHidden(s) AND crown/bridge),
    // not just the crown/bridge half.
    if(s.crownLeakage && !restorationRowHidden(s) && (s.restorationType === "crown" || s.restorationType === "bridge")) prosthetics.push(`${lbl(toothNo)} (${t("crownLeakage.label")})`);

    // Periodontal / periapical inflammation
    const hasInflam = s.mods && (s.mods.has("inflammation") || s.mods.has("parodontal"));
    if(hasInflam){
      let type: string;
      if(s.periapicalType && s.periapicalType !== "none") type = t("periapical.type." + s.periapicalType);
      else if(s.mods.has("parodontal")) type = t("mods.parodontal");
      else type = t("mods.periapicalInflammation");
      inflamed.push(`${lbl(toothNo)} (${type})`);
    }

    // SP9: clinical diagnoses (pulp / apical / resorption / peri-implant).
    const dxs = diagnosisSummaryLabels(s);
    if(dxs.length) diagnoses.push(`${lbl(toothNo)} (${dxs.join("; ")})`);
    // SP11: wear (edge/cervical) type-per-location whole-mouth section.
    // Review fix (post-SP11): gate on wearRowAllowed, same as the tooltip and
    // the render/UI row — suppresses stored wear on a crowned/non-natural-
    // substrate tooth that the chart itself no longer shows.
    if(wearRowAllowed(s)){
      const parts: string[] = [];
      if(s.wearEdge !== "none") parts.push(`${t("tooth.bruxism.edgeWear")}: ${t("wearType." + s.wearEdge)}`);
      if(s.wearCervical !== "none") parts.push(`${t("tooth.bruxism.neckWear")}: ${t("wearType." + s.wearCervical)}`);
      if(parts.length) wear.push(`${lbl(toothNo)} (${parts.join(", ")})`);
    }
    // SP12 Task 4: gate discoloration on the same discolorationAllowed predicate
    // the render tint, tooltip, and UI row use — suppresses stored discoloration
    // on a crowned/non-natural-substrate tooth that the chart itself no longer tints.
    if(discolorationAllowed(s) && s.discoloration !== "none"){
      discoloration.push(`${lbl(toothNo)} (${t("discoloration." + s.discoloration)})`);
    }
    // SP14 Task 4: orthodontic findings — gate on the same orthoAllowed
    // predicate the render glyphs and the Ortho UI card use, so the summary
    // never claims a finding on a tooth the chart itself doesn't show it on.
    if(orthoAllowed(s)){
      const orthoParts: string[] = [];
      if(s.orthoAppliance !== "none") orthoParts.push(t("ortho.appliance." + s.orthoAppliance));
      if(s.orthoDrift !== "none") orthoParts.push(t("ortho.drift." + s.orthoDrift));
      if(s.orthoVertical !== "none") orthoParts.push(t("ortho.vertical." + s.orthoVertical));
      if(s.orthoRotation === true) orthoParts.push(t("ortho.rotation.label"));
      if(orthoParts.length) orthodontics.push(`${lbl(toothNo)} (${orthoParts.join(", ")})`);
    }
    // SP9: calculus + mobility join the periodontal findings.
    // SP15 wholebranch fix: gate mobility on the same !isImplant condition as
    // the render/tooltip — an implant has no PDL (mobilityRowHidden hides the
    // control there), so the whole-mouth panel must not contradict that.
    if(s.calculus) inflamed.push(`${lbl(toothNo)} (${t("calculus.label")})`);
    if(s.mobility && s.mobility !== "none" && s.toothSelection !== "implant") inflamed.push(`${lbl(toothNo)} (${t("inflammation.mobilityLabel")} ${t("mobility." + s.mobility)})`);
    // FIX 1(c): peri-implant status is a periodontal finding, not a diagnosis —
    // route it into `inflamed` (periodontalText) instead of `diagnoses`, so an
    // implant with peri-implantitis is no longer reported "healthy" there.
    { const pi = periImplantSummaryLabel(s); if(pi) inflamed.push(`${lbl(toothNo)} (${pi})`); }
    // SP-perio PG-C Task 1: derived Cairo recession TYPE — same periodontal
    // "inflamed" bucket as calculus/mobility/peri-implant status above.
    { const rt = getToothRecessionType(toothNo); if(rt !== "none") inflamed.push(`${lbl(toothNo)} (${t(`perio.recession.${rt}`)})`); }
    // SP-perio PG-C Task 3: CEJ visibility / root concavity — same
    // periodontal "inflamed" bucket as calculus/mobility/peri-implant/
    // recession-type above.
    { const cej = cejVisibilitySummaryLabel(s); if(cej) inflamed.push(`${lbl(toothNo)} (${cej})`); }
    { const rc = rootConcavitySummaryLabel(s); if(rc) inflamed.push(`${lbl(toothNo)} (${rc})`); }
    // SP-perio PG-D Task 5: PI/GI/KG/GT/Miller — same periodontal "inflamed"
    // bucket as calculus/mobility/peri-implant/recession-type/CEJ/root-
    // concavity above.
    { const pi = plaqueIndexSummaryLine(toothNo); if(pi) inflamed.push(`${lbl(toothNo)} (${pi})`); }
    { const gi = gingivalIndexSummaryLine(toothNo); if(gi) inflamed.push(`${lbl(toothNo)} (${gi})`); }
    { const kg = keratinizedWidthSummaryLine(toothNo); if(kg) inflamed.push(`${lbl(toothNo)} (${kg})`); }
    { const gt = gingivalThicknessSummaryLabel(toothNo); if(gt) inflamed.push(`${lbl(toothNo)} (${gt})`); }
    { const mc = millerClassSummaryLabel(toothNo); if(mc) inflamed.push(`${lbl(toothNo)} (${mc})`); }
    // Bead odontogram-gry: Papillenverlust - derselbe parodontale Eimer.
    { const pl = papillaLossSummaryLine(toothNo); if(pl) inflamed.push(`${lbl(toothNo)} (${pl})`); }
    // SP-perio PG-E Task 3: mPI/mBI — same periodontal "inflamed" bucket as
    // PI/GI/KG/GT/Miller above.
    { const mpi = periImplantPlaqueSummaryLine(toothNo); if(mpi) inflamed.push(`${lbl(toothNo)} (${mpi})`); }
    { const mbi = periImplantBleedingSummaryLine(toothNo); if(mbi) inflamed.push(`${lbl(toothNo)} (${mbi})`); }
  }

  // Overview sentence — plural-aware phrases keep grammar correct per language
  // (e.g. "1 tooth is missing" vs "3 teeth are missing").
  const plural = (base: string, n: number) => t(`${base}${n === 1 ? "One" : "Other"}`, { n });
  const milkPhrase = plural("toothInfo.milk", milkCount);
  const milkStr = milkCount > 0 ? t("toothInfo.milkFragment", { milk: milkPhrase }) : "";
  const presentPhrase = plural("toothInfo.present", permanent.length);
  const missingPhrase = plural("toothInfo.missing", missing.length);
  let overview: string;
  if(permanent.length === 0 && implants.length === 0 && milkCount > 0){
    overview = t("toothInfo.overviewMilkOnly", { milk: milkPhrase });
  }else if(implants.length > 0){
    overview = t("toothInfo.overviewImplant", { present: presentPhrase, milk: milkStr, missing: missingPhrase, implant: plural("toothInfo.implant", implants.length) });
  }else{
    overview = t("toothInfo.overview", { present: presentPhrase, milk: milkStr, missing: missingPhrase });
  }

  const permanentList = permanent.length
    ? t("toothInfo.permanentList", { count: permanent.length, list: permanent.map(lbl).join(", ") })
    : null;
  const missingList = missing.length
    ? t("toothInfo.missingList", { count: missing.length, list: missing.map(lbl).join(", ") })
    : null;
  const uneruptedList = unerupted.length
    ? t("toothInfo.uneruptedList", { count: unerupted.length, list: unerupted.map(lbl).join(", ") })
    : null;

  // Brücken-Kennzahlen für den Kostenplan (Dirk, 31.08.2026): Spannen / Glieder /
  // Pfeiler, oben in der Prothetik-Sektion. Die Festzuschuss-Rechnung selbst
  // liegt in einem nachgelagerten Dienst, nicht hier.
  { const b = getBridgeSummary(); if(b.spans > 0) prosthetics.unshift(t("bridge.summary", { spans: b.spans, pontics: b.pontics, abutments: b.abutments })); }

  const sections: OdontogramSummarySection[] = [
    { key: "caries", heading: t("toothInfo.caries"), items: caries, emptyText: t("toothInfo.cariesEmpty") },
    { key: "fillings", heading: t("toothInfo.fillings"), items: fillings, emptyText: t("toothInfo.fillingsEmpty") },
    { key: "endo", heading: t("toothInfo.endo"), items: endo, emptyText: t("toothInfo.endoEmpty") },
    { key: "diagnoses", heading: t("toothInfo.diagnoses"), items: diagnoses, emptyText: t("toothInfo.diagnosesEmpty") },
    { key: "wear", heading: t("toothInfo.wear"), items: wear, emptyText: t("toothInfo.wearEmpty") },
    { key: "discoloration", heading: t("toothInfo.discoloration"), items: discoloration, emptyText: t("toothInfo.discolorationEmpty") },
    { key: "orthodontics", heading: t("toothInfo.orthodontics"), items: orthodontics, emptyText: t("toothInfo.orthodonticsEmpty") },
    { key: "prosthetics", heading: t("toothInfo.prosthetics"), items: prosthetics, emptyText: t("toothInfo.prostheticsEmpty") },
  ];

  let periodontalText = inflamed.length
    ? t("toothInfo.periodontalInflamed", { list: inflamed.join(", ") })
    : t("toothInfo.periodontalHealthy");
  // P4a Task 2: append the labelled case-context fragment (age/smoking/
  // diabetes/HbA1c/RBL/tooth-loss) when any case metadata was charted; skip
  // entirely on an empty case so a chart with no case data reads unchanged.
  if(!caseMetaIsEmpty(caseMeta)){
    const fragment = caseContextSummaryFragment(caseMeta);
    if(fragment) periodontalText = `${periodontalText} – ${fragment}`;
  }
  // P4b Task 4: append the FINAL (override-aware) 2017 classification —
  // separate from the case-context fragment above (that one only fires when
  // caseMeta itself is non-empty; classification can be non-trivial purely
  // from charted perio data, with no case metadata set at all).
  {
    const classificationFragment = classificationSummaryFragment(getPerioClassification());
    if(classificationFragment) periodontalText = `${periodontalText} – ${classificationFragment}`;
  }
  // Bead odontogram-vnt: how much of the periodontal examination was recorded
  // as examined-but-normal / unmeasurable / not applicable. Empty (nothing
  // appended) on a chart that never used the axis, so every existing fixture
  // reads unchanged.
  {
    const assessmentFragment = assessmentSummaryFragment();
    if(assessmentFragment) periodontalText = `${periodontalText} – ${assessmentFragment}`;
  }

  const implantInfo = implants.length
    ? { heading: t("toothInfo.implants"), text: implants.map(lbl).join(", ") }
    : null;

  const individualNotes = notes.length
    ? { heading: t("toothInfo.notes"), items: notes }
    : null;

  return {
    overview,
    permanentList,
    missingList,
    uneruptedList,
    sections,
    implants: implantInfo,
    periodontalTitle: t("toothInfo.periodontalTitle"),
    periodontalText,
    plannedChanges: getPlanChanges(),
    individualNotes,
  };
}

/**
 * Enable or disable read-only mode. When read-only, all click, touch, and
 * keyboard interactions are disabled. The control panel is dimmed and
 * non-interactive. Useful for print/report views.
 *
 * Fires {@link onStateChange} listeners so a chart that is ALREADY mounted —
 * in particular the periodontal chart, which derives every control's `disabled`
 * attribute from {@link getReadOnly} — re-derives its interactivity from the new
 * value instead of keeping the one it was built with. The document itself is
 * unchanged; a listener that treats the notification as a document edit will see
 * an identical document.
 *
 * @param value - `true` to enable read-only mode, `false` to disable.
 */
export function setReadOnly(value: boolean){
  readOnly = value;
  const grid = $("#toothGrid") as HTMLElement | null;
  if(grid) grid.classList.toggle("read-only", readOnly);
  const panel = $(".panel") as HTMLElement | null;
  if(panel) panel.classList.toggle("read-only", readOnly);
  // Deferred fix (perio P2 follow-up, Task 1): toggling readOnly while the
  // perio chart is open used to be a no-op — the grid's own disabled state
  // is baked in at open/resync, and this function never touched the perio
  // container. Extend the same live `.read-only` lock to whichever perio
  // container is currently mounted: `#perioOverlay` (popup chrome) or
  // `#perioInlinePanel` (inline "Dental Chart" housing). Both are queried
  // defensively (only one is ever mounted at a time, and neither may be
  // mounted at all) — mirrors the `panel`/`grid` null-safety above.
  const perioOverlay = $("#perioOverlay") as HTMLElement | null;
  if(perioOverlay) perioOverlay.classList.toggle("read-only", readOnly);
  const perioInline = $("#perioInlinePanel") as HTMLElement | null;
  if(perioInline) perioInline.classList.toggle("read-only", readOnly);
  // Update tabindex on all navigable tiles
  $$(".tooth-tile[role='option']").forEach(tile => {
    tile.setAttribute("tabindex", readOnly ? "-1" : "0");
  });
  // Bead odontogram-v90: the `.read-only` classes above are the COSMETIC half
  // of the lock. The functional half lives in the mounted perio chart, which
  // decides every control's `disabled` attribute in `syncToothCells()` from
  // `getReadOnly()` — and that runs only on grid build and on a `fullResync()`
  // driven by the `onStateChange` subscription. Without this notify, a flip
  // taken while the chart is open left every perio control (PD/GM/BOP/SUP/
  // mobility/furcation/plaque/PI/GI/KG/GT/Miller/mPI/mBI/CEJ/root concavity/
  // assessment) dimmed by CSS but still `enabled`, so a programmatic click
  // reached the handler and wrote. Notifying here is the same one-line house
  // pattern every other app-level session flag already uses (setPerioViewMode,
  // setPerioRowVisibility, setPerioIndexNameMode, setPerioOverlayLayer,
  // setPulpDetailLevel, setSurfaceNotation) — `setReadOnly` was the outlier.
  // No tooth state changes here: the listeners re-read unchanged state and the
  // resync re-derives each cell from its own gates, so nothing is
  // blanket-enabled when the flag is released.
  notifyStateChange();
}

/**
 * Get the current read-only mode state.
 */
export function getReadOnly(): boolean{
  return readOnly;
}

/**
 * Enable or disable per-tooth notes. When enabled, double-clicking a tooth
 * opens a note editor popover, and notes are shown in hover tooltips with
 * a badge indicator.
 *
 * @param value - `true` to enable notes, `false` to disable.
 */
export function setNotesEnabled(value: boolean){
  notesEnabled = value;
  // Refresh tooltips and label icons for all teeth
  for(const toothNo of ALL_TEETH){
    updateToothTooltip(toothNo);
    updateToothLabelNoteIcon(toothNo);
  }
}

/**
 * Get the current notes-enabled state.
 */
export function getNotesEnabled(): boolean{
  return notesEnabled;
}

export { setOcclusalVisible, setWisdomVisible, setShowBase, setHealthyPulpVisible };

// ---------------------------------------------------------------------------
// Bead odontogram-3l1: instance-scoped clinical sessions
// ---------------------------------------------------------------------------
//
// THE PROBLEM. Every clinical variable above (`charts`, `chartMode`,
// `caseMeta`, `planInitialized`, `planEditedTeeth`) is module-level, so two
// mounted odontograms used to share one case. That is fine for the standalone
// demo and fatal for a host that renders more than one chart.
//
// THE CONTRACT. A host owns an {@link OdontogramDocument} — the same versioned
// JSON `exportStatus()` writes — and hands it to a session. A session is the
// unit of clinical-state isolation: each one owns its own document, and no
// edit made through one session can be observed through another.
//
// HOW IT WORKS. Exactly one session is LIVE in the engine at a time, because
// the DOM editor itself is a single global engine bound to `#toothGrid`.
// Activating a session serializes the outgoing session's state back into its
// own document and hydrates the incoming one, reusing the SAME
// `collectExportPayload()` / `hydrateImportedCharts()` data path that
// `exportStatus()` and `importStatus()` already use — no second serialization
// format, no parallel state machine, no change to how a chart renders. A
// session that is not live simply holds its document; it stays fully readable
// and writable through `getDocument()`/`setDocument()`.
//
// The pre-existing module-level entry points (`exportStatus`, `importStatus`,
// `getStatusChart`, ...) are unchanged: they operate on whichever session is
// live, which for a standalone consumer is always the default session. No
// migration is required to keep using them.

/**
 * A host's handle on ONE odontogram's clinical state.
 *
 * Obtain one with {@link createOdontogramSession} and pass it to
 * `<OdontogramShell session={...} />`, or read the process-wide standalone
 * state with {@link getDefaultOdontogramSession}.
 */
export interface OdontogramSession {
  /** Stable identity, useful for logging and React keys. */
  readonly id: string;
  /** The current UI-domain document. Always a detached copy. */
  getDocument(): OdontogramDocument;
  /** Replace the whole document. `null`/`undefined` resets to a blank chart. */
  setDocument(doc: OdontogramDocument | null | undefined): void;
  /** Observe document changes. Returns an unsubscribe function. */
  subscribe(listener: (doc: OdontogramDocument) => void): () => void;
  /** Whether this session is the one currently live in the engine. */
  isActive(): boolean;
  /** Make this session live, saving the outgoing session's state first. */
  activate(): void;
  /** Give the engine back to the session that was live before `activate()`. */
  release(): void;
  /** This session's chart mode. Works without claiming the engine. */
  getChartMode(): ChartMode;
  /** Record or apply chart mode for this session. */
  setChartMode(mode: ChartMode): void;
  /** This session's plan-chart payload. Works without claiming the engine. */
  getPlanChart(): Any;
  /** This session's status-vs-plan diff. `[]` until a plan exists. */
  getPlanChanges(): PlanChange[];
  /**
   * Load a patient's Dental Core chart through an injected Aidbox gateway.
   * Hosts pass a client, never a Bundle. Delegates to `loadPatientChart`.
   */
  loadFromAidbox(gateway: AidboxGateway, patientId: string): Promise<LoadResult>;
  /**
   * Write this session's document through an injected write target.
   * Delegates to `planGuardedSave` (the write plan, checked against the store
   * through `target.search` so it never overwrites or deletes a resource the
   * chart did not produce) + `executeWritePlan`. Throws
   * `SaveReservationsUnknownError` before any write when the target cannot
   * search and the document carries no reservations from a live load.
   */
  saveToAidbox(target: WriteTarget, opts: { patientId: string; effectiveDateTime?: string }): Promise<WriteResult>;
}

function blankDocument(): OdontogramDocument {
  return { version: PAYLOAD_VERSION, globals: {}, teeth: {} };
}

function cloneDocument(doc: OdontogramDocument): OdontogramDocument {
  return JSON.parse(JSON.stringify(doc)) as OdontogramDocument;
}

function cloneFhirIdentity(identity: OdontogramDocument["fhirIdentity"]): OdontogramDocument["fhirIdentity"] {
  return identity ? JSON.parse(JSON.stringify(identity)) as OdontogramDocument["fhirIdentity"] : undefined;
}

/**
 * Normalize a sparse host document into the exact serialization domain a live
 * engine snapshot uses, without activating a session or touching renderer state.
 *
 * Public because an embedding host needs it: activating a
 * session loads the live clinical state and notifies with every tooth hydrated
 * from its defaults, so a host that compares against the stored document reads
 * the activation itself as the user's first edit and opens the chart dirty. A
 * host baselines this instead, and so never restates a clinical default of its
 * own. `version` is engine metadata that migrates on activation, so compare the
 * clinical content (`globals`, `teeth`) rather than the whole document.
 */
export function normalizeOdontogramDocument(doc: OdontogramDocument): OdontogramDocument {
  const normalized = cloneDocument(doc);
  const teeth: Record<string, OdontogramDocument["teeth"][string]> = {};
  for (const toothNo of ALL_TEETH) {
    teeth[String(toothNo)] = serializeState(
      hydrateState(doc.teeth?.[String(toothNo)] ?? {}, false),
    ) as OdontogramDocument["teeth"][string];
  }
  normalized.teeth = teeth;
  normalized.globals = {
    wisdomVisible: doc.globals?.wisdomVisible ?? true,
    showBase: doc.globals?.showBase ?? true,
    occlusalVisible: doc.globals?.occlusalVisible ?? true,
    showHealthyPulp: doc.globals?.showHealthyPulp ?? true,
    edentulous: doc.globals?.edentulous ?? false,
  };
  return normalized;
}

/** Serialize the engine's live clinical state into a document. */
function snapshotLiveDocument(): OdontogramDocument {
  return collectExportPayload() as OdontogramDocument;
}

/**
 * Load a document into the engine's live clinical state. Reuses the exact
 * import data path, then repaints only when a grid is actually mounted — a
 * headless host (or a test) can drive sessions with no DOM at all.
 */
function loadLiveDocument(doc: OdontogramDocument): void {
  hydrateImportedCharts(doc);
  resetActiveChartToStatusAfterImport();
  // `hydrateImportedCharts` covers the per-tooth charts and the case block but
  // deliberately not `globals` — `importStatus()` applies those in its own tail.
  // A session switch must apply them too, otherwise `edentulous` (a WHOLE-MOUTH
  // clinical finding, not a view flag) would stay behind from the outgoing
  // session and be read as belonging to the incoming one.
  const globals = doc && typeof doc === "object" ? doc.globals : undefined;
  const edentulousNext = typeof globals?.edentulous === "boolean" ? globals.edentulous : false;
  const wisdomNext = typeof globals?.wisdomVisible === "boolean" ? globals.wisdomVisible : true;
  const showBaseNext = typeof globals?.showBase === "boolean" ? globals.showBase : true;
  const occlusalNext = typeof globals?.occlusalVisible === "boolean" ? globals.occlusalVisible : true;
  const pulpNext = typeof globals?.showHealthyPulp === "boolean" ? globals.showHealthyPulp : true;
  // `initialized` alone is not enough: a session is released during the owning
  // React instance's unmount, when the flag is still set but the control-panel
  // DOM has already gone. Probe the grid itself instead.
  const domReady = initialized && !!$("#toothGrid");
  if(edentulous !== edentulousNext){
    edentulous = edentulousNext;
    if(domReady) setToggleButton($("#btnEdentulous"), edentulous);
  }
  if(!domReady){
    // Headless activate still has to land the incoming document's view flags on
    // the engine: `getPlanChart()` reads `collectGlobals()` while live, and AC1
    // requires that result to match the inactive, document-derived payload.
    wisdomVisible = wisdomNext;
    showBase = showBaseNext;
    occlusalVisible = occlusalNext;
    showHealthyPulp = pulpNext;
  }
  if(domReady){
    // Apply the same resolved defaults as `documentGlobals()` / the headless
    // branch. A sparse `globals: {}` must not inherit the outgoing session.
    setWisdomVisible(wisdomNext);
    setShowBase(showBaseNext);
    setOcclusalVisible(occlusalNext);
    setHealthyPulpVisible(pulpNext);
    for(const toothNo of ALL_TEETH){
      applyStateToSvg(toothNo);
      updateToothTileNumber(toothNo);
      updateToothLabelNoteIcon(toothNo);
    }
    updateSelectionFilterButtons();
    updateSelectionUI();
    syncChartModeUi();
  }
}

let sessionCounter = 0;

class ClinicalSession implements OdontogramSession {
  readonly id: string;
  /** The document while this session is NOT live. Ignored while live, where
   *  the engine's own state is the single source of truth.
   *  @internal — module-private; not part of the public session contract. */
  stored: OdontogramDocument;
  /** Chart mode while this session is NOT live. Applied on the next activate.
   *  @internal — module-private; not part of the public session contract. */
  storedChartMode: ChartMode = "status";
  private liveFhirIdentity: OdontogramDocument["fhirIdentity"];
  private readonly listeners = new Set<(doc: OdontogramDocument) => void>();

  constructor(initial?: OdontogramDocument | null, id?: string){
    this.id = id ?? `odontogram-session-${++sessionCounter}`;
    this.stored = initial ? cloneDocument(initial) : blankDocument();
    this.storedChartMode = "status";
    this.liveFhirIdentity = undefined;
  }

  getDocument(): OdontogramDocument {
    if (!this.isActive()) return cloneDocument(this.stored);
    const document = snapshotLiveDocument();
    if (this.liveFhirIdentity) document.fhirIdentity = cloneFhirIdentity(this.liveFhirIdentity);
    return document;
  }

  synchronizeLiveFhirIdentity(identity: OdontogramDocument["fhirIdentity"]): void {
    this.liveFhirIdentity = cloneFhirIdentity(identity);
  }

  setDocument(doc: OdontogramDocument | null | undefined): void {
    const next = doc && typeof doc === "object" ? cloneDocument(doc) : blankDocument();
    this.storedChartMode = "status";
    if(this.isActive()){
      this.stored = next;
      loadLiveDocument(next);
      // The live path fans out through notifyStateChange(), which already
      // notifies this session's subscribers — do not notify twice.
      notifyStateChange();
      return;
    }
    this.stored = next;
    this.notify();
  }

  subscribe(listener: (doc: OdontogramDocument) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  isActive(): boolean { return activeSession === this; }

  activate(): void { activateSession(this); }

  release(): void { releaseSession(this); }

  getChartMode(): ChartMode {
    return this.isActive() ? readLiveChartMode() : this.storedChartMode;
  }

  setChartMode(mode: ChartMode): void {
    if(mode !== "status" && mode !== "plan") return;
    if(this.isActive()){
      applyLiveChartMode(mode);
      this.storedChartMode = readLiveChartMode();
      return;
    }
    this.storedChartMode = mode;
  }

  getPlanChart(): Any {
    return this.isActive() ? readLivePlanChart() : planChartFromDocument(this.stored);
  }

  getPlanChanges(): PlanChange[] {
    return this.isActive() ? readLivePlanChanges() : planChangesFromDocument(this.stored);
  }

  async loadFromAidbox(gateway: AidboxGateway, patientId: string): Promise<LoadResult> {
    const result = await loadPatientChart(gateway, patientId);
    if (result.document) this.setDocument(result.document);
    return result;
  }

  async saveToAidbox(
    target: WriteTarget,
    opts: { patientId: string; effectiveDateTime?: string },
  ): Promise<WriteResult> {
    const document = this.getDocument();
    const effectiveDateTime = opts.effectiveDateTime ?? document.examination?.effectiveDateTime;
    if (!effectiveDateTime) throw new MissingDentalCoreEffectiveDateError();
    const plan = await planGuardedSave(target, { document, patientId: opts.patientId, effectiveDateTime });
    const result = await executeWritePlan(target, plan);
    return { ...result, skipped: plan.skipped };
  }

  /** Internal: fan a change out to this session's own subscribers only. */
  notify(): void {
    if(this.listeners.size === 0) return;
    const doc = this.getDocument();
    for(const listener of this.listeners){
      try{ listener(doc); }
      catch(e){ console.error("odontogram session listener failed", e); }
    }
  }
}

/** The process-wide session every pre-existing module-level entry point uses. */
const defaultSession = new ClinicalSession(null, "odontogram-session-default");
let activeSession: ClinicalSession = defaultSession;
/** Sessions to hand the engine back to, innermost last. */
const sessionStack: ClinicalSession[] = [];

function synchronizeActiveFhirIdentity(identity: OdontogramDocument["fhirIdentity"]): void {
  activeSession.synchronizeLiveFhirIdentity(identity);
}

/** Make `next` the live session, saving the outgoing one's state first. */
function activateSession(next: ClinicalSession): void {
  if(activeSession === next) return;
  activeSession.stored = activeSession.getDocument();
  activeSession.storedChartMode = readLiveChartMode();
  sessionStack.push(activeSession);
  activeSession = next;
  loadLiveDocument(next.stored);
  applyLiveChartMode(next.storedChartMode);
  notifyStateChange();
}

/** Hand the engine back to whichever session was live before `session`. */
function releaseSession(session: ClinicalSession): void {
  if(activeSession !== session){
    // Not live: just drop it from the restore stack so a later release() never
    // resurrects an unmounted session.
    const at = sessionStack.lastIndexOf(session);
    if(at >= 0) sessionStack.splice(at, 1);
    return;
  }
  const previous = sessionStack.pop();
  if(!previous) return; // the default session is never released
  session.stored = session.getDocument();
  session.storedChartMode = readLiveChartMode();
  activeSession = previous;
  loadLiveDocument(previous.stored);
  applyLiveChartMode(previous.storedChartMode);
  notifyStateChange();
}

/**
 * Create an isolated clinical session, optionally seeded from a document.
 *
 * Two sessions never share clinical state: an edit made through one is
 * invisible to the other, in both directions.
 */
export function createOdontogramSession(initial?: OdontogramDocument | null): OdontogramSession {
  return new ClinicalSession(initial);
}

/** The session backing the module-level standalone API. */
export function getDefaultOdontogramSession(): OdontogramSession {
  return defaultSession;
}

/** The session currently live in the engine. */
export function getActiveOdontogramSession(): OdontogramSession {
  return activeSession;
}

/** Internal: called by notifyStateChange() so a live edit reaches the owning
 *  session's subscribers without every session hearing every case's changes. */
function notifyActiveSession(): void {
  activeSession.notify();
}

// ---------------------------------------------------------------------------
// Engine ownership (bead odontogram-3l1, review repair)
// ---------------------------------------------------------------------------
//
// The DOM editor is ONE global engine: it builds `#toothGrid` and reads a fixed
// set of element ids through `document.querySelector`. Two mounted shells
// therefore cannot both drive it, and before this claim existed they tried:
// the second mount's `initOdontogram()` returned early, either shell's unmount
// ran `destroyOdontogram()` and tore the engine down under the other, and both
// rendered the same ids — so the chart visible inside instance A could be
// painted from instance B's session. Showing one patient's teeth under another
// patient's heading is the worst failure this component can have.
//
// The claim makes that structural fact explicit and safe: exactly one mounted
// instance owns the engine, that owner is the instance whose session is live,
// and ownership transfers to a waiting instance when the owner unmounts.

/** Opaque per-instance ownership token. */
export type EngineClaim = { readonly id: number };

let engineOwner: EngineClaim | null = null;
let engineClaimSeq = 0;
/** Instances that asked for the engine while it was taken, oldest first. */
const engineWaiters: EngineClaim[] = [];
const engineOwnerListeners = new Set<() => void>();

function notifyEngineOwnerChange(): void {
  for(const cb of engineOwnerListeners){
    try{ cb(); }
    catch(e){ console.error("odontogram engine-owner listener failed", e); }
  }
}

/** Mint a token for one mounted instance. */
export function createEngineClaim(): EngineClaim {
  return { id: ++engineClaimSeq };
}

/**
 * Try to become the single instance that drives the DOM engine. Returns true
 * when this token owns it — either because it was free or because this token
 * already owned it. A losing caller is queued and re-notified through
 * {@link onEngineOwnerChange} when the engine becomes free.
 */
export function claimEngine(claim: EngineClaim): boolean {
  if(engineOwner === claim) return true;
  if(engineOwner === null){
    engineOwner = claim;
    const queued = engineWaiters.indexOf(claim);
    if(queued >= 0) engineWaiters.splice(queued, 1);
    notifyEngineOwnerChange();
    return true;
  }
  if(!engineWaiters.includes(claim)) engineWaiters.push(claim);
  return false;
}

/** Give the engine up (or leave the waiting queue), handing it to the next
 *  waiting instance if there is one. */
export function releaseEngine(claim: EngineClaim): void {
  const queued = engineWaiters.indexOf(claim);
  if(queued >= 0) engineWaiters.splice(queued, 1);
  if(engineOwner !== claim) return;
  engineOwner = null;
  const next = engineWaiters.shift();
  if(next) engineOwner = next;
  notifyEngineOwnerChange();
}

/** Whether this token currently owns the DOM engine. */
export function ownsEngine(claim: EngineClaim | null): boolean {
  return claim !== null && engineOwner === claim;
}

/** Observe ownership handovers, so a waiting instance can mount the engine as
 *  soon as the previous owner unmounts. */
export function onEngineOwnerChange(cb: () => void): () => void {
  engineOwnerListeners.add(cb);
  return () => { engineOwnerListeners.delete(cb); };
}
