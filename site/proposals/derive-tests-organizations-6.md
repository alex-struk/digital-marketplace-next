| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T22:08:37.375Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I couldn't type-check it: running `tsc` here needed an approval that nobody was there to give.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've rewritten the R-3.31 test so it checks what each message says, not just that a message arrived. I couldn't type-check it: running `tsc` here needed an approval that nobody was there to give. The new code only uses fields the mailbox reader and the surface already declare.

**Condition 1 (R-3.31).** I changed the one file, `tests/acceptance/organizations/R-3.31.spec.ts`. After the invited person accepts, the test waits up to 30 seconds and passes only if both of these hold:
- **Owner's message:** it identifies the invited person and contains "approv" or "join".
- **Invited person's message:** it contains the organization's seeded name ("Salt Marsh Labs Ltd.") and "join".

Neither check depends on an exact sentence, since the criterion doesn't give one.

To identify the invited person, the test needs a name to look for. The seed gives this person an email address but no name. So before accepting, the test reads the name shown on their own profile page (`surface.userProfileSelf.nameField()`). It accepts either that name or their email address in the owner's message.

The mailbox reader only exposes each message's subject and its opening snippet, not the full text, so the test searches those two. I decided that is enough to assert the content, as the reviewer said, so I added no `not-testable.yaml` entry. If a real run shows the name or organization only appears later in the message body, the missing piece is a way to read the full text. The contract lists that field, but the mailbox reader in `tests/fixtures` doesn't offer it, and that file isn't this stage's to change. The header's derived date is already today, so it didn't change.

**Condition 2 (R-3.9).** I left the file as it was, as asked.

No other file in `tests/acceptance/organizations/` and no entry in `tests/acceptance/not-testable.yaml` was touched. Nothing asked me to change a path outside this stage's boundary.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised organizations tests follow from their criteria and from nothing else? Ruling: return. R-3.31 now meets the earlier condition. After clearing the mailbox and having the invited person accept, it waits a bounded time and checks two things: the owner's message identifies the invited person (by email, or by the name their own profile shows) as having approved or joined, and the invited person's message names the seeded organization and says they joined. It assumes no exact wording, because the criterion gives none. The runner's typecheck reports no diagnostics under acceptance/organizations/; the only diagnostics are in adapters/new/, which this proposal does not answer for. R-3.9 was left as the earlier ruling asked, but read against its criterion, the test for 'an invitation that is not pending cannot be accepted' cannot fail. It accepts, attempts a second acceptance while swallowing any error, and then asserts only that the membership is still active. A second acceptance the service wrongly allowed would leave that same state, so the clause 'refused as not pending' is asserted by nothing, and no not-testable entry names it. The owner-attempt test does not have this flaw, because 'still pending afterwards' does separate a refusal from a success. The surface can reach the refusal: the self-memberships page declares acceptConfirmation(), and a refusal also shows as the accept action not being offered. What would change the ruling: that test asserting the second attempt was refused, or a not-testable.yaml entry carrying `clause` for the refusal and naming the missing observation.

**Conditions:**
- condition-met derive-tests-organizations-stale-5#1: tests/acceptance/organizations/R-3.31.spec.ts now waits up to 30s and asserts that the owner's message identifies the invited person (email or profile name) together with approv/join, and that the invited person's message contains the organization's legal name and 'join'; no exact sentence is assumed.
- condition-withdrawn derive-tests-organizations-stale-5#2: the file was kept as asked, but read against R-3.9 its final test does not assert the refusal of a further acceptance, so leaving the file unchanged is no longer asked for; the condition below replaces it.
- R-3.9: in tests/acceptance/organizations/R-3.9.spec.ts, the test 'an invitation that is not pending cannot be accepted' asserts only that the membership is still active after the second attempt, which is equally true if the service wrongly accepted it again. Assert the refusal itself through what the surface shows for that attempt: either the accept action is not offered for the now-active membership, or the attempt produces no acceptance confirmation. Do not assume an exact message. If the surface cannot show a refusal, add a tests/acceptance/organizations/not-testable.yaml entry for R-3.9 carrying `clause` for 'a further attempt to accept the now-active membership is refused as not pending' and naming the missing observation.

### Runner-owned typecheck evidence

Proposal revision: `59572be3311a002aa210275a47f172ef88ce2f8f`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
