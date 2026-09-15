import { test as base, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import type { Surface } from "../generated/surface";
import { persona } from "../generated/personas";
import { seed } from "../generated/seed";
import { Mail } from "./mail";

// The one thing every acceptance test needs before it can do anything: which target it
// is running against, which in turn is which adapter under `tests/adapters/<target>/`
// the `surface` fixture below loads. There is no default, so an unset variable fails
// loudly here rather than as a confusing "adapter not found" error later.
function requireTarget(): string {
  const target = process.env.SDLC_TARGET;
  if (!target) throw new Error("SDLC_TARGET is not set; run tests as `SDLC_TARGET=<name> SDLC_TARGET_URL=<url> npm test`");
  return target;
}

// Adds `surface` and `mail` to Playwright's own fixtures. A test imports `test` and
// `expect` from here, never from `@playwright/test` directly, so it never has a way to
// reach `page` (see README.md for what the separation check refuses on that account).
// Puts the target's data back to the seed before every test, by running whatever command
// the runner named in `SDLC_RESET_COMMAND` (`sdlc oracle reseed` for the oracle). Without
// it, a test that deactivates an account or grants somebody administrator rights leaves
// that account changed for every test after it, and those tests fail for reasons that have
// nothing to do with what they are checking.
//
// A reset that fails stops the test rather than letting it run against whatever state was
// left behind: a suite that quietly carries one test's leftovers into the next is exactly
// what this exists to end. With no command named — a developer running the suite by hand
// against their own sandbox — nothing is reset and nothing is said.
// Which copy of the target this worker owns. Playwright numbers its workers from zero and
// keeps the number for the whole run, so a worker always talks to the same copy — and the
// copy it resets is its own, never one another worker is in the middle of using.
const copy = Number(process.env.TEST_PARALLEL_INDEX ?? 0);

function forThisWorker(name: string): string | undefined {
  return process.env[`${name}_${copy}`] ?? process.env[name];
}

function resetToSeed(): void {
  const command = forThisWorker("SDLC_RESET_COMMAND");
  if (!command) return;
  try {
    execSync(command, { stdio: "pipe", timeout: 120000 });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(`could not reset the target to its seed before this test: ${detail}`);
  }
}

export const test = base.extend<{ surface: Surface; mail: Mail; seeded: void }>({
  // Automatic, so every test gets it without naming it, and first, so the reset has
  // finished before the adapter opens anything.
  seeded: [async ({}, use) => { resetToSeed(); await use(); }, { auto: true }],
  surface: async ({ page }, use) => {
    const target = requireTarget();
    // A template string, not a static specifier: which adapter loads is a run-time
    // choice (the target under test), so this can only be a dynamic import.
    const mod = await import(`../adapters/${target}/index.ts`);
    const surface: Surface = await mod.default(page, { baseURL: forThisWorker("SDLC_TARGET_URL"), persona });
    await use(surface);
  },
  mail: async ({}, use) => {
    await use(new Mail(forThisWorker("SDLC_MAIL_API")));
  },
});

export { expect, persona, seed };
export { uploadFile } from "./upload";
export type { UploadRequest } from "./upload";
export type { Persona } from "../generated/personas";
export type { Seed } from "../generated/seed";
export type { Surface } from "../generated/surface";
