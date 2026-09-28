---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T22:04:18.778Z"
cost: 0.3398182
turns: 12
session: "b260e017-c8c9-467d-b122-76a67f36e26b"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I made the one change the ruling asked for in the proposals domain. I did not run the typecheck: the command needed an approval this session could not get. Removing lines can't create a type error here, though. The helper that call used is still used elsewhere in the file, and nothing else referred to what I took out.

**Condition 1 (the one condition):** In `tests/acceptance/proposals/R-2.18.spec.ts`, in the Sprint With Us form test, I removed three things:
- the assertion that the team-member choice lists the person whose invitation is unanswered (Quinn Placeholder, `seed.users.teamCandidatePending.name`);
- the assertion that `surface.proposalSwuCreate.pendingTeamMember()` returns something;
- the one-line comment that explained those two assertions, which would have been wrong without them.

The test now says nothing about the pending person in either direction. Every other assertion is unchanged. The shared helper both form tests use checks the active members, the former member and the outside person, but it never mentions the pending person. So nothing in the Sprint With Us test now asserts anything about the pending person, which is what the condition asks for. The Team With Us test still asserts that the pending person is not offered, both before and after someone is named, as the ruling accepted.

The file's header was already dated 2026-09-28 (today), and its content did change, so I left the header as it was. No other file in `tests/acceptance/proposals/` was touched.

**The not-testable file:** Normally, when a test leaves part of a criterion unasserted, I add an entry to `tests/acceptance/not-testable.yaml` naming that part. Here, the Sprint With Us clause "offers only active members, so a pending invitee is not offered" is now unasserted. I drafted an entry for it with ratify as the owner, but the command that would have added it was refused before it ran, so the file never changed. On reflection I left it that way. The ruling says the clause "is recorded as owed by ratify", and the matching condition has already been filed where ratify reads it. A second record of the same clause would ask ratify for it twice, which the instructions warn against, and it was not something the conditions named. So `not-testable.yaml` is exactly as I found it, with no R-2.18 entry. If a later check expects a clause entry for R-2.18 beside the test, this is the gap. Its content would be: the Sprint With Us "only active members" clause, `blocked:` because the criterion and the contract's `team_member_choices` comment disagree, owed by ratify.

**Not done here:** the ratify condition on R-2.18's wording is not this stage's, and I left it alone. I also did not touch the typecheck diagnostics the reviewer found in `adapters/new`, which this proposal does not answer for. No surface action or observation was missing for this change.