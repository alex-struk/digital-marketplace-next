---
gate: G1
question: "Which of the opportunities criteria that are still inferred or open become the contract?"
recommendation: "3 criterion(s) in opportunities are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them."
opened: 2026-09-07T03:07:24.499Z
---

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

