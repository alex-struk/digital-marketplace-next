| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T04:13:28.012Z |
| holder | agent:reviewer |

# 40 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.1, R-5.1, R-1.3, R-3.3, R-4.5, R-3.7, R-5.9, R-1.10, R-1.11, R-1.12, R-3.12, R-2.13, R-3.13, R-1.14, R-2.14, R-1.17, R-5.18, R-3.19, R-5.19, R-8.19, R-8.20, R-1.21, R-3.22, R-6.23, R-1.24, R-2.24, R-5.24, R-2.25, R-3.25, R-5.25, R-3.26, R-3.28, R-8.29, R-1.31, R-8.31, R-3.34, R-1.39, R-1.48, R-1.53, R-1.55 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

40 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

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

### R-3.7 · v1

An organization's owner, its administrators and a service administrator may invite people to the team by email address, and each invitation is created as a pending membership.

- given: an organization with an owner and no other members
- when: the owner invites two email addresses at once from the team page
- then: both people appear on the team list marked as pending, and neither counts towards the organization's team size until they accept
- test: tests/acceptance/organizations/R-3.7.spec.ts

**an organization's owner may invite people to the team by email address, and each invitation is created as a pending membership that does not count towards the team until accepted** — failed

```
Error: organization-edit.add_team_members — "Add Team Member(s)" is disabled on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000302/edit?tab=team; the page shows no message
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

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**a Code With Us proponent named as an individual carries a legal name, an email address and a full postal address, each field validated in turn** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Code With Us proponent named as an organization is checked only for existence and active status** — failed

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

### R-5.18 · v1

The membership of an evaluation panel is shown only to an administrator, the opportunity's owner, and the people on the panel itself.

- given: an opportunity with an evaluation panel
- when: a vendor, or a public sector employee who is neither the owner nor on the panel, opens the opportunity
- then: no panel membership is shown to them, while an administrator, the owner and each panel member all see it
- test: tests/acceptance/evaluation/R-5.18.spec.ts

**the membership of an evaluation panel is shown to the people on the panel itself** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**no panel membership is shown to a public sector employee who is neither the owner nor on the panel** — failed

```
Error: unbound: opportunity-swu-create.publish — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "questionsWeight", "codeChallengeWeight", "teamScenarioWeight", "priceWeight"
```

**no panel membership is shown to a vendor** — failed

```
Error: unbound: opportunity-swu-create.publish — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "questionsWeight", "codeChallengeWeight", "teamScenarioWeight", "priceWeight"
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

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Code With Us opportunity is readable by whoever may read the opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a file attached to a Sprint With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-swu-create.publish — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "questionsWeight", "codeChallengeWeight", "teamScenarioWeight", "priceWeight"
```

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-twu-create.publish — no field on http://localhost:3000/opportunities/team-with-us/create takes "questionsWeight", "challengeWeight", "priceWeight"
```

**a file attached to a proposal is readable by whoever may read the proposal** — failed

```
Error: unbound: proposal-cwu-create.add_attachment — walked to the Attachments step and chose "Edit" where the Actions menu or the top bar offered it, but no "Add Attachment" control appeared on http://localhost:3000/opportunities/code-with-us/c6b5ebe3-21dd-492c-bff4-f3383a2f9d03/proposals/create
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

### R-2.24 · v1

A vendor sees only the proposals they authored, plus the proposals of organizations they own or administer, and never another vendor's proposal.

- given: two vendors who each hold a proposal against the same opportunity
- when: each lists their proposals and each opens the other's proposal directly
- then: each list shows only that vendor's own proposal, an organization owner additionally sees their organization's proposals under a separate heading, and opening the other vendor's proposal is refused
- test: tests/acceptance/proposals/R-2.24.spec.ts

**a vendor sees only the proposals they authored** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/2fbc84a9-dad7-4297-93fb-a8807a628870/proposals/create; the page shows no message
```

**a vendor additionally sees the proposals of organizations they own or administer, under a separate heading** — failed

```
Error: unbound: opportunity-twu-create.publish — no field on http://localhost:3000/opportunities/team-with-us/create takes "questionsWeight", "challengeWeight", "priceWeight"
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

### R-2.25 · v1

Public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed, and never see drafts or unsubmitted proposals.

- given: a published opportunity whose deadline has not yet passed and which carries both draft and submitted proposals
- when: the opportunity's author or an administrator lists its proposals
- then: the request is refused, and once the opportunity has closed the list shows the submitted proposals but never the drafts
- test: tests/acceptance/proposals/R-2.25.spec.ts

**public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mAddenda[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mCode With Us: R-2.25 opportunity whose proposals are withheld while it is open[39m
[31mPublished Sep 14, 2026[39m
[31m|[39m
[31mUpdated Sep 14, 2026[39m
[31mStatus[39m
[31mPublished[39m
[31mCreated By[39m
[31mCasey Placeholder[39m
… 8 more line(s)
```

### R-3.25 · v1

An organization is qualified for Sprint With Us once it has at least two active team members, those members between them hold every capability the service recognises, and its Sprint With Us terms have been accepted.

- given: an organization with an owner and one further active member who between them hold every capability, and whose Sprint With Us terms have not yet been accepted
- when: the owner opens the organization's Sprint With Us qualification page
- then: the team-size and capability requirements are shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- test: tests/acceptance/organizations/R-3.25.spec.ts

**with the team-size and capability requirements met and the terms requirement unmet, the organization is marked as not qualified** — failed

```
Error: organization-edit.add_team_members — "Add Team Member(s)" is disabled on http://localhost:3000/organizations/ae9ed216-bb89-465a-b644-f5c54c13df7a/edit?tab=team; the page shows no message
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

### R-3.26 · v1

An organization is qualified for Team With Us once it has been approved for at least one service area and its Team With Us terms have been accepted.

- given: an organization approved for one service area whose Team With Us terms have not been accepted
- when: the owner opens the organization's Team With Us qualification page
- then: the service-area requirement is shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- test: tests/acceptance/organizations/R-3.26.spec.ts

**an organization approved for service areas whose Team With Us terms have been accepted is qualified** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**with the service-area requirement met and the terms requirement unmet, the organization is marked as not qualified** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"Juniper Reach Service Area Only Ltd.[39m
[32mTo qualify for one or more Service Areas, you must complete the RFQ through BC Bid.[39m
[32mService Areas"[39m
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

### R-8.29 · v1

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- test: tests/acceptance/files/R-8.29.spec.ts

**an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.31 · v1

Public sector staff cannot see the proposals submitted against an opportunity until it has left the published state.

- given: a published opportunity that has received proposals
- when: its author or an administrator asks to see the proposals
- then: the request is refused until the opportunity has closed and moved to an evaluation stage
- test: tests/acceptance/opportunities/R-1.31.spec.ts

**public sector staff cannot see the proposals submitted against an opportunity while it is published** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mAddenda[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mCode With Us: Seeded published Code With Us opportunity[39m
[31mPublished Jan 5, 2026[39m
[31m|[39m
[31mUpdated Jan 5, 2026[39m
[31mStatus[39m
[31mPublished[39m
[31mCreated By[39m
[31mCasey Placeholder[39m
… 8 more line(s)
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**removing an attachment from a proposal withdraws the read path the file held through that proposal** — failed

```
Error: unbound: proposal-cwu-create.add_attachment — walked to the Attachments step and chose "Edit" where the Actions menu or the top bar offered it, but no "Add Attachment" control appeared on http://localhost:3000/opportunities/code-with-us/7c576acc-b61d-4920-a69b-72695a3e8da8/proposals/create
```

### R-3.34 · v1

An organization's summary of team capabilities counts only members who have accepted their invitation.

- given: an organization whose only member holding a given capability has been invited but has not yet accepted
- when: the owner opens the organization's team page
- then: that capability is shown as one the team does not have, and it becomes shown as held once the invitation is accepted
- test: tests/acceptance/organizations/R-3.34.spec.ts

**a capability held only by an invited person who has not yet accepted is shown as one the team does not have, and becomes shown as held once the invitation is accepted** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Technical Architecture"[39m
Received string:        [31m"This is a summary of the capabilities your organization's team possesses as whole, only including the capabilities of confirmed (non-pending) members. Team members can claim capabilities in their user profiles in the \"Capabilities\" section.[39m
[31mAgile Coaching[39m
[31mBackend Development[39m
[31mDelivery Management[39m
[31mDevOps Engineering[39m
[31mFrontend Development[39m
[31mSecurity Engineering[39m
[31m[7mTechnical Architecture[27m[39m
[31mUser Experience Design[39m
[31mUser Research"[39m
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

### R-1.48 · v1

Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.

- test: tests/acceptance/opportunities/R-1.48.spec.ts

**creating an opportunity with its state set to published is refused unless the requester is an administrator** — failed

```
Error: unbound: opportunity-swu-create.publish — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "questionsWeight", "codeChallengeWeight", "teamScenarioWeight", "priceWeight"
```

**a public sector employee who is not an administrator may create an opportunity as a draft, in all three programs** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-1.53 · v2

An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.

- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- test: tests/acceptance/opportunities/R-1.53.spec.ts

**an administrator may delete an opportunity while it is a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: unbound: opportunity-swu-create.save_draft — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "questionsWeight", "codeChallengeWeight", "teamScenarioWeight", "priceWeight"
```

**an administrator may delete an opportunity while it is under review, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the public sector employee who created an opportunity may delete it while it is a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the public sector employee who created an opportunity may not delete it once it is under review, in Code With Us, Sprint With Us and Team With Us alike, and it remains** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**any other request to delete an opportunity, such as one that has been published, is refused and the opportunity remains** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
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

## Triage conditions

One condition per line, one for every failing criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.


## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question was which of the 40 criteria failing against the old target were caused by this project's own adapter, after bind-adapter-old-12 changed it. Ruling: approve, with one triage line per criterion: 14 adapter-wrong and 26 product-question. I read each failure against tests/adapters/old/index.ts, the test and its saved page snapshot under tests/test-results. Seven adapter faults account for the 14. (1) The Sprint With Us and Team With Us create forms have no label for questionsWeight, codeChallengeWeight, teamScenarioWeight, priceWeight or challengeWeight, nor for Sprint With Us's top-level startDate and completionDate, so publish and save_draft walk all eight steps and throw unbound (R-1.48, R-1.53, R-2.24, R-5.18, R-8.20). (2) attachmentAddress saves only through 'Save Changes' while a published opportunity offers 'Publish Changes', and addAttachment reports 'Add Attachment' missing on the proposal form's '3. Attachments' step, which the snapshot shows rendered (R-8.20, R-8.31). (3) Three readers return text that cannot change: proposalsTab returns the withheld notice 'Proposals will be displayed here once this opportunity has closed.' (R-1.31, R-2.25), teamCapabilities returns all nine capability names whatever the team holds (R-3.34), and twuRequirementServiceArea picks up the organization's own name 'Juniper Reach Service Area Only Ltd.' (R-3.26). (4) addTeamMembers joins several addresses with commas in one 'Email Addresses*' box, which keeps the dialog's button disabled (R-3.7, R-3.25). (5) chooseProponentOrganization ignores an organization given as a seed record, so the archived organization was never chosen and 'Cedar Hollow Systems Inc.' was submitted instead (R-2.14). (6) The embedded-image address ignores the Body's 'FILE_ID:' marker (R-8.29). (7) Accepted terms are not remembered when the terms dialog cannot open yet, so the second vendor's dialog reopened with both boxes unticked (R-2.24). Twenty-six go to the product owner because nothing in the evidence points at the binding. The non-administrator staff profile carries no 'Permission(s)' label, so permissions_label is truthfully empty at each test's precondition (R-1.3, R-1.21, R-3.3); derive-tests-organizations-stale-2 already asked R-3.3 to read admin_checkbox instead. An invalid or blank value disables the save control and the page shows no message (R-1.10, R-1.11, R-1.12, R-1.14, R-1.17, R-2.13, R-3.12, R-3.22). R-1.17's position test also names a field the question form does not have. A new Sprint With Us draft already carries its creator as chair plus a second evaluator, so adding members builds a valid panel of three rather than a one-person or chairless one, and a duplicate or a vendor is refused with no message (R-5.1, R-5.9, R-1.55). The seeded Team With Us opportunity and its proposals answer 'Not Found', and no closing mail names the Sprint With Us opportunity (R-1.1, R-1.24). The Team With Us 'Save Draft' stays on /create, and a vendor was not refused the Sprint With Us draft's attachment (R-8.19). All four list filters hold their values ('Sprint With Us', 'Draft', Remote OK ticked, 'kittiwakes') and the list does not narrow (R-1.39). The save said 'Organization Updated' and stored the contact name, but the phone still reads 250-555-0101 (R-3.19). After saving, no service-area box is ticked (R-3.28). The invitee's Organizations tab offers no approve control beside 'Pending', and 'Change Owner' shows the pending member with the button disabled and no message (R-3.13). The vendor is returned to the sign-in page (R-4.5). The draft shows 'Completed' to its panel member (R-5.19). After 'Submit Scores for Consensus', the evaluations still offer 'Edit', and the incomplete set is refused only by a disabled button (R-5.24, R-5.25). An administrator viewing a vendor's profile is offered no Policies tab (R-6.23). Caveats for the product owner: R-4.5's signInAsVendor presses 'Sign In Using GitHub', which the adapter's own sign-in code says leaves for github.com on this target, so reactivation may be untestable here rather than broken. R-3.13's changeOwner also ignores a seed-user record as newOwner, which will matter once an invitation can be approved. R-3.26 may come back as a product question, since its save, like R-3.28's, left no box ticked. Tier is STANDARD and no residual risk is marked unaccepted, so nothing escalates. What would change this ruling: a fresh run with these adapter faults fixed that still fails a criterion at the same assertion sends that criterion to the product owner. Evidence that the adapter's clicks never tick the service-area boxes would move R-3.28 to adapter-wrong.

**Conditions:**
- product-question R-1.1
- product-question R-5.1
- product-question R-1.3
- product-question R-3.3
- product-question R-4.5
- adapter-wrong R-3.7: organizationEdit.addTeamMembers types every address into the one 'Email Addresses*' box joined by commas ('file.owner@example.test,vendor.notices.off@example.test'), and the dialog keeps its 'Add Team Member(s)' disabled; enter each address in a box of its own, adding a box for each further address with the clickable icon beside the field. A single address is accepted, as the pending invitations in R-3.13 and R-3.34 show.
- product-question R-5.9
- product-question R-1.10
- product-question R-1.11
- product-question R-1.12
- product-question R-3.12
- product-question R-2.13
- product-question R-3.13
- product-question R-1.14
- adapter-wrong R-2.14: in the organization test proposalCwuCreate.chooseProponentOrganization reads the organization only as a string, so given the seed record for the archived organization it chooses nothing, completeRequired picks the first organization offered ('Cedar Hollow Systems Inc.') and the proposal is submitted; take the name from the record's legal_name. The individual test is not shown to be a binding fault: a blank field leaves 'Submit' disabled with no message.
- product-question R-1.17
- adapter-wrong R-5.18: in the vendor and unrelated-staff tests opportunitySwuCreate.publish throws unbound because fillForm has no label for questionsWeight, codeChallengeWeight, teamScenarioWeight, priceWeight, startDate or completionDate; map the weights to the percentage fields on the form's scoring step and the dates to the phase's 'Phase Start Date' and 'Phase Completion Date'. The panel-member test is not a binding fault: the panel member is shown 'Not Found' on the evaluation panel tab.
- product-question R-3.19
- product-question R-5.19
- product-question R-8.19
- adapter-wrong R-8.20: in the Code With Us test fileAttachmentControl.attachmentAddress saves only through 'Save Changes', but the published opportunity's top bar offers 'Publish Changes', so the file stays a 'blob:' preview and the address reads ''; press 'Publish Changes' and confirm when that is the save control. In the Sprint With Us and Team With Us tests publish throws unbound on the weight keys (and on Sprint With Us startDate and completionDate); map them to the scoring step's percentage fields and the phase dates. In the proposal test addAttachment reports no 'Add Attachment' although the snapshot at that address shows 'Choose File' with 'Add Attachment' on '3. Attachments'; find the control there, or set the file on the 'Choose File' input directly.
- product-question R-1.21
- product-question R-3.22
- product-question R-6.23
- product-question R-1.24
- adapter-wrong R-2.24: in the Code With Us test the second vendor's acceptProgramTerms and acceptAppTerms return before ticking or remembering either box because 'Submit' is still disabled: completeRequired leaves 'Proposal*' empty since namedLabels still holds 'proposal' from the first vendor's form. submitProposal then reopens 'Review Terms and Conditions' with both boxes unticked and 'Submit Proposal' disabled; remember accepted terms even when the dialog cannot open yet, and start namedLabels afresh for each form. In the organization test opportunityTwuCreate.publish throws unbound on questionsWeight, challengeWeight and priceWeight; map them to the scoring step's percentage fields.
- product-question R-5.24
- adapter-wrong R-2.25: opportunityCwuEdit.proposalsTab returns tabContent(['Proposals']), the whole tab including the opportunity header and 'Proposals will be displayed here once this opportunity has closed.', so a tab that withholds every proposal reads as non-empty; return '' when the tab shows that notice and lists no proposals.
- adapter-wrong R-3.25: organizationEdit.addTeamMembers types both addresses comma-joined into the one 'Email Addresses*' box ('org.admin@example.test,org.member@example.test'), and the dialog keeps its 'Add Team Member(s)' disabled; enter each address in a box of its own.
- product-question R-5.25
- adapter-wrong R-3.26: in the second test organizationEdit.twuRequirementServiceArea returns every line matching /service area/i, which picks up the organization's own heading 'Juniper Reach Service Area Only Ltd.', the RFQ instruction and the 'Service Areas' heading, none of which shows whether the requirement is met; read only the service-area requirement under 'Requirements', with whatever marks it met or unmet. The first test is not a binding fault: the qualified organization shows no Team With Us badge and no service area ticked.
- product-question R-3.28
- adapter-wrong R-8.29: fileEmbeddedImage.imageAddress looks for '/api/files/' in the Body and then for a stored image on the page, but the Body refers to the upload as '![R-8.29 diagram.png](FILE_ID:9abb034f-abfa-48e9-a349-8df7e91ab385)', so it returns ''; build the file's address from the identifier after 'FILE_ID:'.
- adapter-wrong R-1.31: opportunityCwuEdit.proposalsTab returns tabContent(['Proposals']), the whole tab including the opportunity header and 'Proposals will be displayed here once this opportunity has closed.', so a tab that withholds every proposal reads as non-empty; return '' when the tab shows that notice and lists no proposals.
- adapter-wrong R-8.31: in the opportunity test attachmentAddress saves only through 'Save Changes', but the published opportunity's top bar offers 'Publish Changes', so the file stays a 'blob:' preview and the address reads ''; press 'Publish Changes' and confirm when that is the save control. In the proposal test addAttachment reports no 'Add Attachment' although '3. Attachments' at that address shows 'Choose File' with 'Add Attachment'; find the control there, or set the file on the 'Choose File' input directly.
- adapter-wrong R-3.34: organizationEdit.teamCapabilities returns every name under 'Team Capabilities', but that list names all nine capabilities whatever the team holds (the R-3.7 organization, whose owner holds none, lists the same nine), so the names alone cannot show what is held; return only the capabilities the page marks as held.
- product-question R-1.39
- adapter-wrong R-1.48: opportunitySwuCreate.publish throws unbound because fillForm has no label for questionsWeight, codeChallengeWeight, teamScenarioWeight or priceWeight, nor for the top-level startDate and completionDate, which the Sprint With Us form holds only on its phases; map the weights to the percentage fields on the form's scoring step and the dates to the phase's 'Phase Start Date' and 'Phase Completion Date'. The Team With Us 'Save Draft' staying on /create is not shown to be a binding fault.
- adapter-wrong R-1.53: in the administrator draft test opportunitySwuCreate.save_draft throws unbound because fillForm has no label for questionsWeight, codeChallengeWeight, teamScenarioWeight, priceWeight, startDate or completionDate; map the weights to the scoring step's percentage fields and the dates to the phase's 'Phase Start Date' and 'Phase Completion Date'. The other four tests are not binding faults: they stop because the staff profile shows no 'Permission(s)' label.
- product-question R-1.55
