| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T18:44:06.198Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** This revision does both things the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

This revision does both things the ruling asked for. Signing out (R-4.17) now also works in two edge cases, but I could not run it live, so it is checked only by reading the code and by unit tests.

**Ticket number (egress rule E-2).** The rule's text isn't in this workspace, so I couldn't tell for certain which number it meant in `app/backend/tests/sign-in-flow.test.ts`. The file had three reference numbers: a pointer to decision record 0015 in the header comment, the criterion number R-4.4 in one test group's title, and the RFC 7636 number in one test's title and comment. Criterion numbers appear in every other test file and only this file was named, so the RFC number is the most likely target. I removed all three rather than guess. The comment now says "the worked example from the PKCE standard's appendix". The only numbers left are port numbers in addresses and HTTP status codes.

**Signing out (R-4.17, condition `build-slice-2-5#1`).** I read the whole sign-out path again: the header's "Sign out" link to `/sign-out`, the screen, the session code in the browser, the service's `DELETE /api/sessions/current`, the token check on every `/api` request, and the sandbox realm's client settings. The order is right:
- The service is told first and refuses that session's tokens from then on.
- The page then ends the identity provider's session with a direct request.
- If that request fails, the browser is sent to the identity provider's logout page and comes back to `/sign-out`.
- "You have successfully signed out" (`sign-out-success`) appears only once both have ended the session. If the service can't be told, the page shows `sign-out-failed`.
- Pages that need a sign-in send a visitor back to sign in.
- A request to end someone else's session is refused.

The realm allows `http://localhost:4300` as the page's origin and as the place to return to after logout, so both routes back work.

Two edge cases could leave a person told the wrong thing, so I fixed them:
- **Retried sign-out.** If someone signed out in another tab or an earlier attempt, the service answers the sign-out request with "not signed in" (401). The page used to call that a failure and stop, leaving the identity provider's session running. A 401 now counts as "the service holds no session", and sign-out goes on to the identity provider. This is in `app/frontend/src/api/accounts.ts`.
- **Tokens that outlived the one signed out with.** The service remembered a signed-out session only until the token used to sign out expired. Another tab could hold a token from the same session renewed moments later, and it would have been accepted again after that. The session is now remembered for at least one full token lifetime (an hour by default) after sign-out. This is in `app/backend/src/auth/signed-out-sessions.ts`.

I updated decision record 0011's sign-out paragraph to say both of these.

**Tests.** I added a frontend test for the "not signed in" answer: sign-out reaches the identity provider and the success message shows. I added a backend test for the new minimum time a signed-out session is remembered, and adjusted the existing one to match. `npm --prefix app run check` typechecks and passes in all three packages: 296 tests, 15 + 186 + 95. The dependencies weren't installed here, so I installed them for the check and removed the `node_modules` folders afterwards, since there is no ignore file and they would otherwise have travelled with the proposal.

**What I could not do.** I couldn't run slice 2 end to end in a browser. Ports 4300 and 8025 are held by another pipeline's running stack, which I left alone, and I wasn't permitted to start containers even for Keycloak alone on the free port 8080. So I haven't observed two things live: whether Keycloak 26.0 lets the page read the reply to its logout request, and how sign-out behaves with the newly rebound test adapter. If the page can't read that reply, the fallback through the identity provider's logout page still ends the session and returns to `/sign-out`. The condition asked for all of slice 2 to be re-verified; in practice that means the acceptance run after this turn.

The other criteria (R-4.1, R-4.2, R-4.3, R-4.23, R-4.24, R-6.1, R-6.20, R-6.28) are as the earlier revision built them, and I changed nothing there. As instructed, I left alone the condition addressed to the plan stage about moving R-4.6, R-4.22, R-4.27, R-4.28 and R-6.2 to R-6.5 to later slices. The next slice will still find a backend that runs as a single instance, because the list of signed-out sessions is kept in memory.

_Ruled: return by runner:verify_
