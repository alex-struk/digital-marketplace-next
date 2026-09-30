---
stage: "build"
title: "build slice 2"
at: "2026-09-30T11:34:50.961Z"
cost: 1.0518487999999997
turns: 35
session: "62f06f52-e624-4b78-a6a2-df0e1a749635"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

The seed failure is almost certainly fixed, but I couldn't prove it: docker commands needed approval this session, so the stack was never started. What I can show is that `npm --prefix app run check` passes, including a new test that runs the seed the way the `seed` service does.

**What went wrong.** The seed failed because `tests/seed/000-installation.sql` tried to put Service Designer at service area number 5, and that slot was already taken. The code under `app/` already handles this: a migration written earlier in this slice (`20260930000001_service_areas_as_installed`, decision record 0013) renames the old guessed row, Delivery Manager, to Service Designer. With that migration in place, every seed file applies cleanly against an in-process Postgres (PGlite). So the seed container must have run an older migration history than the code it was built from.

**Why that happens.** The `seed` service sits in a compose profile, so `docker compose up --build` never builds it. `docker compose run seed` only builds its image when none exists yet. An image left by an earlier build, from before that migration, would still say Delivery Manager at number 5, which is exactly the failure logged. The seed's log shows the container being created with no build step, which fits.

**What I changed in `app/compose/compose.yaml`:**
- `seed` and `migrate` now share one image, `digital-marketplace-migrations:local`. Both are marked `pull_policy: build`, so compose rebuilds the image every time either one runs; the build cache keeps that cheap when nothing changed.
- `frontend` and `backend` are marked `pull_policy: build` too, so no service can run an out-of-date image.
- `seed` now waits for `migrate` to finish successfully, so the two never change the schema at the same time.

Nothing else in the compose file changed. The application still answers on 4300 and the identity provider still publishes at `http://localhost:8080/realms/digital-marketplace`. I confirmed the edited file parses and reads as intended, but I did not run `docker compose config` on it.

**What I tested.** I moved the seed's steps in `app/migrations/scripts/seed.cjs` (wipe the schema, run every migration, apply every `tests/seed/*.sql` in order) into an exported `seed(knex, directory)` function. `main()` still runs it the same way. The new test, `app/migrations/tests/seed.test.mjs`, runs it twice over the same PGlite database. It checks that the second run leaves the same data as the first, and that the service areas come out as numbers 1 to 5 ending with Service Designer. Decision record `docs/decisions/0014-the-seed-image-is-built-every-time-it-runs.md` explains the change.

**Still open.**
- **Other services:** the ruling named only the seed, and the run stopped there. If the backend, frontend, identity provider or mail services have their own startup faults, they have not been seen yet.
- **Criteria:** I changed no code for the 17 slice-2 criteria, so they remain as the existing build left them and untested end to end.
- **Outside my stage:** nothing needed a change to files this stage doesn't own.
- **Next slice:** it will find the same state slice 2 was meant to deliver, with the seed now rebuilt every time it runs.