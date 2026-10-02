---
gate: G-DESIGN
question: "Do these screens serve the files criteria, and are they built out of the design system?"
recommendation: "I re-laid all 28 existing story files in the files domain with the shared page container and stack."
opened: 2026-10-02T00:07:46.054Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the files criteria, and are they built out of the design system?

**Recommendation.** I re-laid all 28 existing story files in the files domain with the shared page container and stack.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I re-laid all 28 existing story files in the files domain with the shared page container and stack. I also designed one page that had never been designed: `file-attach-by-identifier`, which is in the surface but had no stories, no entry in `screens.yaml` and no test IDs. I couldn't compile or scan anything myself. The pipeline does that once I stop, and its last report showed every files-domain story compiling with no accessibility violations.

**Layout.** The content domain had already defined `PageContainer` and `Stack` in `design/catalogue/layout.tsx`, so I reused them. Every story is now one container holding one `Stack gap="large"`, with the same rhythm as the content domain: `large` between regions, `medium` between items, `small` between a label and what it labels. No story in this domain sets its own width, outer padding, margin or gap any more. All 30 story files import the layout module.

The cards and attachment rows keep their own border and inner padding, which belongs to those components, and lay out their contents with a stack. The only non-spacing values left in the stories are those that keep a picture inside its column. On the published image I added `align-self: flex-start`, because a column stack would otherwise stretch the image to the full column width.

**One change to the shared stack.** The attachment list, the opportunity tabs and the public view's download links are lists, and `Stack` could not render as a list. I added `as="ul"` and `as="ol"` to it, rendering a list with no markers and no indent. The change only adds options; no other domain's story used a list as a stack, so none of them changes. I recorded it in `DESIGN.md`.

**What looks different.** I kept every page, state, test ID, component and word as it was. Two visible changes came with the new layout:
- The public view's download links lose their bullets.
- Some gaps moved one step to fit the rhythm:
  - the tabs went from `large` to `medium`;
  - the heading block and the gap between a fact's term and its value went to `small`;
  - the editor's parts went from `medium` to `small`, so it matches the content domain's editor.

The response references no longer use `--layout-margin-xsmall`. All of this is written down in `DESIGN.md`.

**The new page.** `file-attach-by-identifier` has two states, `default` and `refused`. Both are response references like the other three service addresses: they show what is sent and what comes back, and a build does not render them. Only one accepted criterion, R-8.22, governs this page: a file may be attached only by someone permitted to read it. Its two outcomes, accepted and refused, are the two states, so I added no others.
- **`default`:** a vendor attaches a file they uploaded to their own Code With Us proposal.
- **`refused`:** a vendor names the identifier of a file another vendor uploaded and marked readable by no one else.

I filled in its four test IDs in `spec/contract/surface.yaml`:
- `attach_stored_file` → `file-attach-request`
- `attachment_accepted` → `file-attach-accepted`
- `attachment_refused` → `file-attach-refused`
- `attached_file_identifiers` → `file-attach-identifiers`

No test ID that was already filled in changed.

**Gaps I recorded rather than filled** (files gaps 14 and 15 in `DESIGN.md`):
- **What a refused attachment looks like.** R-8.22 does not say which kind of refusal it is, or whether the rest of the save is kept. It also does not say what happens with an identifier no stored file carries; R-8.15, which it replaces, checked only that the file exists. The `refused` story claims only what R-8.22 fixes: the file is not attached, the record's attachments are unchanged, and nobody new can read the file. Its outcome line and message are my own wording.
- **No screen can attach a stored file by its identifier.** The attachment control only uploads new files, so R-8.22 can only be met or broken through the address.

**Components leaned on most:** the design system's `Heading`, `Text`, `Button`, `TextField`, `Link` and `InlineAlert`, plus `FileTrigger` and `Toolbar` from `react-aria-components`. The project's own components (the page container, the stack, the card section, the attachment list, the picture preview, the response reference and the status line) are all listed in `DESIGN.md` as the project's own. I added no new component.

I wrote nothing outside `design/` and the four test IDs in `spec/contract/surface.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Do these screens serve the files criteria, and are they built from the design system? Yes. All 30 files-domain stories import layout.tsx and sit in one PageContainer holding one Stack gap="large". They follow the content domain's rhythm (large between regions, medium between items, small between a label and what it labels), and no story sets its own width, outer padding, margin or gap. A search of the stories finds no hard-coded pixel or hex value. The only non-token values are max-width, height:auto and align-self on images, which keep a picture inside its column. The one change to the shared Stack adds as="ul"/"ol", which removes markers and indent through --layout-padding-none. Nothing that already existed changes, and DESIGN.md names it as the project's own. design/report.json shows 495 stories, 0 violations and 0 failures, including both new file-attach-by-identifier states. The surface.yaml diff only fills four test IDs that were null for the new page (file-attach-request, -accepted, -refused, -identifiers) and changes none that was already filled in. The new page's two states match R-8.22's two outcomes, accepted and refused. What R-8.22 leaves open (the kind of refusal, whether the rest of the save is kept, an identifier no file carries, no screen to attach by identifier) is recorded as files gaps 14 and 15 rather than invented. In the screenshots I looked at (attachment control default and public view, attach-by-identifier refused, embedded image default and published, image picker default), the content lines up on the same left edge inside the 1100-pixel column that matches the design-system header, and the spacing is even with no doubled gaps. The card and attachment rows add only their own inner padding. The profile and embedded images show as broken with alt text because the catalogue does not serve /api/files. That is not a layout or token defect. What would change this ruling: an accessibility violation in the next scan, a change to a test ID that was already filled in, or a story setting its own width, padding or gap outside the stack.

**Conditions:**
none
