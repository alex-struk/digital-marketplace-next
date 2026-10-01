---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-01T14:01:12.441Z"
cost: 0.3828576
turns: 11
session: "4e5f4688-2688-417a-b078-594cc9f6008b"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I wrote a test for R-1.6, the one criterion in this run, and removed its entry from `tests/acceptance/not-testable.yaml`. Nothing in this run was left untestable, and I needed no surface action or observation that the contract doesn't already have. The test hasn't been run or type-checked: running the TypeScript compiler from this workspace needed approval and was refused.

**Why it can now be tested.** R-1.6 was recorded as blocked because the view count was on no surface page. The contract stage has since added the `opportunity-counters` page, opened by the opportunity's program and identifier, with a `view_count` observation (`viewCount()` in the generated types). That is the count the criterion is about.

**What the test does** (`tests/acceptance/opportunities/R-1.6.spec.ts`, one test titled with the criterion's statement). It works on `seed.opportunities.publishedCodeWithUs`:
1. Signs in as `persona.administrator`, opens the counters page for the opportunity and reads the count. An empty answer reads as 0, because the contract says a counter never incremented is left out of the answer. Then it signs out.
2. Opens the opportunity's public page (`opportunityCwuView`) signed out, and checks the page shows the opportunity's identifier.
3. Reads the count again the same way and asserts it went up by exactly one.

Two choices worth knowing:
- **Who opens the public page.** The handback note said counters would be "readable signed out or by any persona", but the contract allows only an administrator or public-sector staff. So the test reads the count as the administrator and opens the public page as an anonymous visitor. That keeps the one viewing between the two reads a genuine public opening, not a staff member on the page.
- **Exactly one, not just a change.** The test checks an increase of exactly one rather than any change, which is what the earlier review in `tests/acceptance/redo.yaml` asked for. That review had flagged the previous test for reading the count off the management screen; it is already closed, so I left it alone.

**What could break it.** The test assumes nothing else views this seeded opportunity between the two reads. A suite run in parallel against a shared target could break that. Also, the counters page takes the seed's `program` value (`code-with-us`) as-is; the contract stage reported checking that this addressing works on the oracle.

I changed nothing outside `tests/acceptance`.