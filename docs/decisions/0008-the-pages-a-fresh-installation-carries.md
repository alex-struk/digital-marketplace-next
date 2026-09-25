# 0008 · The pages a fresh installation carries, and the address of each

- Status: accepted for the build (slice 1)
- Date: 2026-09-20

## Decision

A fresh installation carries sixteen pages the service needs for itself (R-7.12), created by
`app/migrations/migrations/20260920000001_fixed_pages.cjs`, each marked as needed by the
service, titled by its own address, with the body "Initial version" and no author — so an
administrator's screen names "System" as both publisher and last editor (R-7.27).

The addresses, which later slices bind to:

| Address | Who reaches it |
| --- | --- |
| `about`, `disclaimer`, `privacy`, `accessibility`, `copyright` | the footer's five links, on every screen (R-7.19) |
| `markdown-guide` | the formatting guidance the body editor links to (R-7.26) |
| `terms-and-conditions` | the service's own terms, and the one page that carries the announce-changed-terms action (R-7.13) |
| `service-level-agreement` | the learn-more screens, the program cards and the three opportunity forms (R-7.18) |
| `code-with-us-terms-and-conditions`, `sprint-with-us-terms-and-conditions`, `team-with-us-terms-and-conditions` | each program's qualification or proposal terms |
| `sprint-with-us-opportunity-scope` | embedded in the Sprint With Us opportunity screens (R-7.29) |
| `sprint-with-us-proposal-evaluation`, `team-with-us-proposal-evaluation` | embedded in each program's proposal evaluation screens |
| `sprint-with-us-evaluation-instructions`, `team-with-us-evaluation-instructions` | what an evaluation panel reads |

The migration creates a page only where no page holds that address, so an installation that
already carries its own wording, history and authors is left exactly as it is.

**Seven pages are not created**: `code-with-us-opportunity-guide`,
`code-with-us-proposal-guide`, `sprint-with-us-opportunity-guide`,
`sprint-with-us-proposal-guide`, `team-with-us-opportunity-guide`,
`team-with-us-proposal-guide` and `team-with-us-opportunity-scope`. They are listed in
`app/migrations/lib/fixed-pages.cjs` so that nobody re-adds one by accident.

## Why

- The plan (`plan/plan.md`, "The data it inherits", item 3) and 0002 both say a fresh
  installation is seeded with the needed pages minus the seven nothing links to, following
  the ruling recorded against D-content-27, and plus the service level agreement page
  (R-7.18). This is that set: 22 − 7 + 1 = 16.
- The seven were superseded by the service's own learn-more screens. Creating a page that
  nothing links to and that an administrator cannot remove (R-7.25) adds unremovable clutter
  to the one list that is meant to be readable.

## Two things a reader should know

**R-7.12's own then-clause says twenty-two pages are listed.** This set is sixteen. The
criterion's sentence — a full set of the pages the service needs, each holding placeholder
text and titled by its own address — is met; its count is not, and cannot be while the ruling
against D-content-27 stands and R-7.18 adds a page. A test that counts pages will find
sixteen. This is the tension the plan chose knowingly; it is recorded here rather than left
for a reader to discover in a migration.

**`tests/seed/manifest.yaml` and `tests/seed/003-content.sql` both say nineteen.** Neither
sixteen nor twenty-two. The seed does not create these pages — it relies on the migrations
for them — so nothing in the seed breaks either way, but whoever wrote it expected a
different number from either document. It is worth a ruling before the count is asserted
anywhere.

**The addresses of the six program pages are this record's.** Only `terms-and-conditions`,
`markdown-guide`, `service-level-agreement` and the footer's five are named anywhere in the
spec or the design. The rest follow the naming the service's own routes use — the
organization terms screens are at `/organizations/:orgId/sprint-with-us-terms-and-conditions`
— but they are a choice, and the slice that first embeds one should confirm it against the
old application.

## What would reverse it

- A ruling that the seven unlinked pages are seeded after all, which is one line in
  `app/migrations/lib/fixed-pages.cjs` and a second migration for an installation that has
  already run this one.
- The old application's own migrations turning up (0007), which would settle the six program
  addresses as facts rather than choices.
