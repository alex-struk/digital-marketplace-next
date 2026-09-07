---
stage: "ratify"
title: "ratify"
at: "2026-09-07T04:16:50.307Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify users: 34 accepted, 0 still open, 2 obsolete, 0 replacement(s) added.
Obsolete:
- D-users-29 — These routes are gated on NODE_ENV being exactly 'development' rather than on being outside production as the recovered statement has it, but either way they are test-only entrances of precisely the kind constitution article J3 forbids. The rebuilt system carries no route that establishes a session without the identity provider; tests sign in through the sandbox identity provider, which is also what makes D-users-7 testable at all, since the old routes bypass the account-status check.
- D-users-32 — The facility does not exist. SERVICE_TOKEN_HASH appears exactly twice in the whole of the old repository - its definition at src/back-end/config.ts:82 and its README row at README.md:279 - and no route, handler or middleware refers to it. The criterion records that the old repository's documentation is stale rather than a behaviour the rebuilt system must exhibit, and a shared token overriding user accounts and sessions would be a test-only entrance forbidden by J3 in any case, so it is carried forward in neither direction.
Unknown conditions (reported, not applied):
- confirm D-users-2
- confirm D-users-7
- confirm D-users-8
- defect D-users-14: A person's profile details - name, email address, job title and picture - may be changed only by that person. An administrator viewing somebody else's profile is offered no editing control, and the service refuses a profile change submitted against an account that is not the requester's own; an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights.
- defect D-users-20: The control to reactivate an account is offered only for an account that an administrator deactivated. An account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again, and the service continues to refuse a reactivation request made against such an account.
- defect D-users-21: A person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions; the message telling a person they reactivated the account themselves is sent only when they did so by signing in again.
- defect D-users-25: The list of everyone registered with the service may be read only by an administrator. The same request made by a public sector employee who is not an administrator, or by anyone else, is refused rather than answered, so the email address and account status of every registered person are never disclosed more widely than the interface offers them.