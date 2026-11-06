// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-2vd, AC1: an odontogram document carries a stable examination
// identity, subject, effective time, performer/recorder, encounter and a link to
// the previous examination — while a legacy document (no `examination` key at
// all) still hydrates successfully.

import { PAYLOAD_VERSION } from "../document";
import { describe, it, expect, beforeEach } from "vitest";
import {
  getExaminationContext,
  setExaminationContext,
  resetExaminationContext,
  __resetChartStateForTest,
  __collectExportPayloadForTest,
  __hydrateImportedChartsForTest,
  getCaseMeta,
} from "../odontogram";

beforeEach(() => __resetChartStateForTest());

describe("examination context", () => {
  it("defaults to a fully uncharted context", () => {
    const c = getExaminationContext();
    expect(c.id).toBeNull();
    expect(c.subject).toBeNull();
    expect(c.effectiveDateTime).toBeNull();
    expect(c.performer).toBeNull();
    expect(c.recorder).toBeNull();
    expect(c.encounter).toBeNull();
    expect(c.previousExaminationId).toBeNull();
  });

  it("sets identity fields, trimming and null-clearing like every case field", () => {
    setExaminationContext({ id: "  exam-2026-03-01  ", subject: "Patient/17" });
    expect(getExaminationContext().id).toBe("exam-2026-03-01");
    expect(getExaminationContext().subject).toBe("Patient/17");
    setExaminationContext({ subject: "   " });
    expect(getExaminationContext().subject).toBeNull();
    setExaminationContext({ id: null });
    expect(getExaminationContext().id).toBeNull();
  });

  it("accepts a date or a date-time as the effective time and rejects malformed input", () => {
    setExaminationContext({ effectiveDateTime: "2026-03-01" });
    expect(getExaminationContext().effectiveDateTime).toBe("2026-03-01");
    setExaminationContext({ effectiveDateTime: "2026-03-01T09:30:00Z" });
    expect(getExaminationContext().effectiveDateTime).toBe("2026-03-01T09:30:00Z");
    setExaminationContext({ effectiveDateTime: "01.03.2026" }); // malformed -> no-op
    expect(getExaminationContext().effectiveDateTime).toBe("2026-03-01T09:30:00Z");
    setExaminationContext({ effectiveDateTime: null });
    expect(getExaminationContext().effectiveDateTime).toBeNull();
  });

  it("records performer, recorder, encounter and the previous-examination link", () => {
    setExaminationContext({
      performer: "Practitioner/dr-mueller",
      recorder: "Practitioner/assistant-4",
      encounter: "Encounter/9912",
      previousExaminationId: "exam-2025-09-14",
    });
    const c = getExaminationContext();
    expect(c.performer).toBe("Practitioner/dr-mueller");
    expect(c.recorder).toBe("Practitioner/assistant-4");
    expect(c.encounter).toBe("Encounter/9912");
    expect(c.previousExaminationId).toBe("exam-2025-09-14");
  });

  it("serializes omit-when-empty under the top-level `examination` key at payload 2.21", () => {
    const empty = __collectExportPayloadForTest();
    expect(empty.version).toBe(PAYLOAD_VERSION);
    expect(Object.prototype.hasOwnProperty.call(empty, "examination")).toBe(false);
    setExaminationContext({ id: "exam-1", effectiveDateTime: "2026-03-01" });
    const p = __collectExportPayloadForTest();
    expect(p.examination).toEqual({ id: "exam-1", effectiveDateTime: "2026-03-01" });
  });

  it("round-trips through hydrate", () => {
    setExaminationContext({
      id: "exam-1", subject: "Patient/17", effectiveDateTime: "2026-03-01T08:00:00Z",
      performer: "Practitioner/dr-mueller", encounter: "Encounter/9912",
    });
    const json = JSON.parse(JSON.stringify(__collectExportPayloadForTest()));
    __resetChartStateForTest();
    expect(getExaminationContext().id).toBeNull();
    __hydrateImportedChartsForTest(json);
    const c = getExaminationContext();
    expect(c.id).toBe("exam-1");
    expect(c.subject).toBe("Patient/17");
    expect(c.effectiveDateTime).toBe("2026-03-01T08:00:00Z");
    expect(c.performer).toBe("Practitioner/dr-mueller");
    expect(c.encounter).toBe("Encounter/9912");
  });

  it("hydrates a LEGACY document with no examination key and clears any prior context", () => {
    setExaminationContext({ id: "stale-exam", performer: "Practitioner/old" });
    // A pre-2.21 document: no `examination` key at all.
    __hydrateImportedChartsForTest({ version: "2.20", globals: {}, teeth: {} });
    const c = getExaminationContext();
    expect(c.id).toBeNull();
    expect(c.performer).toBeNull();
    // ... and the rest of the case still hydrates.
    expect(getCaseMeta().age).toBeNull();
  });

  it("hydrate self-heals malformed examination values", () => {
    __hydrateImportedChartsForTest({
      version: "2.21", globals: {}, teeth: {},
      examination: { id: 42, effectiveDateTime: "yesterday", performer: "  Practitioner/x  " },
    });
    const c = getExaminationContext();
    expect(c.id).toBeNull();
    expect(c.effectiveDateTime).toBeNull();
    expect(c.performer).toBe("Practitioner/x");
  });

  it("resetExaminationContext clears everything", () => {
    setExaminationContext({ id: "exam-1" });
    resetExaminationContext();
    expect(getExaminationContext().id).toBeNull();
  });
});
