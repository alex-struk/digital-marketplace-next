---
gate: G3
question: "Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?"
recommendation: "I fixed the R-1.11 failure."
opened: 2026-10-02T07:36:51.490Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I fixed the R-1.11 failure.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the R-1.11 failure. The Code With Us form now starts "Is remote work acceptable?" with neither Yes nor No chosen, as the catalogue's `opportunity-cwu-create` story draws it. `npm --prefix app run check` passes: typecheck plus 16 migrations tests, 427 backend tests and 279 frontend tests. I did not start the application in compose this time, so the fix is confirmed by unit tests only, not against the running app.

**The fix.** The form used to start the question on No, so a form where nobody answered it was published as on-site instead of being refused. In `app/frontend/src/screens/opportunity-cwu-form.tsx`:
- The form now holds no answer (null) until Yes or No is chosen.
- While it holds no answer, nothing about remote work is sent; the `remoteOk` key is left out of the request.
- The form's own check, which runs before submitting for review or publishing, now catches an unanswered question. It shows the existing message ("Remote work: say whether remote work is acceptable.") in the error list and on the question, and sends nothing.
- The service already refused a request with no answer in the same words, so I left it unchanged.
- Saving a draft with no answer is still accepted, as R-1.9 requires.

The request type in `app/frontend/src/api/opportunities.ts` now makes `remoteOk` optional.

**One limitation.** The database column we kept from the original schema cannot be empty, so a draft saved with no answer is stored as "not acceptable". When it is opened again on its manage page, the form shows No. Only the create form can hold no answer. Changing this would mean finding somewhere to store "no answer", which the kept schema doesn't have.

**Decision records.** New record 0042 replaces 0031's choice of where the question starts, and records the limitation above. I marked 0031 as superseded on that point. The Sprint With Us and Team With Us create forms still start on No (record 0041). The ruling named only Code With Us, and those forms' rules belong to slice 10, so a later ruling may want them changed to match.

**Unit tests.** In `app/frontend/tests/code-with-us-opportunities.test.tsx`:
- The test that submits an empty form for review now expects the remote-work refusal among the problems listed, with nothing sent.
- The radio test now checks that neither answer is chosen at first, then chooses No and then Yes.
- A new test saves a draft with the question unanswered and checks that the request has no `remoteOk` key.

**The six older conditions.** I checked each one against the current code; earlier revisions had already met all of them, and the latest ruling, which found every slice 8 criterion passing and only R-1.11 failing among the earlier slices, agrees.
- **`build-slice-8-3#1` and `#3`** (R-1.3 and R-1.38, the list read as empty): fixed by records 0038 and 0039, so the list no longer comes up empty.
- **`build-slice-8-3#2`** (R-1.5): a second watch of the same opportunity is now refused under "conflict" (record 0037, `app/backend/src/rules/opportunity-list.ts`).
- **`build-slice-8-3#4`** (R-7.18): the service level agreement link and its page are in place on every screen R-7.18 names (record 0037).
- **`build-slice-8-3#5`** (R-1.23): dates now show in Pacific time through `readDate` (record 0037).
- **`build-slice-8-3#6`** (layout): the catalogue's page container and stack are defined once in `app/frontend/src/app/page-layout.tsx`, the root layout wraps every screen in the container, and each screen uses its stack (record 0037).

I made no changes outside `app/` and `docs/decisions/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 8 do what its criteria say, and does this revision settle what earlier rulings left owed? Verify is pass and current: all 9 of slice 8's criteria passed against application tree 410b7b2, which matches this branch. Every change outside .sdlc and the test results is under app/ or docs/decisions/. The remaining condition (build-slice-8-9#1, R-1.11) is carried out in app/frontend/src/screens/opportunity-cwu-form.tsx. The question's value is null until Yes or No is chosen (lines 92-109). submissionOf leaves remoteOk out of the request while it has no answer (line 145). inputOf passes the null to the shared rules, so submitting for review or publishing is refused with the existing message, while a draft is still accepted (R-1.9). Decision record 0042 supersedes 0031 on where the question starts. Unit tests in code-with-us-opportunities.test.tsx cover the unanswered start, the refusal and the draft. The six build-slice-8-3 conditions are settled by records 0037-0039: R-1.3, R-1.38 and R-1.5 now pass in the slice's own verify, and R-7.18, R-1.23 and the page layout are in place where the proposal names them. One limit remains and is recorded in 0042: the kept schema's remoteOk column cannot be empty, so a draft saved with no answer reopens on its manage page showing No. I accept that, because the create form, which is the path the condition and the catalogue story name, now behaves as asked, and closing it would need a schema decision rather than a build fix. What would change the ruling: a verify result recorded against a different tree, or a ruling that a reopened unanswered draft must also stay unanswered, which would need somewhere to store 'no answer' first.

**Conditions:**
- condition-met build-slice-8-9#1: The Code With Us form holds remote: null until Yes or No is chosen and leaves remoteOk out of the request while it has no answer (app/frontend/src/screens/opportunity-cwu-form.tsx lines 92-109, 145). Its own check refuses review or publication with 'Say whether remote work is acceptable.', while a draft is still accepted. Decision record 0042 supersedes 0031 on this point. Covered by app/frontend/tests/code-with-us-opportunities.test.tsx.
- condition-met build-slice-8-3#1: R-1.3 passes in verify for build-slice-8-10 against tree 410b7b2 (decision records 0038, 0039).
- condition-met build-slice-8-3#2: A second watch is refused under 'conflict' through NamedRefusal (app/backend/src/watching/watching.service.ts, app/backend/src/rules/opportunity-list.ts WATCH_REFUSALS). R-1.5 passes in verify for build-slice-8-10.
- condition-met build-slice-8-3#3: R-1.38 passes in verify for build-slice-8-10 against tree 410b7b2 (decision records 0038, 0039).
- condition-met build-slice-8-3#4: The service level agreement page and the links to it on the learn-more index, program cards and opportunity forms are in place (decision record 0037; app/frontend/src/screens/learn-more.tsx and the opportunity forms).
- condition-met build-slice-8-3#5: Dates are shown as the Pacific-time day through readDate (app/frontend/src/lib/dates.ts, tests in app/frontend/tests/dates.test.ts; decision record 0037).
- condition-met build-slice-8-3#6: The catalogue's page container and Stack are defined once in app/frontend/src/app/page-layout.tsx, the root layout puts the container round every screen, and each screen uses Stack (decision record 0037; app/frontend/tests/page-layout.test.tsx).
