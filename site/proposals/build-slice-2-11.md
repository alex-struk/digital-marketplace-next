| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T19:45:29.044Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** The ruling said R-4.1, R-4.3 and R-4.17 each read an empty value.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

## Journal: slice 2, fourth revision

The ruling said R-4.1, R-4.3 and R-4.17 each read an empty value. It also carried two open conditions, `build-slice-2-5#1` and `build-slice-2-8#2`. I changed the code for all three criteria and met both conditions, but none of it has been run against the real stack. The reason for the three failures below is my inference from the pattern of results, and `docker compose` and `docker run` both needed an approval nobody was here to give. What I did check: `npm --prefix app run check` passes (migrations 15, backend 197, frontend 106 tests), and the production frontend bundle builds.

### Why I think the three criteria failed

I compared what passed with what failed:
- **Passed:** R-4.24 and R-6.20 read the account from `/api/sessions/current`. R-4.22 and R-4.23 read where sign-in lands. R-4.2 reads the mail catcher.
- **Failed:** R-4.1, R-4.3 and R-4.17 read things a screen draws: the identifier and details on `/users/me`, the terms-agreed date on the legal tab, and the signed-out message on `/sign-out`.

Every one of those screens was drawn only after one or more network round trips. `/sign-out` took three, one of them a cross-origin call to Keycloak. The not-found screen is drawn without waiting, and an earlier round read it correctly. So my reading is that the suite reads each screen as soon as the page loads, and finds it still empty.

### What I changed (decision record 0018)

- **R-4.1 and R-4.3: the account is available before the first screen is drawn.**
  - The sign-in callback now hands the account over in a cookie (`dm-handover-account`), next to the token cookies.
  - The app keeps the account in local storage beside its tokens. It is updated whenever the service answers or a save such as finishing sign-up returns, and cleared on sign-out.
  - The app now settles who is using it before React renders, and asks the service in the background. So `/users/me`, the legal tab and `/sign-up/complete` are drawn with the account straight away. Every permission is still decided by the service from `users`.
- **R-4.17 and `build-slice-2-5#1`: signing out is one request that ends both sessions.**
  - The service's own session now keeps the refresh token that sign-in completed with.
  - `DELETE /api/sessions/current` ends the service's session, then ends Keycloak's by presenting that token over the compose network. It answers `{ id, user: null, identityProviderSignedOut }`.
  - The page ends Keycloak's session itself only when that field is false, using the earlier POST, with the redirect as fallback.
  - Opening `/sign-out` directly sends that DELETE as a synchronous request, carrying the browser's cookie, before the page is drawn. The first screen therefore already says "signed out" or "failed". The one exception: when the service could not end Keycloak's session, the page ends it itself and only then says so.
  - A synchronous request is normally avoided; the record gives the reason for using one here. Signing out from inside the app still goes the asynchronous way.
- **`build-slice-2-8#2`:** the RFC number is already gone from `app/backend/tests/sign-in-flow.test.ts`. The only ticket-shaped string left was "SHA-256" in a test name, which reads like a ticket key; I reworded it and a search finds no such pattern in the file now.

### Unit tests added

- **Backend:** the service session keeps and finds the refresh token, including by the identity-provider session alone. End to end against a stand-in realm:
  - sign-out by bearer token plus cookie ends the realm session with the kept refresh token;
  - sign-out by cookie alone does the same and makes the token refused afterwards;
  - the callback hands over a readable account.
- **Frontend:**
  - the handed-over account is adopted into storage, an unreadable one is dropped, and forgetting the tokens forgets the account;
  - a visitor is known before anything is asked, and a held account is drawn first and then replaced by the service's answer;
  - saving keeps the account for the next page;
  - opening `/sign-out` covers five cases: both sessions ended before drawing with no requests, Keycloak ended from the page, the fallback to the token, a plain visitor, and the service unreachable.

### What I could not do, and what is not mine

- If the cause is something other than read timing, these changes may not fix it. One other candidate for R-4.3: a disabled button's `disabled` attribute reads as an empty string (`disabled=""`), which is exactly what the ruling reported. I left it alone, because the story uses the same markup and the design-system Button forwards no ref.
- I built nothing outside the criteria of slice 2. I did not change plan, spec, design or seed.

### For the next slice

- `GET /api/users/{id}`, editing the profile, pictures, capabilities and deactivation are still slice 3's.
- Service sessions and the list of signed-out sessions are held in memory, so the backend must run as one instance.
- Any screen that saves the signed-in person's account should call `holdAccount` so the stored copy stays current.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 2 do what its criteria say, given runner:verify's account that three failed verifies may not be the application's fault? Ruling: return. Verify's account decided it: the failures come mainly from the test adapter (tests/adapters/new/index.ts), not the application, and the build's own diagnosis (screens read before they are drawn) does not hold up against the adapter code. (1) R-4.17: the adapter's signOut() (line 424) only clears cookies and opens '/'. It never opens /sign-out, so signedOutMessage looks for 'signed out' on the home page and reads ''. It also never clears the app's local storage, where the app keeps its tokens. No application change can make R-4.17 pass through that binding. (2) R-6.20 and R-4.23 regressed to unbound for the same reason. Every signIn() begins with that signOut() and then opens /sign-in. The tokens are still in local storage, so the app treats the person as signed in and sends them to /dashboard, and the adapter reports 'no Sign in as a vendor control'. Revision 11 makes this worse, because the app now decides who is using it from local storage before it draws. (3) R-4.1: userProfileSelf.statusBadge reads the line after a line that says exactly 'Status'. The profile draws 'Status: Active' on one line (user-profile.tsx:149), so the adapter reads ''. The binding file declares this observation never seen signed in. (4) R-4.3: which read returned '' is not established. The build's alternative theory, that a disabled button's attribute reads as '', does not apply, because that adapter call returns 'disabled' or ''. The build's changes under decision record 0018 were made for a timing cause the evidence does not show. The largest of them, a synchronous sign-out request made before the page draws, is a design cost that no evidence supports, so it should be withdrawn. build-slice-2-8#2 is met: the test file no longer trips egress rule E-2. The build's journal now quotes 'SHA-256' and trips E-2 itself. build-slice-2-5#1 stays open because R-4.17 is unverified. Approval is also barred by the open missing-test items for R-4.1 and R-4.2. What would change the ruling: after the adapter is rebound as asked, a verify of this slice in which every claimed criterion passes or is truly untestable here. If a rebound adapter still reads empty values from screens it could not walk signed in, the sandbox password gap goes to the pipeline owner as an escalation.

**Conditions:**
- addressed-to bind-adapter: The surface's signOut() (tests/adapters/new/index.ts:424) clears cookies and opens '/'. It never signs the person out through the service, and it leaves the app's local storage, which holds the bearer tokens, in place. So R-4.17's signedOutMessage reads the home page and gets '' (verify of build-slice-2-11: 'Received: ""'). Bind signing out as the criterion's 'when they sign out': open /sign-out, or use the header's sign-out control, and read the user-sign-out screen there. Reset the browser to nobody signed in by clearing local storage and session storage as well as cookies.
- addressed-to bind-adapter: signIn() starts with the same signOut(). Because the tokens stay in local storage, the following visit to /sign-in lands a signed-in person on /dashboard, and the run reports 'the sign-in screen at http://localhost:4300/dashboard offers no "Sign in as a vendor" control' (R-6.20), and R-4.23 fails the same way. Start every sign-in from a browser holding no cookies and no local or session storage for the target.
- addressed-to bind-adapter: userProfileSelf.statusBadge (and the other valueAfter reads on the own-profile screen) expects a line that says exactly 'Status' with the value on the next line. The target draws 'Status: Active' on one line, with the value in an element carrying data-testid profile-status-badge (app/frontend/src/screens/user-profile.tsx:149). So R-4.1 read '' against /active/i. Bind these observations to what the signed-in screen draws, and walk that screen signed in when binding them.
- Withdraw the synchronous sign-out request made before the first draw, and any other part of decision record 0018 that exists only to answer read timing. The adapter code shows the R-4.17 failure came from its signOut() never opening /sign-out, not from timing. Keep the single request that ends both the service's session and the identity provider's (R-4.17), and amend 0018 so that it gives only the reasons that still hold.
- Do not quote ticket-shaped strings in the build's journal or proposal page. This revision's journal quotes 'SHA-256' and fails egress rule E-2.
- condition-met build-slice-2-8#2: the ticket-shaped test name in app/backend/tests/sign-in-flow.test.ts was reworded, and the egress check no longer flags that file.
