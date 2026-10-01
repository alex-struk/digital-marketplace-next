---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I acted on the one condition."
opened: 2026-10-01T14:02:37.234Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I acted on the one condition.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I acted on the one condition. R-1.6 now also tests a signed-in visitor who is not staff. I couldn't run the typecheck: the command needed approval and nobody was there to give it.

**Condition 1 (R-1.6, the signed-in half of "anyone, signed in or not").** I changed only `tests/acceptance/opportunities/R-1.6.spec.ts`. The anonymous case is unchanged: an administrator reads the view count on the opportunity-counters page and signs out, an anonymous visitor opens `opportunityCwuView`, and the count must have risen by exactly one. After that, the test now signs in as `persona.vendor`, opens the same public page, checks that it really opened by reading the opportunity's identifier, and signs out. The administrator then reads the count again, and the test requires it to have risen by exactly one more.

I checked `tests/generated/personas.ts` first. The vendor persona can be signed in as (session route `/auth/createsessionvendor/1`), it is not staff, and its abilities include viewing a published opportunity. So the surface does reach this clause, and I added no `not-testable.yaml` entry for R-1.6. There was none there before either.

Both viewings sit in the single existing `test()`, under the criterion's own title. The criterion has only one given/when/then, and Playwright refuses two tests with the same title in one file. I updated the explanatory comment to describe both viewings. The header is unchanged: the "derived" date was already 2026-10-01, which is today.

**Not verified.** The typecheck (`tsc --noEmit`) was not run. As a substitute, I confirmed the new code only uses calls the file already used (`surface.signIn`, `surface.signOut`, `opportunityCwuView.open`, `opportunityIdentifier`) plus the `persona.vendor` key, which exists in the generated personas. A later stage should still run the typecheck.

No other file under `tests/acceptance/opportunities/` and no entry in `tests/acceptance/not-testable.yaml` was touched. I wrote nothing outside the paths this stage delivers, and nothing new is missing from the contract surface.
