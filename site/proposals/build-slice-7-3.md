| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T07:49:40.907Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I fixed the Code With Us form so the suite can fill it in again.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the Code With Us form so the suite can fill it in again. The full `npm --prefix app run check` passes: typecheck plus 632 unit tests (16 migrations, 394 backend, 222 frontend). I did not run the acceptance suite or the compose stack, so whether the six criteria now pass is still to be confirmed.

**What I found.** All six failures had one cause. The last revision (decision record 0030) replaced the remote-work question in the design stories ("Is remote work acceptable?", a Yes / No radio group) with a single "Remote OK" checkbox. The acceptance suite fills the form by that question. It found no such choice, so it could not save a draft, submit or publish on the create page. Every check that depends on creating an opportunity then read an empty result:
- R-1.9: a draft with blanks is accepted.
- R-1.48: only an administrator may create one as published.
- R-1.53: who may delete, and when.
- R-8.17, R-8.19 and R-8.25: an attachment uploaded through the form.

I checked the service code behind these criteria and the attachment control, and none of it was at fault. The size limit was already stated before a file is chosen.

**What I changed.**
- **The form:** in `app/frontend/src/screens/opportunity-cwu-form.tsx`, remote work is the stories' Yes / No question again, with its test id and anchor on the group. This one form serves both the create page and the manage page's Opportunity tab.
- **Default answer:** the question starts on No, as one of the Team With Us stories draws it. A person can never be refused for leaving it unanswered, while the service still refuses a request that doesn't say (R-1.11).
- **Error label:** a remote-work problem in the error summary now begins "Remote work:" instead of "Remote OK:" (`app/backend/src/rules/opportunities.ts`).
- **Unit test:** the create-form test now finds the question by its name, checks it starts on No, chooses Yes, and checks the draft sent says remote work is acceptable. The design system adds "(required)" to a required field's name, so the test matches on the start of the name.

**Records.** New decision record 0031 explains the reversal. I marked 0030's remote-work part as replaced. Its other part stands: creating a Sprint With Us or Team With Us opportunity already enforces R-1.48 ahead of slice 10.

**One judgement call.** The Code With Us create story draws the question with nothing chosen, but I start it on No. If the stories' empty start is required, change the starting value in the form; record 0031 names this as what would reverse it.

**Not done.** One backend test file failed once in the full run and passed when run alone; I take it to be timing-dependent, but it may fail again. I installed dependencies and built the frontend only to verify, then removed both, since nothing in `app/` ignores them. Nothing outside `app/` and `docs/decisions/` was touched. What the next slice will find missing is unchanged from the first build of this slice: watching, proposals, cancelling, addenda, notes, reporting, and the other two programs' own create paths.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 7 (staff draft, submit and publish a Code With Us opportunity) meet its criteria? Return. The remote-work fix landed: R-1.4, R-1.21 and R-1.56 now read the form with its 'Is remote work acceptable?' group, but 18 criteria still fail and the causes split three ways, which is what runner:verify's account suspected and what decided this ruling. (1) The application: R-1.9's test saves a draft and then looks for its title in the author's 'my opportunities' table on /dashboard (R-1.9.spec.ts:131-132; adapter reads table rows at tests/adapters/new/index.ts:3711-3741), and the build's /dashboard is a greeting with no table, so it reads an empty string. R-1.53, R-8.17, R-8.19 and R-8.25 also read empty, consistent with the same gap. The manage page also offers an administrator no Publish on a draft (R-1.22), though the rules permit DRAFT->PUBLISHED. (2) The adapter: R-1.4, R-1.21 and R-1.56 read the Opportunity tab panel by innerText, which never includes input or textarea values, so a saved description or location cannot appear there whatever the application does. (3) The plan: R-1.8, R-1.19, R-1.48 and R-6.15 need the Sprint With Us screens (slice 10), R-6.2 needs the organization edit screen, and R-1.20 needs a cancel action the proposal says is not built; no build of this slice can make those pass. R-1.51 needs no assertion against the application: it is a migration property, and the backend end-to-end test shows the state check refuses SUSPENDED. This is not a pipeline fault, so it is not escalated. It would be approved once the plan re-homes the unreachable criteria, the build adds the dashboard table and the admin Publish on a draft, the adapter reads field values, and verify passes everything the slice still claims.

**Conditions:**
- The signed-in dashboard at /dashboard must list the person's own opportunities in a table, with each row carrying the title and status and linking to the opportunity (an administrator sees all of them), with an Opportunities tab if the design uses tabs. R-1.9's acceptance test reads the saved draft's title from that table and got an empty string, because the build's /dashboard renders only a greeting. R-1.53, R-8.17, R-8.19 and R-8.25 read empty for the same reason.
- On /opportunities/code-with-us/<id>/edit, offer an administrator a 'Publish' action on a draft as well as on an opportunity under review: the code-with-us path permits DRAFT->PUBLISHED. Verify walked the seeded draft as administrator and found only 'Edit', 'Submit for review' and 'Delete' (R-1.22).
- addressed-to bind-adapter: the new adapter reads a manage screen's Opportunity tab (opportunityCwuEdit readers used by R-1.4, R-1.21 and R-1.56) as the tab panel's innerText, which never includes the values of inputs and textareas. Verify received the form's labels ('Title(required) … Is remote work acceptable? (required) Yes …') with no saved description or location in them. The readers must take the values of the labelled fields (or the read-only summary) in that panel, not only its text.
- addressed-to plan: slice 7 (draft, submit and publish a Code With Us opportunity) claims criteria whose tests can only be walked on screens other slices build. R-1.8, R-1.19, R-1.48 and R-6.15 were unbound because /opportunities/sprint-with-us/create and the Sprint With Us view do not exist until slice 10. R-6.2 was unbound because /organizations/:orgId/edit is not served. R-1.20 was unbound because there is no cancel action, which this slice's build lists as not built. Move each to the slice that builds its screen, or split out a Code With Us-only claim, so slice 7 claims only what its build can make walkable.
