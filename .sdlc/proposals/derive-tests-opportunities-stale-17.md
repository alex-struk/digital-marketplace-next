---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I wrote no test for R-1.20 (v1), the only criterion in this run."
opened: 2026-10-02T14:31:57.567Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I wrote no test for R-1.20 (v1), the only criterion in this run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote no test for R-1.20 (v1), the only criterion in this run. I deleted its old test and recorded it as **blocked** in `tests/acceptance/not-testable.yaml`, with `contract` as the owner. Nothing else changed.

**Why there is no test.** The criterion says that a request to change an opportunity's state outside its program's permitted path is refused, and the state stays the same. Examples are a draft going straight to an evaluation stage, or any change to an opportunity that is already awarded or cancelled. The ruling found that the old tests depended on the edit screen still offering Publish or Submit for review after cancelling. It asked for a test that sends the request directly, for example through the service, and then checks the state.

I read every page in the generated surface, including the section of requests that no screen makes. The only ways the surface can ask for a state change are the controls on the three edit pages (`opportunityCwuEdit`, `opportunitySwuEdit`, `opportunityTwuEdit`): `submitForReview`, `publish`, `cancelOpportunity`, `startTeamScenario` and similar. Using any of them on an awarded or cancelled opportunity is exactly what the ruling rejected. A screen can meet the criterion simply by not offering the control, so such a test would be checking the screen, not the criterion.

The service's own update operation, `updateCodeWithUsOpportunity` in `openapi.yaml` (with Sprint With Us and Team With Us versions alongside), is the request the ruling has in mind. But no surface page reaches it, the way `opportunityWatchRequest` reaches the service for watching. The Team With Us edit page's `offeredStateChanges` observation reads the screen, so it has the same problem. Rewriting the test would have meant repeating the ruled-against approach in another form, so I recorded the entry instead.

**What the contract would need to add** (also written in the entry's `missing` field):
- **A request page:** something like `opportunity-status-request`, opened with `{ program, opportunityId }`. It needs an action such as `request_status_change({ status })` that sends the service's update operation as the signed-in person.
- **Observations on that page:** `request_accepted`, `refusal_status` and `stored_status`, so a test can see the refusal and read the status afterwards.
- **A seeded cancelled opportunity:** the seed already has awarded ones (`seed.opportunities.cwuAwarded`, `seed.opportunities.swuAwarded`) and a draft (`draftOfOtherStaff`), but no cancelled one. Adding one would let the cancelled case be tested without cancelling through the screen first.

With that page in place, the test would be short: sign in as the administrator, ask an awarded opportunity to go back to published (or a new draft to jump to an evaluation stage), and check that the request is refused and the status hasn't changed.

**Not checked:** I couldn't parse the edited YAML to confirm it is valid, because the command that would have checked it needed an approval nobody was here to give. The entry follows the indentation and quoting of the entries above it. I touched no paths outside this stage's own.
