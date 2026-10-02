| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T19:15:06.493Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 10 (Staff can create Sprint With Us and Team With Us opportunities with an evaluation panel) do what its criteria say?

**Recommendation.** I built slice 10: Sprint With Us and Team With Us opportunities can now be created, managed and read, with their evaluation panel.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built slice 10: Sprint With Us and Team With Us opportunities can now be created, managed and read, with their evaluation panel. `npm --prefix app run check` passes: 803 tests across migrations, backend and frontend, and the production builds succeed. I did not start the compose sandbox, so nothing was watched working in a browser. The service was checked end to end by tests that start the real application on an in-process PostgreSQL holding the real migrations and the suite's seed, with every request going through the contract validation, and with mail caught where it matters.

**How each criterion is reached**

- **Program rules (R-1.13, R-1.15, R-1.16, R-1.17, R-1.18).** A new rules module, `backend/src/rules/other-program-content.ts`, holds the checks, and the form and the service both use it.
  - Each problem is named against its field, in the same `field: message` form Code With Us uses. A listed item is named by its place, for example `teamQuestions.2.minimumScore`.
  - The weights refusal reads "The scoring weights must total 100%." The phases refusal reads "A prototype phase must follow an inception phase."
  - A draft is never checked and keeps its defaulted dates (R-1.9).
- **Panel rules (R-1.55, R-5.1, R-5.9, R-5.37).** A panel needs at least two members, each named once, each an active public sector employee, each an evaluator or the chair or both, and exactly one chair. A refusal names the member's place and name, in the words of the panel request story.
- **Changes on `PUT /api/opportunities/<program>/<id>`.** It now takes:
  - `edit`: a new version recorded as an edit in the history. Only an administrator may edit once the opportunity is published (R-1.56). An edit never changes the panel.
  - `submitForReview` and `publish`: refused with the single "incomplete" sentence and no field named (R-1.21). Only an administrator publishes.
  - `editEvaluationPanel`: from the author or an administrator, while the opportunity is a draft, under review, published or at individual question evaluation (R-1.43, R-5.16).
  - Creating an opportunity as published stays administrator-only (R-1.48).
- **Deleting (R-1.53).** `DELETE` is new for both programs: the author may delete a draft, an administrator a draft or one under review, and nobody anything else.
- **Notices (R-5.17).** Once the opportunity has left draft, only the people newly added to the panel are emailed. Submitting for review and publishing now send the same notices Code With Us sends, in the program's name.
- **Who sees the panel (R-5.18).** The panel appears in the service's answer only for an administrator, the author and the panel's own members. A panel member may also read an opportunity they sit on before it is published. The manage page, panel tab included, shows "not found" to everyone else, panel members included.
- **Screens.**
  - The create pages and the manage page's Opportunity tab share one form, which checks with the shared rules before sending.
  - The manage page has Summary, Opportunity, Addenda, History and Evaluation panel tabs, with the same action bar as Code With Us.
  - The panel tab follows the evaluation design: a row per evaluator with a Chair tick, then a Chair field. From the consensus stage it shows the "fixed" notice and a table.
  - The new public pages at `/opportunities/<program>/<id>` show only their own program's content (R-1.8), count a view and offer Watch.
- **Embedded pages (R-7.17, R-7.29).** The Sprint With Us page embeds the `sprint-with-us-opportunity-scope` page and the Team With Us page embeds `team-with-us-terms-and-conditions`. Both use the same renderer as the page's own address, and a test asserts the markup is identical in both places and that a `<script>` is shown as text. If the page can't be read, its section is empty and says nothing, and the rest of the opportunity is shown.
- **Built earlier, answered for here.** R-1.19's cancelled example uses slice 9's Cancel on this manage page. R-1.39's draft is saved through this create screen.

**What I tested.** I wrote unit tests for the content and panel rules, an end-to-end service test, and screen tests covering:
- the create page's checks;
- the panel tab: saving, refusing a one-person panel before sending, placing the service's refusal on the right row, the locked view, and "not found" for others;
- the manage page: the incomplete notice and the author's read-only view after publication;
- the public views, including the missing embedded page.

**Choices a reviewer should look at** (recorded in `docs/decisions/0045`, with the README updated):
- **Where staff get the list of panel candidates.** R-4.21 keeps the user list for administrators only, and the contract has no other address that lists people. So a public sector employee's own session answer (`GET /api/sessions/current`) now carries `panelCandidates`: identifier and name only, never email or account status.
- **Who is notified, and when.** I read R-5.17 literally. Creating an opportunity outside draft notifies its whole panel. Submitting or publishing a draft notifies nobody, because no one is being added at that moment.
- **R-1.17 and R-1.21 pull against each other.** Submitting an existing draft from the manage page says only "incomplete", as R-1.21 requires. Field-level naming for question limits happens on the create page and in edits.

**What the next slices will find missing**
- Files still can't be attached to these two programs. The kept database has no attachment table for them, which belongs to slice 15 with R-8.19.
- The proposal link, the Proposals and evaluation tabs, the evaluation instructions page, the panel's section on the dashboard (R-5.19's listing) and the full report are not built.
- The `/status` closing hook does not yet close these two programs' opportunities (slice 16).

Nothing outside `app/` and `docs/decisions/` was changed, and the compose file needed no change. I removed the `node_modules` and `dist` folders I created, so the runner has to install dependencies before running the check.

_Ruled: return by runner:verify_
