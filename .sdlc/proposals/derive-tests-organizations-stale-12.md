---
gate: G3
question: "Do these tests follow from the organizations criteria and from nothing else?"
recommendation: "R-3.2 (v1) now has a full test, so there is no `not-testable.yaml` entry for it."
opened: 2026-10-03T15:19:03.147Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** R-3.2 (v1) now has a full test, so there is no `not-testable.yaml` entry for it.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-3.2 (v1) now has a full test, so there is no `not-testable.yaml` entry for it. That makes one of one criteria tested in this run. I couldn't type-check or run the file: the sandbox wanted approval for the `tsc` command, and nobody was there to give it.

**What was already there.** `tests/acceptance/organizations/R-3.2.spec.ts` already existed from the last approved derivation. R-3.2 had no entry in `tests/acceptance/not-testable.yaml`, so there was nothing to remove. The existing file had four tests, all sent through the organization request page or the create screen:
- a vendor who has accepted the terms registers an organization on the create screen, and it appears among the vendor's owned organizations;
- the same vendor's registration sent through `organization-request` is accepted and returns an organization identifier;
- a signed-in member of public sector staff sends a registration through `organization-request` and is refused as not permitted;
- a signed-in vendor who has never accepted the terms (`persona.vendorCompletingProfile`) is refused the same way.

A note in `redo.yaml`, marked closed, had objected that an older version made staff fill in the create screen. The current file already avoids that by sending the request directly instead of opening a screen the service never offers staff.

**What I added.** One test for "a request from anyone else" made with no session at all. The contract handed this case back through `persona.anonymousVisitor` (its sign-in is null) and the `register_by_request` action. The test does not sign in. It sends the same complete, valid registration the other tests send and checks:
- the request is not accepted;
- the refusal is filed under permissions;
- no organization identifier comes back;
- the status is 401;
- the messages include "You do not have permission to perform this action."

**What I left out on purpose.** I wrote no test for `persona.vendorWithTermsReset`. The contract says the old service *accepts* a registration from a vendor who once agreed to the terms but has since had that agreement withdrawn. The criterion's "has already accepted the service's terms" doesn't settle whether such a vendor should be accepted or refused. Asserting either outcome would mean taking a side the criterion doesn't state. If someone wants that case pinned down, it belongs to `ratify`, which would need to say whether "accepted the terms" means the current terms or any terms ever.

**Missing from the surface.** Nothing for this criterion. The `organization-request` page and its observations were enough.

I edited no files outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-3.2 tests follow from the organizations criterion and nothing else? Ruling: return. The added test for a visitor who is not signed in correctly covers the owed clause 'a request from anyone else is refused' through the shared expectRefusedAsNotPermitted helper, which checks the request is not accepted, a refusal status is present, the reason names permission and no organization identifier is returned. But the test then asserts refusalStatus() equals '401' and that refusalMessages() contains the exact string 'You do not have permission to perform this action.'. R-3.2 states neither a status code nor any message wording, only that the request is refused as not permitted. Those two lines encode how the oracle responds, not what the criterion requires, and would fail a rebuild that refuses correctly with a different code or wording. Leaving persona.vendorWithTermsReset untested is correct, because the criterion does not settle it. The ruling would change to approve once those two assertions are removed and the test relies on expectRefusedAsNotPermitted alone, as the staff and never-accepted-terms tests already do.

**Conditions:**
- tests/acceptance/organizations/R-3.2.spec.ts, test 'a registration sent by a visitor who is not signed in is refused': remove the assertion that refusalStatus() is '401'. R-3.2 says the request is refused as not permitted and names no status code. The non-empty status check in expectRefusedAsNotPermitted is as far as the criterion reaches.
- tests/acceptance/organizations/R-3.2.spec.ts, same test: remove the assertion that refusalMessages() contains 'You do not have permission to perform this action.'. R-3.2 names no message wording, and the /permission/ check on refusalReason() in expectRefusedAsNotPermitted already asserts 'refused as not permitted'.

### Runner-owned typecheck evidence

Proposal revision: `ad406e9488cc69295369eb8a2147424e0b493b61`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
