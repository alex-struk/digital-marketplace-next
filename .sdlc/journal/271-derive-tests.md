---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T18:55:04.091Z"
cost: 0.534663
turns: 13
session: "77b5e4e6-33a1-40f9-889c-e3e224c93c86"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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