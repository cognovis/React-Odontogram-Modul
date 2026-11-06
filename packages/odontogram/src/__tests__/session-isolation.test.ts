// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-3l1 / AC2 (unit half): the explicit UI-domain document
// contract and instance isolation of the previously module-singleton clinical
// state. A host initializes and observes an odontogram through an
// `OdontogramSession`; two sessions never share clinical state.

import { describe, it, expect, beforeEach } from "vitest";
import {
  createOdontogramSession,
  getDefaultOdontogramSession,
  getActiveOdontogramSession,
  __resetChartStateForTest,
  type OdontogramDocument,
  type OdontogramSession,
} from "../odontogram";

function docWithMissing(toothNo: number): OdontogramDocument {
  return {
    version: "2.20",
    globals: {},
    teeth: { [String(toothNo)]: { toothSelection: "none" } },
  };
}

describe("odontogram-3l1 AC2: UI-domain document contract", () => {
  beforeEach(() => {
    __resetChartStateForTest();
  });

  it("exposes a default session that is the module's own clinical state", () => {
    const def = getDefaultOdontogramSession();
    expect(def).toBeTruthy();
    expect(getActiveOdontogramSession()).toBe(def);
    expect(def.isActive()).toBe(true);
  });

  it("createOdontogramSession returns a session with its own document", () => {
    const s = createOdontogramSession();
    expect(s).not.toBe(getDefaultOdontogramSession());
    const doc = s.getDocument();
    expect(doc).toHaveProperty("version");
    expect(doc).toHaveProperty("teeth");
    expect(s.isActive()).toBe(false);
  });

  it("seeds a session from an initial document", () => {
    const s = createOdontogramSession(docWithMissing(11));
    expect(s.getDocument().teeth["11"].toothSelection).toBe("none");
  });

  it("two sessions do not share clinical state", () => {
    const a: OdontogramSession = createOdontogramSession();
    const b: OdontogramSession = createOdontogramSession();

    a.setDocument(docWithMissing(11));

    expect(a.getDocument().teeth["11"].toothSelection).toBe("none");
    expect(b.getDocument().teeth["11"]?.toothSelection ?? "tooth-base").not.toBe("none");
  });

  it("a session edit never leaks into the default session", () => {
    const s = createOdontogramSession();
    s.setDocument(docWithMissing(26));

    const def = getDefaultOdontogramSession().getDocument();
    expect(def.teeth["26"]?.toothSelection ?? "tooth-base").not.toBe("none");
  });

  it("notifies only its own subscribers", () => {
    const a = createOdontogramSession();
    const b = createOdontogramSession();
    let aCount = 0;
    let bCount = 0;
    const offA = a.subscribe(() => { aCount += 1; });
    const offB = b.subscribe(() => { bCount += 1; });

    a.setDocument(docWithMissing(11));

    expect(aCount).toBe(1);
    expect(bCount).toBe(0);

    offA();
    offB();
    a.setDocument(docWithMissing(12));
    expect(aCount).toBe(1);
  });

  it("hands the subscriber the current document", () => {
    const s = createOdontogramSession();
    let seen: OdontogramDocument | null = null;
    s.subscribe((doc) => { seen = doc; });
    s.setDocument(docWithMissing(37));
    expect(seen).not.toBeNull();
    expect((seen as unknown as OdontogramDocument).teeth["37"].toothSelection).toBe("none");
  });

  it("getDocument returns a detached copy (mutating it does not alter the session)", () => {
    const s = createOdontogramSession(docWithMissing(11));
    const doc = s.getDocument();
    doc.teeth["11"].toothSelection = "implant";
    expect(s.getDocument().teeth["11"].toothSelection).toBe("none");
  });

  it("does not leak a whole-mouth clinical global between sessions", () => {
    // `edentulous` is a clinical finding about the whole mouth, not a view
    // flag, so it must travel with the session's document rather than stay
    // behind in the engine when a different session becomes live.
    const edentulousCase = createOdontogramSession({
      version: "2.20",
      globals: { edentulous: true },
      teeth: {},
    });
    const dentateCase = createOdontogramSession({
      version: "2.20",
      globals: { edentulous: false },
      teeth: {},
    });

    edentulousCase.activate();
    expect(edentulousCase.getDocument().globals?.edentulous).toBe(true);

    dentateCase.activate();
    expect(dentateCase.getDocument().globals?.edentulous).toBe(false);

    dentateCase.release();
    expect(edentulousCase.getDocument().globals?.edentulous).toBe(true);
    edentulousCase.release();
  });

  it("activating a session swaps the module's active clinical state and restores on release", () => {
    const def = getDefaultOdontogramSession();
    const s = createOdontogramSession(docWithMissing(11));

    s.activate();
    expect(getActiveOdontogramSession()).toBe(s);
    expect(s.isActive()).toBe(true);

    s.release();
    expect(getActiveOdontogramSession()).toBe(def);
    expect(s.isActive()).toBe(false);
  });
});

function docWithPlannedCrown(toothNo: number, material: "zircon" | "emax"): OdontogramDocument {
  return {
    version: "2.46",
    globals: {},
    teeth: {
      [String(toothNo)]: { toothSelection: "tooth-base", restorationType: "none" },
    },
    plan: {
      [String(toothNo)]: {
        toothSelection: "tooth-base",
        restorationType: "crown",
        restorationMaterial: material,
      },
    },
  };
}

function restorationChangeFor(session: OdontogramSession, toothNo: number) {
  return session.getPlanChanges().filter((change) => change.toothNo === toothNo && change.axis === "restoration");
}

describe("odontogram-082: session-bound plan chart and plan changes", () => {
  beforeEach(() => {
    __resetChartStateForTest();
  });

  it("two sessions return their own plan chart and plan changes regardless of engine ownership", () => {
    const a = createOdontogramSession(docWithPlannedCrown(16, "zircon"));
    const b = createOdontogramSession(docWithPlannedCrown(21, "emax"));

    const expectIsolated = () => {
      expect(a.getPlanChart().teeth["16"].restorationType).toBe("crown");
      expect(a.getPlanChart().teeth["16"].restorationMaterial).toBe("zircon");
      expect(a.getPlanChart().teeth["21"]?.restorationType ?? "none").toBe("none");
      expect(restorationChangeFor(a, 16)).toEqual([
        expect.objectContaining({ toothNo: 16, axis: "restoration" }),
      ]);
      expect(restorationChangeFor(a, 21)).toEqual([]);

      expect(b.getPlanChart().teeth["21"].restorationType).toBe("crown");
      expect(b.getPlanChart().teeth["21"].restorationMaterial).toBe("emax");
      expect(b.getPlanChart().teeth["16"]?.restorationType ?? "none").toBe("none");
      expect(restorationChangeFor(b, 21)).toEqual([
        expect.objectContaining({ toothNo: 21, axis: "restoration" }),
      ]);
      expect(restorationChangeFor(b, 16)).toEqual([]);
    };

    expect(a.isActive()).toBe(false);
    expect(b.isActive()).toBe(false);
    expectIsolated();

    a.activate();
    expect(a.isActive()).toBe(true);
    expect(b.isActive()).toBe(false);
    expectIsolated();

    b.activate();
    expect(a.isActive()).toBe(false);
    expect(b.isActive()).toBe(true);
    expectIsolated();

    b.release();
    expect(a.isActive()).toBe(true);
    expectIsolated();

    a.release();
    expect(a.isActive()).toBe(false);
    expect(b.isActive()).toBe(false);
    expectIsolated();
  });

  it("getPlanChart stays identical across activate for document globals and legacy caries", () => {
    const session = createOdontogramSession({
      version: "2.2",
      globals: { wisdomVisible: false },
      teeth: {
        "16": { toothSelection: "tooth-base" },
      },
      plan: {
        "16": {
          toothSelection: "tooth-base",
          restorationType: "crown",
          restorationMaterial: "zircon",
          caries: ["caries-occlusal"],
          fillingSurfaceMaterials: { occlusal: "composite" },
        },
      },
    });

    const before = session.getPlanChart();
    expect(session.isActive()).toBe(false);
    expect(before.globals.wisdomVisible).toBe(false);

    session.activate();
    const whileActive = session.getPlanChart();
    expect(session.isActive()).toBe(true);
    expect(whileActive).toEqual(before);
    expect(whileActive.globals.wisdomVisible).toBe(false);
    expect(whileActive.teeth["16"].cariesSeverity).toEqual(before.teeth["16"].cariesSeverity);

    session.release();
    const afterRelease = session.getPlanChart();
    expect(session.isActive()).toBe(false);
    expect(afterRelease).toEqual(before);
    expect(afterRelease.globals.wisdomVisible).toBe(false);
  });

  it("getPlanChart returns detached case and examination copies", () => {
    const session = createOdontogramSession({
      version: "2.46",
      globals: {},
      teeth: {},
      plan: {
        "16": { toothSelection: "tooth-base", restorationType: "crown", restorationMaterial: "zircon" },
      },
      case: { age: 54, patientName: "Ada Lovelace" },
      examination: { id: "exam-1", subject: "Patient/1" },
    });

    expect(session.isActive()).toBe(false);
    const first = session.getPlanChart();
    expect(first.case).toEqual({ age: 54, patientName: "Ada Lovelace" });
    expect(first.examination).toEqual({ id: "exam-1", subject: "Patient/1" });

    first.case.age = 99;
    first.case.patientName = "mutated";
    first.examination.id = "exam-mutated";
    first.examination.subject = "Patient/mutated";

    const second = session.getPlanChart();
    expect(second.case).toEqual({ age: 54, patientName: "Ada Lovelace" });
    expect(second.examination).toEqual({ id: "exam-1", subject: "Patient/1" });

    const doc = session.getDocument();
    expect(doc.case).toEqual({ age: 54, patientName: "Ada Lovelace" });
    expect(doc.examination).toEqual({ id: "exam-1", subject: "Patient/1" });
  });

  it("inactive getPlanChart does not mutate stored plan teeth or leak returned objects", () => {
    const session = createOdontogramSession({
      version: "1.4",
      globals: {},
      teeth: {},
      plan: {
        "16": {
          toothSelection: "tooth-base",
          crownMaterial: "zircon",
          customStates: { "demo-plugin": { lot: "A" } },
        },
      },
    } as OdontogramDocument);

    const storedTooth = session.getDocument().plan!["16"] as Record<string, unknown>;
    expect(storedTooth.restorationType).toBeUndefined();
    expect(storedTooth.crownMaterial).toBe("zircon");
    const customBefore = JSON.parse(JSON.stringify(storedTooth.customStates));

    const first = session.getPlanChart();
    expect(session.getDocument().plan!["16"]).toEqual({
      toothSelection: "tooth-base",
      crownMaterial: "zircon",
      customStates: { "demo-plugin": { lot: "A" } },
    });
    expect((session.getDocument().plan!["16"] as Record<string, unknown>).restorationType).toBeUndefined();
    expect((session.getDocument().plan!["16"] as Record<string, unknown>).customStates).toEqual(customBefore);

    first.teeth["16"].restorationType = "veneer";
    first.teeth["16"].customStates = { "demo-plugin": { lot: "mutated" } };
    if (first.teeth["16"].customStates && typeof first.teeth["16"].customStates === "object") {
      (first.teeth["16"].customStates as Record<string, unknown>).lot = "mutated";
    }

    const second = session.getPlanChart();
    expect(second.teeth["16"].restorationType).not.toBe("veneer");
    expect(second.teeth["16"].customStates ?? {}).not.toEqual({ "demo-plugin": { lot: "mutated" } });
    expect(session.getDocument().plan!["16"]).toEqual({
      toothSelection: "tooth-base",
      crownMaterial: "zircon",
      customStates: { "demo-plugin": { lot: "A" } },
    });
  });
});
