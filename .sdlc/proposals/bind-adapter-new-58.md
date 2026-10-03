---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I changed one thing: `create_organization` now handles the `addressLineTwo` input, which should fix R-3.2, R-3.6, R-3.15, R-3.22 and R-3.23."
opened: 2026-10-03T05:16:14.173Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I changed one thing: `create_organization` now handles the `addressLineTwo` input, which should fix R-3.2, R-3.6, R-3.15, R-3.22 and R-3.23.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed one thing: `create_organization` now handles the `addressLineTwo` input, which should fix R-3.2, R-3.6, R-3.15, R-3.22 and R-3.23. I couldn't type-check or run the suite, so the change hasn't been run against a test yet.

**What was wrong.** The binding was never truly unbound; the adapter was matching the field wrongly. I signed in as a vendor through the identity provider and opened `/organizations/create` on the target at localhost:4300. The form has a "Street address (required)" field and an "Address line 2 (optional)" field. The adapter's map from input keys to labels in `tests/adapters/new/index.ts` only knew the API's own key, `streetAddress2`, for the second line. For `addressLineTwo` it fell back to building a label from the key's words ("address line two"). The screen says "2", not "two", so no field matched and the action threw `unbound`.

**The fix.** I added extra key names to that map, all pointing at labels that are on the page:
- **Second address line:** `addressLineTwo`, `addressLine2`, `address2`, `street2`, `secondAddressLine`, `streetAddressLineTwo` → "Address line 2".
- **First address line:** `addressLineOne`, `addressLine1`, `address`, `address1`, `street`, `street1`, `streetAddressLineOne` → "Street address".
- **Province and postal code:** `state`, `provinceOrState`, `stateOrProvince` → "Province or state", and `zip`, `zipCode`, `postalOrZipCode`, `postalCodeOrZipCode` → "Postal code or ZIP code".

The edit-organization form uses the same map, so it gets the same keys. `create_organization` was already `bound` in `bindings.yaml`, so that file is unchanged.

**One reason that isn't about this target.** Part of R-3.2's quoted reason says `/organizations/create` answered "Page not found". That was observed on the target at port 4500, not this one. Here the page answers "Page not found" to a signed-out visitor and opens normally once signed in, which is how the adapter's `signedInScreen` already treats it.

**Not done.** I couldn't run the TypeScript check because the commands needed approval this session doesn't have. Instead I read the edited object literal and confirmed there are no duplicate keys. Every route involved resolved on the target. I wrote nothing outside `tests/adapters/new/`, and no password or environment value appears in the adapter or this entry.
