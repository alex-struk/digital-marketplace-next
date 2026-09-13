---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "Forty of the fifty criteria now carry a test; ten are recorded as not testable."
opened: 2026-09-11T10:09:41.197Z
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** Forty of the fifty criteria now carry a test; ten are recorded as not testable.

Forty of the fifty criteria now carry a test; ten are recorded as not testable. I rewrote the whole domain rather than adding to it, because the thirty-six files already present were derived against an earlier contract and call page `open` with an `id` or a `title`, which the current generated types reject.

| outcome | count |
|---|---|
| criteria with a spec file | 40 |
| criteria in not-testable.yaml | 10 |

The contract has grown since the previous derivation, and four criteria the earlier run gave up on are now reachable. It carries a scheduled transition trigger that performs a closure on demand, a seed holding one Sprint With Us and one Team With Us opportunity published with a deadline already thirty days gone, a published-date observation on all three opportunity views, and observations naming who created and who last changed an opportunity. Those four gave tests for the automatic closure, the recorded publication date, the anonymous proponent names written at closure, and the withholding of the creator's and changer's names.

That matters beyond this domain. Roughly forty not-testable entries in other domains justify themselves with the phrase "see R-1.1", meaning no closure can be brought about. That premise is false now. Those entries are not mine to edit, and I left them alone, but every one of them deserves re-deriving.

What remains out of reach is all seed-shaped rather than surface-shaped. Each program has exactly one closable opportunity, the seed is applied once before the run, and nothing resets it. Reaching a stage past the first evaluation one means walking that single record through every stage in between, after which no other test could find it where it needed it. The ten blocked criteria are the ones whose given is a consensus stage, a code challenge stage, a final evaluation stage, processing, awarded, or a completed report. The remedy is seeded opportunities already sitting at each of those stages. I named the specific starting state each one needs in its reason.

Surface additions I looked for and did not find:

- **An action that watches an opportunity without toggling**, plus an observation of the duplicate-watch refusal. Only a toggle exists, so asking twice unwatches rather than asking again, and the third clause of the watching criterion goes unasserted.
- **An observation of an opportunity's completion date.** The draft-date rule says the completion date is left empty, and no view returns it.
- **An observation naming a second chair on an evaluation panel.** Four panel errors exist; none distinguishes a refusal for two chairs from any other refusal.
- **An observation of the successful proponent's contact details**, which one criterion says are withheld from readers who may not see the score.
- **An observation of the state changes an opportunity's program permits**, needed for the claim that the recorded transitions and the award path agree.
- **An observation of what a note in an opportunity's history carries.** A note with an attached file cannot be told from one without.
- **An observation of an earlier version of an opportunity.** Retention of previous content is asserted only indirectly, as the history text having grown.

The blind-copy list and message body remain unreadable through the mail fixture, so the group notifications on publication, change, cancellation and addendum are asserted for the author alone.

I could not run the type check. The suite has no installed dependencies in this workspace. I verified every page, action and observation name against the generated surface by hand, confirmed every `open` call passes the parameter shape the types declare, and confirmed no file trips the separation check.
