// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-c51.1 — the model-analysis card.
//
// Two things this has to prove, because they are the two decisions Dirk made:
// (1) the arch and the list are two views of ONE record, so a width typed in
// one appears in the other with nothing synchronising them, and (2) the norms
// and deviations are live, updating as the numbers arrive rather than behind a
// "derive" button.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent, act, within } from "@testing-library/react";
import { ModelAnalysisCard } from "../ModelAnalysisCard";
import { setI18nLanguage } from "../i18n/useI18n";
import {
  getToothWidth, setToothWidth, resetToothWidths, setReadOnly,
  getOcclusalMeasurements, resetOcclusalMeasurements,
  __resetChartStateForTest, __setToothStateForTest, __notifyStateChangeForTest,
} from "../odontogram";

/** Every width of the reference model measurement, in arch order. */
const REFERENCE: Record<number, number> = {
  16: 10.5, 15: 6.5, 14: 7.1, 13: 8.1, 12: 7.1, 11: 8.7,
  21: 8.8, 22: 7.0, 23: 8.1, 24: 7.1, 25: 6.4, 26: 10.5,
  46: 11.4, 45: 6.8, 44: 6.8, 43: 7.0, 42: 6.2, 41: 5.8,
  31: 5.8, 32: 6.2, 33: 7.0, 34: 6.8, 35: 6.8, 36: 11.4,
};

const field = (toothNo: number) =>
  document.querySelector<HTMLInputElement>(`.ma-width-input[data-tooth="${toothNo}"]`)!;

const type = (toothNo: number, value: string) => {
  // A real typist focuses the field first, and the draft logic depends on that:
  // while focused, nothing may overwrite what is being typed.
  fireEvent.focus(field(toothNo));
  fireEvent.change(field(toothNo), { target: { value } });
};

const switchTo = (label: RegExp) =>
  fireEvent.click(within(document.querySelector(".ma-viewswitch")!).getByText(label));

beforeEach(() => {
  __resetChartStateForTest();
  resetToothWidths();
  resetOcclusalMeasurements();
  setReadOnly(false);
  setI18nLanguage("en");
});
afterEach(cleanup);

describe("entering widths", () => {
  it("writes through to the engine", () => {
    render(<ModelAnalysisCard />);
    type(11, "8.7");
    expect(getToothWidth(11)).toBe(8.7);
  });

  it("accepts a comma as the decimal separator", () => {
    render(<ModelAnalysisCard />);
    type(11, "8,7");
    expect(getToothWidth(11)).toBe(8.7);
  });

  it("clearing the field un-measures the tooth rather than storing zero", () => {
    render(<ModelAnalysisCard />);
    type(11, "8.7");
    type(11, "");
    expect(getToothWidth(11)).toBeNull();
  });

  it("read-only disables every field", () => {
    setReadOnly(true);
    render(<ModelAnalysisCard />);
    expect(field(11).disabled).toBe(true);
    expect(field(36).disabled).toBe(true);
  });
});

describe("two views, one record", () => {
  it("a width typed in the arch is already there in the list", () => {
    render(<ModelAnalysisCard />);
    type(11, "8.7");
    switchTo(/Liste|List/i);
    expect(field(11).value).toBe("8.7");
  });

  it("and back again — neither view owns the data", () => {
    render(<ModelAnalysisCard />);
    switchTo(/Liste|List/i);
    type(21, "8.8");
    switchTo(/Zahnbogen|Arch/i);
    expect(field(21).value).toBe("8.8");
    expect(getToothWidth(21)).toBe(8.8);
  });

  it("the arch is pinned dir=ltr so tooth order never mirrors", () => {
    const { container } = render(<ModelAnalysisCard />);
    expect(container.querySelector(".ma-arch")!.getAttribute("dir")).toBe("ltr");
  });
});

describe("the norms are live", () => {
  it("shows the published norms before anything at all is measured", () => {
    render(<ModelAnalysisCard />);
    const rows = document.querySelectorAll(".ma-indices tbody tr");
    expect(rows).toHaveLength(3);
    const norms = Array.from(document.querySelectorAll(".ma-indices .ma-norm"))
      .map(el => el.textContent);
    expect(norms).toEqual(["74.0 %", "77.2 %", "91.3 %"]);
  });

  it("REFERENCE: the printed percentages appear as the widths arrive, with no derive step", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));

    const cells = (row: number) =>
      Array.from(document.querySelectorAll(".ma-indices tbody tr")[row].querySelectorAll("td"))
        .map(td => td.textContent);

    expect(cells(0)[1]).toBe("75.9 %");   // Tonn
    expect(cells(1)[1]).toBe("79.5 %");   // Bolton anterior
    expect(cells(2)[1]).toBe("91.8 %");   // Bolton overall
  });

  it("REFERENCE: the sums and the target SI appear too", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));
    const sums = Array.from(document.querySelectorAll(".ma-sum-value")).map(el => el.textContent);
    expect(sums).toEqual(["31.6 mm", "24.0 mm", "47.8 mm", "38.0 mm", "95.9 mm", "88.0 mm"]);
    expect(document.querySelectorAll(".ma-findings dd")[0].textContent).toBe("32.4 mm");
  });

  it("an incomplete arch shows a dash, never a ratio computed from half the teeth", () => {
    render(<ModelAnalysisCard />);
    type(11, "8.7");
    type(21, "8.8");
    const tonnActual = document.querySelectorAll(".ma-indices tbody tr")[0].querySelectorAll("td")[1];
    expect(tonnActual.textContent).toBe("—");
  });

  it("the deviation bar deflects only once there is a deviation to show", () => {
    render(<ModelAnalysisCard />);
    expect(document.querySelectorAll(".ma-bar-empty")).toHaveLength(3);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));
    expect(document.querySelectorAll(".ma-bar-empty")).toHaveLength(0);
    // every reference ratio sits ABOVE its norm
    expect(document.querySelectorAll(".ma-bar-fill.is-over")).toHaveLength(3);
  });

  it("REFERENCE: names the arch carrying the surplus, with the classical millimetres", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));
    const discrepancy = document.querySelectorAll(".ma-findings dd")[1].textContent!;
    expect(discrepancy).toMatch(/1\.1/);
    expect(discrepancy).toMatch(/Unterkiefer|Mandibular/i);
  });
});

describe("staying current", () => {
  it("picks up a width recorded elsewhere in the engine", () => {
    render(<ModelAnalysisCard />);
    act(() => setToothWidth(11, 9.1));
    expect(field(11).value).toBe("9.1");
  });

  it("a blank-slate reset empties the fields", () => {
    render(<ModelAnalysisCard />);
    type(11, "8.7");
    fireEvent.blur(field(11));   // as clicking a reset button would
    act(() => __resetChartStateForTest());
    expect(field(11).value).toBe("");
  });

  it("but a field still being typed into is not overwritten from underneath", () => {
    // Deliberate: an import or a second view arriving mid-keystroke must not
    // yank the text out of the typist's field. It re-syncs on blur.
    render(<ModelAnalysisCard />);
    type(11, "8.7");
    act(() => { setToothWidth(11, 9.9); });
    expect(field(11).value).toBe("8.7");
    fireEvent.blur(field(11));
    expect(field(11).value).toBe("9.9");
  });
});

describe("the decimal separator follows the language", () => {
  // Found in the browser, not here: the first build used toFixed() everywhere
  // and a German clinician saw "75.9 %" for a value they write as "75,9 %".
  // The width field was worse — it was type="number", which rejects the comma
  // outright, so typing "8,7" recorded nothing at all.
  it("German shows a comma in the derived values", () => {
    setI18nLanguage("de");
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));

    const norms = Array.from(document.querySelectorAll(".ma-indices .ma-norm")).map(el => el.textContent);
    expect(norms).toEqual(["74,0 %", "77,2 %", "91,3 %"]);
    expect(document.querySelectorAll(".ma-findings dd")[0].textContent).toBe("32,4 mm");
    expect(document.querySelectorAll(".ma-findings dd")[1].textContent).toMatch(/1,1 mm/);
  });

  it("German fields show a comma, and a whole number still reads to one decimal", () => {
    setI18nLanguage("de");
    render(<ModelAnalysisCard />);
    act(() => { setToothWidth(11, 8.7); setToothWidth(22, 7); });
    expect(field(11).value).toBe("8,7");
    expect(field(22).value).toBe("7,0");
  });

  it("a comma typed into the field is recorded, whatever the language", () => {
    setI18nLanguage("de");
    render(<ModelAnalysisCard />);
    type(11, "8,7");
    expect(getToothWidth(11)).toBe(8.7);
  });
});

describe("occlusal readings", () => {
  const occl = (field: string) =>
    document.querySelector<HTMLInputElement>(`.ma-width-input[data-occlusal="${field}"]`)!;

  it("writes all four through to the engine", () => {
    render(<ModelAnalysisCard />);
    fireEvent.change(occl("overjet"), { target: { value: "4.4" } });
    fireEvent.change(occl("overbite"), { target: { value: "6.3" } });
    fireEvent.change(occl("midlineLower"), { target: { value: "-1.5" } });
    expect(getOcclusalMeasurements()).toMatchObject({
      overjet: 4.4, overbite: 6.3, midlineLower: -1.5,
    });
  });

  it("a lone minus sign is a half-typed number, not a clear", () => {
    render(<ModelAnalysisCard />);
    fireEvent.focus(occl("overjet"));
    fireEvent.change(occl("overjet"), { target: { value: "4.4" } });
    fireEvent.change(occl("overjet"), { target: { value: "-" } });
    expect(occl("overjet").value).toBe("-");
    fireEvent.change(occl("overjet"), { target: { value: "-2" } });
    expect(getOcclusalMeasurements().overjet).toBe(-2);
  });

  it("names the direction of a midline deviation rather than leaving a sign to decode", () => {
    setI18nLanguage("de");
    render(<ModelAnalysisCard />);
    const hint = () => document.querySelectorAll(".ma-occl-hint")[2].textContent;
    expect(hint()).toBe("mittig");
    fireEvent.change(occl("midlineUpper"), { target: { value: "2" } });
    expect(hint()).toBe("nach rechts");
    fireEvent.change(occl("midlineUpper"), { target: { value: "-2" } });
    expect(hint()).toBe("nach links");
  });

  it("calls a negative overjet a crossbite and a negative overbite an open bite", () => {
    setI18nLanguage("de");
    render(<ModelAnalysisCard />);
    const hints = () => Array.from(document.querySelectorAll(".ma-occl-hint")).map(e => e.textContent);
    fireEvent.change(occl("overjet"), { target: { value: "-2" } });
    fireEvent.change(occl("overbite"), { target: { value: "-3" } });
    expect(hints()[0]).toMatch(/Kopfbiss|umgekehrt/);
    expect(hints()[1]).toBe("offener Biss");
  });
});

describe("an assumed width never reads as a measurement", () => {
  it("shows the borrowed value, marked and not typeable", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));
    act(() => { __setToothStateForTest(12, { toothSelection: "none" }); __notifyStateChangeForTest(); });

    const f = field(12);
    expect(f.readOnly).toBe(true);
    expect(f.className).toMatch(/is-assumed/);
    expect(f.dataset.assumedFrom).toBe("22");
    expect(f.value).toBe("7.0");                       // 22's width, not 12's own 7.1
    expect(f.getAttribute("aria-label")).toMatch(/12/);
    expect(f.getAttribute("aria-label")).toMatch(/22/);
  });

  it("lists every assumption under the analysis", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));
    expect(document.querySelector(".ma-assumed-note")).toBeNull();

    act(() => {
      __setToothStateForTest(12, { toothSelection: "none" });
      __setToothStateForTest(46, { toothSelection: "not-erupted" });
      __notifyStateChangeForTest();
    });
    const note = document.querySelector(".ma-assumed-note")!.textContent!;
    expect(note).toMatch(/12/);
    expect(note).toMatch(/22/);
    expect(note).toMatch(/46/);
    expect(note).toMatch(/36/);
  });

  it("the sums keep computing where without the rule they would not", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) {
      if (Number(no) !== 12) type(Number(no), String(w));
    }
    // 12 unmeasured and PRESENT: no substitution, so Tonn cannot be computed
    const tonn = () => document.querySelectorAll(".ma-indices tbody tr")[0].querySelectorAll("td")[1].textContent;
    expect(tonn()).toBe("—");

    act(() => { __setToothStateForTest(12, { toothSelection: "none" }); __notifyStateChangeForTest(); });
    expect(tonn()).not.toBe("—");
  });

  it("marks the assumption in the list view too", () => {
    render(<ModelAnalysisCard />);
    for (const [no, w] of Object.entries(REFERENCE)) type(Number(no), String(w));
    act(() => { __setToothStateForTest(12, { toothSelection: "none" }); __notifyStateChangeForTest(); });
    switchTo(/Liste|List/i);
    expect(field(12).className).toMatch(/is-assumed/);
    expect(field(12).readOnly).toBe(true);
  });
});
