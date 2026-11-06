# Browser measuring tool

`inspect.mjs` measures the **running** app over the Chrome DevTools Protocol.

It is not a substitute for a test. It answers the questions the source cannot
settle, because only the browser resolves layout, transforms and orientation.
Two chart bugs were found exactly this way — and in both cases the source read
correctly:

- the lower arch's occlusal plane did not run through, because the tiles rotated
  by 180° were aligned flush at the bottom, so the root apices lined up instead
  of the incisal edges;
- in the periodontal chart one row per jaw was upside down, because the mirror
  was decided per view instead of per jaw.

No dependencies: `fetch` and `WebSocket` have been built in since Node 22.

## Prerequisites

```sh
npm run dev

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --remote-debugging-port=9222 \
  --window-size=1600,1300 http://localhost:5173/
```

A different endpoint can be set through `CDP_ENDPOINT`.

## Commands

| Command | Answers |
|---|---|
| `orientation` | Do the roots of each band point cranially or caudally, and does that match the jaw? Exits 1 when a band is upside down. |
| `templates` | Which tooth is drawn from which template — read off the rendered DOM, not off `TOOTH_TEMPLATE`. |
| `labels` | The row labels of both arches (upper "Palatal …", lower "Lingual …"). |
| `shot [file] [selector]` | Screenshot of the page or of one element. |

```sh
node tools/browser/inspect.mjs orientation
node tools/browser/inspect.mjs templates
node tools/browser/inspect.mjs shot arch.png "svg.perio-tooth-arch-buccal"
```

## Driving it by hand

The four commands are the reliable part; most real measuring is a throwaway
`.mjs` that opens the same socket and evaluates its own expressions. That is
the intended use, and the traps below are all things that bite there.

```js
const targets = await (await fetch("http://localhost:9222/json/list")).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("5173"));
const ws = new WebSocket(page.webSocketDebuggerUrl);
// … send Runtime.evaluate over the socket
```

## Five traps, and every one of them has cost real time

**1. `getBoundingClientRect` ignores `clip-path`.** Since the root in the
periodontal chart is drawn as a second, clipped copy, the boxes of the crown and
root groups overlap completely. `orientation` therefore measures off the mm-grid
labels, which run from the CEJ toward the root by construction.

**2. `Page.captureScreenshot`'s `clip` is in DOCUMENT coordinates**, while
`getBoundingClientRect` returns viewport coordinates. Without adding the scroll
offset you get an empty image.

**3. A click lands where the element ISN'T if it is off-screen.** Coordinates
from `getBoundingClientRect` are only clickable while the element is inside the
viewport; a card scrolled out of view yields coordinates that hit whatever
happens to be at that point instead, and the measurement reads as "the control
does nothing". `scrollIntoView({ block: "center" })` first, re-read the rect
afterwards, and refuse the click when it falls outside `innerWidth`/`innerHeight`
rather than measuring silence:

```js
const b = JSON.parse(await evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  e.scrollIntoView({ block: "center" });
  const r = e.getBoundingClientRect();
  return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2,
                          vw: innerWidth, vh: innerHeight });
})()`));
if (b.x < 0 || b.y < 0 || b.x > b.vw || b.y > b.vh) throw new Error("off-screen: " + sel);
```

**4. After a hot reload, Vite serves a SECOND module instance under `?t=…`.**
Importing the bare path gives you a fresh module with its own charts: the calls
appear to work and never reach the chart the app is showing. Import the URL the
app itself loaded:

```js
await evaluate(`window.__O = import(
  performance.getEntriesByType('resource').map(r => r.name)
    .filter(n => /\/src\/odontogram\.ts/.test(n)).sort().pop()
    || '/src/odontogram.ts')`);
```

**5. Synthetic DOM events are not a substitute for real input.** A `click()` on
an `<input>` inside a `<label>` can toggle twice, and a `new MouseEvent` skips
the pointer sequence some controls listen for. Use
`Input.dispatchMouseEvent` (`mousePressed` then `mouseReleased`) for anything
whose behaviour is under test; a plain `dispatchEvent(new Event("change"))` is
fine for setting a `<select>`.
