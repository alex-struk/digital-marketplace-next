---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote the R-1.39 test."
opened: 2026-09-29T18:55:04.122Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the R-1.39 test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the R-1.39 test. One criterion was in scope and it now has a test; nothing went into `not-testable.yaml`. The file is `tests/acceptance/opportunities/R-1.39.spec.ts`, with the header for spec@258c8b6 derived 2026-09-29. I could not type-check it, because the compile command needed an approval nobody was here to give. It has not been run either, so both remain for a later stage.

**What was wrong and how the new test avoids it.** The ruling said the by-state case never confirmed that the saved draft was in the list before filtering. It also said the case checked "still there" and "gone" together, so a failure didn't say which half broke. The new test fixes both, and I applied the same pattern to all four ways of narrowing the list, not only by state. Each case:

1. Sets up two opportunities that one filter separates.
2. Opens the list and waits until both can be seen, before choosing anything.
3. Chooses the filter.
4. Makes two separate checks, each with its own message: the opportunity that matches is still listed, and the other one is no longer listed.

The list may take a moment to narrow, so each check re-reads it until it holds or times out. Each check reads all three groups of the list together (unpublished, open and closed), because the criterion is about what the list contains, not about which group an item sits in. That way an item that only moved to another group can't pass as gone. A group that can't be read is treated as empty, since a group with nothing left in it may not appear at all.

**The four tests, one per way of narrowing, each titled with the criterion's statement:**
- **Program:** a Code With Us opportunity published during the test, against `seed.opportunities.closedSprintWithUs`, filtered both ways.
- **State:** a published opportunity against a saved draft, filtered to Published and then to Draft.
- **Remote only:** an opportunity that accepts remote work against one that doesn't.
- **Free text:** one search matches a title word, and a second matches another opportunity's location. This covers both halves of "title and location".

Everything goes through `surface.opportunityList`, `surface.opportunityCwuCreate`, `persona.administrator` and the seed. The test asserts nothing beyond the criterion.

**What the contract should add.** The actions I needed all exist. The contract doesn't document what input the four filter actions take (`filterByProgram`, `filterByStatus`, `filterRemoteOnly`, `search`). I kept the shapes from the previously approved derivation (`{ program }`, `{ status }`, `{ remoteOnly }`, `{ text }`), but these are an assumption. The seed has no draft opportunity, so the test creates its own draft with `saveDraft`. A seeded draft would make the by-state case depend less on that step. Both are for the `contract` stage.

I changed no file outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-1.39 tests follow from the criterion and nothing else? Ruling: return. The rewrite meets the outstanding redo request in full: every case confirms both opportunities are listed before a condition is chosen, then asserts retention and exclusion as separate polled checks with their own messages. It reads all three list groups so an item that only moved group cannot pass as gone, and all four ways of narrowing are covered, with free text exercised against both title and location. Every assertion follows from the criterion, nothing implementation-shaped leaks in, the titles are free of substring collisions, and the runner's typecheck passed. But the criterion's then-clause is 'only opportunities matching every chosen condition remain visible', and no test ever chooses more than one condition, so the conjunction is asserted by nothing and there is no not-testable entry for it. The surface plainly reaches it: all four filter actions exist and each case already chains open, filter and read. So this is a clause the writer could assert and did not, and a passing run would otherwise close the criterion's missing test with that clause owed by nobody. What would change the ruling: a case that chooses two conditions together (e.g. a program and a search word) and shows that an opportunity meeting only one of them is no longer listed while one meeting both remains; or, if the writer finds the surface genuinely cannot combine conditions, a not-testable.yaml entry carrying that clause and naming what is missing.

**Conditions:**
- R-1.39: the clause 'only opportunities matching every chosen condition remain visible' is asserted by no test, because each case chooses a single condition. Add a case that chooses two conditions together (for example a program and a search word, or remote-only and a search word). Set up one opportunity meeting both and one meeting only one of them, confirm both are listed first, then assert separately that the one meeting both is still listed and the one meeting only one is no longer listed. If the surface cannot combine conditions, record a not-testable.yaml entry with `clause` naming this clause and what is missing from the surface.

### Runner-owned typecheck evidence

Proposal revision: `4ab586d652acc4662d14e2d5d7569121b4eafda8`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
