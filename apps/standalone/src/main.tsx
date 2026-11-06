// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Cognovis fork - https://github.com/cognovis/odontogram
//
// Bead odontogram-0w9: ONE entry point for the standalone app.
//
// There used to be two HTML files — `index.html` booting the fixture
// playground and `live.html` booting the Aidbox-backed chart — which meant two
// builds, two CSP headers and two places to keep a change. They are the same
// app in two modes, so they are now one entry that picks its mode from the
// environment and the query string (`isLiveModeRequested`).
//
// `import.meta.env` is read HERE and nowhere else, and immediately handed to
// `config.ts` as a plain record. Neither published package can see it.

import React from "react";
import { createRoot } from "react-dom/client";
import OdontogramShell from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";
// The page itself (background, text colour, font, the :root tokens) is the
// app's, not the chart's: the package stylesheet no longer styles a host page.
import "./page.css";
import LiveApp from "./LiveApp";
import { isLiveModeRequested, type LiveEnv } from "./config";

const env = import.meta.env as unknown as LiveEnv;
const search = typeof window === "undefined" ? "" : window.location.search;

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      {isLiveModeRequested(env, search)
        ? <LiveApp env={env} search={search} />
        : <OdontogramShell enableNotes />}
    </React.StrictMode>
  );
}
