---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I rebound `proposal-swu-create.add_reference` on the \"new\" target at http://localhost:4300."
opened: 2026-10-04T07:21:56.809Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound `proposal-swu-create.add_reference` on the "new" target at http://localhost:4300.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rebound `proposal-swu-create.add_reference` on the "new" target at http://localhost:4300. The seven criteria quoted in the brief (R-2.7, R-2.9, R-2.11, R-2.16, R-2.18, R-2.19 and R-2.22) should no longer stop at this member. I could not run the typechecker, and I have not rerun the tests.

**What I found.** The last binding run reported that a reference had no company box, and at that time that was true. I signed in through the identity provider's own form as the organization-owner vendor (test-vendor-2). I then opened the create form on the seeded open Sprint With Us opportunity (`00000000-0000-4000-a025-000000000001`) and pressed "Add a reference". Each "Reference N" group under the "References" heading now has four text boxes: Name, **Company**, Email address and Phone number (optional). The company field was added to the application after the earlier run.

**What I changed in `tests/adapters/new/index.ts`.** This is the shared routine that fills references, which the create action and the proposal form's `references` input both call:
- **Company box:** I added it, found by its label. It accepts the same input spellings the old target's binding accepts: `company`, `companyName`, `company_name` and `organization`. Tests calibrated against the old binding send reference companies under those keys.
- **Error message:** an input key the form has no box for still throws `unbound:`. I updated the reason to list the four boxes and dropped the old claim that no company field exists.
- **Missing box:** if a box the binding expects is missing from a reference group, the action now throws `unbound:` naming the box. Before, it would have waited until the test timed out.

**How I checked it.** I ran the binding's own locators on the live form: two references, each with all four boxes found exactly once and filled. The read-back showed every value in the right box.

**What I could not do.** Running the TypeScript typechecker needed an approval this unattended session can't get, so the edit has not been compiled. The code only reuses helpers the file already uses with the same types, and the helper that throws `unbound:` is declared as never returning. I checked only the create form, not a saved proposal's edit form. The edit form runs the same code, so it should behave the same.

**Bindings file.** `tests/adapters/new/bindings.yaml` already said `add_reference: bound`, so I left it unchanged. No other member's status changed. I found no page whose route failed to open. I wrote nothing outside `tests/adapters/new/`.
