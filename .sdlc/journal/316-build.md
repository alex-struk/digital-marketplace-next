---
stage: "build"
title: "build slice 2"
at: "2026-09-30T11:40:46.142Z"
cost: 0.509027
turns: 17
session: "7829e67e-3d6c-4d0a-901e-a4cb85f0e514"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

The six criteria were returned because of how the test run was set up, not because the application is wrong. I found nothing under `app/` that needed changing, so I left the code alone. The run needs a fix outside this stage.

**What the failures show.** R-4.2 and R-6.1 to R-6.5 all stopped with the same error: `SDLC_MAIL_API is not set`. That message comes from the test harness before any test reaches the application. `spec/contract/observables.yaml` says the harness sets that variable at run time from the target's description. My instructions for this stage named only one address the target needs besides its own: the identity provider at `http://localhost:8080/realms/digital-marketplace`. So the target's description for the new application seems to have no mail-catcher address, and every test that reads mail stopped before doing anything.

**What the application already does.** `app/compose/compose.yaml` already runs Mailpit with fault injection on, a toxiproxy in front of its mail port, and a small web front publishing both at `http://localhost:8025`. Mailpit's own API is at the root and the proxy's controls are under `/hold`, as `observables.yaml` describes. The service sends through the proxy with the configured sender, the `[TEST]` marking on, and `SDLC_DISABLE_NOTIFICATIONS` as the switch that turns all mail off. Decision record 0012 lists how each of R-6.1 to R-6.5 and R-6.28 is met. R-4.2 (the welcome message) goes through the same path.

**What I checked.** After installing dependencies, `npm --prefix app run check` passes: typechecks plus 183 unit tests across the three workspaces. I then removed the installed dependencies so they don't travel back with the proposal. I could not start the containers, because container commands need approval in this session. So I have not seen `:8025` answer live here; that it's published comes from reading the compose file, not from running it.

**What I changed.** Only `docs/decisions/0012-the-mail-path.md`, with a paragraph for whoever configures the run. It says the suite finds the catcher through `SDLC_MAIL_API`, which comes from the project's description of this target and not from anything under `app/`. For this setup the value should be `http://localhost:8025`, checked for readiness at `http://localhost:8025/api/v1/info`. That address answers only once Mailpit behind the front is up; the front alone answers sooner.

**What it would take.** The project's description of the new target needs the mail catcher added beside the identity provider: `http://localhost:8025`, waited for at `/api/v1/info`. That lives in the project configuration, which this workspace neither carries nor delivers, so the operator or the stage that owns it has to add it. Once it's there, the six criteria should run as written. R-6.1 also needs its separate run against an instance started with `SDLC_DISABLE_NOTIFICATIONS=1`.

**For the next slice.** This slice adds no new gaps. As 0012 already says, sending in batches of fifty (with the rest blind-copied) is not built yet and is left for slice 7.