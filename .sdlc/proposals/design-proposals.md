---
gate: G-DESIGN
question: "Do these screens serve the proposals criteria, and are they built out of the design system?"
recommendation: "I designed all 17 proposals pages in `spec/contract/surface.yaml`, with 115 stories, and gave every action and observation on those pages a test ID."
opened: 2026-09-19T08:30:29.371Z
---

# Do these screens serve the proposals criteria, and are they built out of the design system?

**Recommendation.** I designed all 17 proposals pages in `spec/contract/surface.yaml`, with 115 stories, and gave every action and observation on those pages a test ID.

## Journal: proposals domain, design gate

I designed all 17 proposals pages in `spec/contract/surface.yaml`, with 115 stories, and gave every action and observation on those pages a test ID. `screens.yaml` and `DESIGN.md` both got a new proposals section, and neither lost anything the other domains wrote.

**What the design is.** The three programs share one design, as the opportunities domain's pages do: same layout, components and test IDs. They differ only in the sections their criteria require. There are four kinds of screen:
- **Create:** the opportunity summary, then the form, then Cancel, Save draft and Submit proposal.
- **Manage** (the vendor's own proposal): a key-facts header, an action bar, and tabs that are separate addresses.
- **Evaluate** (staff, after the opportunity closes): the proponent's name as that reader may see it, a Scores section, and stage tabs holding each stage's actions.
- **Export:** one continuous document that prints whole.

Submitting always goes through a terms dialog. Its submit button stays disabled until both terms are ticked (R-2.3).

**States, and why these.** A state exists only where the screen really differs:
- **Create** pages have default, invalid, refused, terms and not-found. Code With Us adds `organization`, where the proponent is an organization rather than an individual. Sprint With Us and Team With Us add `unqualified-organization`. Team With Us also has `over-budget`, because that refusal is a computed total rather than one field.
- **Manage** pages have default, draft, editing, terms, delete and withdraw dialogs, `submit-refused`, history, not-found and loading. Code With Us adds `awarded`, where score and rank finally appear (R-2.32). The other two add `organization-locked` (R-2.22) and `scoresheet-tab`.
- **Evaluate** pages have one state per stage tab, plus score, award and disqualify dialogs, `wrong-stage` (R-2.28), evaluated, history, not-found and loading. Only Code With Us has separate invalid stories for scores and disqualification reasons; the other programs refuse them the same way.
- **Exports** add `anonymous` where R-2.37 or R-2.38 call for it.
- **The dashboard** has default, no-organization, empty and loading.

I left out a separate "withdrawn" state because it is the `submit-refused` page without its alert. An invalid edit has no story of its own because it looks exactly like the invalid create.

Pages behind a dialog or refusal are trimmed to their header and action bar. A visible note in each such story says which story holds the rest.

**Components.** The catalogue leans most on the design system's `Button`/`ButtonGroup`, `Link`, `Heading`, `Text`, `Form`, `TextField`, `TextArea`, `NumberField`, `Select`, `Checkbox`, `InlineAlert`, and `Modal` with `Dialog` or `AlertDialog`. No new components of the project's own were added. The badge, key-facts list, card section, fieldset groups, data table, tab navigation and attachment list are all reused from earlier domains, and `DESIGN.md` lists them under the project's own components. I found no written-out colour or size value in any story.

**Test IDs.** All of them live under `proposal-*` and `dashboard-*`, and reuse `field-error`, `not-found-page`, `opportunity-identifier` and the files domain's attachment IDs. `DESIGN.md` records the bindings that aren't obvious from their names:
- Submit, withdraw, delete, award, disqualify and every score entry take two steps: the surface names the button that opens a dialog, and the dialog's confirm button carries its own ID.
- `proponent` and `anonymous_proponent_name` on the export page share one element, `proposal-proponent-name`.
- The dashboard's two "show" actions are links that jump to each list on the same page.

**Gaps, all recorded in `DESIGN.md` and not filled by invention:**
- **`/proposals`:** the surface still carries `proposal-list-stub`, but D-proposals-37 is obsolete and says the entry should be removed. I designed only a pointer to the dashboard.
- **Vendor history:** R-2.9 gives vendors their proposal's history, but the manage pages in the surface have no `history_tab`.
- **History versus hidden scores:** R-2.35 puts scores in the history and R-2.32 hides them until award. Nothing says what the vendor's history shows before then.
- **Wrong-stage buttons:** I kept each stage's score button on its tab so R-2.28's refusal can be reached from the screen. Hiding them would be gentler. This needs a ruling.
- **No criterion behind two surface actions:** `score_resource_questions` and `add_reference`.
- **Team With Us cost formula:** R-2.10 doesn't say hours per day or which days count, so the stories' figures are illustrative.
- **Dashboard:** no criterion gives the columns, row order or empty messages.
- **Two-step confirmations:** the surface names one step for each dialog action (same as the opportunities domain's gap 10).
- **Anonymity on export-all:** the choice has no surface action; I used a checkbox.
- **Attachments on Sprint With Us and Team With Us manage pages:** the control is there, but the surface names it only on Code With Us.
- **Team With Us export:** the one-proposal export is missing `anonymous_proponent_name`.
- **Anonymity leaks:** team member names can identify a proponent the design shows as "Proponent 1".
- **Anonymous name for vendors:** no criterion says when a vendor learns it; the design shows it only after the decision.
- **Withdrawal after award:** R-2.23 says "at any time", so Withdraw stays offered; what that does to an award isn't stated.

**What I could not do.** I couldn't run a script, a typecheck or the scan here, so the stories were written by hand. They use only components and props that sibling stories already compile with, and I restructured a few spots to avoid a fourth heading level I couldn't verify. There was no earlier report for this domain to read.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer

Question: do the 17 proposals pages serve their criteria, and are they built from the design system? Ruling: approve. Evidence: design/report.json lists all 115 proposals stories, records zero accessibility violations across the catalogue, and passes typecheck and build. Every action and observation on the 17 proposal-* pages in spec/contract/surface.yaml has a test ID. A sample of about 30 of those IDs (stage score buttons, screen in/out, dashboard section links and tables, wrong-stage alert, list-stub placeholder, anonymous name) all appear in the stories. A search for written-out colours or sizes (hex, px, rem, rgb) in the proposals stories finds none. There are no raw interactive HTML elements and no fourth heading level. The only non-design-system parts are the badge, key-facts list, fieldsets, tables and tab navigation, all reused from earlier domains and named in DESIGN.md as the project's own. The tier is STANDARD and no confidence score falls below its threshold, so no escalation is triggered. The 18 recorded gaps are open spec and contract questions, not invented behaviour, and the persona accepts missing states. What would change this ruling: any violation on a rerun of the scan, or the report's catalogue fingerprint not matching the stories on this branch.

**Conditions:**
- The spec stage must rule on gap 4: whether a stage's score button is shown at the wrong stage so that R-2.28 can be reached, or hidden until its stage. The build follows that ruling.
- The spec stage must resolve gap 3: what a vendor's history shows about score entries before award (R-2.9, R-2.32, R-2.35). The design shows only the decided case.
- The contract stage must resolve the surface gaps: history_tab on proposal-*-edit (gap 2); attachment actions on proposal-swu-edit and proposal-twu-edit (gap 12); anonymous_proponent_name on proposal-twu-export-one (gap 13); an action for the export-all anonymity choice (gap 11); confirm_* entries or acceptance of the two-step dialog binding (gap 10); and removal of proposal-list-stub, as the obsolete D-proposals-37 says (gap 1).
- The checks DESIGN.md lists as still required (keyboard use of the multi-part forms, screen-reader checks of the terms and score dialogs, 400% zoom of the team tables) must be done before the build is accepted.
