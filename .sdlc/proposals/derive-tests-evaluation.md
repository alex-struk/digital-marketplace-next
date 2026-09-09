---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "Six of the thirty criteria in the evaluation domain got tests."
opened: 2026-09-09T01:29:56.695Z
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** Six of the thirty criteria in the evaluation domain got tests.

Six of the thirty criteria in the evaluation domain got tests. The other twenty-four are recorded in `tests/acceptance/not-testable.yaml` with reasons.

Criteria with a spec file: R-5.1, R-5.9, R-5.16, R-5.17, R-5.18, R-5.19.

One gap accounts for almost all of the rest. An opportunity leaves the published state only by closing at its proposal deadline. The contract's observables document names a status route as the request that runs the closing hook, but no page, action or observation in the surface makes that request, and a published opportunity is refused a deadline earlier than today. Earlier stages recorded the same finding against R-1.1. Without a closure, no opportunity reaches individual question evaluation or consensus, so no proponent is ever anonymised, no individual evaluation or consensus can be written, and nothing can be finalised. Twenty-two of my twenty-four entries reduce to that. The observations written for these outcomes all exist and all sit idle, including the two consensus refusals, the read-only marker on a submitted evaluation, and the message shown to an owner who is not on the panel.

What is reachable is everything the panel does before an opportunity closes. Panels can be named on a draft, on an opportunity under review and on a published one, which covers three of the five states R-5.16 lists. Panel members can be added and the resulting notices read from the mail catcher, which covers both halves of R-5.17. Panel membership is shown or withheld per reader, which covers R-5.18. A panel member sees a draft they are evaluating on their dashboard and can open it, which covers R-5.19.

Surface pieces I needed and did not find:

- **An action that closes an opportunity**, or a surface for the transition trigger the observables document already names. This one addition would unblock most of the domain.
- **An observation of a second-chair refusal** on the two panel surfaces. The fourth fault R-5.1 lists cannot be told apart from any other refusal without it.
- **An observation returning which people a saved panel names.** The existing row observation reports that a panel is shown, not its membership, so neither "the opportunity keeps the panel it had" nor an accepted panel change can be asserted by content.
- **An action adding a panel member with no role, plus an observation of the field-level message identifying that member.** Both are needed for R-5.37, and neither exists.
- **An observation reporting whether the finalise action stands ready for the person looking.** R-5.14 is about who is offered the action, and offering is not currently readable.
- **A second public sector sign-in that is not an administrator.** The persona for it is defined but its session route is marked unavailable. Its absence forced the arrangement of every test in R-5.18, cost R-5.19 its closing contrast, and is one of two reasons R-5.34 is not testable.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Each of the six spec files asserts only what its criterion states, using pages, actions and observations named in spec/contract/surface.yaml, with no route, selector, table, column or status code anywhere in the diff. The closure gap behind twenty-two of the twenty-four not-testable entries is verified against observables.yaml, the seed and the existing R-1.1 entry; the omissions documented inside R-5.1 correspond to observations that genuinely do not exist on the panel surfaces. The twenty-four refusals plus six tested criteria account for exactly the thirty live criteria in the domain at versions matching the spec. Runner-owned typecheck passed on this revision, and the diff stays inside tests/acceptance and the stage's own records. Noted without holding: the R-5.9 test can only show the browser form refuses a chairless panel, and R-5.17's absence assertions read visible recipients only, so a blind-copied notice would be missed; both belong to the contract owner, not the test writer.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `f7de3e3e26ec0f74d584edb4550f51873f1aee2c`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    No diagnostics.
