---
stage: "build"
title: "build slice 7"
at: "2026-10-01T08:25:22.421Z"
cost: 1.8311638000000003
turns: 54
session: "137fe5b1-60fd-45c3-a669-f5b7b04b06ad"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

This revision adds the opportunities table to `/dashboard`, which was the application fault the ruling named first. For the second fault, an administrator getting no Publish on a draft, the source already offers it, so I made no change there; I couldn't confirm what the live app does. `npm --prefix app run check` passes: migrations 16 tests, backend 394, frontend 227.

**What changed: the dashboard.** Until now `/dashboard` showed only a greeting. For public sector staff and administrators it now follows the opportunity-dashboard design stories. It shows the heading and a "Create an opportunity" link, then one of these:
- **Rows to show:** a table with Title, Program, Status and Last updated, newest first. Each title links to `/opportunities/code-with-us/<id>/edit`. Every test id the stories and `surface.yaml` give is on the same element as in the story.
- **Nothing yet:** a staff member who has created nothing sees "You have not created any opportunities yet." Administrators see "All opportunities" and an extra "Created by" column; both follow the administrator story.
- **Still loading or failed:** a loading message while the list comes in, and an error alert if it fails.

The rows come from a new `listCwuOpportunities()` call in `app/frontend/src/api/opportunities.ts`, which uses the existing list endpoint. A staff member sees only rows whose creator is them, because the list also returns other people's published opportunities. An administrator sees every row. Vendors still get the greeting, since their dashboard belongs to the proposals slice. Only Code With Us rows exist so far; the other two programs' rows will come with their slices.

This is what R-1.9's test reads after saving a draft. R-1.53, R-8.17, R-8.19 and R-8.25 read empty for what looks like the same reason, so they may recover too. I couldn't run the acceptance suite to confirm that.

**Publish on a draft (R-1.22): not reproduced.** On `/opportunities/code-with-us/<id>/edit`, the code offers Publish to any administrator on a draft or an opportunity under review, and hides Submit for review from them. What the verify walk reported — Edit, Submit for review and Delete — is exactly what a draft's non-administrator author is shown. So either that walk was signed in as staff, or the live session reported the administrator as a staff account. I found nothing in the sign-in or account code that would cause the second.

I tried to start the stack with `docker compose` to check, but this session wasn't permitted to run it. A later stage that can run the stack should walk the seeded draft as `test-admin` and look at the account type `GET /api/sessions/current` returns.

**Unit tests added:**
- A staff member sees only their own opportunities, newest first, each with its status and manage link.
- An administrator sees every opportunity, with who created it.
- The empty-state message.
- An automated accessibility check (axe) on the table.
- An administrator on a draft gets Publish and no Submit for review, and publishing sends `{tag: "publish"}`.

I also updated one older sign-in test that expected the greeting's name on the dashboard, and added two lines to `app/README.md`.

**Not mine to do.** Two of the ruling's conditions went to other stages, and I left both alone:
- **Test adapter:** it must read field values on the Opportunity tab. This is the remaining cause of R-1.4, R-1.21 and R-1.56 failing.
- **Plan:** it must move R-1.8, R-1.19, R-1.48, R-6.15, R-6.2 and R-1.20 to the slices that build their screens. They stay unwalkable here, because the Sprint With Us screens, the organization edit screen and a cancel action don't exist yet.

The next slice will find no vendor or evaluation-panel version of the dashboard, and no Sprint With Us or Team With Us rows in the table.