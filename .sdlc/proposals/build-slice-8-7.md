---
gate: G3
question: "Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?"
recommendation: "I made no changes to the application in this revision."
opened: 2026-10-02T05:11:34.606Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I made no changes to the application in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes to the application in this revision. The ruling found nothing wrong in it: the three failing rows were traced to the acceptance suite's adapter, which goes to bind-adapter. The build was returned only so its next verify runs against the corrected adapter. I checked each of the six conditions still owed against the application as it stands, and each is either already met in code or is the adapter's to fix.

**Already met in the application:**
- **`build-slice-8-3#2` (R-1.5, a repeat watch should come back as "conflict", not "errors"):** met. The second watch is refused with `{ "conflict": ["This user is already subscribed to this opportunity."] }` with status 400. This follows the reasons `surface.yaml` names for watch requests: "opportunity" for watching your own, "notFound" for one you cannot see, and "permissions" (401) when not signed in. The rule is in `app/backend/src/rules/opportunity-list.ts:156` and reaches the route through `NamedRefusal` in `app/backend/src/common/refusals.ts`. Decision record 0037 explains why only these watch routes leave the usual `{ "errors": [...] }` shape.
- **`build-slice-8-3#5` (R-1.23, published dates in Pacific time):** met. `readDate` in `app/frontend/src/lib/dates.ts` reads the day in `America/Vancouver`, using the same `pacificClockOf` rule that already sets deadlines. Something published at 7:26 p.m. Pacific on October 1 therefore shows October 1. Dates shown to the minute are still in UTC, because the ruling named only the day. Decision record 0037 says what would change that.
- **`build-slice-8-3#6` (one page layout):** met. The catalogue's `PageContainer` and `Stack` are defined once, in `app/frontend/src/app/page-layout.tsx`. The root layout puts every screen inside the container. I searched the screens again for widths and outer padding of their own and found none. The only remaining spacing is inside tables, cards, capability rows and the dialog body, which the catalogue also draws, and every `data-testid` is where it was.

**The adapter's to fix, not the application's:**
- **`build-slice-8-3#1` and `#3` (R-1.3 and R-1.38, the list's text read as empty):** the adapter looks for group headings like "Open opportunities". The application, like the catalogue's stories, heads the groups "Unpublished", "Open" and "Closed". The ruling filed this to bind-adapter.
- **`build-slice-8-3#4` (R-7.18, a content link's address must answer with a page):** `/content/service-level-agreement` does answer with the page. The adapter looks for the link again on the page the link already led to, so it reads nothing. This is also filed to bind-adapter.

I left both adapter fixes alone because they are another stage's work.

**What I checked:** I installed dependencies and ran `npm --prefix app run check`. Typechecks passed and so did all 715 unit tests (16 + 422 + 277). One error line in the output is a deliberate mail-failure test. I then removed the `node_modules` folders the install and test run created, so they do not travel with the proposal. I did not start the compose stack, since the ruling had already checked the running application of build 8-6.

Every slice 8 criterion is built as before: R-1.2, R-1.3, R-1.5, R-1.6, R-1.38, R-4.22, R-6.20, R-6.21 and R-6.27. Decision records 0034 and 0037 describe how each is reached. As those records already note, the next slice will still find two things missing:
- **Slice 9:** telling watchers about addenda and cancellations, and the manage page's figures for views, watchers and proposals.
- **Slice 10:** the public and manage pages for Sprint With Us and Team With Us. Until then, the list's links to them land on the not-found screen.
