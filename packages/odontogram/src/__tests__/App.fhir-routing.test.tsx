import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../App";
import { createOdontogramSession } from "../odontogram";
import { setI18nLanguage } from "../i18n/useI18n";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  setI18nLanguage("en");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

describe("public FHIR JSON-bundle API is gone", () => {
  it("does not render a FHIR export control", () => {
    render(<App />);
    expect(document.getElementById("btnStatusFhirExport")).toBeNull();
  });

  it("does not expose JSON-bundle methods on the session", () => {
    const session = createOdontogramSession();
    expect(session).not.toHaveProperty("exportFhirBundle");
    expect(session).not.toHaveProperty("importFhirBundle");
    expect(session).not.toHaveProperty("fhir");
  });
});
