---
stage: "build"
title: "build slice 2"
at: "2026-09-30T16:55:22.921Z"
cost: 3.453713
turns: 81
session: "74933a73-e58b-434e-8e1f-14659c9b8efd"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've fixed the two causes behind the six returned criteria, but I couldn't run the application in a browser here, so none of the six has been seen passing yet. Starting Docker needed an approval this unattended session can't get. `npm --prefix app run check` passes (typechecks plus 294 unit tests), and the frontend production build succeeds.

**What was wrong.** The sign-in flow rebuilt last time (decision record 0015) was not the problem this time. Two separate things were:

- **`/users/me` didn't exist.** The contract's place to read your own account is `/users/me`, and it is also the natural example of "a page that requires signing in". The plan gives that screen to slice 3, so this app showed its missing page there. That fits R-4.1 and R-4.17 failing on "Page not found". R-4.2 and R-4.22 read back empty; I'm inferring they read the same page, because the ruling doesn't say which page they read.
- **The checkboxes couldn't be clicked on their real input.** The design system's Checkbox tucks the real `<input>` into a one-pixel hidden box, so a click aimed at the input landed on the drawn square instead. That matches the R-4.3 and R-4.24 timeouts: the terms box and the new-opportunity notices box couldn't be ticked.

**What I changed.**

- **New read-only own profile** (`app/frontend/src/screens/user-profile.tsx`), served at `/users/me` and at `/users/:userId` when the identifier is your own. Anyone else's identifier shows the missing page. It is built from the `user-profile-self` design stories and shows:
  - the section tabs for the account's kind;
  - account type, status, identifier, and the read-only sign-in username, name, email and job title;
  - the administrator-permissions label for public sector employees;
  - a notifications section with the address and the new-opportunities checkbox as it stands;
  - a legal section showing when the terms were agreed (a new `readMoment` date formatter) and the policy and program links.

  It uses the account `/api/sessions/current` already returns, so the backend is unchanged. One departure from the stories: the status badge appears on every own profile, not only an administrator's, so that R-4.1's "active account" can be read.
- **Sign-in notice.** A visitor opening a page that needs sign-in (including `/users/me`, which R-4.17 relies on) is sent to sign in. The sign-in screen now shows the `sign-in-required` notice whenever it carries a return address. The header gains a "My profile" link.
- **Checkbox fix** (`app/frontend/src/styles.css`). Every design-system checkbox now lays its real input transparently over the whole control, so a click on the box or the words ticks it. Keyboard and screen-reader behaviour and the look are unchanged, and later slices' checkboxes get the same fix.

New unit tests cover: a visitor at `/users/me` being sent to sign in with the notice; the fields shown for a public sector account; your own identifier versus somebody else's; the notices checkbox reflecting the saved choice; the agreed-on date wording; a section the account isn't offered falling back to the profile; and accessibility scans of the three new views. Decision record `docs/decisions/0016` explains all of this.

**Owed condition `build-slice-2-5#1` (R-4.17).** Sign-out itself was unchanged by this revision. It tells the service first, then ends the identity provider's session, and only then says "signed out"; if the service can't be told, it shows the failure message. The realm's client allows `http://localhost:4300` as a web origin and post-logout address, which that step needs. The failure the latest ruling reported was the missing `/users/me`, which now sends a signed-out person to sign in. I believe the condition is met, but it has only been re-verified in unit tests, not against the running stack.

**What I could not do or check:**
- The six criteria were never exercised in a real browser against the real identity provider.
- The checkbox fix was checked against how react-aria builds the control, not tried in a browser.
- The profile is deliberately partial. Editing, the picture, the capabilities and organizations sections (asking for them shows the profile section), changing the notice choice and the unsubscribe question, deactivation and `GET /api/users/{id}` remain slice 3's. An administrator's view of someone else's profile remains slice 4's. Slice 3 should replace this screen rather than build around it.
- A vendor who hasn't finished signing up is still sent to `/sign-up/complete` from every other screen, as the personas contract says. So a first-time vendor who began sign-in from `/users/me` ends up on the completion page, not back on `/users/me`. That departs from R-4.22's note; I kept the personas contract's behaviour and didn't change it.

Nothing outside `app/` and `docs/decisions/` was touched. The dependencies I installed to run the check and the build output were removed afterwards.