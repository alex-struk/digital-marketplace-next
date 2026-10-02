---
gate: G3
question: "Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?"
recommendation: "I fixed the one regression the ruling names, R-1.11, and went through the six conditions still open from the earlier ruling."
opened: 2026-10-02T06:00:03.422Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I fixed the one regression the ruling names, R-1.11, and went through the six conditions still open from the earlier ruling.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the one regression the ruling names, R-1.11, and went through the six conditions still open from the earlier ruling. `npm --prefix app run check` passes in all three workspaces: 16 migration tests, 426 backend tests (4 of them new) and 277 frontend tests. I could not run the application: starting the compose stack needs an approval nobody was here to give, and no browser is installed. So nothing below was watched in a browser; it comes from reading the code and running the unit tests.

**R-1.11, the regression.** The failing check was reading the opportunity list's Open group and found an opportunity there that should have been refused. The cause was in the Sprint With Us and Team With Us create path. Decision 0036 had the service keep an opportunity created under review, or published by an administrator, exactly as sent, leaving every content rule to slice 10. So an administrator could publish one that accepted remote work with no description, and it was listed as open. R-1.11 applies to all three programs. This probably went unnoticed before because, until the previous revision, the list read as empty at that point. Fixing the list exposed it.

- **Service:** a new rule, `remoteWorkProblems` in `app/backend/src/rules/other-program-drafts.ts`. `OtherProgramsService.create` uses it to refuse, for anything that isn't a draft, remote work accepted with a blank description, and any description over 500 characters. The answer is 400 `{ errors: [...] }`, in the same wording Code With Us uses. Drafts are still never refused.
- **What is not refused:** a request that says nothing about remote work is still kept, as "not acceptable". The create forms always send yes or no. But requests made directly to build the staff and administrator lists (R-1.3, R-1.38) may leave it out, and refusing them could empty those groups again.
- **The two create screens:** they now show this refusal under the field's label, mark the description field invalid, and their opening sentence says this one rule is checked.
- **Tests:** unit tests for the rule, plus a case in the end-to-end tests that run the real schema in process (PGlite). It checks that both programs refuse and keep nothing, and that a draft is still accepted.
- **Records:** decision record 0040, and the README paragraph on the other two programs, which was out of date.

**The six open conditions.** The latest ruling reports only R-1.11 as breaking an earlier slice, so I take it that R-7.18 and R-1.23, both earlier-slice criteria, now pass. I re-checked each condition in the code but changed none of them here.

- **build-slice-8-3#1 (R-1.3) and #3 (R-1.38):** last revision's changes are still in place. The list is drawn whole once it knows who is viewing and has its data, it is fetched alongside the session check, and a session check that gets no answer is retried. The Unpublished group is drawn for staff and administrators. Unconfirmed until the suite runs.
- **build-slice-8-3#2 (R-1.5):** a second watch is refused 400 `{ "conflict": [...] }`. I traced every path; nothing in the watch route falls back to `errors`, and a duplicate that hits the database key is caught too. If the suite still reads `errors`, the request is probably being refused by the contract validator before the route is reached. The other possibility is that the suite's request differs from what the surface page describes. Neither can be settled without a run.
- **build-slice-8-3#4 (R-7.18):** the link is on the learn-more screen, the program cards and the three forms, and the page at its address is retried after a fault rather than shown as not found.
- **build-slice-8-3#5 (R-1.23):** every date shown is the day in Pacific time, through `readDate`. Times shown to the minute (`readMoment`) are still in UTC, as decision record 0037 records.
- **build-slice-8-3#6 (layout):** the catalogue's page container and stack are defined once, in `app/frontend/src/app/page-layout.tsx`, and match `design/catalogue/layout.tsx` apart from comments and two extra element types. No screen sets its own width, outer padding or gaps; only cards, table cells, badges and fieldsets keep the inner padding their stories give them.

**Left for slice 10:** apart from remote work, Sprint With Us and Team With Us opportunities are still kept as sent. That includes a request that doesn't say whether remote work is acceptable, which R-1.11 says must be refused. Slice 10 brings each program's full rules for anything that isn't a draft (R-1.13, R-1.15 to R-1.18).

I changed nothing outside `app/` and `docs/decisions/`. I installed `app/node_modules` only to run the checks and removed it afterwards.
