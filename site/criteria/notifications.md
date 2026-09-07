# notifications

## Tests

| id | test |
| --- | --- |
| R-6.1 | not testable: The given is an environment with notifications switched off, read once at start-up. No page, action or observation configures the running target's notification setting, and the fixtures set no environment beyond the target URL and the mail catcher, so the condition the criterion is about cannot be established. |
| R-6.2 | not testable: The given is a service whose mail server is unreachable. Nothing in the surface or the mail fixture can stop, break or intercept delivery — `mail` can only clear the catcher and search it — so a failed send cannot be produced, and the claim that nothing in the service records the failure has nothing to be asserted against. |
| R-6.3 | not testable: Neither half is observable. The test marker is never named — the contract says only that subjects may carry one — so no assertion can tell a marked subject from an unmarked one; and the test variant of the logo lives in the message body, which the mail fixture does not expose (observables.yaml names html_body, but Mail returns only Subject, Snippet, To and ID). |
| R-6.4 | not testable: The sender and the reply-to of a message are not reachable: observables.yaml names `sender: from`, but the mail fixture returns only Subject, Snippet, To and ID and offers no way to read one message's headers. |
| R-6.5 | not testable: Comparing the plain-text form of a message with the formatted one needs both bodies. The mail fixture exposes neither html_body nor plain_text_body, only a snippet, which is a summary the catcher makes and not evidence that a plain-text part was sent at all. |
| R-6.6 | acceptance/notifications/R-6.6.spec.ts |
| R-6.7 | acceptance/notifications/R-6.7.spec.ts |
| R-6.8 | not testable: Two things are missing. The batch's recipients are blind copies and the mail fixture has no accessor for them (observables.yaml names `copied_recipients: bcc`), so neither the batch size nor the hiding can be counted; and one hundred and twenty accounts that have asked for new-opportunity notices can be produced neither by the seed nor by any surface action, since accounts arrive only through sign-in as a seeded persona. |
| R-6.9 | not testable: The claim is about the visible address line of a panel notice listing all of its recipients. `mail.messagesTo` searches by one visible address and hands back `To` as an opaque value, so the addresses of the other recipients of the same message cannot be read. |
| R-6.10 | acceptance/notifications/R-6.10.spec.ts |
| R-6.11 | not testable: Both halves turn on the notice about a watched opportunity, which is sent as a batch of blind copies. The mail fixture searches by visible recipient only, so a message that did reach a deactivated watcher would not be found, and its absence from a search would be equally consistent with it having been sent. |
| R-6.12 | not testable: The criterion is about the wording inside one message. The mail fixture exposes no message body, and the reference page's observations (message_subject, message_summary, message_body) name no way to select one message among the fifty on the page, so a containment assertion over the page as a whole would be satisfied by any message that happens to name a program. |
| R-6.13 | acceptance/notifications/R-6.13.spec.ts |
| R-6.14 | acceptance/notifications/R-6.14.spec.ts |
| R-6.15 | not testable: Requires reading, for one multi-recipient notice, both the visible recipient and the list of blind copies. The mail fixture offers neither: it searches by a single visible address and returns no blind-copy list, so hiding cannot be told from not sending. |
| R-6.16 | not testable: The claim is about what stands at the foot of a particular message — an unsubscribe offer, or a plain link to the notification settings. The mail fixture exposes no message body, and the reference page cannot be asked for one message's body, so the two endings cannot be told apart. |
| R-6.17 | acceptance/notifications/R-6.17.spec.ts |
| R-6.18 | not testable: Same missing observation as R-6.12: naming all three programs or none is a fact about the body of the changed-terms message, and no surface observation or mail accessor returns that one body. |
| R-6.19 | acceptance/notifications/R-6.19.spec.ts |
| R-6.20 | not testable: The given is an account being created for the first time. Every persona signs in as an account the seed already holds, and no surface action creates one, so the sign-up completion page cannot be reached with a first-time identity and the state of a never-before-seen account cannot be read. |
| R-6.21 | acceptance/notifications/R-6.21.spec.ts |
| R-6.22 | acceptance/notifications/R-6.22.spec.ts |
| R-6.23 | acceptance/notifications/R-6.23.spec.ts |
| R-6.24 | not testable: What distinguishes this criterion from R-6.23 is ordering — success reported before any message has been sent. Nothing in the surface reports send progress, and nothing can hold delivery, so the only available check (that the catcher is empty at the moment success appears) is a race against the background sending rather than a test of it. |
| R-6.25 | not testable: Every part of the claim — the opportunity's title and the winner's name leading the message, the em dash where no successful proponent is recorded, the offer to sign in and see one's own score — is content of the message body, which no mail accessor returns and which the reference page cannot be asked for one message at a time. |
| R-6.26 | acceptance/notifications/R-6.26.spec.ts |
| R-6.27 | not testable: The only width-aware observation is notification_control_hidden_on_narrow_screen, which is worded for the old service's behaviour. Asserting its negation is not reliable, since observations return free text with no stated yes/no vocabulary, and nothing names an observation reporting the control as offered at a narrow width or a way to ask a page to open at one. |
| R-6.28 | acceptance/notifications/R-6.28.spec.ts |

### R-6.1 · v1 · confirmed · accepted

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.
- cites: src/back-end/lib/mailer/transport.ts:54
- cites: src/back-end/config.ts:63
- cites: README.md:285
- reconciliation: implemented-only
- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- note: the switch is read once at start-up and applies to every message the service can send; there is no per-message or per-recipient exemption.

### R-6.2 · v1 · confirmed · accepted

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.
- cites: src/back-end/lib/mailer/transport.ts:34
- cites: src/back-end/lib/mailer/transport.ts:44
- cites: src/back-end/lib/mailer/transport.ts:60
- reconciliation: implemented-only
- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- note: the failure is written to the service's own operational log only. There is no queue, no retry and no reporting back to the person who triggered the action, so from every point of view inside the service a message that was never delivered is indistinguishable from one that was.

### R-6.3 · v1 · confirmed · accepted

When an environment is marked as a test environment, every message it sends is marked as a test in its subject line and carries a test variant of the service's logo.
- cites: src/back-end/lib/mailer/transport.ts:31
- cites: src/back-end/lib/mailer/templates.tsx:396
- cites: src/shared/config.ts:12
- cites: README.md:283
- reconciliation: implemented-only
- given: a non-production environment marked as being for testing
- when: any message is sent from it
- then: its subject begins with a test marker and the logo at the top of the message is the test variant, so a reader can tell it apart from a message from the real service
- note: the marking is applied by the sending machinery, so it covers every message without any individual message having to ask for it.

### R-6.4 · v2 · confirmed · accepted

Every message the service sends comes from a single configured sender — a display name followed by one do-not-reply address, the same for every kind of message — and carries no reply-to address distinct from that sender.
- cites: src/back-end/config.ts:17
- cites: src/back-end/config.ts:187
- cites: src/back-end/lib/mailer/transport.ts:29
- cites: README.md:267
- reconciliation: implemented-only
- given: a person who receives any message from the service
- when: they look at who it came from, or reply to it
- then: it comes from one address bearing the service's name, the same for every kind of message, and a reply to it reaches nobody
- note: the configured sender must be given as a display name followed by an address in angle brackets, and the service refuses to start if it is not. Messages carry no reply-to address distinct from the sender, so a person's only route back is the contact address printed in the body of some messages.

### R-6.5 · v1 · confirmed · accepted

Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.
- cites: src/back-end/lib/mailer/transport.ts:30
- reconciliation: implemented-only
- given: a reader whose mail program shows plain text only
- when: they open any message from the service
- then: they see a readable plain-text rendering carrying the same words and links as the formatted version
- note: nothing in the service composes plain-text copy of its own, so the plain-text form can only ever be as good as the automatic rendering of the formatted one.

### R-6.6 · v2 · confirmed · accepted

Every message the service sends ends with an offer labelled Unsubscribe, which opens the reader's own notification settings with the unsubscribe confirmation already asked.
- cites: src/back-end/lib/mailer/templates.tsx:410
- cites: src/back-end/lib/mailer/templates.tsx:414
- reconciliation: implemented-only
- given: a person who receives any message from the service
- when: they read to the end of it
- then: they are offered an unsubscribe choice that opens their own notification settings with the question already asked
- note: the offer appears on every message the service sends, including the ones the notification preference does not govern — see R-6.10.

### R-6.7 · v1 · confirmed · accepted

The unsubscribe offer in a message is not tied to the person it was addressed to: it acts on whoever is signed in when it is opened, and it cannot be used without signing in.
- cites: src/back-end/lib/mailer/templates.tsx:414
- cites: src/shared/lib/resources/user.ts:6
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:81
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:93
- reconciliation: implemented-only
- given: a message sent to one person and forwarded to another
- when: the second person opens the unsubscribe offer while signed in to their own account
- then: they are shown their own notification settings, with the confirmation naming their own address, and confirming stops their own notifications rather than the original recipient's
- note: the offer carries no recipient identity of any kind; it names the reader as "me" and the service resolves that from the session. A reader who is not signed in is sent to sign in first and returned afterwards, so there is no way to unsubscribe without an account and a working sign-in.

### R-6.8 · v1 · confirmed · accepted

A notice that goes to many people at once is split into batches of at most fifty and addressed so that no recipient can see who else received it.
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:256
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:260
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:275
- cites: src/back-end/config.ts:192
- cites: README.md:268
- reconciliation: implemented-only
- given: an opportunity about to be published and one hundred and twenty people who have asked for new-opportunity notices
- when: it is published
- then: three messages are sent, each carrying at most fifty of those people as hidden recipients and showing the service's own address as the visible one, and no recipient's address appears to any other recipient
- note: the batch size is configurable and defaults to fifty. The same batching and hiding is used for the new-opportunity announcement, for the notice that an opportunity has been changed, and for the notice sent to an evaluation panel when it is named or altered.

### R-6.9 · v1 · confirmed · accepted

Four of the notices sent during evaluation put every recipient in the batch in the visible address line instead of hiding them, so each recipient sees the addresses of all the others.
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:564
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:635
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:666
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:697
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:230
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:261
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:292
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:639
- reconciliation: defect
- given: an opportunity whose proposal deadline has just passed and an evaluation panel of four people
- when: the notice that it is ready to be evaluated is sent
- then: each panel member receives a message whose visible address line lists all four of them
- superseded-by: R-6.15
- note: the four are the notice that an opportunity is ready to be evaluated, the notice that it is ready for consensus, the notice that a consensus has been submitted, and the notice that a consensus has been finalised — in both programs that have panels. Every other multi-recipient notice in the same code hides its recipients, so the disclosure looks like an oversight rather than a decision. The recipients are public sector staff rather than vendors, which limits the harm without removing it. No corrected criterion is offered: whether the new service should hide these recipients too is a ruling for a human, though the rest of the service's own behaviour points that way.
- note: superseded by R-6.15

### R-6.10 · v1 · confirmed · accepted

The only notification a person can choose to stop is the announcement of newly published opportunities; every other message is sent regardless of that choice.
- cites: src/back-end/lib/db/user.ts:161
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:150
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:169
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:21
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:11
- reconciliation: defect
- given: a person who has turned notifications off
- when: an opportunity they are watching is changed, or a proposal of theirs is awarded, or an organization asks them to join its team
- then: they receive each of those messages, and only the announcement of a newly published opportunity is withheld
- superseded-by: R-6.16
- note: the notification settings page offers exactly one choice and labels it "New opportunities", so the settings page itself is honest about its scope. The defect is that every message the service sends ends with an unsubscribe offer that leads to that one choice, so a person who unsubscribes from a message the choice does not govern will keep receiving messages of that kind with no indication why. No corrected criterion is offered, because whether the new service should let a person decline the other kinds of notice — and which of them may be declined at all, given that some carry decisions a person needs — is a ruling for a human.
- note: superseded by R-6.16

### R-6.11 · v1 · confirmed · accepted

A deactivated account receives no announcement of newly published opportunities, but still receives every notice about an opportunity it was watching.
- cites: src/back-end/lib/db/user.ts:164
- cites: src/back-end/lib/db/user.ts:165
- cites: src/back-end/lib/db/subscribers/code-with-us.ts:66
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
- reconciliation: defect
- given: a person who was watching an opportunity and has since had their account deactivated
- when: that opportunity is changed or cancelled
- then: they receive the notice, although they cannot sign in to act on it, while a newly published opportunity produces no notice for them
- superseded-by: R-6.17
- note: the two recipient lists are built differently — the announcement list excludes deactivated accounts explicitly, the watcher list applies no such filter and no notification-preference filter either. A person who deactivated their own account therefore keeps receiving mail about opportunities they can no longer open. No corrected criterion is offered: whether deactivation should also end watching, or only suppress the messages, is a ruling for a human.
- note: superseded by R-6.17

### R-6.12 · v1 · confirmed · accepted

The message announcing changed terms tells vendors the new terms must be accepted before submitting to two of the service's three programs, although all three require it.
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:40
- cites: src/back-end/lib/permissions.ts:581
- cites: src/back-end/lib/permissions.ts:838
- cites: src/back-end/lib/permissions.ts:1375
- reconciliation: defect
- given: a vendor who has proposals in progress against all three programs
- when: an administrator announces changed terms
- then: the vendor is told the new terms are needed for Code With Us and Sprint With Us, and is not told they are equally needed for Team With Us
- superseded-by: R-6.18
- note: the service refuses a submission to any of the three programs from a vendor who has not accepted the current terms; the message names only the two programs that existed when it was written. No corrected criterion is offered separately, because the fix is to name all three programs, or none of them, in that one sentence.
- note: superseded by R-6.18

### R-6.13 · v1 · confirmed · accepted

An administrator can open a single page showing a sample of each message the service sends, with its subject and, where one is written, a one-line summary of who receives it and why.
- cites: src/back-end/lib/routers/admin/index.tsx:490
- cites: src/back-end/lib/routers/admin/index.tsx:502
- cites: src/back-end/lib/routers/admin/index.tsx:81
- cites: README.md:75
- reconciliation: implemented-only
- given: a signed-in administrator
- when: they open the notification reference page
- then: they see each message rendered as a recipient would receive it, grouped and titled by the event that sends it, built from sample data rather than from any real person's record
- note: the same page requested by anybody who is not an administrator is refused. The samples carry invented names and addresses, so opening the page discloses nothing about any real account.

### R-6.14 · v1 · confirmed · accepted

The reference page does not show every message the service can send: twelve of them appear nowhere on it, although the service's own documentation describes the page as covering all of them.
- cites: README.md:75
- cites: src/back-end/lib/routers/admin/index.tsx:136
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:57
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:111
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:414
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:589
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:621
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:652
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:683
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:185
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:216
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:247
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:278
- cites: src/back-end/lib/mailer/notifications/opportunity/team-with-us.tsx:665
- reconciliation: defect
- given: an administrator using the reference page to check what a message says before an event happens
- when: they look for the message sent when a Code With Us opportunity is submitted for review, or any of the messages sent to an evaluation panel
- then: neither appears anywhere on the page, and nothing on the page indicates that anything is missing
- superseded-by: R-6.19
- note: sixty-two distinct messages exist and fifty appear on the page. The twelve absent are the pair sent when a Code With Us opportunity is submitted for review, the notices sent when an evaluation panel is named or altered in either program, and the notices sent when either program's opportunity becomes ready for consensus, has a consensus submitted, or has one finalised. The pattern fits the page having been maintained alongside earlier work and not updated when the evaluation panel arrived, but the source cannot say whether the omissions are oversight or deliberate. Graded open because a human must rule on what the page is for before it can be said what "all of them" should mean: a complete catalogue that must be kept in step, or a sample that never claimed to be complete and whose documentation is simply overstated.
- note: superseded by R-6.19

### R-6.15 · v1 · confirmed · accepted

A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice.
- replaces: R-6.9

### R-6.16 · v1 · confirmed · accepted

A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.
- replaces: R-6.10

### R-6.17 · v1 · confirmed · accepted

A deactivated account receives no notification of any kind, including notices about opportunities it was watching, while the watch itself is retained so that reactivating the account restores it.
- replaces: R-6.11

### R-6.18 · v1 · confirmed · accepted

The message announcing changed terms names every program whose proposals require a current acceptance — Code With Us, Sprint With Us and Team With Us — or names none of them rather than a subset.
- replaces: R-6.12

### R-6.19 · v1 · confirmed · accepted

The administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it.
- replaces: R-6.14

### R-6.20 · v1 · confirmed · accepted

A newly created account has new-opportunity notifications off until its holder asks for them.
- cites: src/back-end/lib/routers/auth.ts:478
- cites: src/shared/lib/resources/user.ts:56
- cites: src/migrations/tasks/20191203143238_alter_columns.ts:14
- reconciliation: implemented-only
- given: a person signing in to the service for the first time
- when: their account is created
- then: it records no request for new-opportunity notices, and none is sent to them until they ask
- note: the record holds the moment the request was made rather than a yes or no, so an account that has never asked and an account that has asked and then changed its mind are indistinguishable afterwards. Combined with the profile-completion page never being shown to a public sector employee, this means such a person is never offered the choice at the point where it is first offered and receives no new-opportunity notices unless they later find the setting themselves.

### R-6.21 · v1 · confirmed · accepted

A signed-in person can turn new-opportunity notices on and off from the list of opportunities itself, without opening their settings.
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:503
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:886
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:894
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:997
- reconciliation: implemented-only
- given: a signed-in person browsing the list of opportunities with notices turned off
- when: they choose to be notified about new opportunities
- then: the control changes to offer the opposite choice, their account records the request, and the change takes effect for the next opportunity published
- note: the control is offered without a confirmation in either direction here, whereas the same choice made from the notification settings asks the person to confirm before turning notices off.
- note: it sits at the top of the first group of opportunities on the page, which is the unpublished group for a person who has unpublished opportunities and the open group for everybody else, so it appears exactly once wherever the reader is looking first.

### R-6.22 · v1 · confirmed · accepted

The notification control on the list of opportunities is not shown on a narrow screen.
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:877
- reconciliation: defect
- given: a signed-in person browsing the list of opportunities on a phone
- when: they look for the control that turns new-opportunity notices on
- then: no such control appears anywhere on the page, and the only route to the choice is the notification settings on their own profile
- superseded-by: R-6.27
- note: the control is hidden below the medium breakpoint and shown above it. The choice itself remains reachable from the notification settings, so nothing is unreachable, but the shortcut is silently absent rather than moved. No corrected criterion is offered; whether the new service shows this control at every width is a design decision rather than a recovered rule.
- note: superseded by R-6.27

### R-6.23 · v1 · confirmed · accepted

An administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms.
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:114
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:555
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:619
- cites: src/back-end/lib/resources/email-notifications.ts:52
- cites: src/back-end/lib/resources/email-notifications.ts:76
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:11
- cites: src/back-end/lib/permissions.ts:1646
- reconciliation: implemented-only
- given: an administrator on the page holding the service's terms and conditions, and a mix of active and deactivated vendors who had all accepted the previous terms
- when: the administrator chooses to notify vendors and confirms
- then: every vendor's acceptance is withdrawn and each active vendor receives a message naming the change and offering a link to read and accept the new terms
- note: the announcement is offered only on the terms and conditions page and nowhere else, and only to an administrator; the same request made by anybody else, signed in or not, is refused. Acceptance is withdrawn for every vendor including deactivated ones, while only active vendors are told, so a vendor deactivated at the time of the change learns of it only on returning. This route appears in no published interface description.

### R-6.24 · v1 · confirmed · accepted

An announcement of changed terms is reported as successful as soon as the acceptances are withdrawn, before any message has been sent.
- cites: src/back-end/lib/resources/email-notifications.ts:76
- cites: src/back-end/lib/resources/email-notifications.ts:80
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:16
- reconciliation: implemented-only
- given: an administrator announcing changed terms to a large body of vendors
- when: they confirm
- then: they are told at once that vendors have been notified, while the messages are still being sent one at a time in the background, and nothing later tells them whether every message was sent
- note: the withdrawal of acceptances is completed before the response, so the part of the action a vendor will notice on their next visit is reliable; only the messages are not. Delivery failures are invisible for the reason given in R-6.2, so a run that reaches nobody looks exactly like one that reaches everybody.

### R-6.25 · v2 · confirmed · accepted

The message telling a vendor that an opportunity they proposed on has been awarded to somebody else leads with the opportunity's title and the name of the winning proponent — the winning organization for Sprint With Us and Team With Us, and for Code With Us the legal name of the winning organization or individual, or an em dash where no successful proponent is recorded — and offers the reader a way to sign in and see their own score.
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:277
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:281
- cites: src/back-end/lib/mailer/notifications/proposal/sprint-with-us.tsx:287
- cites: src/back-end/lib/mailer/notifications/proposal/team-with-us.tsx:287
- cites: src/back-end/lib/mailer/templates.tsx:499
- reconciliation: implemented-only
- given: three vendors who submitted proposals to one opportunity, one of which has just been awarded
- when: the decision is sent to the two who were not chosen
- then: each is told the opportunity was awarded, is shown the name of the organization it was awarded to, and is offered a way to sign in and see their own score
- note: this message uses a layout of its own rather than the layout every other message uses, leading with the opportunity's title and the winner's name. Where no successful proponent is recorded the name is replaced by a dash rather than the sentence being omitted, so a reader can be shown "awarded to —".

### R-6.26 · v2 · confirmed · accepted

When the service notifies an account that holds no email address it composes the message all the same and hands it over with an empty list of recipients; any resulting failure is written to the operational log only, nothing in the service records that the person was not reached, and a broadcast to many vendors always continues to the next recipient because no failure in composing or sending can interrupt it.
- cites: src/back-end/lib/mailer/notifications/terms-updated.tsx:32
- cites: src/back-end/lib/mailer/notifications/user.tsx:72
- cites: src/shared/lib/resources/user.ts:53
- cites: src/back-end/lib/mailer/transport.ts:26
- reconciliation: defect
- given: a vendor whose account holds no email address, because the identity provider supplied none
- when: an administrator announces changed terms
- then: the service composes a message for that account addressed to nobody and hands it on to be sent, and what follows depends on the sending machinery rather than on anything the service decides
- superseded-by: R-6.28
- note: accounts without an email address are allowed deliberately, and most messages guard against one only by substituting an empty list of recipients where the address would go — the message is still composed and still handed over to be sent. Whether that produces a rejected send, a silently discarded one, or an error that stops the rest of a broadcast is not decidable from the source, and because delivery failures are only logged, nothing inside the service would show which. The one place that does check is account creation, which skips the welcome message when there is no address. A human should rule on whether the new service must skip a recipient with no address everywhere, and on whether one such recipient may stop a broadcast to the rest.
- note: Must the service skip a recipient that holds no email address rather than composing a message addressed to nobody, and must a broadcast to many vendors always continue past such a recipient rather than being able to stop the run on one?
- note: superseded by R-6.28

### R-6.27 · v1 · confirmed · accepted

The choice to be notified about newly published opportunities is offered on the list of opportunities itself at every screen width, so a person reading the list on a phone reaches it the same way as a person reading it on a desktop.
- replaces: R-6.22

### R-6.28 · v1 · confirmed · accepted

The service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach.
- replaces: R-6.26
