| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T14:09:01.673Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?

**Recommendation.** I changed nothing under `app/` or `docs/decisions/` in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I changed nothing under `app/` or `docs/decisions/` in this revision. The ruling found no fault in the application: all 12 failing criteria trace to how the test adapter was bound before this build, and all three of its conditions are addressed to bind-adapter. Changing the application here would only alter what that stage has been asked to walk.

**What the evidence shows.** Before deciding, I read the pictures and outlines verify kept, and they agree with the ruling:

- **The per-proponent consensus page** (R-5.10's outline is one example) is served at its create route to the administrator who chairs the panel. It shows the heading "Proponent 1", each question with the evaluators' scores, and an agreed score and comment field for each question.
- **The consensus tab** (R-5.32's outline) has an action bar holding "Edit", "Finalize consensus scores" and "Cancel opportunity". Under it is the Consensus section with the row for each proponent, the status, and "Submit final consensus scores". The finalize control is in the action bar, not inside the Consensus section where the adapter looked.
- **The R-5.29 case before consensus** (R-5.29-3) answers "Page not found" on an opportunity still in individual evaluation. That is the deliberate refusal R-5.29 requires, because the consensus pages exist only while the opportunity is in consensus.

**Contract ids.** I checked that every id `surface.yaml` gives for the two consensus tab pages is in the markup. That includes `finalize-consensus-button`, `evaluation-finalize-dialog`, `evaluation-finalize-confirm`, `evaluation-not-all-submitted-error`, `evaluation-no-screenable-error` and `evaluation-consensus-withheld-message`. They are all in `evaluation-consensus-tab.tsx`, `evaluation-consensus-form.tsx` and `opportunity-other-manage.tsx`, and the frontend unit tests in `app/frontend/tests/consensus.test.tsx` refer to them.

**The check.** The workspace had no installed dependencies, so the check first stopped at "tsc: not found". After a clean install, `npm --prefix app run check` passes: 16, 803 and 494 tests across the three test runs. The error lines in its log come from tests that deliberately exercise failure paths (mail not delivered, deadline closing failing), not from failures.

**Criteria.** All fifteen on the slice's list (R-1.41, R-1.50, R-2.29, R-5.10, R-5.12, R-5.13, R-5.14, R-5.28, R-5.29, R-5.30, R-5.31, R-5.32, R-5.33, R-5.36, R-6.15) stay as the previous turn of this slice built them. Decision record 0063 still covers how they are reached and the one known departure: R-6.15 sends one copy to each reader, addressed to the service and that reader, rather than blind copies. The ruling left that wording to be judged after the adapter is rebound.

**Left for bind-adapter**, since it is not mine to do:
- Walk and bind the four per-proponent consensus create and edit pages.
- Bind the finalize control, its confirmation dialog and the two refusal messages to the action bar of the consensus tab.
- Read the not-found answer for a consensus page opened before the opportunity reaches consensus as the refusal R-5.29's test waits for.

The ruling's path to approval is a fresh verify after that rebinding, with no failures.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether slice 18 does what its criteria say, and verify recorded a fail against the current application tree, so an approval is refused. Two criteria failed, for different reasons. R-5.10 is the adapter's fault: the evidence shows each consensus tab displaying exactly the refusal the criterion requires ('...screened into the Code Challenge.' for Sprint With Us, '...screened into the Challenge.' for Team With Us). The adapter's confirmFinalizeConsensus throws whenever a refusal alert appears (tests/adapters/new/index.ts:2130), so the test never reaches noScreenableProponentError(), the step where it reads the refusal. That goes to bind-adapter. R-6.15 is the application's fault: the adapter read the caught message correctly, and it shows the reader as a visible recipient beside the service address with no blind copies at all. The criterion requires multi-recipient notices, including those to a panel and to an opportunity's owner, to carry the batch as blind copies with only the service's own address visible. Decision record 0063's one-copy-per-reader departure does not satisfy that, so the build must conform. The ruling would change to an approval after the adapter is rebound for R-5.10, R-6.15 is built to the criterion, and a fresh verify on this proposal shows no failures.

**Conditions:**
- addressed-to bind-adapter: R-5.10: evaluation-consensus-list-swu.confirm_finalize_consensus and evaluation-consensus-list-twu.confirm_finalize_consensus throw when the finalize refusal alert appears (tests/adapters/new/index.ts:2130, which stores finalizeRefusal and then throws). The page at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=consensus shows 'The consensus scores could not be finalized — You must have at least one proponent that can be screened into the Code Challenge.', and the Team With Us page at /opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus shows the same refusal naming the Challenge. That is the outcome the test expects, and its next step, noScreenableProponentError(), is where it reads that text. Confirming must complete when the page answers with a refusal, and noScreenableProponentError must return the refusal text.
- R-6.15, in the case "the notice sent to an opportunity's owner": Error: a notice that reached more than one of the people — Expected: > 0 — Received:   0 — at tests/acceptance/notifications/R-6.15.spec.ts:96 — its last steps: caughtMessage.copiedRecipients() at /opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus read "" → caughtMessage.open({messageId}) at /opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus → caughtMessage.visibleRecipients() at /opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus read "donotreply@example.test staff.one@example.test" → caughtMessage.copiedRecipients() at /opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus read "" — the page as it failed: .sdlc/evidence/slice-18/R-6.15.png, .sdlc/evidence/slice-18/R-6.15.txt
- R-6.15: app/backend/src/mail/message.ts addressedToEach and app/backend/src/mail/mailer.ts (alsoToService) send each reader a copy where they are a visible recipient. The criterion requires a multi-recipient notice, including the panel, chair and owner notices in app/backend/src/evaluations/consensus.service.ts, to carry the batch as blind copies with the service's own address as the only visible recipient. Change the staff notices to that form, and update decision record 0063 so it no longer records the one-copy-per-reader departure.
