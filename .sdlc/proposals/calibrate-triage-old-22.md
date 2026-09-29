---
gate: G3
question: "1 criterion(s) fail against old, and 2 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?"
recommendation: "Sort R-2.22, R-3.9, R-4.24 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T04:03:43.684Z
---

# 1 criterion(s) fail against old, and 2 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?

**Recommendation.** Sort R-2.22, R-3.9, R-4.24 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
2 criterion(s) are unbound on the **old** target after bind-adapter was sent them as often as `policy.loops.rebind` allows.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-2.22 · v1

Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.

- given: a submitted Sprint With Us or Team With Us proposal
- when: the vendor edits it and names a different organization
- then: the edit is refused with "Organization cannot be changed once the proposal has been submitted", while the same edit on a draft or withdrawn proposal is accepted
- test: tests/acceptance/proposals/R-2.22.spec.ts

**Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn. (changing a submitted Team With Us proposal's organization is refused, and it keeps the organization it was submitted for)** — failed

```
Error: proposal-twu-edit.save_changes — "Submit Changes" is disabled on http://localhost:3101/opportunities/team-with-us/0a021ede-e005-4fc9-85e4-c848d18a04c2/proposals/236a981c-b818-4e57-b6f1-f47de57a98e1/edit?tab=proposal; the page shows no message
```

**Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn. (a withdrawn Team With Us proposal may be moved to another organization)** — failed

```
Error: proposal-twu-edit.save_changes — "Save Changes" is disabled on http://localhost:3101/opportunities/team-with-us/298deee1-fb70-487d-bdf1-fbf1d1b1ab55/proposals/dc8de127-a72d-4b33-b23e-982f663531c7/edit; the page shows no message
```

**Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn. (changing a submitted Sprint With Us proposal's organization is refused, and it keeps the organization it was submitted for)** — failed

```
Error: proposal-swu-edit.add_phase_team_member — refused: the member dialog does not offer "Blake Placeholder" on http://localhost:3101/opportunities/sprint-with-us/e460959f-9a84-4655-874e-0e4eed84d8ad/proposals/71439e7c-7a91-41b9-ae54-e2030adf8ce5/edit?tab=proposal (it shows: Add Team Member(s) | Select the team member(s) that you want to propose to be part of your team for this opportunity. If you do not see the team member that you want to add, you must send them a request to join your organization. | Charlie Placeholder | Dana Placeholder | Add Team Member(s) | Cancel)
```

**Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn. (a withdrawn Sprint With Us proposal may be moved to another organization)** — failed

```
Error: proposal-swu-edit.add_phase_team_member — refused: the member dialog does not offer "Blake Placeholder" on http://localhost:3101/opportunities/sprint-with-us/5b20177f-5b18-46c8-9146-4d1a17eefddd/proposals/2f9a2800-3ed7-40b2-8701-ad802a92db63/edit (it shows: Add Team Member(s) | Select the team member(s) that you want to propose to be part of your team for this opportunity. If you do not see the team member that you want to add, you must send them a request to join your organization. | Charlie Placeholder | Dana Placeholder | Add Team Member(s) | Cancel)
```

**Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn. (a draft Sprint With Us proposal may be moved to another organization)** — failed

```
Error: proposal-swu-edit.add_phase_team_member — refused: the member dialog does not offer "Blake Placeholder" on http://localhost:3101/opportunities/sprint-with-us/81e4cf05-4cfb-492f-9de9-26d47fadb80f/proposals/0af802ce-605f-4ab9-bc0e-9a72fcdcbca0/edit (it shows: Add Team Member(s) | Select the team member(s) that you want to propose to be part of your team for this opportunity. If you do not see the team member that you want to add, you must send them a request to join your organization. | Charlie Placeholder | Dana Placeholder | Add Team Member(s) | Cancel)
```

## Unbound after binding

Every failing test of each criterion below ended in the adapter's own `unbound:` error, quoted as it said it, and
bind-adapter was sent each 2 times without binding it. Answer `adapter-wrong` where the
application does offer what the test needs — under another label, behind a step, as another persona —
and the binding run goes back for it. Answer `oracle-cannot` only where the oracle genuinely cannot be
driven into, or observed in, the state the test needs without changing its code: behind an external
identity provider, reachable only through a link the application emails, enforced only by a
browser-native dialog. It is never a way to skip binding work. Answer `product-question` where the
criterion itself looks suspect.

### R-3.9 · v1

A pending invitation becomes an active membership only when the invited person accepts it, or when an administrator accepts it on their behalf; nobody else can accept it and an invitation that is not pending cannot be accepted.

- given: a person with a pending invitation to an organization
- when: the organization's owner tries to accept it on their behalf, and then the invited person accepts it themselves
- then: the owner's attempt is refused, the invited person's acceptance makes the membership active, and a further attempt to accept the now-active membership is refused as not pending
- test: tests/acceptance/organizations/R-3.9.spec.ts

**a pending invitation becomes an active membership when an administrator accepts it on the invited person's behalf** — failed

```
Error: unbound: organization-user-memberships.approve_invitation — looked on http://localhost:3101/users/00000000-0000-4000-8000-000000000217?tab=organizations for a pending row for "Northern Pines Digital Ltd." showing "Approve" when pointed at (0 such rows), then opened the invitation's own address for affiliation 00000000-0000-4000-8000-000000000413 and no "Approve Request?" confirmation opened on http://localhost:3101/users/me?tab=organizations&invitationAffiliationId=00000000-0000-4000-8000-000000000413&invitationResponse=approve; the signed-in person has no unanswered invitation there
```

### R-4.24 · v1

While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.

- given: a vendor completing their profile
- when: they tick the box offering notice of new opportunities and complete the profile
- then: their account records that notifications are on, with the moment the choice was made
- test: tests/acceptance/users/R-4.24.spec.ts

**While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.** — failed

```
Error: unbound: user-sign-up-complete.toggle_new_opportunity_notifications — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.

