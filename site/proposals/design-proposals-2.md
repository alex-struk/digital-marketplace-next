| Field | Value |
| --- | --- |
| gate | G-DESIGN |
| opened | 2026-10-02T01:42:21.133Z |
| holder | agent:ux-reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these screens serve the proposals criteria, and are they built out of the design system?

**Recommendation.** I moved all 115 proposals-domain stories onto the shared page container and stack, covering all 17 designed pages and every state they declare.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I moved all 115 proposals-domain stories onto the shared page container and stack, covering all 17 designed pages and every state they declare. Nothing else in the stories changed: every page, state, test ID, component choice and word is as it was. I had no compiler, so nothing was type-checked or rendered; the pipeline's scan after this turn will be the first real check.

**What I changed.** `design/catalogue/layout.tsx` already existed from the content domain, so I reused it unchanged. Every story now uses one `PageContainer` with one `Stack gap="large"` inside it. No story sets its own width, outer padding or gap any more. The spacing rhythm is the same one the other domains use:
- **Large** between the regions of a page.
- **Medium** between form fields, between a section's heading and what follows it, between the key facts, between tabs and between list rows.
- **Small** between the small page-kind line and the H1, between a `dt` and its `dd`, between a question and its response, and between a loading spinner and its text.

The bordered cards, fieldsets and attachment rows keep their border, radius and inner padding, and lay out their contents with a stack. A fieldset's `legend` stays its first child so it still names the group. Dialog bodies are a padded `div` holding a stack. On not-found screens, the `not-found-page` test ID moved from the outer `div` to the outer stack, because the container takes no attributes; the opportunities domain does the same.

I converted one story myself as the model and split the other 114 across six helper agents working to written rules. I then checked them against a snapshot of the originals I had taken first:
- **Imports:** all 115 import the layout.
- **Test IDs:** there are 830 test-ID attributes in both the old and new versions, spread over the same 102 files.
- **Leftover spacing:** no spacing constant, grid or flex display, or `Form` style remains.
- **Spot checks:** a line-by-line diff of three stories showed only layout changes.

I fixed one place an agent left wrong: on the Team With Us manage page, a question and its response sat in a list item with no stack between them.

**Design system use** is what it was. The stories still lean on `Heading`, `Text`, `Button`/`ButtonGroup`, `Link`, `TextField`, `TextArea`, `NumberField`, `Select`, `Checkbox`, `RadioGroup`, `Form`, `InlineAlert`, `Modal` with `Dialog`/`AlertDialog`, and `ProgressCircle`. No new component was added. In `DESIGN.md` I added the page container and stack to the domain's list of the project's own components, and rewrote the domain's token list and "How a screen is laid out" to match the new layout.

**Gaps, recorded in `DESIGN.md` as L1–L5:**
- **L1. Question numbers are gone.** The stack removes list markers, so the numbered question lists on the Sprint With Us and Team With Us manage pages no longer show visible numbers. Screen readers still announce the order. Other domains already accept this.
- **L2. Some gaps are tighter.** The single rhythm made some old gaps tighter: key facts and tabs went from large to medium, and a `dt` above its `dd` went from extra-small to small. The Scores heading went the other way, from small to medium. I invented no token to keep the old look.
- **L3. Tables keep their own sizing.** They keep `width: 100%` and their cell padding, as other domains' tables do.
- **L4. 23 test IDs on this domain's pages are still `null`.** They are entries the surface added after this domain was designed, such as `field_errors_by_field`, `team_member_choices`, `history_entries`, `rank`, and `choose_organization` on the manage pages. Several match elements the stories already carry. I left them `null` because this run was ordered to change no element or test ID, and the opportunities domain made the same call on its own layout pass. Binding them needs a design run for this domain.
- **L5. Three request pages have no screens or stories at all.** They are `proposal-cwu-request`, `proposal-team-request` and `proposal-evaluation-request`, and all their test IDs are `null`. This run added no pages or states, so they are left for the next design run.

I didn't change `design/screens.yaml` or `spec/contract/surface.yaml`, and touched nothing outside `design/`.

## Fix turn

The three request pages that failed the screens check (`proposal-cwu-request`, `proposal-team-request` and `proposal-evaluation-request`) now each have a screen and a story for every state, and their test IDs are filled in. I could not compile or scan the new stories myself. The pipeline's scan after this turn will show whether they pass.

**Journal addition.** I added the three pages to the end of the proposals entries in `design/screens.yaml`, each with two states: `default` for an accepted answer and `refused` for a refusal. Those two states match the way the surface splits each page's observations. I wrote the six stories under `design/catalogue/` as response references, built the same way as the evaluation domain's request pages. Each one sits in the existing `PageContainer` and `Stack` from `layout.tsx` and uses only the design system's `Heading` and `Text` plus plain definition lists. The refusal examples come straight from the criteria: R-2.2's duplicate-proposal message, R-2.18's "not an active member" and "unique team members" messages, and R-2.28's wrong-stage message. In `spec/contract/surface.yaml` I replaced every `test_id: null` on the three pages with the ID the stories actually render, in the forms `proposal-cwu-request-*`, `proposal-team-request-*` and `proposal-evaluation-request-*`. In `design/DESIGN.md` I marked gap L5, which had said these pages had no screens, as resolved. I then appended a "Request addresses" subsection describing how the three pages are built, with four new gaps I did not fill:
- **R1:** the criteria give no refusal status for a Code With Us proposal or a stage score. The team request's 400 and 503 come from the surface.
- **R2:** no criterion says which field R-2.2's message is reported against.
- **R3:** no criterion names a proposal's status after a stage score is accepted.
- **R4:** neither the criteria nor the surface gives the requests' HTTP methods, so the stories name none.

No other page, state, test ID or wording was changed.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the proposals screens serve their criteria and use the design system? Approve. design/report.json covers 530 stories, including the six new request-page stories, with 0 accessibility violations and 0 failures. Every surface.yaml edit replaces a test_id that was null on proposal-cwu-request, proposal-team-request or proposal-evaluation-request; no filled test ID changed. The three request pages now have default and refused states in screens.yaml with stories, and their refusal wording is quoted from R-2.2, R-2.18 and R-2.28. A scan of the proposal stories finds no colour literals, pixel sizes, grids or ad-hoc gaps; the only remaining spacing is var(--layout-margin-none) on fieldsets, which DESIGN.md documents. PageContainer and Stack are the project's own components and DESIGN.md names them so. In the screenshots reviewed (create, SWU evaluate, TWU manage, dashboard, team-request refused, score dialog) content sits in the shared container with one left edge and one large/medium/small token rhythm, with no doubled gaps. Gaps L1 (question numbers not shown, order still announced), L2 (a few gaps tighter or looser under the single rhythm) and L4 (23 surface test IDs still null, left for this domain's next design run) are recorded in DESIGN.md and fall under what this persona accepts as missing states rather than violations. Tier is STANDARD, so no escalation. A new accessibility violation, a token bypassed, or a change to an already-filled test ID would turn this into a return.

**Conditions:**
none
