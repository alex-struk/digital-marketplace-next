# 0007 · A fresh installation seeds sixteen pages, named here

- Status: proposed (G2), written in the revision that moved R-7.12 to Slice 5
- Date: 2026-09-21

## Decision

A fresh installation of the rebuilt service creates **sixteen** pages for itself, each marked as
needed by the service, each titled by its own address and each bodied "Initial version" until
somebody writes it. They are:

| # | The page | Where it comes from |
| --- | --- | --- |
| 1–5 | about, disclaimer, privacy, accessibility, copyright | the five the footer links from every screen (R-7.19) |
| 6 | the markdown guidance page (`markdown-guide`) | the editor's guidance link (R-7.26) |
| 7 | the service's own terms and conditions | the page that carries the announce-changed-terms action (R-7.13) |
| 8–10 | a terms and conditions page for each of Code With Us, Sprint With Us and Team With Us | accepted one-time by an organization qualifying for a program (Slice 13) |
| 11 | the Sprint With Us opportunity scope page | embedded by the Sprint With Us opportunity screen (R-7.29) |
| 12–13 | the proposal evaluation page for Sprint With Us and for Team With Us | named by R-7.12's enumeration |
| 14–15 | the evaluation instructions page for Sprint With Us and for Team With Us | read by an evaluation panel (Slice 17); embedded, so R-7.29 covers a missing one |
| 16 | the service level agreement page | created for itself by R-7.18, which the old service never did |

The exact addresses are the ones the old application's stub migrations used
(`20201202094826_admin-content-stubs.ts`, `20221130162144_twu-admin-content-stub.ts`,
`20230213120034_twu-opportunity-scope.ts`, `20230321113754_add-twu-proposals.ts`,
`20240607173220_admin-evaluation-content-stubs.ts`), read from the oracle under J7, minus the seven
below and plus `service-level-agreement`. Keeping the addresses is not cosmetic: a page's address is
how every screen that links to or embeds it finds it.

**Not created**, although the old service created them: the opportunity guide and the proposal guide
of each of the three programs, and the Team With Us opportunity scope page — seven in all. Nothing
in the rebuild links to any of them; the learn-more screens carry that material. This is the ruling
recorded against D-content-27, which is why that row is obsolete. Rows an existing installation
already holds are left exactly as they are, because the schema is kept (0002) and because a page
marked needed cannot be removed through the service (R-7.25).

**R-7.12 is asserted against these sixteen**, in Slice 5, on the administrator's list of pages.

## Why

Three numbers were in play, and a builder could have taken any of them:

- **Twenty-two**, the count in R-7.12's own then-clause. It is a recovered count: it describes the
  old installation as it stood before two later decisions changed the set in opposite directions —
  the D-content-27 ruling removed seven, and R-7.18 added one. No installation of the rebuild can
  show twenty-two without disobeying one of those two, and both are accepted or ruled. What the
  rebuild answers to is R-7.12's statement — a full set of the pages the service needs, each a
  placeholder titled by its own address — and the enumerated set above is that full set for the
  rebuild.
- **Nineteen**, which the acceptance suite's seed manifest carries. It matches neither the old
  service nor any ruling, so nothing supports it. Under P7 the suite follows the spec and the plan,
  not the other way round; the manifest is reconciled to sixteen by whoever owns it.
- **Sixteen**, which is twenty-two minus the seven ruled out plus the one R-7.18 requires. Every
  term in that arithmetic is a decision somebody made on the record. It is what the application's
  migration already creates.

Writing the sixteen out by name matters more than the number. A count in a criterion is checkable
only if both sides agree which rows are counted, and the disagreement above was exactly that.

## What would reverse it

- The spec re-authoring R-7.12's then-clause against a different set — most likely to a count of
  sixteen, or to wording that names the set rather than counting it. That changes this record's
  standing, not the migration.
- A ruling that the rebuild should seed the seven guides after all, to keep an existing
  installation and a fresh one identical. The count becomes twenty-three and the D-content-27
  ruling is reopened.
- A ruling that the service level agreement page should be an ordinary page rather than one the
  service needs, which would contradict R-7.18 and drop the count to fifteen.
