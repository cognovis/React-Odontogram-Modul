import { describe, expect, it } from "vitest";
import { PAYLOAD_VERSION } from "../document";
import { __importStatusForTest as importStatus, getStatusChart } from "../odontogram";

describe("imported canal identities", () => {
  it("drops prototype keys while preserving a legitimate canal", () => {
    importStatus({
      version: PAYLOAD_VERSION,
      globals: {},
      teeth: {
        "16": { endoCanals: JSON.parse('{"__proto__":["filling"],"constructor":["post"],"toString":["temporary"],"palatal":["filling"]}') },
      },
    });
    const canals = getStatusChart().teeth["16"].endoCanals;
    expect(Object.keys(canals)).toEqual(["palatal"]);
    expect(canals.palatal).toEqual(["filling"]);
    expect(Object.getPrototypeOf(canals)).toBe(Object.prototype);
  });
});
