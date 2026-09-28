---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I changed the three group tests (R-1.34, R-1.36, R-1.37) to meet the first three conditions."
opened: 2026-09-28T05:17:06.411Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I changed the three group tests (R-1.34, R-1.36, R-1.37) to meet the first three conditions.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I changed the three group tests (R-1.34, R-1.36, R-1.37) to meet the first three conditions. I did not add the not-testable entry the fourth condition asks for, because this workspace's seed already names the nineteen accounts, so the R-1.34 test now covers all 139 instead. I couldn't run the typechecker (permission to run it was refused), so none of these changes have been compiled or run.

**Condition 1 (R-1.34, the subscriber test).** Every message caught after publishing is now read for its subject and both bodies. If it doesn't name the opportunity's title, it notifies nobody. A subscriber counts as told only when a message that does name the title lists them as a visible or blind-copied recipient. This is the same check the author's confirmation test already used. The header comments now say the same.

**Condition 2 (R-1.36, the watcher-and-proponent test).** Same change. The watcher (proponentTwo) and the proponent (vendorOne) count as told only through a message that names the seeded opportunity's title and lists them as a recipient.

**Condition 3 (R-1.37, the administrator test).** Same change. An administrator counts as notified only through a message that names the submitted opportunity's title and lists them as a recipient.

**Condition 4 (R-1.34, entry for the nineteen accounts).** Not done as written. The ruling says the seed gives the nineteen other accounts only as a total. That is no longer true here: the seed and the generated seed file both list them by handle, under the new-opportunity notices group of accounts that receive the announcement. So the second request filed to contract, to name them, appears to have been delivered already. An entry saying "blocked" would have been false. It would also have sat beside a test that asserts the clause, which a check refuses.

Instead, the address list in the R-1.34 subscriber test now has the 120 subscribers plus the nineteen, each looked up by handle. The test checks that each of the nineteen has an address and that the total matches the seed's figure of 139. That total now serves as the check on the list rather than as a gap in it. Adding the nineteen changed the same assertion condition 1 already touched; nothing else in the file changed. `tests/acceptance/not-testable.yaml` is untouched.

The condition names `tests/acceptance/opportunities/not-testable.yaml`, which doesn't exist; entries live in `tests/acceptance/not-testable.yaml`. If the reviewer still wants an entry, it would go there, but with this seed it would state a false reason.

**Other points:**
- One of the nineteen is the author (staffOne). In R-1.34, the author's own confirmation also lists them and names the title, so it would count as their announcement too. The check can't tell an announcement from a confirmation beyond the title, which is how far the conditions asked it to go.
- The headers keep their "derived 2026-09-28" date, which is already today in UTC. No other file under `tests/acceptance/opportunities/` changed, and nothing under `tests/generated/` changed.
- The contract condition is left to contract.
- I found no missing surface actions or observations.
