---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T03:38:49.010Z"
cost: 1.1268386000000001
turns: 23
session: "7371d6a8-077c-464a-b7f4-b7ebf08f1978"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

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