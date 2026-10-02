---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-02T10:55:52.583Z"
cost: 0.8926138000000001
turns: 24
session: "07e8bfd5-5308-4b73-923b-4e904fae7984"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rewrote the one criterion this run covered, R-6.17 (v1), as a single test file: `tests/acceptance/notifications/R-6.17.spec.ts`. It holds three tests. No criterion went into `not-testable.yaml`, and no entry for R-6.17 was there before. I could not type-check the file or run it: running the TypeScript compiler needs an approval that nobody was here to give, and this workspace has no target to run against.

**What the ruling asked for.** The earlier test used an organization team invitation as its example notification and never asserted the watched-opportunity notice. The new file drops organizations and invitations completely. It starts from the seeded published Code With Us opportunity (`seed.opportunities.publishedCodeWithUs`), which the reset leaves with no watchers.
- **Setup:** two vendors ask to watch it while they can still sign in: `users.vendorOne` (as `persona.vendor`) and `users.proponentTwo` (as `persona.competingVendor`). An administrator then deactivates `users.vendorOne`.
- **Test 1, a change:** the mail catcher is emptied and the opportunity's details are edited.
- **Test 2, an addendum:** the same, but an addendum is added instead.
- **What tests 1 and 2 check:** every caught message is opened through `caughtMessage`, and its visible and blind-copied recipients are both read. The active watcher must be among them, which also shows the catcher works and a notice really went out. The deactivated account must not appear in either field.

The check covers every message caught after the change, not only the watch notice. That is how the file handles "no notification of any kind" without adding a kind of message the criterion never names.

**Test 3, the watch is kept.** This one doesn't use an admin reporting figure. The account is deactivated and a first change goes out without reaching it. Then the account is reactivated, and an addendum must reach it again even though nobody asked to watch in between. A deactivated account cannot sign in to ask, so a notice arriving shows the original watch survived.

**Decisions a reviewer may want to question:**
- **"Of any kind" is sampled, not proven.** The tests show that nothing at all reaches the deactivated account after a change or an addendum. They don't try every message the service can send. The ruling said reaching for other kinds of message was overreach, so I wrote no partial `not-testable` entry for that clause.
- **A `watching()` check was available but not used.** The watch-request page has a `watching()` observation, but the contract doesn't say which opportunity it reports on, and no existing test uses it. I relied on the notice actually arriving instead.

**Surface gaps:** I found no missing actions or observations; everything needed was in the contract. One thing would help whoever writes the contract next: say which opportunity `opportunity-watch-request.watching` refers to. A precise version would let a test check a kept watch directly as well as by its effect.

I changed nothing outside `tests/acceptance`, and nothing asked me to.