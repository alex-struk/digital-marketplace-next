---
gate: G-DESIGN
question: "Do these screens serve the users criteria, and are they built out of the design system?"
recommendation: "The catalogue hasn't been compiled or scanned yet: that runs when my turn ends and writes `design/report.json`."
opened: 2026-10-02T00:45:18.706Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these screens serve the users criteria, and are they built out of the design system?

**Recommendation.** The catalogue hasn't been compiled or scanned yet: that runs when my turn ends and writes `design/report.json`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've brought all 60 users-domain stories into line with the new layout rule, changing layout only. The catalogue hasn't been compiled or scanned yet: that runs when my turn ends and writes `design/report.json`. The last report from before this change compiled cleanly and found no accessibility violations on any of these 60 stories.

**What I did.** The content domain had already defined the page container and the stack in `design/catalogue/layout.tsx`, so I reused them unchanged and did not touch that file. Every users story now wraps its content in one `PageContainer` holding one `Stack gap="large"`. Each section is a `Stack as="section" gap="medium"`, and each form is a design-system `Form` holding one `Stack gap="medium"`. Every inline `page`, `stack`, `tabs`, `row`, `toolbar`, `facts` and `fact` style object is gone. A grep confirms no users story still sets its own grid, gap, width or outer padding.

These are the only styles a story still sets itself, since the stack cannot supply them:
- the border and inner padding of the sign-in and sign-up cards;
- the rule and padding of each capability row;
- the padding inside the export dialog;
- the table's cell borders and scroll region;
- the status badge;
- the bold `dt` of a response reference.

The rhythm is the one the rule sets:
- **Large** between the regions of a page.
- **Medium** between the items of a region: the fields of a form, the section navigation links, capability rows, the contents of a card or dialog, and the facts of a response reference.
- **Small** between a label and what it labels: the profile-picture label, its "no picture" line and its trigger; the terms links and the agreement box; the Administrator box and its hint or refusal; a capability's box, toggle and description; the spinner and words of a loading row; a `dt` and its `dd`.

**Spacing decisions I made:**
- **Section navigation gap.** It was large; I set it to medium. That matches how the organizations and notifications domains already lay out the same profile navigation.
- **Export dialog gap.** It was large between items; it is now medium, since those items are the fields of one form.
- **Response references.** These used `--layout-margin-xsmall` between a term and its value. That is now small, following the rule and the files domain's response references.
- **Buttons.** Where a button is a direct item of a stack it sits in a plain `div`, so it keeps its own width instead of stretching across the column. Before this, "Export contact list" on the two export states, and "Review and agree to the updated terms" on the two accept-terms states, stretched to the full width.
- **Dialogs.** These are portalled by `Modal`, so in the stories they now sit inside the container but after its stack.

**What stayed exactly as it was.** Every page, every state, every component choice and all wording are unchanged, and so is each story's title. I compared the count of `data-testid` attributes in each file before and after: all 56 files that carry IDs match, 365 in total. Every action and observation on the 17 users pages in `spec/contract/surface.yaml` already had a test ID from the earlier run, and each still appears on an element that does what the surface says. So I did not edit `surface.yaml`, and `design/screens.yaml` needed no change because no state was added or removed.

**DESIGN.md.** In the users section:
- The page container and the stack are now listed under the project's own components, beside the profile section navigation, the status badge and the user table.
- "How a screen is laid out" is rewritten to describe the container, the stack and the three gap sizes.
- The token line now names `--layout-padding-medium` (used by the container) and the bold font-weight token, and drops `xsmall`, which is no longer used.

Nothing outside the users section was touched.

**Gaps.** Layout raised no new gap. The eleven gaps already recorded in the users section still stand, for example no designed empty state for a user-list search that matches nobody, and no status number stated for a refused request.

**Components leaned on most:** `Heading`, `Text`, `TextField` (read-only for profile details), `Button`, `Checkbox`, `Link`, `InlineAlert`, and `Modal` with `AlertDialog`. `Form`, `ButtonGroup`, `CheckboxGroup`, `Dialog`, `ProgressCircle` and react-aria's `FileTrigger` are used where needed. The project's own pieces are still only the five named in DESIGN.md.
