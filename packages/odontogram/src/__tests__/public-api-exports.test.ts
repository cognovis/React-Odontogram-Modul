// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { describe, it, expect } from "vitest";
import {
  initOdontogram,
  destroyOdontogram,
  setNumberingSystem,
  getChartMode,
  setChartMode,
  getStatusChart,
  getPlanChart,
  setPlanChart,
  getPlanChanges,
  openPerioOverlay,
  closePerioOverlay,
  isPerioOverlayOpen,
  hasAnyPerioData,
  exportStatus,
  importStatus,
  createOdontogramSession,
} from "../App";

describe("public API exports — App.tsx re-exports", () => {
  it("exports lifecycle functions", () => {
    expect(initOdontogram).toBeDefined();
    expect(typeof initOdontogram).toBe("function");
    expect(destroyOdontogram).toBeDefined();
    expect(typeof destroyOdontogram).toBe("function");
  });

  it("exports chart-mode control functions", () => {
    expect(getChartMode).toBeDefined();
    expect(typeof getChartMode).toBe("function");
    expect(setChartMode).toBeDefined();
    expect(typeof setChartMode).toBe("function");
  });

  it("exports state serialization functions", () => {
    expect(getStatusChart).toBeDefined();
    expect(typeof getStatusChart).toBe("function");
    expect(getPlanChart).toBeDefined();
    expect(typeof getPlanChart).toBe("function");
    expect(setPlanChart).toBeDefined();
    expect(typeof setPlanChart).toBe("function");
  });

  it("exports plan-diff function", () => {
    expect(getPlanChanges).toBeDefined();
    expect(typeof getPlanChanges).toBe("function");
  });

  it("exposes session-bound chart mode and plan methods", () => {
    const session = createOdontogramSession();
    expect(typeof session.getChartMode).toBe("function");
    expect(typeof session.setChartMode).toBe("function");
    expect(typeof session.getPlanChart).toBe("function");
    expect(typeof session.getPlanChanges).toBe("function");
  });

  it("exports numbering system setter", () => {
    expect(setNumberingSystem).toBeDefined();
    expect(typeof setNumberingSystem).toBe("function");
  });

  it("exports perio overlay control functions", () => {
    expect(openPerioOverlay).toBeDefined();
    expect(typeof openPerioOverlay).toBe("function");
    expect(closePerioOverlay).toBeDefined();
    expect(typeof closePerioOverlay).toBe("function");
    expect(isPerioOverlayOpen).toBeDefined();
    expect(typeof isPerioOverlayOpen).toBe("function");
  });

  it("exports perio data presence check", () => {
    expect(hasAnyPerioData).toBeDefined();
    expect(typeof hasAnyPerioData).toBe("function");
  });

  it("exports JSON import/export functions", () => {
    expect(exportStatus).toBeDefined();
    expect(typeof exportStatus).toBe("function");
    expect(importStatus).toBeDefined();
    expect(typeof importStatus).toBe("function");
  });
});

// Bead odontogram-2vd: the examination-identity / snapshot / assessment API is
// part of the package's public surface, like the session contract before it.
describe("public API exports — examinations and assessment status", () => {
  it("exports the examination context and snapshot API", async () => {
    const api = await import("../App");
    for (const name of [
      "getExaminationContext", "setExaminationContext", "resetExaminationContext",
      "captureExamination", "startExamination", "listExaminations", "getExamination",
      "removeExamination", "loadExamination", "resetExaminations",
    ]) {
      expect(typeof (api as unknown as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("exports the assessment-status API", async () => {
    const api = await import("../App");
    for (const name of ["getAssessmentStatus", "setAssessmentStatus", "getToothAssessments", "perioAxisApplies"]) {
      expect(typeof (api as unknown as Record<string, unknown>)[name]).toBe("function");
    }
    expect(Array.isArray((api as unknown as Record<string, unknown>).PERIO_ASSESSMENT_AXES)).toBe(true);
  });
});
