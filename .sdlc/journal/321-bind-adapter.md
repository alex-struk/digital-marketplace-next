---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T20:03:40.990Z"
cost: 0.2353136
turns: 9
session: "1c3be352-c2a0-4249-b5f8-e16a2e5e9494"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I made the one change the ruling asked for. `signOut()` no longer clears anything.

**What changed.** In `tests/adapters/new/index.ts`, `signOut()` still signs out the way a person does. It clicks the "Sign out" link in the header's navigation, or opens `/sign-out` if that link isn't on screen. It then waits for the sign-out screen ("Signed Out" / "You have successfully signed out") and stops. I removed the two calls that came after that wait: the one clearing every cookie, including the identity provider's, and the one clearing the target's local and session storage. The browser now stays signed out only if the service really ended the session. So R-4.17's last check (`userProfileSelf.open()`, then `signInRequired()` truthy) can fail again if the service does not end the session.

**What stays as it was.** The full reset in `forgetEveryone()` is unchanged: it clears all cookies and the target's local and session storage, then reloads on `/`. It still runs at the start of `signIn()` and for the anonymous persona. The helper that clears storage is still used there, so nothing is left unused. I rewrote the comment above `signOut()` to say it clears nothing and why. In `bindings.yaml`, the comment above `user-sign-out` now says `signOut()` takes the link (or opens `/sign-out`), waits for the screen and stops, with no clearing of its own. No binding status changed; both `user-sign-out` observations are still `bound`.

**Not done.**
- I did not re-walk the target in a browser or rebind anything else, as the revision instructions said.
- I could not rerun the typecheck: this session was not permitted to run `tsc`. The edit only deletes two statements and changes comments, so I don't expect it to break the typecheck, but it has not been confirmed.

**Left open.** The build conditions `build-slice-2-5#1`, `build-slice-2-11#4` and `build-slice-2-11#5` cannot be settled by an adapter proposal and are still open. The egress failure recorded in `.sdlc/conditions.yaml` is also outside this stage's territory. I changed nothing outside `tests/adapters/new/`.