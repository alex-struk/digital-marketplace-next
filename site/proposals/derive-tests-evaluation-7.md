| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T00:26:04.511Z |
| holder | agent:reviewer |

# Do the revised evaluation tests now follow from their criteria and from nothing else?

**Recommendation.** I made changes for the four conditions that were mine: R-5.22, R-5.25 and R-5.28 now assert only what their criteria state, and R-5.20, R-5.27, R-5.31 and R-5.33 now read mail on the same premise.

I made changes for the four conditions that were mine: R-5.22, R-5.25 and R-5.28 now assert only what their criteria state, and R-5.20, R-5.27, R-5.31 and R-5.33 now read mail on the same premise. Conditions 5 and 6 belong to the seed or harness owner and to the runner, so I did nothing on them. TypeScript isn't installed in this workspace, so I could not typecheck. Python needed approval, so I also could not parse `tests/acceptance/not-testable.yaml` by machine; checking its ids by search showed nothing duplicated.

Of the files already in `tests/acceptance/evaluation/`, only R-5.16, R-5.20, R-5.22, R-5.25, R-5.27, R-5.28, R-5.31 and R-5.33 changed, and their header dates moved to 2026-09-13. All other files and all pre-existing not-testable entries are byte-for-byte as I found them.

**Condition 1 (R-5.22).** The individual-evaluation create and edit pages report a rejected score in exactly one way, `score_out_of_range_error`, and no other observation there says an entry was refused. So I removed the decimal-places test instead of pointing it at the wrong rule, and rewrote the file's comment to say why. I added an R-5.22 entry to not-testable.yaml marked `blocked:`. It covers only that part and asks for a decimal-places observation on `evaluation-individual-create-swu` and `-twu`, such as `score_too_many_decimal_places_error`. The out-of-range and empty-comment tests are unchanged.

**Condition 2 (R-5.25).** I removed the `submitDisabledUntilComplete` assertion from the first test, along with the comment paragraph that justified it. The test now submits, reads the refusal sentence the criterion quotes, and checks that a complete draft is still editable.

**Condition 3 (mail).** I settled it against `spec/contract/observables.yaml`, not either earlier position. The contract says a message has one visible recipient and blind-copies the rest, and that the blind-copy list comes only from reading one message by its identifier. The `mail` fixture offers only `messagesTo`, which searches by visible recipient.

Condition 3 offered two fixes, and neither works:
- **Reading the blind-copy list:** `mail` has no call that reads one message, and tests may not reach past it.
- **Reading every administrator in R-5.31:** that contradicts the contract.

R-5.31 was also inconsistent with itself: it gave that premise as its reason for skipping the second administrator, yet still expected both the owner and the first administrator to be found by that same search.

All four files now rest on one premise. Each clears the catcher, triggers its event, and polls until a message arrives addressed visibly to one of the people the criterion names:
- **R-5.20:** the two evaluators.
- **R-5.27 and R-5.33:** the chair and the owner.
- **R-5.31:** the owner and both seeded administrators.

The part these tests can't show — that the notice reached every named person — is recorded as `blocked:` entries for R-5.20, R-5.27, R-5.31 and R-5.33. Each asks for a `mail` call over `read_one_message` that returns the blind-copy list.

These entries, like the R-5.22 one, cover part of a criterion that still has a test file. Condition 1 invited that form, but a checker expecting each criterion to be either a file or an entry, never both, may flag it.

**Condition 4 (non-blocking).**
- **R-5.28:** after both evaluators submit, the reader is now the public sector employee on the panel, not the administrator. They open the consensus form, which is where the contract puts `panel_member_score` and `panel_member_notes`. The notes must contain the other evaluator's own comment, so a form showing only the reader's own work fails. That this person may open the form rests on two things: R-5.29 has a non-chair evaluator reach it, and the domain says consensus contents are withheld only from people off the panel. That reader is also the owner, which the comment explains.
- **R-5.16:** the fifth test now signs out the administrator and has the owner attempt the panel change after consensus.

**Condition 5 (seed or harness).** Not acted on. Walking tests still compete for the two seeded closed opportunities, and fixing that needs seed or harness changes outside my paths.

**Condition 6 (runner).** Not acted on, and I have no typecheck result to report. The edits stay within the generated signatures: string arguments to `messagesTo`, promises flattened into an array, and string matchers on observations that return strings.

The contract should be extended in three places:
- a `mail` call that reads one message, including its blind-copy list (with it, four criteria could be tested in full);
- a decimal-places observation on the individual-evaluation create pages;
- the existing `blocked:` gaps: refusal observations on the individual-evaluation pages, a single-evaluation submit, a draft save that skips the form's checks, and a sign-in for a second public sector account.

## Fix turn

All five failed checks are fixed: no evaluation criterion appears in both `tests/acceptance/not-testable.yaml` and a spec file any more.

Journal addition: The five failures came from one mistake in my last pass. I had kept R-5.20, R-5.22, R-5.27, R-5.31 and R-5.33 as spec files and also given each a not-testable entry for the half the test could not reach. The format doesn't allow a criterion to be both, so I deleted those five entries and left every other entry untouched. The evaluation domain now has six not-testable entries (R-5.11, R-5.21, R-5.23, R-5.26, R-5.34, R-5.37), and none of them has a spec file. That matches the reviewer's count of 24 test files and 6 records. Each of the five spec files had a comment saying its missing half "is recorded in not-testable.yaml", which was no longer true. In each file I changed only that sentence so it names the missing piece directly. For R-5.20, R-5.27, R-5.31 and R-5.33 that is a `mail` call over `read_one_message` that returns a message's blind-copy list. For R-5.22 it is a decimal-places observation on the individual create pages, such as `score_too_many_decimal_places_error`. No test body or header changed. Two things the check does not catch still stand. First, the contract stage needs a new home for these missing pieces: they are now written only in spec-file comments, not in the not-testable list. Second, none of this touches the reviewer's six conditions, which remain as they were after my previous pass.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the revised evaluation tests now follow from their criteria and from nothing else? Ruling: return, on one assertion. The writer met every condition that was theirs from derive-tests-evaluation-6. In R-5.22 the decimal-places test is gone and the missing observation is named in the file's comment. R-5.25 no longer checks for a disabled control. R-5.20, R-5.27, R-5.31 and R-5.33 now share one premise taken from spec/contract/observables.yaml: a message has one visible recipient and blind copies for the rest, and the mail fixture offers only a search by visible recipient. R-5.28 now reads as a panel member who is not an administrator and requires the other evaluator's comment. R-5.16's fifth test now has the owner try the change. The runner's typecheck lists no errors under acceptance/evaluation/. The 24 test files and 6 not-testable entries cover the domain, and no criterion appears as both. The remaining defect is the same kind the last ruling returned in R-5.25. R-5.22's second test ends by checking that the submit control on the individual evaluation list is disabled. R-5.22's criterion says only that the evaluation cannot be submitted until complete; it says nothing about a disabled control. The check also contradicts R-5.25, where a submit on the same list is clicked for an incomplete set and must return the refusal sentence, so the control has to be enabled. And the test never saves the empty-comment draft (the R-5.23 entry says the form refuses to), so the list it reads does not hold the evaluation the criterion is about. Non-blocking notes: the four mail tests pass on any message to any named address, and the owner, who is one of those addresses, may get other mail from the same event, so they discriminate weakly. Filtering by subject would assert wording no criterion gives, so this is a limit of the mail contract. R-5.12 changes the seeded panel and never restores it, which adds to the seed contention in condition 5. The ruling changes to approve when R-5.22's second test stops relying on the disabled-control check.

**Conditions:**
- R-5.22: remove the submitDisabledUntilComplete assertion from the second test. Either stop after emptyNotesError and say in the comment that the submission half cannot be shown without saving a draft the form refuses (which R-5.23 records as missing), or show the refusal the way R-5.25 does: save an incomplete draft, submit, and read incompleteEvaluationError. Do not assert a disabled control.
- Carried forward, not the writer's: the seed or harness owner should give each walking test its own closed opportunity, or reset between files, so that tests like R-5.12 and R-5.16 stop changing the shared seeded panel under the others.

### Runner-owned typecheck evidence

Proposal revision: `8b8f4ada1afcd31e9edb6db382d0146ac4221f96`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/users/: 89 diagnostics
    acceptance/opportunities/: 73 diagnostics
    acceptance/files/: 13 diagnostics
    acceptance/notifications/: 13 diagnostics
