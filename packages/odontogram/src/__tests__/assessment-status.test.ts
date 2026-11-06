// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-2vd, AC2: every periodontal / peri-implant axis in scope
// tells assessed (including assessed-normal) apart from not assessed,
// unmeasurable and not applicable — with a generic assessment axis, never a
// renderer-local clinical code smuggled into the value itself.

import { describe, it, expect, beforeEach } from "vitest";
import {
  getAssessmentStatus,
  setAssessmentStatus,
  getToothAssessments,
  perioAxisApplies,
  PERIO_ASSESSMENT_AXES,
  setPerioSite,
  setPlaque,
  setFurcation,
  setPlaqueIndex,
  setKeratinizedWidth,
  setToothMobility,
  setPeriImplantPlaque,
  setChartMode,
  getToothPerio,
  getKeratinizedWidth,
  getToothMobility,
  getToothPlaque,
  getPlaqueIndex,
  __setToothStateForTest,
  __resetChartStateForTest,
  __collectExportPayloadForTest,
  __hydrateImportedChartsForTest,
} from "../odontogram";

beforeEach(() => __resetChartStateForTest());

describe("periodontal assessment status", () => {
  it("an applicable but uncharted axis reads not-assessed", () => {
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("not-assessed");
    expect(getAssessmentStatus(16, "mobility")).toBe("not-assessed");
    expect(getAssessmentStatus(16, "kg")).toBe("not-assessed");
    expect(getAssessmentStatus(16, "plaque", "buccal")).toBe("not-assessed");
  });

  it("a charted value reads assessed on every axis in scope", () => {
    setPerioSite(16, "MB", { pd: 4, gm: 2, bop: true, sup: true });
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "gm", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "bop", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "sup", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("not-assessed"); // a different site is untouched
    setPlaque(16, "buccal", true);
    expect(getAssessmentStatus(16, "plaque", "buccal")).toBe("assessed");
    setFurcation(16, "buccal", 2);
    expect(getAssessmentStatus(16, "furcation", "buccal")).toBe("assessed");
    setPlaqueIndex(16, "mesial", 2);
    expect(getAssessmentStatus(16, "pi", "mesial")).toBe("assessed");
    setKeratinizedWidth(16, 3);
    expect(getAssessmentStatus(16, "kg")).toBe("assessed");
    setToothMobility(16, "m1");
    expect(getAssessmentStatus(16, "mobility")).toBe("assessed");
  });

  it("records assessed-normal explicitly, where a normal result stores no value", () => {
    // Probed, did not bleed, no plaque, no mobility, no furcation involvement:
    // every one of these is a real finding, not a gap in the record.
    setAssessmentStatus(16, "bop", "MB", "assessed");
    setAssessmentStatus(16, "plaque", "buccal", "assessed");
    setAssessmentStatus(16, "mobility", null, "assessed");
    setAssessmentStatus(16, "furcation", "buccal", "assessed");
    expect(getAssessmentStatus(16, "bop", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "plaque", "buccal")).toBe("assessed");
    expect(getAssessmentStatus(16, "mobility")).toBe("assessed");
    expect(getAssessmentStatus(16, "furcation", "buccal")).toBe("assessed");
    // ... and the sites nobody looked at still read as not assessed.
    expect(getAssessmentStatus(16, "bop", "DB")).toBe("not-assessed");
    expect(getAssessmentStatus(16, "plaque", "lingual")).toBe("not-assessed");
  });

  it("records unmeasurable and not-applicable, and clears back to not-assessed", () => {
    setAssessmentStatus(16, "pd", "DB", "unmeasurable");
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("unmeasurable");
    setAssessmentStatus(16, "kg", null, "not-applicable");
    expect(getAssessmentStatus(16, "kg")).toBe("not-applicable");
    setAssessmentStatus(16, "pd", "DB", "not-assessed");
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("not-assessed");
    expect(getToothAssessments(16)).toEqual({ kg: "not-applicable" });
  });

  it("an actual measurement supersedes a previously recorded gap", () => {
    setAssessmentStatus(16, "pd", "MB", "unmeasurable");
    setPerioSite(16, "MB", { pd: 5 });
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("assessed");
  });

  it("rejects an unknown axis, qualifier or status", () => {
    setAssessmentStatus(16, "pd", "XX" as never, "unmeasurable");
    setAssessmentStatus(16, "bogus" as never, "MB", "unmeasurable");
    setAssessmentStatus(16, "pd", "MB", "maybe" as never);
    expect(getToothAssessments(16)).toEqual({});
    expect(getAssessmentStatus(16, "bogus" as never)).toBe("not-applicable");
  });

  it("derives not-applicable from what the tooth actually is", () => {
    __setToothStateForTest(11, {}); // natural, present
    expect(perioAxisApplies(11, "pd")).toBe(true);
    expect(perioAxisApplies(11, "gm")).toBe(true);
    expect(perioAxisApplies(11, "mpi")).toBe(false); // Mombelli indices need an implant
    expect(perioAxisApplies(11, "furcation")).toBe(false); // an incisor has no furcation
    expect(getAssessmentStatus(11, "mpi", "buccal")).toBe("not-applicable");
    expect(getAssessmentStatus(11, "furcation", "buccal")).toBe("not-applicable");
    expect(perioAxisApplies(16, "furcation")).toBe(true); // an upper molar does

    __setToothStateForTest(21, { toothSelection: "none" }); // missing
    for (const axis of PERIO_ASSESSMENT_AXES) {
      expect(perioAxisApplies(21, axis)).toBe(false);
      expect(getAssessmentStatus(21, axis, axis === "pd" ? "MB" : null)).toBe("not-applicable");
    }
  });

  it("an implant supports the peri-implant examination and nothing that needs a CEJ", () => {
    __setToothStateForTest(11, { toothSelection: "implant" });
    for (const axis of ["pd", "bop", "sup", "mobility", "kg", "mpi", "mbi"] as const) {
      expect(perioAxisApplies(11, axis)).toBe(true);
    }
    // The natural-tooth axes that are meaningless on a fixture: the gingival
    // margin is measured against the CEJ, and plaque/PI/GI have Mombelli
    // equivalents (mPI/mBI) for implants.
    for (const axis of ["gm", "plaque", "pi", "gi", "furcation"] as const) {
      expect(perioAxisApplies(11, axis)).toBe(false);
      expect(getAssessmentStatus(11, axis, axis === "gm" ? "MB" : "buccal")).toBe("not-applicable");
    }
    setPeriImplantPlaque(11, "buccal", 2);
    expect(getAssessmentStatus(11, "mpi", "buccal")).toBe("assessed");
  });

  it("structural not-applicable cannot be overridden by a stored status", () => {
    __setToothStateForTest(11, {}); // natural tooth: mPI does not apply
    setAssessmentStatus(11, "mpi", "buccal", "unmeasurable");
    expect(getAssessmentStatus(11, "mpi", "buccal")).toBe("not-applicable");
    expect(getToothAssessments(11)).toEqual({});
  });

  it("serializes omit-when-empty and round-trips through hydrate", () => {
    const empty = __collectExportPayloadForTest();
    expect(Object.prototype.hasOwnProperty.call(empty.teeth["16"], "assessment")).toBe(false);
    setAssessmentStatus(16, "pd", "DB", "unmeasurable");
    setAssessmentStatus(16, "mobility", null, "assessed");
    const json = JSON.parse(JSON.stringify(__collectExportPayloadForTest()));
    expect(json.teeth["16"].assessment).toEqual({ "pd:DB": "unmeasurable", mobility: "assessed" });

    __resetChartStateForTest();
    __hydrateImportedChartsForTest(json);
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("unmeasurable");
    expect(getAssessmentStatus(16, "mobility")).toBe("assessed");
  });

  it("hydrate drops malformed assessment entries", () => {
    __hydrateImportedChartsForTest({
      version: "2.21", globals: {}, teeth: {
        "16": { assessment: { "pd:DB": "unmeasurable", "pd:ZZ": "unmeasurable", bogus: "assessed", "bop:MB": "nonsense" } },
      },
    });
    expect(getToothAssessments(16)).toEqual({ "pd:DB": "unmeasurable" });
  });

  it("treats a probed site's bleeding and suppuration as assessed, like %BOP does", () => {
    // The whole-mouth %BOP divides bleeding sites by CHARTED sites, and the
    // FHIR export emits an explicit false per charted site: a probed site that
    // did not bleed is an assessed negative, not a gap in the record.
    setPerioSite(16, "MB", { pd: 4 });
    expect(getAssessmentStatus(16, "bop", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "sup", "MB")).toBe("assessed");
    expect(getAssessmentStatus(16, "bop", "DB")).toBe("not-assessed");
  });

  it("refuses an edit the capability matrix calls not applicable", () => {
    __setToothStateForTest(21, { toothSelection: "none" });
    setPerioSite(21, "MB", { pd: 4 });
    setKeratinizedWidth(21, 3);
    setToothMobility(21, "m1");
    setPlaque(21, "buccal", true);
    expect(getToothPerio(21).pd).toEqual({});
    expect(getKeratinizedWidth(21)).toBeNull();
    expect(getToothMobility(21)).toBe("none");
    expect(getToothPlaque(21)).toEqual([]);

    __setToothStateForTest(11, { toothSelection: "implant" });
    setPerioSite(11, "MB", { pd: 5, gm: 2 }); // pd applies, gm does not
    setPlaqueIndex(11, "mesial", 2);          // natural-tooth index
    expect(getToothPerio(11).pd).toEqual({ MB: 5 });
    expect(getToothPerio(11).gm).toEqual({});
    expect(getPlaqueIndex(11, "mesial")).toBe(0);
  });

  it("is per-chart state, like every other per-tooth axis", () => {
    setAssessmentStatus(16, "pd", "DB", "unmeasurable");
    setChartMode("plan");
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("unmeasurable"); // cloned from status
    setAssessmentStatus(16, "pd", "DB", "not-applicable");
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("not-applicable");
    setChartMode("status");
    expect(getAssessmentStatus(16, "pd", "DB")).toBe("unmeasurable");
  });
});
