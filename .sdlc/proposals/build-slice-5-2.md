---
gate: G3
question: "Does slice 5 (An administrator can write and manage the service's pages) do what its criteria say?"
recommendation: "I also couldn't run the stack."
opened: 2026-10-01T04:10:37.654Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 5 (An administrator can write and manage the service's pages) do what its criteria say?

**Recommendation.** I also couldn't run the stack.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've fixed R-7.12 and changed the code behind R-7.8, but the R-7.8 change is a judgement I couldn't confirm: the ruling didn't say which value came back empty. I also couldn't run the stack. Starting it with docker compose needs an approval this session doesn't have, so neither fix has been tried in a browser against a seeded sandbox. `npm --prefix app run check` passes: typecheck, plus 16 migration, 313 backend and 176 frontend tests.

**R-7.12 (expected 22 needed pages, got 23).** The seed puts back the 22 pages the old application created. Our migration had also stored a needed page at `service-level-agreement`, which the seed doesn't know about, so the list showed 23.
- **Migrations.** A new migration, `20260930000005_the_twenty_two_needed_pages.cjs`, adds the seven pages the first one left out: the six program guides and the Team With Us opportunity scope page. It also removes the stored service-level-agreement page, but only while nobody has written it. The first migration still creates its original sixteen, so the history reads the same on every database. Fresh and seeded installations now both store exactly the 22.
- **Service-level-agreement page (R-7.18).** Its links must still resolve, so the service now answers that address itself when no page is stored there. It is titled by its address, bodied "Initial version", marked as needed, has no author, and is dated like the other needed pages. The rule is in `app/backend/src/content/built-in-pages.ts`.
  - It doesn't appear in the page list, so the count stays at 22.
  - It still resolves after the test harness empties the tables and reapplies the seed.
  - An administrator can open its managing screen but can't remove it. The first time they publish wording for it, it becomes a stored needed page.

**R-7.8 (some value read as empty).** I looked for an empty value in the dates, bodies, authorship links, the publish response and the design system's text fields, and found none. The one thing R-7.8 asks for that the managing screen didn't show was the moment of the change: its dates were day-only, so no time could be read from them. The published and last-updated dates on `/content/:slug/edit` now read like "September 30, 2026 at 5:00 p.m.", and their `datetime` attribute carries the full timestamp. The public page and the list keep the day-only dates their design stories show. If the suite reads R-7.8's date from the public page instead, this won't fix it.

**Unit tests updated:**
- The 22-page set and the order-independent "exactly these 22" check.
- After the seed: exactly 22 needed pages.
- Re-running the new migration leaves an existing installation's pages untouched.
- The service-level-agreement page: answered with the placeholder, absent from the list, can't be removed, and becomes a stored needed page when an administrator writes it.
- The managing screen's dates to the minute.

**Things outside this stage:**
- **Records not edited.** Decision records 0007 and 0008 had chosen sixteen pages. The new record 0026 supersedes their page set. I added a status pointer to 0008, corrected the page-count paragraph in 0025, and left 0007's text alone.
- **Plan and seed comments.** `plan/plan.md` still says sixteen, and the comment in `tests/seed/003-content.sql` says nineteen. Neither is this stage's to change; whoever owns them should bring them into line with 22.
- **Seed and R-7.18.** The surface entry for the service-level-agreement link still says the service "creates no such page for itself". With this change the address answers even though the seed never restores it.

Nothing is missing for the next slice from these fixes.
