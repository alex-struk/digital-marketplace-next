import { test as base, expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
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

// What a failing test leaves behind for whoever has to find out why, without the test's code:
// the last steps it took through the surface, each named as the contract names it, with the
// page it ended on and what it read there; the page's accessible outline at the moment it
// failed; and a picture of the page. The runner reads them off the report
// (`docs/decisions/0091-a-failure-says-where-it-was-and-what-it-saw.md`).
type Step = { step: string; given?: string; at?: string; read?: string; empty?: true; threw?: string };

const KEPT_STEPS = 12;
const OUTLINE_LIMIT = 6000;
const secret = process.env.SDLC_SANDBOX_PASSWORD;

function scrub(text: string): string {
  return secret ? text.split(secret).join("[password]") : text;
}

function clip(text: string, n: number): string {
  const one = scrub(text).replace(/\s+/g, " ").trim();
  return one.length > n ? `${one.slice(0, n - 1)}…` : one;
}

// An argument as a reader needs it named: a persona by its id, a value by its value, a record
// by the fields it carried. Never the whole of anything, which could be large or private.
function describe(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "string") return JSON.stringify(clip(value, 40));
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.length} item${value.length === 1 ? "" : "s"}]`;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.id === "string" && "can" in o) return `persona ${o.id}`;
    const keys = Object.keys(o);
    return `{${keys.slice(0, 6).join(", ")}${keys.length > 6 ? ", …" : ""}}`;
  }
  return typeof value;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === null || (Array.isArray(value) && value.length === 0);
}

function summarise(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(clip(value, 160));
  if (Array.isArray(value)) {
    const shown = value.slice(0, 4).map((v) => (typeof v === "string" ? JSON.stringify(clip(v, 40)) : describe(v)));
    return `[${value.length} item${value.length === 1 ? "" : "s"}${shown.length ? `: ${shown.join(", ")}` : ""}${value.length > 4 ? ", …" : ""}]`;
  }
  return describe(value);
}

// The page's address without the origin, which differs between copies of the target and says
// nothing about the application.
function pathOf(page: Page): string {
  try {
    const u = new URL(page.url());
    return `${u.pathname}${u.search}`;
  } catch {
    return "";
  }
}

// Every member of the surface, and of each page on it, recorded as it is called. What the
// member returns is passed back untouched; recording never changes what a test sees.
function recorded(surface: Surface, page: Page, steps: Step[]): Surface {
  const keep = (s: Step) => { steps.push(s); if (steps.length > KEPT_STEPS) steps.shift(); };
  const wrap = (fn: (...a: unknown[]) => unknown, self: unknown, step: string) => (...args: unknown[]) => {
    const given = args.length ? args.map(describe).join(", ") : undefined;
    const done = (out: unknown) => {
      keep({ step, ...(given ? { given } : {}), at: pathOf(page), ...(out === undefined ? {} : { read: summarise(out) }), ...(isEmpty(out) ? { empty: true as const } : {}) });
      return out;
    };
    const failed = (e: unknown) => {
      keep({ step, ...(given ? { given } : {}), at: pathOf(page), threw: clip(String((e as Error)?.message ?? e).split("\n")[0] ?? "", 200) });
      throw e;
    };
    let out: unknown;
    try { out = fn.apply(self, args); } catch (e) { return failed(e); }
    return out instanceof Promise ? out.then(done, failed) : done(out);
  };
  const member = (owner: object, prefix: string) => new Proxy(owner, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (typeof key !== "string") return value;
      const name = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "function") return wrap(value as (...a: unknown[]) => unknown, target, name);
      if (!prefix && value && typeof value === "object") return member(value as object, key);
      return value;
    },
  });
  return member(surface as unknown as object, "") as Surface;
}

// Never allowed to change a test's outcome: each piece is taken on its own, and one that
// cannot be taken is left out.
async function leaveEvidence(page: Page, steps: Step[], testInfo: TestInfo): Promise<void> {
  try {
    await testInfo.attach("sdlc-steps", { body: JSON.stringify(steps), contentType: "application/json" });
  } catch { /* nothing to add */ }
  try {
    const outline = scrub(await page.locator("body").ariaSnapshot({ timeout: 5000 }));
    const cut = outline.length > OUTLINE_LIMIT ? `${outline.slice(0, OUTLINE_LIMIT)}\n…` : outline;
    await testInfo.attach("sdlc-outline", { body: `${pathOf(page)}\n\n${cut}`, contentType: "text/plain" });
  } catch { /* the page may be gone */ }
  try {
    const path = testInfo.outputPath("failure.png");
    await page.screenshot({ path, fullPage: true, timeout: 10000 });
    await testInfo.attach("sdlc-screen", { path, contentType: "image/png" });
  } catch { /* the page may be gone */ }
}

export const test = base.extend<{ surface: Surface; mail: Mail; seeded: void }>({
  // Automatic, so every test gets it without naming it, and first, so the reset has
  // finished before the adapter opens anything.
  seeded: [async ({}, use) => { resetToSeed(); await use(); }, { auto: true }],
  surface: async ({ page }, use, testInfo) => {
    const target = requireTarget();
    // A template string, not a static specifier: which adapter loads is a run-time
    // choice (the target under test), so this can only be a dynamic import.
    const mod = await import(`../adapters/${target}/index.ts`);
    const surface: Surface = await mod.default(page, { baseURL: forThisWorker("SDLC_TARGET_URL"), persona });
    const steps: Step[] = [];
    await use(recorded(surface, page, steps));
    if (testInfo.status !== testInfo.expectedStatus) await leaveEvidence(page, steps, testInfo);
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
