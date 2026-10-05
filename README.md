# Digital Marketplace, rebuilt by AI agents (experimental)

> **This is an experiment.** It is not a supported service and not the Digital Marketplace that
> is in use. It has never been deployed, and it must not be used with real data. It may change or
> be removed without notice.

This repository holds a rebuild of the BC Digital Marketplace, the service through which public
sector staff publish Code With Us, Sprint With Us and Team With Us procurement opportunities and
vendors submit proposals against them. The original application is
[bcgov/digital_marketplace](https://github.com/bcgov/digital_marketplace).

The point of the experiment is the process rather than the product. The application, its tests
and its specification were produced by AI agents working through an agentic software delivery
pipeline,
[agentic-sdlc](https://github.com/alex-struk/agentic-sdlc), and the repository keeps the full
record of how: what was asked of each agent, what it produced, and who ruled on it.

## How it was built

1. **Requirements were recovered from the original.** Agents read the original application's
   source and recorded what it does as acceptance criteria, grouped by domain, with a contract for
   its interface (`spec/`).
2. **Tests were derived from the criteria, and checked against the original.** Each criterion that
   can be tested has an acceptance test, written without sight of any implementation
   (`tests/acceptance/`). The tests
   drive the application through an adapter (`tests/adapters/`), and were run against the original
   application to show they describe what it really does.
3. **The new application was planned and built in slices.** The plan (`plan/tasks.md`) cuts the
   248 criteria into 21 slices. A builder agent built each slice, and the slice was then verified
   by running its tests, and every earlier slice's, against the new application.
4. **Every change went through a review gate.** Each proposal waits at a gate until it is ruled
   on. The gates are held by AI agents in named roles (product owner, UX reviewer, architect,
   reviewer, tech lead), and some routine proposals, such as a re-derived test, are approved by
   automated checks instead. A person can take any seat, and a sample of the rulings is set aside
   for a person to read back.

## Status

All 21 slices are built, and each passed its own tests and every earlier slice's when it was
approved. No deployment stage exists, so the application runs only on a developer's machine.

Known limitation: the site's top navigation does not link to the opportunity and organization
lists. They are at `/opportunities` and `/organizations`, and a vendor reaches their own
organizations from **My profile**.

## What is where

| Path | What it holds |
| --- | --- |
| `intent/` | the brief the rebuild started from |
| `spec/` | the recovered requirements, acceptance criteria and interface contract |
| `design/` | the screen designs the frontend was built from |
| `plan/` | the plan, and the slices the build was cut into |
| `tests/` | the acceptance tests, the adapters that drive each application, and the seed data |
| `app/` | the rebuilt application: frontend, backend, database migrations and a local environment |
| `docs/decisions/` | the decisions the builder recorded about the application |
| `site/` | a readable record of every gate ruling, journal entry and criterion |
| `.sdlc/` | the pipeline's own records: configuration, proposals, rulings and run logs |
| `constitution.md` | the standing rules every agent worked under |

## Running it locally

You need Docker. From the repository root, choose a password for the test accounts and start the
local environment:

```sh
SDLC_SANDBOX_PASSWORD='choose-a-password' docker compose -f app/compose/compose.yaml up --build
```

The application answers at <http://localhost:4300>. Choose **Sign in**, pick the kind of account,
and sign in with a username from `tests/seed/manifest.yaml` (for example `test-admin`, `test-gov`
or `test-vendor-1`) and the password you chose. Every person and organization in the seed data is
invented, and mail the application sends is caught locally at <http://localhost:8025>.

`app/README.md` describes the application in more detail, including how to run its own checks.
