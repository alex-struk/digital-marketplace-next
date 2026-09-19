| Field | Value |
| --- | --- |
| gate | G-DESIGN |
| opened | 2026-09-19T09:04:00.736Z |
| holder | agent:ux-reviewer |

# Do these screens serve the evaluation criteria, and are they built out of the design system?

**Recommendation.** I designed all 17 evaluation pages.

I designed all 17 evaluation pages. That gives 97 states, each with its own story file, and I filled in all 54 test IDs on those pages in `spec/contract/surface.yaml`. I also appended an evaluation section to `design/DESIGN.md` and the matching entries to `design/screens.yaml`, leaving the other domains' sections as they were. I never saw a compile or accessibility-scan result for this catalogue, so `design/report.json` is the first record of whether these stories build and pass. The earlier report in the workspace predates them and covered only the other domains.

**Screens and states.** Sprint With Us and Team With Us share one design. They differ only in the words the criteria give them: "team questions" or "resource questions", four or three proponents carried forward, and "Code Challenge" or "Challenge". I added a state only where the screen looks genuinely different:
- **Dashboard (Evaluations section):** default (drafts included, per R-5.19), empty, loading.
- **Evaluation panel tab:** default, invalid (the same person named twice, and no chair), too-few (one member, shown as a panel-level error), refused (a member the service rejected, named at their row), locked (from consensus on, shown as a read-only table), not-found (R-5.18), loading.
- **Instructions tab:** default, not-found, loading.
- **Evaluator's list:** default (part-way through, with submit disabled), ready, submitted, refused (R-5.25's exact wording), not-found, loading.
- **Consensus tab:**
  - the chair's views: default, ready, submit-confirm and submitted (still editable, per R-5.30);
  - the administrator's views: finalize-confirm, not-all-submitted and no-screenable (R-5.10's corrected wording);
  - the owner's view: withheld (R-5.12);
  - not-found and loading.
- **Scoring forms:**
  - individual create: default, invalid, duplicate, not-found, loading;
  - individual edit: the same, with submitted (read-only) in place of duplicate;
  - consensus create: default, invalid, duplicate, chair-only (a non-chair panel member can read the evaluators' scores but not record the agreed one), not-found, loading;
  - consensus edit: default, submitted (still editable), invalid, not-found, loading.

**Decisions worth a reviewer's attention:**
- **Finalize button.** "Finalize consensus scores" uses the opportunities domain's existing `finalize-consensus-button`, as that domain asked. The two finalize refusals sit inside its `advance-refused-message` wrapper, so the refusal is one element with an inner ID saying which refusal it is.
- **Chair controls.** The surface names two ways to pick the chair: a Chair field and a per-row Chair checkbox. I kept both and tied them together, so a panel can never hold two chairs.
- **Drafts save as entered** (R-5.23). The form still lists every problem, and the scores can't be submitted until they're fixed.
- **Refusal messages.** For a person who belongs on the page but can't act (the owner who isn't on the panel, a panel member who isn't the chair), the page explains why. Everyone else gets the shared "Page not found" page.

**Components.** I leaned mostly on design-system components: `InlineAlert` (danger for errors and refusals, info for explanatory notices), `NumberField`/`TextArea` inside `Form`, `Select` and `Checkbox` for the panel, `Modal` + `AlertDialog` for the two consensus confirmations, and `Link`, `Button`, `ButtonGroup`, `Heading`, `Text` and `ProgressCircle`. The project's own components are reused from earlier domains: status badge, data table, tab navigation, fieldset groups and the key-facts list. There is one new one, a bordered "response block" for quoting a proponent's answer. It is listed and justified in DESIGN.md: the design system's `Callout` would make every response read as a warning. No colour, spacing or radius value is written anywhere; only tokens other domains already use.

**Gaps (17, all in DESIGN.md).** None of these was filled with invented behaviour. The ones that need a ruling:
- R-5.11 and R-5.28 contradict each other on who may read an individual evaluation, and R-5.28 also contradicts its own note.
- The owner can finalize scores that R-5.12 hides from them.
- It isn't stated whether a chair who doesn't evaluate counts toward the minimum of two panel members.
- The opportunities domain's create-page panel editor is laid out differently from this tab's, and only that domain can change it.

The others:
- Nowhere shows panel members their own panel, although R-5.18 says they see it.
- It isn't stated what a tab's address answers to someone who isn't offered that tab.
- Several refusal and status messages have no wording in the spec.
- The duplicate-consensus refusal has no wording either.
- "Previous proponent" is in the surface only on the individual create page. I also placed it on the individual edit page, with the same ID.
- There is no page where an administrator can read the agreed scores.
- Nothing is designed for after finalizing, for an opportunity with no proponents, or for the other tabs an evaluator might see.
- "Submit scores for consensus" can't be undone but has no confirmation in the surface.
- The instructions text is a placeholder.

**What I couldn't do.** With no shell, I couldn't run the story generator I'd drafted (it sits unused in my scratchpad), so I wrote all 97 files by hand. I kept to component props that already compile elsewhere in the catalogue.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer

Question: do the 17 evaluation screens serve the evaluation criteria, and are they built from the design system? Ruling: approve. design/report.json (generated 2026-09-19T09:01, before the proposal opened) shows typecheck and build passing and all 97 evaluation stories scanned by axe 4.13.0 with zero violations. No hard-coded colour, spacing or pixel values appear in the evaluation catalogue; only design-system tokens are used. Components come from @bcgov/design-system-react-components or are project components reused from earlier domains. The one new component (the response block) is plain HTML styled only with tokens and is named and justified in DESIGN.md as the project's own, which the brief accepts. Every surface ID in spec/contract/surface.yaml is bound to a test ID. Missing screens and states are recorded as gaps rather than invented, which the brief accepts. The tier is STANDARD, so there is no escalation. This ruling would change to return if a re-run of the report showed any axe violation or compile failure for an evaluation story, or if a build introduced literal values in place of tokens.

**Conditions:**
- Before the evaluation build, the spec must rule on gap 3 (the R-5.11 vs R-5.28 contradiction on who may read an individual evaluation) and gap 7 (the owner may finalize scores R-5.12 withholds from them).
- Before the build is accepted, the manual accessibility checks DESIGN.md lists must be done: keyboard use of the two linked chair controls, screen-reader checks of both consensus dialogs, and 400% zoom of the consensus form tables.
- The opportunities domain must align its create-page panel editor with this domain's panel design (gap 2) and add opportunity-tab-instructions and opportunity-tab-evaluation to its tab lists.
