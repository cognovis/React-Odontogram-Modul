# Aidbox live mode

The standalone app (`apps/standalone`) can chart a patient that lives on an
[Aidbox](https://www.health-samurai.io/aidbox) FHIR server instead of a local
JSON document. The chart SDK (`@cognovis/odontogram`) holds the HTTP-free half:
the gateway SPI and the session load, save and write-plan delegates. The HTTP
half, the Aidbox transport and gateway factory, is
`@cognovis/odontogram-fhir`. All FHIR content is Dental Core.

## Configuration

Copy `apps/standalone/.env.example` to `apps/standalone/.env` and fill it in:

| Variable | Meaning |
|---|---|
| `VITE_AIDBOX_BASE_URL` | Base URL of the Aidbox instance. The app appends `/fhir`. |
| `VITE_AIDBOX_CLIENT_ID` | The scoped machine client's id (HTTP Basic auth). |
| `VITE_AIDBOX_CLIENT_SECRET` | Its secret. Development server only: `vite build` refuses to run while it is set. |
| `VITE_DEFAULT_PATIENT_ID` | The patient charted when the URL names none. `?patient=<id>` always wins. |

Live mode starts when the URL carries `?live` or `?patient=<id>`, or when the
`VITE_AIDBOX_*` variables are populated. Then run `bun run dev`.

## Credentials

**Use a scoped machine client, never an admin account.** Everything in a
`VITE_*` variable reaches the browser. Limit the client with an Aidbox
AccessPolicy to exactly this:

| Resource type | Verbs |
|---|---|
| `Patient` | `GET` only |
| `Device` | `GET` only (a load reads a placed implant's Device; nothing writes one) |
| `Observation`, `Condition`, `ServiceRequest`, `CarePlan` | `GET`, `PUT`, `POST`, `DELETE` |

Nothing outside `/fhir` is needed. The patient record is read-only on purpose:
the odontogram charts teeth, it does not own the patient. `DELETE` is needed
because clearing a finding has to remove its resource. Without it, a cleared
finding would come back on the next load.

## How a load works

1. `GET /fhir/Patient/{id}`. A missing patient is reported as a configuration
   error, not shown as an empty chart.
2. `Observation`, `Condition`, `ServiceRequest` and `CarePlan` are searched by
   `subject`, and `Device` by `patient`. Each search follows `link[rel=next]` to
   the end.
3. Each resource is decoded as Dental Core. A resource that is not Dental Core,
   or whose content the chart cannot represent, is listed as unsupported. It is
   never charted on a guess.

A read that hits the page budget, or fails partway through, counts as a failed
load. The UI says so.

## How a save works

`buildWritePlan` is a pure function. It takes the document, the patient and
the examination date, and returns an ordered list of single-resource `PUT`s.
`executeWritePlan` runs them. Resource ids are derived from the patient and the
finding, never minted, so saving the same chart twice writes the same
resources. Clearing a finding deletes its resource.

Saving is offered only after one clean load of the same patient. Saving from a
blank or partly read session would overwrite the authoritative chart.

A save is a sequence of single-resource writes, so it is not atomic. The
executor stops at the first failure. The UI names the failed `PUT`, its HTTP
status, and how many resources were already written.

## Known limits

| Limit | Consequence |
|---|---|
| The client writes only `Observation`, `Condition`, `ServiceRequest` and `CarePlan`. | A `Device`, `Procedure` or `Provenance` the codec emits is not written. The UI lists it under "Not written"; nothing is dropped silently. |
| A write that references a resource that is not itself written is dropped the same way. | Peri-implant findings (`periImplant`, mPI, mBI) depend on the implant `Device`, so they do not round-trip through live mode. |
| The periodontal-diagnosis `Condition` needs its `Provenance` to be read back. | `case.diagnosisOverride` does not round-trip through live mode. |
| Only the five resource types above are read. | Anything charted outside them does not come back. |
