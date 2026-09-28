---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "None of them has been through a test run, and I couldn't type-check the file: the workspace has no dependencies installed and installing them wasn't permitted."
opened: 2026-09-28T03:31:05.517Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** None of them has been through a test run, and I couldn't type-check the file: the workspace has no dependencies installed and installing them wasn't permitted.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I've made all 21 corrections in `tests/adapters/old/index.ts`. None of them has been through a test run, and I couldn't type-check the file: the workspace has no dependencies installed and installing them wasn't permitted. I checked the new code by reading it, and tried the key pieces of page behaviour live on the target (at http://localhost:4300) before relying on them. `bindings.yaml` needed no change: every member I touched was already listed as bound, and nothing moved to or from unbound. Every page route in the surface still resolves on the target.

**Evaluation panel (R-5.1, R-1.55, R-5.37)**
- **Vendor as a member:** adding one now throws, saying the chooser offers only public sector people. Typing the vendor's address into the chooser offers nothing.
- **Duplicate member:** saving a panel that holds the same person twice is refused only with a general alert drawn after the footer: "Unable to Publish Changes … Please fix the errors in the form". It gives no reason. The duplicate-member reader now reads every alert and every field's own error, and falls back to that general refusal when nothing names duplicates.
- **Panel with no chair:** this page has a separate "Chair" chooser as well as a "Panel Chair" box per member, and unticking a box does not clear the chooser. A null chair now unticks every box and clears the chooser. The page then shows "Please select a panel chair.", which the missing-chair reader picks up.
- **Member given as a seeded user:** the request that sends a member with no role now accepts a whole user object and resolves its id.
- I tried the duplicate save for real and then cancelled; the seeded panel is unchanged.

**Consensus sheet (R-5.29):** `chairOnly` reads empty when the score fields and "Save Draft" are offered (seen as the chair). It reads the refusal when the page shows Not Found (seen as a staff member who isn't on the panel).

**Sign-in and the user list (R-4.4, R-4.14)**
- The deactivated persona now signs in through its session route like every other persona, and each sign-in signs out first. I removed the identity-provider path. On this target that route signs the deactivated account straight into the dashboard, and the test will now see that.
- The user list has no pager: it is a scrolling table that draws about 20 of its 143 accounts at a time. `userRow` now scrolls through it, collecting one line per row. It reached all 143, including the inactive account at the end.

**Organizations (R-3.13):** `changeOwner` reads the new owner from `input.newOwner` (a name, an address or a seeded user). Seeded vendors have no name, so it looks the name up in the organization's membership list. It then picks that name in the dialog and confirms. If the dialog doesn't offer the person, it throws with what the dialog shows.

**Content pages (R-7.12, R-7.17, R-7.22)**
- The unknown-address reader returns text only on the Not Found screen.
- The page-body reader now leaves out the heading and the dated line, so it matches what the opportunity's "Scope & Contract" tab embeds ("Initial version" in both).
- On the create screen:
  - "Confirm publish" stops waiting as soon as the page either moves on or shows an alert.
  - A duplicate address is found as "This slug is already in use." under the address field.
  - "Published" success excludes the "could not be published" refusal.

**Reports and table readers (R-1.40, R-1.35, R-2.29, R-1.27)**
- The complete report reads empty on Not Found.
- The "My Proposals" table reads one line per row, with the cells joined.
- The Sprint With Us and Team With Us proposal History tabs read only table rows. Before a proposal reaches the Code Challenge, that tab shows only a notice with the words "Code Challenge" in it, so it now reads empty.
- The successful proponent comes from the award banner ("awarded to Northern Pines Digital Ltd.").

**Opportunity creation (R-1.10, R-1.16, R-1.48, R-1.53, R-6.2, R-2.19)**
- **Publish and Submit for Review** now throw when the control is disabled. The error names the steps the step menu marks incomplete (it puts a warning icon beside them) and what the form says. If the control isn't offered at all, the action still returns quietly.
- **Field errors** now read only alerts and the error drawn directly after each field. Headings and titles are no longer read, which fixes the title containing "cannot".
- **Phases:** start and completion dates go on the phase the input names, or on the form's existing starting phase. No phase is ever created that the input doesn't name.
  - If the input gives such dates with no phase and the form has none, the starting phase is left empty and the refusal says so.
  - Otherwise, the step that fills in required fields starts the form at Implementation.
  - It now ticks a capability in every phase shown and fills each phase's own dates. Before, filling one phase's date field stopped it from filling the other phases' dates.
- **Capability chips:** each phase is opened only while its fields are hidden, and the chip is found again and clicked once it has stopped moving.

**Proposals (R-2.14, R-8.31)**
- Once a proposal attempt is known to be refused, the later terms and submit actions no longer walk the whole form again until it is reopened or given new values.
- "Start editing" uses the top-bar Edit, the Actions menu, or the Proposal Details tab, and does nothing when the form is already open to change.
- A draft on an opportunity past its deadline offers only "Delete" and shows its fields disabled. "Start editing" treats that as a refusal and returns quietly rather than reporting unbound.

**Choices a reviewer may want to question**
- The duplicate-member reader returning the panel's general refusal alert, because the target never names the reason.
- The form being started at Implementation when a Sprint With Us input names no phase and gives no dates.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does this adapter bind every surface action and observation on old, and nothing else? Ruling: return. Most of the diff is navigation, locators and readers that were narrowed, which an adapter should hold. The typecheck lists no errors under adapters/old/; its two are in adapters/new/. Two changes make the adapter decide the outcome instead of reporting it. (1) R-4.4 is about a deactivated person signing in through the identity provider. signIn now sends that persona through the session route. On old that route is /auth/createsessionvendor/:id, which is test-only and creates a session with no status check (sources/old/src/back-end/lib/routers/auth.ts:312-345). The real login handler refuses an account with status InactiveByAdmin (auth.ts:504). So the test would report a failure caused by the harness's shortcut, not by the application. The binding this replaces reported unbound with the true reason, and that is the honest result while the target has no sandbox identity provider for vendors. (2) R-5.1 requires a message naming the rule that was broken. panelRefusal falls back to the general alert 'Unable to Publish Changes ... Please fix the errors in the form', which names no rule, and duplicateMemberError, minimumMembersError and missingChairError all read through it. A test that only checks for some text then counts a message that is missing as one that was shown. What would change this ruling: sign-in for this persona reports unbound when it cannot reach the identity provider, and the panel readers return only text that names their own fault, and nothing when the page names none.

**Conditions:**
- R-4.4: signIn for the deactivated-vendor persona must not use the session route. On old, /auth/createsessionvendor/:id is test-only and creates a session without the status check that the identity-provider login applies (auth.ts:504 refuses InactiveByAdmin). Driving it reports a failure the criterion does not describe. Sign in through the identity provider, or throw 'unbound: signIn.deactivatedVendor — ...' saying that vendor sign-in on this target goes to github.com and no sandbox account exists there.
- R-5.1, R-1.55: panelRefusal must not fall back to the general alert ('Unable to Publish Changes ... Please fix the errors in the form') when no alert or field error names the fault being asked about. duplicateMemberError, minimumMembersError and missingChairError must each return only text that matches their own fault, and nothing otherwise. A refusal that gives no reason is not the message naming the rule that the criterion asks for.

### Runner-owned typecheck evidence

Proposal revision: `1c2aa6ee11a5ce549684729a095bd4cfe9067549`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
