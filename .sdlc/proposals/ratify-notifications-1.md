---
gate: G1
question: "Which of the notifications criteria that are still inferred or open become the contract?"
recommendation: "7 criterion(s) in notifications are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them."
opened: 2026-09-07T05:01:47.201Z
---

# Which of the notifications criteria that are still inferred or open become the contract?

**Recommendation.** 7 criterion(s) in notifications are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

7 criterion(s) in the **notifications** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-notifications-11 · v1 · inferred · recovered

A newly created account has new-opportunity notifications off until its holder asks for them.

- reconciliation: implemented-only
- given: a person signing in to the service for the first time
- when: their account is created
- then: it records no request for new-opportunity notices, and none is sent to them until they ask
- cites: src/back-end/lib/routers/auth.ts:478
- cites: src/shared/lib/resources/user.ts:56
- cites: src/migrations/tasks/20191203143238_alter_columns.ts:14
- note: the record holds the moment the request was made rather than a yes or no, so an account that has never asked and an account that has asked and then changed its mind are indistinguishable afterwards. Combined with the profile-completion page never being shown to a public sector employee, this means such a person is never offered the choice at the point where it is first offered and receives no new-opportunity notices unless they later find the setting themselves.

### D-notifications-12 · v1 · inferred · recovered

A signed-in person can turn new-opportunity notices on and off from the list of opportunities itself, without opening their settings.

- reconciliation: implemented-only
- given: a signed-in person browsing the list of opportunities with notices turned off
- when: they choose to be notified about new opportunities
- then: the control changes to offer the opposite choice, their account records the request, and the change takes effect for the next opportunity published
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:503
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:886
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:894
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:997
- note: the control is offered without a confirmation in either direction here, whereas the same choice made from the notification settings asks the person to confirm before turning notices off.
- note: it sits at the top of the first group of opportunities on the page, which is the unpublished group for a person who has unpublished opportunities and the open group for everybody else, so it appears exactly once wherever the reader is looking first.

### D-notifications-13 · v1 · inferred · recovered

The notification control on the list of opportunities is not shown on a narrow screen.

- reconciliation: defect
- given: a signed-in person browsing the list of opportunities on a phone
- when: they look for the control that turns new-opportunity notices on
- then: no such control appears anywhere on the page, and the only route to the choice is the notification settings on their own profile
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:877
- note: the control is hidden below the medium breakpoint and shown above it. The choice itself remains reachable from the notification settings, so nothing is unreachable, but the shortcut is silently absent rather than moved. No corrected criterion is offered; whether the new service shows this control at every width is a design decision rather than a recovered rule.

### D-notifications-15 · v1 · inferred · recovered

An administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms.

- reconciliation: implemented-only
- given: an administrator on the page holding the service's terms and conditions, and a mix of active and deactivated vendors who had all accepted the previous terms
- when: the administrator chooses to notify vendors and confirms
- then: every vendor's acceptance is withdrawn and each active vendor receives a message naming the change and offering a link to read and accept the new terms
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:114
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:555
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:619
- cites: src/back-end/lib/resources/email-notifications.ts:52
- cites: src/back-end/lib/resources/email-notifications.ts:76
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:11
- cites: src/back-end/lib/permissions.ts:1646
- note: the announcement is offered only on the terms and conditions page and nowhere else, and only to an administrator; the same request made by anybody else, signed in or not, is refused. Acceptance is withdrawn for every vendor including deactivated ones, while only active vendors are told, so a vendor deactivated at the time of the change learns of it only on returning. This route appears in no published interface description.

### D-notifications-17 · v1 · inferred · recovered

An announcement of changed terms is reported as successful as soon as the acceptances are withdrawn, before any message has been sent.

- reconciliation: implemented-only
- given: an administrator announcing changed terms to a large body of vendors
- when: they confirm
- then: they are told at once that vendors have been notified, while the messages are still being sent one at a time in the background, and nothing later tells them whether every message was sent
- cites: src/back-end/lib/resources/email-notifications.ts:76
- cites: src/back-end/lib/resources/email-notifications.ts:80
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:16
- note: the withdrawal of acceptances is completed before the response, so the part of the action a vendor will notice on their next visit is reliable; only the messages are not. Delivery failures are invisible for the reason given in R-6.2, so a run that reaches nobody looks exactly like one that reaches everybody.

### D-notifications-20 · v1 · inferred · recovered

The message telling a vendor that an opportunity they proposed on has been awarded to somebody else names the organization that won it.

- reconciliation: implemented-only
- given: three vendors who submitted proposals to one opportunity, one of which has just been awarded
- when: the decision is sent to the two who were not chosen
- then: each is told the opportunity was awarded, is shown the name of the organization it was awarded to, and is offered a way to sign in and see their own score
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:277
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:281
- cites: src/back-end/lib/mailer/notifications/proposal/sprint-with-us.tsx:287
- cites: src/back-end/lib/mailer/notifications/proposal/team-with-us.tsx:287
- cites: src/back-end/lib/mailer/templates.tsx:499
- note: this message uses a layout of its own rather than the layout every other message uses, leading with the opportunity's title and the winner's name. Where no successful proponent is recorded the name is replaced by a dash rather than the sentence being omitted, so a reader can be shown "awarded to —".

### D-notifications-21 · v1 · open · recovered

What happens when the service tries to notify an account that has no email address cannot be determined from the code.

- reconciliation: implemented-only
- given: a vendor whose account holds no email address, because the identity provider supplied none
- when: an administrator announces changed terms
- then: the service composes a message for that account addressed to nobody and hands it on to be sent, and what follows depends on the sending machinery rather than on anything the service decides
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:32
- cites: src/back-end/lib/mailer/notifications/user.tsx:72
- cites: src/shared/lib/resources/user.ts:53
- cites: src/back-end/lib/mailer/transport.ts:26
- note: accounts without an email address are allowed deliberately, and most messages guard against one only by substituting an empty list of recipients where the address would go — the message is still composed and still handed over to be sent. Whether that produces a rejected send, a silently discarded one, or an error that stops the rest of a broadcast is not decidable from the source, and because delivery failures are only logged, nothing inside the service would show which. The one place that does check is account creation, which skips the welcome message when there is no address. A human should rule on whether the new service must skip a recipient with no address everywhere, and on whether one such recipient may stop a broadcast to the rest.
- note: Must the service skip a recipient that holds no email address rather than composing a message addressed to nobody, and must a broadcast to many vendors always continue past such a recipient rather than being able to stop the run on one?

**This criterion has already been answered once, with `contract` or `spike`.** Neither one
moves it toward the contract, so answering the same way again would leave it exactly where it
is: already answered once: confirm, edit, obsolete or defect it.

## Ratification conditions

One condition per line, and exactly one of these forms:

- `contract <ID>` — leave as recovered. It does not promote the criterion — `confirm`, `edit` and
  `defect` all do — so this is a no-op on anything still `inferred` or `open`. No text after the ID.
- `confirm <ID>` — the evidence now supports raising its confidence to `confirmed`. No text after the ID.
- `edit <ID>: <new statement>` — the behaviour is right, the wording is not; confidence rises to
  `confirmed` too, since the deliberate rewording is itself a second witness.
- `defect <ID>: <replacement statement>` — the old system does this and the new one should not; the row
  is kept as the record, its confidence rises to `confirmed` (it is a confirmed record of current
  behaviour, marked defect), and the replacement is filed against it.
- `spike <ID>: <question>` — not yet decided; confidence drops to `open` and the question is recorded.
- `obsolete <ID>: <why>` or `drop <ID>: <why>` — not to be carried forward at all.

The ID is the criterion's own id exactly as the domain file spells it. `contract` and `confirm`
take no text; every other verb requires a colon and text on the same line. A condition may not
span more than one line.

