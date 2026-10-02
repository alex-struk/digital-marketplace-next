| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-02T18:15:49.904Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** I changed no files in this run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed no files in this run. The one item handed to me, a private note on an opportunity (R-1.33), was already supplied on main before the item was raised. I checked it against the running oracle and it works.

**Why the item came back.** The build-slice-9-4 review, ruled at 11:08 local today, asked contract for "a seeded Code With Us or Sprint With Us opportunity whose history holds a private note carrying a file." It based that on the test writer's not-testable reason in `tests/acceptance/not-testable.yaml`, written on 2026-09-29. Contract-v30 was approved at 09:16 the same morning, two hours before that review, and had already done everything the reason asked of this stage:
- It removed `add_note` from `opportunity-cwu-edit` and `opportunity-swu-edit`.
- It added `tests/seed/016-opportunity-note-and-cancellation.sql`. This seeds a published Code With Us opportunity with a 2030 deadline. Its history holds a note (event `NOTE_ADDED`) written by its author, with one file attached.
- It added the manifest handles `opportunities.cwuWithPrivateNote` and `stored_files.opportunityNoteAttachment`.
- It added the `opportunity-history-request` page. On it, `history_shown` reports whether a reader got the history at all, and `history_entries` lists each entry's kind, text, author and attached files.

The review's ruling says the opposite, so it must have been working from the stale reason rather than from main.

**What the oracle showed.** `oracle up` brought up four copies with the existing `.sdlc/oracle/compose.yml` unchanged. Each ran 78 migrations, the seed loaded with no errors, and the app served on port 4300 with mail at port 8025. I then read `/api/opportunities/code-with-us/00000000-0000-4000-a039-000000000001` three ways:
- **As the administrator** (`/auth/createsessionadmin`): the history includes the `NOTE_ADDED` entry, its text and `opportunity-note-attachment.txt`.
- **As the author, a public sector staff member** (`/auth/createsessiongov`): the same.
- **As a signed-in vendor** (`/auth/createsessionvendor/1`): the published opportunity, with no history at all.

The page's own comment already records one more behaviour: the old service also returns the history to a request with no session. That is where the old target and the criterion part ways. I ran `oracle down` afterwards, and the oracle is down.

**Rest of the contract.** It stands as contract-v31 left it, and I did not reopen it:
- `surface.yaml` has 112 pages, each with a domain.
- In `personas.yaml`, every persona has a sign-in entry for both identities. The anonymous visitor writes `sign_in: null`. On the oracle, the session route covers the administrator, the staff author and vendors 1 to 11 and 17. The second administrator, second staff member, the first-time accounts and vendor 13 are marked unavailable there, each with its reason. Under the sandbox IdP, each persona has its own username.
- The seed runs from `000-installation.sql` to `016-opportunity-note-and-cancellation.sql`, with its handles in `manifest.yaml`.

**Not supplied.** Contract-v30 seeded only the Code With Us note. It did not add the Sprint With Us note, the administrator-written note, or the edit-screen observation that the older not-testable entry also asked for. The item handed to me asks for "Code With Us or Sprint With Us", so one opportunity is enough to observe who can read a note. Whether the edit screens offer a note control is the design stage's matching item, not this one. The clause about the service accepting a note from a request no screen sends is ratify's to restate, as the not-testable entry says.

re-address missing-test/R-1.33 to derive-tests: supplied on main by seed `tests/seed/016-opportunity-note-and-cancellation.sql` (handles `opportunities.cwuWithPrivateNote` and `stored_files.opportunityNoteAttachment`), read through page `opportunity-history-request` (`history_shown`, `history_entries`), with `add_note` already removed from both edit pages. On the oracle the note and its file appear to the administrator and the author and are withheld from a signed-in vendor. The not-testable reason for R-1.33 dated 2026-09-29 is out of date and should be rewritten when the test is written.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the contract the tests act through already supplies what missing-test/R-1.33 asks for: a seeded Code With Us or Sprint With Us opportunity whose history holds a private note carrying a file, observable by the author or an administrator and withheld from a vendor. It does, and this run correctly changed nothing. On main, contract-v30 added tests/seed/016-opportunity-note-and-cancellation.sql with the handles opportunities.cwuWithPrivateNote and stored_files.opportunityNoteAttachment (manifest.yaml lines 1153 and 1396, the attachment tied to the note). It added the opportunity-history-request page, which exposes history_shown and history_entries, and it removed add_note from both opportunity edit pages. The stage reports reading the seeded opportunity on the oracle: the administrator and the staff author saw the NOTE_ADDED entry and its file, and a signed-in vendor got no history. That is exactly what the condition needs a test to be able to observe. The build-slice-9-4 review asked for this work because it was reading the 2026-09-29 not-testable reason for R-1.33, which is out of date. That reason should be rewritten when derive-tests writes the test. missing-test/R-1.33 now belongs to derive-tests, not contract. The withdrawal belongs to a later ruling once that test runs; it is not expressible in this condition grammar. R-1.33 is already confirmed and accepted, and nothing here touches its wording or confidence, so it is recorded with contract only. The service returning history to a request with no session is a gap between the old target and the criterion. It belongs to calibration, as a defect-in-old candidate, and does not count against this contract. The ruling would change if a test written against these handles could not observe the note as author or administrator, or saw it as a vendor. That would mean the seed or the page is not doing what the contract claims.

**Conditions:**
- contract R-1.33
