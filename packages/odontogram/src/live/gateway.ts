// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-wt5: the published Aidbox SPI. Type-only — no HTTP client
// and no client-factory import. aidbox.ts remains the only transport module.

export interface PagedSearchResult {
  resources: unknown[];
  /** The budget ran out with a next link still offered — the result is PARTIAL. */
  truncated: boolean;
  /** What the server said the search matches (`Bundle.total`), when it says so. */
  expected?: number;
  /** Fewer resources arrived than the server counted — the result is PARTIAL. */
  incomplete: boolean;
}

/** The read/write surface the live mode needs, and nothing beyond it. */
export interface AidboxGateway {
  readPatient(patientId: string): Promise<Record<string, unknown> | null>;
  search(resourceType: string, query: Record<string, string | string[]>): Promise<PagedSearchResult>;
  put(path: string, resource: unknown): Promise<unknown>;
  delete(path: string): Promise<unknown>;
}
