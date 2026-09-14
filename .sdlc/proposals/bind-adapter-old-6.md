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
