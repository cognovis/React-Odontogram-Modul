// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// Bead odontogram-0w9: what the transport needs to reach a server, and nothing
// else.
//
// The host supplies this. The transport reads NO environment: `import.meta.env`
// is a build-time substitution that only exists inside the app that was built
// with it, so a library reading it is a library that works in exactly one
// consumer. Every host application and the standalone app resolve their own
// credentials — from Vite variables, from a server process, from a session —
// and hand the result in.
//
// Deliberately narrower than the app's own live configuration: a patient id is
// what a chart is about, not what a connection is.

export interface AidboxConnection {
  /** The Aidbox root. `/fhir` is appended by `fhirBaseUrl`. */
  baseUrl: string;
  /** The scoped machine client's id (HTTP Basic). */
  clientId: string;
  /** That client's secret (HTTP Basic). */
  clientSecret: string;
}
