# `tools/` — build-time only

**Nothing under `tools/` ships at runtime.** The published package is
`files: ["dist"]`, so none of this is in the tarball, and no module under
`src/` imports from here. If something in this directory ever needs to run in
a consumer's browser or server, it belongs in `src/` instead — and then it is
part of the public API and the SVG-fingerprint parity contract, which these
tools deliberately are not.

Two kinds of thing live here, plus a note on the tooth artwork.

## The tooth artwork

The anatomical SVG templates in `src/assets/teeth-svgs/` are generated, one
per FDI position, by a tooth generator that is kept outside this repository.
Never hand-edit one: each carries its measured anchors in a leading
`<!-- toothgen: ... -->` comment, which the tests read.

## `verify-library-artifacts.mjs` — the published-artifact contract

Run after `bun run build:lib`. It reads the built `dist/` and asserts what the
published package must and must not contain: the session Aidbox seam
(`loadFromAidbox` / `saveToAidbox` / `AidboxGateway`) is present, the removed
FHIR-dialect and JSON-bundle symbols are not, the session SPI's internals
(`isSaveAllowed`, `assembleLoadResult`, `SEARCHED_RESOURCE_TYPES`,
`buildWritePlan`, `PAYLOAD_VERSION`) are not exported either,
`dist/odontogram.js` carries no `@cognovis/fhir-sdk/client` import (the HTTP
client lives in `@cognovis/react-odontogram-fhir`), and a temporary consumer can
`import` the package by its published name while `@cognovis/react-odontogram/fhir`
fails to resolve.

```
bun run build:lib && bun run verify:lib-artifacts
```

## `fhir-validate.mjs` — the HL7 validator harness

Runs the official HL7 FHIR validator over an exported bundle. It needs
`FHIR_VALIDATOR_JAR` pointing at the validator jar; the suite that drives it
skips itself when that is unset, so it never fails a machine that has no jar.
The IG comes from `FHIR_DENTAL_CORE_IG`, the user's `.fhir/packages` cache,
or `.fhir/de.cognovis.fhir.dental.core-<version>.tgz` in the user's home.
Each run emits its bundles into a private temporary directory under `TMPDIR`
and removes it afterwards, including on failure. The fixture emitter takes
that directory as its required argument.
