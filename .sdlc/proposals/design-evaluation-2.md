---
gate: G-DESIGN
question: "Do these screens serve the evaluation criteria, and are they built out of the design system?"
recommendation: "I brought all 97 of the evaluation domain's existing stories into line with the new layout rule."
opened: 2026-10-02T01:21:15.804Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the evaluation criteria, and are they built out of the design system?

**Recommendation.** I brought all 97 of the evaluation domain's existing stories into line with the new layout rule.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I brought all 97 of the evaluation domain's existing stories into line with the new layout rule. I also designed the domain's five request addresses, which no earlier run had designed. I couldn't compile or scan anything myself: the pipeline does that after this turn and writes `design/report.json`. The previous report was clean for every story.

**Layout.** I didn't create a new container or stack, because the content domain had already defined both in `design/catalogue/layout.tsx`. Every evaluation story now sits inside that one page container, with one large-gap stack holding the page's regions. The small page-kind line and the heading under it are grouped with the small gap. Status rows, tab lists and loading rows are wrapping row stacks, and each form holds one medium-gap stack. Inside a fieldset the legend stays first and everything after it is one stack. No story sets its own width, outer padding, margin or gap any more. The only spacing a story still writes is inside the project's own boxes: fieldset and section padding, the response block's padding, the badge's and legend's inline padding, and table cell padding.

I converted two stories by hand as models and wrote a conversion rulebook. Five parallel helpers then converted the rest under those rules, and I spot-checked their output. Every story file now imports the layout. No grid, flex, gap or raw colour/pixel value is left. The test-ID lines across the 80 original story files that carry any still total exactly 549, file by file, the same as before. Pages, states, test IDs, component choices and wording are unchanged.

Three small visual differences followed from the rule:
- The manage-page tab lists and the dashboard's section links had used the large gap; they now use medium, matching the opportunities domain's converted manage page they sit on.
- The extra-small gaps inside a response block and between a key fact's label and value became small, since the rule has three gaps only.
- The key facts on a submitted evaluation are now medium apart instead of large.

In `DESIGN.md` I listed the page container and the stack among this domain's own components. I rewrote "How a screen is laid out" with the large/medium/small rhythm and updated the token list.

**The five request addresses** had no states, no stories and null test IDs, although they are on this domain's page list. They are the Sprint With Us and Team With Us individual-evaluation requests, the two consensus requests, and the panel request. I designed them as response references, the way the users, content and opportunities domains do theirs: a small "Response reference" line and the heading, then a Request section and an Answer section. The states are:

| Address | States | What each shows |
|---|---|---|
| Individual evaluation (both programs) | `default`, `refused`, `duplicate` | A draft stored as sent, unchecked; one evaluation submitted alone refused as unrecognised, and the set refused with the incomplete-evaluation message; a second start refused as a duplicate |
| Consensus (both programs) | `default`, `refused` | The chair's change accepted; a non-chair or late change refused as not permitted |
| Panel | `default`, `refused` | The panel as stored; a member with no role and a panel with no chair, both refused |

That adds 12 stories and 12 entries in `design/screens.yaml`.

**Test IDs filled in the surface:** 37 on the request pages, all named `evaluation-individual-request-*`, `evaluation-consensus-request-*` and `evaluation-panel-request-*`, shared between the two programs as this domain's IDs already are. There were also four `refused_when_not_permitted` nulls on the individual create and edit pages. I bound them to `not-found-page`, which those pages' existing `not-found` stories already render, so no story changed for them. No test ID on this domain's pages is still null; the 99 left in the surface belong to other domains.

**New gaps, added to `DESIGN.md` as 18 to 20:**
- **18.** The surface puts "refused at submission" on the single-evaluation address. But the service only accepts the whole set, sent to the opportunity, so which request reaches that refusal from here isn't stated.
- **19.** No criterion gives the status code of a refused request, so the references don't name one.
- **20.** The criterion on members with no role asks for a message naming the member but gives no words. The wording used is the design's own, and the missing-chair refusal reuses the panel form's message.

The earlier gaps 1 to 17 still stand. I changed nothing under `spec/` other than the surface's test IDs, nothing in `constitution.md`, and nothing other domains wrote in `DESIGN.md` or `screens.yaml`.

**Components leaned on most:** the design system's `Heading`, `Text`, `Link`, `Button`/`ButtonGroup`, `Form` with `NumberField`/`TextArea`/`Select`/`Checkbox`, `InlineAlert`, `Modal` with `AlertDialog`, and `ProgressCircle`. The project's own pieces are all listed in `DESIGN.md`. All but one are reused from earlier domains: the container, stack, status badge, data table, tabs, fieldset group and key facts list. The one this domain added earlier is the response block.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the evaluation domain's screens serve the criteria, and are they built from the design system? Ruling: approve. Every one of the 97 existing stories now sits in the shared PageContainer with one large/medium/small Stack rhythm taken from layout.tsx. The screenshots checked (consensus create default, panel default, dashboard default, consensus list default, individual request refused) show content aligned with the banner column, even token spacing with no doubled margins, and design-system Heading/Text/Link/Button/Form fields/InlineAlert throughout. A search of the evaluation stories finds no raw colour, pixel value or hand-rolled grid/flex. design/report.json lists zero accessibility violations for every story. The surface.yaml diff only replaces null test_ids: the 37 request-address IDs, plus four refused_when_not_permitted bound to the not-found-page their existing not-found stories already render, which R-5.11 and R-5.21 support. No filled test_id was changed. The 12 new request-reference stories cover the states R-5.3, R-5.9, R-5.23, R-5.26, R-5.29 and R-5.37 describe, and the gaps where the spec is silent (18 to 20) are recorded in DESIGN.md rather than invented. Tier is STANDARD, so there is no escalation. Would change on: any accessibility violation in the next scan, a change to an already-filled test_id, or a story found outside the shared container.

**Conditions:**
none
