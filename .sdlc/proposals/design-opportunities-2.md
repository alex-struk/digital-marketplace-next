---
gate: G-DESIGN
question: "Do these screens serve the opportunities criteria, and are they built out of the design system?"
recommendation: "I made the three changes the ruling asked for."
opened: 2026-09-19T06:53:37.765Z
---

# Do these screens serve the opportunities criteria, and are they built out of the design system?

**Recommendation.** I made the three changes the ruling asked for.

I made the three changes the ruling asked for. I could not re-run the scan, so `design/report.json` is still the old copy with the old home-page titles. The pipeline scans the catalogue after my turn ends, and that scan is what should fix it.

**Home page story titles.** The home page's two stories are now titled `opportunities/home-page/default` and `opportunities/home-page/loading`. Before, they had the same names with `/home/` in them, which the egress check read as a home directory. Only the `title` line changed in each file, and the markup and test IDs are the same. No committed file under `design/` contains `/home/` now, except `design/report.json`.

**Gap 24 and the components note in `design/DESIGN.md`.** Gap 24 now says the pipeline typechecks and builds the catalogue, runs axe over every story and writes the result to `design/report.json`. It also names the two new home-page titles. I kept the entry under number 24, marked as not a gap in the criteria, so the numbers of the gaps after it stay the same. The note above the "Components this domain is built from" table used to point to gap 24 as an unfinished check. It now says the catalogue compiles against the design system's type declarations.

I changed nothing else: no other screen, no other state, no test ID, and nothing in `spec/contract/surface.yaml` or `design/screens.yaml`.

**The condition I left for the pipeline.** The condition to re-run `node scan.mjs` needs approval to run Node, and that approval was not given this turn. So `design/report.json` still carries the old titles and a catalogue digest that no longer matches. When the pipeline's scan runs after this turn, the report should match the catalogue and the egress check should pass. The last scan found 0 violations across 151 stories, and renaming two titles changes no markup. Until that scan has run and the report shows it, whoever rules this gate should not treat the report condition as met.

**Earlier review points, unchanged.** No new gaps came up. The components I leaned on most are the same as before, and all come from `@bcgov/design-system-react-components` 0.8.1: `Heading`, `Text`, `Button`, `ButtonGroup`, `Link` and `TextField`. The project's own components are still listed as such in `design/DESIGN.md`.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer

Question: do the opportunities screens serve the opportunities criteria, and are they built from the design system? Approved. The condition the proposal left open is met. design/report.json on the branch was rescanned at 2026-09-19T06:52:43Z and lists the renamed stories opportunities/home-page/default and opportunities/home-page/loading. It reports ok: true, the typecheck and build passed, and no story has any accessibility violations. The egress check and the report-freshness check both pass. The components come from @bcgov/design-system-react-components 0.8.1. The status badge, key-facts list, cards, fieldsets, table and tab navigation are built from standard HTML, styled only with tokens, and named in design/DESIGN.md as the project's own. The stories use design tokens with no typed colour or spacing values. The gaps in the criteria are recorded rather than filled with invented behaviour, which this persona accepts. The test warnings are about other domains. This ruling would change to return if a later scan found any violation or a compile failure, or if the catalogue changed without a matching new report.

**Conditions:**
- design/report.json must be regenerated, and still show zero violations, whenever a catalogue story changes before merge
- Before the build is accepted, the manual accessibility checks that design/DESIGN.md lists as outstanding must be done: keyboard-only use of the long forms, multi-select and DatePicker, screen-reader checks of the dialogs and error summary, and 400% zoom
