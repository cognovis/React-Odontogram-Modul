// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Cognovis fork - https://github.com/cognovis/React-Odontogram-Modul
// Dirk Saeger, Malte Sussdorff 2026
//
// Aufgerufen wird sie mit `node tools/browser/inspect.mjs`. Die Raute-Zeile
// stand hier bis zum 20.08.2026 mitten in der Datei, weil der Lizenzkopf
// nachtraeglich davorgesetzt wurde - und ein Shebang gilt nur in Zeile 1.
// Node brach mit "Invalid or unexpected token" ab, also lief das Werkzeug
// ueberhaupt nicht mehr.
//
// A measuring tool for the RUNNING app. Not a substitute for a test: it answers
// the questions the source cannot settle, because only the browser resolves
// layout, transforms and orientation. Two chart bugs were found exactly this
// way - in both cases the source read correctly.
//
// No dependencies: `fetch` and `WebSocket` have been built in since Node 22,
// and what it speaks is the Chrome DevTools Protocol.
//
// Prerequisites:
//   npm run dev
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless --disable-gpu --remote-debugging-port=9222 \
//     --window-size=1600,1300 http://localhost:5173/
//
// Usage:
//   node tools/browser/inspect.mjs templates
//   node tools/browser/inspect.mjs orientation
//   node tools/browser/inspect.mjs labels
//   node tools/browser/inspect.mjs shot [file.png] [css-selector]

const ENDPOINT = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  let targets;
  try {
    targets = await (await fetch(`${ENDPOINT}/json`)).json();
  } catch {
    fail(`no browser reachable at ${ENDPOINT} - see the head of this file`);
  }
  const page = targets.find((t) => t.type === "page");
  if (!page) fail("no page target found");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const done = pending.get(m.id);
    if (done) { pending.delete(m.id); done(m); }
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true });
    if (r.result?.exceptionDetails) fail(r.result.exceptionDetails.exception?.description || "evaluation failed");
    return r.result?.result?.value;
  };

  await send("Page.enable");
  return { send, evaluate, close: () => ws.close() };
}

function fail(msg) {
  console.error(`inspect: ${msg}`);
  process.exit(1);
}

/** Switch to the periodontal view unless it is already showing. The chart
 *  hangs off a toggle whose DOM codename is still `dentalChart`, which is why
 *  the text is searched as well as the id. */
async function showPerio({ evaluate }) {
  const ok = await evaluate(`(() => {
    if (document.querySelector('svg.perio-tooth-arch')) return true;
    const b = [...document.querySelectorAll('#appViewToggle button')]
      .find(x => /perio/i.test(x.id + x.textContent));
    if (!b) return false;
    b.click();
    return true;
  })()`);
  if (!ok) fail("periodontal toggle not found");
  await sleep(2000);
}

// ---------------------------------------------------------------------------

/** Which tooth is drawn from which template - read off the RENDERED DOM, not
 *  off TOOTH_TEMPLATE. Answers questions of the form "does the lower molar
 *  really use the two-rooted shape?". */
async function templates(cdp) {
  await showPerio(cdp);
  const rows = await cdp.evaluate(`JSON.stringify(
    [...document.querySelectorAll('svg.perio-tooth-arch')].map(svg => ({
      band: svg.getAttribute('class').replace('perio-tooth-arch ', ''),
      teeth: [...svg.querySelectorAll('[data-tooth][data-tpl]')]
        .map(g => g.getAttribute('data-tooth') + ':' + g.getAttribute('data-tpl')).join(' '),
    })))`);
  for (const r of JSON.parse(rows)) console.log(`${r.band}\n  ${r.teeth}`);
}

/** Do the roots of each band point cranially or caudally, and does that agree
 *  with the jaw?
 *
 *  Measured off the mm-grid LABELS, never off the bounding boxes of the crown
 *  and root groups: `getBoundingClientRect` ignores `clip-path`, and since the
 *  root is drawn as a second, clipped copy the two boxes overlap completely.
 *  The grid runs from the CEJ toward the root by construction, so it is the
 *  reliable pointer. */
async function orientation(cdp) {
  await showPerio(cdp);
  const rows = await cdp.evaluate(`JSON.stringify(
    [...document.querySelectorAll('svg.perio-tooth-arch')].map(svg => {
      const tooth = svg.querySelector('[data-tooth]')?.getAttribute('data-tooth');
      const texts = [...svg.querySelectorAll('text')]
        .map(n => ({ t: n.textContent.trim(), y: n.getBoundingClientRect().top }));
      const y5 = texts.find(x => x.t === '5'), y15 = texts.find(x => x.t === '15');
      const jaw = Number(tooth) < 30 ? 'upper' : 'lower';
      const dir = (!y5 || !y15) ? '?' : (y15.y < y5.y ? 'cranial' : 'caudal');
      return {
        jaw, tooth,
        band: svg.getAttribute('class').replace('perio-tooth-arch perio-tooth-arch-', ''),
        dir, want: jaw === 'upper' ? 'cranial' : 'caudal',
      };
    }))`);
  let bad = 0;
  for (const r of JSON.parse(rows)) {
    const ok = r.dir === r.want;
    if (!ok) bad++;
    console.log(`${ok ? "OK" : "!!"} ${r.jaw.padEnd(5)} ${r.band.padEnd(8)} (tooth ${r.tooth}): root ${r.dir}, expected ${r.want}`);
  }
  console.log(bad ? `\n${bad} band(s) upside down` : "\nevery band correctly oriented");
  if (bad) process.exitCode = 1;
}

/** The row labels of both arches - the upper must read "Palatal ...", the
 *  lower "Lingual ...". */
async function labels(cdp) {
  await showPerio(cdp);
  const out = await cdp.evaluate(`JSON.stringify(
    [...document.querySelectorAll('*')]
      .filter(n => n.children.length === 0 && /^(Buccal|Palatal|Lingual)\\s/.test(n.textContent.trim()))
      .map(n => n.textContent.trim()))`);
  for (const l of JSON.parse(out)) console.log("  " + l);
}

/** Screenshot of the page or of one element.
 *
 *  Careful: `Page.captureScreenshot`'s `clip` is in DOCUMENT coordinates while
 *  `getBoundingClientRect` returns viewport coordinates. Without adding the
 *  scroll offset the result is an empty image. */
async function shot(cdp, file = "shot.png", selector = null) {
  const clip = selector
    ? JSON.parse(await cdp.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return 'null';
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        return JSON.stringify({
          x: Math.round(r.x + window.scrollX), y: Math.round(r.y + window.scrollY),
          width: Math.round(r.width), height: Math.round(r.height), scale: 1,
        });
      })()`))
    : null;
  if (selector && !clip) fail(`selector matched nothing: ${selector}`);
  if (clip) await sleep(500);
  const res = await cdp.send("Page.captureScreenshot", clip ? { format: "png", clip } : { format: "png" });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(file, Buffer.from(res.result.data, "base64"));
  console.log(`written: ${file}`);
}

// ---------------------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);
const commands = { templates, orientation, labels, shot };
if (!cmd || !commands[cmd]) {
  console.error(`usage: node tools/browser/inspect.mjs <${Object.keys(commands).join("|")}> [args]`);
  process.exit(1);
}
const cdp = await connect();
try {
  await commands[cmd](cdp, ...rest);
} finally {
  cdp.close();
}
