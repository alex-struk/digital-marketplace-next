---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I added the combined-condition case the reviewer asked for to `tests/acceptance/opportunities/R-1.39.spec.ts`."
opened: 2026-09-29T18:57:13.618Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I added the combined-condition case the reviewer asked for to `tests/acceptance/opportunities/R-1.39.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the revised R-1.39 tests follow from their criterion and whether the new case settles derive-tests-opportunities-stale-9#1. The new fifth case publishes three opportunities that are identical apart from their titles and remote setting, all in location Victoria. One is remote and titled with 'puffins', one is on-site and titled with 'puffins', and one is remote and titled with 'gannets'. The case confirms all three are listed, then chooses remote-only and the search word 'puffins' together without reopening the list. It then asserts separately that the one meeting both conditions stays listed and that each one meeting only a single condition is no longer listed. That is exactly the criterion's 'then' clause for combined conditions. No title is a substring of another, and the search word appears only in titles, so the match comes from the title, which the criterion names. The four existing cases were rewritten to read every list group instead of choosing a group per case, which removes a guess about how the list is laid out. Each also now confirms both opportunities are listed before choosing a condition, which sets up the criterion's 'given' and asserts nothing extra. The not-testable.yaml change only moves the R-1.51 and R-1.33 entries, with their reasons and owners unchanged. The runner's typecheck on this revision passed with no diagnostics. Evidence that search matches text beyond title and location would change the ruling, because a word-only match would then be ambiguous.

**Conditions:**
- condition-met derive-tests-opportunities-stale-9#1: tests/acceptance/opportunities/R-1.39.spec.ts adds the case '(only opportunities matching every chosen condition remain visible)', which combines remote-only with the search 'puffins'. It publishes one opportunity meeting both conditions and one meeting each single condition, confirms all three are listed first, then asserts separately that the one meeting both stays listed and that each one meeting only one condition is no longer listed.

### Runner-owned typecheck evidence

Proposal revision: `e58877bc84f23fc81c91e1da4d18b3d7dbf8cb35`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
