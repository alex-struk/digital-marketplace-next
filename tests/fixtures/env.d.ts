// The harness's devDependencies are pinned to exactly `@playwright/test`, `typescript`
// and `yaml` (see ../package.json) — no `@types/node` — so `process.env`, used by
// playwright.config.ts and the fixtures below to read which target and mail catcher a
// run points at, has no ambient type without this. Kept to only what is actually read.
declare const process: { env: Record<string, string | undefined> };
