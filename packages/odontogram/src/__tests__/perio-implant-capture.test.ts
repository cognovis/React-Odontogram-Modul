// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-2vd, AC3: the full-mouth periodontal chart captures
// suppuration, and an implant column supports the six-site peri-implant
// examination (probing depth, bleeding, suppuration), implant mobility and
// keratinized-tissue width — while the natural-tooth-only axes stay inert on it.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import PerioChart from "../PerioChart";
import {
  __resetChartStateForTest,
  __setToothStateForTest,
  setNumberingSystem,
  setPerioSite,
  getToothPerio,
  getKeratinizedWidth,
  getToothMobility,
  setPerioRowVisibility,
  setPerioOverlayLayer,
} from "../odontogram";
import { setI18nLanguage, t } from "../i18n/useI18n";

function openOverlay() {
  return render(createElement(PerioChart, { open: true, onClose: () => {} }));
}
function openInline() {
  return render(createElement(PerioChart, { inline: true }));
}

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  __resetChartStateForTest();
  setPerioOverlayLayer("none");
  setNumberingSystem("FDI");
  setI18nLanguage("en");
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("full-mouth suppuration capture", () => {
  it("renders a buccal and a palatal suppuration row per arch", () => {
    openInline();
    const grid = document.getElementById("perioInlineGrid")!;
    const labels = Array.from(grid.querySelectorAll(".perio-fullgrid-row-label-text")).map((el) => el.textContent);
    const supLabels = labels.filter((l) => l !== null && l.includes(t("perio.sup.row")));
    expect(supLabels.length).toBe(4); // buccal + palatal, upper + lower
  });

  it("charts suppuration through setPerioSite on a charted site only", () => {
    openOverlay();
    const box = document.getElementById("perio-fg-sup-16-MB") as HTMLInputElement;
    expect(box).toBeTruthy();
    // Nothing probed at that site yet: suppuration cannot be recorded there.
    expect(box.disabled).toBe(true);

    setPerioSite(16, "MB", { pd: 4 });
    cleanup();
    openOverlay();
    const charted = document.getElementById("perio-fg-sup-16-MB") as HTMLInputElement;
    expect(charted.disabled).toBe(false);
    fireEvent.click(charted);
    expect(getToothPerio(16).sup).toEqual(["MB"]);
    fireEvent.click(charted);
    expect(getToothPerio(16).sup).toEqual([]);
  });

  it("honours the per-row visibility setting like every other index row", () => {
    setPerioRowVisibility("sup", false);
    openInline();
    expect(document.getElementById("perio-fg-sup-16-MB")).toBeNull();
    setPerioRowVisibility("sup", true);
  });
});

describe("peri-implant examination in the full-mouth chart", () => {
  it("enables probing depth, bleeding, suppuration, mobility and keratinized width on an implant", () => {
    __setToothStateForTest(11, { toothSelection: "implant" });
    setPerioSite(11, "MB", { pd: 5 }); // charting drives the bop/sup enable gate
    openOverlay();

    const pd = document.getElementById("perio-fg-pd-11-MB") as HTMLInputElement;
    const bop = document.getElementById("perio-fg-bop-11-MB") as HTMLInputElement;
    const sup = document.getElementById("perio-fg-sup-11-MB") as HTMLInputElement;
    const mobility = document.getElementById("perio-fg-mobility-11") as HTMLSelectElement;
    const kg = document.getElementById("perio-fg-kg-11") as HTMLInputElement;
    expect(pd.disabled).toBe(false);
    expect(pd.value).toBe("5");
    expect(bop.disabled).toBe(false);
    expect(sup.disabled).toBe(false);
    expect(mobility.disabled).toBe(false);
    expect(kg.disabled).toBe(false);
  });

  it("keeps the natural-tooth-only axes inert on an implant", () => {
    __setToothStateForTest(11, { toothSelection: "implant" });
    setPerioSite(11, "MB", { pd: 5 });
    openOverlay();
    // The gingival margin is measured from the CEJ, which an implant has not.
    const gm = document.getElementById("perio-fg-gm-11-MB") as HTMLInputElement;
    expect(gm.disabled).toBe(true);
    // O'Leary plaque / PI / GI have mPI and mBI as their peri-implant analogues.
    for (const id of ["perio-fg-plaque-11-buccal", "perio-fg-pi-11-buccal", "perio-fg-gi-11-buccal"]) {
      expect((document.getElementById(id) as HTMLButtonElement).disabled).toBe(true);
    }
    // ... while the Mombelli implant indices are enabled.
    expect((document.getElementById("perio-fg-mpi-11-buccal") as HTMLButtonElement).disabled).toBe(false);
  });

  it("writes an implant's probing depth, mobility and keratinized width through the domain API", () => {
    __setToothStateForTest(11, { toothSelection: "implant" });
    openOverlay();

    const pd = document.getElementById("perio-fg-pd-11-B") as HTMLInputElement;
    fireEvent.change(pd, { target: { value: "6" } });
    expect(getToothPerio(11).pd).toEqual({ B: 6 });

    const mobility = document.getElementById("perio-fg-mobility-11") as HTMLSelectElement;
    fireEvent.change(mobility, { target: { value: "m1" } });
    expect(getToothMobility(11)).toBe("m1");

    const kg = document.getElementById("perio-fg-kg-11") as HTMLInputElement;
    fireEvent.change(kg, { target: { value: "3" } });
    expect(getKeratinizedWidth(11)).toBe(3);
  });

  it("charts suppuration on an implant site", () => {
    __setToothStateForTest(11, { toothSelection: "implant" });
    setPerioSite(11, "DB", { pd: 4 });
    openOverlay();
    const sup = document.getElementById("perio-fg-sup-11-DB") as HTMLInputElement;
    fireEvent.click(sup);
    expect(getToothPerio(11).sup).toEqual(["DB"]);
  });

  it("leaves a missing tooth's whole column inert", () => {
    __setToothStateForTest(21, { toothSelection: "none" });
    openOverlay();
    for (const id of ["perio-fg-pd-21-MB", "perio-fg-sup-21-MB", "perio-fg-mobility-21", "perio-fg-kg-21"]) {
      expect((document.getElementById(id) as HTMLInputElement).disabled).toBe(true);
    }
  });
});
