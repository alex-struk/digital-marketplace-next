---
gate: G-DESIGN
question: "Do these screens serve the content criteria, and are they built out of the design system?"
recommendation: "While doing that I also designed `content-request`, which had no screen at all, and filled the content domain's last 11 empty test IDs."
opened: 2026-10-01T23:47:13.349Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the content criteria, and are they built out of the design system?

**Recommendation.** While doing that I also designed `content-request`, which had no screen at all, and filled the content domain's last 11 empty test IDs.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've moved all of the content domain's stories onto the new shared layout. While doing that I also designed `content-request`, which had no screen at all, and filled the content domain's last 11 empty test IDs. Nothing was compiled or scanned in this turn; the pipeline does that next and writes `design/report.json`.

**The layout.** No other domain had made `design/catalogue/layout.tsx`, so I wrote it. It holds two pieces:
- **`PageContainer`**: one column at most 1100 pixels wide, centred, with `--layout-padding-medium` on each side. The 1100px value is written only here.
- **`Stack`**: a column, or a row that always wraps. Its gap is the small, medium or large `--layout-margin-*` token and nothing else. It removes the built-in margins of the design system's `Text` and `Heading`, and of `dt` and `dd`, from the items inside it. It accepts no `style` or `className`, so a story can't add spacing beside it.

Every content story now sits in one container with a stack of regions inside it. No story sets its own width, outer padding, margin or gap.
- **Gaps:** large between the regions of a page, medium between the items of a region, and small between a label and what it labels (for example, "Manage a page" over the H1, or the address field with its rule).
- **Rows:** the list's title row, the key facts, the formatting toolbar and the loading rows are now wrapping row stacks, so nothing is pushed off a 320-pixel screen or at 400% zoom.
- **Footer:** it sits after the container, because the design system's `Footer` centres its own content.
- **Styles still in stories:** the data table's cells and its scrolling area, the status badge, the two placeholder frames, and bold `dt` labels. These belong to components, not to page layout.

Every existing page, state, test ID, component choice and line of wording is unchanged. The only structural change was grouping "Manage a page" with its H1 in the two dialog stories, where they had sat a full region gap apart.

**`content-request`.** This page is in the surface and had nine empty test IDs, but no state or story; it probably arrived after this domain was first designed. That goes beyond the operator's "layout only" brief. I did it anyway because filling every null test ID on this domain is part of this stage's job, and no existing ID changed. Like the users and files domains' request pages, it is a reference card of request and answer rather than a screen. The requests use the methods in `openapi.yaml`. It has four states, one per distinct answer:
- `default`: an administrator's six requests are all answered.
- `refused`: anyone else is refused in one permission-refusal form (R-7.10, R-7.16).
- `invalid`: wrong-length fields, a badly formed address, an address in use, renaming or removing a page the service needs, or reading a malformed address (R-7.20 to R-7.22, R-7.25, R-7.3).
- `not-found`: reading an address no page holds (R-7.2).

**Test IDs filled in:**
- **Requests:** `content-request-read-list`, `-read-page`, `-create`, `-change`, `-rename` and `-remove`, one per request.
- **Answers:** `content-request-accepted`, `content-request-refusal-status` and `content-request-refusal-shape`.
- **Public page:** `body_element_names` and `body_script_ran` on `content-view` both point to the existing `content-page-body`.

**New gaps, recorded in `DESIGN.md` as 15 to 18:**
- **15:** R-7.16 lists reading one page among requests refused for lack of permission, but R-7.1 lets anyone read a page. The `refused` story therefore shows five requests, not six.
- **16:** `body_script_ran` is a browser dialog, not an element. Its ID marks only the body the test waits for before watching.
- **17:** No criterion gives status numbers or a refusal's fields, and none says which kind of refusal R-7.25's rename or removal of a needed page gets. I filed it under `invalid`.
- **18:** I had to guess whether the 1100px width includes the side padding (I counted it inside). I also added `--layout-padding-large` above and below, which the layout rule doesn't mention, because the catalogue renders full-screen. If either is wrong, it changes in `layout.tsx` alone.

Gaps 1 to 14 from the earlier run still stand.

**Components relied on most:** the design system's `Heading`, `Text`, `TextField`, `TextArea`, `Form`, `Button`, `ButtonGroup`, `InlineAlert`, `Link`, `Modal`/`AlertDialog`, `ProgressCircle`, and `Footer` with `FooterLinks`. The project's own components, each listed and justified in `DESIGN.md`, are now `PageContainer`, `Stack`, the body editor, the formatted-text renderer, the key-facts list, the data table and the status badge.

I edited only files under `design/` and the content pages' test IDs in `spec/contract/surface.yaml`; nothing else under `spec` was changed.

## Ruling

**Verdict:** return
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Do the content screens serve their criteria and use the design system? Return. Accessibility is clean: design/report.json shows 493 stories and 0 violations, including the four new content-request stories. The 11 test-ID changes in surface.yaml all replace null, so no existing ID changed. Spacing comes from design tokens; the only literal size is the 1100px in layout.tsx, which no token carries. PageContainer and Stack are standard HTML styled with tokens, and DESIGN.md names them as the project's own. The screenshots show an even large/medium/small rhythm with no doubled margins. content-request follows the users and files domains' response-reference pattern, and its gaps 15-17 are real problems with the criteria. The one failure is alignment, which this proposal's gap 18 raised itself and the screenshot settles: in content-footer.default.png at 1280px, the page content starts at x=106 and the design system's Footer content at x=90. PageContainer puts its side padding inside the 1100px (border-box), while the Footer uses its 1100px for content alone, so every screen is 16px off the banner. Lining up with the banner is the purpose of this layout, and every later domain will copy layout.tsx, so this is fixed here rather than left as a note. A revision where the content's left edge matches the Footer's at desktop width, with nothing else changed, would be approved.

**Conditions:**
- In design/catalogue/layout.tsx, make PageContainer's content column match the design system's Header and Footer content width. Its left edge must line up with the Footer's (x=90 at a 1280px viewport, where it is now x=106). For example, set maxWidth to calc(1100px + 2 * var(--layout-padding-medium)) under border-box, so the side padding sits outside the 1100px. Keep 1100px written only in layout.tsx, and update DESIGN.md's page-container entry and gap 18 to say what is now true. Shown by content-footer.default.png: the container's content starts 16px (one --layout-padding-medium) to the right of the Footer's content.
