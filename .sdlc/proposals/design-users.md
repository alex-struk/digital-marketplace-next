---
gate: G-DESIGN
question: "Do these screens serve the users criteria, and are they built out of the design system?"
recommendation: "I designed the fourteen users-domain pages."
opened: 2026-09-15T07:18:33.060Z
---

# Do these screens serve the users criteria, and are they built out of the design system?

**Recommendation.** I designed the fourteen users-domain pages.

I designed the fourteen users-domain pages. They're specified in `design/DESIGN.md`, have 53 stories under `design/catalogue/`, and every test ID but one is filled in the surface. None of it has been compiled or rendered: no design-system package is installed here, and the web fetch to check its published API wasn't allowed. Component props and token names come from the documented API and may differ from the installed release. `DESIGN.md` lists every prop and token the build must confirm first.

**What I wrote.**
- **`DESIGN.md`:** the file was still the empty template, so I appended a users section below it and changed nothing above. It covers principles, the components in use, layout, form behaviour, loading/empty/refused states, accessibility, the test-ID convention and one section per screen. Each ID is paired there with the role and accessible name of the element it sits on.
- **`design/screens.yaml`:** it didn't exist, so I created it with the fourteen users entries under a header asking other domains to add theirs.
- **Stories:** each story imports its screens from `design/catalogue/users.shared.tsx`, which is a module, not a story. If the catalogue check expects every file in that folder to be a story, it will flag this one.

**States, and why these.** I only named a state where the screen actually changes.
- **Sign-in and sign-up:** `default` only.
- **Profile completion:** `default`, `terms-accepted` and `invalid`. The completion button and the sentence explaining why it's unavailable change when the terms box is ticked, which is what R-4.3 checks.
- **Sign-out:** `default` and `failed`.
- **Notice:** `default` (sign-in failed), `deactivated-own-account` and `not-found`.
- **User list:** `default`, `loading`, `export-open` and `export-ready`. A filtered search is the same table with fewer rows, so it isn't a state.
- **`user-profile` (11 states):**
  - It separates `deactivated-by-administrator` from `deactivated-by-owner`, because one offers a reactivate button and the other replaces it with a sentence. That difference is all of R-4.19.
  - It also has `admin-permission-refused`, own-profile, editing, invalid, the two confirmation dialogs, `not-found` (R-4.25) and `loading`.
- **`user-profile-self` (9 states):** the vendor, public sector employee and administrator views differ in sections, job title, status and deactivation (R-4.34, R-4.28, R-4.31). It also has `save-failed` (R-4.6), editing, invalid, the deactivation dialog, `sign-in-required` and `loading`.
- **Tab pages:** each has its working state, a dialog or expanded state, and `not-offered`. Asking for a section the profile doesn't have shows the profile section instead (R-4.33, R-4.34). The `/users/me` notifications page has no `not-offered`, because every kind of account has that section on its own profile.

**Test IDs.** I filled 125 of the 126 users `test_id`s.
- **Format:** `<page>__<name>`, with `-self` dropped from the page id. `/users/me` and `/users/:userId` are one screen, so both pages bind the same identifier.
- **Placement:** an action's ID goes on the control. Where an observation names the same control, as with the terms or administrator checkbox, its ID goes on the control's wrapper.
- **Checked:** every filled ID is written literally in its stories. The shared module renders only names that exist on the surface. The colour check found nothing in the catalogue.
- **Left `null`:** `job_title_field` on `user-sign-up-complete`. R-4.23 admits only vendors to that page and R-4.28 never asks a vendor for a job title, so no story can show it.

**Components I relied on most.** `TextField`, `Checkbox` and `CheckboxGroup`, `Button` and `ButtonGroup`, `Link`, `InlineAlert`, `Modal` with `Dialog`, `Form`, `Header` and `Footer`. I used `Dialog` rather than `AlertDialog` so one wrapper holds each dialog's heading, text and buttons. The design system has no released table, tabs, status label, file input, card or loading indicator. For those I used native elements styled only with tokens, and `DESIGN.md` records each one as a gap.

**Gaps (U-1 to U-19 in `DESIGN.md`):**
- **U-5:** the `null` job title above.
- **U-6:** R-4.12 offers the administrator checkbox on a vendor's profile and the service always refuses it. That's the same shape as the reactivation defect R-4.19 fixed; I followed the criterion.
- **U-7:** no accepted criterion says what a non-administrator sees at `/users`. R-4.15's missing page was superseded and never restated.
- **U-8:** no criterion covers an empty list or a search that matches nobody.
- **U-9:** the capability names and descriptions aren't in the spec, so the stories use illustrative ones. A failed save on those checkboxes is also unspecified.
- **U-10:** no criterion says what the notifications section shows for an account with no email address.
- **U-11:** no criterion covers picture file limits, a failed upload or removing a picture.
- **U-12:** the addresses of the terms and privacy pages aren't named anywhere.
- **U-4:** "GitHub" and "IDIR" are provisional wording; the criteria only say code-hosting and government identity.
- **U-13:** the failed sign-out and each notice use their own heading instead of the surface title.
- **U-14:** the account ID is shown visibly because the surface requires it.
- **U-15:** the explanation on the sign-in-required screen is my addition.
- **U-16:** `data-testid` is a DOM attribute, and constitution J3 forbids DOM selectors in acceptance tests. Someone needs to rule on that.
- **U-17:** agreeing to updated terms is a confirmation dialog, since no criterion asks for a tick box.
- **U-18:** a refused profile completion is unstated.

## Ruling

**Verdict:** return
**By:** agent:ux-reviewer

The question is whether the fourteen users screens serve the users criteria and are built from the design system. Ruling: return. Most of it holds up. design/screens.yaml declares 53 states and there are exactly 53 stories, one per state. Every colour, spacing and type value in design/catalogue/users.shared.tsx is a token (a search for hex, rgb, px, rem and named colours found none). 125 of the 126 test IDs are filled, and the empty one is explained. Dialog labelling, disclosure state, table caption and headers, and the error-summary link targets are wired correctly. But this persona refuses any accessibility violation, and there is one: users.shared.tsx:212 puts aria-labelledby on a div with no role. ARIA 1.2 prohibits that (axe rule aria-prohibited-attr), so the error summary rendered in all four invalid-form states is never announced by its name when it takes focus. Also, nothing was compiled or rendered and none of the checks is an accessibility scan, so zero violations is claimed but not shown. Separately, six native patterns stand in for missing design-system components (data table, section navigation, status label, file input, card, loading message). Under this persona that must go to the tech lead, not be approved at this gate. This becomes an approve, or an escalation for the new patterns only, once the violation is fixed, an automated scan of every story reports zero violations against the installed design-system release, and the native patterns are sent to the tech lead.

**Conditions:**
- Fix users.shared.tsx:212: give the error-summary wrapper a role that allows a name (role="region" or role="group"), or remove aria-labelledby from it.
- Install @bcgov/design-system-react-components, @bcgov/design-tokens and @bcgov/bc-sans, compile the catalogue, and resolve every prop and token name listed under gap U-1.
- Run an automated accessibility scan (axe or equivalent) over all 53 stories and attach the results showing zero violations.
- Escalate the six native patterns (data table, section navigation, status label, file input, account-choice card, loading message) to the tech lead as new patterns not in the design system.
- Resolve U-19: move the shared module out of design/catalogue/ or confirm the catalogue check accepts it, so the catalogue folder holds only stories.
- Leave U-16 (test IDs versus constitution J3) and the spec gaps U-6 to U-12, U-17 and U-18 to their owners; they do not block this gate.
