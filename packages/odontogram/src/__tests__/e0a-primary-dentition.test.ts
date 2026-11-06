// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

import { describe, it, expect } from "vitest";
import { PRIMARY_TEMPLATE, TOOTH_TEMPLATE } from "../odontogram";

/**
 * odontogram-e0a: coverage of the primary dentition and the rule that blocks
 * the milk state on the permanent molars.
 */

const PRIMARY_FDI = [
  51, 52, 53, 54, 55, 61, 62, 63, 64, 65,
  71, 72, 73, 74, 75, 81, 82, 83, 84, 85,
];

/** A primary tooth is charted in its successor's slot: quadrant 5-8 -> 1-4. */
const slotOf = (fdi: number) => (Math.floor(fdi / 10) - 4) * 10 + (fdi % 10);

describe("primary dentition coverage", () => {
  it("covers all twenty primary teeth", () => {
    for (const fdi of PRIMARY_FDI) {
      expect(PRIMARY_TEMPLATE.has(slotOf(fdi)), `FDI ${fdi}`).toBe(true);
    }
    expect(PRIMARY_TEMPLATE.size).toBe(20);
  });

  it("uses ten drawings for the twenty teeth", () => {
    // The arches mirror, which is why there are ten templates rather than
    // twenty. Until 2026-08-17 there were eight: the lower incisors shared one
    // drawing and the lower canine borrowed the UPPER one. Dirk drew all ten.
    expect(new Set(PRIMARY_TEMPLATE.values())).toEqual(
      new Set([51, 52, 53, 54, 55, 81, 82, 83, 84, 85]),
    );
  });

  it("maps every slot to a drawing of its own tooth class", () => {
    // Every slot now has a drawing of its own POSITION, so the class check is
    // the weaker of two true statements - it is kept because it is the one that
    // states the clinical rule: a first primary molar is never drawn where a
    // second one belongs, and a canine is never drawn as an incisor.
    const classOf = (n: number) => {
      const pos = n % 10;
      if (pos <= 2) return "incisor";
      if (pos === 3) return "canine";
      return `molar${pos}`;
    };
    for (const [slot, tpl] of PRIMARY_TEMPLATE) {
      expect(classOf(tpl), `slot ${slot}`).toBe(classOf(slot));
    }
  });

  it("keeps the arches apart where they are drawn apart", () => {
    // Nothing is shared across the jaws any more. The lower canine used to be
    // the upper drawing shown a tenth smaller; it has its own now (83).
    expect(PRIMARY_TEMPLATE.get(11)).toBe(51);
    expect(PRIMARY_TEMPLATE.get(31)).toBe(81);
    expect(PRIMARY_TEMPLATE.get(13)).toBe(53);
    expect(PRIMARY_TEMPLATE.get(33)).toBe(83);
  });

  it("never assigns a primary drawing to a permanent molar position", () => {
    // The clinical reason MILKTOOTH_BLOCKED exists (odontogram-e0a asks for it
    // to be confirmed or changed): the primary dentition has no tooth distal to
    // position 5. A retained primary second molar - the case that motivates the
    // question, a persisting 75 under an aplastic 35 - sits at position 5 and is
    // NOT blocked. Nothing can ever occupy 6, 7 or 8 as a milk tooth, so the
    // rule is confirmed rather than relaxed.
    for (const [slot] of PRIMARY_TEMPLATE) {
      expect(slot % 10, `slot ${slot}`).toBeLessThanOrEqual(5);
    }
    for (const molar of [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48]) {
      expect(PRIMARY_TEMPLATE.has(molar), `slot ${molar}`).toBe(false);
    }
  });

  it("keeps a retained primary second molar chartable", () => {
    // The situation the blocking rule must not prevent: 35 is aplastic and 75
    // persists into adulthood. That is position 5, which has a drawing.
    expect(PRIMARY_TEMPLATE.get(35)).toBe(85);
    expect(PRIMARY_TEMPLATE.get(45)).toBe(85);
  });

  it("charts every primary slot in a position the odontogram draws", () => {
    for (const [slot] of PRIMARY_TEMPLATE) {
      expect(TOOTH_TEMPLATE.has(slot), `slot ${slot}`).toBe(true);
    }
  });
});
