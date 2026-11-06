// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-c51.1: the model analysis derived from mesiodistal widths.
//
// DELIBERATELY dependency-free, exactly like `perioClassification.ts`: this
// module imports NOTHING from `odontogram.ts` (or anywhere else in the engine),
// has no module-level state, and calls neither `Date` nor `Math.random`. Every
// export is a pure function of its argument, so it is safe to call from live
// state, from a serialized payload, or from a test with hand-written numbers.
// The engine-state adapter that builds a `ModelAnalysisInput` from the chart
// lives outside this file (one-directional dependency).
//
// SOURCING RULE (bead ruling 2026-08-12). Every index here is implemented from
// its own publication and carries the citation next to its constant. The
// procedure export from the practice software was used ONLY to check that this
// arithmetic reproduces the printed values - never as a template. Where the two
// disagree the divergence is documented rather than silently matched; see
// `boltonDiscrepancy` below.
//
// ABSENCE = NOT MEASURED, never zero - the same convention the periodontal
// record uses. A sum whose constituent teeth are not all measured is `null`,
// not a partial total: half a Bolton sum is not a small Bolton sum, it is no
// Bolton sum at all, and silently returning one would put a wrong ratio in
// front of a clinician.

// ---- Tooth groups (FDI) ---------------------------------------------------

/** Bolton's overall ratio runs first molar to first molar. */
export const UPPER_TOTAL_TEETH = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26] as const;
export const LOWER_TOTAL_TEETH = [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36] as const;

/** Bolton's anterior ratio runs canine to canine. */
export const UPPER_ANTERIOR_TEETH = [13, 12, 11, 21, 22, 23] as const;
export const LOWER_ANTERIOR_TEETH = [43, 42, 41, 31, 32, 33] as const;

/** Tonn relates the four upper incisors to the four lower ones. */
export const UPPER_INCISOR_TEETH = [12, 11, 21, 22] as const;
export const LOWER_INCISOR_TEETH = [42, 41, 31, 32] as const;

// ---- Norms ----------------------------------------------------------------

/**
 * Tonn's index: the four lower incisors measure 74 % of the four upper ones.
 * Tonn, Über die mesiodistalen Zahnbreitenrelationen, 1937.
 */
export const TONN_TARGET_PERCENT = 74.0;

/**
 * Bolton's anterior ratio, canine to canine.
 * Bolton, The clinical application of a tooth-size analysis, Angle Orthod 1958.
 */
export const BOLTON_ANTERIOR_TARGET_PERCENT = 77.2;

/**
 * Bolton's overall ratio, first molar to first molar. Same publication.
 */
export const BOLTON_OVERALL_TARGET_PERCENT = 91.3;

// ---- Input ----------------------------------------------------------------

/**
 * Mesiodistal crown widths in mm, keyed by FDI number. A tooth that has not
 * been measured is simply absent - there is no sentinel value, because 0 mm is
 * a legitimate reading nowhere and "not measured" must stay distinguishable.
 *
 * `absentTeeth` lists positions that carry NO measurable tooth on the model -
 * never erupted, lost, or still under the gum. Those get the contralateral
 * substitution below. It is deliberately separate from "no width typed yet":
 * substituting for merely-unmeasured teeth would invent the other half of the
 * arch the moment the first number was entered.
 */
export interface ModelAnalysisInput {
  widths: Readonly<Record<number, number>>;
  absentTeeth?: Iterable<number>;
}

/** One assumed width: `toothNo` took its value from `from`. */
export interface Substitution {
  toothNo: number;
  from: number;
  mm: number;
}

// ---- Output ---------------------------------------------------------------

/** The six sums every index below is built from. `null` = not fully measured. */
export interface ToothSums {
  upperTotal: number | null;
  lowerTotal: number | null;
  upperAnterior: number | null;
  lowerAnterior: number | null;
  upperIncisors: number | null;
  lowerIncisors: number | null;
}

/** Which arch carries the surplus tooth substance. */
export type ExcessArch = "upper" | "lower";

/**
 * One ratio index. `actualPercent` is the measured ratio, `targetPercent` its
 * published norm, and `excessMm` the classical discrepancy - how much wider one
 * arch is than the other arch's width would allow. `excess` names which arch
 * that is; both are `null` when the ratio sits exactly on its norm or when the
 * inputs are incomplete.
 */
export interface RatioIndex {
  actualPercent: number | null;
  targetPercent: number;
  deltaPercent: number | null;
  excess: ExcessArch | null;
  excessMm: number | null;
}

export interface ModelAnalysis {
  sums: ToothSums;
  tonn: RatioIndex;
  boltonAnterior: RatioIndex;
  boltonOverall: RatioIndex;
  /** Upper incisor sum Tonn's norm implies for the measured lower incisors. */
  targetUpperIncisorSum: number | null;
  /** Lower incisor sum Tonn's norm implies for the measured upper incisors. */
  targetLowerIncisorSum: number | null;
  /**
   * Every width that was ASSUMED rather than measured, in FDI order. Anything
   * displaying this analysis has to surface these: a substituted width is an
   * inference, and an inference that looks like a measurement is the one way
   * this whole feature could mislead someone.
   */
  substitutions: Substitution[];
}

// ---- Helpers --------------------------------------------------------------

/**
 * Sum of the named teeth, or `null` if any one of them is unmeasured. A width
 * is only accepted when it is a finite number strictly greater than zero -
 * NaN, Infinity and non-positive readings are treated as not measured rather
 * than propagated into a total.
 */
export function sumWidths(
  widths: Readonly<Record<number, number>>,
  teeth: readonly number[],
): number | null {
  let total = 0;
  for (const toothNo of teeth) {
    const w = widths[toothNo];
    if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) return null;
    total += w;
  }
  return total;
}

/**
 * The classical tooth-size discrepancy for a lower-over-upper ratio.
 *
 * Ratio above its norm means the LOWER arch carries excess substance, and the
 * excess is what the lower sum exceeds the norm applied to the upper sum.
 * Ratio below its norm means the UPPER arch does, measured the same way in the
 * other direction. This is the figure orthodontic literature attaches to a
 * Bolton analysis, and the one that drives a stripping or build-up decision.
 *
 * NOTE - divergence from the reference printout. The practice software prints a
 * different millimetre figure: it multiplies the percentage-point deviation by
 * the ratio's own numerator (delta% x lower sum / 100), giving 0.9 mm where the
 * classical formula gives 1.1 mm for the same case. Both are internally
 * consistent; they are simply different quantities. The classical one is
 * implemented here because the sourcing rule says to follow the publication.
 */
export function boltonDiscrepancy(
  lowerSum: number,
  upperSum: number,
  targetPercent: number,
): { excess: ExcessArch | null; excessMm: number | null } {
  const target = targetPercent / 100;
  const actual = lowerSum / upperSum;
  if (actual === target) return { excess: null, excessMm: null };
  if (actual > target) {
    return { excess: "lower", excessMm: lowerSum - upperSum * target };
  }
  return { excess: "upper", excessMm: upperSum - lowerSum / target };
}

function ratioIndex(
  lowerSum: number | null,
  upperSum: number | null,
  targetPercent: number,
): RatioIndex {
  if (lowerSum === null || upperSum === null || upperSum <= 0) {
    return { actualPercent: null, targetPercent, deltaPercent: null, excess: null, excessMm: null };
  }
  const actualPercent = (lowerSum / upperSum) * 100;
  const { excess, excessMm } = boltonDiscrepancy(lowerSum, upperSum, targetPercent);
  return {
    actualPercent,
    targetPercent,
    deltaPercent: actualPercent - targetPercent,
    excess,
    excessMm,
  };
}

// ---- Contralateral substitution -------------------------------------------

/**
 * The same tooth on the other side of the same arch: 12 mirrors to 22, 46 to
 * 36. FDI pairs the quadrants 1↔2 and 4↔3 in the permanent dentition, 5↔6 and
 * 8↔7 in the primary one; the position digit never changes. Returns `null` for
 * anything that is not an FDI tooth number.
 */
export function contralateral(toothNo: number): number | null {
  const quadrant = Math.floor(toothNo / 10);
  const position = toothNo % 10;
  if (position < 1 || position > 8) return null;
  const mirrored: Record<number, number> = { 1: 2, 2: 1, 3: 4, 4: 3, 5: 6, 6: 5, 7: 8, 8: 7 };
  const other = mirrored[quadrant];
  return other === undefined ? null : other * 10 + position;
}

/**
 * Apply Dirk's rule: a tooth that is not on the model - never erupted, lost, or
 * under the gum - takes the width of its contralateral partner, so Tonn and
 * Bolton still mean something instead of collapsing to "not computable".
 *
 * Two decisions worth stating, because both could reasonably have gone the
 * other way:
 *
 * - An absent tooth NEVER uses a width stored against itself. If the position
 *   is charted as carrying no tooth, a reading filed under it is stale - there
 *   was nothing there to put the caliper on. The stored value is ignored, not
 *   deleted, so un-marking the tooth brings it straight back.
 * - Substitution needs a MEASURED partner. It never chains: two missing
 *   contralaterals stay unmeasured rather than borrowing from each other, and
 *   an absent tooth whose partner is also absent leaves the sum null, which is
 *   the honest answer.
 */
export function resolveWidths(input: ModelAnalysisInput): {
  effective: Record<number, number>;
  substitutions: Substitution[];
} {
  const absent = new Set(input.absentTeeth ?? []);
  const measured = (toothNo: number): number | null => {
    if (absent.has(toothNo)) return null;
    const w = input.widths[toothNo];
    return typeof w === "number" && Number.isFinite(w) && w > 0 ? w : null;
  };

  const effective: Record<number, number> = {};
  const substitutions: Substitution[] = [];

  for (const toothNo of [...UPPER_TOTAL_TEETH, ...LOWER_TOTAL_TEETH]) {
    const own = measured(toothNo);
    if (own !== null) {
      effective[toothNo] = own;
      continue;
    }
    if (!absent.has(toothNo)) continue;
    const partner = contralateral(toothNo);
    const borrowed = partner === null ? null : measured(partner);
    if (borrowed !== null) {
      effective[toothNo] = borrowed;
      substitutions.push({ toothNo, from: partner!, mm: borrowed });
    }
  }
  return { effective, substitutions };
}

// ---- Derivation -----------------------------------------------------------

/**
 * Derive the whole model analysis from measured widths. Pure: same input, same
 * output, always. Nothing is rounded here - rounding is a presentation
 * decision and belongs to whatever displays the result.
 */
export function deriveModelAnalysis(input: ModelAnalysisInput): ModelAnalysis {
  const { effective: w, substitutions } = resolveWidths(input);
  const sums: ToothSums = {
    upperTotal: sumWidths(w, UPPER_TOTAL_TEETH),
    lowerTotal: sumWidths(w, LOWER_TOTAL_TEETH),
    upperAnterior: sumWidths(w, UPPER_ANTERIOR_TEETH),
    lowerAnterior: sumWidths(w, LOWER_ANTERIOR_TEETH),
    upperIncisors: sumWidths(w, UPPER_INCISOR_TEETH),
    lowerIncisors: sumWidths(w, LOWER_INCISOR_TEETH),
  };

  const tonnFactor = TONN_TARGET_PERCENT / 100;

  return {
    sums,
    tonn: ratioIndex(sums.lowerIncisors, sums.upperIncisors, TONN_TARGET_PERCENT),
    boltonAnterior: ratioIndex(
      sums.lowerAnterior,
      sums.upperAnterior,
      BOLTON_ANTERIOR_TARGET_PERCENT,
    ),
    boltonOverall: ratioIndex(sums.lowerTotal, sums.upperTotal, BOLTON_OVERALL_TARGET_PERCENT),
    targetUpperIncisorSum: sums.lowerIncisors === null ? null : sums.lowerIncisors / tonnFactor,
    targetLowerIncisorSum: sums.upperIncisors === null ? null : sums.upperIncisors * tonnFactor,
    substitutions,
  };
}

/**
 * Whether anything at all has been measured. Mirrors `hasAnyPerioData()` -
 * a blank record must be distinguishable from a measured one so the UI can
 * stay quiet instead of presenting a page of empty rows.
 */
export function hasAnyModelData(input: ModelAnalysisInput): boolean {
  return Object.values(input.widths).some(v => typeof v === "number" && Number.isFinite(v) && v > 0);
}
