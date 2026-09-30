# 0014 · The seed and migration images are rebuilt whenever they are asked for

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Decision

In `app/compose/compose.yaml`, the `seed` and `migrate` services carry `pull_policy: build`.
Compose builds their image again every time either is started, including by
`docker compose run seed`. Layer caching keeps this cheap when nothing has changed. The seed
also logs the names of the migrations it ran.

## Why

`seed` sits behind the `seed` profile, so `docker compose up --build` skips its image, and
`docker compose run seed` reuses any image that already carries its name. In the sandbox that
image had been built from an earlier migration history, one without
`20260930000001_service_areas_as_kept`. So service area 5 was still `DELIVERY_MANAGER`, and
`tests/seed/000-installation.sql` failed when it put `SERVICE_DESIGNER` back as row 5
(`duplicate key value violates unique constraint "serviceAreas_pkey"`). The same seed script
succeeds from the current source, twice in a row, against a fresh database.

## What would reverse it

A runner that always builds every profile's images before it runs one. The policy would then
change nothing.
