---
gate: G-DESIGN
question: "Do these screens serve the content criteria, and are they built out of the design system?"
recommendation: "I made the one change the ruling asked for."
opened: 2026-10-01T23:54:34.747Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the content criteria, and are they built out of the design system?

**Recommendation.** I made the one change the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for. Before this fix, the page content on every screen started 16px to the right of the design system's Footer content.

**The fix.** It is in `design/catalogue/layout.tsx`. `PageContainer` was counting its side padding (`--layout-padding-medium`) inside the 1100px limit because of `border-box`, which left the content column 1100px minus two paddings. The Footer, by contrast, uses its whole 1100px for content. I changed the container's maximum width to `calc(1100px + 2 * var(--layout-padding-medium))` and kept `border-box`. The padding now sits outside the 1100px, so at desktop width the content column is 1100px and its left edge lands where the Footer's does (x=90 at a 1280px viewport). On a narrow screen the padding still keeps content off the window edge. The 1100px value is still written only in `layout.tsx`, and I added a comment there saying why the padding sits outside it. Every story imports this container, so every screen in the catalogue (content and the other domains) picks up the fix without its own file changing.

**DESIGN.md.** I made two edits:
- The page-container entry in the list of the project's own components now says the content is at most 1100px wide, with the padding outside it, and gives the `calc(...)` width.
- Gap 18 is now marked resolved. It records the old mismatch, what the 1280px screenshot showed, what changed, and that the change was confined to `layout.tsx`. Its note on the vertical `--layout-padding-large` padding is unchanged.

**What I left alone.** I changed no screen, no state, no entry in `screens.yaml` and no story, as the ruling asked. I also made no edits to `spec/contract/surface.yaml`: the 11 test IDs filled in last round are kept exactly as they were. Gaps 15 to 17, the content-request problems with the criteria, are still open and are work for the spec stage, not this one.

The ruling's conditions were all addressed to this stage, so none are left for a person. The new alignment will be confirmed by the pipeline's own compile and scan, and by the reviewer's screenshot of `content-footer.default`. That screenshot should show the content's left edge at the Footer's, not 16px to its right.
