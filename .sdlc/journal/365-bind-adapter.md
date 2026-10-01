---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T11:13:04.602Z"
cost: 0.8639996000000001
turns: 30
session: "bfbd5733-4bcf-49d1-b5e9-a8f56c3430d9"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

None of the four criteria could be unblocked: the three screens they need are still not served by the running target, so I left all three unbound. I couldn't run the type-checker because the command needed approval. The change is small: the edited text is still well formed and builds a string.

**What I looked for this pass.** R-1.48, R-1.9, R-8.19 and R-8.25 depend on three screens: the Sprint With Us create form, the Team With Us create form, and the Code With Us proposal form. I signed in through the identity provider's own form, once as the administrator and once as a vendor.

- **As the administrator:** the dashboard's "Create an opportunity" leads to `/opportunities/create`. That page links to the Code With Us, Sprint With Us and Team With Us forms. Following the Sprint With Us link and the Team With Us link both land on "Page not found", and so does opening those two addresses directly. `/opportunities`, `/opportunities/sprint-with-us`, `/opportunities/team-with-us` and `/organizations` also answer "Page not found". The dashboard's "All opportunities" table lists only Code With Us opportunities. The header offers only Dashboard, Users, Content, My profile and Sign out.
- **As a vendor (`test-vendor-1`):** the dashboard is just a greeting, and the header offers only Dashboard, My profile and Sign out. I opened the seeded published Code With Us opportunity, whose proposal deadline is June 1, 2030. Its public page shows the details, key dates and addenda, but has no link or button at all. For that opportunity, `/opportunities/code-with-us/<id>/proposals/create`, `/proposals/code-with-us/create?opportunityId=<id>` and `/opportunities/<id>` all answer "Page not found".

**What changed.** The adapter's behaviour is the same as before. `open()` for these pages still navigates to the route and throws `unbound:` only if the page really shows a refusal. That means it will bind on its own once a build serves these screens. I added the walks above to the reasons in `tests/adapters/new/index.ts` for:
- `opportunity-swu-create.open`
- `opportunity-twu-create.open`
- every member of `proposal-cwu-create`

**What I left alone.** I didn't edit `tests/adapters/new/bindings.yaml`. Every name in it is still named once, with the same bound or unbound status. Nothing outside `tests/adapters/new/` was changed.

**Routes that did not resolve.** On this target, `/opportunities/sprint-with-us/create`, `/opportunities/team-with-us/create` and `/opportunities/code-with-us/:opportunityId/proposals/create` don't resolve for any persona I tried. All three show "Page not found", even though the target's own program chooser links to the first two.