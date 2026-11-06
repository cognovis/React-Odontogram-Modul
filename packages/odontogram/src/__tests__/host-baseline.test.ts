// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
//
// The document an embedding host must baseline.
//
// A host binds a stored document to a session and then mounts the shell, which
// activates it. Activation loads the live clinical state and notifies with its
// snapshot, and that snapshot always carries every tooth hydrated from its
// defaults. A host that baselines the STORED document therefore sees the
// activation itself as the user's first edit: the view opens dirty with
// Speichern enabled before anything is touched.
//
// `normalizeOdontogramDocument` is the engine's own normalisation and is what a
// host must compare against. This runs the real engine, not a stubbed shell, so
// it pins the actual equality the plugin adapter depends on.
import { describe, expect, it } from "vitest";
import {
  createOdontogramSession,
  normalizeOdontogramDocument,
  type OdontogramDocument,
} from "../odontogram";

const PAYLOAD_VERSION = 1;

/** What a gateway hands over for a patient with a single finding on 16. */
function storedDocument(): OdontogramDocument {
  return {
    version: PAYLOAD_VERSION,
    globals: {},
    teeth: {
      "16": { fillingSurfaces: ["occlusal"], fillingSurfaceMaterials: { occlusal: "composite" } },
    },
  } as unknown as OdontogramDocument;
}

describe("the host baseline of a stored document", () => {
  it("normalises a sparse stored document to every tooth", () => {
    const normalized = normalizeOdontogramDocument(storedDocument());
    expect(Object.keys(normalized.teeth)).toHaveLength(32);
    expect(Object.keys(normalized.teeth).length).toBeGreaterThan(
      Object.keys(storedDocument().teeth).length,
    );
  })

  it("keeps the stored clinical finding exactly", () => {
    const normalized = normalizeOdontogramDocument(storedDocument());
    expect(normalized.teeth["16"].fillingSurfaces).toEqual(["occlusal"]);
    expect(normalized.teeth["16"].fillingSurfaceMaterials).toEqual({ occlusal: "composite" });
  })

  it("is idempotent, so a reload cannot drift the baseline", () => {
    const once = normalizeOdontogramDocument(storedDocument());
    const twice = normalizeOdontogramDocument(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  })

  /**
   * The actual defect: the clinical content the live engine reports after
   * activation equals the normalised document and NOT the stored one, so only
   * the normalised document is a baseline that leaves a freshly opened chart
   * clean.
   *
   * `version` is deliberately excluded. Activation migrates a stored document
   * to the engine's current payload version, which is engine metadata and not
   * something the user changed, so a host comparing it would read the migration
   * as an edit. That is why the plugin adapter compares a fingerprint of
   * `globals` and `teeth` rather than the whole document.
   */
  it("reports the normalised clinical content once the engine is activated", () => {
    const stored = storedDocument();
    const session = createOdontogramSession(stored);
    try {
      session.activate();
      const live = session.getDocument();
      const normalized = normalizeOdontogramDocument(stored);

      expect(JSON.stringify(live.teeth)).toBe(JSON.stringify(normalized.teeth));
      expect(JSON.stringify(live.globals)).toBe(JSON.stringify(normalized.globals));
      // The stored document is not that content, which is the whole finding.
      expect(JSON.stringify(live.teeth)).not.toBe(JSON.stringify(stored.teeth));
    } finally {
      session.release();
    }
  })

  it("migrates the payload version on activation, which is not a clinical edit", () => {
    const stored = storedDocument();
    const session = createOdontogramSession(stored);
    try {
      session.activate();
      // Engine metadata moves; a host must not read this as unsaved input.
      expect(String(session.getDocument().version)).not.toBe(String(stored.version));
    } finally {
      session.release();
    }
  })
})
