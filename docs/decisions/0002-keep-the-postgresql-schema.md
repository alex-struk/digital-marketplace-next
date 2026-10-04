# 0002 · Keep the existing PostgreSQL schema; change data, not structure

- Status: proposed (G2), revised after the first G2 return; the constraint narrowing awaits the
  tech lead. Revised 2026-10-03 to list the attachment-table restores of 0029 and 0055.
- Date: 2026-09-19

## Decision

The rebuilt service reads and writes the old application's PostgreSQL schema as it stands
(constitution J5). No table or column the old application did not have is added, and none is
renamed or dropped. Restoring the old application's own tables where the reconstructed baseline
(0007) lacks them is within J5 by tech-lead ruling (the G2 ruling on the Slice 15 re-cut, which
treated it as the same move 0029 made for Code With Us); the three such restores are listed in the
table below. The old Knex migration history
is continued, not restarted: the old migration files are carried into `app/migrations/`, the
rebuild's migrations are appended after the last old one, and Knex runs them (the one data-tool
departure from the stack profile, recorded in 0001). A database the old application left behind
upgrades in place, and a fresh sandbox database is built by running the whole history. Prisma, the
profile's data-access layer, takes its schema by introspecting the result and never migrates, so
no `_prisma_migrations` table is ever created.

**Escalation.** Narrowing the status check constraints for R-1.51 (first row below) changes a
constraint in the kept schema. This plan treats it as within J5, but it is a schema change, and
schema changes are escalated to the tech lead. It is not settled until the tech lead rules on it.

Every migration the rebuild adds is one of these, and each is named here so nobody has to
reverse-engineer it later:

| Migration | Criterion | Kind |
| --- | --- | --- |
| Map every opportunity stored in the "suspended" state to **cancelled**, in all three programs, recording a history entry that says the mapping was made by the system; then narrow the status check constraints so "suspended" can no longer be stored. | R-1.51 | data, then constraint narrowing |
| Create the service level agreement page as a page the service needs. | R-7.18 | data |
| On a fresh installation, create the set of needed pages minus the seven nothing links to (the three programs' opportunity and proposal guides, and the Team With Us opportunity scope page). Rows already present in an existing installation are left untouched. | R-7.12 and the ruling recorded against D-content-27 | data |
| Restore the old application's Code With Us opportunity attachment table, `cwuOpportunityAttachments` (version, file), created only where absent (migration `20260930000006_opportunity_states_and_attachments`, Slice 7, 0029). | R-8.25 (and R-8.19, R-8.20 for Code With Us) | restore of an old table the baseline lacks |
| Restore the old application's Sprint With Us opportunity attachment table, named in this rebuild `swuOpportunityAttachments` (`opportunityVersion`, `file`), created only where absent (Slice 15, 0055). | R-8.19, R-8.20, R-8.25 | restore of an old table the baseline lacks |
| Restore the old application's Team With Us opportunity attachment table, named in this rebuild `twuOpportunityAttachments` (`opportunityVersion`, `file`), created only where absent (Slice 15, 0055). | R-8.19, R-8.20, R-8.25 | restore of an old table the baseline lacks |

The three restores create nothing in a database the old application left behind, which already
has the tables. The two Slice 15 names are the rebuild's own under 0007's rule for names the seed
does not fix, and are reconciled with the old spelling if the old repository becomes available.

Two other records add migrations of the same restoring kind, and this table does not repeat them:
0007's reconstructed baseline itself, and 0012's three, which restore the old proposal and
evaluation tables the seed writes to and put service area 5 back to its old name. Each creates
only what is absent. Together with the six rows above, they are every migration the rebuild runs.

Everything else the accepted criteria change about stored behaviour is done in code, not in the
schema: the Team With Us processing → awarded transition (R-1.49), the panel chair and role rules
(R-1.55, R-5.9, R-5.37), notifications defaulting off for new accounts (R-6.20, set on insert), and
no read access being recorded against an opportunity attachment's file (R-8.19). File bytes stay in
the database, stored once per distinct content hash (R-8.5), because that is where the schema keeps
them.

## Why

- J5 binds the project to the existing schema, and the out-of-scope line in J2 means nobody owns a
  schema redesign.
- A check constraint narrowed to fewer values is still the same schema — no column or table
  changes shape — and it is the only way to make R-1.51's "cannot be stored in it" true of the
  data rather than merely of the code.
- A table the old application had, restored only where the reconstructed baseline lacks it, brings
  the database back to the schema J5 keeps rather than changing that schema. The tech lead ruled so
  when the Slice 15 re-cut was escalated.
- **Cancelled** is chosen as the mapped state because a suspended opportunity was, by definition,
  not proceeding, and cancelled is the only terminal state that does not assert an award. This is
  an assumption the criterion leaves open; it is flagged for ruling in plan.md.

## What would reverse it

- A ruling that a suspended record maps to some other state, which changes only the data migration.
- A ruling that narrowing a constraint is a schema change J5 forbids; the rebuild would then enforce
  R-1.51 in code alone and leave the constraint as it is.
- The old repository becoming available and spelling a restored table or column differently; a
  rename migration of its own then reconciles it, as 0007 says.
- An amendment to J5 permitting schema change, which would reopen every row of this table.
