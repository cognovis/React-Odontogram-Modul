// Browser stand-in for `node:crypto`.
//
// `@cognovis/fhir-sdk/client` re-exports its SQL-on-FHIR and de-identification
// helpers, and those import `createHash`, `createHmac`, `randomBytes` and
// `randomUUID` from `node:crypto` at module level. The app never calls them:
// the transport uses only the FHIR client factory. Rollup still has to bind
// the imports, and Vite's browser stub for Node built-ins exports nothing, so
// the build failed. This module gives the imports a target. If a later change
// ever reaches one of the hashes on this path, it fails loudly instead of
// returning a wrong digest.

function unavailable(name: string): never {
  throw new Error(`node:crypto ${name} is not available in the browser build of the standalone app.`);
}

export function createHash(_algorithm: string): never {
  return unavailable("createHash");
}

export function createHmac(_algorithm: string, _key: unknown): never {
  return unavailable("createHmac");
}

export function randomBytes(_size: number): never {
  return unavailable("randomBytes");
}

// The browser has a real one; no reason to refuse it.
export function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}
