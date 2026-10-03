| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-10-03T15:21:41.766Z |
| holder | agent:architect |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I took up the one condition.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I took up the one condition. R-3.6, R-3.15 and R-3.23 now sit in Slice 12, which builds the organization's Team members tab, instead of Slice 11. Nothing else in the plan changed.

**Why.** Verification of Slice 11's build found that the tests for all three criteria go through the Team members tab. They add team members or read the owner's badge there, but Slice 11 only shows that tab as "This section is not available yet." The ruling offered two fixes. I moved the criteria rather than adding the team tab to Slice 11, because adding the tab would fold most of Slice 12 into Slice 11 and leave Slice 12 with little of its own to show.

**What still holds.** Slice 12 already depends on Slice 11, so everything these tests need is in place by the time Slice 12 is built. The behaviour itself is still built in Slice 11: archiving, the registering vendor becoming owner of an organization that is active straight away, and the list of organizations a vendor may act for. Only where the three criteria are answered for has moved. This is the same pattern the plan already uses for R-8.17 and the image rules. Slice 14, which uses the list of organizations a vendor may act for, needs only what Slice 11 builds, so its dependencies are unchanged.

**What I edited:**
- **`plan/tasks.md`:**
  - Removed the three IDs from Slice 11's criteria line and added them to Slice 12's.
  - Added a sentence to each slice's "delivers" line: Slice 11's says the behaviour is built there but answered for later; Slice 12's says what it now answers for and why.
- **`plan/plan.md`:**
  - Added an entry under "Criteria that sit awkwardly where they are" explaining the move and why the other fix was not taken.
  - Extended the coverage-check note. Both slices were already in the organizations row of the coverage table, so no count changes: 31 organizations criteria, 248 in total, 21 slices.

The Constitution check and the slice order are untouched. I wrote no new decision record, since moving where a criterion is answered for is not a choice a later reader would have to work out for themselves.

**Not verified.** I could not run `plan/check-coverage.mjs` because running a script needed an approval this session could not get. As a hand check, I searched `plan/tasks.md` and found each of the three IDs on exactly one criteria line, Slice 12's. Whoever next has a shell should run `node plan/check-coverage.mjs .` from the workspace root.

Nothing was deferred, and no condition was addressed to a person.

## Ruling

**Verdict:** approve
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is moving R-3.6, R-3.15 and R-3.23 from Slice 11 to Slice 12 the right cut, with each slice standing on its own? Ruling: approve. Verification of Slice 11's build found these three criteria's tests go through the organization's Team members tab (adding members, reading the owner's badge), which Slice 11 shows only as 'not available yet' and Slice 12 builds. Slice 12 already depends on Slice 11, where the behaviour is still built, so Slice 12 has both the behaviour and the screen the tests use. This takes up the revision request from build-slice-11-3. Slice 11 still has a complete piece of work to show: the public list, registration, the profile tab, the archive notice and the four image rules. Slice 14's dependencies, the Constitution check and the slice order are unchanged. The plan already uses this pattern for R-8.17 and the image rules. The tier is STANDARD, with no schema change and no new dependency, so nothing escalates. A search of plan/tasks.md found each of the three IDs on Slice 12's criteria line and no longer on Slice 11's. The coverage script was not run because it needed an approval this session could not get. What would change the ruling: the coverage script showing any of the three unassigned or assigned to more than one slice. The two fixes owed by build (build-slice-11-3#1, Archive control placement, and #2, the disabled Create button) are not settled by this plan and stay open.

**Conditions:**
none
