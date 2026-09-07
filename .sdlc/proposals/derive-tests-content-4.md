---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "**Condition 1 — restore the eighteen R-8.\\* rows.** Already satisfied in the tree I was handed."
opened: 2026-09-07T16:57:46.757Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** **Condition 1 — restore the eighteen R-8.\* rows.** Already satisfied in the tree I was handed.

I made no edits this run. Here is why, and what I verified.

## Journal

**Condition 1 — restore the eighteen R-8.\* rows.** Already satisfied in the tree I was handed. `tests/acceptance/not-testable.yaml` carries all eighteen ids the condition names — R-8.3, .4, .5, .6, .7, .8, .9, .11, .13, .15, .16, .17, .18, .19, .22, .24, .26, .31 — each with a substantive reason in the same register as the rest of the file (naming specific missing observations: no observation returning a stored file's identifier, no fault-of-the-service observation, no image-dimension observation, and so on). Their version fields check out against `spec/criteria-index.json`: seventeen at v1 and R-8.24 at v2, exactly as the index records. The arithmetic the condition asked for now holds — thirteen R-8 spec files plus eighteen R-8 rows account for all thirty-one files-domain criteria, with no id appearing in both places and none unaccounted for. This slice's seven R-7 rows (R-7.11, .14, .15, .16, .23, .28, .29) are intact, and the R-7.18 removal is preserved: R-7.18 has a spec file and no row. Content likewise closes: twenty-two R-7 spec files plus seven rows equal the twenty-nine R-7 criteria.

**Condition 2 — supply the rows from outside this workspace.** This was a directive to the pipeline rather than to me, and it was honoured. The workspace is still spec-only with no git history and no reachable copy of main, so I could not have recovered the rows from within it; they arrived in the tree instead. That is the mechanism the condition prescribed, and it worked.

**One number to be aware of before ruling.** The condition predicts a 41-entry file; the file carries 58. The seventeen extra rows are fourteen R-1 (opportunities) and three R-3 (organizations) entries — not this slice's work, and not present when the review was written. Under the reviewer's own decomposition the remainder is exact: sixteen R-6 plus eighteen R-8 plus seven R-7 is precisely 41, and 41 plus 17 is 58. So the surplus reads as parallel slices merging in since the review, not as fresh damage. I flag it only because the count no longer matches the condition's text on its face, and whoever rules this should confirm that merge is expected rather than take 58 as a discrepancy.

**What I did not change.** Nothing. Every file in `tests/acceptance/content/` is as I found it — I re-derived no criterion, rewrote no assertion, and touched no `derived` date, since I changed no file's content and a refreshed date on unchanged work would be a false claim. I confirmed in passing that all twenty-two content specs still import only from `../../fixtures` and that their two header lines are intact, but that was reading, not editing.

**One limit on what I can attest.** I verified that the eighteen rows are *present*, *well-formed*, *correctly versioned*, and *arithmetically complete*. I cannot verify they are byte-identical to main, because this workspace has no git and no second copy to diff against. If byte-exactness is part of the gate, that check belongs to a stage that can see the repository; from here, the strongest true statement is that the rows are there and internally consistent with the spec index.

**Surface gaps worth carrying into the next contract.** No new ones surfaced this run, since I derived nothing new. The gaps already recorded against the content domain stand and are the ones to extend toward: an observation of the *shape* or status of a refused page request rather than free-text `refused_for_non_administrator` (this alone blocks R-7.11 and R-7.16); a way to address a service-owned embedded page by handle, so a body written through `content-create` can be read back in an embedded rendering (R-7.14); an action that follows the service level agreement link beside a program's cost, which today exists only as the unfollowable `opportunity_program_select.program_card` observation (R-7.15); observations on `content-edit` for the wording it is showing, a version history, an earlier version or a comparison, plus a restore action (R-7.23); and a second administrator sign-in on the target together with an observation of a version-key collision, without which the concurrent-edit criterion has no way to open two sessions on one page (R-7.28).

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Verified against the repository, not the journal. Every assertion traces to its criterion's own text: "Initial version" is R-7.12's then clause, "System" is R-7.27's, the 50,001/101-character bounds are R-7.20's, and R-7.21's five malformed addresses are its given verbatim. No routes, selectors, test ids, status codes or column names appear in any of the twenty-two files; all surfaces, actions, observations and personas they name exist in spec/contract/, and all import only from ../../fixtures. The seven not-testable reasons each name a real hole confirmed against the contract: `refusal` is declared for files and exports only and never for a page request (R-7.11, R-7.16); content-edit declares no body, history, version or comparison observation and no restore action (R-7.23); personas.yaml carries a single administrator (R-7.28); opportunity-program-select exposes program_card with no action to follow and no learn-more surface exists (R-7.15). Condition 1 holds by count, not by claim: eighteen R-8 rows, seventeen at v1 with R-8.24 at v2 matching criteria-index.json, and 13 spec files + 18 rows = all 31 files criteria; R-7 closes the same way at 22 + 7 = 29. The 58-versus-41 discrepancy the proposal flagged is a merge and not damage — the surplus is fourteen R-1 and three R-3 rows from the still-open opportunities and organizations slices (36/56 and 28/35 covered), while content and files close exactly and 16+18+7 is the predicted 41. Checks are green; the five superseded-criterion warnings are all in files/ and notifications/, and this domain's three superseded criteria correctly carry rows and no tests. Two observations recorded without holding the gate: R-7.18's test asserts the fixed-page warning, locked address and withheld removal, which read as R-7.25's outcome but are the domain preamble's own definition of a page the service creates for itself; and R-7.1's not.toContain("**") rests on a claim about the seeded body that the seed manifest does not record, so it may pass vacuously though it cannot fail wrongly.

**Conditions:**
none
