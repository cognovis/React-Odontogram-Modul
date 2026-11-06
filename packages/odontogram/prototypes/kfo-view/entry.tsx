// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026

import React from "react";
import { createRoot } from "react-dom/client";
import "../../src/index.css";
import KfoViewPrototype from "./KfoViewPrototype";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <KfoViewPrototype />
    </React.StrictMode>,
  );
}
