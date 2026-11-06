// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-vnt, AC2: the assessment controls honour the SAME gates every
// other periodontal control already honours — the global readOnly lock and the
// odontogram-2vd capability matrix (`perioAxisApplies`) — and adding an
// authoring surface changes nothing about hydration/import tolerance, which
// deliberately stays permissive (the matrix is enforced at the EDIT boundary,
// never at the document boundary).
import { PAYLOAD_VERSION } from "../document";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, act } from "@testing-library/react";
import PerioChart from "../PerioChart";
import {
  __resetChartStateForTest,
  __setToothStateForTest,
  __collectExportPayloadForTest,
  __hydrateImportedChartsForTest,
  getAssessmentStatus,
  getToothAssessments,
  setPerioAssessmentMode,
  setNumberingSystem,
  setReadOnly,
} from "../odontogram";

function openGrid() {
  return render(createElement(PerioChart, { open: true, onClose: () => {} }));
}

function assessBtn(toothNo: number, axis: string, qualifier: string | null): HTMLButtonElement | null {
  return document.getElementById(
    `perio-fg-assess-${toothNo}-${axis}-${qualifier ?? "tooth"}`,
  ) as HTMLButtonElement | null;
}

function click(el: HTMLElement): void {
  act(() => {
    el.click();
  });
}

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  __resetChartStateForTest();
  setNumberingSystem("FDI");
  setReadOnly(false);
  setPerioAssessmentMode(true);
});

afterEach(() => {
  cleanup();
  setReadOnly(false);
  setPerioAssessmentMode(false);
});

describe("odontogram-vnt AC2: readOnly", () => {
  it("locks every assessment control and writes nothing", () => {
    setReadOnly(true);
    openGrid();
    const btn = assessBtn(16, "pd", "MB")!;
    expect(btn.disabled).toBe(true);
    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("not-assessed");
    expect(getToothAssessments(16)).toEqual({});
  });

  it("is not a sticky lock — a chart built with readOnly released is authorable", () => {
    // The `disabled` attribute is decided per build/resync from `getReadOnly()`
    // (`syncToothCells`), exactly like every other periodontal control; a flip
    // while the chart is open reaches those same controls because `setReadOnly`
    // notifies (bead odontogram-v90) on top of toggling the live `.read-only`
    // class on the mounted perio container.
    setReadOnly(true);
    openGrid();
    cleanup();
    setReadOnly(false);
    openGrid();
    const btn = assessBtn(16, "pd", "MB")!;
    expect(btn.disabled).toBe(false);
    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("assessed");
  });

  it("refuses a write from an ALREADY-MOUNTED control the moment readOnly is set", () => {
    // Review fix (finding B1/A1): the domain gate, not CSS, is what stops the
    // write, so the handler refuses even if it is reached at all. Bead
    // odontogram-v90 then made `setReadOnly` notify, so the mounted control's
    // own `disabled` attribute is no longer stale after a live flip either —
    // both layers are asserted here.
    openGrid();
    const btn = assessBtn(16, "pd", "MB")!;
    act(() => {
      setReadOnly(true);
    });
    expect(document.getElementById("perioOverlay")!.classList.contains("read-only")).toBe(true);
    expect(btn.disabled).toBe(true);
    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("not-assessed");
    expect(getToothAssessments(16)).toEqual({});
  });
});

describe("odontogram-vnt AC2: the capability matrix", () => {
  it("disables every axis on a tooth with no periodontium", () => {
    __setToothStateForTest(21, { toothSelection: "none" }); // missing
    openGrid();
    for (const [axis, qualifier] of [["pd", "MB"], ["plaque", "buccal"], ["mobility", null], ["kg", null]] as const) {
      const btn = assessBtn(21, axis, qualifier)!;
      expect(btn.disabled).toBe(true);
    }
    click(assessBtn(21, "pd", "MB")!);
    expect(getToothAssessments(21)).toEqual({});
  });

  it("offers no furcation control where the position has no furcation entrance", () => {
    openGrid();
    expect(assessBtn(11, "furcation", "buccal")).toBeNull(); // an incisor
    expect(assessBtn(16, "furcation", "buccal")).toBeTruthy(); // an upper molar
  });

  it("disables the Mombelli axes on a natural tooth and the CEJ-bound axes on an implant", () => {
    __setToothStateForTest(46, { toothSelection: "implant" });
    openGrid();
    // The mPI/mBI rows exist in this arch (it has an implant) — but only the
    // implant's own cells are live.
    expect(assessBtn(46, "mpi", "buccal")!.disabled).toBe(false);
    expect(assessBtn(47, "mpi", "buccal")!.disabled).toBe(true);
    // An implant is probed like a natural tooth but has no CEJ, so no gingival
    // margin and no natural-tooth plaque index.
    expect(assessBtn(46, "pd", "MB")!.disabled).toBe(false);
    expect(assessBtn(46, "gm", "MB")!.disabled).toBe(true);
    expect(assessBtn(46, "plaque", "buccal")!.disabled).toBe(true);
    click(assessBtn(46, "gm", "MB")!);
    expect(getToothAssessments(46)).toEqual({});
  });
});

describe("odontogram-vnt AC2: hydration/import tolerance is unchanged", () => {
  it("hydrates a document with no assessment key at all", () => {
    __hydrateImportedChartsForTest({
      version: "2.20",
      globals: {},
      teeth: { "16": { toothSelection: "tooth-base" } },
    });
    expect(getToothAssessments(16)).toEqual({});
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("not-assessed");
  });

  it("keeps a foreign document's recorded status even where the matrix would refuse the edit", () => {
    __hydrateImportedChartsForTest({
      version: "2.21",
      globals: {},
      teeth: {
        "21": { toothSelection: "none", assessment: { "pd:MB": "unmeasurable" } },
        "16": { toothSelection: "tooth-base", assessment: { "pd:MB": "unmeasurable", "bogus:MB": "unmeasurable" } },
      },
    });
    // Stored as imported (tolerant), even though `perioAxisApplies` refuses a
    // missing tooth — serialization reports what is stored.
    expect(getToothAssessments(21)).toEqual({ "pd:MB": "unmeasurable" });
    // ...but resolution still answers from structure.
    expect(getAssessmentStatus(21, "pd", "MB")).toBe("not-applicable");
    // An unknown axis key is dropped, exactly as before this bead.
    expect(getToothAssessments(16)).toEqual({ "pd:MB": "unmeasurable" });

    const payload = __collectExportPayloadForTest();
    expect(payload.version).toBe(PAYLOAD_VERSION);
    expect(payload.teeth["21"].assessment).toEqual({ "pd:MB": "unmeasurable" });
  });
});
