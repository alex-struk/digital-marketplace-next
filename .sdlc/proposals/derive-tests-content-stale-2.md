---
gate: G3
question: "Do these tests follow from the content criteria and from nothing else?"
recommendation: "I rewrote all five content criteria as test files, and none went to `not-testable.yaml`."
opened: 2026-09-15T01:59:31.228Z
---

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** I rewrote all five content criteria as test files, and none went to `not-testable.yaml`.

I rewrote all five content criteria as test files, and none went to `not-testable.yaml`. There were no entries there for these IDs, so no file clashes with one. The scan for patterns the separation check rejects is clean. **I could not run the type check:** `tsc` needs approval this session doesn't have, so the files are type-checked only by reading them against `surface.d.ts`, `seed.ts` and `personas.ts`. The scan did catch one real problem: a local variable named `page` breaks the check's `page.` rule. I renamed it before finishing.

All five files already existed from the last approved derivation, and four of them were on the redo list (every one except the one-test R-7.22 file). I rewrote all five and put this run's spec sha and date in the headers. The redo notes shaped most of the changes:

- **R-7.9 (one test):** removes the seeded page `seed.content.ordinaryPage`. The seed says it has three versions, which matches the criterion's starting state. The test first publishes one more change, so it holds both the wording it replaced and the current wording. It then polls for the removal notice rather than reading it once, as the redo asked. It checks that the list no longer carries the address and that a visitor gets not found. For "no version survives anywhere", which the earlier file left unasserted, it publishes a new page at the freed address. That page's `versionHistory` on the managing screen must hold neither old wording.
- **R-7.12 (two tests, one per given/when/then):** before reading, the test signs in as an administrator and requires `fixedPageWarning` on each of seven service-wide pages. Those are about, accessibility, copyright, disclaimer, privacy, markdown-guide and terms-and-conditions, the addresses the spec and contract name. The redo said the target carried none of these pages, so a failure now points to the missing starting state rather than the criterion. A visitor then reads each page, expecting its title to equal its address and its body to contain "Initial version". The second test only checks that the list marks pages as needed. The count of twenty-two is not asserted, because nothing returns how many pages the list names. The seed's own ordinary page would also make "all marked as needed" false on any seeded target.
- **R-7.22 (two tests, create and rename):** both halves now finish the confirmation step before reading `duplicateSlugError`, which was the redo's complaint. The taken address is the seeded page's rather than the criterion's example "about". The rule is the same for any address, and the seeded page is a record the test can confirm is there.
- **R-7.25 (one test):** the test confirms the disclaimer page exists before reading the warning, the locked address and the withheld removal. As the redo asked, it doesn't just take the screen's word. It tries removal and renaming through the managing screen, then reads the page where it stands: still at its address, with nothing at the other one. It also changes the title and body and has a visitor read them back.
- **R-7.27 (two tests):**
  - The first confirms "accessibility" exists and is a service-created page, then expects "System" as both publisher and last editor.
  - The second follows the criterion's two-person starting state, which the old file had narrowed to one administrator. It reads both names from `userProfile.nameField` using the seed IDs for `administratorOne` and `administratorTwo`. It confirms the seeded page was published by the first, has `persona.administratorOther` change it, and expects each name in its place.
  - **Expect the second test to fail on the old application.** `personas.yaml` records that this persona can't be signed in there; it has only a sandbox identity-provider sign-in. The failure comes from the target, not from the criterion.

Two parts can't be observed, and I asserted neither:
- **R-7.12:** nothing gives the number of pages on the list, or the marking row by row. This needs something like `content-list.page_count` or a per-row reading of addresses with their marking.
- **R-7.27:** `published_by` and `updated_by` return text only, so nothing shows that each name links to the person's profile. This needs an observation of where each name leads.

R-7.25's "a request to rename or remove it made another way is refused" has no action for sending a request outside the screen. That is the same gap already recorded for R-7.11 and R-7.16, which were refused for the same reason. Attempts through the screen are the nearest thing a test can make.
