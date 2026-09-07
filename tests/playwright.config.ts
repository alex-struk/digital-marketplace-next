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
  timeout: 30000,
  reporter: [["json", { outputFile: "test-results/results.json" }], ["list"]],
  use: { baseURL: process.env.SDLC_TARGET_URL },
  projects: [{ name: target }],
});
