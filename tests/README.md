# Acceptance suite

Playwright tests that describe what the product does, never how it is built. A test
touches only four things:

- **`surface`** — one property per page (`surface.opportunity`, say), generated from
  `spec/contract/surface.yaml` into `tests/generated/surface.d.ts`. Every page has
  `open(params?)`, its actions (each `Promise<void>`) and its observations (each
  `Promise<string>`). The running adapter under `tests/adapters/<target>/` supplies the
  navigation and locators behind these calls — a test never sees them.
- **`persona`** — `persona.<id>` from `tests/generated/personas.ts`, passed to
  `surface.signIn(persona.<id>)`.
- **`seed`** — `seed.<group>.<handle>` from `tests/generated/seed.ts`, the record a test
  refers to instead of an id or a value it invented itself.
- **`mail`** — `mail.messagesTo(address)`, `mail.latestTo(address)` and `mail.clear()`
  against the mail catcher `spec/contract/observables.yaml` names.

All four come from `./fixtures`, which re-exports Playwright's own `test` and `expect`
alongside them — import from there, never from `@playwright/test` directly.

## Writing a test

One file per criterion, `tests/acceptance/<domain>/<ID>.spec.ts`:

```ts
// criterion: @R-1.4 v1
// provenance: blind, spec@a1b2c3d, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a public sector admin can publish a draft opportunity", async ({ surface }) => {
  await surface.signIn(persona.publicSectorAdmin);
  await surface.opportunity.open({ id: seed.opportunities.draft });
  await surface.opportunity.publish();
  expect(await surface.opportunity.status()).toBe("published");
});
```

A criterion the surface cannot exercise gets an entry in `not-testable.yaml` with a
reason instead of a file.

## What the checks refuse

Two checks keep the suite blind to the implementation. Over `tests/adapters/**/*.ts`:
`expect(`, an import from `tests/acceptance/` or `app/`, or a `test(` call — an adapter
drives the page, it never asserts. Over `tests/acceptance/**/*.ts`: an import whose path
touches `tests/adapters/` or `app/`, `page.` (a test never holds the page object),
`locator(`, `getBy`, `data-testid`, `querySelector`, `goto(`, or a string literal that
starts with `http://`, `https://` or a route-shaped `/`. `not-testable.yaml` and
`attestations.yaml` are not TypeScript and are exempt.

## Running against a target

```sh
npm install
SDLC_TARGET=old SDLC_TARGET_URL=http://localhost:3000 npm test
```

`SDLC_TARGET` names the adapter the `surface` fixture loads and the Playwright project
the run reports under; `SDLC_TARGET_URL` is the running instance to point the browser
at. Add `SDLC_MAIL_API` (the mail catcher's URL) for a run that includes a test using
`mail`. `npm run typecheck` runs `tsc --noEmit` over the whole suite.
