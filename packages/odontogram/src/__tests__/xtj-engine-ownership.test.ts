// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

/**
 * Bead odontogram-xtj: the engine handover, tested where it actually lives.
 *
 * The handover had exactly ONE test — the React integration test that flakes
 * under full-suite load — and everywhere else in the suite `claimEngine` and
 * friends are mocked. So the product behaviour was pinned only by the test
 * nobody trusted, which is the strongest argument against simply silencing it.
 *
 * These exercise the real functions with no React, no jsdom timing and no
 * async engine init, so a failure here is a product defect and a failure only
 * over there is a harness problem. That is the question the bead asks.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createEngineClaim, claimEngine, releaseEngine, ownsEngine, onEngineOwnerChange,
} from "../odontogram";

/** Drain whatever the previous test left owning the engine. */
function drain() {
  for(let i = 0; i < 8; i++){
    const probe = createEngineClaim();
    if(claimEngine(probe)){ releaseEngine(probe); return; }
    releaseEngine(probe);
  }
}

beforeEach(() => { drain(); });

describe("one instance drives the engine", () => {
  it("the first claimant wins and a second is refused", () => {
    const a = createEngineClaim(), b = createEngineClaim();
    expect(claimEngine(a)).toBe(true);
    expect(claimEngine(b)).toBe(false);
    expect(ownsEngine(a)).toBe(true);
    expect(ownsEngine(b)).toBe(false);
    releaseEngine(a); releaseEngine(b);
  });

  it("claiming again is idempotent, not a queue entry", () => {
    const a = createEngineClaim();
    claimEngine(a);
    expect(claimEngine(a)).toBe(true);
    releaseEngine(a);
    // If the repeat had queued `a`, releasing would hand the engine back to it.
    expect(ownsEngine(a)).toBe(false);
  });

  it("ownsEngine(null) is false rather than a throw", () => {
    expect(ownsEngine(null)).toBe(false);
  });
});

describe("the handover when the owner goes away", () => {
  it("passes the engine to the waiting instance", () => {
    const a = createEngineClaim(), b = createEngineClaim();
    claimEngine(a); claimEngine(b);
    releaseEngine(a);
    expect(ownsEngine(b)).toBe(true);
    releaseEngine(b);
  });

  it("notifies, so a waiter can mount the editor it was refused", () => {
    const a = createEngineClaim(), b = createEngineClaim();
    claimEngine(a); claimEngine(b);
    let owned = false;
    // Exactly the expression App's listener evaluates.
    const off = onEngineOwnerChange(() => { owned = ownsEngine(b) || claimEngine(b); });
    releaseEngine(a);
    expect(owned).toBe(true);
    off(); releaseEngine(b);
  });

  it("hands on in the order instances arrived", () => {
    const a = createEngineClaim(), b = createEngineClaim(), c = createEngineClaim();
    claimEngine(a); claimEngine(b); claimEngine(c);
    releaseEngine(a);
    expect(ownsEngine(b)).toBe(true);
    releaseEngine(b);
    expect(ownsEngine(c)).toBe(true);
    releaseEngine(c);
  });

  it("leaves nobody owning it when the last instance goes", () => {
    const a = createEngineClaim();
    claimEngine(a);
    releaseEngine(a);
    const fresh = createEngineClaim();
    expect(claimEngine(fresh)).toBe(true);   // it was genuinely free
    releaseEngine(fresh);
  });
});

describe("an instance that leaves while waiting", () => {
  it("drops out of the queue instead of inheriting later", () => {
    const a = createEngineClaim(), b = createEngineClaim(), c = createEngineClaim();
    claimEngine(a); claimEngine(b); claimEngine(c);
    releaseEngine(b);            // b unmounts while still waiting
    releaseEngine(a);
    expect(ownsEngine(b)).toBe(false);
    expect(ownsEngine(c)).toBe(true);
    releaseEngine(c);
  });

  it("cannot take the engine from the owner by releasing", () => {
    const a = createEngineClaim(), b = createEngineClaim();
    claimEngine(a); claimEngine(b);
    releaseEngine(b);
    expect(ownsEngine(a)).toBe(true);
    releaseEngine(a);
  });
});

describe("a broken listener cannot break the handover", () => {
  it("still reaches the listeners after the one that threw", () => {
    const a = createEngineClaim(), b = createEngineClaim();
    claimEngine(a); claimEngine(b);
    let reached = false;
    const off1 = onEngineOwnerChange(() => { throw new Error("host listener blew up"); });
    const off2 = onEngineOwnerChange(() => { reached = ownsEngine(b); });
    expect(() => releaseEngine(a)).not.toThrow();
    expect(reached).toBe(true);
    off1(); off2(); releaseEngine(b);
  });
});
