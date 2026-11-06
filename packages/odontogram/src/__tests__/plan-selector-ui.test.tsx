// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger 2026
//
// Planalternativen (Phase 1): the PlanSelector in the real shell, no mocks.
// It must appear only in plan mode, list every alternative as a chip with the
// active one marked, add a fresh one on "+", switch on click, and vanish again
// in status mode. Everything it does runs through the engine API, so the
// module tests (plan-alternatives.test.ts) already pin the model; this pins
// the wiring and the re-render on state change.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import { __resetChartStateForTest } from "../odontogram";

beforeEach(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false, media: query, onchange: null,
        addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
      }),
    });
  }
  if (!("ResizeObserver" in window)) {
    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: class { observe() {} unobserve() {} disconnect() {} },
    });
  }
});

afterEach(async () => {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  cleanup();
  __resetChartStateForTest();
});

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const chipNames = () => Array.from(document.querySelectorAll("#planSelector .plan-chip-name")).map((e) => e.textContent);
const activeName = () => q("#planSelector .plan-chip.is-active .plan-chip-name")?.textContent ?? null;

describe("PlanSelector in der Shell", () => {
  it("nur im Plan-Modus; + legt an und aktiviert; Klick wechselt; Status blendet aus", async () => {
    render(<OdontogramShell />);
    await waitFor(() => {
      expect(document.querySelectorAll("#toothGrid .tooth-tile.side-view").length).toBeGreaterThan(0);
    }, { timeout: 30000 });

    expect(q("#planSelector")).toBeNull();                        // Status: nichts zu waehlen

    await act(async () => { q("#chartModePlan")!.click(); });
    expect(q("#planSelector")).not.toBeNull();
    expect(chipNames()).toEqual(["Plan 1"]);                       // Lazy-Init = erste Alternative
    expect(activeName()).toBe("Plan 1");

    await act(async () => { q("#planSelector .plan-chip-add")!.click(); });
    expect(chipNames()).toEqual(["Plan 1", "Plan 2"]);
    expect(activeName()).toBe("Plan 2");                           // neue ist aktiv

    await act(async () => { (document.querySelectorAll("#planSelector .plan-chip-name")[0] as HTMLElement).click(); });
    expect(activeName()).toBe("Plan 1");                           // Klick wechselt zurueck

    await act(async () => { q("#chartModeStatus")!.click(); });
    expect(q("#planSelector")).toBeNull();                         // Status: wieder weg
  }, 90000);
});
