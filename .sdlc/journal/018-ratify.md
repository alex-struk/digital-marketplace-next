---
stage: "ratify"
title: "ratify"
at: "2026-09-07T04:12:54.156Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify users: 21 accepted, 13 still open, 2 obsolete, 4 replacement(s) added.
Still open:
- D-users-3 (inferred) — when sign-in was started from a page that requires signing in, that page is where both land instead.
- D-users-4 (open) — every newly created account is sent to this page regardless of kind, so a public sector employee is never asked to confirm their details and never sees the notification choice offered there. Whether that is intended could not be settled from the source.
- D-users-6 (inferred) — turning notifications off does not record a date; the record simply becomes empty, so the service cannot say when somebody stopped wanting them.
- D-users-10 (inferred) — the published interface description of this route mentions no restriction at all.
- D-users-11 (inferred) — a visitor who is not signed in is sent to sign in first and returned to the profile afterwards.
- D-users-12 (inferred) — the published interface description lists the same fields but says nothing about which are required or how long they may be, and it gives this operation a different request method than the service accepts, so it cannot be followed literally.
- D-users-13 (inferred) — the service accepts a job title on any account, so a vendor's stored job title, if one ever existed, is carried through their profile edits unchanged and unseen.
- D-users-16 (inferred) — the settings page states the address notifications are sent to and tells the person to correct their profile if it is wrong; there is no separate notification address.
- D-users-18 (inferred)
- D-users-19 (inferred) — nothing prevents an administrator from deactivating the last remaining administrator account other than their own, so the service can be left with no usable administrator.
- D-users-26 (inferred) — a person's name is split into a first name and a last name at the first space, so a single-word name yields an empty last name and a three-word name puts two words in the last-name column. The account-kind column appears only when both kinds were chosen. Administrators are exported whenever public sector employees are chosen. Only organizations that are still active and memberships that are still current are named, joined into one field.
- D-users-28 (inferred) — the privacy policy is shown as text on the page and states that agreement to it was given when the account was created, so it is never separately accepted.
- D-users-30 (inferred) — asking for a section that does not belong to the profile being viewed silently shows the profile section instead of refusing. An account's status is shown only to an administrator; everyone else sees the account kind alone.
Obsolete:
- D-users-29 — These routes are gated on NODE_ENV being exactly 'development' rather than on being outside production as the recovered statement has it, but either way they are test-only entrances of precisely the kind constitution article J3 forbids. The rebuilt system carries no route that establishes a session without the identity provider; tests sign in through the sandbox identity provider, which is also what makes R-4.4 testable at all, since the old routes bypass the account-status check.
- D-users-32 — The facility does not exist. SERVICE_TOKEN_HASH appears exactly twice in the whole of the old repository - its definition at src/back-end/config.ts:82 and its README row at README.md:279 - and no route, handler or middleware refers to it. The criterion records that the old repository's documentation is stale rather than a behaviour the rebuilt system must exhibit, and a shared token overriding user accounts and sessions would be a test-only entrance forbidden by J3 in any case, so it is carried forward in neither direction.