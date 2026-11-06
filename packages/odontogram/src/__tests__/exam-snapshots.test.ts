// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-2vd, AC1/AC4: a document can carry several dated examinations,
// each an INDEPENDENT snapshot. Status and plan keep meaning current-versus-
// proposed and are never repurposed as history.

import { describe, it, expect, beforeEach } from "vitest";
import {
  captureExamination,
  startExamination,
  listExaminations,
  getExamination,
  removeExamination,
  loadExamination,
  getExaminationContext,
  setExaminationContext,
  setPerioSite,
  getToothPerio,
  setChartMode,
  getChartMode,
  getPlanChanges,
  setCaseAge,
  getCaseMeta,
  __setEdentulousForTest,
  getStatusChart,
  __resetChartStateForTest,
  __collectExportPayloadForTest,
  __hydrateImportedChartsForTest,
} from "../odontogram";

beforeEach(() => __resetChartStateForTest());

describe("dated examination snapshots", () => {
  it("captures the current findings under a generated, unique identity", () => {
    setPerioSite(16, "MB", { pd: 4 });
    const first = captureExamination({ effectiveDateTime: "2026-01-12" });
    setPerioSite(16, "MB", { pd: 7 });
    const second = captureExamination({ effectiveDateTime: "2026-06-30" });
    expect(first).not.toBe(second);
    const listed = listExaminations();
    expect(listed.map((e) => e.id)).toEqual([first, second]);
    expect(listed.map((e) => e.effectiveDateTime)).toEqual(["2026-01-12", "2026-06-30"]);
  });

  it("files a follow-up rather than overwriting the archived examination", () => {
    const first = captureExamination({ effectiveDateTime: "2026-01-12" });
    const second = captureExamination({ effectiveDateTime: "2026-06-30" });
    expect(listExaminations()).toHaveLength(2);
    expect(getExamination(second)!.examination.previousExaminationId).toBe(first);
  });

  it("corrects an archived examination only when its id is given explicitly", () => {
    setPerioSite(16, "MB", { pd: 4 });
    const id = captureExamination({ id: "exam-a", effectiveDateTime: "2026-01-12" });
    setPerioSite(16, "MB", { pd: 5 }); // the 4 was a mis-read
    captureExamination({ id, effectiveDateTime: "2026-01-12" });
    expect(listExaminations()).toHaveLength(1);
    expect(getExamination(id)!.teeth["16"].perio!.pd).toEqual({ MB: 5 });
  });

  it("honours a caller-supplied examination identity", () => {
    const id = captureExamination({ id: "exam-2026-01-12", effectiveDateTime: "2026-01-12", performer: "Practitioner/x" });
    expect(id).toBe("exam-2026-01-12");
    expect(getExaminationContext().id).toBe("exam-2026-01-12");
    expect(listExaminations()[0].performer).toBe("Practitioner/x");
  });

  it("keeps each snapshot independent of later edits", () => {
    setPerioSite(16, "MB", { pd: 4 });
    const first = captureExamination({ effectiveDateTime: "2026-01-12" });
    setPerioSite(16, "MB", { pd: 9 });
    setPerioSite(16, "B", { pd: 5 });
    const snap = getExamination(first);
    expect(snap!.teeth["16"].perio!.pd).toEqual({ MB: 4 });
    // ... and reading a snapshot never hands out live state.
    (snap!.teeth["16"].perio!.pd as Record<string, number>).MB = 99;
    expect(getExamination(first)!.teeth["16"].perio!.pd).toEqual({ MB: 4 });
    expect(getToothPerio(16).pd).toEqual({ MB: 9, B: 5 });
  });

  it("carries the case context of the moment it was captured", () => {
    setCaseAge(40);
    const first = captureExamination({ effectiveDateTime: "2026-01-12" });
    setCaseAge(41);
    expect(getExamination(first)!.case!.age).toBe(40);
    expect(getCaseMeta().age).toBe(41);
  });

  it("captures the STATUS chart even while plan mode is active", () => {
    setPerioSite(16, "MB", { pd: 4 });
    setChartMode("plan");
    setPerioSite(16, "MB", { pd: 8 }); // a PROPOSED value, not an observed one
    const id = captureExamination({ effectiveDateTime: "2026-01-12" });
    expect(getExamination(id)!.teeth["16"].perio!.pd).toEqual({ MB: 4 });
    // A snapshot is observed findings only — it never carries a plan.
    expect(Object.prototype.hasOwnProperty.call(getExamination(id)!, "plan")).toBe(false);
    // ... and capturing changed neither the active chart nor the plan the user
    // is still working on: the proposed 8 is still there, as a plan change.
    expect(getChartMode()).toBe("plan");
    expect(getPlanChanges().some((c) => c.toothNo === 16 && c.axis === "perio")).toBe(true);
  });

  it("captures the whole-mouth edentulous finding, not only the teeth", () => {
    __setEdentulousForTest(true);
    const id = captureExamination({ effectiveDateTime: "2026-01-12" });
    expect(getExamination(id)!.globals.edentulous).toBe(true);
    __setEdentulousForTest(false);
    expect(getStatusChart().globals.edentulous).toBe(false);
    loadExamination(id);
    expect(getStatusChart().globals.edentulous).toBe(true);
  });

  it("capturing does not initialize or disturb the plan chart", () => {
    setPerioSite(16, "MB", { pd: 4 });
    captureExamination({ effectiveDateTime: "2026-01-12" });
    expect(getPlanChanges()).toEqual([]); // plan still uninitialized
    expect(getChartMode()).toBe("status");
  });

  it("startExamination links the new examination to the previous one", () => {
    const first = captureExamination({ effectiveDateTime: "2026-01-12" });
    startExamination({ id: "exam-2026-06-30", effectiveDateTime: "2026-06-30" });
    const ctx = getExaminationContext();
    expect(ctx.id).toBe("exam-2026-06-30");
    expect(ctx.effectiveDateTime).toBe("2026-06-30");
    expect(ctx.previousExaminationId).toBe(first);
    // The findings themselves are untouched — a follow-up starts from reality.
    expect(listExaminations()).toHaveLength(1);
  });

  it("loads an archived examination back into the status chart without consuming it", () => {
    setPerioSite(16, "MB", { pd: 4 });
    const first = captureExamination({ id: "exam-a", effectiveDateTime: "2026-01-12" });
    setPerioSite(16, "MB", { pd: 9 });
    captureExamination({ id: "exam-b", effectiveDateTime: "2026-06-30" });

    expect(loadExamination(first)).toBe(true);
    expect(getToothPerio(16).pd).toEqual({ MB: 4 });
    expect(getExaminationContext().id).toBe("exam-a");
    // Both snapshots survive the load, unchanged.
    expect(listExaminations().map((e) => e.id)).toEqual(["exam-a", "exam-b"]);
    expect(getExamination("exam-b")!.teeth["16"].perio!.pd).toEqual({ MB: 9 });
    expect(loadExamination("nope")).toBe(false);
  });

  it("removes an archived examination by id", () => {
    const first = captureExamination({ effectiveDateTime: "2026-01-12" });
    expect(removeExamination("unknown")).toBe(false);
    expect(removeExamination(first)).toBe(true);
    expect(listExaminations()).toEqual([]);
  });

  it("serializes omit-when-empty and round-trips through hydrate", () => {
    expect(Object.prototype.hasOwnProperty.call(__collectExportPayloadForTest(), "examinations")).toBe(false);
    setPerioSite(16, "MB", { pd: 4 });
    captureExamination({ id: "exam-a", effectiveDateTime: "2026-01-12" });
    const json = JSON.parse(JSON.stringify(__collectExportPayloadForTest()));
    expect(json.examinations).toHaveLength(1);
    expect(json.examinations[0].examination.id).toBe("exam-a");

    __resetChartStateForTest();
    expect(listExaminations()).toEqual([]);
    __hydrateImportedChartsForTest(json);
    expect(listExaminations().map((e) => e.id)).toEqual(["exam-a"]);
    expect(getExamination("exam-a")!.teeth["16"].perio!.pd).toEqual({ MB: 4 });
  });

  it("a legacy document hydrates with no archived examinations and clears stale ones", () => {
    captureExamination({ id: "exam-a", effectiveDateTime: "2026-01-12" });
    __hydrateImportedChartsForTest({ version: "2.20", globals: {}, teeth: {} });
    expect(listExaminations()).toEqual([]);
  });

  it("hydrate drops malformed archive entries instead of throwing", () => {
    __hydrateImportedChartsForTest({
      version: "2.21", globals: {}, teeth: {},
      examinations: [
        null,
        { examination: { id: "exam-ok", effectiveDateTime: "2026-01-12" }, teeth: { "16": { perio: { pd: { MB: 3 } } } } },
        { teeth: {} }, // no identity at all -> unusable
        "nonsense",
      ],
    });
    expect(listExaminations().map((e) => e.id)).toEqual(["exam-ok"]);
  });

  it("keeps a snapshot's identity distinct from the live examination context", () => {
    setExaminationContext({ id: "exam-live", performer: "Practitioner/a" });
    const id = captureExamination({});
    expect(id).toBe("exam-live");
    setExaminationContext({ performer: "Practitioner/b" });
    expect(getExamination("exam-live")!.examination.performer).toBe("Practitioner/a");
    expect(getExaminationContext().performer).toBe("Practitioner/b");
  });
});
