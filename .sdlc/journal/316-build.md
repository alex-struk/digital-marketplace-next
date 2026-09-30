---
stage: "build"
title: "build slice 2"
at: "2026-09-30T12:49:47.979Z"
cost: 0.9387173999999999
turns: 30
session: "ac750a8c-ef93-4a81-840c-4c4bab7b9193"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

The seed failure was very likely caused by a stale container image, not by the seed files or the migrations. I've made the sandbox rebuild that image every time it's used, but I couldn't run Docker here, so the fix hasn't been confirmed in the real sandbox.

**What went wrong.** The error means service area 5 was still `DELIVERY_MANAGER` when `tests/seed/000-installation.sql` tried to put it back as `SERVICE_DESIGNER`. The migration that renames it (`20260930000001_service_areas_as_kept`) is already in `app/migrations`. So the image the seed ran from must have been built before that migration existed.

The compose file makes that easy to hit. The `seed` service sits behind a profile, so `docker compose up --build` never rebuilds its image. `docker compose run seed`, which is what the sandbox used, then reuses whatever image already carries that name.

**What I changed.**
- **Compose file:** in `app/compose/compose.yaml`, the `seed` and `migrate` services now have `pull_policy: build`. Compose rebuilds their image every time either is started, including by `run seed`. Layer caching keeps this cheap when nothing changed.
- **Seed log:** the seed script (`app/migrations/scripts/seed.cjs`) now lists by name the migrations it ran. If this happens again, the log will show which migration history the image carried.
- **Decision record:** `docs/decisions/0014-the-seed-image-is-rebuilt-when-asked-for.md` records the choice and why.

Nothing else in the application changed. The slice-2 work on sign-in, sign-up, sign-out, the session and the mail path is as the earlier build left it.

**How I checked it.**
- **Seed script:** I ran it end to end, twice in a row, against an in-process PostgreSQL. Both runs applied all five migrations and all 16 seed files. Both left service areas 1 to 5 with area 5 as `SERVICE_DESIGNER`, and the same 147 accounts.
- **Check script:** `npm --prefix app run check` passes, with all 74 unit tests.
- **Cleanup:** I deleted the `node_modules` folders I installed, so the workspace carries only source.

**What I could not do.** The sandbox wouldn't let me run Docker without an approval nobody was here to give. So I couldn't start the real stack and watch `seed` rebuild and succeed on actual PostgreSQL. My explanation is an inference: it's the only one I found that fits the error, given that the current source seeds correctly. If a later run still fails the same way, the new log line will show whether the rename migration was in the image.

I changed nothing outside `app/` and `docs/decisions/`, and no criterion needed a change to the spec, plan, design or seed to build. The next slice will find the sandbox as slice 2 intended it, with the seed image rebuilt whenever it's used.