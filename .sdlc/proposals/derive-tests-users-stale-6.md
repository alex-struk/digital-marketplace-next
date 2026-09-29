---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "I wrote a test for R-4.24, the one criterion in scope, and the criterion is now fully covered."
opened: 2026-09-29T02:58:17.763Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I wrote a test for R-4.24, the one criterion in scope, and the criterion is now fully covered.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote a test for R-4.24, the one criterion in scope, and the criterion is now fully covered. Nothing in it remains untestable. I could not compile or run the test: this environment would not let me run the TypeScript checker without approval. Every surface member it calls is copied from `tests/generated/surface.d.ts`, but no compiler has checked it.

**What changed.** The earlier test covered only the first half of the criterion. It showed that the choice was saved, using a first-time vendor persona that has no sign-in route on the reference system. It could not show "with the moment the choice was made", so an entry in `not-testable.yaml` kept that clause owed to the contract. The contract has now supplied the two missing pieces:
- a seeded persona, `vendor-completing-profile` (`seed.users.vendorCompletingProfile`), whose account exists but whose profile is unfinished and who has made no choice about notices;
- an observation, `user-account-self-request.new_opportunity_notices_since`, which reads the person's own account record. It gives the moment notices were turned on as an ISO 8601 instant, or nothing when they are off.

**The rewritten test** (`tests/acceptance/users/R-4.24.spec.ts`) has one test, because the criterion states one given/when/then. It:
1. signs in as `persona.vendorCompletingProfile`;
2. confirms the account record shows no recorded moment yet;
3. on the profile-completion page, ticks the new-opportunities box, agrees to the terms and completes the profile;
4. reads the account record again and asserts it now holds a valid instant, which counts as notifications being on.

The service's clock sets that instant, not the test runner's. So the test only requires it to fall within the completion window, give or take five minutes for clock differences.

Because the test now asserts the whole criterion, I removed the R-4.24 clause entry from `tests/acceptance/not-testable.yaml`. A criterion must have either a test or an entry, never both. An earlier redo item in `redo.yaml` asked the test to start from someone who had not completed their profile; it was already closed, and this test now does exactly that.

**Still missing from the surface for this criterion:** nothing. The administrator's view of another person's record (`user-account-request`) is available too, but this test only needs the person's own record.

I changed nothing outside `tests/acceptance`, and nothing asked me to.
