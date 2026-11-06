// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Which implant is in the tooth — the product, kept apart from the finding.
 *
 * `toothSelection === "implant"` says an implant is there. It does not say
 * which one, and the two are different assertions (odontogram-im1). This module
 * carries the second: what was placed, and enough of its identity to answer the
 * question that makes recording it worth the effort — *which patients carry lot
 * X* — after a manufacturer withdraws one.
 *
 * Two halves, and they answer different questions:
 *
 *  - manufacturer / system / diameter / length are what the next dentist needs
 *    in order to order an abutment onto it, years later;
 *  - the UDI is what a recall needs. Implant packaging in the EU carries one by
 *    law (MDR), it is scannable, and it encodes lot and expiry, so scanning it
 *    fills two fields that nobody wants to type off a foil pouch.
 *
 * NOTHING here is looked up. A UDI's device identifier is a GTIN that names the
 * product globally, but resolving it to a manufacturer needs a registry, and
 * this library takes no dependency on external dental systems (a project rule).
 * So the GTIN is stored as the key it is, and the human-readable half stays
 * typed.
 */

/** What was placed. Every field optional: a chart may know a system and no
 *  UDI, or a scanned UDI and no dimensions, and both are useful. */
export type ImplantProduct = {
  /** "Straumann", "Nobel Biocare" — typed, never derived from the UDI. */
  manufacturer?: string;
  /** Implant line, e.g. "BLX", "NobelActive". */
  system?: string;
  /** Endosseous diameter in mm. */
  diameterMm?: number;
  /** Endosseous length in mm. */
  lengthMm?: number;
  /** The carrier as scanned or typed, kept verbatim. */
  udi?: string;
  /** GS1 (01) — the GTIN identifying the product globally. */
  deviceIdentifier?: string;
  /** GS1 (10). */
  lot?: string;
  /** GS1 (21). */
  serial?: string;
  /** GS1 (17), as YYYY-MM-DD. */
  expiry?: string;
};

/** GS1 application identifiers this parser understands, with their fixed
 *  length where they have one. Anything else is skipped rather than guessed
 *  at: a misparsed lot number is worse than an absent one. */
const FIXED_LENGTH: Record<string, number> = { "01": 14, "11": 6, "15": 6, "17": 6 };
const VARIABLE = new Set(["10", "21"]);

/** FNC1 as a scanner emits it, ASCII 29 — written as an escape so the source
 *  carries no control character. */
const GS = "\u001d";

/** GS1 date, YYMMDD. A day of `00` means "end of that month", which is what a
 *  sterile pouch usually carries. The century follows GS1's own rule: 00-49 is
 *  20xx, 50-99 is 19xx. */
function lastDayOfMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month !== 2) return days[month - 1];
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return leap ? 29 : 28;
}


function gs1Date(v: string): string | undefined {
  if (!/^\d{6}$/.test(v)) return undefined;
  const yy = Number(v.slice(0, 2));
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  const month = Number(v.slice(2, 4));
  if (month < 1 || month > 12) return undefined;
  let day = Number(v.slice(4, 6));
  if (day === 0) day = lastDayOfMonth(year, month);
  if (day < 1 || day > 31) return undefined;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${year}-${p(month)}-${p(day)}`;
}

/**
 * Read a GS1 UDI carrier into the fields it holds.
 *
 * Accepts the bracketed human-readable form printed on the label —
 * `(01)07612345678901(17)300630(10)LOT4711` — and the concatenated form a
 * scanner emits, where a variable-length element runs to the next application
 * identifier or to a group separator (ASCII 29, which scanners send for FNC1).
 *
 * Returns only what it actually read. An unrecognised carrier yields an empty
 * object rather than a guess, and the caller keeps the raw string either way -
 * an unparsed UDI is still evidence, and a later reader may know the format.
 */
export function parseUdi(carrier: string): Pick<
  ImplantProduct, "deviceIdentifier" | "lot" | "serial" | "expiry"
> {
  const out: Pick<ImplantProduct, "deviceIdentifier" | "lot" | "serial" | "expiry"> = {};
  const raw = (carrier || "").trim();
  if (!raw) return out;

  const seen: Record<string, string> = {};

  if (raw.includes("(")) {
    for (const m of raw.matchAll(/\((\d{2,4})\)([^(]*)/g)) {
      seen[m[1]] = m[2].trim();
    }
  } else {
    // A scanner sends FNC1 as ASCII 29; it terminates a variable-length
    // element, so it is kept rather than stripped.
    const s = raw;
    let i = 0;
    while (i + 2 <= s.length) {
      const ai = s.slice(i, i + 2);
      i += 2;
      const fixed = FIXED_LENGTH[ai];
      if (fixed !== undefined) {
        seen[ai] = s.slice(i, i + fixed);
        i += fixed;
        continue;
      }
      if (!VARIABLE.has(ai)) return out; // unknown AI: stop rather than guess
      const gs = s.indexOf(GS, i);
      const end = gs === -1 ? s.length : gs;
      seen[ai] = s.slice(i, end);
      i = end === s.length ? end : end + 1;
    }
  }

  if (seen["01"] && /^\d{8,14}$/.test(seen["01"])) out.deviceIdentifier = seen["01"];
  if (seen["10"]) out.lot = seen["10"];
  if (seen["21"]) out.serial = seen["21"];
  const exp = seen["17"] ? gs1Date(seen["17"]) : undefined;
  if (exp) out.expiry = exp;
  return out;
}

/** True when the record says nothing — the test for whether to serialize it. */
export function isEmptyImplantProduct(p: ImplantProduct | null | undefined): boolean {
  if (!p) return true;
  return !(
    p.manufacturer || p.system || p.udi || p.deviceIdentifier || p.lot ||
    p.serial || p.expiry ||
    typeof p.diameterMm === "number" || typeof p.lengthMm === "number"
  );
}

/** Normalize a record for storage: trim strings, drop blanks, re-read the UDI
 *  so lot and expiry always agree with the carrier they came from, and keep a
 *  lot or expiry that was typed when the carrier does not supply one. */
export function normalizeImplantProduct(p: ImplantProduct | null | undefined): ImplantProduct | null {
  if (!p) return null;
  const str = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s || undefined;
  };
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
  };
  const udi = str(p.udi);
  const read = udi ? parseUdi(udi) : {};
  const out: ImplantProduct = {
    manufacturer: str(p.manufacturer),
    system: str(p.system),
    diameterMm: num(p.diameterMm),
    lengthMm: num(p.lengthMm),
    udi,
    deviceIdentifier: read.deviceIdentifier ?? str(p.deviceIdentifier),
    lot: read.lot ?? str(p.lot),
    serial: read.serial ?? str(p.serial),
    expiry: read.expiry ?? str(p.expiry),
  };
  for (const k of Object.keys(out) as (keyof ImplantProduct)[]) {
    if (out[k] === undefined) delete out[k];
  }
  return isEmptyImplantProduct(out) ? null : out;
}

/** The practice's own list, gathered from what it has actually placed.
 *
 * Dirk's objection to a catalogue was the right one: there are hundreds of
 * implant systems and nobody is going to enter them. So nothing is entered.
 * The list is derived from the charts themselves - a system typed once is
 * offered from then on - which is why it stays short, stays the practice's own,
 * and needs no maintenance.
 */
export function knownSystems(products: Iterable<ImplantProduct | null | undefined>): string[] {
  const seen = new Map<string, string>();
  for (const p of products) {
    if (!p?.system) continue;
    const label = p.manufacturer ? `${p.manufacturer} ${p.system}` : p.system;
    const key = label.toLowerCase();
    if (!seen.has(key)) seen.set(key, label);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
