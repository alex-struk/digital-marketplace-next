---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I changed only what the four conditions named, plus a few stale reasons on other pages that repeated the same false claims."
opened: 2026-10-03T05:04:26.040Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I changed only what the four conditions named, plus a few stale reasons on other pages that repeated the same false claims.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

## Journal: revising the binding for target "new", organization screens

I changed only what the four conditions named, plus a few stale reasons on other pages that repeated the same false claims. I worked against the running build at http://localhost:4300. I signed in through the identity provider as three seeded vendors: the organization owner (test-vendor-2), an organization member (test-vendor-4) and the invited vendor (test-vendor-9).

**What the current build shows**

- **Organization edit screen, as the owner, on …301 and …304:**
  - The header shows the badges "Sprint With Us qualified" and "Team With Us qualified" on …301 only, and the line "Organization ID: <id>".
  - The "Organization sections" links are Organization, Team members, Sprint With Us qualification, Team With Us qualification and Changelog.
  - The Organization section holds "Edit organization", which opens a form with "Choose a logo (optional)", the fields, "Save changes" and "Cancel".
  - A refused logo file gets an alert inside the logo group that ends "…Please select a different logo image. The current logo has been kept."
  - "Archive organization" asks for confirmation in a dialog.
  - The other four sections say only "This section is not available yet."
  - A member who does not own the organization gets "Page not found".
- **The profile's Organizations section** (`/users/<own id>` and `/users/me`, `?tab=organizations`) shows two regions:
  - "Organizations you own": "Create organization" over a table of Organization (linked), Team members and Sprint With Us qualified. With nothing owned, it shows an empty-state message instead.
  - "Organizations you belong to": a table of Organization and Membership ("Member" or "Pending"). Names are plain text and no row has a control. With nothing to list, it shows an empty-state message.
- **What does not exist:**
  - No invitation email reaches the mail catcher, because the team section that would send one is not built.
  - Opening the reference application's invitation-answer address with the seeded pending invitation shows no dialog.
  - Both terms pages still answer "Page not found" to the owner.

**What changed in `index.ts`**

- **organization-edit:**
  - Bound by role and name: save_changes, cancel_editing, change_logo, current_logo, logo_refused_error, organization_identifier, both qualified badges and field_error.
  - Opening the edit form now leaves a form that is already open alone, so a chosen logo survives until it is saved.
  - Every member that lives in an unfinished section now opens that section first. While the section still says "This section is not available yet.", the member reports unbound and quotes that text.
- **`orgSection`:** it no longer falls back to the first tab panel or the whole main text. If the region named after the section is missing, it returns "".
- **Both memberships pages:** the `absent(...)` stubs are replaced by a real page object built from the regions above.
  - Bound: create/open organization, both tables, the pending badge, team member count, the Sprint With Us mark and both empty messages.
  - Approve, reject and leave report unbound, naming the row they found without a control.
  - Accept and decline confirmation report unbound unless a dialog is actually open.
- **The shared "nobody signs in" reason** now describes the current build. The organization-list, vendor-dashboard and image-picker reasons no longer claim the organization screens are missing.
- **Organization list:** its pager is named "Pages of organizations", which the old pagination reader never matched, so it would have returned "" on a page that has a pager. I fixed that reader and the page-change control.

**What changed in `bindings.yaml`**

- organization-edit: 21 of 39 members bound. The other 18 are unbound with reasons that describe the empty sections.
- Each memberships page: 10 of 14 bound. Invitation answers, leave, and both confirmations stay unbound.
- organization-list: change_page, open_organization, create_organization and my_organizations are now bound.
- I rewrote the terms-page reasons. In 281 proposal and evaluation reasons I corrected the clause that said organization screens answer "Page not found".

**What I could not do, and what I changed on the target**

- I could not run the typecheck, Node or Python here: there is no `node_modules` or `tsc`, and running scripts needed approval this unattended session cannot get. I reviewed the types by hand and checked by hand that bindings.yaml names every surface member exactly once, but the runner's typecheck has not run on this revision.
- I could not check whether the administrator sees another account's Organizations section.
- To learn how a stored logo is shown, I saved a 1×1 PNG as the logo of seeded organization …304 (Salt Marsh Labs Ltd.). It now has a logo it did not have in the seed.

Every surface page's route resolves except the two organization terms pages, which still answer "Page not found".

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the revised binding for target 'new' bind every organization surface action and observation the current build offers, give every other member a true reason, and do nothing else? Approved. All four instructions the bind-adapter-new-56 ruling left open are settled. On organization-edit, 21 of 39 members are bound (save_changes, cancel_editing, change_logo, current_logo, logo_refused_error, organization_identifier, both qualified badges, field_error and the five section readers). The other 18 are unbound with reasons that describe the four unfinished sections ('This section is not available yet.') rather than 'Page not found'. Both organization-user-memberships pages are rebuilt on the 'Organizations you own' and 'Organizations you belong to' regions in place of the absent() stubs. Approve, reject and leave are unbound because no row has a control, and the two confirmations are unbound unless a dialog is open; each reason names what the page lacks. orgSection now returns an empty string when the named region is missing, with no fallback to a tab panel or the main text. The shared NOBODY_SIGNS_IN reason describes the current build, and no reason in bindings.yaml or index.ts still says the organization screens answer 'Page not found'. The new members only navigate, locate and read; none decides a pass, and submit_disabled_until_valid only reports the control's state. Nothing under tests/acceptance changed, and the runner's typecheck on this revision passed with no diagnostics under adapters/new. Separately, the authoring session gave seeded organization ...304 a logo on the running target; that is target state, not adapter code, and the seed should be reloaded before verify. This ruling would change if a member marked bound were shown to read something other than what its name says.

**Conditions:**
- condition-met bind-adapter-new-56#1: organization-edit in tests/adapters/new/bindings.yaml (lines 667-708) binds save_changes, cancel_editing, change_logo, organization_identifier, swu/twu_qualified_badge, field_error, current_logo, logo_refused_error and the section readers; the other 18 members are unbound with reasons describing the unfinished sections, and none still says 'Page not found'
- condition-met bind-adapter-new-56#2: membershipScreen() in tests/adapters/new/index.ts replaces both absent(...sectionRedrawn...) stubs and binds against the 'Organizations you own' and 'Organizations you belong to' regions; bindings.yaml (lines 734-750 and the -self page) binds 10 of 14 members, and approve/reject/leave and both confirmations are unbound with reasons naming what the page lacks
- condition-met bind-adapter-new-56#3: orgSection in tests/adapters/new/index.ts returns the region named after the section link or an empty string, with no fallback to a tab panel or mainText()
- condition-met bind-adapter-new-56#4: NOBODY_SIGNS_IN in tests/adapters/new/index.ts now describes the current build (organization list, create and owner's edit screens served; proposal, evaluation and organization terms screens answer 'Page not found'), and no reason in bindings.yaml or index.ts still says the organization screens answer 'Page not found'

### Runner-owned typecheck evidence

Proposal revision: `02c685495be8861e43a5dd19176d1113aa1e5028`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
