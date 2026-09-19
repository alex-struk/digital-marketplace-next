---
gate: G-DESIGN
question: "Do these screens serve the opportunities criteria, and are they built out of the design system?"
recommendation: "I designed the opportunities domain's screens: all 17 pages, 97 stories, the test IDs on every page, and a new \"Domain: opportunities\" section appended to `design/DESIGN.md`."
opened: 2026-09-19T06:49:42.003Z
---

# Do these screens serve the opportunities criteria, and are they built out of the design system?

**Recommendation.** I designed the opportunities domain's screens: all 17 pages, 97 stories, the test IDs on every page, and a new "Domain: opportunities" section appended to `design/DESIGN.md`.

I designed the opportunities domain's screens: all 17 pages, 97 stories, the test IDs on every page, and a new "Domain: opportunities" section appended to `design/DESIGN.md`. **The catalogue has not been compiled or accessibility-scanned.** Running Node and Python needed approval that this session did not get, so `design/report.json` still describes the earlier catalogue and `node scan.mjs` must be run before this gate is ruled on. To reduce the risk, I checked every component and prop by hand against the type declarations of an installed copy of the design system (0.8.1) found outside the workspace, and every token name against the tokens package (5.0.0). No colour, pixel or rem value appears anywhere in the new stories.

**Screens and states.** I declared a state only where the screen really differs: a different role sees different controls, a different stage offers different actions, or a refusal, dialog or loading state replaces the content. The three programs share one layout and one set of test IDs, and differ only in the sections their criteria require.
- **home:** default, and loading (only the awarded figures wait).
- **Dashboard:** a staff member's own opportunities, an administrator's view of all of them, empty, and loading.
- **Opportunity list:** a signed-in vendor with Watch, staff (adds their own Unpublished group and hides Watch on their own opportunities), signed out, and loading.
- **Program select:** default, and not-found.
- **Each create page:** staff (Save draft and Submit for review), administrator (Publish instead), invalid, publish confirmation, and not-found. Each program's invalid story shows its own rules.
- **Each view page:** vendor on an open opportunity, signed out, author (sees who created and last changed it), awarded (winner's name only), not-found, and loading.
- **Each manage page:** closed with reporting counts, draft, under review, editing, incomplete, the addenda and history tabs, the publish, cancel and delete confirmations, not-found, and loading. Sprint With Us and Team With Us add consensus and consensus-refused; Sprint With Us also adds code-challenge and team-scenario-refused.
- **Each complete report:** default, not-found, and loading.
- **`/status`:** default.

**Invalid edits get no story of their own.** They are presented exactly as the create pages' invalid states, and DESIGN.md says so.

**Test IDs.** Every `test_id` on this domain's pages in `spec/contract/surface.yaml` is filled, and each one appears in a story for that page. Shared elements keep one ID across pages (`opportunity-status`, `opportunity-watch-toggle`, the `opportunity-tab-*` links). I reused the users domain's `field-error` and `not-found-page`. Four bindings are less obvious:
- `edit_evaluation_panel` is the Evaluation panel tab link.
- `set_evaluation_panel` is the container around the panel controls; the controls inside it are the evaluation domain's to name.
- `run_pending_transitions` is the wrapper of the page `/status` returns.
- `own_opportunities_only` and `all_opportunities_for_administrator` share the dashboard's row ID; a test tells them apart by which rows it finds.

**Components.** The screens lean mostly on design-system components: Heading, Text, Button, ButtonGroup, Link, TextField, TextArea, NumberField, DatePicker, Select, RadioGroup, Checkbox, Form, InlineAlert, Modal with AlertDialog, and ProgressCircle, plus FileTrigger from react-aria-components. Two choices worth a reviewer's eye:
- **Watch is a Checkbox, not the design system's ToggleButton**, so its state shows as a tick and not only as colour.
- **Number fields have no min or max.** The limits are stated in the field's description and checked on submit, so a typed value is never silently changed and the rejections the criteria describe can be shown.

The project's own components are listed openly in DESIGN.md: the status badge, table and tab navigation reused from the users domain, plus a key-facts list, an opportunity card, a card section and a repeated-item fieldset.

**Decisions a reviewer should check:**
- **Confirmations.** Publish, Cancel opportunity and Delete each open a confirmation dialog, but the surface names only one action for each. The adapter has to press the documented `*-confirm` button as well; alternatively the surface gains `confirm_*` entries.
- **Administrators on create** get Publish in place of Submit for review; R-1.48 doesn't say whether they should have both.
- **Refusals** on create pages and reports show the shared "Page not found" page, as the users domain does, because the criteria only say "refused".

**Gaps.** DESIGN.md records 25 gaps for the spec. The ones most likely to need action are:
- **Two names for one finalize control.** The manage page's `finalize_question_consensuses` and the evaluation domain's `finalize_consensus_scores` are the same action. It sits in the shared action bar as `finalize-consensus-button`, and the evaluation domain should bind to that rather than add a second control.
- **Tab contents with no owner.** The surface names the Proposals, Team questions, Code challenge, Team scenario, Resource questions and Challenge tabs, but no page and no criterion covers what is on them, so they are not designed.
- **Home figures undefined.** No criterion defines the awarded count or value, so the numbers are illustrative.
- **Undefined wording and states.** Nothing says what an empty list group, a search with no matches, a failed Watch or a cancelled opportunity shows. The dashboard's order and empty-message wording are not given either.
- **Open rulings the design followed without deciding:** Team With Us has no private note (R-1.33), deleting an opportunity under review (R-1.53), and the list's status filter lacking Processing and Cancelled (R-1.39).
- **Missing content.** The skills list, the five Team With Us service-area names and the program descriptions are not in the spec; the stories use placeholders marked as such.
- **Rich text.** The description needs a formatted-text editor, which the design system does not have; the stories use a plain text area for now.
- **Empty date pickers.** Setting a date needs a package the catalogue does not declare, and I don't own `package.json`.

## Ruling

**Verdict:** return
**By:** agent:ux-reviewer

Question: do the opportunities screens serve the criteria, and are they built from the design system? Ruling: return. Reason: the egress check fails. The home page's Storybook titles ('opportunities/home/default' and 'opportunities/home/loading') contain '/home/', which the local-home-path rule reads as a home directory, and design/report.json copies those titles. It is a false positive, not a path leak, but this gate does not pass a failing check. The rest of the proposal meets the bar. report.json was regenerated at 2026-09-19T06:48:53Z, before the proposal opened: typecheck and build pass, and axe reports 0 violations across 151 stories, so the proposal's statement that nothing was compiled or scanned is out of date. The new opportunity stories contain no typed pixel, rem or em values and no hex or rgb colours. Components come from the design system, and the project's own components (key-facts list, opportunity card, card section, repeated-item fieldset, and the users domain's badge, table and tab links) are named as its own in design/DESIGN.md. Watch as a Checkbox instead of ToggleButton is justified because its state shows as a tick, not only as colour. The tier is STANDARD, so nothing needs a human. What would change the ruling: rename the home page's story group so no title contains '/home/', re-run the scan so report.json matches the catalogue with 0 violations and the egress check passes, and correct gap 24 and the proposal text so they no longer say the catalogue is unscanned. With those done, this approves.

**Conditions:**
- Rename the home page's Storybook titles (for example 'opportunities/home-page/default' and 'opportunities/home-page/loading') so no committed string contains '/home/'.
- Re-run node scan.mjs so design/report.json matches the current catalogue digest, reports 0 violations, and the egress check passes.
- Correct gap 24 in design/DESIGN.md and the proposal's summary so they state the catalogue was compiled and scanned, without describing the earlier text.
