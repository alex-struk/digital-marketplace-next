# 0012 · The kept schema gains the tables the acceptance suite's seed writes to

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Decision

Three migrations are appended after slice 1's:

- `20260930000001_service_areas_as_kept` renames service area 5 from `DELIVERY_MANAGER` to
  `SERVICE_DESIGNER`, "Service Designer", where the reconstructed baseline made it so.
- `20260930000002_code_with_us_proposals` creates `cwuProponents`, `cwuProposals`,
  `cwuProposalStatuses` and `twuProposalAttachments`.
- `20260930000003_evaluation_tables` creates the individual and consensus evaluation tables of
  Sprint With Us and Team With Us — `swuTeamQuestionResponseEvaluatorEvaluations`,
  `...EvaluatorEvaluationStatuses`, `...ChairEvaluations`, `...ChairEvaluationStatuses`, and the
  same four under `twuResourceQuestionResponse`.

Each creates a table only where it is absent and renames only a row the baseline wrote, so a
database the old application left behind, which already has all of this, is left as it is.
Prisma's schema was pulled again afterwards and now holds the whole kept schema.

## Why

The acceptance suite's seed files (`tests/seed/`) have grown since slice 1. As they stand they
write Code With Us proposals and their history, a Team With Us proposal attachment, and
individual and consensus evaluations, and `000-installation.sql` puts service area 5 back by
number as `SERVICE_DESIGNER`. Against slice 1's baseline the first of those statements failed,
so the `seed` service could not put the sandbox into the state `tests/seed/manifest.yaml`
describes, and `npm run check` failed in the migrations workspace, whose test applies every
seed file. Neither is something a later slice can wait for: every slice's acceptance run starts
from the seed.

The shapes are the ones the seed writes and the old application's names for them (its
evaluation-panel migration 20240527213854 for the evaluation tables, its service-area migration
20250521094818 for the fifth area). Where the seed does not say — a column the seed leaves to
its default, a key — the choice follows the tables of the same kind already in the baseline:
status tables carry `status`, `event` and `note`; a proposal's children cascade with it; an
evaluation is keyed by proposal, question and panel member.

Slice 1's migration test also asserted the seed's size (eighteen accounts, three Sprint With Us
proposals) and checked the pages a fresh installation lacks after the seed had restored them.
It now checks the seed's named handles, and reads the fresh installation before the seed is
applied.

## What this does not decide

- Which other tables of the old schema are still missing. Only what the seed needs, and the
  table a Code With Us proposal's individual proponent refers to, is added. The slices that
  build Code With Us proposals (14) and evaluation (17, 18) own the rest of their schema and may
  find more.
- The disagreement between the plan's sixteen seeded pages (0007) and the seed's twenty-two:
  `000-installation.sql` restores all twenty-two between tests, so the acceptance run sees
  twenty-two whatever a fresh installation holds. That is slice 5's to answer for with R-7.12.

## What would reverse it

A reconstructed baseline redone from the old application's own migration files, which would
carry all of this from the start; these migrations would then find nothing to do.
