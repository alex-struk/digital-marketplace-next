---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-11T09:22:03.933Z"
cost: 13.796892999999999
turns: 107
session: "4df1cc47-0e09-4ff9-998e-b1c45c8b7a4a"
---

Re-derived the whole proposals domain. All checks for forbidden constructs pass; headers and versions match the criteria list.

**What changed since the last derivation.** The contract now carries a service-status page with a "run pending transitions" action, and the seed carries a Sprint With Us and a Team With Us opportunity published with deadlines thirty days old, three submitted proposals each. Together these close an opportunity on demand, which the previous derivation recorded as the one thing nothing could reach. The generated page types also tightened: every `open` now takes named route parameters, so each test takes an identifier from the screen a record lands on instead of naming a record by title.

Coverage:

| outcome | criteria |
|---|---|
| test written | 28 |
| not testable | 8 |

**Newly reachable.** Three criteria got their first test: proposals moving to review with anonymous proponent names when an opportunity closes, an evaluation action taken at the wrong stage being refused, and disqualification requiring a written reason within bounds. Three more gained the half that was previously out of reach: staff seeing proposals only after a closure, the anonymous name on a staff copy of a proposal, and staff taking away every proposal in one document.

**Still not testable, and why.** Two need a Code With Us opportunity seeded past its proposal deadline, since only the other two programs have one and no form accepts a past date. Six sit behind the full evaluation chain, and the seed holds exactly one closed opportunity per program. Walking that chain consumes it: the first test to score, agree and finalise a panel's scores takes the fixture away from every other criterion behind the closure, including the evaluation domain's. I chose not to write tests that quietly depend on file ordering, so those six say so in the not-testable list with what would unblock each.

**What I needed and did not find.** For the contract stage, in rough order of how much they would buy:

- **More closed opportunities.** One per criterion that has to move one, or opportunities seeded at the later evaluation stages. This alone unblocks six criteria.
- **A closed Code With Us opportunity** carrying a submitted proposal. Unblocks two.
- **A draft proposal seeded against a closed opportunity.** Three criteria assert that drafts are left alone or withheld, and none can build one.
- **An organization action on the two proposal management screens.** The criterion about an organization being locked after submission has to ask for the change through the save action, because no action names an organization there.
- **An attachment action naming a file already stored.** Attachments checked in draft cannot be tested while the only action uploads a file that exists by construction.
- **Six proponents on one opportunity**, which one criterion states outright and the seed declines.
- **Scores as seed handles.** The seeded questions carry a maximum and a minimum that appear only in the seed SQL, not in the generated seed. Any test entering a valid score has to hard-code them.
- **Display names for seeded people**, so a history entry can be matched to who made it.

I could not run the type check. The test workspace has no installed dependencies, so the files are verified by reading against the generated types rather than by compiling.