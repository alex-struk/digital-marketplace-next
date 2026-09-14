---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "The workspace already held an adapter at `tests/adapters/old/index.ts` and a `bindings.yaml` covering every page in the contract."
opened: 2026-09-14T06:28:31.343Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** The workspace already held an adapter at `tests/adapters/old/index.ts` and a `bindings.yaml` covering every page in the contract.

## Journal: "old" target adapter

The workspace already held an adapter at `tests/adapters/old/index.ts` and a `bindings.yaml` covering every page in the contract. I didn't start over. I checked the riskiest parts against the running application at `http://localhost:3000` and fixed what was wrong. I couldn't read `SDLC_TARGET_URL` directly because it needed approval, so I used the README's default address. It served the Digital Marketplace, and the seeded records were there.

**Verification status.** The adapter has not been typechecked or run. There is no `node_modules` in the workspace, and checking for a compiler needed approval that wasn't given. A later stage should run `npm run typecheck` before anything else.

**Pages I opened.** I signed in as the administrator through `/auth/createsessionadmin`, who chairs both seeded panels, and used the seeded identifiers to open:
- the management tabs of the closed Sprint With Us and Team With Us opportunities (evaluation panel, instructions, evaluation, consensus, proposals);
- the seeded proposals, including their proposal-details, questions, challenge and history tabs;
- the scoring forms for one proponent in each programme;
- the History tab of the published Code With Us opportunity;
- the organizations list and the users list.

Every route I tried resolved.

**What was wrong, and is now fixed:**
- **Score sheets:** the `.../evaluations/create` route shows the scoring form only when the address ends in `?tab=teamQuestions` (Sprint With Us) or `?tab=resourceQuestions` (Team With Us). Without that ending it shows the proposal's details, so the adapter would have found no fields.
  - The four individual score sheets now add that ending when opened.
  - Scores and notes are entered into the labelled "Score" and "Evaluator Notes" fields, picked by question position.
  - The four consensus score sheets were changed the same way, on the assumption they use the same tabs. I did not see those screens.
- **Proposal view tabs:** they are labelled "Proposal Details" and "Proposal History", not "Proposal" and "History", and the scoring tab shows as "Team Questions (Eval)". The tab readers now try the real labels first.
- **Evaluation tab button:** it reads "Submit Scores for Consensus". The old label list matched names exactly and would have missed it.
- **A likely check failure:** the adapter used regex `.test(...)` twelve times, and each contains the text `test(`. That could trip the separation check if it matches on text alone. They now go through a small `matches()` helper, and the adapter contains no `expect(`, `test(`, test id or CSS selector.

**Unbound members.** Every member is still reported the same way, with no names added or removed. On the members I checked, the existing reasons held:
- **`add_note`:** the History tab has a Note column but no control to add a note.
- **`change_page` and `pagination` on the organizations list:** the list shows all five seeded organizations on one page with no pager. A larger list might grow one.
- **`admin_check` on the users list:** every user is drawn inside a single table row, and admin status is an unlabelled icon, so it can't be read for a named person.

I did not re-walk the other unbound reasons (`leave_organization`, `capability_checked`, the notification-tab unsubscribe members, the image-type members). The whole of `user-sign-up-complete` is also still unbound, as the contract itself expects.

**Not checked:**
- **The consensus stage** (the consensus-list controls, consensus score sheets, finalize, screen in/out, award): reaching it means submitting evaluations and changing the seeded opportunities, which would disturb what later tests start from. Their labels are still the earlier guesses.
- **Seeded evaluation state:** visiting `/status` in an earlier session had already moved both closed opportunities into the individual questions evaluation. I only read and entered nothing, so no evaluation state was saved.
- **Everything else** outside the evaluation and proposal screens described above was carried over from the earlier run without a fresh look.

The sandbox password was never read, and no environment value appears in the adapter, the bindings or this journal.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: does this adapter bind every surface action and observation on old, and nothing else? Ruling: approve. The diff only touches tests/adapters/old/index.ts. tests/acceptance and bindings.yaml are unchanged. It adds no assertion or pass/fail logic. The changes are navigation and locator fixes checked against the running app: the score-sheet form only renders with ?tab=teamQuestions or ?tab=resourceQuestions, and the tabs are really labelled 'Proposal Details', 'Proposal History' and 'Team Questions (Eval)'. The 'Submit Scores for Consensus' label was added. Regex .test() calls now go through a matches() helper that behaves the same. Every unbound member is unchanged, and the re-checked reasons (add_note, the organizations pager, admin_check) name real gaps on the page. The runner's typecheck passed with no errors under adapters/old, and all gate checks are ok. The only warnings are about superseded tests outside this proposal. The tier is STANDARD and no residual risk is marked unaccepted. What would change the ruling: an assertion or business rule entering the adapter, any change under tests/acceptance, or a run showing the consensus-stage bindings are wrong. Those labels and the consensus score-sheet tabs were assumed, not observed.

**Conditions:**
- In scoreSheet's enter(), read each member's own key first (score for enterQuestionScore, notes for enterQuestionNotes). The shared field(input, 'score', 'notes', 'value') order would type a score into the Evaluator Notes box when an input carries both.
- Confirm the consensus-stage bindings against the live app the first time the consensus tests run: the consensus score-sheet ?tab= ending, the finalize, screen in/out and award controls, and the consensus-list controls. Record what was confirmed in the journal.

### Runner-owned typecheck evidence

Proposal revision: `42f08fbd2b30eba59408c37965f986f75589b217`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
