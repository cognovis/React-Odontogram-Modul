// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * odontogram-im1: which implant is in the tooth, kept apart from the finding
 * that one is there.
 *
 * The parser is the part worth testing hardest. A misread lot number is worse
 * than an absent one: it would answer a recall query with the wrong patients.
 */
import { describe, it, expect } from "vitest";
import {
  parseUdi, normalizeImplantProduct, isEmptyImplantProduct, knownSystems,
} from "../implantProduct";

const GS = "";

describe("parseUdi — the bracketed form printed on the label", () => {
  it("reads device identifier, expiry and lot", () => {
    expect(parseUdi("(01)07612345678901(17)300630(10)LOT4711")).toEqual({
      deviceIdentifier: "07612345678901",
      expiry: "2030-06-30",
      lot: "LOT4711",
    });
  });

  it("reads a serial number when the carrier has one", () => {
    const r = parseUdi("(01)07612345678901(21)SN-9(10)L1");
    expect(r.serial).toBe("SN-9");
    expect(r.lot).toBe("L1");
  });

  it("ignores application identifiers it does not know, keeping the rest", () => {
    const r = parseUdi("(01)07612345678901(240)SOMETHING(10)L1");
    expect(r.deviceIdentifier).toBe("07612345678901");
    expect(r.lot).toBe("L1");
  });
});

describe("parseUdi — the concatenated form a scanner emits", () => {
  it("reads fixed-length elements without separators", () => {
    expect(parseUdi("010761234567890117300630")).toEqual({
      deviceIdentifier: "07612345678901",
      expiry: "2030-06-30",
    });
  });

  it("ends a variable-length element at the group separator", () => {
    const r = parseUdi(`0107612345678901` + `10LOT4711` + GS + `17300630`);
    expect(r.lot).toBe("LOT4711");
    expect(r.expiry).toBe("2030-06-30");
  });

  it("runs a trailing variable-length element to the end", () => {
    expect(parseUdi("010761234567890110LOT4711").lot).toBe("LOT4711");
  });

  it("returns nothing rather than a guess on an unknown identifier", () => {
    expect(parseUdi("990761234567890110LOT4711")).toEqual({});
  });
});

describe("parseUdi — dates", () => {
  it("expands a day of 00 to the last day of that month", () => {
    expect(parseUdi("(17)300600").expiry).toBe("2030-06-30");
    expect(parseUdi("(17)300200").expiry).toBe("2030-02-28");
    // 2028 is a leap year; the rule must not be a fixed table
    expect(parseUdi("(17)280200").expiry).toBe("2028-02-29");
  });

  it("follows the GS1 century rule", () => {
    expect(parseUdi("(17)490101").expiry).toBe("2049-01-01");
    expect(parseUdi("(17)990101").expiry).toBe("1999-01-01");
  });

  it("refuses an impossible month rather than storing it", () => {
    expect(parseUdi("(17)301301").expiry).toBeUndefined();
  });
});

describe("normalizeImplantProduct", () => {
  it("keeps the carrier verbatim and derives lot and expiry from it", () => {
    const p = normalizeImplantProduct({
      manufacturer: " Straumann ", system: "BLX",
      diameterMm: 4, lengthMm: 10,
      udi: "(01)07612345678901(17)300630(10)LOT4711",
    });
    expect(p).toEqual({
      manufacturer: "Straumann", system: "BLX",
      diameterMm: 4, lengthMm: 10,
      udi: "(01)07612345678901(17)300630(10)LOT4711",
      deviceIdentifier: "07612345678901", lot: "LOT4711", expiry: "2030-06-30",
    });
  });

  it("lets the carrier win over a typed lot, so the two cannot disagree", () => {
    const p = normalizeImplantProduct({
      udi: "(01)07612345678901(10)FROM-CARRIER", lot: "TYPED",
    });
    expect(p?.lot).toBe("FROM-CARRIER");
  });

  it("keeps a typed lot when the carrier does not carry one", () => {
    const p = normalizeImplantProduct({ udi: "(01)07612345678901", lot: "TYPED" });
    expect(p?.lot).toBe("TYPED");
  });

  it("keeps an unparsable carrier — it is still evidence", () => {
    const p = normalizeImplantProduct({ udi: "not-a-udi" });
    expect(p?.udi).toBe("not-a-udi");
    expect(p?.lot).toBeUndefined();
  });

  it("drops blanks and non-positive dimensions", () => {
    expect(normalizeImplantProduct({ manufacturer: "  ", diameterMm: 0 })).toBeNull();
  });

  it("returns null for a record that says nothing", () => {
    expect(normalizeImplantProduct({})).toBeNull();
    expect(normalizeImplantProduct(null)).toBeNull();
    expect(isEmptyImplantProduct(null)).toBe(true);
  });
});

describe("knownSystems — the list writes itself", () => {
  it("gathers what has actually been placed, once each, sorted", () => {
    expect(knownSystems([
      { manufacturer: "Straumann", system: "BLX" },
      { manufacturer: "Nobel Biocare", system: "NobelActive" },
      { manufacturer: "straumann", system: "blx" },
      { system: "Ankylos" },
      null,
      { manufacturer: "Camlog" },
    ])).toEqual(["Ankylos", "Nobel Biocare NobelActive", "Straumann BLX"]);
  });
});
