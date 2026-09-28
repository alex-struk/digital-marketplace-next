---
gate: G3
question: "Do these tests follow from the organizations criteria and from nothing else?"
recommendation: "I rewrote both tests the ruling sent back: R-3.9 and R-3.31 in the organizations domain."
opened: 2026-09-28T22:06:40.900Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote both tests the ruling sent back: R-3.9 and R-3.31 in the organizations domain.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote both tests the ruling sent back: R-3.9 and R-3.31 in the organizations domain. Each now has a test file and neither needed a `not-testable.yaml` entry. Nothing was run. The workspace has no installed dependencies and no application, so the files were not type-checked or executed, and their first run will be against a target.

**R-3.9** (`tests/acceptance/organizations/R-3.9.spec.ts`) has four tests. Each one starts from the seed's organization "withPendingInvitation", which has a single pending invitation for the seed's invited vendor.
- **The owner's attempt is refused.** The owner tries to approve the pending member. If the page offers no way to do that, the attempt counts as refused. The test then reopens the team list and checks that the membership is still marked pending. It no longer checks for a shown message, which is what the ruling objected to.
- **The invited person accepts.** They accept from their own organizations page. The test checks that the organization is listed among their affiliated organizations and is no longer marked pending.
- **An administrator accepts on their behalf.** The administrator opens the invited person's organizations page, using the seed's id for that person, and accepts there. The test then checks the same active state from the invited person's own view. The previous version skipped this clause even though the criterion's statement includes it.
- **An invitation that is no longer pending.** As the ruling asked, the invited person first accepts and the test confirms the membership is active. The invited person then tries to accept again, and the test checks the membership is unchanged: still listed and still not pending.

In the refusal tests, the attempt is allowed to fail by not being offered at all. A pending badge that is missing from the page is read as absent.

**R-3.31** (`tests/acceptance/organizations/R-3.31.spec.ts`) has one test. It clears the mailbox, has the invited person accept, and then waits up to 30 seconds for a message to both the owner and the invited person. It fails only if either message has still not arrived by then, instead of reading the mailbox once straight after the acceptance as the ruling described. It checks only that the messages arrive, not their wording, since the criterion gives no exact text and a text match would test something it never states. It also no longer sends a fresh invitation first; the seeded pending one is the criterion's starting state.

Both files carry the new spec revision in their headers. I changed nothing outside `tests/acceptance/organizations/`, and nothing asked me to touch a read-only path.

**Missing from the contract:** nothing blocked a test. One gap is worth adding, though. There is no observation that says whether a given person's membership in a given organization is pending or active. The tests infer that from the page-level `pendingBadge`, which only works because the seeded organization has exactly one pending invitation.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-3.9 follows its criterion clause by clause. The owner's attempt is judged refused from the membership state afterwards, the invited person's acceptance and an administrator's acceptance on their behalf each make the membership active, and a further attempt after activation leaves it unchanged, as the prior ruling asked. No typecheck diagnostic falls under acceptance/organizations. R-3.31 asserts only that some message reaches the owner and the invited person. Its criterion says what each message tells its reader: the owner that the person approved the request, and the person that they have joined the organization's team. That content clause is neither asserted nor named by a not-testable entry, and the mailbox observation exposes enough of each message to assert it without inventing exact wording, so the gap is the writer's to close.

**Conditions:**
- R-3.31: the test asserts only that a message arrives for the owner and for the invited person, not what each message says. Assert, within the bounded wait, that the owner's message identifies the invited person as having approved the request or joined, and that the invited person's message identifies the organization whose team they have joined (by its name, not by an exact sentence the criterion does not give). If the mailbox observation cannot show either, add a tests/acceptance/organizations/not-testable.yaml entry for R-3.31 carrying `clause` for the message content and naming the observation that is missing.
- R-3.9: no change is asked for; keep the file as it stands on this branch.

### Runner-owned typecheck evidence

Proposal revision: `1b152ebc92bec0bb87d8166fe2b58804930c834d`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
