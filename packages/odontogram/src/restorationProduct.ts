// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * WELCHES Produkt in der Restauration steckt — getrennt vom Befund.
 *
 * Bead odontogram-99h, die zweite Haelfte dessen, was `odontogram-im1` fuer das
 * Implantat gebaut hat. Dirk, 11.08.2026, gefragt, ob ein Befund, der die Praxis
 * verlaesst, "Keramik (e.max)" tragen soll oder die blosse Klasse:
 *
 *   | Die reine Klasse. Das Material ist eine separate Aussage.
 *
 * `restorationMaterial` sagt die KLASSE — Lithiumdisilikat, Zirkon,
 * Edelmetall. Es sagt nicht, ob die Krone aus IPS e.max CAD oder aus einem
 * anderen Lithiumdisilikat besteht, und das sind zwei verschiedene Aussagen.
 * Die erste kann das Programm herleiten, die zweite nie.
 *
 * WOZU. Nicht fuer den Befund — der ist ohne das Produkt vollstaendig. Sondern
 * fuer die vier Fragen, die ohne es unbeantwortbar bleiben: Gewaehrleistung,
 * RUECKRUF ("welche Patienten tragen Los X"), der Laborzettel, und eine
 * Unvertraeglichkeit gegen ein bestimmtes Produkt. Jede davon will die CHARGE
 * so sehr wie den Namen — das ist der Pruefstein jeder Gestaltung hier.
 *
 * UND DIE WICHTIGERE HAELFTE, Dirk am 21.08.2026:
 *
 *   | eine derartige Versorgung muss auch gueltig sein, wenn sie nicht erhoben
 *   | wird. Bei einem Eingangsbefund wird sie mit grosser Wahrscheinlichkeit
 *   | sowieso nicht zu ermitteln sein.
 *
 * Deshalb ist JEDES Feld hier freiwillig, und deshalb ist eine Krone ohne
 * Produktangabe kein unvollstaendiger Befund. `isRestorationProductGap` in
 * `odontogram.ts` zieht die Grenze so, wie `isImplantProductGap` sie fuer das
 * Implantat zieht: fehlt die Angabe an Arbeit, die diese Praxis gemacht hat, ist
 * das eine Luecke; an Arbeit, die der Patient mitgebracht hat, ist es der
 * Normalfall.
 *
 * NICHTS wird nachgeschlagen. Der Geraetebezeichner einer UDI ist eine GTIN und
 * benennt das Produkt weltweit, aber sie aufzuloesen braucht ein Register — und
 * diese Bibliothek nimmt keine Abhaengigkeit auf fremde Dentalsysteme auf
 * (Projektregel). Die GTIN wird also als der Schluessel gespeichert, der sie ist,
 * und die lesbare Haelfte bleibt getippt.
 */

import { parseUdi } from "./implantProduct";

/** Was eingegliedert wurde. Jedes Feld freiwillig: ein Chart kennt vielleicht
 *  nur die Zahnfarbe, ein anderes eine gescannte Charge und sonst nichts, und
 *  beides ist brauchbar. */
export type RestorationProduct = {
  /** "Ivoclar Vivadent", "GC", "Kuraray" — getippt, nie aus der UDI abgeleitet. */
  manufacturer?: string;
  /** Der Produktname, z.B. "IPS e.max CAD", "Ceramill Zolid", "Gradia". */
  product?: string;
  /**
   * Die Zahnfarbe, z.B. "A3".
   *
   * Sie steht hier und nicht bei den Befunden, weil sie zur ARBEIT gehoert und
   * nicht zum Zahn: was bestellt und geliefert wurde. Und sie steht hier, weil
   * sie in der Praxis oft das Einzige ist, was ueberhaupt notiert wird - ein
   * Feld, das haeufig gefuellt wird, traegt den Rest mit.
   */
  shade?: string;
  /** Welches Labor die Arbeit gefertigt hat — die andere Haelfte des
   *  Laborzettels, und bei einer Reklamation die erste Frage. */
  lab?: string;
  /** Der Traeger, wie gescannt oder getippt, woertlich aufbewahrt. */
  udi?: string;
  /** GS1 (01) — die GTIN, die das Produkt weltweit benennt. */
  deviceIdentifier?: string;
  /** GS1 (10) — die Charge. Ohne sie ist ein Rueckruf nicht beantwortbar. */
  lot?: string;
  /** GS1 (21). */
  serial?: string;
  /** GS1 (17), als YYYY-MM-DD. */
  expiry?: string;
};

/** Wahr, wenn der Satz nichts aussagt — die Probe darauf, ob er ueberhaupt
 *  gespeichert wird. */
export function isEmptyRestorationProduct(p: RestorationProduct | null | undefined): boolean {
  if (!p) return true;
  return !(
    p.manufacturer || p.product || p.shade || p.lab ||
    p.udi || p.deviceIdentifier || p.lot || p.serial || p.expiry
  );
}

/**
 * Fuer die Ablage geraderuecken: Leerraum weg, leere Felder weg, und die UDI
 * NEU GELESEN, damit Charge und Verfall nie etwas anderes sagen als der
 * Traeger, aus dem sie stammen.
 *
 * Eine getippte Charge bleibt stehen, wo der Traeger keine hergibt — nicht
 * jedes Produkt kommt mit einem Barcode, und die Charge ist der Grund, warum es
 * dieses Feld gibt.
 */
export function normalizeRestorationProduct(
  p: RestorationProduct | null | undefined,
): RestorationProduct | null {
  if (!p) return null;
  const str = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s || undefined;
  };
  const udi = str(p.udi);
  const read = udi ? parseUdi(udi) : {};
  const out: RestorationProduct = {
    manufacturer: str(p.manufacturer),
    product: str(p.product),
    shade: str(p.shade),
    lab: str(p.lab),
    udi,
    deviceIdentifier: read.deviceIdentifier ?? str(p.deviceIdentifier),
    lot: read.lot ?? str(p.lot),
    serial: read.serial ?? str(p.serial),
    expiry: read.expiry ?? str(p.expiry),
  };
  for (const k of Object.keys(out) as (keyof RestorationProduct)[]) {
    if (out[k] === undefined) delete out[k];
  }
  return isEmptyRestorationProduct(out) ? null : out;
}

/**
 * Die Liste der Praxis, aus ihren eigenen Charts gesammelt.
 *
 * Derselbe Einwand wie beim Implantat, und er gilt hier genauso: es gibt
 * hunderte Produkte, niemand traegt einen Katalog ein, also wird nichts
 * eingetragen. Die Liste entsteht aus dem, was schon einmal getippt wurde -
 * darum bleibt sie kurz, bleibt sie die der Praxis, und braucht keine Pflege.
 */
export function knownProducts(
  products: Iterable<RestorationProduct | null | undefined>,
): string[] {
  const seen = new Map<string, string>();
  for (const p of products) {
    if (!p?.product) continue;
    const label = p.manufacturer ? `${p.manufacturer} ${p.product}` : p.product;
    const key = label.toLowerCase();
    if (!seen.has(key)) seen.set(key, label);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** Die Labore der Praxis, aus denselben Charts. */
export function knownLabs(
  products: Iterable<RestorationProduct | null | undefined>,
): string[] {
  const seen = new Map<string, string>();
  for (const p of products) {
    if (!p?.lab) continue;
    const key = p.lab.toLowerCase();
    if (!seen.has(key)) seen.set(key, p.lab);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
