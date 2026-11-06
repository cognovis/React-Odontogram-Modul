// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-3l1 / AC2 (integration half): two mounted OdontogramShell
// instances initialize from their own UI-domain document and report changes
// independently. Proves the clinical state is per-instance, not a shared
// module singleton.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import OdontogramShell from "../App";
import {
  createOdontogramSession,
  __resetChartStateForTest,
  type OdontogramDocument,
} from "../odontogram";

function docWithMissing(toothNo: number): OdontogramDocument {
  return {
    version: "2.20",
    globals: {},
    teeth: { [String(toothNo)]: { toothSelection: "none" } },
  };
}

// jsdom implements neither matchMedia nor ResizeObserver; the real engine
// (deliberately NOT mocked here — instance isolation is what is under test)
// touches both while building the tooth grid.
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

// odontogram-xtj: diese Tests montieren je ZWEI Schalen und brauchen allein
// schon 3 bis 8 Sekunden. Unter der Last der vollen Suite reicht die Vorgabe
// von 5 s nicht mehr, und der Fehlschlag sagt dann nichts ueber die Sache aus,
// sondern nur ueber die Auslastung der Maschine. Deshalb eine ausdrueckliche
// Frist je Test, wie sie die neueren Montagetests hier ohnehin schon setzen.
const FRIST = 30000;

describe("odontogram-3l1 AC2: two mounted odontograms", () => {
  beforeEach(() => {
    __resetChartStateForTest();
  });
  // Bead odontogram-xtj. The engine mounts its tooth grid ASYNCHRONOUSLY — it
  // fetches a template per tooth — so a test that returns synchronously leaves
  // that work in flight, and its state updates land while the NEXT test is
  // running. That is what the "not wrapped in act(...)" wall in this file was,
  // and it explains the shape of the flake exactly: the LAST test here failed
  // under full-suite load and passed alone, because alone it inherits nothing.
  //
  // Letting the pending work settle INSIDE act before unmounting costs a tick
  // and weakens no assertion. It is the isolation the file always needed, not
  // a wait bolted onto the assertion that happened to fail.
  afterEach(async () => {
    // Wait for the real signal rather than a guessed number of milliseconds:
    // the grid has its tiles once every template has arrived, and that is
    // precisely when the in-flight updates stop coming.
    if(document.querySelector("#toothGrid")){
      await waitFor(() => {
        expect(document.querySelectorAll("#toothGrid .tooth-tile").length).toBeGreaterThan(0);
      }, { timeout: 4000 });
    }
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    cleanup();
  }, FRIST);

  it("initializes each instance from its own document", async () => {
    const sessionA = createOdontogramSession(docWithMissing(11));
    const sessionB = createOdontogramSession(docWithMissing(46));

    render(
      <>
        <OdontogramShell session={sessionA} />
        <OdontogramShell session={sessionB} />
      </>,
    );

    expect(sessionA.getDocument().teeth["11"].toothSelection).toBe("none");
    expect(sessionB.getDocument().teeth["11"]?.toothSelection ?? "tooth-base").not.toBe("none");
    expect(sessionB.getDocument().teeth["46"].toothSelection).toBe("none");
    expect(sessionA.getDocument().teeth["46"]?.toothSelection ?? "tooth-base").not.toBe("none");
  }, FRIST);

  it("reports document changes per instance", () => {
    const sessionA = createOdontogramSession();
    const sessionB = createOdontogramSession();
    const onA = vi.fn();
    const onB = vi.fn();

    render(
      <>
        <OdontogramShell session={sessionA} onDocumentChange={onA} />
        <OdontogramShell session={sessionB} onDocumentChange={onB} />
      </>,
    );

    onA.mockClear();
    onB.mockClear();

    sessionA.setDocument(docWithMissing(11));

    // A hears its own change...
    expect(onA).toHaveBeenCalled();
    const doc = onA.mock.calls[onA.mock.calls.length - 1][0] as OdontogramDocument;
    expect(doc.teeth["11"].toothSelection).toBe("none");
    // ...and B never sees A's clinical content, whatever else notifies it.
    for (const call of onB.mock.calls) {
      const seen = call[0] as OdontogramDocument;
      expect(seen.teeth["11"]?.toothSelection ?? "tooth-base").not.toBe("none");
    }
    expect(sessionB.getDocument().teeth["11"]?.toothSelection ?? "tooth-base").not.toBe("none");
  }, FRIST);

  it("accepts a plain document prop and creates an owned session for that instance", () => {
    const onA = vi.fn();
    const onB = vi.fn();

    const { rerender } = render(
      <>
        <OdontogramShell document={docWithMissing(11)} onDocumentChange={onA} />
        <OdontogramShell document={docWithMissing(46)} onDocumentChange={onB} />
      </>,
    );

    onA.mockClear();
    onB.mockClear();

    // Replacing instance A's document must notify A only.
    rerender(
      <>
        <OdontogramShell document={docWithMissing(12)} onDocumentChange={onA} />
        <OdontogramShell document={docWithMissing(46)} onDocumentChange={onB} />
      </>,
    );

    expect(onA).toHaveBeenCalled();
    const doc = onA.mock.calls[onA.mock.calls.length - 1][0] as OdontogramDocument;
    expect(doc.teeth["12"].toothSelection).toBe("none");
    expect(doc.teeth["46"]?.toothSelection ?? "tooth-base").not.toBe("none");
    // Instance B's document never picks up A's replacement.
    for (const call of onB.mock.calls) {
      const seen = call[0] as OdontogramDocument;
      expect(seen.teeth["12"]?.toothSelection ?? "tooth-base").not.toBe("none");
    }
  }, FRIST);

  it("leaves the module-singleton entry points untouched when no session/document prop is given", () => {
    const { container } = render(<OdontogramShell />);
    // Standalone mode still runs on the default session and still renders the
    // editor: a single instance always owns the engine.
    expect(container.querySelector("#toothGrid")).not.toBeNull();
    expect(container.querySelector("[data-odontogram-inactive]")).toBeNull();
  }, FRIST);

  it("renders the engine-bound DOM ids exactly once across two mounted instances", () => {
    const sessionA = createOdontogramSession(docWithMissing(11));
    const sessionB = createOdontogramSession(docWithMissing(46));

    const { container } = render(
      <>
        <OdontogramShell session={sessionA} />
        <OdontogramShell session={sessionB} />
      </>,
    );

    // The engine resolves its ids globally; a duplicate would let a non-owning
    // instance display the owner's session data under its own heading.
    for (const id of ["toothGrid", "chartModeToggle", "activeToothLabel"]) {
      expect(container.querySelectorAll(`#${id}`).length, `duplicate #${id}`).toBeLessThanOrEqual(1);
    }
    expect(container.querySelectorAll("[data-odontogram-inactive]").length).toBe(1);
  }, FRIST);

  it("hands the engine to the surviving instance when the owner unmounts", async () => {
    const sessionA = createOdontogramSession(docWithMissing(11));
    const sessionB = createOdontogramSession(docWithMissing(46));

    const { container, rerender } = render(
      <>
        <OdontogramShell key="a" session={sessionA} />
        <OdontogramShell key="b" session={sessionB} />
      </>,
    );
    expect(container.querySelectorAll("[data-odontogram-inactive]").length).toBe(1);

    // Unmount the owner; the waiting instance must take over rather than be
    // left with a torn-down engine.
    rerender(<OdontogramShell key="b" session={sessionB} />);
    await waitFor(() => {
      expect(container.querySelector("[data-odontogram-inactive]")).toBeNull();
    });
    expect(container.querySelector("#toothGrid")).not.toBeNull();
    expect(sessionB.getDocument().teeth["46"].toothSelection).toBe("none");
  }, FRIST);
});
