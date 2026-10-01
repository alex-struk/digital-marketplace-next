# 0023 · The profile in slice 3: who reads it, how one's own is kept, and leaving and coming back

- Status: accepted for the build (slice 3); replaces the read-only profile of 0016
- Date: 2026-09-30

## Decision

**Reading an account.** `GET /api/users/{id}` answers the person themselves and an
administrator; anyone else, a visitor included, is refused 401 (R-4.25). An administrator asking
for an identifier no account carries is told 404. The screen asks only when the viewer is an
administrator; anyone else opening somebody else's profile is shown the missing page without a
request being made.

**What the profile shows.** `profileSections` in `app/backend/src/rules/users.ts` is the one
rule both sides use: a vendor's own profile lists profile, capabilities, organizations,
notifications and legal; a public sector employee's or administrator's own lists profile and
notifications; an administrator on somebody else's sees the profile section alone, with no
section navigation and no editing control (R-4.18, R-4.33, R-4.34). A section the profile does
not offer shows the profile section. The status badge stays on one's own profile, as 0016 put
it there for R-4.1. The organizations section says only that organizations will be listed
there; slices 11 and 12 fill it.

An administrator on somebody else's profile is shown what R-4.18 says their powers are, where
the `user-profile` default story draws them: a Permissions section with the Administrator box,
and an Account status section offering Deactivate for an active account, Reactivate for one an
administrator deactivated, and for one its owner deactivated only the statement that they come
back by signing in. What those controls do is slice 4's (R-4.12, R-4.19, R-4.30), so until then
they are drawn disabled, each saying it is not available yet; slice 4 enables them.

Whose profile it is — name, a public sector employee's job title, and email address — is also
written as a line of text above the account facts. The details are otherwise held only in
read-only fields, whose values are no part of the page's text. The edit form caps no field's
length. A name or job title over one hundred characters is kept as typed and reported by the
same rule the service applies, rather than being cut short by the browser and saved (R-4.27).

The new-opportunity box saves as soon as it is pressed, in either direction, and shows the
change at once; it goes back, with an alert, only if the service refuses. R-4.29 lets a person
turn the notice on or off at any time from their profile, and asks for confirmation only on
arrival from a message's unsubscribe link; there the box changes only once Unsubscribe is
pressed (R-4.29, R-6.6, R-6.7). This departs from design/DESIGN.md, which has the question asked
from the checkbox too: asking there left the box ticked after a person unticked it, which is
not what the criterion says. Waiting for the service's answer before showing the change left a
box that, read straight after pressing, did not yet show it.

**Keeping one's own.** Every change is `PUT /api/users/{id}` with a tag, for one's own account
only; any change submitted against somebody else's is refused 403, an administrator's included
(R-4.18). `updateProfile` takes `avatarImageFile`, which must name a stored file the person may
read, and is refused with the same unexplained "Your profile could not be saved." as a duplicate
email address (R-4.6). `updateCapabilities` takes a list drawn from the service's nine
capabilities — the names the seed and the old data use — and is a vendor's only (R-4.8). The
capability descriptions are the rebuild's own wording; the specification does not carry the
old ones.

The picture is uploaded to `/api/avatars` when the form is saved, then named in
`updateProfile`. The same picker is used on the profile-completion page, which slice 2 had left
with a picker that stored nothing.

**Leaving and coming back.** `DELETE /api/users/{id}` on one's own account marks it
`INACTIVE_USER` with the date and the person as the one who did it, keeps everything else, and
sends the deactivation message (R-4.9). The session the request was made in ends there and
then, at the service and at the identity provider, exactly as signing out ends it
(`SessionEnding`, shared with `DELETE /api/sessions/current`); the answer says whether the
identity provider's session ended, and the page ends it itself when it did not, then shows
`/notice/deactivatedOwnAccount`. The next sign-in — at `/auth/callback` or the first
`GET /api/sessions/current` with a new token — makes the account active again and sends the
reactivation message (R-4.5); the date it was deactivated is kept, as the old application kept
it. An account an administrator deactivated is still refused (R-4.4).

Deactivating somebody else's account is refused here (403) until slice 4 builds it (R-4.30).

## What would reverse it

- A ruling that an ordinary person's own profile must not show its status (R-4.34's note); the
  badge would come off one's own profile, and R-4.1's check would read the status elsewhere.
- A ruling that reactivation clears the deactivation date.
