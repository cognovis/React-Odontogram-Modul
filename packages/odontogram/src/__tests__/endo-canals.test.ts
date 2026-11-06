// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Endo pro Wurzel/Kanal (charly WURZELZUSTAND per root). Additive axis
// `endoCanals: Record<canal, findings[]>`; WF and post (Stift) coexist, a canal
// can be filled while another is not. Falls back to the legacy whole-tooth
// `endo` scalar when no per-canal detail is charted.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  __resetChartStateForTest,
  getToothDisplayState,
  getStatusChart,
  cycleEndoCanal,
  effectiveEndo,
  effectiveRootPostType,
  endoCanalSummaryParts,
} from "../odontogram";

describe("endo per canal — model + serialization", () => {
  it("defaults to empty and is omitted from serialization", () => {
    __setToothStateForTest(37, {});
    expect(getToothDisplayState(37).endoCanals).toEqual({});
    expect(getStatusChart().teeth["37"]?.endoCanals).toBeUndefined();
  });

  it("stores and serializes per-canal findings (WF + post coexist)", () => {
    __setToothStateForTest(16, { endoCanals: { mesiobuccal: ["filling", "post"], distobuccal: ["incomplete"] } });
    expect(getToothDisplayState(16).endoCanals).toEqual({ mesiobuccal: ["filling", "post"], distobuccal: ["incomplete"] });
    expect(getStatusChart().teeth["16"]?.endoCanals).toEqual({ mesiobuccal: ["filling", "post"], distobuccal: ["incomplete"] });
  });

  it("drops invalid canal findings on hydrate", () => {
    __setToothStateForTest(26, { endoCanals: { palatal: ["filling", "bogus"], mesiobuccal: [] } });
    expect(getToothDisplayState(26).endoCanals).toEqual({ palatal: ["filling"] });
  });
});

describe("endo per canal — both-views derivation + interaction", () => {
  it("effectiveEndo collapses per-canal findings to a whole-tooth value", () => {
    // Filling state and post material are independent projections.
    const mixed = { endoCanals: { mesial: ["incomplete"], distal: ["filling", "post"] } };
    expect(effectiveEndo(mixed)).toBe("endo-filling");
    expect(effectiveRootPostType(mixed)).toBe("metal");
    expect(effectiveEndo({ endoCanals: { mesial: ["filling"] } })).toBe("endo-filling");
    expect(effectiveEndo({ endoCanals: { mesial: ["incomplete"] } })).toBe("endo-filling-incomplete");
    expect(effectiveEndo({ endoCanals: { mesial: ["temporary"] } })).toBe("endo-medical-filling");
    expect(effectiveEndo({ endoCanals: {} })).toBe("none");
    // Legacy combined values project onto both modern axes.
    expect(effectiveEndo({ endo: "endo-glass-pin", endoCanals: { mesial: ["filling"] } })).toBe("endo-filling");
    expect(effectiveRootPostType({ endo: "endo-glass-pin" })).toBe("glass-fiber");
  });

  it("summary emits a language-neutral per-canal line", () => {
    expect(endoCanalSummaryParts({ endoCanals: { mesiobuccal: ["filling", "post"], distobuccal: ["incomplete"] } }))
      .toBe("mb: WF·St · db: WFi");
    expect(endoCanalSummaryParts({ endoCanals: {} })).toBe("");
  });

  it("cycleEndoCanal steps a canal WF → WF+post → WFi → temporary → empty", () => {
    __setToothStateForTest(36, {});
    const read = () => (getStatusChart().teeth["36"]?.endoCanals?.mesial ?? undefined);
    cycleEndoCanal(36, "mesial"); expect(read()).toEqual(["filling"]);
    cycleEndoCanal(36, "mesial"); expect(read()).toEqual(["filling", "post"]);
    cycleEndoCanal(36, "mesial"); expect(read()).toEqual(["incomplete"]);
    cycleEndoCanal(36, "mesial"); expect(read()).toEqual(["temporary"]);
    cycleEndoCanal(36, "mesial"); expect(read()).toBeUndefined(); // back to empty (omitted)
  });
});
