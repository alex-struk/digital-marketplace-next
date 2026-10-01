# 0026 · Twenty-two needed pages, and a service level agreement page the service answers itself

- Status: accepted for the build (slice 5, revision after the ruling on R-7.12 and R-7.8)
- Date: 2026-09-30
- Supersedes: the page set of decision records 0007 (the seeded page set) and 0008; the count
  paragraph of 0025's "What a reader should know"

## Decision

**A fresh installation stores the twenty-two pages the old application created for itself**, each
marked as needed by the service, titled by its own address, bodied "Initial version" and authored
by nobody (R-7.12). The set is in `app/migrations/lib/fixed-pages.cjs`. It is the set
`tests/seed/000-installation.sql` restores between tests and the count R-7.12's then-clause gives.

**The service level agreement page is not stored.** The service answers
`/api/content/service-level-agreement` itself while no page holds that address: titled by the
address, bodied "Initial version", marked as needed, nobody named as its author, dated as the
earliest needed page (when the installation was prepared). Every link to it resolves (R-7.18). It
is not in the list of pages. An administrator can open its managing screen, cannot remove it, and
the first time they publish wording for it, it becomes a stored page the service needs, read like
any other from then on. The rule lives in `app/backend/src/content/built-in-pages.ts`.

**How the history gets there.** `20260920000001_fixed_pages.cjs` keeps creating the sixteen it
always created, so the history reads the same on every database. The new
`20260930000005_the_twenty_two_needed_pages.cjs` creates the seven it left out (the six program
guides and the Team With Us opportunity scope page) and removes the service level agreement
placeholder, but only while nobody has written it.

**The managing screen shows its dates to the minute.** Published and last-updated on
`/content/:slug/edit` read "September 30, 2026 at 5:00 p.m.", and the `datetime` attribute carries
the full moment. Publishing a change makes the updated date the moment of the change (R-7.8), and
the day alone cannot show that. The public page and the list keep the dates the stories show.

## Why

- The acceptance run counted twenty-three needed pages where R-7.12 says twenty-two. That was the
  seed's twenty-two plus the service level agreement page the migration stored, which the seed
  does not know about. Decision records 0007 and 0008 had chosen sixteen, knowing the criterion
  said twenty-two, and the ruling has now settled it for the criterion.
- R-7.18 still has to hold. Storing the page as a needed page makes twenty-three. Storing it as an
  ordinary page changes the list's total and lets it be removed. A built-in answer keeps the
  list at twenty-two, and the address answers even after the harness empties the tables and puts
  back only what the seed knows.
- The ruling on R-7.8 found an empty value where the change's moment should be read. The only
  part of R-7.8 the managing screen did not show was the time of the change. This is the
  narrowest change that shows it, and it is a judgement: the ruling did not name which
  observation came back empty.

## What would reverse it

- A ruling that keeps the seven guides out (the D-content-27 ruling 0007 cites) and re-words
  R-7.12's count. Then the newer migration's additions go, and the count follows the criterion.
- A ruling that the service level agreement page is listed as a needed page. Then the seed has to
  restore it too, or the count becomes twenty-three again.
