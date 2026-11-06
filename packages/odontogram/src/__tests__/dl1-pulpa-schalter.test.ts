// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-dl1. Dirk, 18.08.2026: "Die Darstellung der Pulpa wuensche
// ich mir per Schalter waehlbar zwischen sichtbar und nicht sichtbar. Erst wenn
// eine Behandlung befundet ist (z.B. eine Wurzelfuellung) muss sie immer
// dargestellt sein."
//
// Der Schalter gab es schon (`#btnPulpVisible`), und die gestaffelte Regel
// stand auch da - nur zaehlte die LATEINISCHE Achse nicht als befundet. Mit
// ausgeschaltetem Schalter verschwand eine Pulpa, an der `Gangraena pulpae`
// stand. Genau das prueft dieser Test, und zwar fuer beide Vokabulare, damit
// die eine Achse nicht wieder ohne die andere gepflegt wird.
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { __renderActiveLayers, __setShowHealthyPulpForTest } from "../odontogram";

const testFileUrl = import.meta.url;
const svgText = readFileSync(
  fileURLToPath(new URL("../assets/teeth-svgs/11.svg", testFileUrl)),
  "utf8",
);
const zeigtPulpa = (state: Record<string, unknown>) =>
  __renderActiveLayers(svgText, 11, state).some((l) => l.id === "tooth-healthy-pulp");

afterEach(() => { __setShowHealthyPulpForTest(true); });

describe("odontogram-dl1: Pulpa per Schalter, ausser bei Befund", () => {
  it("Schalter AN zeigt auch die gesunde Pulpa", () => {
    __setShowHealthyPulpForTest(true);
    expect(zeigtPulpa({ toothSelection: "tooth-base" })).toBe(true);
  });

  it("Schalter AUS blendet die gesunde Pulpa aus", () => {
    __setShowHealthyPulpForTest(false);
    expect(zeigtPulpa({ toothSelection: "tooth-base" })).toBe(false);
    expect(zeigtPulpa({ toothSelection: "tooth-base", pulpDx: "normal" })).toBe(false);
    expect(zeigtPulpa({ toothSelection: "tooth-base", pulpLatin: "pulpa-sana" })).toBe(false);
  });

  it("ein BEFUND zeigt sie trotzdem - in beiden Vokabularen", () => {
    __setShowHealthyPulpForTest(false);
    for (const state of [
      { pulpDx: "reversible-pulpitis" },
      { pulpDx: "irreversible-pulpitis" },
      { pulpDx: "necrosis" },
      { pulpLatin: "hyperaemia-pulpae" },
      { pulpLatin: "pulpitis-acuta-serosa" },
      { pulpLatin: "necrosis-pulpae" },
      { pulpLatin: "gangraena-pulpae" },
    ]) {
      expect(zeigtPulpa({ toothSelection: "tooth-base", ...state }),
        JSON.stringify(state)).toBe(true);
    }
  });

  it("eine BEHANDLUNG zeigt sie trotzdem", () => {
    __setShowHealthyPulpForTest(false);
    for (const endo of ["endo-filling", "endo-filling-incomplete", "endo-medical-filling",
                        "endo-glass-pin", "endo-metal-pin"]) {
      expect(zeigtPulpa({ toothSelection: "tooth-base", endo }), endo).toBe(true);
    }
  });
});
