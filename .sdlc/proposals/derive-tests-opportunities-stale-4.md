---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote the tests for all three criteria (R-1.34, R-1.36 and R-1.37)."
opened: 2026-09-28T03:38:49.034Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the tests for all three criteria (R-1.34, R-1.36 and R-1.37).

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote the tests for all three criteria (R-1.34, R-1.36 and R-1.37). Each now has one file with two tests, one per outcome the criterion names. None of the three went into `not-testable.yaml`, and there are no partial-clause entries. I could not type-check or run anything: the workspace has no `node_modules`, and no target or mail catcher is available here.

**What the ruling asked for.** None of the tests counts messages any more. Before the action, each test empties the mail catcher and reads the caught-message list back to confirm it holds zero messages. It then finds the author's message by what it is about: a message whose visible recipient is the author and whose subject or body contains the opportunity's title. The visible-recipient check is also what shows "separately". The notices to the group go out addressed to the service's own sending address, with everyone else as a blind copy, so a message visibly addressed to the author is a separate one.

**What changed beyond the ruling.** The earlier versions left out the group half of each criterion. Their reason was that blind-copied recipients could not be seen, and they recorded no partial-clause entry, so a pass would have read as the whole criterion met. That reason no longer holds. The contract now provides a page for reading one caught message (`caughtMessage.copiedRecipients()` and `visibleRecipients()`) and states that the blind-copy list is observable. So each file now also tests the group notice. A person counts as notified when any message caught since the action names them as a visible or blind-copied recipient. This covers:
- **R-1.34:** all 120 seeded subscribers. Their addresses are built from `seed.subscribers.group`, and the first and last are checked against `seed.subscribers.first` and `seed.subscribers.last`.
- **R-1.36:** the watcher and the vendor who submitted a proposal.
- **R-1.37:** every seeded administrator account that is active and has an address.

**How each test sets things up.**
- **R-1.34:** the public sector employee saves a draft, the catcher is emptied, then an administrator publishes it.
- **R-1.36:** uses the seeded published Code With Us opportunity, whose author is the seeded staff member. One vendor submits a proposal and a second vendor watches it. Both are checked afterwards: the proposal on the vendor's own dashboard, the watcher count on the opportunity's reporting. Watching is a toggle, so if the count drops the test toggles again. An administrator then cancels the opportunity with the catcher emptied just before.
- **R-1.37:** the author submits a complete opportunity for review from the create page. The catcher is emptied before that page is opened, so the check that it is empty doesn't navigate away from the form.

**Assumptions a reviewer should know.**
- The author's message is assumed to name the opportunity's title somewhere in its subject or body. The ruling asks for exactly that, but the criterion doesn't state it.
- "Every administrator" is read as active administrator accounts with an address.
- R-1.34 checks the 120 subscriber-group accounts but not the 19 other seeded accounts the seed says are also due the announcement. The seed names those only as a total, not by handle.

**Surface needs.** Nothing required by these three criteria was missing. Two gaps would make the tests simpler and less dependent on inference:
- The opportunity view has no reading of whether the signed-in person is watching it, so the watch toggle has to be inferred from the administrator's watcher count.
- The caught-message list has no way to list every caught message with its identifier in a known format. The tests collect candidate messages through the mail fixture's recipient search instead.

I changed no files outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether the rewritten tests for R-1.34, R-1.36 and R-1.37 follow from their criteria and nothing else. The earlier ruling is met: no test detects a message by count any more. Each test empties the catcher, confirms it is empty, then finds the author's message as one visibly addressed to the author that names the opportunity's title. The arrangements match the seed (reset before every test; vendor is vendorOne, competing-vendor is proponentTwo, the seeded published opportunity was created by staffOne). No typecheck diagnostic falls under acceptance/opportunities. The return is because each group test stops at membership. A watcher, subscriber or administrator counts as notified when named, visibly or as a blind copy, on any message caught after the action. Nothing checks that the message is the notice the criterion names: 'a new opportunity has been posted' (R-1.34), 'told it has been cancelled' (R-1.36), 'an opportunity awaits review' (R-1.37). That clause of each criterion is asserted by nothing and carries no partial-clause entry, so a first passing run would close each criterion whole. The surface reaches it: the writer already reads subject and bodies for the author's message and can apply the same identification to the group notice. Separately, R-1.34 asserts 120 of the 139 accounts the seed says are due the announcement. The other nineteen are named in the seed only as a total, and only one account carries an explicit notices-off marker, so the writer cannot pick them out. That is owed by contract and needs a partial-clause entry beside the test. The ruling would change to approve once each group test requires the message naming the person to be about this opportunity, and R-1.34 carries the partial-clause entry for the nineteen accounts.

**Conditions:**
- R-1.34: in the test for everyone who asked for notices, count a subscriber as notified only when a message caught since the publication both names them (visible or blind-copied) and names this opportunity's title in its subject or body. Identify it the same way the author's confirmation is identified. The criterion says each receives 'a notice that a new opportunity has been posted', and at present any message naming them passes.
- R-1.36: in the test for watchers and proponents, count the watcher and the proponent as told only when a message caught since the cancellation both names them (visible or blind-copied) and names this opportunity's title in its subject or body. The criterion says they are 'told it has been cancelled', and at present any message naming them passes.
- R-1.37: in the test for every administrator, count an administrator as notified only when a message caught since the submission both names them (visible or blind-copied) and names this opportunity's title in its subject or body. The criterion says they are 'notified that an opportunity awaits review', and at present any message naming them passes.
- R-1.34: add a tests/acceptance/opportunities/not-testable.yaml entry with `clause` for the accounts outside the subscriber group that are also due the announcement (nineteen, per the seed). The seed gives them only as a total, so the test asserts 120 of 139 and without the entry reads as a test of the whole criterion.
- missing-test R-1.34: each of the seeded accounts outside the subscriber group that have asked for new-opportunity notices receives the announcement — owed by contract: the seed states nineteen such accounts only as a total; it must name them (or mark each account's new-opportunity notice setting) so a test can address them

### Runner-owned typecheck evidence

Proposal revision: `0cae9f869a726dbe915d8186b7bdb910456e49d4`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
