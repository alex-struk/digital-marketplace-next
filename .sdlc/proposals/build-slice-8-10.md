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
