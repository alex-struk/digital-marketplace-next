---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "**Journal: derive-tests, opportunities domain (spec@ccc1cba3)**\n\nI was given two criteria."
opened: 2026-09-29T00:03:14.976Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** **Journal: derive-tests, opportunities domain (spec@ccc1cba3)**

I was given two criteria.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

**Journal: derive-tests, opportunities domain (spec@ccc1cba3)**

I was given two criteria. One now has a test file and the other has an entry in `not-testable.yaml`. I could not run a YAML parse or a TypeScript check because the commands needed approval, so neither file has been validated or run.

**R-1.16 v1, rewritten test.** The ruling said the old test's opportunity was refused over its phase dates before the phase rule was ever checked. I rewrote the test from the criterion so that every part of the opportunity except the phase arrangement is valid:
- **Dates:** each phase starts well after the assignment date (day 21). In the inception-without-prototype case, inception runs from day 30 to day 45 and implementation from day 60 to day 120. That leaves a wide gap, where the old test had implementation start the day after inception ended.
- **Capabilities:** every phase now names a required capability. The old test's phases named none. Other tests in the workspace that publish Sprint With Us opportunities successfully always name one, and the spec says Sprint With Us checks "every phase".
- **Budget:** the phase budgets sum to $500,000 against a total of $1,000,000, where the old ones used up the total exactly.

The spec does not set out the phase-date rules, so I built these dates to stay clear of every reasonable ordering rule rather than to match a known one. If the service measures implementation's earliest start from the missing prototype phase in a way that always fails, no valid set of dates can avoid it. That would be a question for contract or ratify, not something a test can fix.

The file keeps two tests:
- **Missing implementation phase:** this does not demand a refusal message. If the opportunity was published, its phases must include implementation; if not, it must be absent from the dashboard.
- **Inception without prototype:** the refusal message must mention both "prototype" and "inception", and the opportunity must not end up published.

**R-1.33 v2, not testable (blocked, owner: contract).** Version 2 says the service accepts a private note but that no screen offers a way to add one. The earlier v1 test added its note through `add_note`, which contradicts what v2 says. The surface still declares `add_note` on both `opportunity-cwu-edit` and `opportunity-swu-edit`, and nothing else in the surface reaches the criterion. I deleted `R-1.33.spec.ts` and wrote one entry for the whole criterion. What would make it testable:
- **Remove `add_note`** from both edit pages.
- **Seed two opportunities,** one Code With Us and one Sprint With Us, each with a private note and an attached file in its history: one written by the opportunity's author, one by an administrator. They need handles in the manifest's `opportunities` group so `history_tab` can be read as the author, as an administrator and as another staff member.
- **Add an observation** on both edit pages saying whether any control for adding a note is offered.

The entry also says that the clause "the service accepts" could only ever be shown by a request that no screen sends. Ratify would have to restate that clause in terms something on a page shows, or withdraw it.

I changed nothing under `spec/`, `tests/seed/` or `tests/fixtures/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The rewritten R-1.16 tests assert only what the criterion states. The first checks that no Sprint With Us opportunity ends up published without an implementation phase. The second checks that an inception-without-prototype submission is rejected, that the message names prototype and inception, and that the opportunity is not published. The date, capability and budget changes are setup that makes the phase arrangement the only fault, as the redo asked, and no implementation detail leaks in. The runner's typecheck reports no diagnostics under acceptance/opportunities. Deleting R-1.33's v1 test is correct: it added its note through add_note, which v2 says no screen offers. Its not-testable entry names real gaps in the surface: add_note is still declared, no seeded opportunity carries a note with a file, and no observation reports whether a note control is offered. The entry is owed by contract. The clause that the service accepts a note can only be shown by a request no screen sends, so it is recorded here as owed by ratify. This would change on a typecheck diagnostic in the opportunities tests, or on the spec making editing a separately tested clause of R-1.16.

**Conditions:**
- missing-test R-1.33: the service accepts a private note with files from the opportunity's author or an administrator at any point in its life — owed by ratify: a restatement of the acceptance clause in terms something on a page observes, or a ruling withdrawing it, since only a request no screen sends could show it

### Runner-owned typecheck evidence

Proposal revision: `2de294edea31be2291d6ffecb7aef690d2b32ad0`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
