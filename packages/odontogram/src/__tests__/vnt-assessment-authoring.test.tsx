// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-vnt, AC1: the per-tooth periodontal assessment status
// introduced by odontogram-2vd is AUTHORABLE from the periodontal UI, and the
// authored value lands in the exported document.
//
// The assessment rows are opt-in (a session-level `perioAssessmentMode` flag,
// off by default, mirroring the UI-2 row-visibility precedent), so the default
// perio chart renders exactly as before this bead. PerioChart is rendered
// directly (not via <App/>) — the same precedent as perio-p2-grid.test.ts and
// ui2-row-visibility.test.ts; the tooth-row graphic's template fetch fails
// harmlessly in jsdom and is caught.
import { PAYLOAD_VERSION } from "../document";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, act } from "@testing-library/react";
import PerioChart from "../PerioChart";
import {
  __resetChartStateForTest,
  __setToothStateForTest,
  __collectExportPayloadForTest,
  getAssessmentStatus,
  getToothAssessments,
  getPerioAssessmentMode,
  setPerioAssessmentMode,
  setNumberingSystem,
} from "../odontogram";

function openGrid() {
  return render(createElement(PerioChart, { open: true, onClose: () => {} }));
}

/** The assessment cycle button for one measurement point. */
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
  setPerioAssessmentMode(false);
});

afterEach(() => {
  cleanup();
  // Module-level session flag: restore the default so this file never leaks
  // into another test file sharing the same module instance.
  setPerioAssessmentMode(false);
});

describe("odontogram-vnt AC1: assessment rows are opt-in", () => {
  it("defaults to off and renders no assessment control", () => {
    expect(getPerioAssessmentMode()).toBe(false);
    openGrid();
    expect(document.querySelectorAll(".perio-fullgrid-assess").length).toBe(0);
  });

  it("the header toggle turns the rows on and back off", () => {
    openGrid();
    const toggle = document.getElementById("perioAssessmentToggle") as HTMLInputElement;
    expect(toggle).toBeTruthy();
    expect(toggle.checked).toBe(false);

    click(toggle);
    expect(getPerioAssessmentMode()).toBe(true);
    expect(document.querySelectorAll(".perio-fullgrid-assess").length).toBeGreaterThan(0);
    expect(assessBtn(16, "pd", "MB")).toBeTruthy();

    click(toggle);
    expect(getPerioAssessmentMode()).toBe(false);
    expect(document.querySelectorAll(".perio-fullgrid-assess").length).toBe(0);
  });
});

describe("odontogram-vnt AC1: authoring each status through the UI", () => {
  beforeEach(() => {
    setPerioAssessmentMode(true);
  });

  it("cycles one site through assessed -> unmeasurable -> not-applicable -> cleared", () => {
    openGrid();
    const btn = assessBtn(16, "pd", "MB")!;
    expect(btn.dataset.assessmentStatus).toBe("not-assessed");

    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("assessed");
    expect(btn.dataset.assessmentStatus).toBe("assessed");
    expect(btn.getAttribute("aria-pressed")).toBe("true");

    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("unmeasurable");
    expect(btn.dataset.assessmentStatus).toBe("unmeasurable");

    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("not-applicable");

    click(btn);
    expect(getAssessmentStatus(16, "pd", "MB")).toBe("not-assessed");
    expect(getToothAssessments(16)).toEqual({});
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("the authored status reaches the exported document, payload version unchanged", () => {
    openGrid();
    click(assessBtn(16, "bop", "MB")!); // assessed-normal: probed, did not bleed
    click(assessBtn(16, "pd", "DB")!);
    click(assessBtn(16, "pd", "DB")!); // unmeasurable

    const payload = __collectExportPayloadForTest();
    expect(payload.version).toBe(PAYLOAD_VERSION);
    expect(payload.teeth["16"].assessment).toEqual({
      "bop:MB": "assessed",
      "pd:DB": "unmeasurable",
    });
  });

  it("authors every axis kind: per-site, per-surface, per-entrance and per-tooth", () => {
    openGrid();
    click(assessBtn(16, "gm", "ML")!); // site (palatal aspect row)
    click(assessBtn(16, "plaque", "buccal")!); // surface
    click(assessBtn(16, "furcation", "buccal")!); // entrance (upper molar)
    click(assessBtn(16, "mobility", null)!); // whole tooth
    click(assessBtn(16, "kg", null)!); // whole tooth

    expect(getToothAssessments(16)).toEqual({
      "gm:ML": "assessed",
      "plaque:buccal": "assessed",
      "furcation:buccal": "assessed",
      mobility: "assessed",
      kg: "assessed",
    });
  });

  it("authors the peri-implant Mombelli axes on an implant tooth", () => {
    __setToothStateForTest(46, { toothSelection: "implant" });
    openGrid();
    click(assessBtn(46, "mpi", "buccal")!);
    click(assessBtn(46, "mbi", "buccal")!);
    click(assessBtn(46, "mbi", "buccal")!);
    expect(getToothAssessments(46)).toEqual({
      "mpi:buccal": "assessed",
      "mbi:buccal": "unmeasurable",
    });
  });

  it("a charted measurement is its own evidence — the control is locked, not contradictable", () => {
    __setToothStateForTest(16, {});
    openGrid();
    const btn = assessBtn(16, "pd", "MB")!;
    expect(btn.disabled).toBe(false);

    const input = document.getElementById("perio-fg-pd-16-MB") as HTMLInputElement;
    input.value = "5";
    act(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(getAssessmentStatus(16, "pd", "MB")).toBe("assessed");
    expect(btn.dataset.assessmentStatus).toBe("assessed");
    expect(btn.disabled).toBe(true);
  });
});
