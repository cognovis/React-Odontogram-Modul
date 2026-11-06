// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-082 / AC2: setChartMode on an OdontogramSession drives the
// mounted shell the same way the toolbar does, and an inactive session records
// the mode until it next owns the engine.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import {
  createOdontogramSession,
  __resetChartStateForTest,
  type OdontogramDocument,
} from "../odontogram";

function blankDoc(): OdontogramDocument {
  return { version: "2.46", globals: {}, teeth: {} };
}

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

const FRIST = 30000;

function expectPlanToggle(active: boolean): void {
  const planBtn = document.querySelector("#chartModePlan");
  const statusBtn = document.querySelector("#chartModeStatus");
  const chartCard = document.querySelector(".chart");
  expect(planBtn).not.toBeNull();
  expect(statusBtn).not.toBeNull();
  expect(chartCard).not.toBeNull();
  expect(planBtn!.classList.contains("is-active")).toBe(active);
  expect(planBtn!.getAttribute("aria-selected")).toBe(String(active));
  expect(statusBtn!.classList.contains("is-active")).toBe(!active);
  expect(statusBtn!.getAttribute("aria-selected")).toBe(String(!active));
  expect(chartCard!.classList.contains("plan-mode")).toBe(active);
}

describe("odontogram-082 AC2: session setChartMode and the mounted shell", () => {
  beforeEach(() => {
    __resetChartStateForTest();
  });

  afterEach(async () => {
    if (document.querySelector("#toothGrid")) {
      await waitFor(() => {
        expect(document.querySelectorAll("#toothGrid .tooth-tile").length).toBeGreaterThan(0);
      }, { timeout: 4000 });
    }
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    cleanup();
  }, FRIST);

  it("setChartMode('plan') on the active session switches the shell like the toolbar", async () => {
    const session = createOdontogramSession(blankDoc());
    const { container } = render(<OdontogramShell session={session} />);

    await waitFor(() => {
      expect(container.querySelector("#chartModeToggle")).not.toBeNull();
      expect(container.querySelectorAll("#toothGrid .tooth-tile").length).toBeGreaterThan(0);
    });

    expect(session.isActive()).toBe(true);
    expect(session.getChartMode()).toBe("status");
    expectPlanToggle(false);

    await act(async () => {
      session.setChartMode("plan");
    });

    expect(session.getChartMode()).toBe("plan");
    expectPlanToggle(true);

    const planBtn = container.querySelector("#chartModePlan") as HTMLButtonElement;
    await act(async () => {
      planBtn.click();
    });
    expect(session.getChartMode()).toBe("plan");
    expectPlanToggle(true);

    await act(async () => {
      session.setChartMode("status");
    });
    expect(session.getChartMode()).toBe("status");
    expectPlanToggle(false);
  }, FRIST);

  it("setChartMode('plan') on an inactive session is shown after the next activation", async () => {
    const sessionA = createOdontogramSession(blankDoc());
    const sessionB = createOdontogramSession(blankDoc());

    sessionB.setChartMode("plan");
    expect(sessionB.isActive()).toBe(false);
    expect(sessionB.getChartMode()).toBe("plan");

    const { container, rerender } = render(
      <>
        <OdontogramShell key="a" session={sessionA} />
        <OdontogramShell key="b" session={sessionB} />
      </>,
    );

    await waitFor(() => {
      expect(container.querySelector("#chartModeToggle")).not.toBeNull();
    });

    expect(sessionA.isActive()).toBe(true);
    expect(sessionA.getChartMode()).toBe("status");
    expectPlanToggle(false);

    rerender(<OdontogramShell key="b" session={sessionB} />);

    await waitFor(() => {
      expect(container.querySelector("[data-odontogram-inactive]")).toBeNull();
      expect(container.querySelector("#chartModeToggle")).not.toBeNull();
    });

    expect(sessionB.isActive()).toBe(true);
    expect(sessionB.getChartMode()).toBe("plan");
    expectPlanToggle(true);
  }, FRIST);

  it("mounted handover keeps getPlanChart globals identical for a sparse incoming document", async () => {
    const sessionA = createOdontogramSession({
      version: "2.46",
      globals: { wisdomVisible: false },
      teeth: {},
      plan: {
        "16": { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" },
      },
    });
    const sessionB = createOdontogramSession({
      version: "2.46",
      globals: {},
      teeth: {},
      plan: {
        "21": { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "emax" },
      },
    });

    render(<OdontogramShell session={sessionA} />);
    await waitFor(() => {
      expect(document.querySelector("#toothGrid")).not.toBeNull();
      expect(document.querySelectorAll("#toothGrid .tooth-tile").length).toBeGreaterThan(0);
    });

    const beforeB = sessionB.getPlanChart();
    expect(sessionB.isActive()).toBe(false);
    expect(beforeB.globals).toEqual({
      wisdomVisible: true,
      showBase: true,
      occlusalVisible: true,
      showHealthyPulp: true,
      edentulous: false,
    });
    expect(sessionA.getPlanChart().globals.wisdomVisible).toBe(false);

    await act(async () => {
      sessionB.activate();
    });

    expect(sessionB.isActive()).toBe(true);
    expect(document.querySelector("#toothGrid")).not.toBeNull();
    expect(sessionB.getPlanChart().globals).toEqual(beforeB.globals);
    expect(sessionB.getPlanChart().globals.wisdomVisible).toBe(true);
  }, FRIST);
});
