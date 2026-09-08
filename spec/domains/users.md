# users

Recovered from the existing application. A user is a person's account with the service. An account
is never registered by hand: it is created the first time a person signs in through the
identity provider, and the way they signed in fixes what kind of account they get — a public
sector employee, a vendor, or an administrator promoted from a public sector employee. The
account carries the person's name, email address, job title, profile picture, notification
preference, capabilities and record of accepting the service's terms, and it moves between an
active state and two distinct inactive states depending on who deactivated it.

### R-4.1 · v1 · confirmed · recovered
The first time a person signs in, the service creates an account for them and decides its kind from the identity they signed in with: a government identity makes a public sector employee, a code-hosting identity makes a vendor.
- cites: src/back-end/lib/routers/auth.ts:426
- cites: src/back-end/lib/routers/auth.ts:450
- cites: src/back-end/lib/routers/auth.ts:476
- cites: src/shared/lib/resources/user.ts:16
- cites: docs/local-development/admin-creation.md:5
- cites: README.md:67
- reconciliation: implemented-only
- given: a person with no account on the service
- when: they sign in for the first time with their government identity
- then: an active public sector employee account exists for them carrying the name and email address the identity provider supplied and their government username, and signing in the same way again reuses that account rather than making a second one
- state: accepted
- note: the account is created with no job title and no profile picture; a person whose identity provider shared no email address gets an account without one, which the service allows deliberately.
- note: an identity the service does not recognise as either kind is refused, and the person is shown the sign-in failure notice.

### R-4.2 · v1 · confirmed · recovered
A person whose account has just been created is sent a welcome message, unless no email address is known for them.
- cites: src/back-end/lib/routers/auth.ts:490
- cites: src/back-end/lib/mailer/notifications/user.tsx:11
- cites: CHANGELOG.md:153
- reconciliation: implemented-only
- given: a person signing in for the first time whose identity provider shared an email address
- when: their account is created
- then: they receive a message welcoming them to the service and offering a link back to sign in, and no message is attempted for a person whose account has no email address
- state: accepted
- note: only the tolerance of accounts without an email address is corroborated outside the code; the message itself rests on the code alone.

### R-4.3 · v1 · confirmed · recovered
A vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy; a public sector employee is never asked to, and the moment of acceptance is recorded on the vendor's account.
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:184
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:229
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:244
- cites: src/shared/lib/resources/user.ts:103
- cites: src/back-end/lib/resources/user.ts:289
- cites: CHANGELOG.md:133
- reconciliation: aligned
- given: a vendor on the profile-completion page with the agreement box unticked
- when: they try to complete their profile
- then: the completion control is unavailable until they tick the box, and once they complete it their account records the date and time they agreed
- state: accepted
- note: acceptance is remembered twice — as the acceptance that currently stands and as the date terms were last accepted at all; the second survives a later withdrawal of the first (see R-4.15).

### R-4.4 · v1 · confirmed · recovered
A person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in.
- cites: src/back-end/lib/routers/auth.ts:504
- cites: src/back-end/lib/routers/auth.ts:526
- cites: src/front-end/typescript/lib/pages/notice.tsx:37
- reconciliation: implemented-only
- given: an account an administrator has deactivated
- when: that person signs in through the identity provider
- then: no session is created and they are shown a page saying sign-in failed and inviting them to try again
- state: accepted
- note: outside production the service also offers direct sign-in routes that create a session without checking whether the account is active (see D-users-29), so this rule cannot be exercised through them.

### R-4.5 · v1 · confirmed · recovered
A person who deactivated their own account is let back in the next time they sign in, their account becomes active again, and they are told by email that it has been reactivated.
- cites: src/back-end/lib/routers/auth.ts:494
- cites: src/back-end/lib/mailer/notifications/user.tsx:126
- cites: src/back-end/lib/mailer/notifications/user.tsx:82
- reconciliation: implemented-only
- given: a person who deactivated their own account
- when: they sign in again
- then: they are signed in, their account is active once more, and they receive a message saying they have successfully reactivated it
- state: accepted
- note: the message sent when a person deactivates their own account tells them this is how to come back, so signing in is the only route back for a self-deactivated account.

### R-4.6 · v1 · confirmed · recovered
A person may hold only one account for a given identity and kind, and two accounts of the same kind may not share an email address.
- cites: src/migrations/tasks/20191110222844_init.ts:28
- cites: src/migrations/tasks/20200922153512_idp_id.ts:19
- cites: src/migrations/tasks/20200118194855_user_email_constraint.ts:9
- cites: docs/database-schema.md:518
- cites: src/back-end/lib/db/user.ts:301
- reconciliation: implemented-only
- given: an existing vendor account using a given email address
- when: a second vendor signs in for the first time carrying the same email address, or an existing vendor edits their profile to that address
- then: neither the new account nor the change is saved
- state: accepted
- note: accounts with no email address do not collide with each other. Neither failure is explained to the person: the first shows a generic sign-in failure and the second a generic save failure, so a duplicate email address is indistinguishable from any other fault.

### R-4.7 · v1 · confirmed · recovered
Whether an administrator may change another person's profile details cannot be settled: the service accepts such a change while the interface never offers it.
- cites: src/back-end/lib/permissions.ts:163
- cites: src/back-end/lib/resources/user.ts:174
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:469
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:626
- reconciliation: defect
- given: an administrator viewing another person's profile
- when: they look for a way to change that person's name, email address or job title
- then: no editing control and no profile heading is shown to them, although a change submitted directly to the service would be accepted
- state: accepted
- superseded-by: R-4.18
- note: the two sources disagree about intent. The permission rule reads "own account or administrator", which is the same rule used for deactivating an account, but the interface deliberately suppresses the form with the comment that administrators cannot edit other profiles. Whether the new system should widen the interface or narrow the permission is a decision, not a finding.
- note: superseded by R-4.18

### R-4.8 · v1 · confirmed · recovered
A vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile, and only they may change them.
- cites: src/front-end/typescript/lib/pages/user/profile/tab/capabilities.tsx:44
- cites: src/front-end/typescript/lib/pages/user/profile/tab/capabilities.tsx:57
- cites: src/front-end/typescript/lib/pages/user/profile/tab/capabilities.tsx:184
- cites: src/shared/lib/data/capabilities.ts:1
- cites: src/shared/lib/validation/user.ts:18
- cites: src/migrations/tasks/20200309204727_user_capabilities.ts:9
- cites: src/back-end/docs/user.yaml:102
- reconciliation: implemented-only
- given: a vendor with no capabilities recorded and an administrator viewing that vendor's profile
- when: the vendor turns two capabilities on and the administrator tries to turn a third on
- then: the vendor's two capabilities are saved and shown as held, and the administrator is offered no working control
- state: accepted
- note: each capability carries a description a person can expand before choosing it, and only capabilities from the service's own list are accepted. These are the capabilities an organization's Sprint With Us qualification counts across its team.
- note: a person may hold no capabilities at all; an empty selection is valid.

### R-4.9 · v1 · confirmed · recovered
A person may deactivate their own account, which ends their session at once, records the date, marks the account as deactivated by them, tells them by email and keeps the record rather than erasing it.
- cites: src/back-end/lib/resources/user.ts:360
- cites: src/back-end/lib/resources/user.ts:368
- cites: src/back-end/lib/resources/user.ts:386
- cites: src/back-end/lib/permissions.ts:167
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:227
- cites: src/front-end/typescript/lib/pages/notice.tsx:24
- cites: src/back-end/lib/mailer/notifications/user.tsx:67
- cites: src/migrations/tasks/20191203143238_alter_columns.ts:24
- cites: src/back-end/docs/user.yaml:75
- reconciliation: implemented-only
- given: a signed-in person on their own profile
- when: they choose to deactivate their account and confirm
- then: they are signed out, shown a page confirming the deactivation, sent a message telling them they can return by signing in again, and their account is kept with the date of deactivation and the fact that they did it themselves
- state: accepted
- note: the published description says the account simply becomes "Inactive"; the service actually distinguishes an account deactivated by its owner from one deactivated by an administrator, and only the second can be reactivated by an administrator.

### R-4.10 · v1 · confirmed · recovered
Only an administrator may reactivate somebody else's account, and only an account that an administrator deactivated; a request to reactivate an account the person deactivated themselves is refused, although the interface offers the control.
- cites: src/back-end/lib/permissions.ts:175
- cites: src/back-end/lib/resources/user.ts:245
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:519
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:523
- cites: src/back-end/docs/user.yaml:118
- reconciliation: defect
- given: one account deactivated by an administrator and one the person deactivated themselves
- when: an administrator uses the reactivate control on each
- then: the first becomes active and the second is refused, with the interface showing only a general failure message
- state: obsolete
- superseded-by: R-4.19
- note: the interface offers a "Reactivate Account" control for every inactive account, without distinguishing the two kinds of inactivity, so an administrator is invited to perform an action the service will always refuse. No corrected criterion has been written because it is undecided whether an administrator should be able to reactivate a self-deactivated account or the control should simply be hidden for one.
- note: superseded by R-4.19

### R-4.11 · v1 · confirmed · recovered
A person whose account an administrator reactivates is told that they themselves successfully reactivated it.
- cites: src/back-end/lib/resources/user.ts:310
- cites: src/back-end/lib/mailer/notifications/user.tsx:126
- cites: src/back-end/lib/mailer/notifications/user.tsx:146
- cites: src/back-end/lib/routers/admin/index.tsx:164
- reconciliation: defect
- given: an account an administrator deactivated
- when: an administrator reactivates it
- then: the person receives a message saying "You have successfully reactivated your Digital Marketplace account", which is not what happened
- state: obsolete
- superseded-by: R-4.20
- note: a correctly worded message for administrator reactivation exists and appears in the service's internal preview of every notification, but nothing sends it. No corrected criterion has been written; the fix is to send the message that already exists.
- note: superseded by R-4.20

### R-4.12 · v1 · confirmed · recovered
Only an administrator may grant or withdraw administrator rights, only over a public sector employee's account, and a vendor can never be granted them; withdrawing the rights returns the person to an ordinary public sector employee account.
- cites: src/back-end/lib/permissions.ts:179
- cites: src/back-end/lib/resources/user.ts:254
- cites: src/back-end/lib/resources/user.ts:259
- cites: src/shared/lib/resources/user.ts:179
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:302
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:420
- cites: docs/local-development/admin-creation.md:15
- cites: src/back-end/docs/user.yaml:122
- reconciliation: implemented-only
- given: an administrator, a public sector employee and a vendor
- when: the administrator opens each of the other two profiles and ticks the administrator box
- then: the public sector employee becomes an administrator immediately, and the request against the vendor is refused with a message saying vendors cannot be granted administrator permissions
- state: accepted
- note: an administrator is never shown the box on their own profile, but the service would accept an administrator withdrawing their own rights, and nothing prevents the last administrator from being demoted.
- note: an ordinary public sector employee viewing their own profile is shown their permissions as a read-only label rather than a control.

### R-4.13 · v1 · confirmed · recovered
The service offers no way to create the first administrator: an administrator can only be made by another administrator, and where none exists the account kind has to be changed directly in the stored data.
- cites: docs/local-development/admin-creation.md:7
- cites: docs/local-development/admin-creation.md:17
- cites: docs/local-development/admin-creation.md:44
- cites: src/back-end/lib/resources/user.ts:254
- reconciliation: implemented-only
- given: a service with no administrator account at all
- when: someone looks for a way to create one through the service
- then: no such way exists, and the only route documented is to change the stored account kind outside the service
- state: accepted
- note: this criterion states what the service does not offer; it is corroborated by the operating instructions the application carries, which describe the manual route in detail.

### R-4.14 · v1 · confirmed · recovered
An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.
- cites: src/front-end/typescript/lib/pages/user/list.tsx:258
- cites: src/front-end/typescript/lib/pages/user/list.tsx:274
- cites: src/front-end/typescript/lib/pages/user/list.tsx:452
- cites: src/front-end/typescript/lib/pages/user/list.tsx:104
- cites: src/front-end/typescript/lib/app/view/index.tsx:791
- cites: docs/local-development/admin-creation.md:15
- cites: src/back-end/docs/user.yaml:2
- reconciliation: implemented-only
- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- state: accepted
- note: the link to this list appears in the main navigation only for an administrator; the search matches words in any order within the name and ignores every other field.

### R-4.15 · v1 · confirmed · recovered
Whether a public sector employee who is not an administrator may see the list of everyone registered cannot be settled: the service answers their request while the interface refuses to show them the page.
- cites: src/back-end/lib/permissions.ts:152
- cites: src/front-end/typescript/lib/pages/user/list.tsx:258
- cites: src/front-end/typescript/lib/pages/user/list.tsx:296
- reconciliation: defect
- given: a signed-in public sector employee who is not an administrator
- when: they open the list of users
- then: they are shown a missing page, although the same request made directly to the service returns every account
- state: accepted
- superseded-by: R-4.21
- note: the permission rule admits both administrators and ordinary public sector employees, while the page admits administrators alone and the navigation link is offered to administrators alone. The list carries every person's email address and status, so the wider of the two readings discloses more than the interface ever intended.
- note: superseded by R-4.21

### R-4.16 · v1 · confirmed · recovered
When an administrator announces that the service's terms and conditions have changed, every vendor's standing acceptance is withdrawn and each of them is asked to read and agree to the new terms before continuing; the date they last accepted any terms is kept.
- cites: src/back-end/lib/db/user.ts:320
- cites: src/back-end/lib/resources/email-notifications.ts:76
- cites: src/front-end/typescript/lib/components/accept-new-app-terms.tsx:39
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:173
- cites: src/migrations/tasks/20201028102241_reaccept-terms.ts:10
- cites: CHANGELOG.md:133
- reconciliation: implemented-only
- given: a vendor who accepted the terms some time ago
- when: an administrator announces that the terms have been updated
- then: the vendor's legal section shows the terms as needing attention and offers a way to review and agree to them, and agreeing records a fresh acceptance date
- state: accepted
- note: a person may accept the terms only for their own account; the service refuses an acceptance made on somebody else's behalf, including by an administrator. Re-accepting terms already accepted is allowed rather than refused.

### R-4.17 · v1 · confirmed · recovered
Signing out ends the person's session both with the service and with the identity provider, and the person is told they have been signed out or, if it could not be done, that it failed.
- cites: src/back-end/lib/resources/session.ts:21
- cites: src/back-end/lib/resources/session.ts:65
- cites: src/back-end/lib/permissions.ts:189
- cites: src/front-end/typescript/lib/pages/sign-out.tsx:31
- cites: src/back-end/docs/session.yaml:20
- reconciliation: implemented-only
- given: a signed-in person
- when: they sign out
- then: they are told they have successfully signed out, their session no longer exists, and the pages that require signing in send them back to sign in
- state: accepted
- note: a person may end only their own session; a request to end anybody else's is refused.

### R-4.18 · v1 · confirmed · authored
A person's profile details - name, email address, job title and picture - may be changed only by that person. An administrator viewing somebody else's profile is offered no editing control, and the service refuses a profile change submitted against an account that is not the requester's own; an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights.
- state: accepted
- replaces: R-4.7

### R-4.19 · v1 · confirmed · authored
The control to reactivate an account is offered only for an account that an administrator deactivated. An account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again, and the service continues to refuse a reactivation request made against such an account.
- state: accepted
- replaces: R-4.10

### R-4.20 · v1 · confirmed · authored
A person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions; the message telling a person they reactivated the account themselves is sent only when they did so by signing in again.
- state: accepted
- replaces: R-4.11

### R-4.21 · v1 · confirmed · authored
The list of everyone registered with the service may be read only by an administrator. The same request made by a public sector employee who is not an administrator, or by anyone else, is refused rather than answered, so the email address and account status of every registered person are never disclosed more widely than the interface offers them.
- state: accepted
- replaces: R-4.15

### R-4.22 · v1 · confirmed · recovered
After signing in, a person who already had an account is taken to their dashboard and a person whose account has just been created is taken to the page that completes their profile, unless they began signing in from a particular page, in which case they are returned to it.
- cites: src/back-end/lib/routers/auth.ts:169
- cites: src/back-end/lib/routers/auth.ts:87
- reconciliation: implemented-only
- given: a returning person and a person signing in for the first time
- when: each completes sign-in without having started from a particular page
- then: the returning person lands on their dashboard and the new person lands on the profile-completion page
- state: accepted
- note: when sign-in was started from a page that requires signing in, that page is where both land instead.

### R-4.23 · v2 · confirmed · recovered
The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:61
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:65
- reconciliation: implemented-only
- given: a public sector employee signing in for the first time, and a vendor who has already agreed to the terms once
- when: each is sent to the profile-completion page
- then: both are moved straight on to their dashboard without being asked to confirm anything
- state: accepted
- note: every newly created account is sent to this page regardless of kind, so a public sector employee is never asked to confirm their details and never sees the notification choice offered there. Whether that is intended could not be settled from the source.
- note: Should a public sector employee be asked to confirm their name, email address and job title, and be offered the new-opportunity notification choice, when their account is first created - or should they continue to be sent straight to the dashboard? The profile-completion page is where that notification choice is first offered and a public sector employee never sees it there, so answering this decides whether the page admits them or the choice moves elsewhere.

### R-4.24 · v1 · confirmed · recovered
While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:186
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:270
- cites: src/back-end/lib/resources/user.ts:234
- cites: src/shared/lib/resources/user.ts:183
- reconciliation: implemented-only
- given: a vendor completing their profile
- when: they tick the box offering notice of new opportunities and complete the profile
- then: their account records that notifications are on, with the moment the choice was made
- state: accepted
- note: turning notifications off does not record a date; the record simply becomes empty, so the service cannot say when somebody stopped wanting them.

### R-4.25 · v1 · confirmed · recovered
A person's account record may be read only by that person or by an administrator; anyone else is refused and, in the interface, is shown a missing-page instead of a refusal.
- cites: src/back-end/lib/permissions.ts:159
- cites: src/back-end/lib/resources/user.ts:67
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:133
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:149
- cites: src/back-end/docs/user.yaml:14
- reconciliation: implemented-only
- given: two vendors and an administrator
- when: one vendor opens the other vendor's profile, and separately an administrator opens it
- then: the vendor is shown a missing page and the administrator sees the profile
- state: accepted
- note: the published interface description of this route mentions no restriction at all.

### R-4.26 · v1 · confirmed · recovered
A signed-in person can open their own profile through a fixed address that stands for whoever is signed in, without knowing their own account identifier.
- cites: src/shared/lib/resources/user.ts:6
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:81
- reconciliation: implemented-only
- given: any signed-in person
- when: they open the profile address that stands for the current person
- then: their own profile is shown
- state: accepted
- note: a visitor who is not signed in is sent to sign in first and returned to the profile afterwards.

### R-4.27 · v2 · confirmed · recovered
A profile requires a name of between one and one hundred characters and an email address in a valid format, which is stored in lower case; the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.
- cites: src/shared/lib/validation/user.ts:22
- cites: src/shared/lib/validation/user.ts:26
- cites: src/shared/lib/validation/index.ts:218
- cites: src/shared/lib/validation/index.ts:444
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:77
- cites: src/back-end/lib/resources/user.ts:157
- cites: src/back-end/docs/user.yaml:93
- reconciliation: implemented-only
- given: a person editing their own profile
- when: they clear the name, or enter an email address that is not in a valid format
- then: the profile is not saved and the offending field is reported as invalid, while the same profile saves with the job title and picture left empty
- state: accepted
- note: the published interface description lists the same fields but says nothing about which are required or how long they may be, and it gives this operation a different request method than the service accepts, so it cannot be followed literally.
- note: the sign-in username is shown on the profile as a permanently read-only field, so a person can see which identity their account belongs to but cannot change it.

### R-4.28 · v1 · confirmed · recovered
The job title is asked for and shown only on a public sector employee's profile; a vendor is never asked for one.
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:283
- cites: src/shared/lib/resources/user.ts:99
- reconciliation: implemented-only
- given: a vendor and a public sector employee each editing their own profile
- when: each opens the profile form
- then: the public sector employee is offered a job title field and the vendor is not
- state: accepted
- note: the service accepts a job title on any account, so a vendor's stored job title, if one ever existed, is carried through their profile edits unchanged and unseen.

### D-users-29 · v1 · inferred · recovered
Outside production the service offers direct sign-in routes for fixed test accounts, which create a session without consulting the identity provider and without checking whether the account is active.
- cites: src/back-end/lib/routers/auth.ts:194
- cites: src/back-end/lib/routers/auth.ts:253
- cites: src/back-end/lib/routers/auth.ts:313
- cites: src/back-end/lib/routers/auth.ts:218
- reconciliation: defect
- given: a service not running in production and a fixed test account that an administrator has deactivated
- when: someone opens the direct sign-in route for that account
- then: a session is created and they are taken to the dashboard, without the identity provider being involved and without the deactivation being noticed
- state: obsolete
- note: these routes exist only to let tests sign in, and they bypass the account-status rule in R-4.4. No corrected criterion has been written because how the new system lets tests establish an identity is a decision for its own environment arrangements rather than something to recover from here.
- note: These routes are gated on NODE_ENV being exactly 'development' rather than on being outside production as the recovered statement has it, but either way they are test-only entrances of precisely the kind constitution article J3 forbids. The rebuilt system carries no route that establishes a session without the identity provider; tests sign in through the sandbox identity provider, which is also what makes R-4.4 testable at all, since the old routes bypass the account-status check.
- note: These routes are gated on NODE_ENV being exactly 'development' rather than on being outside production as the recovered statement has it, but either way they are test-only entrances of precisely the kind constitution article J3 forbids. The rebuilt system carries no route that establishes a session without the identity provider; tests sign in through the sandbox identity provider, which is also what makes D-users-7 testable at all, since the old routes bypass the account-status check.

### R-4.29 · v1 · confirmed · recovered
A person may turn the notice of new opportunities on or off at any time from their profile, and following the unsubscribe link in such a message opens their profile and asks them to confirm before stopping.
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:44
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:101
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:194
- cites: src/back-end/lib/resources/user.ts:234
- cites: src/front-end/typescript/lib/app/router.ts:546
- cites: src/back-end/docs/user.yaml:113
- reconciliation: implemented-only
- given: a person who is being told about new opportunities
- when: they follow the unsubscribe link from one of those messages
- then: their notification settings open with a question asking whether they are sure, naming the email address that would stop receiving them, and the setting changes only once they confirm
- state: accepted
- note: the settings page states the address notifications are sent to and tells the person to correct their profile if it is wrong; there is no separate notification address.

### R-4.30 · v1 · confirmed · recovered
An administrator may deactivate another person's account, which records the date and who did it and tells that person by email that an administrator has removed their access.
- cites: src/back-end/lib/resources/user.ts:368
- cites: src/back-end/lib/resources/user.ts:393
- cites: src/back-end/lib/mailer/notifications/user.tsx:96
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:593
- reconciliation: implemented-only
- given: an administrator viewing an active person's profile
- when: they deactivate that account and confirm
- then: the account is marked as deactivated by an administrator, carries the date and the identity of the administrator who did it, and the person receives a message saying their access has been removed and whom to contact with questions
- state: accepted

### R-4.31 · v2 · confirmed · recovered
A request to deactivate an account that is already inactive is refused with a message saying the account is already inactive; an administrator viewing their own profile is offered no deactivation control, but that restriction rests on the interface alone, since the service accepts a deactivation request made against the requester's own account.
- cites: src/back-end/lib/resources/user.ts:357
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:516
- reconciliation: implemented-only
- given: an already deactivated account, and an administrator viewing their own profile
- when: a second deactivation is requested for the first, and the administrator looks for a deactivation control on their own profile
- then: the second request is refused with a message saying the account is already inactive, and the administrator's own profile offers no such control
- state: accepted
- note: nothing prevents an administrator from deactivating the last remaining administrator account other than their own, so the service can be left with no usable administrator.

### D-users-32 · v1 · open · recovered
The service offers no way to take over an account or a session by presenting a shared token, although its own documentation describes one.
- cites: README.md:279
- cites: src/back-end/config.ts:82
- cites: src/back-end/index.ts:150
- reconciliation: documented-only
- given: a service configured with the shared token the documentation describes
- when: someone tries to use it to override an account or a session
- then: no route accepts it, because none is registered
- state: obsolete
- note: the documentation describes "service API endpoints that are only enabled in development and test environments" which "can be used to override user accounts and sessions", and the setting it names is read into the configuration, but nothing else in the application refers to it and no such route is assembled. Either the feature was removed and the documentation was not, or it was documented ahead of being built; the source cannot say which.
- note: The facility does not exist. SERVICE_TOKEN_HASH appears exactly twice in the whole of the old repository - its definition at src/back-end/config.ts:82 and its README row at README.md:279 - and no route, handler or middleware refers to it. The criterion records that the old repository's documentation is stale rather than a behaviour the rebuilt system must exhibit, and a shared token overriding user accounts and sessions would be a test-only entrance forbidden by J3 in any case, so it is carried forward in neither direction.

### R-4.32 · v1 · confirmed · recovered
An administrator may export a contact list of active accounts as a spreadsheet file, choosing whether to include public sector employees, vendors or both, and which of first name, last name, email address and organization name to include; at least one kind and one field must be chosen.
- cites: src/back-end/lib/resources/contact-list.ts:34
- cites: src/back-end/lib/resources/contact-list.ts:63
- cites: src/back-end/lib/resources/contact-list.ts:91
- cites: src/back-end/lib/db/user.ts:192
- cites: src/back-end/lib/validation.ts:1222
- cites: src/back-end/lib/validation.ts:1241
- cites: src/front-end/typescript/lib/pages/user/list.tsx:518
- reconciliation: implemented-only
- given: one active vendor belonging to an active organization, one deactivated vendor and one administrator
- when: an administrator exports the contact list with both kinds and all four fields chosen
- then: the file contains the active vendor and the administrator but not the deactivated vendor, the administrator is labelled as such, and the vendor's row carries their organization's legal name
- state: accepted
- note: a person's name is split into a first name and a last name at the first space, so a single-word name yields an empty last name and a three-word name puts two words in the last-name column. The account-kind column appears only when both kinds were chosen. Administrators are exported whenever public sector employees are chosen. Only organizations that are still active and memberships that are still current are named, joined into one field.
- note: the export is refused to anyone who is not an administrator, and the export control itself is unavailable until at least one kind and one field are ticked.

### R-4.33 · v1 · confirmed · recovered
A vendor's profile carries a section setting out the privacy policy, the service's terms and conditions with the date and time they agreed to them, and the terms of each of the three programs; nobody but a vendor is shown it.
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:23
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:122
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:173
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:174
- reconciliation: implemented-only
- given: a vendor who has agreed to the terms and a public sector employee
- when: each opens their own profile
- then: the vendor sees the legal section stating the date and time they agreed, and the public sector employee is not offered the section at all and is shown their profile instead if they ask for it
- state: accepted
- note: the privacy policy is shown as text on the page and states that agreement to it was given when the account was created, so it is never separately accepted.

### R-4.34 · v1 · confirmed · recovered
A profile shows different sections depending on whose it is: a vendor's own profile offers profile, capabilities, organizations, notifications and legal sections, a public sector employee's offers profile and notifications, and an administrator looking at somebody else's account sees the profile section alone.
- cites: src/front-end/typescript/lib/pages/user/profile/tab/index.ts:174
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:163
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:448
- reconciliation: implemented-only
- given: a vendor, a public sector employee and an administrator
- when: each opens their own profile, and the administrator then opens the vendor's
- then: each own profile shows the sections belonging to that kind of account, and the vendor's profile seen by the administrator shows only the profile section
- state: accepted
- note: asking for a section that does not belong to the profile being viewed silently shows the profile section instead of refusing. An account's status is shown only to an administrator; everyone else sees the account kind alone.
