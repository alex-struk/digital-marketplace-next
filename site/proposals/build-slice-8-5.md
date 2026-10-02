| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T04:00:22.559Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I found and fixed a real defect in how the app checks who is signed in, and it accounts for all three empty reads in the ruling.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I found and fixed a real defect in how the app checks who is signed in, and it accounts for all three empty reads in the ruling. I could not run the sandbox itself (`docker compose` and `docker run` need an approval nobody was here to give), so I can't confirm the fix against the acceptance suite. Instead I drove the real service over the seed in headless Chromium and reproduced the failure there.

**What was wrong.** Every screen starts by asking `GET /api/sessions/current` who is signed in. If the page was left while that request was still on its way, the aborted request was treated as a refused sign-in. The app then deleted the tokens it held in the browser and began sending the browser to the identity provider's sign-out. The next page found no tokens and was drawn for a visitor without asking the service:
- The opportunity list had no Unpublished group (R-1.3, R-1.38).
- The dashboard showed a sign-in prompt instead of its rows. Its contract observations are named after R-1.3's outcome, so R-1.3's test may well read it.
- Where the redirect to sign-out won the race, the browser never reached the page the link led to (R-7.18).

This happens whenever a person, or a test, moves on as soon as a page appears.

**Evidence from the local run.** With 300 ms of delay on the session check, the old code left the browser with no tokens after following the service level agreement link. On the next list load the administrator's Unpublished group and the dashboard rows never appeared within 15 seconds. With the fix, the tokens survive and both draw in about 0.4 seconds. Without the delay, every list, dashboard and content screen draws in about 0.1 seconds.

**What I changed** (decision record `docs/decisions/0038-an-unanswered-session-check-signs-nobody-out.md`):
- `fetchCurrentSession` in `app/frontend/src/api/accounts.ts` now gives a separate "unanswered" result when the request never completed or the service failed. Only the service's own answers decide anything: 401 means a visitor and the tokens are dropped, 200 names the account or nobody, and any other refusal is a refused sign-in.
- An unanswered check draws that page as a visitor's but leaves the tokens, the `dm-signed-in` cookie and the identity provider's session alone, so the next page asks again.
- The service is now asked on every visit, even when the browser holds no tokens, because it also knows the person by its own session cookie. A browser whose cookies are cleared still comes out as a visitor's.
- The README's session paragraph says the same.

**Unit tests.** In `app/frontend/tests/signing-in.test.tsx` I replaced the test that expected no request without tokens, and added four:
- a visitor is asked without a token;
- a person is recognised by the service's own session alone;
- an aborted request keeps the sign-in and sends nobody to sign-out;
- a server failure keeps the sign-in.

`npm --prefix app run check` passes: typecheck plus 705 tests across the three workspaces. I removed the scratch harness, the build output and the `node_modules` I installed.

**The six owed conditions:**
- **`build-slice-8-3#1` (R-1.3) and `#3` (R-1.38):** addressed by the fix above. Locally, drafts made through all three programs' forms appear in the right group and on the right person's dashboard.
- **`#4` (R-7.18):** addressed by the same fix, which is why it broke with slice 8 rather than earlier. The service level agreement link stays on the learn-more screens, the program cards and the three forms, and opening it shows the page.
- **`#2` (R-1.5, conflict):** met by the previous revision (decision record 0037), and the latest ruling no longer lists it.
- **`#5` (R-1.23, dates in Pacific time):** met the same way.
- **`#6` (layout):** I re-checked that every screen sits inside the one page container and spaces itself with the one stack. The paddings and widths left are a card's inner padding, table cells and badges, as in the stories.

One behaviour change for a later reviewer: a browser whose tokens are gone but whose service session cookie still lives is now shown as signed in. Decision record 0038 says what would reverse that. The next slice will find nothing new missing from this one. The Sprint With Us and Team With Us public pages remain slice 10's, as before.

_Ruled: return by runner:verify_
