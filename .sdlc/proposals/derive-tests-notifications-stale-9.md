---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I rewrote the one criterion listed, R-6.2 (v1), at `tests/acceptance/notifications/R-6.2.spec.ts`."
opened: 2026-09-29T13:06:20.087Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I rewrote the one criterion listed, R-6.2 (v1), at `tests/acceptance/notifications/R-6.2.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the one criterion listed, R-6.2 (v1), at `tests/acceptance/notifications/R-6.2.spec.ts`. No criteria were newly marked not testable. I couldn't type-check or run the file: the shell asked for approval to run the TypeScript compiler, and nobody is here to give it. Every surface page, action, observation, persona and seed handle it uses is declared in `tests/generated/`, and I checked those against the file.

**What the ruling found and what changed.** While delivery was being refused, the old test required the mail catcher to hold no messages at all. That check failed whenever a message from earlier activity arrived after the catcher was cleared but before the refusal took effect. The new test uses one helper for both catcher checks: it opens every caught message and counts only those whose subject, plain-text body or HTML body contains the title of the opportunity the test publishes. The criterion is only about notices for that opportunity.

I also removed a second part of the old matching rule: it counted a message as "about the opportunity" if the service's own address was a visible recipient. The ruling says to identify notices by title, and that rule could also catch unrelated messages the service sends. The old test counted catcher messages only while delivery was refused. The new one reads each message in full, as the old test already did after delivery came back.

The rest of the test is unchanged apart from the header, which now cites the current spec (spec@258c8b6):
1. The catcher is set to refuse delivery.
2. An administrator publishes a Code With Us opportunity, and the test checks the form shows no error.
3. The refusal is held for 20 seconds, so every notice is tried and refused before delivery is restored.
4. The test checks the opportunity reads as published and that its history records no failed delivery.
5. The catcher is shown to be accepting again: an organization owner invites a vendor, and that invitation arrives.
6. After a further 10 seconds, no notice about the opportunity may be in the catcher, since one arriving then would be a repeat attempt.

The refusal is lifted in a `finally` block whether the test passes or fails.

**The part still owed.** The existing `not-testable.yaml` entry for R-6.2 stays as it is. It covers the clause "When a message cannot be composed", is marked `blocked:`, and is owed by the contract stage. Nothing in the contract sets up a message the service cannot compose: no seeded record whose content makes a message fail to render, and no way to inject a fault into composition. That starting state is the one thing I needed and could not find. The delivery half needed nothing new beyond the surface's existing mail-delivery-fault page and the caught-message pages.

I didn't touch any path outside `tests/acceptance`, and nothing asked me to.
