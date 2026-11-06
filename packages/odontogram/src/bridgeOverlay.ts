// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

/**
 * Multi-tooth bridge-span OVERLAY subsystem.
 *
 * Bridges are rendered PER-TOOTH by the core engine: each bridge tooth draws its
 * own `{material}-bridge-connector` saddle inside its own tile SVG. Because the
 * tiles sit in a CSS grid with a real, variable gap between them, a bridge that
 * spans several teeth shows visible breaks in the saddle at every inter-tile gap.
 *
 * This module derives the multi-tooth spans from tooth state and draws a single
 * engine-owned overlay `<svg>` over `#toothGrid` that fills those gaps with a
 * gum-line saddle bar, so a run of bridge teeth reads as one continuous bridge.
 *
 * The overlay is purely presentational: it reads DOM geometry + tooth state and
 * introduces no new tooth-state field. The same bar geometry is reused by the
 * SVG/PNG/JPG export path so the exported image includes the span bars too.
 *
 * Standalone-library rule: no DentalQuoteCreator-specific dependencies.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** Minimal shape of tooth state this module reads. */
export interface BridgeToothState {
  restorationType?: string;
  restorationMaterial?: string;
  bridgePillar?: boolean;
  /** Bead odontogram-5rv: needed to tell an ABUTMENT from a PONTIC. Both carry
   *  `restorationType === "bridge"`; only this separates them. */
  toothSelection?: string;
  /** Bead odontogram-5rv: this pontic hangs on one side ON PURPOSE. */
  cantilever?: boolean;
}

/** Reads a tooth's current state by FDI tooth number. May return undefined. */
export type GetToothState = (toothNo: number) => BridgeToothState | undefined | null;

/** Maps a restoration material key to a solid CSS color for the saddle bar. */
export type MaterialColor = (material: string) => string;

/**
 * The two dental arches, in visual left-to-right order (mirrors `ALL_TEETH` in
 * `odontogram.ts`). Array-adjacent == visually adjacent WITHIN an arch. The two
 * arches are scanned independently so a span never joins across the 28|48
 * boundary.
 */
export const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ARCHES: readonly (readonly number[])[] = [UPPER_ARCH, LOWER_ARCH];

// Saddle bar geometry (fractions of the tile box). Shared by the live overlay
// and the export pass so both stay byte-consistent.
/** Vertical center of the saddle bar, as a fraction of tile height (gum line),
 *  for an UPPER-arch tile. */
export const SADDLE_Y_FRACTION = 0.72;
/**
 * Vertical center of the saddle bar for a LOWER-arch tile. Lower-arch tiles are
 * rendered rotated 180°, so the anatomically-correct position is the TRUE
 * mirror of the upper value about the tile mid-line: `1 - SADDLE_Y_FRACTION`.
 *
 * 2.2.1: the previous value (0.19) came from measuring the connector artwork
 * (~0.81 from the un-rotated tile top → 0.19 after the 180° flip) and sat too
 * high on the abutment relative to the well-fitting upper saddle. Anchoring the
 * lower fraction to the proven upper value via the geometric mirror keeps both
 * arches consistent by construction. Still a visual quantity — verify on a real
 * render (Vercel) and nudge this single number if the lower saddle needs it.
 */
export const SADDLE_Y_FRACTION_LOWER = 1 - SADDLE_Y_FRACTION;
/** Thickness of the saddle bar, as a fraction of tile height. */
export const SADDLE_THICKNESS = 0.09;
/** How far the bar overlaps into each adjacent tile, as a fraction of tile width. */
export const SADDLE_OVERLAP = 0.12;

/**
 * Default material -> solid color map for the saddle bar, mirroring the fill of
 * the per-tooth `{material}-bridge-connector` layers in the tooth SVGs. The two
 * gradient materials (emax, metal-ceramic) are approximated by a representative
 * solid color; the per-tooth saddle still shows the true gradient inside the tile.
 */
// Bead odontogram-5hm: an die tatsaechlich ANGEZEIGTE Kronenfarbe je Material
// angeglichen (emax/metal-ceramic aus der Rampenmitte, die Vollfarben aus dem
// var()-Default der Kronenebene), damit Verbinder und Basis mit dem Kronenkoerper
// verschmelzen statt daneben zu leuchten. Vorher standen hier zu grelle
// Naeherungen (Gold #ece614 gegen die bernsteinfarbene Krone #e0a80d usw.).
const DEFAULT_MATERIAL_COLORS: Record<string, string> = {
  emax: "#e2d6c4",
  gold: "#e0a80d",
  gradia: "#57b285",
  zircon: "#cfe3ee",
  metal: "#0051bf",
  "metal-ceramic": "#bbd975",
  telescope: "#d8c9a0",
  temporary: "#c8b392",
};

/** Default color resolver used when no `materialColor` dependency is provided. */
export function defaultMaterialColor(material: string): string {
  return DEFAULT_MATERIAL_COLORS[material] ?? "#8a8f98";
}

// Bead odontogram-5hm: das Brueckenglied schwebt - die alte Krone wird zervikal
// GECLIPPT (index.css, `data-pontic`), darunter steht ein Streifen Gingiva.
/** Bruchteil der KRONENhoehe, der zervikal abgeschnitten wird - MUSS zum
 *  `clip-path: inset(... )` in index.css passen. */
const PONTIC_CLIP_FRAC = 0.12;
/** Die ANGEZEIGTE Zahnfleischfarbe (gum-base #c31703 unter dem 70%-Weiss der
 *  Kachel ~ (237,183,179)), fuer den Gingivastreifen unter dem Brueckenglied. */
const GUM_STRIP_COLOR = "#edb7b3";

function isBridgeTooth(s: BridgeToothState | undefined | null): boolean {
  if(!s) return false;
  return s.restorationType === "bridge" || s.bridgePillar === true;
}

/**
 * Derive multi-tooth bridge spans from tooth state.
 *
 * A span is a maximal run of consecutive teeth WITHIN a single arch where each
 * tooth is a bridge tooth (`restorationType === "bridge"` OR `bridgePillar`).
 * Only runs of length >= 2 are returned (an isolated bridge tooth is not a span).
 *
 * Documented limitation: two distinct bridges that happen to sit on adjacent
 * teeth (e.g. 13-14 and 15-16 with a shared-looking gum line) are merged into a
 * single run, because state carries no per-bridge grouping id. This matches the
 * per-tooth rendering, which likewise cannot tell them apart.
 *
 * @param getState - Reads a tooth's state by FDI number.
 * @returns Arrays of consecutive tooth numbers, each of length >= 2.
 */
function bridgeRuns(getState: GetToothState, minLength: number): number[][] {
  const spans: number[][] = [];
  for(const arch of ARCHES){
    let run: number[] = [];
    for(const tn of arch){
      if(isBridgeTooth(getState(tn))){
        run.push(tn);
      }else{
        if(run.length >= minLength) spans.push(run);
        run = [];
      }
    }
    if(run.length >= minLength) spans.push(run);
  }
  return spans;
}

export function detectBridgeSpans(getState: GetToothState): number[][] {
  return bridgeRuns(getState, 2);
}

/** Maximal runs of >=minLen adjacent teeth within one arch for which `pred` is
 *  true. The shared shape behind Verblockung and the occlusal splint. */
export function detectFlagSpans(
  getState: GetToothState,
  pred: (s: BridgeToothState | undefined) => boolean,
  minLen = 2,
): number[][] {
  const spans: number[][] = [];
  for(const arch of ARCHES){
    let run: number[] = [];
    for(const tn of arch){
      if(pred(getState(tn))) run.push(tn);
      else { if(run.length >= minLen) spans.push(run); run = []; }
    }
    if(run.length >= minLen) spans.push(run);
  }
  return spans;
}

/** charly „Verblockung": maximal runs of >=2 adjacent `splinted` teeth. */
export function detectSplintSpans(getState: GetToothState): number[][] {
  return detectFlagSpans(getState, (s) => (s as { splinted?: boolean } | undefined)?.splinted === true);
}

/** charly „Schiene" (occlusal splint / nightguard): runs of adjacent teeth under
 *  the appliance. minLen 1 — a splint may sit over a single remaining tooth. */
export function detectOcclusalSplintSpans(getState: GetToothState): number[][] {
  return detectFlagSpans(getState, (s) => (s as { occlusalSplint?: boolean } | undefined)?.occlusalSplint === true, 1);
}

// ---------------------------------------------------------------------------
// Bead odontogram-5rv: eine Bruecke ohne Pfeiler ist kein Befund.
//
// Dirk, 19.08.2026: "zu b gehoert irgendwo ein k, oder links und rechts
// irgendwo jeweils ein k, k-b ist die Ausnahme, bedeutet Krone mit schwebendem
// Brueckenglied."
//
// NEBEN der Ableitung, nicht in ihr. `detectBridgeSpans` liefert weiter jeden
// Lauf, und der Overlay zeichnet ihn weiter - eine Eingabe zu verweigern, weil
// sie noch nicht fertig ist, waere am Stuhl unbrauchbar. Ein Befund entsteht in
// Bruchstuecken: erst das Glied, dann die Pfeiler. Gemeldet wird, nicht
// verhindert.
// ---------------------------------------------------------------------------

/** Wie eine Spanne getragen wird. */
export type BridgeSupport = "supported" | "cantilever" | "unsupported";

export interface BridgeSpanCheck {
  /** Der Lauf, wie `detectBridgeSpans` ihn liefert. */
  span: number[];
  support: BridgeSupport;
  /** Pfeiler der Konstruktion, in Bogenreihenfolge - auch die, die NEBEN dem
   *  Lauf stehen (siehe unten). */
  abutments: number[];
  /** Die Glieder: Luecken, die als Bruecke gechartet sind. */
  pontics: number[];
  /** Mindestens ein Glied traegt die Angabe "schwebend" - die einseitige
   *  Lagerung ist dann gewollt und kein unfertiger Befund. */
  declaredCantilever: boolean;
}

/** Ein PFEILER ist ein vorhandener Zahn oder ein Implantat, das eine Krone oder
 *  eine Bruecke traegt. Ein Wurzelrest traegt nichts, eine Luecke erst recht
 *  nicht. */
function isAbutment(s: BridgeToothState | undefined | null): boolean {
  if(!s) return false;
  const sel = s.toothSelection ?? "tooth-base";
  const vorhanden = sel !== "none" && sel !== "not-erupted"
    && sel !== "no-tooth-after-extraction" && sel !== "tooth-under-gum";
  if(!vorhanden) return false;
  return s.restorationType === "crown" || s.restorationType === "bridge"
    || s.bridgePillar === true;
}

/** Ein GLIED ist eine Luecke, die als Bruecke gechartet ist. */
function isPontic(s: BridgeToothState | undefined | null): boolean {
  if(!s) return false;
  return s.restorationType === "bridge"
    && (s.toothSelection === "none" || s.toothSelection === "no-tooth-after-extraction");
}

/**
 * Jede Spanne daraufhin ansehen, ob sie getragen wird.
 *
 * Die KONSTRUKTION ist der Lauf PLUS seinen beiden unmittelbaren Nachbarn im
 * Bogen, sofern die Pfeiler sind. Das muss so sein, weil ein Pfeiler nicht als
 * Bruecke gechartet sein muss: Dirks Regel sagt ausdruecklich "irgendwo ein k",
 * also eine KRONE, und eine Krone steht damit ausserhalb des Laufs, den
 * `detectBridgeSpans` findet.
 *
 * Getragen heisst: mindestens ein Pfeiler VOR der Gliederkette und mindestens
 * einer DAHINTER, in Bogenreihenfolge. Nur auf einer Seite ist die
 * Schwebebruecke, auf keiner ein unvollstaendiger Befund.
 *
 * Ein Lauf ganz OHNE Glied ist keine Bruecke, die haengt - verblockte Kronen
 * etwa -, und wird als getragen gemeldet; es gibt dort nichts, das
 * herunterfallen koennte.
 *
 * DIE LAEUFE SIND HIER LAENGER ALS DIE GEZEICHNETEN. `detectBridgeSpans`
 * liefert nur Laeufe ab zwei Zaehnen, weil ein Sattel eine Luecke zwischen zwei
 * Kacheln fuellt und dafuer zwei braucht. Die Pruefung stellt eine andere
 * Frage, und fuer sie ist EIN Glied schon eine Bruecke: genau Dirks
 * Ausnahmefall "k-b", Krone mit einem einzigen schwebenden Glied, ist ein Lauf
 * der Laenge eins, sobald der Pfeiler als KRONE gechartet ist - und der faellt
 * sonst durch die Pruefung, ohne dass jemand es merkt.
 *
 * Geerbte Grenze: zwei Bruecken, die im Bogen aneinanderstossen, sind schon in
 * `detectBridgeSpans` EIN Lauf, weil der Zustand keine Kennung je Bruecke
 * traegt. Die Pruefung erbt das und kann es nicht besser wissen.
 */
export function checkBridgeSpans(getState: GetToothState): BridgeSpanCheck[] {
  const out: BridgeSpanCheck[] = [];
  for(const span of bridgeRuns(getState, 1)){
    const arch = ARCHES.find((a) => a.includes(span[0]));
    if(!arch) continue;
    const von = arch.indexOf(span[0]);
    const bis = arch.indexOf(span[span.length - 1]);

    // Der Lauf plus die beiden Nachbarn, sofern sie Pfeiler sind.
    const konstruktion: number[] = [];
    if(von > 0 && isAbutment(getState(arch[von - 1]))) konstruktion.push(arch[von - 1]);
    for(let i = von; i <= bis; i++) konstruktion.push(arch[i]);
    if(bis < arch.length - 1 && isAbutment(getState(arch[bis + 1]))) konstruktion.push(arch[bis + 1]);

    const abutments = konstruktion.filter((tn) => isAbutment(getState(tn)));
    const pontics = konstruktion.filter((tn) => isPontic(getState(tn)));
    const declaredCantilever = pontics.some((tn) => getState(tn)?.cantilever === true);

    let support: BridgeSupport = "supported";
    if(pontics.length > 0){
      const erstes = arch.indexOf(pontics[0]);
      const letztes = arch.indexOf(pontics[pontics.length - 1]);
      const davor = abutments.some((tn) => arch.indexOf(tn) < erstes);
      const dahinter = abutments.some((tn) => arch.indexOf(tn) > letztes);
      support = davor && dahinter ? "supported"
        : davor || dahinter ? "cantilever" : "unsupported";
    }
    out.push({ span, support, abutments, pontics, declaredCantilever });
  }
  return out;
}

/** Ob eine Spanne einen Hinweis verdient: ein Glied ohne jeden Pfeiler, oder
 *  eine einseitige Lagerung, die niemand als gewollt erklaert hat. Eine
 *  erklaerte Schwebebruecke ist ein fertiger Befund und schweigt. */
export function bridgeSpanNeedsAttention(check: BridgeSpanCheck): boolean {
  if(check.support === "unsupported") return true;
  return check.support === "cantilever" && !check.declaredCantilever;
}

/**
 * Pick the material color for a span: prefer the first bridge tooth with an
 * explicit restoration material, then any pillar's material, else "metal".
 */
function spanMaterial(span: number[], getState: GetToothState): string {
  for(const tn of span){
    const s = getState(tn);
    if(s && s.restorationType === "bridge" && s.restorationMaterial && s.restorationMaterial !== "none"){
      return s.restorationMaterial;
    }
  }
  for(const tn of span){
    const s = getState(tn);
    if(s && s.restorationMaterial && s.restorationMaterial !== "none") return s.restorationMaterial;
  }
  return "metal";
}

/** A tile's box in grid-relative coordinates (x = left - gridLeft, etc.). */
export interface GridRelativeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Resolves a tooth's tile box in grid-relative coordinates, or null if hidden. */
export type RectFor = (toothNo: number) => GridRelativeRect | null;

/** A single saddle bar to draw, in grid-relative coordinates. */
export interface BridgeBar {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

/**
 * Compute the saddle bars that fill the inter-tile gaps of every span. This is
 * the single source of truth for bar geometry, shared by the live overlay and
 * the export pass.
 *
 * Guards: any pair whose tile rect is missing or zero-sized (occlusal view,
 * collapsed arch) is skipped rather than throwing. A pair whose computed width
 * is non-positive (overlapping tiles) is also skipped.
 *
 * @param spans - Output of {@link detectBridgeSpans}.
 * @param getState - Reads a tooth's state by FDI number (for material color).
 * @param rectFor - Resolves each tooth's grid-relative tile box.
 * @param materialColor - Resolves a material key to a solid color.
 */
export function computeBridgeBars(
  spans: number[][],
  getState: GetToothState,
  rectFor: RectFor,
  materialColor: MaterialColor,
): BridgeBar[] {
  const bars: BridgeBar[] = [];
  for(const span of spans){
    const fill = materialColor(spanMaterial(span, getState));
    // Lower-arch tooth numbers are 31-48 (see LOWER_ARCH); every tooth in a
    // span belongs to the same arch (detectBridgeSpans never crosses the
    // 28|48 boundary), so the first tooth number tells the whole span's arch.
    const isLower = span[0] >= 31;
    const yFraction = isLower ? SADDLE_Y_FRACTION_LOWER : SADDLE_Y_FRACTION;
    for(let i = 0; i < span.length - 1; i++){
      const a = rectFor(span[i]);
      const b = rectFor(span[i + 1]);
      if(!a || !b) continue;
      if(a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) continue;
      // Left/right inner edges of the gap, in case array order and visual order
      // ever diverge, derive from actual geometry.
      const leftRect = a.x <= b.x ? a : b;
      const rightRect = a.x <= b.x ? b : a;
      const overlap = Math.min(leftRect.width, rightRect.width) * SADDLE_OVERLAP;
      const x0 = leftRect.x + leftRect.width - overlap;
      const x1 = rightRect.x + overlap;
      const width = x1 - x0;
      if(width <= 0) continue;
      const height = leftRect.height * SADDLE_THICKNESS;
      const midY = leftRect.y + leftRect.height * yFraction;
      bars.push({ x: x0, y: midY - height / 2, width, height, fill });
    }
  }
  return bars;
}

// Bead odontogram-5hm: die Bruecke soll als EIN Koerper lesen. Der duenne
// Sattel-Balken (computeBridgeBars) verband nur die Zahnfleischlinie; Dirk sah
// keine Verbindung und ein flach abgeschnittenes Brueckenglied. Diese Geometrie
// zeichnet stattdessen SOLIDE Verbinder (vom Kontaktpunkt bis zervikal, ueber
// den Kachel-Spalt) und rundet die basale Auflage des Brueckenglieds (Kuppel
// zur Gingiva statt flachem Kronen-Schnitt). Alles in der Auflage vorne (z5),
// in der Materialfarbe - erster Vorschlag, Dirk beurteilt am Bild.

// Gemessen an der aktiven Kronenebene (OBERKIEFER, Krone zeigt nach unten): die
// flache Zervikalkante liegt bei ~0,60 der Kachelhoehe, die Kaukante bei ~0,87,
// die Krone fuellt die Kachel fast ganz (0,03..0,97 der Breite).
// Dirk, 23.08.2026: der Verbinder darf den Kontaktpunkt NICHT nach okklusal
// (unten) ueberragen und muss deutlich von der Gingiva (oben) wegbleiben. Also
// ein kompaktes Band um den Kontaktpunkt: Krone reicht von ~0,59 (zervikal) bis
// ~0,87 (okklusal), der Kontakt liegt bei ~0,74. Oberkante mit klarem Abstand
// zur Zahnfleischlinie, Unterkante am Kontakt.
/** Oberkante des Verbinders (gingival), mit Abstand zur Zahnfleischlinie, OBERKIEFER. */
const CONNECTOR_TOP = 0.70;
/** Unterkante des Verbinders (okklusal), am Kontaktpunkt - nicht darueber hinaus, OBERKIEFER. */
const CONNECTOR_BOTTOM = 0.80;
/** Wie weit der Verbinder in jede Nachbarkrone greift, Anteil der Kachelbreite. */
const CONNECTOR_OVERLAP = 0.16;

/** Verbinder + Brueckenglied-Basen + deren Umriss, fertig platziert. */
export interface BridgeBody { connectors: BridgeBar[]; }


function _f(v: number): string {
  return (Math.round(v * 100) / 100).toString();
}

/**
 * Die VERBUNDENEN Spannen: jeder Brückenglied-Lauf plus seine Kronen-Pfeiler
 * links und rechts (Dirks Schema "Pfeiler = Krone"), in Bogenreihenfolge. Nutzt
 * dieselbe Konstruktion wie {@link checkBridgeSpans} - eine Krone-Brückenglied-
 * Krone-Folge ist damit EINE Spanne, obwohl `detectBridgeSpans` nur den
 * Brücken-Lauf (das Glied) sieht. Nur Spannen MIT Glied und mit mindestens zwei
 * Mitgliedern liefern etwas zu zeichnen.
 */
export function bridgeConstructions(getState: GetToothState): number[][] {
  const out: number[][] = [];
  for(const check of checkBridgeSpans(getState)){
    if(check.pontics.length === 0) continue;             // ein blockierter Kronenlauf ist keine Bruecke
    const arch = ARCHES.find((a) => a.includes(check.span[0]));
    if(!arch) continue;
    const mitglieder = [...check.abutments, ...check.pontics]
      .sort((x, y) => arch.indexOf(x) - arch.indexOf(y));
    if(mitglieder.length >= 2) out.push(mitglieder);
  }
  return out;
}

/**
 * Der sichtbare Brueckenkoerper: solide Verbinder zwischen benachbarten
 * Brueckenmitgliedern (Krone/Glied) und eine gerundete Basis je Brueckenglied.
 * Erwartet die VERBUNDENEN Spannen (siehe {@link bridgeConstructions}).
 */
export function computeBridgeBody(
  constructions: number[][],
  getState: GetToothState,
  rectFor: RectFor,
  materialColor: MaterialColor,
): BridgeBody {
  const connectors: BridgeBar[] = [];
  for(const span of constructions){
    const fill = materialColor(spanMaterial(span, getState));
    const isLower = span[0] >= 31;
    // Anteile fuer den Unterkiefer am Mittelband spiegeln (Kachel ist 180° gedreht).
    const top = isLower ? 1 - CONNECTOR_BOTTOM : CONNECTOR_TOP;
    const bottom = isLower ? 1 - CONNECTOR_TOP : CONNECTOR_BOTTOM;
    const bulgeDir = isLower ? +1 : -1;   // Kuppel zeigt zur Gingiva (OK nach oben)

    // Solide Verbinder zwischen benachbarten Mitgliedern, im Kronenbereich.
    for(let i = 0; i < span.length - 1; i++){
      const a = rectFor(span[i]);
      const b = rectFor(span[i + 1]);
      if(!a || !b) continue;
      if(a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) continue;
      const leftRect = a.x <= b.x ? a : b;
      const rightRect = a.x <= b.x ? b : a;
      const x0 = leftRect.x + leftRect.width - leftRect.width * CONNECTOR_OVERLAP;
      const x1 = rightRect.x + rightRect.width * CONNECTOR_OVERLAP;
      const width = x1 - x0;
      if(width <= 0) continue;
      const y0 = leftRect.y + leftRect.height * top;
      const y1 = leftRect.y + leftRect.height * bottom;
      connectors.push({ x: x0, y: y0, width, height: y1 - y0, fill });
    }

  }
  return { connectors };
}

/** Dependencies for {@link renderBridgeOverlay}. */
export interface RenderBridgeOverlayDeps {
  /** The `#toothGrid` element (host of the overlay). */
  grid: HTMLElement | null;
  /** Reads a tooth's state by FDI number. */
  getState: GetToothState;
  /** Optional material -> color resolver; defaults to {@link defaultMaterialColor}. */
  materialColor?: MaterialColor;
}

/** The class marking the single engine-owned overlay SVG. */
export const BRIDGE_OVERLAY_CLASS = "bridge-overlay";
/** The class marking each saddle bar rect (live + export). */
export const BRIDGE_BAR_CLASS = "bridge-overlay-bar";

/** Locate the side-view tile for a tooth (the tile that draws the saddle). */
function sideTile(grid: HTMLElement, toothNo: number): HTMLElement | null {
  return grid.querySelector(
    `.tooth-tile.side-view[data-tooth="${toothNo}"]`,
  ) as HTMLElement | null;
}

/**
 * Resolve a tooth's side-view tile box in grid-relative coordinates, or null if
 * the tile is absent or hidden (zero-sized). Shared by the live overlay and the
 * export pass so both read geometry identically.
 *
 * @param grid - The `#toothGrid` element.
 * @param gridRect - The grid's own `getBoundingClientRect()` (origin).
 * @param toothNo - FDI tooth number.
 */
export function tileRectFor(
  grid: HTMLElement,
  gridRect: { left: number; top: number },
  toothNo: number,
): GridRelativeRect | null {
  const tile = sideTile(grid, toothNo);
  if(!tile) return null;
  const r = tile.getBoundingClientRect();
  if(r.width === 0 || r.height === 0) return null;
  return { x: r.left - gridRect.left, y: r.top - gridRect.top, width: r.width, height: r.height };
}

/**
 * Ensure a single `<svg class="bridge-overlay">` child of the grid and (re)draw
 * the bridge-span saddle bars into it. Idempotent: clears and redraws on every
 * call. No-op (never throws) when the grid is absent or there are no spans.
 *
 * The overlay is positioned by CSS (`position:absolute; inset:0`); its intrinsic
 * size/viewBox is synced to the grid box so bar coordinates map 1:1 to pixels.
 */
export function renderBridgeOverlay(deps: RenderBridgeOverlayDeps): void {
  const { grid } = deps;
  if(!grid) return;
  const materialColor = deps.materialColor ?? defaultMaterialColor;

  let overlay = grid.querySelector(
    `:scope > svg.${BRIDGE_OVERLAY_CLASS}`,
  ) as SVGSVGElement | null;

  // Bead odontogram-5hm: die VERBUNDENE Spanne (Kronen-Pfeiler + Glied), nicht
  // nur der Brücken-Lauf - sonst bleibt eine Krone-Brückenglied-Krone-Brücke
  // (Dirks Schema) ohne Verbinder, weil `detectBridgeSpans` das einzelne Glied
  // verwirft.
  const constructions = bridgeConstructions(deps.getState);
  if(constructions.length === 0){
    // Clear any stale bars but do not create a fresh overlay for an empty grid.
    if(overlay){ while(overlay.firstChild) overlay.removeChild(overlay.firstChild); }
    return;
  }

  const gridRect = grid.getBoundingClientRect();
  const rectFor: RectFor = (toothNo) => tileRectFor(grid, gridRect, toothNo);
  // Die ECHTE Kronen-Bbox des Zahns (aktive, sichtbare `*-crown`-Ebene) in
  // Rasterkoordinaten - damit die Brueckenglied-Basis an der Kronenkontur sitzt
  // und nicht ueber sie hinaussteht.
  const crownBoxFor: RectFor = (toothNo) => {
    const tile = sideTile(grid, toothNo);
    if(!tile) return null;
    const crown = Array.from(tile.querySelectorAll('svg [id$="-crown"]'))
      .find((e) => {
        const el = e as SVGGraphicsElement;
        return typeof el.getBoundingClientRect === "function"
          && el.getBoundingClientRect().height > 0
          && getComputedStyle(el as unknown as Element).display !== "none";
      }) as SVGGraphicsElement | undefined;
    if(!crown) return null;
    const r = crown.getBoundingClientRect();
    if(r.width === 0 || r.height === 0) return null;
    return { x: r.left - gridRect.left, y: r.top - gridRect.top, width: r.width, height: r.height };
  };

  const body = computeBridgeBody(constructions, deps.getState, rectFor, materialColor);

  if(!overlay){
    overlay = document.createElementNS(SVG_NS, "svg");
    overlay.setAttribute("class", BRIDGE_OVERLAY_CLASS);
    overlay.setAttribute("aria-hidden", "true");
    grid.appendChild(overlay);
  }
  while(overlay.firstChild) overlay.removeChild(overlay.firstChild);

  // Size ONLY via viewBox, never width/height attributes — exactly as
  // `renderGumOverlay` does. CSS (`inset:0`) stretches the SVG to the grid's
  // LAYOUT box; the viewBox is in the grid's getBoundingClientRect (SCREEN)
  // space, the same space `tileRectFor` reads the bars in, so the two map 1:1.
  // Pinning width/height to the SCREEN size instead nailed the element to the
  // grid's layout box only where the chart is NOT scaled: under the fit-to-width
  // scale (clientWidth 1671 vs bounding-rect 1370) the overlay covered ~82% of
  // the grid, shifting every connector up-and-left onto the wrong teeth (a
  // bridge 17-15 drew its bars over 18-17). removeAttribute clears any stale
  // width/height a previous render may have set.
  overlay.removeAttribute("width");
  overlay.removeAttribute("height");
  overlay.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);

  // Bead odontogram-5hm: erst die Brueckenglied-Basen (gefuellt), dann die
  // Verbinder darueber, damit die Verbinder die Basiskante ueberdecken und die
  // Bruecke als ein Koerper liest. Jede Form traegt einen Material-Verlauf
  // (ensureBridgeGradient), damit sie sich nahtlos in den Kronenkoerper einfuegt.
  for(const c of body.connectors){
    overlay.appendChild(barRect({ ...c, fill: ensureBridgeGradient(overlay, c.fill) }));
  }

  // Bead odontogram-5hm: der geclippte Zervikalstreifen des Brueckenglieds
  // (index.css `data-pontic ... clip-path: inset(PONTIC_CLIP_FRAC)`) liegt sonst
  // leer ueber dem weissen Kachelgrund. Er wird mit der ANGEZEIGTEN Zahnfleisch-
  // farbe gefuellt, sodass unter dem schwebenden Glied ein Streifen Gingiva steht
  // (Dirk), nahtlos an das Zahnfleischband anschliessend.
  for(const span of constructions){
    const isLower = span[0] >= 31;
    for(const tn of span){
      if(!isPontic(deps.getState(tn))) continue;
      const cb = crownBoxFor(tn);
      if(!cb || cb.height <= 0) continue;
      const h = cb.height * PONTIC_CLIP_FRAC;
      const y = isLower ? cb.y + cb.height - h : cb.y;
      const strip = document.createElementNS(SVG_NS, "rect");
      strip.setAttribute("class", BRIDGE_BAR_CLASS);
      strip.setAttribute("x", _f(cb.x));
      strip.setAttribute("y", _f(y));
      strip.setAttribute("width", _f(cb.width));
      strip.setAttribute("height", _f(h));
      strip.setAttribute("fill", GUM_STRIP_COLOR);
      // Marked so a display style can repaint it with ITS gingiva (the
      // attribute fill yields to any CSS rule).
      strip.setAttribute("data-gum-strip", "1");
      overlay.appendChild(strip);
    }
  }
}


// Bead odontogram-5hm: das Angesetzte (Verbinder + Brueckenglied-Basis) soll den
// GLEICHEN VERLAUF wie die Krone tragen, nicht eine flache Farbe (Dirk,
// 23.08.2026: "Das angesetzte Teil sollte die gleiche Farbe/Verlauf wie das
// Brueckenglied haben ... Die Verbinder sollen auch einen Verlauf bekommen.
// Funktioniert das auch mit allen anderen Farben?"). Die Kronen-Gradienten
// liegen je Kachel und tragen dieselbe id mehrfach im Dokument - von der
// separaten Auflage aus nicht sicher referenzierbar. Also wird PRO
// Material-Farbe ein eigener Radial-Verlauf in die Auflage gebaut: heller in der
// Mitte, die Materialfarbe, dunkler am Rand. Das gibt jedem Material (Voll- wie
// Rampenfarbe) einen Verlauf, der zum Kronenkoerper passt.
function _clampByte(v: number): number { return Math.max(0, Math.min(255, Math.round(v))); }
function _parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if(h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function _toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => _clampByte(v).toString(16).padStart(2, "0")).join("");
}
/** Heller (f>0, Richtung Weiss) oder dunkler (f<0, Richtung Schwarz). */
function _shade(hex: string, f: number): string {
  const [r, g, b] = _parseHex(hex);
  if(f >= 0) return _toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  return _toHex(r * (1 + f), g * (1 + f), b * (1 + f));
}
/** Eine eindeutige, css-taugliche id aus einer Farbe. */
function _gradId(color: string): string {
  return "bridge-grad-" + color.replace(/[^a-z0-9]/gi, "");
}
/**
 * Sorgt fuer einen Radial-Verlauf dieser Materialfarbe in `<defs>` der Auflage
 * und gibt die `url(#...)`-Referenz zurueck. Nur Vollfarben (#rgb/#rrggbb)
 * bekommen einen Verlauf; alles andere (schon eine Referenz) bleibt, wie es ist.
 */
function ensureBridgeGradient(overlay: SVGSVGElement, color: string): string {
  if(!/^#[0-9a-f]{3,6}$/i.test(color)) return color;
  const id = _gradId(color);
  let defs = overlay.querySelector("defs") as SVGDefsElement | null;
  if(!defs){
    defs = document.createElementNS(SVG_NS, "defs");
    overlay.insertBefore(defs, overlay.firstChild);
  }
  if(!defs.querySelector(`#${id}`)){
    const grad = document.createElementNS(SVG_NS, "radialGradient");
    grad.setAttribute("id", id);
    grad.setAttribute("cx", "0.5");
    grad.setAttribute("cy", "0.38");
    grad.setAttribute("r", "0.75");
    // Heller Kern, Materialfarbe, dunklerer Rand - derselbe Aufbau wie die
    // `odonKrone*`-Kronen-Verlaeufe.
    for(const [off, col] of [["0", _shade(color, 0.18)], ["0.55", color], ["1", _shade(color, -0.12)]] as const){
      const s = document.createElementNS(SVG_NS, "stop");
      s.setAttribute("offset", off);
      s.setAttribute("stop-color", col);
      grad.appendChild(s);
    }
    defs.appendChild(grad);
  }
  return `url(#${id})`;
}


/**
 * Build a saddle-bar `<rect>` SVG element in the current document. Shared by the
 * live overlay and the export path so the two draw identical geometry.
 */
export function barRect(bar: BridgeBar): SVGRectElement {
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("class", BRIDGE_BAR_CLASS);
  rect.setAttribute("x", String(bar.x));
  rect.setAttribute("y", String(bar.y));
  rect.setAttribute("width", String(bar.width));
  rect.setAttribute("height", String(bar.height));
  // Nur leicht gerundet: eine volle Pille (rx = halbe Breite) las sich als
  // eigenes Element neben der Krone statt als solider Verbinder (Bead 5hm).
  const r = Math.min(bar.height / 2, bar.width / 2, 3);
  rect.setAttribute("rx", String(r));
  rect.setAttribute("ry", String(r));
  rect.setAttribute("fill", bar.fill);
  // Kein Rand: der Verbinder soll mit der Kronenfarbe verschmelzen (Dirk,
  // 23.08.2026), nicht als eigenes Element danebenstehen.
  return rect;
}
