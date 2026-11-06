// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Apikal pro Wurzel (charly). apicalDx stays per tooth; apicalRoot optionally
// names the affected root so the schema lesion sits at that root's apex.
// Additive, omit-when-empty; the root must belong to the tooth and a diagnosis
// must be charted.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
  setApicalRoot,
  getApicalRoot,
} from "../odontogram";

describe("apical lesion per root", () => {
  it("defaults to '' and is omitted from serialization", () => {
    __setToothStateForTest(16, { apicalDx: "chronic-apical-abscess" });
    expect(getToothDisplayState(16).apicalRoot).toBe("");
    expect(getStatusChart().teeth["16"]?.apicalRoot).toBeUndefined();
  });

  it("stores and serializes a named root", () => {
    __setToothStateForTest(16, { apicalDx: "chronic-apical-abscess", apicalRoot: "palatal" });
    expect(getToothDisplayState(16).apicalRoot).toBe("palatal");
    expect(getStatusChart().teeth["16"]?.apicalRoot).toBe("palatal");
  });

  it("the setter needs a diagnosis and a valid root of this tooth", () => {
    __setToothStateForTest(16, { apicalDx: "normal" });
    setApicalRoot(16, "palatal");
    expect(getApicalRoot(16)).toBe("");           // no diagnosis: no-op
    __setToothStateForTest(16, { apicalDx: "chronic-apical-abscess" });
    setApicalRoot(16, "mesial");                  // not a root of 16 (mb/db/palatal)
    expect(getApicalRoot(16)).toBe("");
    setApicalRoot(16, "distobuccal");
    expect(getApicalRoot(16)).toBe("distobuccal");
  });
});
