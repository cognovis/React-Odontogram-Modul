# React Advanced Odontogram

> **Pre-release.** This is an early public snapshot. APIs will change without
> notice, and cleanup of the code base and documentation is still in progress.
> Do not depend on it for production use yet.

An interactive, SVG-based dental chart (odontogram) for React and TypeScript:
anatomical and periodontal views, a status and treatment-plan model
with named plan alternatives, keyboard shorthand entry, and FHIR (Dental Core)
mapping with an optional Aidbox transport.

## Credit

This project is a fork of **React Advanced Odontogram** by Zoltán Dul
(<https://github.com/ZoliQua/React-Advanced-Odontogram>), released under the MIT
license. It has since been extended by Dirk Saeger and cognovis GmbH. Please
cite the original work as described in [`CITATION.cff`](CITATION.cff).

## Repository layout

This is a [Bun](https://bun.sh) workspace:

| Path | Package | What it is |
|---|---|---|
| `packages/odontogram/` | `@cognovis/odontogram` | The chart SDK (React component library) |
| `packages/odontogram-fhir/` | `@cognovis/odontogram-fhir` | The Aidbox HTTP transport for the chart SDK |
| `apps/standalone/` | `@cognovis/odontogram-standalone` | A standalone app that consumes both (private) |

The packages are not yet published to a public npm registry. Use them from
source for now.

## Getting started

```
bun install
bun run dev          # serve the standalone app
bun run build:lib    # build both packages (the SDK first)
bun run typecheck    # needs build:lib to have run once
bun run test         # every member's test suite
```

The detailed component documentation, in twelve languages, is in
[`packages/odontogram/README.md`](packages/odontogram/README.md) and
[`packages/odontogram/lang/`](packages/odontogram/lang/).

## License

MIT, see [`LICENSE`](LICENSE).
