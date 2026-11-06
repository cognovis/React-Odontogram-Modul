// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-iqj: welches Gebiss zu einem Alter gehoert.
//
// Dirk, 19.08.2026: "Wir brauchen einen Schalter, um das ganze Gebiss auf
// Milchzahn zu stellen. Das koennte auch schon beim Auslesen des
// Geburtsdatums geschehen (Alter < 6 alles Milchzaehne)."
//
// DOM-frei und ohne Import aus `odontogram.ts`, wie `shorthand.ts`,
// `retention.ts` und `perioClassification.ts`. Und ohne `Date.now()`: das
// heutige Datum wird HEREINGEREICHT. Eine Ableitung, die sich die Zeit selbst
// holt, ist nicht pruefbar und liefert an einem Fall, der morgen wieder
// geoeffnet wird, ein anderes Ergebnis, ohne dass jemand etwas geaendert haette.

/** Die drei Gebisse, die das Odontogramm als Voreinstellung kennt. */
export type DentitionKind = "primary" | "mixed" | "permanent";

/**
 * Alter in vollen Jahren aus einem ISO-Geburtsdatum, gegen ein Stichdatum.
 *
 * `null`, wenn eines von beiden nicht `YYYY-MM-DD` ist oder das Geburtsdatum
 * in der Zukunft liegt - das ist ein Tippfehler und kein Alter.
 *
 * Gerechnet wird auf Kalenderfeldern, nicht auf Millisekunden: der Unterschied
 * sind die Schaltjahre und die Sommerzeit, und bei einem Kind, das gerade sechs
 * wird, entscheidet genau ein Tag ueber die Vorlage.
 */
export function ageFromDob(dob: string, today: string): number | null {
  const g = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
  const h = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today.trim());
  if(!g || !h) return null;
  const [gj, gm, gt] = [Number(g[1]), Number(g[2]), Number(g[3])];
  const [hj, hm, ht] = [Number(h[1]), Number(h[2]), Number(h[3])];
  let jahre = hj - gj;
  if(hm < gm || (hm === gm && ht < gt)) jahre--;
  return jahre < 0 ? null : jahre;
}

/**
 * Welches Gebiss zu diesem Alter gehoert.
 *
 *     unter 6      Milchgebiss
 *     6 bis 12     Wechselgebiss
 *     ab 13        bleibendes Gebiss
 *
 * FAUSTWERTE, und sie stehen hier als solche. Die untere Grenze ist die, an
 * der sich alle einig sind: der Sechsjahrmolar bricht als erster bleibender
 * Zahn durch, und zwar HINTER der Milchreihe, ohne dass ein Milchzahn dafuer
 * ausfaellt - das Wechselgebiss beginnt also mit ihm und nicht mit dem ersten
 * Wackelzahn. Die obere ist weicher: mit zwoelf bis dreizehn sind die zweiten
 * Molaren durch, die Weisheitszaehne dagegen erst mit siebzehn bis fuenfundzwanzig,
 * und die zaehlt niemand zum Wechsel.
 *
 * `null` heisst: kein Alter bekannt, also kein Vorschlag. Nicht "bleibend" -
 * ein fehlendes Alter ist keine Aussage ueber das Gebiss.
 */
export const DENTITION_MIXED_FROM = 6;
export const DENTITION_PERMANENT_FROM = 13;

export function suggestDentition(age: number | null | undefined): DentitionKind | null {
  if(typeof age !== "number" || !Number.isFinite(age) || age < 0) return null;
  if(age < DENTITION_MIXED_FROM) return "primary";
  if(age < DENTITION_PERMANENT_FROM) return "mixed";
  return "permanent";
}
