// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-dma: what holds a removable denture to a natural tooth.
//
// A removable denture could be charted, but nothing that HOLDS it: a natural
// abutment tooth was offered an empty prosthesis list, and clasp, attachment
// and bar appeared nowhere in the repository. So a combined fixed-removable
// case was half-chartable — the telescopic crown on the abutment yes, the
// partial denture at the gap yes, but not that the two belong together.
//
// Dirk's structure (2026-08-11), which is three anchorings rather than one
// axis, and its correction the same day:
//
//   Klammer    any present tooth — crowned or not; a crown is neither
//              required nor a bar to it
//   Geschiebe  requires a crown, because it is built into one
//   Steg       between crowned teeth
//
// Only the attachment and the bar are gated on a restoration; the clasp is
// gated on the tooth being there.
//
// This module is DOM-free on purpose, like `bridgeOverlay.ts` — it is the
// derivation, and the renderer and the tests both call it.

/** What holds the denture to this tooth. ONE value, never a set. */
export type RetentionValue = "none" | "clasp" | "attachment" | "bar-abutment";

/** The side the element engages, as charly records it (`<Kl` / `Kl>`). */
export type RetentionSide = "none" | "mesial" | "distal" | "both";

/** The shape this module needs off a tooth's state. */
export interface RetentionStateLike {
  toothSelection?: string;
  restorationType?: string;
  restorationMaterial?: string;
  retention?: string;
  /** An implant records a bar here, not on `retention` — see `isBarAbutment`. */
  prosthesis?: string;
}

/** Reads a tooth's state by FDI number; `undefined` for a tooth never charted. */
export type GetRetentionState = (toothNo: number) => RetentionStateLike | undefined;

/** A present NATURAL tooth. An implant carries its retention on the existing
 *  `prosthesis` axis (locator / bar / bar-denture), which is why it is absent
 *  here — one question, one place to answer it. */
function isPresentNatural(state: RetentionStateLike | undefined): boolean {
  const sel = state?.toothSelection;
  return sel === "tooth-base" || sel === "milktooth";
}

/** Whether the tooth carries a crown an element could be built into. A bridge
 *  pillar counts: it is crowned, whatever else the bridge is doing. */
function isCrowned(state: RetentionStateLike | undefined): boolean {
  const r = state?.restorationType;
  return r === "crown" || r === "bridge";
}

/**
 * The retention elements this tooth can actually carry, in picker order.
 *
 * `none` is always offered; the rest follow the three anchorings above. The
 * list is what the UI shows AND what the setter validates against, so a
 * control can never offer something the setter would silently drop.
 */
export function retentionOptions(state: RetentionStateLike | undefined): RetentionValue[] {
  if(!isPresentNatural(state)) return ["none"];
  const out: RetentionValue[] = ["none", "clasp"];
  if(isCrowned(state)) out.push("attachment", "bar-abutment");
  return out;
}

/** Whether `value` may be stored on a tooth in `state`. */
export function retentionAllowed(state: RetentionStateLike | undefined, value: string): boolean {
  return retentionOptions(state).includes(value as RetentionValue);
}

/**
 * A telescopic crown IS a retention element, clinically — an inner crown
 * inside an outer one, and the denture holds on it. It stays a crown MATERIAL
 * in the model, which is what it is and what already draws as a double
 * contour; this is the one place that recognises it when the summary or an
 * export asks.
 *
 * It also keeps Dirk's exclusion rule true without a special case: a telescope
 * abutment carries no clasp because its retention IS the crown.
 */
export function isTelescopeRetention(state: RetentionStateLike | undefined): boolean {
  return isCrowned(state) && state?.restorationMaterial === "telescope";
}

/** Whether the tooth holds a denture at all, by element or by telescope. */
export function hasRetention(state: RetentionStateLike | undefined): boolean {
  const r = state?.retention;
  return (!!r && r !== "none" && retentionAllowed(state, r)) || isTelescopeRetention(state);
}

/**
 * Derive the bar (Steg) spans from per-tooth state — never stored, exactly as
 * `detectBridgeSpans` derives a bridge run.
 *
 * It differs from a bridge span in ONE way, and the difference is anatomical
 * rather than stylistic: a bridge is continuous, so its span is a run of
 * ADJACENT bridge teeth. A bar crosses the edentulous space it exists to span,
 * so its abutments are almost never adjacent — requiring adjacency would break
 * every real bar into nothing. Within an arch the abutments are therefore
 * taken in arch order and connected from the first to the last, whatever is
 * (or is not) between them.
 *
 * Documented limitation, the same one `detectBridgeSpans` carries and for the
 * same reason: two separate bars in one arch merge into a single run, because
 * state carries no per-bar grouping id. A bar per arch is the norm; a second
 * one would need a grouping id and that is a bigger change than this bead.
 *
 * @param arches - Tooth numbers per arch, in arch order.
 * @returns One array of abutment numbers per arch that has at least two.
 */
export function detectBarSpans(arches: number[][], getState: GetRetentionState): number[][] {
  const spans: number[][] = [];
  for(const arch of arches){
    const abutments = arch.filter((tn) => isBarAbutment(getState(tn)));
    if(abutments.length >= 2) spans.push(abutments);
  }
  return spans;
}

/**
 * Whether this tooth holds a bar — by EITHER route.
 *
 * A natural abutment records it on `retention`; an implant records it on the
 * `prosthesis` axis it already had (`bar` / `bar-denture`), and that stays the
 * right place for an implant. But one bar can rest on both — Dirk confirms
 * implant and natural abutments occur mixed in one case (2026-08-11) — and a
 * bar that only saw half its abutments would be drawn short, or not at all.
 *
 * So the DERIVATION reads both, while neither axis gains a value the other
 * already owns: one clinical bar, one drawn element, each tooth kind still
 * answering where it answered before.
 */
export function isBarAbutment(state: RetentionStateLike | undefined): boolean {
  if(state?.retention === "bar-abutment" && retentionAllowed(state, "bar-abutment")) return true;
  const p = state?.prosthesis;
  return state?.toothSelection === "implant" && (p === "bar" || p === "bar-denture");
}

/** charly's own shorthand, read off its finding keypad (screenshot, Dirk
 *  2026-08-11) rather than paraphrased: the clasp is `<Kl` / `Kl>`, the
 *  attachment `( G` / `G )`, and the bar is written `ste`.
 *
 *  The BRACKET SHAPE is part of the vocabulary, not decoration — angle for the
 *  clasp, round for the attachment — which is why it is a per-element pair and
 *  not one shared chevron. `ste` carries no bracket: a bar is not a thing that
 *  engages one side of one tooth, it runs between abutments, and its side is
 *  the span (see `detectBarSpans`). */
const RETENTION_MARK: Record<string, { mark: string; open: string; close: string }> = {
  clasp: { mark: "Kl", open: "<", close: ">" },
  attachment: { mark: "G", open: "( ", close: " )" },
  "bar-abutment": { mark: "ste", open: "", close: "" },
};

/**
 * The tile marker for a tooth's retention element, in charly's notation with
 * the engaged side as the bracket around it. Returns `""` when the tooth
 * carries no element (or one its own state does not allow).
 */
export function retentionMark(state: RetentionStateLike | undefined, side: string): string {
  const value = state?.retention;
  if(!value || value === "none" || !retentionAllowed(state, value)) return "";
  const spec = RETENTION_MARK[value];
  if(!spec) return "";
  const { mark, open, close } = spec;
  if(!open) return mark;                              // the bar takes no bracket
  if(side === "mesial") return `${open}${mark}`;
  if(side === "distal") return `${mark}${close}`;
  if(side === "both") return `${open}${mark}${close}`;
  return mark;
}

// ---------------------------------------------------------------------------
// The bar as it is DRAWN
// ---------------------------------------------------------------------------
//
// A bar is not a property of one tooth, it connects them — the same shape the
// bridge overlay already has, so it borrows that geometry rather than growing a
// second one. Two things differ, both clinical:
//
//   - it rides HIGHER than a bridge saddle, because a bar sits at the gingival
//     margin between the abutments rather than replacing a crown;
//   - it is drawn as ONE run from the first abutment to the last, so the gap it
//     spans reads as a bar and not as a row of separate pieces.

/** A tile's box in grid-relative coordinates, as `bridgeOverlay` reports it. */
export interface RetentionRect { x: number; y: number; width: number; height: number }

/** A single bar to draw, in grid-relative coordinates. */
export interface RetentionBar { x: number; y: number; width: number; height: number }

/** Where the bar sits down the tile, as a fraction of tile height. Higher than
 *  the bridge saddle's 0.72: a bar sits at the gingival margin, not where a
 *  crown would be. Mirrored about the tile mid-line for the lower arch, exactly
 *  as `SADDLE_Y_FRACTION_LOWER` does. */
export const BAR_Y_FRACTION = 0.62;
/** Bar thickness as a fraction of tile height. */
export const BAR_THICKNESS = 0.055;

/**
 * Compute one bar per span, running from the first abutment's centre to the
 * last's — NOT one piece per inter-tile gap. A bar crossing an edentulous space
 * drawn gap-by-gap would break at every tile boundary, which is exactly the
 * failure `detectBridgeSpans` exists to prevent for bridges.
 *
 * Guards mirror `computeBridgeBars`: a missing or zero-sized tile (occlusal
 * view, collapsed arch) is skipped rather than throwing, and a non-positive
 * width is skipped too.
 */
export function computeRetentionBars(
  spans: number[][],
  rectFor: (toothNo: number) => RetentionRect | null,
): RetentionBar[] {
  const bars: RetentionBar[] = [];
  for(const span of spans){
    const rects = span.map(rectFor).filter((r): r is RetentionRect => !!r && r.width > 0 && r.height > 0);
    if(rects.length < 2) continue;
    const isLower = span[0] >= 31;
    const yFraction = isLower ? 1 - BAR_Y_FRACTION : BAR_Y_FRACTION;
    const xs = rects.map((r) => r.x + r.width / 2);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const width = x1 - x0;
    if(width <= 0) continue;
    const ref = rects[0];
    const height = ref.height * BAR_THICKNESS;
    const midY = ref.y + ref.height * yFraction;
    bars.push({ x: x0, y: midY - height / 2, width, height });
  }
  return bars;
}

// ---------------------------------------------------------------------------
// The clasp as it is DRAWN
// ---------------------------------------------------------------------------
//
// Dirk asked for a drawn clasp rather than a text marker, "rein aus Gewohnheit"
// — and habit is the right argument here: he reads these charts every day, and
// a notation he has to translate is a notation that slows him down.
//
// No template carries clasp artwork, so the hook is drawn in the SAME
// grid-level overlay as the bar, off the SAME tile geometry. That keeps it out
// of the per-tooth SVG entirely (parity-safe) and means the hook and the bar
// can never disagree about where a tooth is.

/** Which SIDE of the screen a tooth's mesial surface faces. Mesial points
 *  toward the arch midline, so it is the left edge in quadrants 2 and 3 and
 *  the right edge in 1 and 4 — the same rule the perio chart's diamond tiles
 *  follow, stated once per module rather than shared through a UI file. */
export function mesialIsLeft(toothNo: number): boolean {
  const quadrant = Math.floor(toothNo / 10);
  // Die MILCHQUADRANTEN gehoeren dazu: 6 steht oben links wie 2, 7 unten links
  // wie 3. Sie fehlten hier bis zum 20.08.2026 - eine Klammer an einem
  // Milchzahn im zweiten oder dritten Quadranten haette an der falschen Seite
  // gehangen. Aufgefallen beim Papillenverlust (odontogram-gry), der dieselbe
  // Seitenfrage stellt und ihn im Milchgebiss oefter stellt.
  return quadrant === 2 || quadrant === 3 || quadrant === 6 || quadrant === 7;
}

/** One drawn clasp arm, in grid-relative coordinates. FILLED, not stroked: a
 *  cast clasp tapers, and a stroke has one width from end to end. */
export interface ClaspGlyph {
  /** Closed outline of the arm, already placed. */
  d: string;
}

/** Where down the tile the hook sits, as a fraction of tile height.
 *
 *  Deliberately the SAME fraction the bridge saddle uses, because that constant
 *  already answers this exact question — it is where a crown sits on the tile —
 *  and a clasp arm engages the crown, not the root. Mirrored for the lower
 *  arch, like every other overlay fraction here. */
const CLASP_Y_FRACTION = 0.72;

/** Arc RADIUS as a fraction of tile width. It is also the arc's reach in BOTH
 *  directions, since a quarter circle spans one radius across and one down. */
const CLASP_RADIUS = 0.20;
/** How far inside the tile edge the arc's proximal end sits, as a fraction of
 *  tile width. The tile is wider than the crown it holds, so anchoring on the
 *  bare tile edge would float the hook in the interdental space instead of
 *  landing it on the tooth. */
const CLASP_EDGE_INSET = 0.10;

/** Arm half-width at the occlusal end, where it joins the denture, and at the
 *  free tip — both as fractions of the arc radius. A cast clasp is bulky where
 *  it leaves the connector and thins toward the tip so the tip can flex; drawn
 *  at one width end to end it reads as a fish hook, which is what Dirk called
 *  it (2026-08-11). */
const CLASP_HALF_WIDTH_OCCLUSAL = 0.30;
const CLASP_HALF_WIDTH_TIP = 0.09;
/** Samples along the quarter arc. Twelve is smooth at tile scale and keeps the
 *  path short enough to read in the DOM. */
const CLASP_SAMPLES = 12;

/**
 * Build the clasp arm for ONE engaged side of one tooth.
 *
 * A QUARTER circle, not a near-closed ring (Dirk, 2026-08-11), placed the way
 * a clasp arm actually runs:
 *
 *   - one end toward the crown's greatest extent — its widest point, level
 *     with the height of contour, which is what the arm engages;
 *   - the other, more occlusal end toward the interdental space, where the arm
 *     leaves the tooth toward the denture;
 *   - and therefore the belly toward the gingiva, which is the curve asked for
 *     one step earlier.
 *
 * All three fall out of ONE construction: the arc's centre sits at the
 * occlusal-inward corner, so the quarter between "one radius gingival of the
 * centre" and "one radius proximal of it" bulges away from that corner.
 *
 * The arm is drawn as a FILLED outline rather than a stroked arc so it can
 * TAPER — thick where it leaves the denture, thin at the free tip, which is
 * the shape of a cast clasp.
 *
 * `uy` is the OCCLUSAL screen direction, and it is arch-derived rather than
 * side-derived: the lower arch draws crowns up (occlusal is -y), the upper
 * draws them down. Taking it from the engaged side instead would put every
 * upper clasp upside down.
 */
function claspPath(rect: RetentionRect, isLower: boolean, sideIsLeft: boolean): ClaspGlyph {
  const r = rect.width * CLASP_RADIUS;
  const yF = isLower ? 1 - CLASP_Y_FRACTION : CLASP_Y_FRACTION;
  const cy = rect.y + rect.height * yF;              // height of contour
  const ux = sideIsLeft ? 1 : -1;                    // toward the crown's centre
  const uy = isLower ? -1 : 1;                       // toward the occlusal edge
  const edge = (sideIsLeft ? rect.x : rect.x + rect.width) + ux * rect.width * CLASP_EDGE_INSET;
  const cx = edge + ux * r;
  const ccy = cy + uy * r;                           // arc centre: occlusal-inward corner

  // Angles of the two ends AROUND that centre. The tip end sits one radius
  // gingival of it, the occlusal end one radius proximal.
  const a0 = Math.atan2(-uy, 0);                     // free tip, one radius gingival
  let a1 = Math.atan2(0, -ux);                       // joins the denture, one radius proximal
  // Walk the SHORT way round (a quarter), whichever rotational sense that is.
  while(a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  while(a0 - a1 > Math.PI) a1 += 2 * Math.PI;

  const half = (t: number) =>
    r * (CLASP_HALF_WIDTH_TIP + (CLASP_HALF_WIDTH_OCCLUSAL - CLASP_HALF_WIDTH_TIP) * t);
  const outer: string[] = [];
  const inner: string[] = [];
  const n = (v: number) => v.toFixed(2);
  for(let i = 0; i <= CLASP_SAMPLES; i++){
    const t = i / CLASP_SAMPLES;
    const ang = a0 + (a1 - a0) * t;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const w = half(t);
    outer.push(`${n(cx + (r + w) * cos)} ${n(ccy + (r + w) * sin)}`);
    inner.push(`${n(cx + (r - w) * cos)} ${n(ccy + (r - w) * sin)}`);
  }
  inner.reverse();
  const d = `M ${outer[0]} L ${outer.slice(1).join(" L ")} L ${inner.join(" L ")} Z`;
  return { d };
}

/**
 * The clasp hooks to draw across the whole chart: one per engaged side, so a
 * clasp recorded as engaging both sides draws two.
 *
 * Guards mirror the bar's: a missing or zero-sized tile is skipped rather than
 * throwing.
 */
export function computeClaspGlyphs(
  teeth: number[],
  getState: GetRetentionState,
  rectFor: (toothNo: number) => RetentionRect | null,
  getSide: (toothNo: number) => string,
): ClaspGlyph[] {
  const out: ClaspGlyph[] = [];
  for(const toothNo of teeth){
    const state = getState(toothNo);
    if(state?.retention !== "clasp" || !retentionAllowed(state, "clasp")) continue;
    const rect = rectFor(toothNo);
    if(!rect || rect.width <= 0 || rect.height <= 0) continue;
    const side = getSide(toothNo);
    const mesialLeft = mesialIsLeft(toothNo);
    const isLower = toothNo >= 31;
    const sides: boolean[] =
      side === "mesial" ? [mesialLeft] :
      side === "distal" ? [!mesialLeft] :
      side === "both" ? [true, false] :
      [!mesialLeft];                  // unrecorded: draw where a clasp usually sits
    for(const sideIsLeft of sides) out.push(claspPath(rect, isLower, sideIsLeft));
  }
  return out;
}
