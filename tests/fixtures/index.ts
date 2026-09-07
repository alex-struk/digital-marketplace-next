import { test as base, expect } from "@playwright/test";
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
export const test = base.extend<{ surface: Surface; mail: Mail }>({
  surface: async ({ page }, use) => {
    const target = requireTarget();
    // A template string, not a static specifier: which adapter loads is a run-time
    // choice (the target under test), so this can only be a dynamic import.
    const mod = await import(`../adapters/${target}/index.ts`);
    const surface: Surface = await mod.default(page, { baseURL: process.env.SDLC_TARGET_URL, persona });
    await use(surface);
  },
  mail: async ({}, use) => {
    await use(new Mail(process.env.SDLC_MAIL_API));
  },
});

export { expect, persona, seed };
export type { Persona } from "../generated/personas";
export type { Seed } from "../generated/seed";
export type { Surface } from "../generated/surface";
