# 0014 · The seed image is built every time it runs

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Context

The `seed` service in `app/compose/compose.yaml` sits in a profile, so `docker compose up
--build` does not build it. `docker compose run seed` builds its image only when none exists
yet. Once an earlier build had left an image behind, the seed kept running that image's
migration history. In slice 2's first run it ran the history from before migration
`20260930000001_service_areas_as_installed` (decision record 0013). Service area number 5 was
still Delivery Manager, and `tests/seed/000-installation.sql` then failed on
`serviceAreas_pkey` when it restored Service Designer at number 5. The same files apply
cleanly against the current history (`app/migrations/tests/seed.test.mjs`).

## Decision

- `seed` and `migrate` share one image, `digital-marketplace-migrations:local`, and both
  carry `pull_policy: build`. Compose rebuilds the image whenever either one runs. The build
  cache keeps this cheap when nothing has changed. `frontend` and `backend` carry
  `pull_policy: build` too, for the same reason.
- `seed` depends on `migrate` completing successfully. That way the seed never drops the
  schema while `migrate` is still changing it.

## What would reverse it

- The harness building every service, profiles included, before it runs the seed.
