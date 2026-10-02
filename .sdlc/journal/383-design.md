---
stage: "design"
title: "design organizations"
at: "2026-10-02T00:32:42.867Z"
cost: 7.179552
turns: 93
session: "ad4bfcd3-5fc5-47f3-b35d-34478c80b08f"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I designed nothing new for the screens that already existed. All 51 organizations stories now sit on the shared page container and stack, with no wording, test ID, page or component changed. I also went past the operator's layout-only reason in one respect: three request addresses and three logo entries were still unbound, and the stage's own scope required designing them.

**The layout change.** `PageContainer` and `Stack` already existed in `design/catalogue/layout.tsx`, and I reused them without editing them. Every story is now one container holding one large-gap stack whose items are the page's regions. The rhythm:
- **Large:** between regions.
- **Medium:** between the items of a region: a form's fields and card sections, the links of a navigation row, the badge row, the body of a dialog.
- **Small:** between a label and what it labels: "Edit Organization" and the H1, a spinner and its text, the commands in one table row, requirement items.

No story sets its own width, outer padding, margin or gap any more. The only spacing left is inside the project's own components: table cell padding, badge padding, card-section padding, and the inner padding of the two `Dialog` bodies (Add team members, Change owner). `DESIGN.md` lists the container and the stack among the project's own components, and its "How a screen is laid out" section now describes this.

**Spacing that visibly changed:**
- The management page's tabs moved from the large gap to medium, to follow the rule for a navigation row.
- On the memberships pages the H1 and the profile navigation became one heading block at the medium gap, matching how the notifications domain lays out the same profile section.
- The admin-rights and archive dialog bodies now space their content with a stack, not the components' own margins.
- The Organization ID line is wrapped in the same row stack on every management-page state.

**Checks.** I had no shell that could run node, so nothing was typechecked or rendered during my turn. The pipeline compiles and scans the catalogue after I finish. Five agents did the conversion in parallel; I then went back over the result:
- **Test IDs:** the count per file matches what I recorded before the change, file for file.
- **Layout styles:** a search finds none left in this domain's stories except the tables' `width: 100%`.
- **Consistency:** I evened out the two things the agents did differently (the ID row and the dialog bodies).

**Request addresses, newly designed.** `organization-acting-for-list`, `affiliation-invitation-request` and `affiliation-approval-request` had no screens entry, no stories and only `null` test IDs. I built them as response references, the pattern the users, content and files domains use:
- **`organization-acting-for-list`:** `default` (R-3.15) and `refused` (R-3.20).
- **`affiliation-invitation-request`:** `default` and `invalid` (R-3.17, shown with ADMIN).
- **`affiliation-approval-request`:** `default`, `refused` (the owner accepting on someone's behalf) and `not-pending` (a second acceptance), all R-3.9. The two refusals are separate states because they are different answers: one is about who asked, the other about the membership.

I filled all eleven of their test IDs with names prefixed by the page id. `invalid_membership_type_error` here is deliberately not the Team tab's ID, because one is a screen alert and the other is part of an HTTP answer.

**Logo on the management page.** `organization-edit` had three later surface entries still `null`. I filled them and added two states, `logo-stored` and `logo-refused`. Both follow the files domain's ruling that the logo uses its image picker:
- **`change_logo`** is `organization-logo-button`, the trigger the create page already binds.
- **`current_logo`** is `organization-current-logo`, the stored logo's image on the read-only tab.
- **`logo_refused_error`** is `organization-logo-refused-error`.

No organizations page in `spec/contract/surface.yaml` has a `null` test ID left.

**Components most used:** the design system's `Heading`, `Text`, `Button`/`ButtonGroup`, `TextField`, `Link`, `InlineAlert` and `Modal` with `AlertDialog` or `Dialog`. Beside them are the project's own data table, status badge, card section, section navigation, pagination and requirement list, all already listed in `DESIGN.md`, plus the shared container and stack.

**New gaps, numbered 17–20 in the organizations section of `DESIGN.md`:**
17. No criterion gives the wording of the permission message when the owner tries to accept on someone's behalf, so the story shows a placeholder.
18. No criterion gives a status number for the refusals by request.
19. The surface quotes the old service's words for a refused logo ("Please select a different logo image."), but no criterion fixes them; the story uses the files domain's wording.
20. Whether anyone other than the owner may invite by request is not stated.

Gaps 1–16 from the earlier design are unchanged. I changed nothing under `spec/` except the test IDs in `surface.yaml`.