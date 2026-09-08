---
stage: "ratify"
title: "ratify users"
at: "2026-09-08T23:47:35.555Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify users: 32 accepted, 0 still open, 4 obsolete, 0 replacement(s) added.
Obsolete:
- R-4.10 — superseded by R-4.19
- R-4.11 — superseded by R-4.20
- D-users-29 — These routes are gated on NODE_ENV being exactly 'development' rather than on being outside production as the recovered statement has it, but either way they are test-only entrances of precisely the kind constitution article J3 forbids. The rebuilt system carries no route that establishes a session without the identity provider; tests sign in through the sandbox identity provider, which is also what makes D-users-7 testable at all, since the old routes bypass the account-status check.
- D-users-32 — The facility does not exist. SERVICE_TOKEN_HASH appears exactly twice in the whole of the old repository - its definition at src/back-end/config.ts:82 and its README row at README.md:279 - and no route, handler or middleware refers to it. The criterion records that the old repository's documentation is stale rather than a behaviour the rebuilt system must exhibit, and a shared token overriding user accounts and sessions would be a test-only entrance forbidden by J3 in any case, so it is carried forward in neither direction.
Unknown conditions (reported, not applied):
- confirm D-users-2
- confirm D-users-7
- confirm D-users-8
- spike D-users-4: Should a public sector employee be asked to confirm their name, email address and job title, and be offered the new-opportunity notification choice, when their account is first created - or should they continue to be sent straight to the dashboard? The profile-completion page is where that notification choice is first offered and a public sector employee never sees it there, so answering this decides whether the page admits them or the choice moves elsewhere.
- defect D-users-14: A person's profile details - name, email address, job title and picture - may be changed only by that person. An administrator viewing somebody else's profile is offered no editing control, and the service refuses a profile change submitted against an account that is not the requester's own; an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights.
- defect D-users-20: The control to reactivate an account is offered only for an account that an administrator deactivated. An account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again, and the service continues to refuse a reactivation request made against such an account.
- defect D-users-21: A person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions; the message telling a person they reactivated the account themselves is sent only when they did so by signing in again.
- defect D-users-25: The list of everyone registered with the service may be read only by an administrator. The same request made by a public sector employee who is not an administrator, or by anyone else, is refused rather than answered, so the email address and account status of every registered person are never disclosed more widely than the interface offers them.
- confirm D-users-3
- edit D-users-4: The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.
- confirm D-users-6
- confirm D-users-10
- confirm D-users-11
- edit D-users-12: A profile requires a name of between one and one hundred characters and an email address in a valid format, which is stored in lower case; the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.
- confirm D-users-13
- confirm D-users-16
- confirm D-users-18
- edit D-users-19: A request to deactivate an account that is already inactive is refused with a message saying the account is already inactive; an administrator viewing their own profile is offered no deactivation control, but that restriction rests on the interface alone, since the service accepts a deactivation request made against the requester's own account.
- confirm D-users-26
- confirm D-users-28
- confirm D-users-30