---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I acted on the reviewer's one condition, and the change is confined to `tests/acceptance/opportunities/R-1.33.spec.ts`."
opened: 2026-10-02T18:20:29.047Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I acted on the reviewer's one condition, and the change is confined to `tests/acceptance/opportunities/R-1.33.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I acted on the reviewer's one condition, and the change is confined to `tests/acceptance/opportunities/R-1.33.spec.ts`. I did not compile or run it: the type check needed an approval this session could not get.

**Condition 1: the non-author staff reader.** I added the case the reviewer asked for. It signs in as `persona.publicSectorStaffOther`, opens the history of `seed.opportunities.cwuWithPrivateNote`, and expects the seeded note's text, its file's name and its file's identifier to be absent. It uses the same `expectSeededNoteWithheld` check as the vendor and signed-out cases, and sits just before the vendor case. Its title is the criterion's statement followed by "a public sector staff member who is not the opportunity's author is not shown a private note or its file."

I wrote a test rather than a `not-testable.yaml` entry because the surface does reach this clause. The persona is defined in `tests/generated/personas.ts` and signs in on `sandbox-idp` as `gov-second`. Only the oracle's session route cannot sign it in, and as the reviewer said, that is settled at calibration rather than by leaving the clause unasserted. So the oracle should be expected to fail this case at sign-in and the run will need to record that limit at calibration.

I also updated the file's opening comment, which had said "only the author and administrators" was checked against a vendor and a signed-out reader only. It now names all three excluded readers. The header lines are unchanged; the "derived 2026-10-02" date is today's date and the file's content did change.

Unchanged: every other file in `tests/acceptance/opportunities/`, all of `tests/acceptance/not-testable.yaml` (including the existing R-1.33 entry for "but no screen of the application offers a way to add one", which still stands), and `tests/generated`. Nothing asked me to touch a path outside this stage's boundary.

The contract needs no new surface action or observation for this.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised R-1.33 opportunities tests follow from their criterion and from nothing else? Ruling: approve. The one owed condition is met: a case now signs in as persona.publicSectorStaffOther and expects the seeded note's text, file name and file identifier to be withheld from the history of seed.opportunities.cwuWithPrivateNote, using the same check as the vendor and signed-out cases, so 'visible only to the author and administrators' is asserted against all three readers it excludes. The other assertions follow from the criterion: a note of exactly 1,000 characters with a file is added by the author on a published Sprint With Us and a published Code With Us opportunity, and by an administrator on a cancelled Code With Us one, and it then appears in the history; the author and an administrator both see the seeded note. The NOTE_ADDED literal is the contract's own vocabulary for a note entry (spec/contract/surface.yaml history_entries), not an implementation leak. The remaining clause, 'but no screen of the application offers a way to add one', has a clause-scoped not-testable entry owned by contract that names the missing observation on opportunity-cwu-edit and opportunity-swu-edit, which is a real gap in the surface. The runner's typecheck passed on this revision. The missing test for R-1.33 stays open until a result row shows the test ran. What would change this: a test asserting something the criterion does not state, or a typecheck failure on this revision.

**Conditions:**
- condition-met derive-tests-opportunities-stale-19#1: tests/acceptance/opportunities/R-1.33.spec.ts adds the case 'a public sector staff member who is not the opportunity's author is not shown a private note or its file', which signs in as persona.publicSectorStaffOther and uses expectSeededNoteWithheld to assert that the seeded note's text, seed.stored_files.opportunityNoteAttachment's name and its identifier are absent from the history of seed.opportunities.cwuWithPrivateNote

### Runner-owned typecheck evidence

Proposal revision: `6e2f0b7d95e4a948e1b0f71e28210e0491018320`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
