// @vitest-environment node
// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// cognovis/odontogram#62: no secret ships in a build by accident.
//
// Vite inlines every exposed environment value into the JavaScript it emits,
// and a built bundle is served to whoever opens the page. The guard refuses an
// exposed secret-named key and a `define` entry carrying a secret before
// building, and after building reads back every file Vite wrote: one carrying
// a secret-named variable's value (as written, JSON-escaped once, or in decoded
// base64) is removed and the build fails. The boundary is in the header of
// `secretGuard.ts`.

import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { build } from "vite";
import type { Plugin } from "vite";
import { exposedSecretKeys, leakedFiles, leakedSecretNames, secretGuard } from "../../secretGuard";

const SECRET = "c0rrect-h0rse-battery-staple";

type Hook = (...args: unknown[]) => void;
const configResolved = (plugin: ReturnType<typeof secretGuard>) => plugin.configResolved as Hook;

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

describe("cognovis/odontogram#62: secret guard", () => {
  it("names every exposed secret-like key that carries a value", () => {
    expect(exposedSecretKeys({
      VITE_AIDBOX_CLIENT_SECRET: SECRET,
      VITE_API_TOKEN: "t0ken-value-1234",
      VITE_ADMIN_PASSWORD: "hunter2hunter2",
      VITE_PRIVATE_KEY: "-----BEGIN-----",
      VITE_AIDBOX_CLIENT_ID: "odontogram-live",
      VITE_AIDBOX_BASE_URL: "http://localhost:8081",
      VITE_EMPTY_SECRET: "   ",
      AIDBOX_ADMIN_PASSWORD: "not-exposed-123",
    })).toEqual(["VITE_ADMIN_PASSWORD", "VITE_AIDBOX_CLIENT_SECRET", "VITE_API_TOKEN", "VITE_PRIVATE_KEY"]);
  });

  it("honours a changed envPrefix", () => {
    expect(exposedSecretKeys({ APP_CLIENT_SECRET: SECRET, VITE_CLIENT_SECRET: SECRET }, ["APP_"])).toEqual(["APP_CLIENT_SECRET"]);
  });

  it("finds a secret value as written, JSON-escaped once, or base64", () => {
    const env = { AIDBOX_ADMIN_PASSWORD: SECRET, VITE_AIDBOX_CLIENT_ID: "odontogram-live", SHORT_TOKEN: "abc" };
    expect(leakedSecretNames([`const p="${SECRET}";`, "nothing here"], env)).toEqual(["AIDBOX_ADMIN_PASSWORD"]);
    expect(leakedSecretNames([Buffer.from(SECRET).toString("base64")], env)).toEqual(["AIDBOX_ADMIN_PASSWORD"]);
    expect(leakedSecretNames([JSON.stringify('a"b\\c-d3adbeef')], { DB_PASSWORD: 'a"b\\c-d3adbeef' })).toEqual(["DB_PASSWORD"]);
    expect(leakedSecretNames(["odontogram-live abc"], env)).toEqual([]);
  });

  it("finds an eight- to ten-character value inside a Basic credential at every offset", () => {
    for (const secret of ["password", "passw0rd9", "pa55word10", SECRET]) {
      for (const id of ["id", "odontogram-live", "x"]) {
        const header = `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
        expect(leakedSecretNames([header], { DB_PASSWORD: secret }), `${id}:${secret}`).toEqual(["DB_PASSWORD"]);
      }
    }
    expect(leakedSecretNames(["Basic aWQ6cGFzc3dvcmQ="], { DB_PASSWORD: "password" })).toEqual(["DB_PASSWORD"]);
    expect(leakedSecretNames(['x="cGFzc3dvcmQ="'], { DB_PASSWORD: "password" })).toEqual(["DB_PASSWORD"]);
  });

  it("does not match a base64 look-alike or a value shorter than eight characters", () => {
    expect(leakedSecretNames([Buffer.from("passwore").toString("base64")], { DB_PASSWORD: "password" })).toEqual([]);
    expect(leakedSecretNames(['const p="hunter2";'], { DB_PASSWORD: "hunter2" })).toEqual([]);
  });

  it("finds the files under an output directory that carry a secret", () => {
    const dir = tempDir("gh62-out-");
    try {
      mkdirSync(join(dir, "assets"));
      writeFileSync(join(dir, "assets", "a.js"), `x("${SECRET}")`);
      writeFileSync(join(dir, "b.js"), "clean");
      const found = leakedFiles([dir, dir], { DB_PASSWORD: SECRET });
      expect(found.map(({ name, keys }) => [name, keys])).toEqual([[join("assets", "a.js"), ["DB_PASSWORD"]]]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("never follows a directory symlink, and removes only a symlinked file's link", () => {
    const dir = tempDir("gh62-out-");
    const outside = tempDir("gh62-outside-");
    try {
      writeFileSync(join(outside, "config.json"), `{"k":"${SECRET}"}`);
      symlinkSync(outside, join(dir, "shared"));
      symlinkSync(join(outside, "config.json"), join(dir, "linked.json"));
      symlinkSync(join(outside, "missing.json"), join(dir, "broken.json"));
      const found = leakedFiles([dir], { DB_PASSWORD: SECRET });
      expect(found.map(({ name }) => name)).toEqual(["linked.json"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("fails closed on a regular file it cannot read", () => {
    const dir = tempDir("gh62-out-");
    try {
      writeFileSync(join(dir, "locked.js"), `x("${SECRET}")`);
      chmodSync(join(dir, "locked.js"), 0o000);
      expect(() => leakedFiles([dir], { DB_PASSWORD: SECRET })).toThrow();
    } finally {
      chmodSync(join(dir, "locked.js"), 0o600);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a symlinked output root without deleting through it", () => {
    const outside = tempDir("gh62-outside-");
    const parent = tempDir("gh62-parent-");
    try {
      writeFileSync(join(outside, "operator.env"), `DB_PASSWORD=${SECRET}`);
      symlinkSync(outside, join(parent, "dist"));
      expect(() => leakedFiles([join(parent, "dist")], { DB_PASSWORD: SECRET })).toThrow(/symlink/);
      expect(existsSync(join(outside, "operator.env"))).toBe(true);
    } finally {
      rmSync(parent, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("fails closed on a directory it cannot read, and treats a missing one as empty", () => {
    const dir = tempDir("gh62-out-");
    try {
      mkdirSync(join(dir, "locked"));
      writeFileSync(join(dir, "locked", "a.js"), `x("${SECRET}")`);
      chmodSync(join(dir, "locked"), 0o000);
      expect(() => leakedFiles([dir], { DB_PASSWORD: SECRET })).toThrow();
      expect(leakedFiles([join(dir, "missing")], { DB_PASSWORD: SECRET })).toEqual([]);
    } finally {
      chmodSync(join(dir, "locked"), 0o700);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses an output root reached through a directory symlink below the project", () => {
    const project = tempDir("gh62-project-");
    const outside = tempDir("gh62-outside-");
    try {
      mkdirSync(join(outside, "nested"));
      writeFileSync(join(outside, "nested", "operator.env"), `DB_PASSWORD=${SECRET}`);
      mkdirSync(join(project, "dist"));
      symlinkSync(outside, join(project, "dist", "link"));
      expect(() => leakedFiles([join(project, "dist", "link", "nested")], { DB_PASSWORD: SECRET }, project)).toThrow(/symlink/);
      expect(existsSync(join(outside, "nested", "operator.env"))).toBe(true);
    } finally {
      rmSync(project, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("handles a directory whose name starts with two dots, outside the project", () => {
    const parent = tempDir("gh62-parent-");
    try {
      mkdirSync(join(parent, "..dist"));
      writeFileSync(join(parent, "..dist", "a.js"), `x("${SECRET}")`);
      const found = leakedFiles([join(parent, "..dist")], { DB_PASSWORD: SECRET }, join(parent, "project"));
      expect(found.map(({ name }) => name)).toEqual(["a.js"]);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  it("fails closed on a symlinked file whose target it cannot read", () => {
    const dir = tempDir("gh62-out-");
    const outside = tempDir("gh62-outside-");
    try {
      writeFileSync(join(outside, "locked.js"), `x("${SECRET}")`);
      chmodSync(join(outside, "locked.js"), 0o000);
      symlinkSync(join(outside, "locked.js"), join(dir, "linked.js"));
      expect(() => leakedFiles([dir], { DB_PASSWORD: SECRET })).toThrow();
    } finally {
      chmodSync(join(outside, "locked.js"), 0o600);
      rmSync(dir, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("refuses a symlinked output root that is the project root or above it", () => {
    const outside = tempDir("gh62-outside-");
    const parent = tempDir("gh62-parent-");
    try {
      writeFileSync(join(outside, "operator.env"), `DB_PASSWORD=${SECRET}`);
      mkdirSync(join(outside, "child"));
      symlinkSync(outside, join(parent, "project"));
      const linked = join(parent, "project");
      expect(() => leakedFiles([linked], { DB_PASSWORD: SECRET }, linked)).toThrow(/symlink/);
      expect(() => leakedFiles([linked], { DB_PASSWORD: SECRET }, join(linked, "child"))).toThrow(/symlink/);
      expect(existsSync(join(outside, "operator.env"))).toBe(true);
    } finally {
      rmSync(parent, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("matches every value a variable was seen with", () => {
    const dir = tempDir("gh62-out-");
    try {
      writeFileSync(join(dir, "a.js"), `x("${SECRET}")`);
      const found = leakedFiles([dir], [{ DB_PASSWORD: SECRET }, { DB_PASSWORD: "" }]);
      expect(found.map(({ name, keys }) => [name, keys])).toEqual([["a.js", ["DB_PASSWORD"]]]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses the build when a secret key is exposed", () => {
    const plugin = secretGuard({ VITE_AIDBOX_CLIENT_SECRET: SECRET });
    expect(plugin.apply).toBe("build");
    expect(() => configResolved(plugin)({})).toThrow(/VITE_AIDBOX_CLIENT_SECRET/);
  });

  it("judges each resolution's own environment when one plugin instance is reused", () => {
    const resolve = configResolved(secretGuard({}));
    expect(() => resolve({ env: { VITE_CLIENT_SECRET: "" } })).not.toThrow();
    expect(() => resolve({ env: { VITE_CLIENT_SECRET: SECRET } })).toThrow(/VITE_CLIENT_SECRET/);
    expect(() => resolve({ env: { VITE_CLIENT_SECRET: "", DEV: true, PROD: false } })).not.toThrow();
  });

  it("is wired into the app's build with the process environment and no env loading of its own", () => {
    const config = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../vite.config.ts"), "utf8");
    expect(config).toMatch(/plugins:\s*\[[^\]]*secretGuard\(\{ \.\.\.process\.env \}\)/);
    // Vite's `vite:env` debug log prints what loadEnv returns; a second call
    // here would read and print an `.env` the build was told to ignore.
    expect(config).not.toMatch(/loadEnv/);
  });

  describe("in a real vite build", () => {
    // Exposed variables come from the process environment too, and HOME and
    // the XDG directories point into a temporary home, per the test-suite
    // upkeep standard.
    const HOME_KEYS = ["HOME", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_STATE_HOME", "XDG_CACHE_HOME"];
    let saved: Record<string, string | undefined> = {};
    let home = "";
    beforeEach(() => {
      saved = {};
      for (const key of [...Object.keys(process.env).filter((name) => /^(VITE_|APP_)/.test(name)), ...HOME_KEYS]) {
        saved[key] = process.env[key];
        delete process.env[key];
      }
      home = tempDir("gh62-home-");
      process.env.HOME = home;
      process.env.XDG_CONFIG_HOME = join(home, ".config");
      process.env.XDG_DATA_HOME = join(home, ".local/share");
      process.env.XDG_STATE_HOME = join(home, ".local/state");
      process.env.XDG_CACHE_HOME = join(home, ".cache");
    });
    afterEach(() => {
      for (const key of HOME_KEYS) delete process.env[key];
      for (const [key, value] of Object.entries(saved)) if (value !== undefined) process.env[key] = value;
      rmSync(home, { recursive: true, force: true });
    });

    const page = (extra = "") => `<!doctype html><html><body>${extra}<script type="module" src="/main.js"></script></body></html>`;

    /** A real build of a throwaway project; the result names what ended up on disk. */
    async function buildOf(
      files: Record<string, string>,
      env: Record<string, string>,
      options: { plugins?: (root: string) => Plugin[]; build?: (root: string) => Record<string, unknown>; [key: string]: unknown } = {},
    ) {
      const root = tempDir("gh62-guard-");
      for (const [name, text] of Object.entries({ "index.html": page(), ...files })) {
        mkdirSync(dirname(join(root, name)), { recursive: true });
        writeFileSync(join(root, name), text);
      }
      const { plugins, build: buildOptions, ...rest } = options;
      const outDir = join(root, "dist");
      let message = "";
      try {
        await build({
          root, configFile: false, logLevel: "silent", ...rest,
          plugins: [...(plugins?.(root) ?? []), secretGuard(env)],
          build: { outDir, emptyOutDir: true, ...(buildOptions?.(root) ?? {}) },
        });
      } catch (error) {
        message = String((error as Error).message);
      }
      const written = existsSync(outDir) ? readdirSync(outDir, { recursive: true }).map(String) : [];
      rmSync(root, { recursive: true, force: true });
      return { ok: message === "", message, written };
    }
    const env = { DEMO_DB_PASSWORD: SECRET };
    const refused = (file: string) => new RegExp(`contains the value of DEMO_DB_PASSWORD \\(${file}\\); the files were removed`);

    it("builds a project without secrets", async () => {
      const result = await buildOf({ "main.js": "console.log('ok')" }, env);
      expect(result.ok, result.message).toBe(true);
    });

    it("builds normal code a decoding scanner misread, with a secret configured", async () => {
      // A decoding tokeniser falsely matched the cooked text of a raw template
      // and threw on an out-of-range code point; a substring scan does neither.
      const code = "console.log(String.raw`\\u0061bcd`, String.raw`\\u{110000}`, /\"/.test('x'), \"it's\")";
      const result = await buildOf({ "main.js": code }, { DB_PASSWORD: "abcdabcd-not-in-output" });
      expect(result.ok, result.message).toBe(true);
    });

    it("refuses an exposed secret under the project's own envPrefix, from .env.production, writing nothing", async () => {
      const result = await buildOf({ "main.js": "console.log('ok')", ".env.production": `APP_CLIENT_SECRET=${SECRET}\n` }, {}, { envPrefix: "APP_" });
      expect(result.message).toMatch(/Refusing to build: APP_CLIENT_SECRET would be inlined/);
      expect(result.written).toEqual([]);
    });

    it("does not refuse an ignored .env (envDir: false)", async () => {
      const result = await buildOf({ "main.js": "console.log('ok')", ".env": `VITE_CLIENT_SECRET=${SECRET}\n` }, {}, { envDir: false });
      expect(result.ok, result.message).toBe(true);
    });

    it("refuses a secret a later configResolved hook adds to the env or to define", async () => {
      const lateSecret: Plugin = {
        name: "late-secret",
        configResolved: {
          order: "post",
          handler(config) {
            (config.env as Record<string, unknown>).VITE_AIDBOX_CLIENT_SECRET = SECRET;
            (config.define as Record<string, unknown>).__LATE__ = JSON.stringify(SECRET);
          },
        },
      };
      const result = await buildOf({ "main.js": "console.log(import.meta.env.VITE_AIDBOX_CLIENT_SECRET, __LATE__)" }, {}, { plugins: () => [lateSecret], define: {} });
      expect(result.message).toMatch(/Refusing to build: .*VITE_AIDBOX_CLIENT_SECRET/);
      expect(result.written).toEqual([]);
    });

    it("refuses a secret leaked through define, quote and backslash included, writing nothing", async () => {
      for (const secret of [SECRET, 'q"uo\\te-back\\slash']) {
        const result = await buildOf({ "main.js": "console.log(__LEAK__)" }, { DEMO_DB_PASSWORD: secret }, { define: { __LEAK__: JSON.stringify(secret) } });
        expect(result.message, secret).toMatch(/a `define` entry carries the value of DEMO_DB_PASSWORD/);
        expect(result.written).toEqual([]);
      }
    });

    it("refuses and removes a secret hard-coded in emitted JavaScript", async () => {
      const result = await buildOf({ "main.js": `console.log(${JSON.stringify(SECRET)})` }, env);
      expect(result.message).toMatch(refused("assets/index-[\\w-]+\\.js"));
      expect(result.written.filter((name) => name.endsWith(".js"))).toEqual([]);
    });

    it("refuses and removes a secret hard-coded in index.html", async () => {
      const result = await buildOf({ "index.html": page(`<meta name="k" content="${SECRET}">`), "main.js": "console.log('ok')" }, env);
      expect(result.message).toMatch(refused("index\\.html"));
      expect(result.written).not.toContain("index.html");
    });

    it("refuses and removes a secret in a file copied from public/", async () => {
      const result = await buildOf({ "main.js": "console.log('ok')", "public/config.json": `{"k":"${SECRET}"}` }, env);
      expect(result.message).toMatch(refused("config\\.json"));
      expect(result.written).not.toContain("config.json");
    });

    it("does not refuse a public/ file Vite does not copy (copyPublicDir: false, write: false)", async () => {
      for (const buildOptions of [{ copyPublicDir: false }, { write: false }]) {
        const result = await buildOf({ "main.js": "console.log('ok')", "public/k.txt": SECRET }, env, { build: () => buildOptions });
        expect(result.ok, `${JSON.stringify(buildOptions)}: ${result.message}`).toBe(true);
      }
    });

    it("refuses and removes a secret that survives only in a source map, inline or external", async () => {
      for (const sourcemap of ["inline", true] as const) {
        const result = await buildOf({ "main.js": `// ${SECRET}\nconsole.log('ok')` }, env, { build: () => ({ sourcemap }) });
        expect(result.message, String(sourcemap)).toMatch(refused("assets/index-[\\w-]+\\.js(\\.map)?"));
      }
    });

    it("builds when a later output plugin removes the only copy of a secret (a source map)", async () => {
      const dropMaps = {
        name: "drop-maps",
        generateBundle: {
          order: "post" as const,
          handler(_options: unknown, bundle: Record<string, unknown>) {
            for (const name of Object.keys(bundle)) if (name.endsWith(".map")) delete bundle[name];
          },
        },
      };
      const result = await buildOf({ "main.js": `// ${SECRET}\nconsole.log('ok')` }, env, {
        build: () => ({ sourcemap: "hidden", rollupOptions: { output: { plugins: [dropMaps] } } }),
      });
      expect(result.ok, result.message).toBe(true);
    });

    it("refuses and removes what a later output plugin or config hook emits or renames", async () => {
      const emitter = (fileName: string) => ({
        name: `emit-${fileName}`,
        generateBundle: {
          order: "post" as const,
          handler(this: { emitFile: (file: { type: "asset"; fileName: string; source: string }) => void }) {
            this.emitFile({ type: "asset", fileName, source: `{"k":"${SECRET}"}` });
          },
        },
      });
      const viaOutput = await buildOf({ "main.js": "console.log('ok')" }, env, { build: () => ({ rollupOptions: { output: { plugins: [emitter("out.json")] } } }) });
      expect(viaOutput.message).toMatch(refused("out\\.json"));
      expect(viaOutput.written).not.toContain("out.json");

      const lateResolved: Plugin = {
        name: "late-resolved",
        configResolved: {
          order: "post",
          async handler(config) {
            await Promise.resolve();
            const rollupOptions = config.build.rollupOptions;
            const output = (rollupOptions.output ?? {}) as { plugins?: unknown[] };
            rollupOptions.output = { ...output, plugins: [...(output.plugins ?? []), emitter("resolved.json")] } as never;
          },
        },
      };
      const viaResolved = await buildOf({ "main.js": "console.log('ok')" }, env, { plugins: () => [lateResolved] });
      expect(viaResolved.message).toMatch(refused("resolved\\.json"));
      expect(viaResolved.written).not.toContain("resolved.json");

      const rename = {
        name: "rename",
        generateBundle: {
          order: "post" as const,
          handler(_options: unknown, bundle: Record<string, { fileName: string }>) {
            for (const file of Object.values(bundle)) if (file.fileName.endsWith(".js")) file.fileName = `renamed-${file.fileName.split("/").pop()}`;
          },
        },
      };
      const renamed = await buildOf({ "main.js": `console.log(${JSON.stringify(SECRET)})` }, env, { build: () => ({ rollupOptions: { output: { plugins: [rename] } } }) });
      expect(renamed.message).toMatch(refused("renamed-index-[\\w-]+\\.js"));
      expect(renamed.written.filter((name) => name.includes("renamed-"))).toEqual([]);
    });

    it("refuses and removes what another plugin writes into public/ during the build", async () => {
      const lateWriters = (root: string): Plugin[] => [
        { name: "transform-writer", transform(code, id) { if (id.endsWith("main.js")) writeFileSync(join(root, "public", "t.json"), `{"k":"${SECRET}"}`); return code; } },
        { name: "build-end-writer", enforce: "post", buildEnd: { order: "post", async handler() { await new Promise((done) => setTimeout(done, 30)); writeFileSync(join(root, "public", "b.json"), `{"k":"${SECRET}"}`); } } },
      ];
      const result = await buildOf({ "main.js": "console.log('ok')", "public/.keep": "" }, env, { plugins: lateWriters });
      expect(result.message).toMatch(/contains the value of DEMO_DB_PASSWORD \((b\.json, t\.json|t\.json, b\.json)\); the files were removed/);
      expect(result.written.filter((name) => name.endsWith(".json"))).toEqual([]);
    });

    it("scans every output directory", async () => {
      const multi = await buildOf({ "main.js": `console.log(${JSON.stringify(SECRET)})` }, env, {
        build: (root) => ({ rollupOptions: { output: [{ dir: join(root, "dist") }, { dir: join(root, "dist-b") }] } }),
      });
      expect(multi.message).toMatch(/contains the value of DEMO_DB_PASSWORD \(assets\/index-[\w-]+\.js, assets\/index-[\w-]+\.js\)/);
    });

    it("scans the configured output directory when an output plugin redirects the written one", async () => {
      const redirect = (root: string) => ({
        name: "redirect",
        outputOptions(options: Record<string, unknown>) {
          return { ...options, dir: join(root, "elsewhere") };
        },
      });
      const result = await buildOf({ "main.js": "console.log('ok')", "public/config.json": `{"k":"${SECRET}"}` }, env, {
        build: (root) => ({ rollupOptions: { output: { plugins: [redirect(root)] } } }),
      });
      expect(result.message).toMatch(refused("config\\.json"));
      expect(result.written).not.toContain("config.json");
    });

    it("refuses a secret a writeBundle hook blanks in the resolved env, and an empty output.dir", async () => {
      const blank: Plugin = {
        name: "blank",
        configResolved(config) { (config as { env: Record<string, unknown> }).env.DEMO_DB_PASSWORD = SECRET; },
        writeBundle() { /* replaced below */ },
      };
      let resolved: { env: Record<string, unknown> } | undefined;
      blank.configResolved = (config) => { resolved = config as never; resolved!.env.DEMO_DB_PASSWORD = SECRET; };
      blank.writeBundle = () => { if (resolved) resolved.env.DEMO_DB_PASSWORD = ""; };
      const blanked = await buildOf({ "main.js": "console.log('ok')", "public/config.json": `{"k":"${SECRET}"}` }, {}, { plugins: () => [blank] });
      expect(blanked.message).toMatch(refused("config\\.json"));

      const redirect = (root: string) => ({ name: "redirect", outputOptions: (options: Record<string, unknown>) => ({ ...options, dir: join(root, "elsewhere") }) });
      const emptyDir = await buildOf({ "main.js": "console.log('ok')", "public/config.json": `{"k":"${SECRET}"}` }, env, {
        build: (root) => ({ rollupOptions: { output: { dir: "", plugins: [redirect(root)] } } }),
      });
      expect(emptyDir.message).toMatch(refused("config\\.json"));
    });

    it("does not refuse old output nested in public/ that Vite clears instead of copying", async () => {
      const result = await buildOf({ "main.js": "console.log('ok')", "public/dist/old.json": `{"k":"${SECRET}"}` }, env, {
        build: (root) => ({ outDir: join(root, "public", "dist") }),
      });
      expect(result.ok, result.message).toBe(true);
    });
  });
});
