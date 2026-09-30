# 0016 · Slice 2 carries a read-only own profile, and checkboxes take their own clicks

- Status: accepted for the build (slice 2, second revision after the G3 return)
- Date: 2026-09-30

## What happened

Slice 2 came back a second time with R-4.1, R-4.2, R-4.3, R-4.17, R-4.22 and R-4.24 open.
Two causes, neither of them the sign-in flow that decision record 0015 rebuilt.

1. **The account could only be read at an address the app did not answer.** R-4.1 and R-4.17
   failed on "Page not found", and R-4.2 and R-4.22 on an empty reading. The contract's way to
   read one's own account is `user-profile-self` at `/users/me` (surface.yaml). It is also the
   obvious page that needs signing in, which R-4.17 ("the pages that require signing in send
   them back to sign in") and R-4.22 ("when sign-in was started from a page that requires
   signing in") turn on. The plan gives that screen to slice 3, so slice 2 answered it with the
   missing page.
2. **The design system's checkbox could not be ticked by a click on its own input.**
   react-aria hides the real `<input>` in a one-pixel clipped span. A pointer aimed at the input
   lands on the drawn box (`<div class="checkbox">`), which does not pass it on. So R-4.3's terms
   box and R-4.24's notices box could not be ticked that way.

## Decision

**`/users/me` and `/users/:userId` are answered in slice 2, read-only, for the signed-in
person's own account** (`app/frontend/src/screens/user-profile.tsx`). They are built from the
`user-profile-self` stories:

- the section navigation for the account's kind (`profile-tab-*`)
- the account type, status, identifier and details
- the permissions label for a public sector employee
- the notifications section, with the address and the new-opportunities checkbox shown as it
  stands (read-only)
- the legal section, with when the terms were agreed (`legal-accepted-on`) and the policy and
  program links

A visitor is sent to sign in and brought back. The sign-in screen then shows the
`sign-in-required` notice whenever it carries a return address. `/users/:userId` for anyone
else's identifier shows the missing page. The account is the one `GET /api/sessions/current`
answered, so the backend is unchanged.

One departure from the stories: the status badge is on every own profile, not only an
administrator's. It is what makes R-4.1's "an active ... account" readable, and it is a read-only
fact already on the other profile stories.

What slice 3 still owns, and this does not build: editing (`profile-edit-button`), the picture,
the capabilities and organizations sections (asking for them shows the profile section),
changing the notice choice and the unsubscribe question, deactivation, and `GET /api/users/{id}`.
What slice 4 still owns: an administrator's view of somebody else's profile. Slice 3 replaces
this screen rather than working around it.

**Every design-system checkbox lays its input over the whole control** (`app/frontend/src/styles.css`).
The input covers the control and is transparent, so it takes every click, on the box or on the
words, and is still what a keyboard and a screen reader reach. The look does not change. This is
done in the stylesheet, once, so every later slice's checkboxes (capabilities, watch, evaluator
marks) behave the same way.

## What would reverse it

- A ruling that slice 2's criteria are to be read somewhere other than `/users/me`. The screen
  would then wait for slice 3.
- A design-system release whose checkbox exposes its input to the pointer. The stylesheet rule
  would then be removed.
