// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-sjr: the restoration colours are choosable.
//
// The colours odontogram-58n shipped are the DEFAULTS, not the only answer.
// Every restoration fill in the generated assets is now
// `fill: var(--odon-rest-gold, #e0a80d)` and the like, so choosing a colour is
// setting a custom property — the cascade repaints, and no JavaScript runs in
// the render path at all. An unconfigured chart is byte-identical to before,
// because nothing is set and every fallback is the shipped colour.
//
// This module is DOM-free apart from one setter, so the derivation can be
// tested without a browser.

/** A colour a practice can choose. `vars` is what it drives; the first entry's
 *  default is what a picker shows when nothing has been chosen. */
export interface PaletteEntry {
  /** Stable key: the settings id, the storage key, and the i18n suffix. */
  key: string;
  /** CSS custom properties this entry writes, in order. */
  vars: string[];
  /** The shipped colour(s) — `vars[i]`'s fallback in the assets. */
  defaults: string[];
  /** How the entry's remaining vars follow the picked colour. */
  kind: "flat" | "ramp" | "lightened";
}

/** The lighter anterior telescope connector is a DELIBERATE contrast, not
 *  drift, so it is derived from the posterior tone rather than unified away or
 *  given a second picker nobody would think to touch. */
const ANTERIOR_LIGHTEN = 0.22;

export const RESTORATION_PALETTE: PaletteEntry[] = [
  { key: "gold",          kind: "flat", vars: ["--odon-rest-gold"],          defaults: ["#e0a80d"] },
  { key: "gradia",        kind: "flat", vars: ["--odon-rest-gradia"],        defaults: ["#57b285"] },
  { key: "zircon",        kind: "flat", vars: ["--odon-rest-zircon"],        defaults: ["#cfe3ee"] },
  { key: "metal",         kind: "flat", vars: ["--odon-rest-metal"],         defaults: ["#0051bf"] },
  // Dirk, 21.08.2026: "Das Provisorium braucht eine Farbe. Normalerweise
  // benutzt man einen Kunststoff, der sich an einer Zahnfarbe Lumin A3
  // orientiert." Weiss war keine Materialfarbe, sondern gar keine: auf weissem
  // Grund blieb vom provisorischen Brueckenverbinder nur die Kontur uebrig.
  // #c8b392 ist der A3-Ton der VITA-classical-Reihe (frueher VITA Lumin
  // Vacuum), aus dem gemessenen CIELAB-Mittel L* 74 / a* 2 / b* 20 nach sRGB
  // gerechnet. Die Messungen streuen je nach Untersuchung um einige Einheiten,
  // deshalb ist das eine ANNAEHERUNG und kein Normwert - und deshalb steht sie
  // hier als Vorgabe, die jede Praxis unter Einstellungen -> Farben durch ihre
  // eigene ersetzen kann.
  { key: "temporary",     kind: "flat", vars: ["--odon-rest-temporary"],     defaults: ["#c8b392"] },
  {
    key: "telescope", kind: "lightened",
    vars: ["--odon-rest-telescope", "--odon-rest-telescope-connector", "--odon-rest-telescope-connector-anterior"],
    defaults: ["#0051bf", "#0051bf", "#388aca"],
  },
  { key: "telescopeInner", kind: "flat", vars: ["--odon-rest-telescope-inner"], defaults: ["#aaa"] },
  { key: "composite",     kind: "flat", vars: ["--odon-fill-composite"],     defaults: ["#2f7a4d"] },
  { key: "amalgam",       kind: "flat", vars: ["--odon-fill-amalgam"],       defaults: ["#aaa"] },
  { key: "gic",           kind: "flat", vars: ["--odon-fill-gic"],           defaults: ["#f9ae94"] },
  { key: "fillTemporary", kind: "flat", vars: ["--odon-fill-temporary"],     defaults: ["#fff"] },
  { key: "dentureTooth",  kind: "flat", vars: ["--odon-rest-denture-tooth"], defaults: ["#a8ddb9"] },
  { key: "dentureBase",   kind: "flat", vars: ["--odon-rest-denture-base"],  defaults: ["#f9ae94"] },
  {
    // e.max and metal-ceramic paint from a NINE-stop ramp, and the lightness
    // sweep across it is what makes them read as ceramic rather than as a flat
    // blob. Flattening them to one colour would have been the cheap answer and
    // the wrong one (Dirk chose to derive instead).
    key: "emax", kind: "ramp",
    vars: Array.from({ length: 9 }, (_, i) => `--odon-rest-emax-${i}`),
    defaults: ["#fff", "#faf6f0", "#f2ebe0", "#eae0d1", "#e2d6c4", "#dbcdb8", "#d5c6ae", "#d0c0a7", "#cebda3"],
  },
  {
    key: "metalCeramic", kind: "ramp",
    vars: Array.from({ length: 9 }, (_, i) => `--odon-rest-metal-ceramic-${i}`),
    defaults: ["#feff5f", "#f9fc60", "#edf564", "#d8ea6b", "#bbd975", "#95c482", "#68ab91", "#328da3", "#0071b5"],
  },
];

const BY_KEY = new Map(RESTORATION_PALETTE.map((e) => [e.key, e]));

// ---------------------------------------------------------------------------
// Colour maths — pure, so the derivation is testable without a browser
// ---------------------------------------------------------------------------

/** Parse `#rgb`/`#rrggbb` into 0-1 channels, or `null`. */
export function parseHex(value: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((value || "").trim());
  if(!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function toHex(rgb: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  return `#${c(rgb[0])}${c(rgb[1])}${c(rgb[2])}`;
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if(d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if(max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if(max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  if(s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    let x = t; if(x < 0) x += 1; if(x > 1) x -= 1;
    if(x < 1 / 6) return p + (q - p) * 6 * x;
    if(x < 1 / 2) return q;
    if(x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)];
}

/** Lighten toward white by `amount` (0-1). */
export function lighten(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if(!rgb) return hex;
  const [h, s, l] = rgbToHsl(rgb);
  return toHex(hslToRgb([h, s, l + (1 - l) * amount]));
}

/**
 * Re-hue a nine-stop ramp to a picked colour while KEEPING its lightness
 * sweep, which is the part that carries the ceramic look. Each stop takes the
 * picked hue, keeps its own lightness, and keeps its saturation in proportion
 * to the ramp's most saturated end — so a stop that was near-white stays
 * near-white and the ramp still reads as depth rather than as a stripe.
 *
 * Returns the defaults unchanged for an unparsable colour, rather than
 * throwing or emitting black.
 */
export function deriveRamp(defaults: string[], picked: string): string[] {
  const target = parseHex(picked);
  if(!target) return [...defaults];
  const [th, ts] = rgbToHsl(target);
  const parsed = defaults.map(parseHex);
  const hsl = parsed.map((p) => (p ? rgbToHsl(p) : null));
  // The ramp's own saturation reference: its most saturated stop, which is the
  // material's actual colour. Dividing by it keeps the sweep's SHAPE while the
  // picked colour sets its overall intensity.
  const refS = hsl.reduce((max, v) => (v && v[1] > max ? v[1] : max), 0) || 1;
  return defaults.map((d, i) => {
    const v = hsl[i];
    if(!v) return d;
    const [, s, l] = v;
    return toHex(hslToRgb([th, Math.min(1, (s / refS) * ts), l]));
  });
}

/** Every CSS variable an entry writes for a picked colour, in `vars` order. */
export function resolveEntry(entry: PaletteEntry, picked: string): string[] {
  if(entry.kind === "ramp") return deriveRamp(entry.defaults, picked);
  if(entry.kind === "lightened"){
    // crown, connector, and the anterior connector derived from it
    return [picked, picked, lighten(picked, ANTERIOR_LIGHTEN)];
  }
  return entry.vars.map(() => picked);
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

/**
 * Cognovis fork default palette — Dirk's own restoration colours (02.09.2026),
 * read out of his configured session. The library ships THIS as the standard;
 * anyone can still change any colour in Settings -> Colours, and "Reset to
 * defaults" restores this palette (not upstream's). Session/practice state, NOT
 * part of the payload — a case opened elsewhere renders in THAT practice's
 * colours, exactly as bead odontogram-sjr intended.
 *
 * The nine flat/lightened entries are Dirk's EXACT picks (the lightened
 * telescope derives its anterior connector, verified: #03bd00 -> #09ff05). The
 * emax ramp is derived from a single pick and cannot be reproduced bit-exact
 * from its stops alone; #d1bda0 is his end tone, so the picker swatch is exact
 * and the sweep lands within ~1 unit of what he configured.
 */
export const FORK_DEFAULT_PALETTE: Record<string, string> = {
  gold: "#dfa507",
  zircon: "#abc9d8",
  metal: "#656e7b",
  telescope: "#03bd00",
  telescopeInner: "#9b8c8c",
  gic: "#ae7f3d",
  fillTemporary: "#608a83",
  amalgam: "#626060",
  dentureTooth: "#41c86c",
  emax: "#d1bda0",
};

/** Chosen colours by entry key. Seeded with the fork default palette; a key
 *  absent means "the shipped asset default". `applyRestorationPalette` still
 *  only writes what is present, and `setRestorationPaletteValues({})` clears it
 *  to a genuinely empty palette (the byte-identical unconfigured state the
 *  parity contract rests on). */
let chosen: Record<string, string> = { ...FORK_DEFAULT_PALETTE };

/** Whether the palette currently equals the fork default (nothing customised
 *  beyond it) — drives the "Reset to defaults" button's enabled state. */
export function restorationPaletteIsDefault(): boolean {
  const keys = Object.keys(FORK_DEFAULT_PALETTE);
  if(Object.keys(chosen).length !== keys.length) return false;
  return keys.every((k) => chosen[k] === FORK_DEFAULT_PALETTE[k]);
}

/** The entry a key names, or `undefined`. */
export function paletteEntry(key: string): PaletteEntry | undefined { return BY_KEY.get(key); }

/** The colour a picker should show for `key` — the chosen one, else the
 *  shipped default. */
export function restorationColour(key: string): string {
  const entry = BY_KEY.get(key);
  if(!entry) return "";
  // A ramp's picker shows the material's own colour, its most saturated end,
  // not the near-white stop the ramp happens to start from.
  const fallback = entry.kind === "ramp" ? entry.defaults[entry.defaults.length - 1] : entry.defaults[0];
  return chosen[key] ?? fallback;
}

/** Every chosen colour. A copy — a caller cannot mutate the palette through it. */
export function getRestorationPalette(): Record<string, string> { return { ...chosen }; }

/** Choose a colour, or clear it back to the shipped default with `null`.
 *  Ignores an unknown key or an unparsable colour rather than storing it. */
export function setRestorationColourValue(key: string, hex: string | null): boolean {
  const entry = BY_KEY.get(key);
  if(!entry) return false;
  if(hex === null){
    if(!(key in chosen)) return false;
    delete chosen[key];
    return true;
  }
  if(!parseHex(hex)) return false;
  if(chosen[key] === hex) return false;
  chosen[key] = hex;
  return true;
}

/** Restore the fork default palette ("Reset to defaults"). Returns whether the
 *  palette actually changed, so a no-op reset skips the repaint. */
export function resetRestorationPaletteValues(): boolean {
  const changed = !restorationPaletteIsDefault();
  chosen = { ...FORK_DEFAULT_PALETTE };
  return changed;
}

/** Replace the whole palette (host restore). Unknown keys and bad colours are
 *  dropped rather than stored — the same tolerant contract every hydrate here
 *  follows. */
export function setRestorationPaletteValues(next: Record<string, string> | null | undefined): void {
  chosen = {};
  if(!next || typeof next !== "object") return;
  for(const [k, v] of Object.entries(next)){
    if(typeof v === "string") setRestorationColourValue(k, v);
  }
}

/**
 * Write the palette onto `root` as custom properties.
 *
 * A key with no choice REMOVES its properties rather than writing the default
 * back: the asset's own `var(..., #hex)` fallback is the default, and writing
 * it again would leave a chart that merely looks unconfigured while carrying
 * inline properties that outlive a reset.
 */
export function applyRestorationPalette(root: { style: CSSStyleDeclaration } | null | undefined): void {
  if(!root?.style) return;
  for(const entry of RESTORATION_PALETTE){
    const picked = chosen[entry.key];
    if(!picked){
      for(const v of entry.vars) root.style.removeProperty(v);
      continue;
    }
    const values = resolveEntry(entry, picked);
    entry.vars.forEach((v, i) => root.style.setProperty(v, values[i] ?? picked));
  }
}

/**
 * The standard palette of the anatomical "Entwurf v1" style (Claude Design,
 * 25.09.2026, docs/design/anatomisch-v1.md): no red and no green on a material,
 * no gradient. It is keyed by CSS VARIABLE, not by entry, because the two ramp
 * materials go FLAT here — all nine stops one colour — which `resolveEntry`
 * (it keeps the ramp's lightness sweep on purpose) cannot express.
 *
 * It only stands in for the fork default: a practice that chose its own
 * colours keeps them in either style (see `usesDraftPalette` in odontogram.ts).
 */
const DRAFT_FLAT: Record<string, string> = {
  "--odon-rest-gold": "#dca72a",
  "--odon-rest-gradia": "#8fb0dc",
  "--odon-rest-zircon": "#ddecf3",
  "--odon-rest-metal": "#a3abb5",
  "--odon-rest-temporary": "#f2c9a0",
  "--odon-rest-telescope": "#dca72a",
  "--odon-rest-telescope-connector": "#dca72a",
  "--odon-rest-telescope-connector-anterior": "#dca72a",
  "--odon-rest-telescope-inner": "#9c730c",
  "--odon-fill-composite": "#8fb0dc",
  "--odon-fill-amalgam": "#666d77",
  "--odon-fill-gic": "#c1b1e0",
  "--odon-fill-temporary": "#f2c9a0",
  // Not in the draft at all; the fork default stays (Dirk's pick), flagged to him.
  "--odon-rest-denture-tooth": "#41c86c",
};
export const DRAFT_V1_PALETTE: Record<string, string> = {
  ...DRAFT_FLAT,
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`--odon-rest-emax-${i}`, "#f0e2c6"])),
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`--odon-rest-metal-ceramic-${i}`, "#ece0c8"])),
};

/** The draft's colour per MATERIAL value (for the bridge connectors, which the
 *  overlay paints from a material name rather than from the cascade). */
export const DRAFT_V1_MATERIAL: Record<string, string> = {
  emax: "#f0e2c6", gold: "#dca72a", gradia: "#8fb0dc", zircon: "#ddecf3",
  metal: "#a3abb5", "metal-ceramic": "#ece0c8", telescope: "#dca72a", temporary: "#f2c9a0",
};

/** Write a variable-keyed palette onto `root`: every palette variable it names
 *  is set, every other one REMOVED — so switching from here back to
 *  `applyRestorationPalette` leaves nothing of this one behind. */
export function applyPaletteVars(root: { style: CSSStyleDeclaration } | null | undefined,
                                 vars: Record<string, string>): void {
  if(!root?.style) return;
  for(const entry of RESTORATION_PALETTE){
    for(const v of entry.vars){
      if(v in vars) root.style.setProperty(v, vars[v]);
      else root.style.removeProperty(v);
    }
  }
}
