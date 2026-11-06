import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { expect, it } from "vitest";

it.each(["success", "emitter failure", "validator error"])("isolates and cleans each validator run on %s", (outcome) => {
  const root = mkdtempSync(join(tmpdir(), "odontogram-validator-test-"));
  const packageRoot = resolve(__dirname, "../..");
  const bin = join(root, "bin");
  mkdirSync(bin);
  const jar = join(root, "validator.jar");
  const ig = join(root, "dental-core");
  writeFileSync(jar, "");
  mkdirSync(ig);
  const realBun = execFileSync("bun", ["--print", "process.execPath"], { encoding: "utf8" }).trim();
  writeFileSync(join(bin, "bun"), '#!/bin/sh\nprintf "%s\\n" "$@" > "$EMITTER_ARGS"\nif test "$EMITTER_FAIL" = "1"; then exit 9; fi\nexec "$REAL_BUN" "$@"\n', { mode: 0o700 });
  writeFileSync(join(bin, "java"), '#!/bin/sh\nif test "$1" != "-version"; then\n  printf "%s\\n" "$@" >> "$VALIDATOR_ARGS"\n  if test ! -f "$4" || test "$VALIDATOR_FAIL" = "1"; then printf ": Error - invalid fixture\\n"; fi\nfi\n', { mode: 0o700 });
  const workdirs: string[] = [];
  try {
    for (let run = 0; run < 2; run++) {
      const emitterArgs = join(root, `emitter-${run}`);
      const validatorArgs = join(root, `validator-${run}`);
      const result = spawnSync(process.execPath, ["tools/fhir-validate.mjs"], {
        cwd: packageRoot,
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TMPDIR: root,
          FHIR_VALIDATOR_JAR: jar, FHIR_DENTAL_CORE_IG: ig,
          EMITTER_ARGS: emitterArgs, VALIDATOR_ARGS: validatorArgs, REAL_BUN: realBun,
          EMITTER_FAIL: outcome === "emitter failure" ? "1" : "0",
          VALIDATOR_FAIL: outcome === "validator error" ? "1" : "0" },
      });
      expect(result.status, result.stderr?.toString()).toBe(outcome === "emitter failure" ? 9 : outcome === "validator error" ? 1 : 0);
      const args = readFileSync(emitterArgs, "utf8").trim().split("\n");
      expect(args[0]).toBe("tools/emit-hl7-validator-fixtures.ts");
      expect(args[1]).toBeTruthy();
      const workdir = args[1];
      expect(dirname(workdir)).toBe(root);
      if (outcome !== "emitter failure") {
        expect(readFileSync(validatorArgs, "utf8")).toContain(join(workdir, "observed-dental-core.json"));
        expect(readFileSync(validatorArgs, "utf8")).toContain(join(workdir, "planned-dental-core.json"));
      }
      expect(existsSync(workdir)).toBe(false);
      workdirs.push(workdir);
    }
    expect(new Set(workdirs).size).toBe(2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
