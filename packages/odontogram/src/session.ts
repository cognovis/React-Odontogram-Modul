// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// The controlled-integration boundary in one place (bead odontogram-3l1).
//
// A host owns an `OdontogramDocument` — the versioned JSON `exportStatus()`
// writes and `importStatus()` reads — and drives one mounted odontogram through
// an `OdontogramSession`. That is the entire contract:
//
//     const session = createOdontogramSession(savedDocument);
//     <OdontogramShell session={session} onDocumentChange={save} />
//     session.getDocument();          // read
//     session.setDocument(next);      // write
//     session.subscribe(listener);    // observe
//     session.getPlanChanges();       // treatment intent for this session
//     session.getPlanChart();
//     session.getChartMode();
//     session.setChartMode("plan");
//
// Aidbox is the only FHIR seam: hosts inject a gateway and call
// `session.loadFromAidbox` / `session.saveToAidbox`. This module may import the
// live SPI (`./live/load`, `./live/save`, `./live/writePlan`, `./live/gateway`)
// but never `./live/aidbox` or the FHIR SDK client factory. There is no
// JSON-bundle method on the session.
//
// The implementation lives in `./odontogram` because it owns the clinical state;
// this module is the documented public surface for it.

export {
  createOdontogramSession,
  getDefaultOdontogramSession,
  getActiveOdontogramSession,
} from "./odontogram";

export type {
  OdontogramSession,
  OdontogramDocument,
  ChartMode,
  PlanChange,
  AidboxGateway,
  PagedSearchResult,
  LoadResult,
  LoadReport,
  UnsupportedResource,
  WriteTarget,
  WriteResult,
  WriteFailure,
  LoadOutcome,
  WritePlan,
  WriteOp,
  SkippedResource,
} from "./odontogram";
