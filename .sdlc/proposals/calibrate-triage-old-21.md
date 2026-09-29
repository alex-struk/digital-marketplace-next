---
gate: G3
question: "4 criterion(s) fail against old, and 1 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?"
recommendation: "Sort R-6.2, R-8.12, R-1.16, R-4.23, R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T02:07:38.148Z
---

# 4 criterion(s) fail against old, and 1 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?

**Recommendation.** Sort R-6.2, R-8.12, R-1.16, R-4.23, R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

4 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
1 criterion(s) are unbound on the **old** target after bind-adapter was sent them as often as `policy.loops.rebind` allows.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-6.2 · v1

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.

- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- test: tests/acceptance/notifications/R-6.2.spec.ts

**When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.** — failed

```
Error: only the invitation is in the catcher

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m1[39m
Received: [31m4[39m
```

### R-8.12 · v1

A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.

- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- test: tests/acceptance/files/R-8.12.spec.ts

**a request for a file the requester may not read is answered as not authorized** — failed

```
Error: the upload of "not-shared.txt" was not stored: refused for its read-access statement: 503 {"database":["Database error."]}; refused for the length of its name: 503 {"database":["Database error."]}; refused for its size: 503 {"database":["Database error."]}; answered with a fault of the service: 503 {"database":["Database error."]}
```

### R-1.16 · v1

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- test: tests/acceptance/opportunities/R-1.16.spec.ts

**A Sprint With Us opportunity may only have an inception phase if it also has a prototype phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/prototype/i[39m
Received string:  [31m"5. Phases is incomplete"[39m
```

### R-4.23 · v2

The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.

- given: a public sector employee signing in for the first time, and a vendor who has already agreed to the terms once
- when: each is sent to the profile-completion page
- then: both are moved straight on to their dashboard without being asked to confirm anything
- test: tests/acceptance/users/R-4.23.spec.ts

**the profile-completion page is offered to a vendor who has not yet agreed to the terms** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

## Unbound after binding

Every failing test of each criterion below ended in the adapter's own `unbound:` error, quoted as it said it, and
bind-adapter was sent it 4 times without binding it. Answer `adapter-wrong` where the
application does offer what the test needs — under another label, behind a step, as another persona —
and the binding run goes back for it. Answer `oracle-cannot` only where the oracle genuinely cannot be
driven into, or observed in, the state the test needs without changing its code: behind an external
identity provider, reachable only through a link the application emails, enforced only by a
browser-native dialog. It is never a way to skip binding work. Answer `product-question` where the
criterion itself looks suspect.

### R-2.19 · v2

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — failed

```
Error: unbound: proposal-swu-create.add_phase_team_member — reached the Team step with an organization chosen, but no "Add Team Member(s)" is on it at http://localhost:3100/opportunities/sprint-with-us/7aa9008a-0ade-434d-b8a8-11f3654c6d70/proposals/create
```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — failed

```
Error: unbound: proposal-swu-create.add_phase_team_member — reached the Team step with an organization chosen, but no "Add Team Member(s)" is on it at http://localhost:3100/opportunities/sprint-with-us/58071890-b44f-42ab-b238-07ef7fa3a567/proposals/create
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — failed

```
Error: unbound: proposal-swu-create.add_phase_team_member — reached the Team step with an organization chosen, but no "Add Team Member(s)" is on it at http://localhost:3100/opportunities/sprint-with-us/582fab8c-2f7d-49a4-88f0-271f842f1825/proposals/create
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — failed

```
Error: unbound: proposal-swu-create.add_phase_team_member — reached the Team step with an organization chosen, but no "Add Team Member(s)" is on it at http://localhost:3100/opportunities/sprint-with-us/c4cd3365-adca-4d1f-80a5-5acca71cb06e/proposals/create
```

**a Sprint With Us proposal must stay within each phase's budget** — failed

```
Error: unbound: proposal-swu-create.add_phase_team_member — reached the Team step with an organization chosen, but no "Add Team Member(s)" is on it at http://localhost:3100/opportunities/sprint-with-us/4f0c0413-2302-4b4b-b038-805aaff4df08/proposals/create
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


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is which of the five criteria failing or unbound on the old target were caused by this project's adapter. Ruling: approve, with one triage condition per criterion. R-6.2: the adapter's message_count reports the catcher's own total, read from the same per-worker catcher the test cleared, so 4 messages against 1 invitation is about what the application sent, not how it was read. That makes it a product question. R-8.12: the adapter sent a well-formed multipart upload with the empty read-access list the files suite uses, and the service itself answered 503 Database error. Nothing there points at the binding. R-1.16: field_error walked every wizard step and found no message text, only that the Phases step was refused. Whether the target states the prototype rule at all is for the product owner. R-4.23: the adapter saw the page redirect the vendor away from /sign-up/complete. The test produces 'not yet agreed' by announcing changed terms, which the target does not treat as never having agreed. That is a question about the test or criterion, not the binding. R-2.19: the old application does let a vendor add team members to each Sprint With Us phase, which is its core proposal flow. The binding reached the Team step with an organization chosen and still reported the control missing, so the adapter is at fault; none of the oracle-cannot states applies. What would change this: evidence that the R-6.2 catcher was shared across workers would make R-6.2 adapter-wrong, and a screenshot of the R-2.19 Team step with no adder anywhere after every phase section is expanded would make R-2.19 a product question.

**Conditions:**
- product-question R-6.2
- product-question R-8.12
- product-question R-1.16
- product-question R-4.23
- adapter-wrong R-2.19: proposal-swu-create.add_phase_team_member reached the Team step with an organization chosen and looked only for an exactly-matching visible "Add Team Member(s)" text node, then threw unbound. It never expanded each phase's collapsible section (Inception / Prototype / Implementation) before looking, and never looked for the adder by role or partial label (a link or button containing 'Add Team Member') within each phase's block. Expand every phase section first, find the adder within the phase being asked about, and only report it unbound once every phase section is open and it is still absent.
