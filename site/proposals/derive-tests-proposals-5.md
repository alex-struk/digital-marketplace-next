| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-11T09:22:03.961Z |
| holder | agent:reviewer |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** Re-derived the whole proposals domain.

Re-derived the whole proposals domain. All checks for forbidden constructs pass; headers and versions match the criteria list.

**What changed since the last derivation.** The contract now carries a service-status page with a "run pending transitions" action, and the seed carries a Sprint With Us and a Team With Us opportunity published with deadlines thirty days old, three submitted proposals each. Together these close an opportunity on demand, which the previous derivation recorded as the one thing nothing could reach. The generated page types also tightened: every `open` now takes named route parameters, so each test takes an identifier from the screen a record lands on instead of naming a record by title.

Coverage:

| outcome | criteria |
|---|---|
| test written | 28 |
| not testable | 8 |

**Newly reachable.** Three criteria got their first test: proposals moving to review with anonymous proponent names when an opportunity closes, an evaluation action taken at the wrong stage being refused, and disqualification requiring a written reason within bounds. Three more gained the half that was previously out of reach: staff seeing proposals only after a closure, the anonymous name on a staff copy of a proposal, and staff taking away every proposal in one document.

**Still not testable, and why.** Two need a Code With Us opportunity seeded past its proposal deadline, since only the other two programs have one and no form accepts a past date. Six sit behind the full evaluation chain, and the seed holds exactly one closed opportunity per program. Walking that chain consumes it: the first test to score, agree and finalise a panel's scores takes the fixture away from every other criterion behind the closure, including the evaluation domain's. I chose not to write tests that quietly depend on file ordering, so those six say so in the not-testable list with what would unblock each.

**What I needed and did not find.** For the contract stage, in rough order of how much they would buy:

- **More closed opportunities.** One per criterion that has to move one, or opportunities seeded at the later evaluation stages. This alone unblocks six criteria.
- **A closed Code With Us opportunity** carrying a submitted proposal. Unblocks two.
- **A draft proposal seeded against a closed opportunity.** Three criteria assert that drafts are left alone or withheld, and none can build one.
- **An organization action on the two proposal management screens.** The criterion about an organization being locked after submission has to ask for the change through the save action, because no action names an organization there.
- **An attachment action naming a file already stored.** Attachments checked in draft cannot be tested while the only action uploads a file that exists by construction.
- **Six proponents on one opportunity**, which one criterion states outright and the seed declines.
- **Scores as seed handles.** The seeded questions carry a maximum and a minimum that appear only in the seed SQL, not in the generated seed. Any test entering a valid score has to hard-code them.
- **Display names for seeded people**, so a history entry can be matched to who made it.

I could not run the type check. The test workspace has no installed dependencies, so the files are verified by reading against the generated types rather than by compiling.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Do these tests follow from the proposals criteria and from nothing else? Approve. Checked against spec/domains/proposals.md: R-2.5 asserts the move to review and the three anonymous names as a set, which fits the criterion's note that the numbering order carries no meaning; R-2.28 asserts only the wrong-stage refusal; R-2.34 asserts the 1 to 5,000 character reason bounds and the reason kept in history; R-2.25, R-2.37 and R-2.38 add only the after-closure half each criterion states. No route, selector, table or status code appears, and records are reached through seed handles and the identifiers the pages return. The seed manifest confirms staffOne (publicSectorStaff) authored both closed opportunities and that organizationOwner and proponentTwo (competingVendor) created the proposals the tests sign in to read. Every not-testable reason names a real gap: the seed has no closed Code With Us opportunity; it has one closed opportunity per program and the suite runs with workers: 1 and no reset between tests, so walking the evaluation chain uses the fixture up for every later test; and the seed states it declines six proponents. The runner typecheck failed, but every error listed is in the evaluation, files, notifications and opportunities domains, whose files this diff does not touch and which still pass title, id or user to open. The list is truncated before proposals, so the proposals files were checked by hand: no old-style open parameters remain, and every page member, seed handle and persona the new tests use exists in tests/generated with a matching signature. The ruling would change if a full typecheck showed errors under acceptance/proposals, or if the test runner turned out to reset the seed between tests, which would make the six fixture-consumption reasons false.

**Conditions:**
- The runner's full, untruncated typecheck output shows zero errors under tests/acceptance/proposals before merge; errors in other domains belong to those domains' own re-derivations.
- R-2.34 permanently disqualifies seed.proposals.teamWithUsThree on the closed Team With Us opportunity; the evaluation domain's next derivation must treat that opportunity as carrying two proposals still in contention, or the seed must add a closed opportunity of its own for R-2.34.

### Runner-owned typecheck evidence

Proposal revision: `d265ddbf4dac9983653542a0dda4c6ba87e2833e`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    acceptance/evaluation/R-5.1.spec.ts(25,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(82,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(95,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(101,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(114,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(120,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.17.spec.ts(75,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.17.spec.ts(99,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(53,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(89,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(101,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(113,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(121,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(135,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(147,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.19.spec.ts(20,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.19.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.9.spec.ts(26,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/files/R-8.1.spec.ts(17,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.12.spec.ts(17,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.12.spec.ts(27,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.14.spec.ts(18,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.20.spec.ts(23,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.20.spec.ts(31,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.21.spec.ts(19,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.25.spec.ts(36,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.25.spec.ts(41,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.28.spec.ts(11,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.28.spec.ts(18,38): error TS2554: Expected 0 arguments, but got 1.
    acceptance/files/R-8.28.spec.ts(24,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/files/R-8.30.spec.ts(14,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.10.spec.ts(19,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(37,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(43,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.21.spec.ts(23,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.21.spec.ts(30,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.22.spec.ts(16,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.23.spec.ts(32,34): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(14,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(20,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(29,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(34,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/opportunities/R-1.13.spec.ts(132,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(49,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(63,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.2.spec.ts(30,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.2.spec.ts(35,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.20.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.20.spec.ts(46,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.21.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.21.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(55,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(58,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(52,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(71,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(14,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(22,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(33,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(19,42): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(19,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(27,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(54,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(58,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.33.spec.ts(24,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.33.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.34.spec.ts(49,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.35.spec.ts(22,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.35.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.36.spec.ts(44,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.36.spec.ts(48,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.37.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.37.spec.ts(56,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(20,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(25,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(30,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(46,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(51,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(70,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(85,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(100,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(116,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opp
    [diagnostics truncated]
