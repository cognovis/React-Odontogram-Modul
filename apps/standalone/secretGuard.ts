// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026
//
// cognovis/odontogram#62: a build fails when its output carries a secret.
//
// Vite inlines every exposed (`envPrefix`, by default `VITE_`) environment
// value into the JavaScript it writes, and a built bundle is served to whoever
// opens the page, so whatever secret is in it is public. That is how the live
// mode's Basic client secret would have shipped, and it is what this guard
// stops. Two checks:
//
//   - BEFORE building: an exposed key named like a secret that carries a value
//     is refused (Vite's resolved env, so the project's own `envPrefix` and
//     `.env.<mode>` files count, and `envDir: false` is honoured), and so is a
//     `define` entry carrying the value of a secret-named variable (each entry
//     on its own and as the string it encodes). Nothing is written.
//   - AFTER building: every file Vite wrote — chunks, assets, `index.html`,
//     source maps (inline ones decoded), files copied from `public/`, whatever
//     another plugin emitted or renamed — is read back from each output
//     directory and searched for the value of every secret-named variable the
//     build knows (the process environment and Vite's resolved env): as
//     written, JSON-escaped once, or inside the decoded bytes of any base64 run
//     (so inside a Basic `id:secret` too). A file that carries one is deleted
//     and the build fails. The check fails closed: a file or directory it
//     cannot read, and an output directory that is itself a symlink (read or
//     deleted through, it would reach outside the output), fail the build too.
//
// The second check reads the ARTIFACT, not the pipeline. Earlier versions
// scanned inside Rollup's hooks and kept losing to hook order (output plugins,
// later config hooks, parallel `buildEnd`, renamed entries, `output.file`);
// what is on disk once the build is done is the one thing every route ends in.
// It costs that a leaked file exists on the build machine until the check
// removes it a moment later.
//
// THE BOUNDARY. This guards against ACCIDENTAL exposure through configuration.
// The value scan is a plain substring search: linear in the output, and it
// cannot refuse a build whose files do not contain the value. It deliberately
// does not decode string literals, so it does not see a value the compiler
// re-escaped (a quote, backslash or control character written another way), a
// value split across files or rebuilt at run time, a value shorter than
// `MIN_SEARCHED_LENGTH`, any other encoding (hex, URL encoding, compression,
// encryption), a secret that exists only in a `.env` file and is copied into an
// exposed variable of another name, or a file another plugin writes after this
// check, in its own `closeBundle`. Deliberate obfuscation is out of scope for a
// build check. A decoding tokeniser was tried and dropped: it added false
// refusals, a crash on valid input and quadratic scans to normal builds.
//
// The development server is untouched (`apply: "build"`): it serves the
// developer's own machine, not a bundle anyone else loads.

import { lstatSync, readdirSync, readFileSync, rmSync } from "fs";
import { dirname, join, parse, relative, resolve, sep } from "path";
import type { Plugin, ResolvedConfig } from "vite";

const DEFAULT_PREFIXES = ["VITE_"];

/** A variable whose name says it holds something that must not be public. */
const SECRET_NAME = /SECRET|PASSWORD|PASSWD|TOKEN|PRIVATE|CREDENTIAL|API_?KEY/i;

/** Shorter values are not searched for: as substrings they match by accident. */
const MIN_SEARCHED_LENGTH = 8;

/** Base64 runs shorter than this are not decoded: eight bytes encode to 11 characters plus `=`. */
const MIN_BASE64_RUN = 11;

const BASE64_RUN = /[A-Za-z0-9+/]{11,}={0,2}/g;

type Env = Record<string, string | undefined>;

/** A variable's value, exactly as set. Vite's resolved env also carries booleans (`DEV`, `PROD`). */
function valueOf(env: Env, key: string): string | undefined {
  const value: unknown = env[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/** Exposed keys that are named like a secret and carry a value, sorted. */
export function exposedSecretKeys(env: Env, prefixes: readonly string[] = DEFAULT_PREFIXES): string[] {
  return Object.keys(env)
    .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)) && SECRET_NAME.test(key) && valueOf(env, key))
    .sort();
}

/**
 * What every base64 run in `text` decodes to. Decoding a run from its own
 * start reads a value at any offset inside it (a Basic `id:secret` too), and
 * a match in the decoded bytes is exact — unlike searching for the value's
 * own encoding, whose truncated ends also match other strings.
 */
function decodedBase64(text: string): string[] {
  return [...text.matchAll(BASE64_RUN)]
    .filter(([run]) => run.length >= MIN_BASE64_RUN)
    .map(([run]) => Buffer.from(run, "base64").toString("latin1"));
}

/** `value` as the bytes decoded base64 would show it. */
function asBytes(value: string): string {
  return Buffer.from(value, "utf8").toString("latin1");
}

/** Secret-named variables, of any prefix, whose value occurs in one of `files`. */
export function leakedSecretNames(files: string[], env: Env): string[] {
  const candidates = Object.keys(env).filter((key) => {
    const value = valueOf(env, key);
    return SECRET_NAME.test(key) && !!value && value.length >= MIN_SEARCHED_LENGTH;
  });
  if (!candidates.length) return [];
  const decoded = files.flatMap(decodedBase64);
  return candidates
    .filter((key) => {
      const value = valueOf(env, key)!;
      const escaped = JSON.stringify(value).slice(1, -1);
      const bytes = asBytes(value);
      return files.some((file) => file.includes(value) || file.includes(escaped)) || decoded.some((run) => run.includes(bytes));
    })
    .sort();
}

/** The text of a `define` value, and the string it encodes when it is a JSON literal. */
function defineTexts(value: unknown): string[] {
  if (typeof value !== "string") return [JSON.stringify(value) ?? ""];
  try {
    const decoded: unknown = JSON.parse(value);
    return typeof decoded === "string" ? [value, decoded] : [value];
  } catch {
    return [value];
  }
}

const INLINE_MAP = /data:application\/json;(?:charset=[\w-]+;)?base64,([A-Za-z0-9+/=]+)/g;

/** `text` with every inline (data-URL) source map decoded and appended. */
function withInlineMaps(text: string): string {
  const decoded = [...text.matchAll(INLINE_MAP)].map((match) => Buffer.from(match[1], "base64").toString("utf8"));
  return decoded.length ? `${text}\n${decoded.join("\n")}` : text;
}

/**
 * Every file under `dir`, as absolute paths. A missing directory has none. A
 * directory symlink is never followed — deleting through one would reach
 * outside the output; a symlinked file is kept, and only the link is ever
 * removed.
 */
function filesUnder(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    // Only a directory that is not there is empty; one that cannot be read
    // fails the check rather than passing it unread.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = lstatSync(path);
    return stat.isDirectory() ? filesUnder(path) : stat.isFile() || stat.isSymbolicLink() ? [path] : [];
  });
}

/** The errors a symlink is skipped for: it points nowhere, at a directory, or in a loop. */
const SKIPPED_LINK_ERRORS = new Set(["ENOENT", "EISDIR", "ELOOP", "ENOTDIR"]);

/**
 * A file's text. A symlink that points nowhere, at a directory or in a loop
 * has none; any other file that cannot be read — a regular one, or the target
 * of a link — fails the check rather than passing it unread.
 */
function readText(path: string): string | undefined {
  if (!lstatSync(path).isSymbolicLink()) return readFileSync(path, "utf8");
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (SKIPPED_LINK_ERRORS.has((error as NodeJS.ErrnoException).code ?? "")) return undefined;
    throw error;
  }
}

/** A file under an output directory that carries a secret-named variable's value. */
export interface LeakedFile {
  /** Absolute path. */
  path: string;
  /** Path relative to the output directory it was found in. */
  name: string;
  /** The variables whose values it carries. */
  keys: string[];
}

/**
 * Throws when an output root, or any directory between `base` (the project
 * root) and it, is a symlink: walking it would read, and delete, through the
 * link. Components above `base` are not checked — a project may itself live
 * under a symlinked home. A root outside `base` is checked from the deepest
 * directory the two share.
 */
function refuseSymlinkedRoot(dir: string, base: string): void {
  const target = resolve(dir);
  // A root on another volume (Windows) shares nothing with the project: check
  // it from its own filesystem root.
  let from = parse(resolve(base)).root === parse(target).root ? resolve(base) : parse(target).root;
  const outside = (rel: string) => rel === ".." || rel.startsWith(`..${sep}`);
  while (outside(relative(from, target)) && dirname(from) !== from) from = dirname(from);
  // The root itself, whatever the walk below covers: it may BE the project
  // root, or lie above it, and then there are no hops to check.
  let rootIsLink = false;
  try {
    rootIsLink = lstatSync(target).isSymbolicLink();
  } catch {
    return;
  }
  if (rootIsLink) {
    throw new Error(`Refusing to check the output directory ${dir}: it is a symlink, and nothing is deleted through one (cognovis/odontogram#62)`);
  }
  const hops = relative(from, target).split(sep).filter(Boolean);
  let path = from;
  for (const hop of hops) {
    path = join(path, hop);
    let isLink = false;
    try {
      isLink = lstatSync(path).isSymbolicLink();
    } catch {
      return;
    }
    if (isLink) {
      throw new Error(`Refusing to check the output directory ${dir}: ${path} is a symlink, and nothing is deleted through one (cognovis/odontogram#62)`);
    }
  }
}

/** The variables of any of `envs` whose value occurs in `text`, each named once. */
function leakedInAny(text: string, envs: readonly Env[]): string[] {
  return [...new Set(envs.flatMap((env) => leakedSecretNames([text], env)))].sort();
}

/**
 * The files under `dirs` that carry a secret-named variable's value — any
 * value it was seen with, in any of `env`'s snapshots. Each file is read once,
 * under the first directory that holds it.
 */
export function leakedFiles(dirs: Iterable<string>, env: Env | readonly Env[], base = process.cwd()): LeakedFile[] {
  const envs = Array.isArray(env) ? env : [env];
  const roots = [...new Set(dirs)];
  for (const dir of roots) refuseSymlinkedRoot(dir, base);
  const seen = new Set<string>();
  return roots.flatMap((dir) =>
    filesUnder(dir).flatMap((path): LeakedFile[] => {
      if (seen.has(path)) return [];
      seen.add(path);
      const text = readText(path);
      const keys = text === undefined ? [] : leakedInAny(withInlineMaps(text), envs);
      return keys.length ? [{ path, name: relative(dir, path), keys }] : [];
    }),
  );
}

/**
 * The Vite plugin. `given` is what the caller knows beyond Vite — the process
 * environment; the exposed variables Vite loads from `.env` files arrive with
 * the resolved config.
 */
export function secretGuard(given: Env): Plugin {
  // Every environment the build was seen with — the caller's, and Vite's
  // resolved env at each check. A value is matched in any of them, so a later
  // hook that blanks or changes a variable cannot make the guard forget the
  // value it had. Reset on every resolution: a reused plugin instance judges
  // that build's environments, not the last one's.
  let envs: Env[] = [{ ...given }];
  const seen = (resolved: Env | undefined): void => {
    if (resolved) envs.push({ ...resolved });
  };
  // Where each output was actually written, as Rollup reports it per output.
  const written = new Set<string>();
  // The resolved config, read again at the end: Vite copies public/ into the
  // CONFIGURED output directories, which an output plugin's `outputOptions`
  // can differ from.
  let resolvedConfig: Partial<ResolvedConfig> | undefined;
  const refuseConfiguredSecrets = (config: Partial<ResolvedConfig> | undefined): void => {
    const resolved = config?.env as Env | undefined;
    seen(resolved);
    // Exposed keys come from what Vite resolved ALONE — that is exactly what
    // it inlines, so `envDir: false` or an ignored `.env` cannot count as
    // exposed. Without a resolved env (a caller outside Vite) the caller's
    // copy stands in.
    const prefixes = config?.envPrefix ? [config.envPrefix].flat() : DEFAULT_PREFIXES;
    const exposed = exposedSecretKeys(resolved ?? given, prefixes);
    // Each entry on its own: serialising the whole object would encode an
    // already-encoded value a second time and hide it.
    const defineText = Object.values(config?.define ?? {}).flatMap(defineTexts);
    const defined = [...new Set(envs.flatMap((env) => leakedSecretNames(defineText, env)))].sort();
    if (defined.length) {
      throw new Error(
        `Refusing to build: a \`define\` entry carries the value of ${defined.join(", ")}, which would be `
        + "inlined into the browser bundle (cognovis/odontogram#62).",
      );
    }
    if (exposed.length) {
      throw new Error(
        `Refusing to build: ${exposed.join(", ")} would be inlined into the browser bundle. `
        + "A client secret never ships to a browser; a built live-mode app is to authenticate through "
        + "a SMART launch (cognovis/odontogram#62). Unset it for the build — the development server still reads it.",
      );
    }
  };
  return {
    name: "odontogram-secret-guard",
    apply: "build",
    enforce: "post",
    configResolved(config?: Partial<ResolvedConfig>) {
      written.clear();
      envs = [{ ...given }];
      resolvedConfig = config;
      refuseConfiguredSecrets(config);
    },
    // Again once every configResolved hook has run: a later one may add an
    // exposed secret or a `define` after the check above. Still nothing built.
    buildStart() {
      refuseConfiguredSecrets(resolvedConfig);
    },
    writeBundle(options) {
      // The final options of this output: its directory, or the directory of
      // its single file.
      const dir = options.dir ?? (options.file ? dirname(options.file) : undefined);
      if (dir) written.add(resolve(dir));
    },
    closeBundle(error?: Error) {
      // Everything is on disk now: every output written, `public/` copied.
      if (error || !written.size || resolvedConfig?.build?.write === false) return;
      const root = resolvedConfig?.root ?? "";
      // `||`, as Vite: an empty `output.dir` falls back to `build.outDir`.
      const configured = [resolvedConfig?.build?.rollupOptions?.output ?? {}].flat().flatMap((output) => {
        const dir = output.dir || resolvedConfig?.build?.outDir;
        return dir ? [resolve(root, dir)] : [];
      });
      // The resolved env once more: a hook may have changed it since.
      seen(resolvedConfig?.env as Env | undefined);
      const leaked = leakedFiles([...written, ...configured], envs, root || process.cwd());
      if (!leaked.length) return;
      for (const file of leaked) rmSync(file.path, { force: true });
      const names = [...new Set(leaked.flatMap((file) => file.keys))].sort();
      const where = leaked.map((file) => file.name).join(", ");
      throw new Error(
        `Refusing to ship a build that contains the value of ${names.join(", ")} (${where}); `
        + "the files were removed from the output; see cognovis/odontogram#62",
      );
    },
  };
}
