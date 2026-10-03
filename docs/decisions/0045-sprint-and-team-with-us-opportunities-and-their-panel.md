# 0045 · Sprint With Us and Team With Us opportunities, and their evaluation panel

- Status: accepted for the build (slice 10)
- Date: 2026-10-02
- Replaces: 0035, 0036, 0040 and 0041 (the interim create path and manage page), and the line in
  0043 that answered every Sprint With Us and Team With Us change but running ones "not yet
  available"

## Decision

**One set of rules for both programs, shared by form and service.**
`app/backend/src/rules/other-program-content.ts` reads a request as it was sent, with nothing
defaulted (`readOtherInput`), and names every problem with an opportunity that is not a draft
(`otherProblems`): R-1.10 and R-1.11 as Code With Us has them; the budget (R-1.13: Sprint With Us
$1 to $5,000,000, Team With Us at least $1 and no more than the store's integer can hold); dates in
order from no earlier than today, or a passed deadline kept (R-1.14); for Sprint With Us at least
one skill, an implementation phase, an inception phase only beside a prototype phase, and each
phase running from the end of the one before (R-1.16); for Team With Us at least one resource, each
in one of the five service areas at 1 to 100 per cent (R-1.18); at least one question, each within
R-1.17's limits, its position being its place in the list; and weights each 0 to 100 and together
exactly 100 (R-1.15, "The scoring weights must total 100%."). A draft is never judged (R-1.9,
R-1.17): `draftOf` keeps it, giving missing dates their defaults.

**How a refusal names a field.** As Code With Us's: one line per problem, `field: message`, the
field named as the request names it. A listed item is named by its place from 1:
`teamQuestions.2.minimumScore`, `resources.1.targetAllocation`, `inceptionPhase.startDate`. Two
groups have names of their own: `phases` and `scoringWeights`. The form maps each back to its label
("Question 2, minimum score") and field (`otherFieldLabel`, `otherFieldId`).

**The panel's rules** (`panelProblems`; R-1.55, R-5.1, R-5.9, R-5.37): at least two members; each
named once; each an active public sector employee or administrator; each an evaluator, the chair or
both; exactly one chair. Every line belongs to `evaluationPanel`. A problem with one member names
their place and their name, in the panel form's words: `evaluationPanel: Panel member 2: Test
Evaluator Two must be an evaluator, the chair, or both.` A missing chair is `evaluationPanel:
Choose a chair. The panel needs one person to record the agreed scores.` (the
`evaluation-panel-request` story's words). A draft's panel is not judged; so the store can hold it,
a draft keeps each account once, only members who evaluate or chair, and only the first chair, and
a draft naming nobody has its author alone as chair and evaluator, as before.

**What `PUT /api/opportunities/{sprint-with-us,team-with-us}/{id}` takes**, besides 0043's
`cancel`, `addAddendum` and `addNote`:

- `edit`, with the content as its value. What it leaves out is kept; a phase named as `null` is
  removed. The panel is never taken from an edit: once the opportunity exists it is changed on its
  own tab, as design/DESIGN.md has it. The author and administrators edit before publication, and
  administrators alone after (R-1.56, 401 otherwise). Anything but a draft is judged in full. Each
  edit is a new version and an `EDITED` history row (R-1.4), and tells watchers, proponents and the
  author as 0043 says (R-1.35).
- `submitForReview` (the author or an administrator) and `publish` (an administrator, R-1.22), on
  the program's path (R-1.20), refused as incomplete — the one sentence, no field named (R-1.21) —
  unless the content and the panel's shape pass.
- `editEvaluationPanel`, with the panel as its value: an array of `{ user, evaluator, chair }`, a
  user named by identifier or by a record carrying one (`{ evaluationPanel: [...] }` is read too).
  From the author or an administrator (401 otherwise, R-5.18), while the opportunity is a draft,
  under review, published or at individual question evaluation (400 `The evaluation panel can no
  longer be changed. …` otherwise, R-1.43, R-5.16). It is a new version with the content unchanged,
  so it shows in the history as an edit (R-5.16's note).
- Any other tag is 400 "not yet available": the evaluation stages' changes are later slices'.

`DELETE` deletes a draft (its author or an administrator) or one under review (an administrator),
and nothing else (R-1.53, 401 otherwise). `POST` judges anything that is not a draft — its panel
included — before keeping it, and keeps refusing staff who ask for it published (R-1.48).

**Who is told.** Submitting for review and publishing send the same messages Code With Us sends,
in the program's name (`mail/notifications/other-program-opportunity.ts`). The people newly put on
a panel are told, in one batched blind-copy message, only once the opportunity has left draft
(R-5.17): on a panel change, each person not on the panel before; on a creation under review or
published, everyone on it. Leaving draft is not adding anybody, so submitting or publishing a draft
tells its panel nothing — R-5.17 says the people added while it was a draft are told nothing, and
nothing recovered says they are told later. Only active accounts are told (R-6.17).

**Who sees the panel** (R-5.18). The answer carries `evaluationPanel` only to an administrator, the
author and the panel's own members; a public sector employee on the panel may also read the
opportunity before it is published, which is how they see it. The Evaluation panel tab, like the
whole manage page, is the missing page to anyone else, a panel member included.

**Where staff choose panel members from.** The panel's `Select` offers every active public sector
employee and administrator. R-4.21 keeps `GET /api/users` an administrator's, and the contract has
no other address that lists people, so the service answers a public sector employee's or an
administrator's own session (`GET /api/sessions/current`) with `panelCandidates`: each candidate's
identifier and name, and nothing else — no address, no standing. A vendor's or visitor's session
carries none.

**The screens.**

- The create pages and the manage page's Opportunity tab are one form
  (`opportunity-other-form.tsx`). Submit for review, Publish and Save changes check it with the
  shared rules first, list every problem in the summary (`field-error`) and against its field, and
  send nothing until it passes; the service's refusal is shown the same way. The create page keeps
  the opportunities domain's panel editor (`evaluation-panel-editor`: per member a person, Evaluator
  and Chair), which can compose any panel the service then judges. Attachments stay unoffered: the
  kept schema has no attachment table for these programs (0036).
- The manage page has the Code With Us page's action bar and tabs, plus Evaluation panel
  (`?tab=evaluationPanel`, `opportunity-tab-evaluation-panel`), offered in every state.
- The Evaluation panel tab is the evaluation domain's design: a row per evaluator with a Chair tick,
  then a Chair field that may name someone who chairs without evaluating, so two chairs cannot be
  composed. Save checks at least two members, nobody twice and a chair, in that order; the
  service's refusals are placed on the row they name. From the consensus stage it is the locked
  notice and a table.
- The public pages (`opportunity-other-view.tsx`) show the program's own content (R-1.8), count a
  view, offer Watch, and embed `/content/sprint-with-us-opportunity-scope` (Sprint With Us) or
  `/content/team-with-us-terms-and-conditions` (Team With Us) in a wrapper carrying
  `opportunity-scope` or `opportunity-terms`, rendered by the one `FormattedText` the page's own
  address uses, so the markup is identical and nothing in it runs (R-7.17). A page that cannot be
  read leaves the wrapper empty — no heading, no explanation — and the rest of the page is drawn
  (R-7.29).

## What this does not decide

- The proposal link (`opportunity-start-proposal`), the Proposals and evaluation tabs, the
  instructions screen's embedded page, and the full report are later slices'.
- Attaching files to these programs' opportunities (R-8.19's Sprint With Us and Team With Us half)
  needs attachment tables the kept schema lacks; that is slice 15's.

## What would reverse it

A recovered rule that the panel added during a draft is told when the draft leaves it (R-5.17 would
then reach submission and publication too); a contract address for listing panel candidates, which
would replace `panelCandidates` on the session; a ruling that R-1.17's "offending field is named"
applies to submitting an existing draft, which R-1.21 currently forbids.
