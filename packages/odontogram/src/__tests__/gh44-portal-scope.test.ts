// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026

// GitHub cognovis/odontogram#44, AC2. The stylesheet no longer sets the
// chart's tokens on :root, so a surface the package appends straight to
// <body> — outside .odontogram-root — only gets them by carrying the
// `odontogram-portal` class, which the token rules (light and `.dark`) match
// alongside `.odontogram-root`. Without it the tour card and the perio info
// popover would resolve `var(--panel)`, `var(--text)` … against whatever the
// host page defines, or nothing.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { startIntroTour } from "../tour";
import PerioChart from "../PerioChart";
import { __resetChartStateForTest, setNumberingSystem } from "../odontogram";
import { setI18nLanguage } from "../i18n/useI18n";

const PORTAL_CLASS = "odontogram-portal";

function bodyChildrenOutsideRoot(): HTMLElement[] {
  return Array.from(document.body.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && !node.classList.contains("odontogram-root") && !node.querySelector(".odontogram-root"),
  );
}

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
  setI18nLanguage("en");
});

afterEach(() => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  cleanup();
  document.body.innerHTML = "";
});

describe("gh#44: body-appended surfaces carry the portal scope class", () => {
  it("every element of the intro tour carries it", () => {
    startIntroTour();
    const appended = bodyChildrenOutsideRoot();
    expect(appended.map((el) => el.className)).toEqual(expect.arrayContaining([
      expect.stringContaining("odon-tour-backdrop"),
      expect.stringContaining("odon-tour-card"),
    ]));
    for (const el of appended) expect(el.classList.contains(PORTAL_CLASS), el.className).toBe(true);
  });

  it("the tour highlight carries it when the step's target exists", () => {
    const target = document.createElement("div");
    target.id = "toothGrid";
    target.className = "odontogram-root";
    target.scrollIntoView = () => {};
    document.body.appendChild(target);
    startIntroTour();
    const highlight = document.querySelector(".odon-tour-highlight");
    expect(highlight).toBeTruthy();
    expect(highlight!.classList.contains(PORTAL_CLASS)).toBe(true);
  });

  it.each([
    ["inline", { inline: true }, "#perioInlinePanel"],
    ["modal", { open: true, onClose: () => {} }, "#perioOverlay"],
  ] as const)("the independent %s perio chart carries the token and box-sizing scope", (_mode, props, selector) => {
    __resetChartStateForTest();
    setNumberingSystem("FDI");
    render(createElement(PerioChart, props));
    const root = document.querySelector(selector);
    expect(root).toBeTruthy();
    expect(root!.classList.contains("odontogram-root")).toBe(true);
  });

  it("the perio info popover carries it", () => {
    __resetChartStateForTest();
    setNumberingSystem("FDI");
    render(createElement(PerioChart, { inline: true }));
    fireEvent.click(document.querySelector(".perio-info-btn") as HTMLButtonElement);
    const popover = document.querySelector(".perio-info-popover");
    expect(popover).toBeTruthy();
    expect(popover!.parentElement).toBe(document.body);
    expect(popover!.classList.contains(PORTAL_CLASS)).toBe(true);
  });

  // The other body-appended surfaces (zoom popover, context menu, note editor,
  // caries-depth and filling-defect popups, export overlay) open only from a
  // mounted chart's touch/long-press and export paths. They and the two above
  // go through ONE helper that adds the class; this pins that no source file
  // appends a lasting surface to <body> any other way. Download anchors are
  // added and removed in the same tick and need no tokens.
  it("no package source appends a surface to <body> except through the portal helper", () => {
    const src = resolve(process.cwd(), "src");
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(path);
        } else if (/\.tsx?$/.test(entry.name) && entry.name !== "portal.ts") {
          readFileSync(path, "utf8").split("\n").forEach((line, index) => {
            const match = /document\.body\.(?:appendChild|append|prepend|insertBefore)\(\s*(\w+)/.exec(line);
            if (match && match[1] !== "a") offenders.push(`${path.slice(src.length + 1)}:${index + 1}: ${line.trim()}`);
          });
        }
      }
    };
    expect(existsSync(src)).toBe(true);
    walk(src);
    expect(offenders).toEqual([]);
  });
});
