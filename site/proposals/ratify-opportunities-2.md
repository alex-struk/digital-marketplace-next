| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-07T03:07:24.499Z |
| holder | agent:product-owner |

# Which of the opportunities criteria that are still inferred or open become the contract?

**Recommendation.** 3 criterion(s) in opportunities are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

3 criterion(s) in the **opportunities** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-opportunities-11 · v1 · open · recovered

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, with at most one of them marked as chair.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing a Sprint With Us or Team With Us opportunity
- when: they submit fewer than two panel members, the same person twice, more than one chair, or anyone who is not a public sector employee
- then: the submission is rejected and the reason is named
- cites: src/back-end/lib/validation.ts:900
- cites: src/back-end/lib/validation.ts:847
- cites: src/shared/config.ts:32
- cites: src/shared/config.ts:34
- note: the rule as written in the application's own comment says "one and only one chair", but the code accepts a panel with no chair at all and rejects only a second chair. A human should rule on which was intended.
- note: Must a Sprint With Us or Team With Us evaluation panel have exactly one chair, as the application's own comment states, or is a chair optional, as the code allows?

**This criterion has already been answered once, with `contract` or `spike`.** Neither one
moves it toward the contract, so answering the same way again would leave it exactly where it
is: already answered once: confirm, edit, obsolete or defect it.

### D-opportunities-25 · v1 · open · recovered

An opportunity may be deleted only while it is a draft or under review, and only by an administrator or, for a draft, by the member of public sector staff who created it.

- reconciliation: conflicting
- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- cites: src/back-end/lib/permissions.ts:367
- cites: src/back-end/lib/permissions.ts:636
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
- cites: src/back-end/docs/opportunities/code-with-us.yaml:112
- note: the application's own interface documentation says deletion is permitted only for a draft, while the code also permits an administrator to delete an opportunity that is under review. The three programs also disagree with each other: for Code With Us and Sprint With Us the creating staff member may delete only a draft, but for Team With Us they may also delete one that is under review. A human should rule on the intended rule before it is carried forward.
- note: Which single deletion rule carries forward across all three programs: may an administrator delete an opportunity that is under review as well as one in draft, and may the creating public sector employee delete one that is under review, or only a draft?

**This criterion has already been answered once, with `contract` or `spike`.** Neither one
moves it toward the contract, so answering the same way again would leave it exactly where it
is: already answered once: confirm, edit, obsolete or defect it.

### D-opportunities-49 · v1 · open · recovered

The author of a published opportunity, who is not an administrator, can change its details.

- reconciliation: conflicting
- given: a published opportunity created by a member of public sector staff who is not an administrator
- when: that person submits a change to its details
- then: the change is accepted and a new version is recorded
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
- cites: src/back-end/lib/permissions.ts:349
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
- cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:582
- note: the interface offers the edit only to administrators once an opportunity is published, but the underlying service accepts it from the author too. The two disagree, and nothing in the application says which is intended.
- note: May the author of a published opportunity who is not an administrator change its details, as the service accepts, or is editing after publication administrator-only, as the interface enforces?

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


## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is which of the three opportunities criteria left short of the contract at the first ratification now become it, and the ruling is approve, deciding all three on evidence rather than spiking them a second time. I spiked them originally because each looked like two plausible readings of intent; reading the enforcing code shows that in every case the application states its intended rule somewhere and fails to apply it in exactly one place, which leaves one reading and not two. D-opportunities-11 is a defect: validateSWUEvaluationPanelMembers at validation.ts:938-947 rejects a second chair and nothing rejects a panel with none, so the recovered statement is an accurate record of the server, but the validator's own docstring at :891-894 says 'one and only one chair', both panel forms make the chair a required Select ('Please select a panel chair.', swu-evaluation-panel.tsx:85 and twu-evaluation-panel.tsx:85) and append a chair member when no checkbox marked one (twu-evaluation-panel.tsx:301-310), and createSWUTeamQuestionResponseConsensus at permissions.ts:1007 and createTWUResourceQuestionResponseConsensus at :1524 admit only the panel chair, so a chairless panel could never produce a consensus and the opportunity could never leave the questions consensus stage. That is a hole in server-side validation rather than a policy, so the row is kept as the confirmed record and the replacement requires exactly one chair. D-opportunities-25 is an edit rather than a defect, because the recovered statement is the correct rule and marking it a defect would assert the opposite: deleteCWUOpportunity at permissions.ts:367 and deleteSWUOpportunity at :636 both allow an administrator a draft or one under review and the author a draft only, while deleteTWUOpportunity at permissions.ts:1139 omits the status test for the author and the resource layer at team-with-us/index.ts:1680 then applies one blanket draft-or-under-review check to both. What settles it is that Team With Us's own interface never offers that deletion: edit/tab/opportunity.tsx:1117-1127 gives a non-admin Edit only on an opportunity under review, identical to Code With Us at :1090-1099, so all three interfaces agree with two of the three services and the Team With Us service is the outlier. The OpenAPI line at docs/opportunities/code-with-us.yaml:112-118 saying draft only is incomplete rather than contradictory, since it never mentions the administrator, and no part of this ruling rests on it. The rewording is the second witness and states one rule binding all three programs. D-opportunities-49 is a defect: the rule is written in the application's own shared layer, where canCWUOpportunityDetailsBeEdited at shared/lib/resources/opportunity/code-with-us.ts:288 returns adminsOnly for a published opportunity, with identical twins at sprint-with-us.ts:584 and team-with-us.ts:540, and the front-end applies it at form.tsx:586 and edit/tab/opportunity.tsx:101 while the back-end never calls it at all, checking only status at code-with-us.ts:517 over an admin-or-author permission at permissions.ts:349 that carries no status test. A rule the codebase states and one layer forgets to enforce is a defect, not an open question, so the row is kept as the confirmed record of what the service accepts and the replacement makes editing after publication administrator-only. I am not escalating: the tier is STANDARD, the stage reported no confidence shortfall, and the ambiguity that would have sent these to a human is resolved by the code rather than by my preference. The ruling would change if a chairless evaluation panel turned out to be reachable and workable in practice, if the Team With Us deletion difference or the missing back-end call to canCWUOpportunityDetailsBeEdited were recorded anywhere as a deliberate per-program decision rather than an omission, or if any of these three rested on the old README, generated schema document or OpenAPI files rather than on the enforcing code.

**Conditions:**
- defect D-opportunities-11: A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.
- edit D-opportunities-25: An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.
- defect D-opportunities-49: Once an opportunity is published, only an administrator may change its details; a request from the public sector employee who created it is refused, and the same rule governs Code With Us, Sprint With Us and Team With Us alike.
