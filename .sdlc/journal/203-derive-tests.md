---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T22:08:37.314Z"
cost: 0.42775260000000004
turns: 13
session: "ffb80ff3-9a71-4ae9-b0a1-349617c173d8"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've rewritten the R-3.31 test so it checks what each message says, not just that a message arrived. I couldn't type-check it: running `tsc` here needed an approval that nobody was there to give. The new code only uses fields the mailbox reader and the surface already declare.

**Condition 1 (R-3.31).** I changed the one file, `tests/acceptance/organizations/R-3.31.spec.ts`. After the invited person accepts, the test waits up to 30 seconds and passes only if both of these hold:
- **Owner's message:** it identifies the invited person and contains "approv" or "join".
- **Invited person's message:** it contains the organization's seeded name ("Salt Marsh Labs Ltd.") and "join".

Neither check depends on an exact sentence, since the criterion doesn't give one.

To identify the invited person, the test needs a name to look for. The seed gives this person an email address but no name. So before accepting, the test reads the name shown on their own profile page (`surface.userProfileSelf.nameField()`). It accepts either that name or their email address in the owner's message.

The mailbox reader only exposes each message's subject and its opening snippet, not the full text, so the test searches those two. I decided that is enough to assert the content, as the reviewer said, so I added no `not-testable.yaml` entry. If a real run shows the name or organization only appears later in the message body, the missing piece is a way to read the full text. The contract lists that field, but the mailbox reader in `tests/fixtures` doesn't offer it, and that file isn't this stage's to change. The header's derived date is already today, so it didn't change.

**Condition 2 (R-3.9).** I left the file as it was, as asked.

No other file in `tests/acceptance/organizations/` and no entry in `tests/acceptance/not-testable.yaml` was touched. Nothing asked me to change a path outside this stage's boundary.