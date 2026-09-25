# 0007 · The kept schema arrives as one reconstructed baseline migration

- Status: accepted for the build (slice 1); the escalation in 0002 is untouched by it
- Date: 2026-09-20

## Decision

`app/migrations/migrations/20200101000000_baseline_kept_schema.cjs` creates the kept
PostgreSQL schema in one migration, and the rebuild's own migrations are appended after it.
Knex runs the history; Prisma reads the result and never migrates it (0001, departure 1).

Decision record 0002 says the old application's migration files are "carried into
`app/migrations/` unchanged". They could not be: the old repository is not in this
workspace — `sources/old/` is referred to throughout the spec and is not present — so there
were no files to carry. The schema was reconstructed instead, from two things that are here:

- **`tests/seed/*.sql`**, which the acceptance suite applies to a migrated database. Those
  722 lines name thirty-two tables and every column they insert into, so they fix the names,
  the types and the nullability of everything they touch. They are not a guess.
- **`spec/contract/openapi.yaml` and the domain files**, for what the tables are for.

`app/migrations/tests/schema.test.mjs` runs the whole history against PostgreSQL and then
applies all seven seed files in order. That test is the evidence the baseline is the shape
the seed expects; it runs in `npm run check` and needs no database of its own, because
PostgreSQL there is PGlite — the same engine, in process.

The baseline holds the thirty-six tables the seed and slice 1 need. The rest of the kept
schema — stored files and their read-access grants, attachments, addenda, notes,
subscriptions, counters, individual evaluations and consensuses — is not in it. Each is
added by the slice that first reads or writes it, as a migration appended to this history.

## Why

- Nothing else was available. A baseline that the acceptance suite's own seed applies to
  cleanly is the strongest claim about the kept schema this workspace can support.
- One baseline keeps the history honest about what it is. Inventing a plausible-looking run
  of forty dated migration files would have implied a provenance the files do not have.
- Leaving out the tables no slice has reached keeps the invented surface as small as it can
  be. Every table in the baseline is one the seed names and therefore one whose shape is
  known.

## What this costs, and who pays it

**A database the old application left behind does not upgrade in place.** That was 0002's
reason for continuing the Knex history, and this baseline cannot do it: running it against
such a database would try to create tables that are already there. Before the rebuild is
pointed at one, the baseline has to be recorded in its `knex_migrations` table as already
applied, and the differences between the baseline and what is really there have to be
found. A fresh sandbox database, which is all J2 puts in scope, is built by running the
whole history and is unaffected.

**Column and table names the seed does not fix are the rebuild's own.** Every name in the
baseline that the seed files use is theirs. `sessions`, `files`, `fileBlobs` and
`serviceAreas` are not used by the seed beyond `serviceAreas`' own lookup, so their columns
are this record's. A later slice that finds the old application spelled one of them
differently should rename it in a migration of its own and say so here.

**The five service areas are named, and the names are a guess** beyond the two the seed
selects by name (`FULL_STACK_DEVELOPER`, `AGILE_COACH`). The slice that builds Team With Us
qualification should check them against the old application and correct them.

## What would reverse it

- The old repository becoming available. Then its migration files replace this baseline, the
  seed test is run against them, and the differences are reconciled — this record says
  exactly what to compare.
- A ruling that the rebuild may start the schema's history fresh, which would make the
  baseline the first migration by intent rather than by necessity.
