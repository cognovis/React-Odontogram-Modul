// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-0w9: the Aidbox HTTP transport, published on its own.
//
// Every app that shows or plans on the odontogram reaches Aidbox through the
// same `@cognovis/fhir-sdk/client` factory — the standalone app and every host
// application. It used to be a file inside the chart library's dev app, which
// meant each consumer re-implemented it. It is now one package.
//
// The arrow points ONE way: this package depends on `@cognovis/odontogram` for
// the `AidboxGateway` shape it fills, never the reverse. The chart SDK stays
// HTTP-free and keeps the session SPI (`loadFromAidbox` / `saveToAidbox`),
// which takes a gateway rather than making requests itself.

export {
  DEFAULT_MAX_PAGES,
  STABLE_SORT,
  basicAuthorization,
  createAidboxGateway,
  createAidboxTransport,
  fhirBaseUrl,
  searchAllPages,
} from "./aidbox";

export type { AidboxConnection } from "./connection";

// Re-exported so a host that only wants to talk to Aidbox needs one import.
// These are the chart SDK's own types; this package adds nothing to them.
export type { AidboxGateway, PagedSearchResult } from "@cognovis/odontogram";
