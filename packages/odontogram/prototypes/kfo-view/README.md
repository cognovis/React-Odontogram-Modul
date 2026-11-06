# KFO findings view prototype

This throwaway prototype compares seven possible layouts for `odontogram-c51`. It is deliberately
isolated from the production application entry point and keeps all state in memory.

## Start

From the repository root:

```bash
npm install
npm run prototype:kfo
```

The command opens variant A. All variants are directly selectable in the floating A–G switcher.

## Direct variant URLs

With the development server running at its default address:

- A — Findings form: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=A>
- B — Arch-centered workbench: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=B>
- C — Guided examination: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=C>
- D — Expert matrix: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=D>
- E — KIG matrix: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=E>
- F — Occlusion schema: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=F>
- G — KFO cockpit: <http://127.0.0.1:5173/prototypes/kfo-view/?variant=G>

The prototype assumes planned Dental Core KFO carriers are available. Badges distinguish
already published carriers from the target contract. The KIG matrix records only manual clinician
selection; it does not perform automatic KIG derivation.

Research and the FHIR/market evidence are captured in
[`docs/research/odontogram-c51-kfo-findings-view.md`](../../docs/research/odontogram-c51-kfo-findings-view.md).
