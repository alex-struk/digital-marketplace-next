---
gate: G3
question: "Is this adapter a faithful binding of the contract surface to the old target?"
recommendation: "Approve. 658 of the 680 actions and observations are bound against the running application; the 22 that are not each name what is missing and where it was checked. Two contract routes were found not to resolve as written and are reported rather than worked around."
opened: 2026-09-11T03:49:05.581Z
---

# Is this adapter a faithful binding of the contract surface to the old target?

**Recommendation.** Approve. 658 of the 680 actions and observations are bound against the running application; the 22 that are not each name what is missing and where it was checked. Two contract routes were found not to resolve as written and are reported rather than worked around.

This proposal carries work the bind-adapter stage produced on 2026-09-11 over 501 turns. The stage failed its post-checks, but not on the adapter: the separation rule forbidding a test definition matched on a word boundary, so nine ordinary regular-expression calls of the form SOME_REGEX.test(line) read as test definitions. agentic-sdlc e964d38 fixes that rule and covers it with tests. All nine project checks pass with these files in place, unchanged. The files were re-proposed by hand rather than regenerated, because regenerating would discard 501 turns of verified browser work to reproduce it; that is a recorded exception to the rule that the project is only ever changed by the pipeline. Read the agent's own account in .sdlc/journal/060-bind-adapter.md: it explored the target signed out and as nine identities, and reports four habits of the application that shaped every binding, each verified against named cases. What to weigh. Whether the 22 unbound entries are genuinely absent from the application or merely not found; whether the two routes that do not resolve are contract defects to route back to the contract stage; and whether binding by exact visible text, which this target forces because its buttons are anchors carrying no role, is acceptable or too brittle.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Adapter-only diff with nothing under tests/acceptance touched, no assertions or pass/fail logic in the bindings, all 680 contract names present once each, and 22 unbound entries whose reasons each name a concrete missing control or page and where it was checked. The nine separation-rule hits are verified false positives on regex .test() calls. The recommendation overstates its evidence: roughly 215 members on the SWU/TWU proposal pages, the evaluation sheets and the two non-CWU opportunity pages were bound from patterns rather than against the pages, which the journal discloses and the bindings file does not distinguish. Accepted because those bindings fail loudly with a named unbound error naming page, member and labels tried, making the first calibration run the real verification. Provenance rests on the journal alone, since the failed stage commit carries only the journal and these bytes first appear in the hand re-proposal.

**Conditions:**
- Treat the first calibration run against target old as the verification of record for the ~215 members bound by pattern rather than against a page; report its failures as adapter defects, not test defects.
- The two contract routes that do not resolve, /sign-up/complete and the attachments tab on the opportunity edit page, go back to the contract stage as defects rather than staying as adapter workarounds.
- Record the hand re-proposal as a named exception to pipeline-only change, with the session id from the journal, so the provenance gap is visible to the next reviewer.

### Runner-owned typecheck evidence

Proposal revision: `236770665ec0dd1e5db7bdd670c5bc51177faf17`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    No diagnostics.
