// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Funktion (charly): occlusal function finding — premature contact
// (Frühkontakt), interference (Gleithindernis), overload (Belastung). Enum axis
// occlusalFunction, drawn as a marker on the schema occlusal table.
import { describe, it, expect } from "vitest";
import {
  __setToothStateForTest,
  getToothDisplayState,
  getStatusChart,
} from "../odontogram";

describe("occlusal function (Funktion)", () => {
  it("defaults to none and is omitted from serialization", () => {
    __setToothStateForTest(16, {});
    expect(getToothDisplayState(16).occlusalFunction).toBe("none");
    expect(getStatusChart().teeth["16"]?.occlusalFunction).toBeUndefined();
  });

  it("stores and serializes a function finding", () => {
    __setToothStateForTest(16, { occlusalFunction: "premature" });
    expect(getToothDisplayState(16).occlusalFunction).toBe("premature");
    expect(getStatusChart().teeth["16"]?.occlusalFunction).toBe("premature");
  });

  it("ignores an invalid value on hydrate", () => {
    __setToothStateForTest(26, { occlusalFunction: "sideways" });
    expect(getToothDisplayState(26).occlusalFunction).toBe("none");
  });

});
