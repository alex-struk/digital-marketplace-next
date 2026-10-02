| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T05:02:37.029Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I couldn't reproduce the three failures (R-1.3, R-1.38 and R-7.18), so this revision fixes the likeliest causes I found by reading the code.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I couldn't reproduce the three failures (R-1.3, R-1.38 and R-7.18), so this revision fixes the likeliest causes I found by reading the code. Whether those are the real causes will only be known when the acceptance suite runs. Containers needed approval that wasn't available in this session, so I couldn't start the application or drive it in a browser. `npm --prefix app run check` passes: 16 migration tests, 422 backend tests and 277 frontend tests. Before that final run, one backend test file failed once in a full run and passed every time after, on its own and in the full run.

**What the three failures share.** Each read empty text. That means the part of the screen holding the answer wasn't on the page when it was read; the answer wasn't simply wrong. The code allowed this to happen in four ways:

1. **Heading before content.** The opportunity list, and every screen for staff alone (choosing a program, and the three create forms where the service level agreement links sit), drew their heading over a spinner the moment they opened. Anything that waits for a heading and then reads would find no Unpublished group and no program cards yet.
   - Now these screens draw nothing for their first second, then the screen whole once its data and the person are known.
   - If loading takes longer than a second, the catalogue's own loading frame (heading and spinner) appears as before.
   - Moving to a new screen inside the app still puts focus on its heading: the root layout now waits for a heading that arrives late.
2. **Two round trips before the list.** The list was only requested after the "who is signed in" check came back. It is now requested at the same moment, and the answer is kept for whoever the check names. A program the service fails on is asked for again twice, after 300 ms and then after a further second.
3. **One unanswered sign-in check made the visit a visitor's.** A single failed check meant a staff member saw a visitor's list, which has no Unpublished group. The check is now asked again three times before the visit is drawn as a visitor's.
4. **A refused token made the visit a visitor's even when the service's session cookie still named the person.** The token is now dropped and the check asked once more on the cookie alone. In the sandbox identity provider, access tokens now last an hour and sessions ten hours, the same as the service's own session, instead of Keycloak's 5 minutes and 30 minutes idle.

Separately, a page of prose now asks again after a fault or no answer, rather than showing not-found for a page that exists. The service's own "not found" and "bad address" answers still stand as they come.

**The six conditions still owed:**
- **`build-slice-8-3#1`, `#3`, `#4`** (R-1.3, R-1.38, R-7.18): addressed by the changes above, but not confirmed in a running application.
- **`build-slice-8-3#2`** (R-1.5, watch refused as a duplicate): the latest ruling no longer lists it as failing. The fix from the previous revision is unchanged.
- **`build-slice-8-3#5`** (R-1.23, published date in Pacific time): no longer listed as failing. Dates on the managing screens, which also show a time, are still in UTC, as recorded in decision record 0037.
- **`build-slice-8-3#6`** (layout): I checked every screen. Each sits in the one page container and stack defined in `app/frontend/src/app/page-layout.tsx`, and none sets its own width, outer padding or gaps.

**Unit tests added:**
- **List:** it is requested before the session is known and that answer is kept; a program that fails is asked for again; nothing is drawn at first and the loading frame appears after the delay; focus reaches a heading that arrives late.
- **Staff-only screens:** they draw nothing at first, and the program cards with all three service level agreement links once the person is known to be staff.
- **Sign-in check:** a refused token falls back to the session cookie; an unanswered check is retried and is not drawn as a visitor's meanwhile.
- **Page of prose:** asked again after a fault; a 404 is taken as it comes; not-found once every attempt goes unanswered.
- **Realm:** the realm-keys test now also allows the three lifetime settings.

**Choices a reviewer may question** (recorded in decision record 0039, which amends 0017, 0034 and 0038):
- The loading frame is held back for a second on the list and staff-only screens. The loading stories themselves are unchanged; only when they first appear has changed.
- The dashboard, profile and administrator screens still show their loading state immediately.
- The longer token and session lifetimes apply to the local sandbox only.

**What the next slice will find missing:** the Sprint With Us and Team With Us public pages (the list's links to them still land on not-found) and the deadline-closing step (R-1.1) are still unbuilt.

I changed only `app/` and `docs/decisions/`. I removed the dependency folders I installed under `app/`, so the run's own install provides them.

_Ruled: return by tech-lead_
