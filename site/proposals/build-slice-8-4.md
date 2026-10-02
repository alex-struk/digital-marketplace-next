| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T02:46:36.386Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I fixed four of the six things the ruling named: R-1.5, the R-1.23 and R-7.18 regressions, and the layout.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed four of the six things the ruling named: R-1.5, the R-1.23 and R-7.18 regressions, and the layout. I could not find why R-1.3 and R-1.38 read an empty list, so I made no change aimed at them. `npm --prefix app run check` passes: migrations 16 tests, backend 422, frontend 264. I could not run the application itself, because starting the compose stack needed an approval nobody was here to give. So none of this has been checked against the running application or the acceptance suite.

**R-1.5 (a duplicate watch must be refused as "conflict").** The contract's surface entry for watching by request (`opportunity-watch-request`) says how refusals are named. A second watch is filed under `conflict` ("This user is already subscribed to this opportunity."). Watching your own opportunity is filed under `opportunity`. An opportunity you cannot see, or a watch that isn't there to end, is `notFound`. A request with no session is `permissions`. The service had been answering all of these as `{ "errors": [...] }`. Now `/api/subscribers/<program>` answers `{ "conflict": [...] }` and so on: status 400, except `permissions`, which is 401. Every other route keeps the single `errors` shape, and a new `NamedRefusal` class in `common/refusals.ts` is how a route opts out of it. The in-process end-to-end test now checks each refusal's body and that a refused watch adds no watcher.

**R-1.23 (published date shown as the UTC day in the evening).** The shared `readDate` now gives the Pacific-time day, using the same rule the service already uses for deadlines and "today". This changes every day-only date in the app: the published date, the content page dates, the dashboard's last-changed date and the deactivation date. I deliberately left `readMoment` (date and time to the minute, used on the page-managing screen and the profile's terms record) in UTC. Shifting a time of day would change every reading of it at every hour, not only in the evening, and the ruling named the day. Decision record 0037 says this and what would reverse it. The time-zone data here has British Columbia on permanent UTC−7, so the new date tests avoid any winter-offset assumption.

**R-7.18 (the link's address read as empty).** R-7.18 and the design notes say the service level agreement link, under the same test ID, belongs on the three program cards and on all three opportunity forms. Only the learn-more screen had it, while the program chooser and the forms now exist. It is now on each program card, on the Code With Us form (create and edit), and on the Sprint With Us and Team With Us create forms. A new frontend test checks each of those screens for the link and its address. This is my reading of the empty value, not something I confirmed by running it.

**Layout.** The catalogue's page container and stack are defined once, in `app/frontend/src/app/page-layout.tsx`. The root layout wraps every screen in the container, and every screen, the header's navigation and the formatted-text renderer are now spaced only with stack gaps, as their stories show. `layout.ts` now holds only a card's border and padding, the status badge and a term's weight. Four helper agents did the mechanical migration on separate sets of files, and I reviewed and ran it as a whole. They report that every `data-testid` stayed on its element.

Where they could not follow a story exactly:
- The incomplete-opportunity notice on the edit screen stays inside its tab, because an existing test requires it there.
- The content list still shows "Create page" while it loads.
- The vendor dashboard and the interim Sprint With Us / Team With Us manage page have no full story, so only their shared parts follow one.
- Following the stories, the profile's tab list now uses the medium gap instead of large, and its program-terms list now shows bullets.

**Not resolved: R-1.3 and R-1.38 (the list's text read as empty).**
- **What I ruled out.** I dumped the service's real list answers from the seeded in-process database for an administrator, a staff member and a vendor, and rendered the list screen with them. All three groups drew correctly, with the staff member's and administrator's drafts in Unpublished. The service already judges "today" in Pacific time everywhere, so creating opportunities in the evening isn't the cause either.
- **What I suspect.** The opportunity the test creates on a create screen never reaches the list, or the list is read before it is drawn. I could not confirm either without the stack.
- **What I changed.** The list was only moved onto the new layout; its group structure and test IDs are as the stories show.
- **What the next revision needs.** A run of the real stack: sign in as `test-gov`, save a draft on the Code With Us create screen, open `/opportunities`, and see whether `opportunity-group-unpublished` holds it.

**Left to other stages.**
- Moving R-1.39 to slice 10 is the plan's to do, and I did not touch it.
- Slice 9 will still find the addenda, cancellation and reporting figures missing.
- Slice 10 will find the Sprint With Us and Team With Us forms built only for drafts and the interim manage page, both now on the new layout and carrying the service level agreement link.

I removed the `node_modules` I installed to run the check. Decision record 0037 and a "Screens and dates" note in `app/README.md` record the choices above.

_Ruled: return by runner:verify_
