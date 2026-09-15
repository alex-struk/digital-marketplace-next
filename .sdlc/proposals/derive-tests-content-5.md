---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I removed the reused-address step from R-7.9 and changed nothing else, so the content domain is ready to go back for review."
opened: 2026-09-15T02:03:34.308Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I removed the reused-address step from R-7.9 and changed nothing else, so the content domain is ready to go back for review.

I removed the reused-address step from R-7.9 and changed nothing else, so the content domain is ready to go back for review.

**Condition 1: the new page at the freed address.** R-7.9 no longer publishes a new page at the removed page's address, opens it, or reads its `versionHistory`. The reviewer was right: R-7.9 never says a removed address can be used again. A target that keeps removed addresses reserved would pass the criterion but fail that step. The unused wording and the creation calls went with it. The rest of the file is as it was:
- It still publishes one change before removing the page, so it holds both an older wording and the current one.
- It checks the removal message, the return to the list, and that the list no longer shows the address.
- It signs out, opens the address, and checks that it answers as not found and shows neither wording.

**Condition 2: the comment.** The file's comment now says that "no version of its text survives anywhere in the service" is not asserted. The reason given is that no reading in the surface shows a removed page's text. Also, R-7.23 says nothing in the service shows an earlier version. So nothing we can observe could tell erased history from history that is simply never shown. The header keeps the same spec revision and the date 2026-09-15, which is today's date on the machine clock.

**Condition 3: R-7.12, R-7.22, R-7.25 and R-7.27.** I did not touch these four files. I also left the other content tests and every entry in `tests/acceptance/not-testable.yaml` unchanged. R-7.9 has no entry there, so it has a test file and no conflicting not-testable entry.

**Not checked:** I could not compile the edited file, because running the type-checker needed a permission that wasn't given. The risk is small: I only deleted calls, and every remaining call is one the reviewer already saw in the returned version.

No condition was left undone. No surface action or observation is missing for this round. R-7.9's "no version survives" clause stays unasserted for the reasons above. That is a limit of what the service shows, not a missing piece of the contract.
