| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T19:58:15.001Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote the three tests the ruling sent back and re-derived R-2.18 at v3, so all four criteria now have a test file.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote the three tests the ruling sent back and re-derived R-2.18 at v3, so all four criteria now have a test file. Two of them (R-2.14 and R-2.18) also have entries in `not-testable.yaml` for the clauses nothing in the surface reaches. The workspace has no installed packages and I wasn't allowed to run a checker, so none of this has been typechecked or run. I checked the imports and handles against `tests/generated/*` by hand, and the new YAML entries were not parsed either.

**R-2.14 (v2).** The old test made ten proposal attempts in one test and ran out of time. It is now twelve tests of one attempt each: one per missing field (legal name, email, street, city, province, postal code, country), one each for a malformed email and a malformed phone number, one for a complete individual being accepted, one for an archived organization being refused and one for an active organization being accepted. They all use the seeded Code With Us opportunity that stays open until 2030, so no test has to build an opportunity first. A proposal counts as refused when the opportunity's title is missing from the proponent's own proposal list. If every step of the attempt went through, the test also waits for a field error to be shown. The not-testable entry names three clauses:
- "each offending field is named in the response": the one error observation doesn't say which field an error belongs to.
- an organization being checked for existence.
- the service not checking that the vendor belongs to the organization. The form only offers the vendor's own organizations, so neither organization case can be put to the service through it.

**R-2.18 (v3).** The criterion now says neither refusal can be reached through the form, so the old test (written at v2, relying on the form) had to go. One refusal can still be reached another way:
- A Team With Us draft is saved naming a person while they are still a member.
- That person is then removed from the organization, and the draft is submitted from its own management screen.
- The test asserts the draft keeps its status.

A second draft, naming someone who stays a member, is submitted the same way and must go through. That second check isn't stated by the criterion, but without it a management screen that submits nothing would pass the refusal half as well. Whoever rules on this may see it as asserting more than the criterion states. The not-testable entry names:
- the wording "User is not an active member of the organization."
- pending and inactive memberships.
- the Team With Us "Please select unique team members." refusal.
- Sprint With Us applying no such uniqueness check.
- what the form offers as team members.

**R-2.30 (v1).** The ruling said the price score was read from a page that doesn't show it. The test now reads it from every place the administrator sees a proposal's scores: the proposal's own score and team scenario tab, its export, and the opportunity's proposals and team scenario tabs. Some of those places list the other proposals too, so it compares before and after: a standalone 50 must appear in more places after the higher bid's scenario score is entered than before. It also checks that the proposal's history mentions the price once more than before, and has one more "evaluated" entry than before.

**R-2.35 (v1).** This now uses the seeded Sprint With Us proposal that has passed consensus and is waiting for its code challenge score, which avoids walking a whole evaluation. The administrator enters a score of 63 and then disqualifies the proposal with a written reason. The two entries are found in the history by what the test put there, the score's value and the reason's text, not by a label. The test checks:
- the reason and the score are both there.
- the administrator's name (read off their own profile) and the current year each appear at least twice more than before.
- the reason comes before the score, which shows newest first.

The year stands in for "when" because the history comes back as one piece of text. That is a coarse reading.

**What the contract would need so the recorded clauses can be tested** (owner `contract` for each):
- On `proposal-cwu-create`, an observation giving each refusal together with the field it is against.
- A request-level proposal page for each program, like the existing evaluation-*-request pages, that submits a proposal with the organization or team given directly and reports whether it was accepted and the refusal's message.
- On `proposal-swu-edit` and `proposal-twu-edit`, an observation of why a submission from that screen was refused.
- On `proposal-swu-create` and `proposal-twu-create`, an observation listing the people the team-member choice offers.

Nothing asked me to change anything outside `tests/acceptance`, and I didn't.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether the four rewritten tests (R-2.14 v2, R-2.18 v3, R-2.30 v1, R-2.35 v1) follow from their criteria and from nothing else. I approve. The runner typecheck reports no diagnostics under acceptance/proposals; the two it found are in adapters/new, which this proposal does not answer for. The three redo items are answered. R-2.14 now makes one attempt per test, so a timeout can no longer stand in for a result. Each missing field and each malformed field is asserted as refused, and an archived organization is compared with an active one owned by the same persona; the seed manifest confirms organizationOwner owns both, so status is the only difference. The clause saying each offending field is named in the response, the existence check and the vendor-membership check are each recorded in not-testable.yaml with a clause, the reason and owner contract. Each reason names a surface that is actually missing: an observation that ties an error to its field, and a request-level proposal page. R-2.30 no longer reads the price score from a single page. It compares how often a standalone 50 appears, before and after, across every place the administrator is shown scores, and checks that the history gains a price entry and an evaluated entry. That is exactly the criterion's three-part then. R-2.35 finds its two new history entries by what the test itself wrote, the score 63 and the disqualification note, not by label. It asserts author, time, note and newest-first as differences from the history before. Reading 'when' as the current year is coarse, but the test says so and it follows from the criterion. R-2.18 v3 reaches the absent-membership given by removing a named member after the draft is saved. Its control draft, which names someone who stays a member, is the one assertion beyond the criterion's literal text. It is there so that a screen which never submits anything cannot pass the refusal half, and 'must be an active member' implies an active member is not refused on that ground, so I accept it rather than calling it an overreach. The wording, pending and inactive memberships, the Team With Us uniqueness refusal, the Sprint With Us absence of that check, and what the form offers are all recorded in not-testable.yaml with specific missing surfaces owned by contract. The checks already show both as open missing-test conditions owed by contract. My ruling would change to a return if a run showed a stray 50, or the year, appearing for reasons unrelated to the entries being tested, because that would make the before/after counts in R-2.30 or R-2.35 unreliable. It would also change if the contract gains the field-tagged error observation or a request-level proposal page and the tests are not extended to use them.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `1d493ba9ed7c4990296077c240b61c6bf7b248fd`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
