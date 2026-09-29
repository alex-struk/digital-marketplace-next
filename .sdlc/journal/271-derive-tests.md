---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T18:57:13.583Z"
cost: 0.3208064
turns: 9
session: "9b7a54ae-5903-4232-813a-29cc1d30efb1"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I added the combined-condition case the reviewer asked for to `tests/acceptance/opportunities/R-1.39.spec.ts`. I couldn't run the typecheck here because this session's permissions blocked it. The new case only reuses helpers and fields the file's earlier cases already use, and the runner's typecheck passed on those.

**Condition 1 (R-1.39, the clause "only opportunities matching every chosen condition remain visible"):** I added a fifth test, titled with the criterion's statement plus "(only opportunities matching every chosen condition remain visible)". The surface can combine conditions: `opportunityList` has `filterRemoteOnly` and `search`, and choosing one doesn't reopen the list. So I wrote a test rather than a `not-testable.yaml` entry.

The test signs in as the administrator and publishes three opportunities:
- **Meets both:** accepts remote work, and its title contains "puffins".
- **Meets the search word only:** contains "puffins", but does not accept remote work.
- **Meets remote-only only:** accepts remote work, and its title contains "gannets" instead of the search word.

It first checks that all three are listed. Then it turns on remote-only and searches for "puffins" without reopening the list, so both conditions are in force together. After that it checks three things, each on its own:
- the one meeting both is still listed;
- the search-word-only one is no longer listed;
- the remote-only one is no longer listed.

That covers failing on either condition, not just one. No title is a substring of another. The test reads all three list groups, using the same `shows`/`hides` helpers as the other cases.

I left the rest of `R-1.39.spec.ts` untouched. The header's "derived" date is already 2026-09-29, today, so it didn't need changing. I changed no other file under `tests/acceptance/opportunities/` and didn't touch `tests/acceptance/not-testable.yaml`.

**Not done:** nothing in the conditions was out of reach, and the contract needs no new surface actions or observations for this criterion.