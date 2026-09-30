# 0013 · Two migrations that keep the acceptance suite's seed applicable

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Decision

Between slice 1 and slice 2 the acceptance suite's seed (`tests/seed/`, another stage's
artifact) grew from seven files to sixteen. The reconstructed baseline (0007) no longer took
it, so `npm run check` — whose migration test applies every seed file — failed before any
slice-2 code was written. Two migrations are appended to the history to put that right, by
0007's own method: every table and column name is the one the seed writes.

- `20260930000001_service_areas_as_installed.cjs`. The seed's `000-installation.sql` restores
  the five service areas an installation of the old application carries, and number 5 is
  Service Designer. The baseline guessed Delivery Manager, and 0007 said the guess should be
  corrected. The row is renamed only when nothing refers to it yet.
- `20260930000002_seeded_proposal_tables.cjs`. The seed now writes Code With Us proposals and
  their history, Team With Us proposal attachments, and the evaluators' and chairs' question
  scores for both evaluated programs (with the status each set stands at). These tables are
  created with the columns the seed inserts. The slices that build those features own what
  goes in them and may need to adjust constraints the seed does not fix.

`app/migrations/tests/schema.test.mjs` was changed with them. It no longer counts exactly
eighteen accounts; it checks that every account the manifest names is present, because the
seed grows. It also reads "the migration creates none of the seven pages nothing links to" from
the database as the migrations left it, before the seed. That is because `000-installation.sql`
now puts back all twenty-two of the old application's pages.

## What would reverse it

- The seed shrinking back, or the old application's schema being made available. The
  migrations would then be replaced with the real definitions, as 0007 foresees.
