// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

import { describe, it, expect, beforeEach } from "vitest";
import {
  __applyDentitionPresetForTest,
  __resetChartStateForTest,
  getStatusChart,
  PRIMARY_TEMPLATE,
} from "../odontogram";

/**
 * odontogram-e0a asks for regression cover on the dentition presets. They had
 * none, and they are the fastest way for a whole chart to end up wrong: one
 * click rewrites all thirty-two positions.
 */

const ALL = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];

/** The selection each slot ends up with, defaulting the way the payload does. */
function selections(): Record<number, string> {
  const teeth = getStatusChart().teeth as Record<string, { toothSelection?: string }>;
  const out: Record<number, string> = {};
  for (const slot of ALL) out[slot] = teeth[String(slot)]?.toothSelection ?? "tooth-base";
  return out;
}

const slotsWith = (sel: Record<number, string>, value: string) =>
  ALL.filter((s) => sel[s] === value);

beforeEach(() => __resetChartStateForTest());

describe("dentition presets", () => {
  describe("primary", () => {
    it("charts exactly the twenty deciduous positions as milk teeth", () => {
      __applyDentitionPresetForTest("primary");
      const milk = slotsWith(selections(), "milktooth");
      expect(milk.length).toBe(20);
      // The same twenty the drawings cover - if these two ever disagree, a
      // preset would chart a milk tooth at a position with no deciduous
      // drawing, or leave one drawn but unreachable.
      expect(new Set(milk)).toEqual(new Set(PRIMARY_TEMPLATE.keys()));
    });

    it("leaves no permanent tooth standing", () => {
      __applyDentitionPresetForTest("primary");
      expect(slotsWith(selections(), "tooth-base")).toEqual([]);
    });

    it("records the twelve positions behind it as not erupted, not missing", () => {
      __applyDentitionPresetForTest("primary");
      const sel = selections();
      // The six-year molars and behind. They erupt after the primary dentition
      // and replace nothing, so they are neither present nor missing
      // (odontogram-8vu).
      for (const slot of [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48]) {
        expect(sel[slot], `slot ${slot}`).toBe("not-erupted");
      }
      expect(slotsWith(sel, "none")).toEqual([]);
    });
  });

  describe("mixed", () => {
    it("puts permanent incisors and first molars alongside deciduous laterals", () => {
      __applyDentitionPresetForTest("mixed");
      const sel = selections();
      // The six-year-old's mouth: incisors and first molars have erupted, the
      // canines and both primary molars have not yet been shed.
      for (const slot of [11, 12, 16, 21, 22, 26, 31, 32, 36, 41, 42, 46]) {
        expect(sel[slot], `permanent ${slot}`).toBe("tooth-base");
      }
      for (const slot of [13, 14, 15, 23, 24, 25, 33, 34, 35, 43, 44, 45]) {
        expect(sel[slot], `milk ${slot}`).toBe("milktooth");
      }
      for (const slot of [17, 18, 27, 28, 37, 38, 47, 48]) {
        expect(sel[slot], `unerupted ${slot}`).toBe("not-erupted");
      }
    });

    it("charts a milk tooth only where a deciduous drawing exists", () => {
      __applyDentitionPresetForTest("mixed");
      for (const slot of slotsWith(selections(), "milktooth")) {
        expect(PRIMARY_TEMPLATE.has(slot), `slot ${slot}`).toBe(true);
      }
    });

    it("accounts for all thirty-two positions", () => {
      __applyDentitionPresetForTest("mixed");
      const sel = selections();
      const counted = slotsWith(sel, "tooth-base").length
        + slotsWith(sel, "milktooth").length
        + slotsWith(sel, "not-erupted").length;
      expect(counted).toBe(32);
    });
  });

  describe("switching between them", () => {
    it("leaves no permanent tooth behind when going mixed to primary", () => {
      // The failure this guards against: a preset that only writes the
      // positions it cares about would leave the previous one's permanent
      // incisors standing in a primary dentition.
      __applyDentitionPresetForTest("mixed");
      __applyDentitionPresetForTest("primary");
      expect(slotsWith(selections(), "tooth-base")).toEqual([]);
      expect(slotsWith(selections(), "milktooth").length).toBe(20);
    });

    it("is idempotent", () => {
      __applyDentitionPresetForTest("primary");
      const once = selections();
      __applyDentitionPresetForTest("primary");
      expect(selections()).toEqual(once);
    });
  });
});
