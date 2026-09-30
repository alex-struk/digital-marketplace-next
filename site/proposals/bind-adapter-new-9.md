| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T20:03:41.028Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made the one change the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for. `signOut()` no longer clears anything.

**What changed.** In `tests/adapters/new/index.ts`, `signOut()` still signs out the way a person does. It clicks the "Sign out" link in the header's navigation, or opens `/sign-out` if that link isn't on screen. It then waits for the sign-out screen ("Signed Out" / "You have successfully signed out") and stops. I removed the two calls that came after that wait: the one clearing every cookie, including the identity provider's, and the one clearing the target's local and session storage. The browser now stays signed out only if the service really ended the session. So R-4.17's last check (`userProfileSelf.open()`, then `signInRequired()` truthy) can fail again if the service does not end the session.

**What stays as it was.** The full reset in `forgetEveryone()` is unchanged: it clears all cookies and the target's local and session storage, then reloads on `/`. It still runs at the start of `signIn()` and for the anonymous persona. The helper that clears storage is still used there, so nothing is left unused. I rewrote the comment above `signOut()` to say it clears nothing and why. In `bindings.yaml`, the comment above `user-sign-out` now says `signOut()` takes the link (or opens `/sign-out`), waits for the screen and stops, with no clearing of its own. No binding status changed; both `user-sign-out` observations are still `bound`.

**Not done.**
- I did not re-walk the target in a browser or rebind anything else, as the revision instructions said.
- I could not rerun the typecheck: this session was not permitted to run `tsc`. The edit only deletes two statements and changes comments, so I don't expect it to break the typecheck, but it has not been confirmed.

**Left open.** The build conditions `build-slice-2-5#1`, `build-slice-2-11#4` and `build-slice-2-11#5` cannot be settled by an adapter proposal and are still open. The egress failure recorded in `.sdlc/conditions.yaml` is also outside this stage's territory. I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else, and does it carry out bind-adapter-new-8#1? Ruling: approve. On the branch, surface.signOut() in tests/adapters/new/index.ts takes the header's 'Sign out' link (or opens /sign-out), waits on ready() and stops. The only clearCookies() and clearStorage() calls left are inside forgetEveryone(), which runs at the start of signIn() and for the anonymous persona. So R-4.17's final check (userProfileSelf.open() then signInRequired()) again depends on the service actually ending the session, which is what the earlier ruling asked for. The comments above signOut() and above user-sign-out in bindings.yaml describe this. Nothing under tests/acceptance changed, and the runner's typecheck on this revision passed with no diagnostics under adapters/new/. The profile rebinding carried over from the earlier revision (labelledValue, profileField) only locates and reads values: it asserts nothing and decides no outcome. job_title_field is bound although the page draws no Job Title box. The locator is real, and an absent field will show as a test failure against the application rather than being hidden, so I accept it. The egress failure at .sdlc/conditions.yaml:1121 is on main and outside this proposal. The build conditions build-slice-2-5#1, build-slice-2-11#4 and build-slice-2-11#5 are build's and stay open. What would change the ruling: a verify run showing signOut() does not reach the user-sign-out screen, or evidence that the profile shows Job Title under another label.

**Conditions:**
- condition-met bind-adapter-new-8#1: signOut() in tests/adapters/new/index.ts now takes the header's Sign out link or opens /sign-out, waits on ready() and stops, with no clearCookies() or clearStorage() of its own. The full reset stays in forgetEveryone(), called at the start of signIn() and for the anonymous persona. The comments above signOut() and above user-sign-out in tests/adapters/new/bindings.yaml say so.

### Runner-owned typecheck evidence

Proposal revision: `db88a221b455b7b49be840de289347bd8ba9bacb`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
