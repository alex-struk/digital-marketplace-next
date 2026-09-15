---
gate: G1
question: "26 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-1.1, R-5.1, R-1.3, R-3.3, R-4.5, R-5.9, R-1.10, R-1.11, R-1.12, R-3.12, R-2.13, R-3.13, R-1.14, R-1.17, R-3.19, R-5.19, R-8.19, R-1.21, R-3.22, R-6.23, R-1.24, R-5.24, R-5.25, R-3.28, R-1.39, R-1.55 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-15T04:30:44.275Z
---

# 26 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.1, R-5.1, R-1.3, R-3.3, R-4.5, R-5.9, R-1.10, R-1.11, R-1.12, R-3.12, R-2.13, R-3.13, R-1.14, R-1.17, R-3.19, R-5.19, R-8.19, R-1.21, R-3.22, R-6.23, R-1.24, R-5.24, R-5.25, R-3.28, R-1.39, R-1.55 with a calibration condition, so the next calibrate run can apply it.

26 criterion(s) failed against the **old** target at http://localhost:3000, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-1.1 · v2

A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and its author is notified that it is ready for evaluation.

- given: a published opportunity whose proposal deadline has passed
- when: the service next handles any request
- then: the opportunity moves to its program's first evaluation stage with the note "This opportunity has closed.", its submitted proposals move to review, and its author receives a notification
- test: tests/acceptance/opportunities/R-1.1.spec.ts

**a published opportunity whose proposal deadline has passed closes on its own and moves to the first evaluation stage of its program** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/evaluat|question/[39m
Received string:  [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

**every proposal submitted against an opportunity whose proposal deadline has passed moves to review when it closes** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"review"[39m
Received string:    [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

**the author of an opportunity whose proposal deadline has passed is notified that it is ready for evaluation when it closes** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-5.1 · v1

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.

- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- test: tests/acceptance/evaluation/R-5.1.spec.ts

**an opportunity that uses a panel must name at least two panel members** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**each panel member must be named only once** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**each panel member must be a public sector employee** — failed

```
Error: evaluation-panel-swu.save_evaluation_panel — "Save Changes" is disabled on http://localhost:3000/opportunities/sprint-with-us/592d5cb1-733f-407b-9b53-c8a02dd46a35/edit?tab=evaluationPanel; the page shows no message
```

### R-1.3 · v1

A member of public sector staff sees every published opportunity plus their own drafts and opportunities under review, and an administrator sees every opportunity.

- given: two members of public sector staff, each with an unpublished opportunity of their own
- when: each lists opportunities
- then: each sees their own unpublished opportunity and not the other's, while an administrator listing opportunities sees both
- test: tests/acceptance/opportunities/R-1.3.spec.ts

**a member of public sector staff sees every published opportunity plus their own drafts and opportunities under review** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an administrator sees every opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.3 · v1

An organization's full record can be opened only by an administrator or by a member who owns or administers that organization; anyone else is refused.

- given: an organization with an owner, one administrator and one ordinary member
- when: the ordinary member, and separately a member of public sector staff, opens that organization's management page
- then: both are refused, while the owner, the organization's administrator and a service administrator each see the organization
- test: tests/acceptance/organizations/R-3.3.spec.ts

**an organization's full record is refused to an ordinary member of that organization and to a member of public sector staff** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-4.5 · v1

A person who deactivated their own account is let back in the next time they sign in, their account becomes active again, and they are told by email that it has been reactivated.

- given: a person who deactivated their own account
- when: they sign in again
- then: they are signed in, their account is active once more, and they receive a message saying they have successfully reactivated it
- test: tests/acceptance/users/R-4.5.spec.ts

**a person who deactivated their own account is let back in the next time they sign in** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Please sign in to access your Digital Marketplace account.[39m
[31mSign In[39m
[31mSelect one of the options available below to sign in to your Digital Marketplace account.[39m
[31mUse your GitHub account to sign in to the Digital Marketplace.[39m
[31mSign In Using GitHub[39m
[31mUse your IDIR to sign in to the Digital Marketplace.[39m
[31mSign In Using IDIR"[39m
```

**their account becomes active again** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"[7mA[27mctive"[39m
Received: [31m"[7mIna[27mctive"[39m
```

**they are told by email that it has been reactivated** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-5.9 · v1

The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.

- test: tests/acceptance/evaluation/R-5.9.spec.ts

**the service must reject an evaluation panel that names no chair** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**an opportunity that is not a draft is rejected when its title is missing** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its teaser is over 500 characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its description is missing** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.11 · v1

An opportunity that is not a draft must state whether remote work is acceptable, and must carry a remote-work description of up to 500 characters whenever remote work is acceptable.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they mark it as accepting remote work but leave the remote-work description empty
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.11.spec.ts

**an opportunity that is not a draft must state whether remote work is acceptable** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.12 · v1

A Code With Us opportunity must offer a reward of at least $1 and at most $70,000, and must name at least one skill.

- given: a member of public sector staff creating or editing a Code With Us opportunity that is not a draft
- when: they submit a reward outside $1 to $70,000, or submit no skills
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.12.spec.ts

**a Code With Us opportunity naming no skill is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.12 · v1

An organization's owner, its administrators and a service administrator may grant or withdraw administrator rights over the organization to an active member, but nobody may change their own rights and the owner's own membership cannot be changed this way.

- given: an organization with an owner and two other active members, one of whom already has administrator rights
- when: the owner grants administrator rights to the second member, that administrator tries to withdraw their own rights, and someone tries to change the owner's
- then: the second member gains administrator rights, and both the self-change and the change to the owner are refused
- test: tests/acceptance/organizations/R-3.12.spec.ts

**an organization administrator trying to withdraw their own rights is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a change to the owner's own membership is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.13 · v1

A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.

- given: a vendor submitting a Code With Us proposal
- when: the proposal text is empty or longer than 10,000 characters, or the additional comments are longer than 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/proposals/R-2.13.spec.ts

**a Code With Us proposal that is not a draft is rejected when it carries no complete proponent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.13 · v1

Only a service administrator may transfer ownership of an organization, and only to a member whose membership is already active; the previous owner becomes an ordinary member.

- given: an organization with an owner, one active member and one member whose invitation is still pending
- when: an administrator transfers ownership to the active member
- then: that member becomes the organization's owner, the previous owner becomes an ordinary member, and the pending member cannot be chosen as the new owner
- test: tests/acceptance/organizations/R-3.13.spec.ts

**an administrator transfers ownership to the active member, who becomes the owner while the previous owner becomes an ordinary member** — failed

```
Error: unbound: organization-user-memberships.approve_invitation — the organizations tab offers no approve control beside a pending invitation; it is answered only through the invitation message's link, which needs the invitation's affiliation identifier, and none was supplied
```

**the pending member cannot be chosen as the new owner** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.14 · v1

An opportunity's key dates must run in order — the proposal deadline no earlier than today, then the assignment date, then the start date, then the completion date — and each date is recorded as 4:00 p.m. Pacific time on the day chosen.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a proposal deadline in the past, or any later date that falls before the date preceding it
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.14.spec.ts

**an opportunity that is not a draft is rejected when its assignment date falls before its proposal deadline** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its start date falls before its assignment date** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.17 · v1

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question, a guideline, a maximum score, a response word limit and a position, and an optional minimum score that must be lower than the question's maximum score.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**an evaluation question whose question runs over one thousand characters is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose position falls outside nought to one hundred is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.19 · v1

A change to an organization's contact phone number made while editing its profile is saved along with every other profile field, and clearing the field removes the stored number.

- test: tests/acceptance/organizations/R-3.19.spec.ts

**a change to the contact phone number is saved along with every other profile field** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"250-555-0177"[39m
Received string:    [31m"Digital Marketplace[39m
[31morg.owner@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31mEdit Organization[39m
[31mOrganization[39m
[31mTeam[39m
[31mSWU Qualification[39m
[31mTWU Qualification[39m
[31mChangelog[39m
[31mNorthern Pines Digital Ltd.[39m
[31mSprint With Us Qualified[39m
[31mProfile Picture (Optional)[39m
[31mLegal Name[39m
… 27 more line(s)
```

### R-5.19 · v1

A panel member may open an opportunity they sit on the panel for even before it is public, and it is listed for them under a separate heading for work they are evaluating.

- given: a draft opportunity whose panel names a public sector employee who did not create it
- when: that person opens their dashboard and then the opportunity
- then: the opportunity is listed under "Evaluations" and they can open it, whereas another public sector employee cannot see it at all
- test: tests/acceptance/evaluation/R-5.19.spec.ts

**a panel member may open an opportunity they sit on the panel for even before it is public** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"draft"[39m
Received string:    [31m"completed"[39m
```

### R-8.19 · v1

An attachment on an opportunity is uploaded with no read access recorded against the file itself, for all three programs alike, so that what the opportunity is attached to decides who may read it.

- test: tests/acceptance/files/R-8.19.spec.ts

**an attachment on a Sprint With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an attachment on a Team With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-1.21 · v1

Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.

- given: a draft opportunity with a field still blank
- when: its author submits it for review
- then: the request is refused with a message saying the opportunity is incomplete and asking the author to complete and save the form
- test: tests/acceptance/opportunities/R-1.21.spec.ts

**submitting a draft opportunity for review is refused unless the opportunity is complete** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.22 · v2

Registering an organization requires a legal name, street address, city, region, mail code, country and contact name, each between one and one hundred characters, together with a contact email in a valid email format and of any length; a website address, second address line, contact title and contact phone number may be left out, but each is rejected if given in an invalid format, with the second address line and contact title also limited to one hundred characters.

- given: a signed-in vendor filling in the organization registration form
- when: they submit it with the legal name left blank, or with a contact email of "not-an-email"
- then: the organization is not created and the offending field is reported as invalid, while the same submission with the optional website, second address line, contact title and phone left empty succeeds
- test: tests/acceptance/organizations/R-3.22.spec.ts

**a submission with the legal name left blank does not create the organization and reports the field as invalid** — failed

```
Error: organization-create.create_organization — "Create Organization" is disabled on http://localhost:3000/organizations/create; the page shows no message
```

**a submission with a contact email of "not-an-email" does not create the organization and reports the field as invalid** — failed

```
Error: organization-create.create_organization — "Create Organization" is disabled on http://localhost:3000/organizations/create; the page shows no message
```

### R-6.23 · v1

An administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms.

- given: an administrator on the page holding the service's terms and conditions, and a mix of active and deactivated vendors who had all accepted the previous terms
- when: the administrator chooses to notify vendors and confirms
- then: every vendor's acceptance is withdrawn and each active vendor receives a message naming the change and offering a link to read and accept the new terms
- test: tests/acceptance/notifications/R-6.23.spec.ts

**an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m
```

### R-1.24 · v1

On closing a Sprint With Us or Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation.

- given: a published Sprint With Us or Team With Us opportunity with submitted proposals
- when: it closes at its proposal deadline
- then: each submitted proposal is labelled "Proponent 1", "Proponent 2" and so on
- test: tests/acceptance/opportunities/R-1.24.spec.ts

**on closing a Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/evaluat|question/[39m
Received string:  [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-5.24 · v1

An evaluator may change their own evaluation only while it is still a draft and the opportunity is still in individual question evaluation; once submitted it cannot be changed at all.

- given: an evaluator who has submitted their scores for a proponent
- when: they try to change a score or a comment
- then: the change is refused and the submitted scores stand
- test: tests/acceptance/evaluation/R-5.24.spec.ts

**once submitted an evaluation cannot be changed at all** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.25 · v2

An evaluator submits all of their existing draft evaluations for an opportunity in a single action, and the whole set is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." — none of it submitted — unless every evaluation in the set carries an in-range score and a comment for every question of the opportunity; the service does not check that the evaluator holds an evaluation for every proponent, so a proponent they never opened is simply absent from the set rather than blocking the submission.

- given: an evaluator with three proponents to score and a complete draft for only two of them
- when: they submit their scores for consensus
- then: the submission is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." and none of the three is submitted
- test: tests/acceptance/evaluation/R-5.25.spec.ts

**the whole set is refused, none of it submitted, unless every evaluation in it is complete** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again."[39m
Received string:    [31m""[39m
```

**a proponent the evaluator never opened is absent from the set rather than blocking it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.28 · v1

Only an administrator may set which service areas an organization is approved for, and saving a selection replaces the organization's previous approvals entirely.

- given: an organization approved for two service areas
- when: an administrator edits the service areas, leaves one of the two ticked, ticks a third, and saves
- then: the organization is approved for exactly the two areas that were ticked and no longer for the one that was cleared, and the same page offers no editing control to the organization's own owner
- test: tests/acceptance/organizations/R-3.28.spec.ts

**when an administrator saves a selection of service areas the organization is approved for exactly the areas that were ticked and no longer for the one that was cleared** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"FULL_STACK_DEVELOPER"[39m
Received string:    [31m""[39m
```

### R-1.39 · v1

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- test: tests/acceptance/opportunities/R-1.39.spec.ts

**the opportunity list can be narrowed by program** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.39 published opportunity narrowed by program"[39m
Received string:        [31m"[7mR-1.39 published opportunity narrowed by program[27m[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mSeeded published Code With Us opportunity[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Jun 1, 2030 at 4:59 PM PDT[39m
[31mA published opportunity that exists before any test runs.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mWatch"[39m
```

**the opportunity list can be narrowed by state** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.39 published opportunity narrowed by state"[39m
Received string:        [31m"[7mR-1.39 published opportunity narrowed by state[27m[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mSeeded published Code With Us opportunity[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Jun 1, 2030 at 4:59 PM PDT[39m
[31mA published opportunity that exists before any test runs.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mWatch"[39m
```

**the opportunity list can be narrowed to remote-friendly opportunities only** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.39 published opportunity that does not accept remote work"[39m
Received string:        [31m"[7mR-1.39 published opportunity that does not accept remote work[27m[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mR-1.39 published opportunity that accepts remote work[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mSeeded published Code With Us opportunity[39m
[31mCode With Us[39m
… 7 more line(s)
```

**the opportunity list can be narrowed by free text matched against title and location** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.39 published opportunity in another town"[39m
Received string:        [31m"R-1.39 published opportunity about kittiwakes[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31m[7mR-1.39 published opportunity in another town[27m[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mKamloops[39m
[31mRemote OK[39m
[31mSeeded published Code With Us opportunity[39m
… 8 more line(s)
```

### R-1.55 · v1

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.

- test: tests/acceptance/opportunities/R-1.55.spec.ts

**a Sprint With Us opportunity's evaluation panel is rejected with fewer than two members** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity's evaluation panel is rejected when it names the same person twice** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity's evaluation panel is rejected when no member is the chair** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity's evaluation panel is rejected when it names anyone who is not a public sector employee** — failed

```
Error: evaluation-panel-swu.save_evaluation_panel — "Save Changes" is disabled on http://localhost:3000/opportunities/sprint-with-us/a8d3062d-2e69-49b3-a3ea-2977fb6603ea/edit?tab=evaluationPanel; the page shows no message
```

**a Team With Us opportunity's evaluation panel is rejected with fewer than two members** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question was which of 26 criteria failing against the old application are the application's fault, the spec's, or the test's. Ruling: approve, with defect-in-old on three, spec-wrong on three and test-wrong on twenty. I read each failure against the test, the adapter, the saved page snapshot and the old source. DEFECTS IN OLD. R-3.19: the edit form sends the phone number but the service reads it under a different field name (resources/organization.ts:357), so the page says 'Organization Updated', stores the new contact name and keeps 250-555-0101; R-3.5 already records this. R-8.19: Sprint With Us and Team With Us attachments are uploaded readable by anyone (sprint-with-us form.tsx:510, team-with-us form.tsx:422), and the file check grants that before consulting the opportunity (db/file.ts:93-98, permissions.ts:336-339), so a vendor read a draft's attachment; the replaced R-8.8 records the same. R-3.22: a blank legal name is never marked, because a field is checked only once it changes (form-field index.tsx:347-378), and the form only withholds 'Create Organization'. That is the R-7.20 outcome calibrate-old-5 ruled defect-in-old. SPEC WRONG. R-1.1: the ready-for-evaluation notice goes to the author only for Code With Us (notifications/code-with-us.tsx:231-246); Sprint With Us and Team With Us address it to the panel's evaluators (sprint-with-us.tsx:176-190, team-with-us.tsx:602-615). That it is never actually sent is R-5.20's recorded defect. R-1.17: a question has no position field; its place in the list sets it, and at most 100 are held (team-questions.tsx:276-288, shared validation sprint-with-us.ts:367-369). R-5.25: the service refuses an incomplete set with the quoted message and checks only what it is sent (resources sprint-with-us index.ts:1748-1757, 1814-1828). The screen offers submission only once every proponent holds a complete evaluation (evaluation.tsx:505-517), so a person never sees that message and an unopened proponent does block. TEST WRONG. R-1.10, R-1.11, R-1.12, R-1.14 and R-2.13 promise a refusal, and R-1.10 promises the field named in the service's reply, which the service does (resources code-with-us.ts:690-701). Their tests demanded a visible reason for untouched fields, or read before the half-second mark appears. Emptying the pre-filled location passed, which pins the cause. R-3.12: the owner's and one's own admin boxes are shown but unavailable (team.tsx:654-658), and the test demanded a message. R-1.3, R-3.3 and R-1.21 stop at setup: an ordinary staff profile carries no permissions statement (profile.tsx:365-372). R-5.19: the panel member opened the draft; 'Completed' is the simplified label shown to anyone but its creator or an administrator (sprint-with-us lib/index.ts:115-143). R-3.13's second half: a pending member cannot be chosen (team.tsx:985-1009), and no message is promised. R-6.23 failed before announcing, reading vendors' acceptance from the administrator's view, which never shows it (profile/index.tsx:164-166). R-5.24 never submitted, because one proponent of three was scored and the adapter returned silently at the disabled control (index.ts:3950). R-5.1, R-5.9 and R-1.55: new drafts carry the creator as chair plus a second member, so adding people built a valid panel that saved. The form never offers a vendor, and a chairless panel cannot leave the browser. Their duplicate halves did submit a duplicate, and it was refused with no reason shown (the service's reason is dropped at swu-evaluation-panel.tsx:320-336). I did not rule them defect-in-old, because that would freeze the broken halves as the rebuild's obligation. The service also accepts a chairless panel (back-end validation.ts:938-947), which is R-5.2's recorded defect, and no test reached it. R-1.24, R-1.39, R-3.28 and R-4.5 fail on the target rather than the product. The seeded Team With Us opportunity answers 'Not Found' even to an administrator entitled to read it (db team-with-us.ts:862-868). Its closure half passed on 2026-09-14, so calibrate-old-5's clause (waits and still unreadable) is not invoked until the record is shown present. The list filters 200 ms after a change in the browser (list.tsx:447-502), and the adapter reads before it narrows. The seeded service-area approvals are absent: no fresh snapshot shows a Team With Us badge. The old sign-in reactivates a self-deactivated account and emails it (routers/auth.ts:494-503), but this target completes only the development session route, which skips that. Caveats. Harness faults for the adapter or oracle owner, which re-deriving tests cannot fix: the reseed drops the Team With Us opportunity and the organization's service-area approvals; the filter actions do not wait for the list to narrow; 'submit scores for consensus' does nothing when its control is unavailable, where it should report that; answering an invitation needs the link in the invitation message, which the mail fixture does not return; and the target has no identity provider for an ordinary sign-in, so R-4.5 belongs in not-testable.yaml unless one is added. A Team With Us draft the service will store is still not established (R-1.55, R-8.19, as R-1.8 and R-1.53). A never-published draft labelled 'Completed' to its panel is misleading, and no criterion covers it. R-1.55's 'reason named' for panels the form cannot assemble may need rewording once its rewritten test runs. What would change this ruling: a rewritten R-5.1 or R-1.55 whose duplicate panel is still refused with no reason named would make those defect-in-old. So would a rewritten R-5.9 that puts a chairless panel before the service and sees it accepted. A reseeded target carrying the Team With Us opportunity that still fails R-1.24, or carrying the seeded approvals that still fails R-3.28, would bring them back as product questions. Evidence that the old screen names a blank title or description would withdraw the R-1.10 test-wrong reasoning, and evidence that it marks a blank legal name would withdraw R-3.22. Evidence that Sprint With Us or Team With Us authors are sent the closing notice would withdraw the R-1.1 correction.

**Conditions:**
- defect-in-old R-3.19
- defect-in-old R-8.19
- defect-in-old R-3.22
- spec-wrong R-1.1: A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity.
- spec-wrong R-1.17: Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused.
- spec-wrong R-5.25: An evaluator can submit their scores for consensus only once they hold a complete evaluation, an in-range score and a comment for every question, for every proponent of the opportunity; until then submission is not offered and nothing is submitted. The service independently refuses a submitted set containing any incomplete evaluation with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again.", submitting none of it.
- test-wrong R-1.10: the test demands a reason shown against a field the person never changed, and reads the over-length teaser's reason the instant it is entered; the criterion promises that the opportunity is refused and the field is named in the service's reply, not on the screen at once; treat a publication that stays unavailable as the refusal, allow time for any reason to appear, and check that nothing was published
- test-wrong R-1.11: the criterion promises only that the opportunity is refused, never that a reason is shown; treat a publication that stays unavailable as the refusal, allow time for any reason to appear, and check that nothing was published
- test-wrong R-1.12: the criterion promises only that the opportunity is refused, never that a reason is shown against a skill list the person never touched; treat a publication that stays unavailable as the refusal and check that nothing was published
- test-wrong R-1.14: the criterion promises only that the opportunity is refused, and the test reads a reason the instant a date is entered; treat a publication that stays unavailable as the refusal, allow time for any reason to appear, and check that nothing was published
- test-wrong R-2.13: for a proposal with no complete proponent the criterion promises only a refusal, never a reason shown against a choice the person never made; treat a submission that stays unavailable as the refusal and check that no proposal was submitted, expecting the offending field to be named only in the text and comments cases, after allowing time for it
- test-wrong R-3.12: the test demands a message, but the criterion says only that changing one's own rights and changing the owner's are refused; treat a choice that is shown but cannot be changed as the refusal, and confirm afterwards that both people's rights are unchanged
- test-wrong R-1.21: the test establishes that the author holds no administrator rights by requiring a statement of permissions that an ordinary staff member's profile does not carry, so it stops before any submission; establish it from something every staff account shows, submit a saved incomplete draft, treat a draft that keeps its status as refused, and read what the author is told
- test-wrong R-1.3: the test requires a statement of permissions to be shown for a member of public sector staff who holds no administrator rights, and such a person is shown none, so it stops before listing anything; establish that the account holds no administrator rights without depending on such a statement being present
- test-wrong R-3.3: the test requires a statement of permissions to be shown for a member of public sector staff who holds no administrator rights, and such a person is shown none, so it stops before opening the organization; establish that the account holds no administrator rights without depending on such a statement being present
- test-wrong R-5.19: the test takes the status label shown to the panel member as proof they opened a draft, but the criterion never says a panel member is told the opportunity's state; confirm the panel member opened it by its own title and details, and that another public sector employee cannot see it
- test-wrong R-3.13: the refusal of a pending member is that they cannot be chosen as the new owner and ownership is unchanged, and the criterion promises no message; assert that instead; the transfer half needs a way to answer the invitation that the suite does not yet provide, so record it as blocked until it does
- test-wrong R-6.23: the test tries to establish each vendor's standing acceptance, and later its withdrawal, from the administrator's view of the vendor, which never shows it, so it fails before any announcement is made; read each vendor's acceptance and the request to accept the new terms while signed in as that vendor
- test-wrong R-5.24: the evaluator submitted after scoring only some of the proponents, so nothing was submitted and the evaluation stayed a draft that may still be changed; score every proponent completely and confirm the submission took effect before trying to change it
- test-wrong R-5.1: the panels saved already named the draft's creator as chair and a second member, so adding people built a valid panel, and a vendor is never offered as a choice; start from exactly the one-person, two-chair and vendor panels the given describes, treating a panel that cannot be assembled or saved and leaves the opportunity's panel unchanged as refused, and keep requiring the rule to be named when the same person is named twice
- test-wrong R-5.9: the panel offered still had the draft's creator as its chair, so it was valid and accepted; the criterion is about the service's own check on a panel with no chair, so put a panel that names no chair before the service and read whether it is refused
- test-wrong R-1.55: the fewer-than-two and no-chair tests saved panels that still held two or more members and a chair, the vendor test assumed a vendor could be chosen, and the Team With Us test never saved the draft it needed; build exactly each invalid panel the criterion names, treat one that cannot be assembled as refused, start from a Team With Us draft the service accepts, and keep requiring the reason when the same person is named twice
- test-wrong R-1.24: the test sets closure off without first establishing that the lapsed Team With Us opportunity it relies on exists and can be read by an administrator, and on this target it could not, so the absence says nothing about the names; establish that the opportunity and its submitted proposals are present before closure, then wait for the names
- test-wrong R-1.39: the list narrows a moment after a condition is chosen and the test read it before then; allow the list to settle after each choice before checking what remains and what is gone
- test-wrong R-3.28: the test does not establish that the organization is approved for two service areas before editing, and it does not tick a third area as the given describes; establish the two starting approvals, clear one and tick a third, then read the approvals once the save has completed
- test-wrong R-4.5: the return the criterion describes is an ordinary sign-in, and the only sign-in this target completes is not one, so the test cannot show what signing in again does; sign the person in the ordinary way, and if the target offers no ordinary sign-in record the criterion as blocked rather than failed
