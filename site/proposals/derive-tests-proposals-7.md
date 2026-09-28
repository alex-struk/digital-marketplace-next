| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T22:04:18.880Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised proposals tests now follow from their criteria and from nothing else?

**Recommendation.** I made the one change the ruling asked for in the proposals domain.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for in the proposals domain. I did not run the typecheck: the command needed an approval this session could not get. Removing lines can't create a type error here, though. The helper that call used is still used elsewhere in the file, and nothing else referred to what I took out.

**Condition 1 (the one condition):** In `tests/acceptance/proposals/R-2.18.spec.ts`, in the Sprint With Us form test, I removed three things:
- the assertion that the team-member choice lists the person whose invitation is unanswered (Quinn Placeholder, `seed.users.teamCandidatePending.name`);
- the assertion that `surface.proposalSwuCreate.pendingTeamMember()` returns something;
- the one-line comment that explained those two assertions, which would have been wrong without them.

The test now says nothing about the pending person in either direction. Every other assertion is unchanged. The shared helper both form tests use checks the active members, the former member and the outside person, but it never mentions the pending person. So nothing in the Sprint With Us test now asserts anything about the pending person, which is what the condition asks for. The Team With Us test still asserts that the pending person is not offered, both before and after someone is named, as the ruling accepted.

The file's header was already dated 2026-09-28 (today), and its content did change, so I left the header as it was. No other file in `tests/acceptance/proposals/` was touched.

**The not-testable file:** Normally, when a test leaves part of a criterion unasserted, I add an entry to `tests/acceptance/not-testable.yaml` naming that part. Here, the Sprint With Us clause "offers only active members, so a pending invitee is not offered" is now unasserted. I drafted an entry for it with ratify as the owner, but the command that would have added it was refused before it ran, so the file never changed. On reflection I left it that way. The ruling says the clause "is recorded as owed by ratify", and the matching condition has already been filed where ratify reads it. A second record of the same clause would ask ratify for it twice, which the instructions warn against, and it was not something the conditions named. So `not-testable.yaml` is exactly as I found it, with no R-2.18 entry. If a later check expects a clause entry for R-2.18 beside the test, this is the gap. Its content would be: the Sprint With Us "only active members" clause, `blocked:` because the criterion and the contract's `team_member_choices` comment disagree, owed by ratify.

**Not done here:** the ratify condition on R-2.18's wording is not this stage's, and I left it alone. I also did not touch the typecheck diagnostics the reviewer found in `adapters/new`, which this proposal does not answer for. No surface action or observation was missing for this change.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the revised R-2.18 test now follows from its criterion alone, which turns on the open instruction derive-tests-proposals-stale-9#1. The Sprint With Us form test no longer asserts anything about the pending invitee in either direction: it reads the choice, checks the three active members are offered, the former member and the outsider are not, and the person just named stops being offered. Every other assertion is unchanged. Each remaining assertion follows from R-2.18's text ('The proposal form offers only the organization's active members, and does not offer a person already named on the proposal'; Team With Us refuses duplicates while Sprint With Us applies no uniqueness check), including the Team With Us check that the pending person is not offered. No implementation detail leaks in. The runner's typecheck reports no diagnostics under acceptance/proposals/; the two in adapters/new are outside this proposal. The Sprint With Us pending-invitee clause the test no longer asserts is already owed by ratify as missing-test/R-2.18, because the contract and the criterion disagree, so no further entry is needed. The ruling would change only if ratify rewrote R-2.18 so the Sprint With Us choice lists pending invitees marked pending, which would be a new derive-tests round.

**Conditions:**
- condition-met derive-tests-proposals-stale-9#1: the Sprint With Us form test in tests/acceptance/proposals/R-2.18.spec.ts no longer asserts that the choice contains seed.users.teamCandidatePending.name nor that surface.proposalSwuCreate.pendingTeamMember() is non-empty, asserts nothing about the pending person in either direction, and every other assertion in the file is unchanged

### Runner-owned typecheck evidence

Proposal revision: `13edab7c4a66533b5d9daa96f772626b9d245fbe`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
