// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026

import { describe, it, expect } from "vitest";
import { svgCases, payloadCases } from "./matrix";

describe("parity matrix", () => {
  it("covers many cases across every template, deterministically", () => {
    const a = svgCases(); const b = svgCases();
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(200);
    // Nine side-view templates (11/12/13/14/15/16/17/31/46) plus the two
    // occlusal templates.
    expect(new Set(a.map(c => c.template)).size).toBe(11);
  });
  it("payload cases include empty, edentulous, mixed, branches", () => {
    expect(payloadCases().map(p => p.name)).toEqual(["empty", "edentulous", "mixed", "branches"]);
  });
});
