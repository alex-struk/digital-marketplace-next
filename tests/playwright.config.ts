import { defineConfig } from "@playwright/test";

// The suite runs unmodified against whichever target it's pointed at — the old
// application, the one being rebuilt, or a developer's own sandbox — so both the
// project name and the base URL come from the environment rather than being written
// here for one of them. `SDLC_TARGET` also names the adapter under
// `tests/adapters/<target>/` the `surface` fixture loads (see fixtures/index.ts).
const target = process.env.SDLC_TARGET ?? "new";

export default defineConfig({
  testDir: "./acceptance",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // A whole acceptance test, not a single wait. One criterion routinely means signing in,
  // walking a multi-step form and reading the result back, against a target running in
  // development mode. 30s was Playwright's default and was never sized for that: one
  // calibration run lost 85 tests to it, concentrated in exactly the domains whose
  // criteria involve creating something. Two minutes is a cap on a stuck test, not a
  // budget a healthy one is expected to use.
  timeout: 120000,
  reporter: [["json", { outputFile: "test-results/results.json" }], ["list"]],
  use: {
    baseURL: process.env.SDLC_TARGET_URL,
    // One click, one fill, one navigation — each bounded on its own, well inside the test's
    // two minutes. Without this a single action waits on the test's whole budget: a control
    // that never becomes clickable, because a field before it was left empty, held one test
    // for two minutes and did so in more than half the failures of one calibration, which is
    // most of why a full run took hours. A stuck action now fails in seconds and names what it
    // was waiting on.
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [{ name: target }],
});
