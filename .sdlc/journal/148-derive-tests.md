---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T12:37:43.144Z"
cost: 1.8607252
turns: 59
session: "b923725c-15f0-4e45-91aa-ac91a7fcfb44"
---

I wrote tests for all six criteria in the content domain: R-7.12, R-7.16, R-7.17, R-7.23, R-7.25 and R-7.27. Each now has its own file under `tests/acceptance/content/`, and I removed all six of their entries from `tests/acceptance/not-testable.yaml`, so each criterion is either tested or listed, never both. I added no new entries. The tests have not been run, and neither has the type-checker, because this session wasn't allowed to run shell commands. The type signatures were checked only by reading them against `tests/generated/surface.d.ts` and `seed.ts`.

**What reached each criterion**

- **R-7.12:** Every page the service needs is taken from the seed's content handles marked `fixed`. There should be twenty-two of them, and the test checks that count. A visitor opens each one and checks three things: it answers, its title is its own address, and its body reads "Initial version". An administrator then reads `content-list.page_count`. That total, less the seed's ordinary pages (the handles not marked fixed), must equal twenty-two.
- **R-7.16:** Uses the new `content-request` page, with a vendor asking. The requests are: read the list, create, change, rename and remove. Each one must be refused, not accepted, with a 403/forbidden status, and every refusal must have the same status and the same `refusal_shape`.
  - Reading one page is a separate test with a condition in it. Anyone may read a page (R-7.1), so the service is expected to answer that request. The test only requires that if it is refused, the refusal has the same form as the refused list request.
  - Whoever rules on this should know about that condition. As written, the "reads one page" clause can only fail if the service refuses the read in a different form.
- **R-7.17:** Two tests.
  - The first reads `seed.content.rawMarkupPage` on its own address. The body must contain no `**`, and the tagged pieces of the seeded body must reach the reader as literal text; those pieces are taken from the seed's own body text, not typed into the test.
  - Markup that is stripped out and markup that is executed both leave no tags in the rendered text, so this observation can't tell them apart. The test therefore requires the tags to show as text, which is the only rendering this observation can show was not executed.
  - The second test has an administrator give that same body to the Sprint With Us scope page and the Team With Us terms page. Each page's body on its own address is then compared with how it appears embedded: `opportunity-swu-view.scope_section` on `closedSprintWithUs` and `opportunity-twu-view.terms_section` on `closedTeamWithUs`. The pairs must be identical after collapsing whitespace.
- **R-7.23:** Opens the managing screen of `ordinaryPage`, which has three versions. `version_history` must be empty at three points: on arrival, while editing (when `body_being_edited` holds the current wording), and after cancelling.
- **R-7.25:** Three tests, all on `servicePageDisclaimer`:
  - Its title and body can be changed and published, and the published page shows them.
  - The managing screen shows the fixed-page warning, withholds removal and locks the address.
  - A rename and a removal sent through `content-request` are refused. Afterwards the page still answers at its own address and nothing answers at the new one.
- **R-7.27:** No second administrator needs to sign in any more, because `changedByAnotherAdministrator` is seeded. Two tests:
  - For the never-edited disclaimer page, the managing screen must name "System" as both publisher and last editor.
  - For the seeded page, the publisher and last editor must both be named, differ from each other, and neither be "System".

**What I still needed and did not find** (for the contract stage to add)

- **Administrators' names in the seed:** the generated seed doesn't carry `users.administratorOne` or `users.administratorTwo`'s names. So R-7.27 can check that two different people are named, but not that they are the right two.
- **An observation of where the names link:** R-7.27 says each name links to the person's profile. No observation returns where `content-edit.published_by` and `updated_by` link to, so that part is not asserted.
- **Input shapes for the request actions:** the contract doesn't say what input `content-request`'s actions take. I passed `{ slug }` for rename and `{ title, slug, body }` for create, the same form the screens use, and the adapter will need to accept that.

**Other notes**

- `R-7.29`'s existing entry says the removal is refused, pointing to R-7.25. R-7.25 now has a test of exactly that refusal. I left that entry alone because it wasn't among the criteria given to me. Its given — an embedded page that has been removed — is still unreachable through the surface.
- I didn't change anything outside `tests/acceptance`.

## Fix turn

I renamed a local variable in four files so the separation check no longer reads it as Playwright's `page` object. Every line the check named was a use of that variable, never the real page object, but the check matches the text `page.`. The variable held a seeded content record: `seed.content.ordinaryPage` in R-7.16 and R-7.23, `seed.content.servicePageDisclaimer` in R-7.25, and the loop and filter variable over the seed's content handles in R-7.12. I renamed it from `page` to `record`, including its declaration where the check had not named that line (R-7.16, R-7.23 and R-7.25), so each file still refers to one defined name. No test logic, title, header, import or observation changed, and `not-testable.yaml` was not touched. A search of `tests/acceptance/content/` now finds no `page.`, `const page` or `(page)` anywhere. I did not compile the files or run the check again in this stage, so whether the check now passes is still unconfirmed.