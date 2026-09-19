---
stage: "design"
title: "design organizations"
at: "2026-09-19T07:14:30.423Z"
cost: 9.2156525
turns: 100
session: "579c9b7a-573f-4e7b-931c-30cb4e26b181"
---

I've designed the seven organizations screens. The pipeline hasn't compiled or scanned the catalogue yet; that happens after this turn, and the result will be in `design/report.json`. I found 16 things the criteria don't say, and I listed them rather than filling them in.

**What I wrote**
- **`design/screens.yaml`:** entries for all seven pages, added after the other domains' entries.
- **`design/catalogue/`:** 51 stories, one per declared state, titled `organizations/<page>/<state>`.
- **`spec/contract/surface.yaml`:** every `test_id` on these pages is filled in. I checked by hand that each ID appears in a story, and no `null` is left on these pages.
- **`design/DESIGN.md`:** a new "Domain: organizations" section added at the end. Nothing already there was changed.

**The main design decision.** A control is shown only to people the service lets use it. R-3.18 exists because the old service showed Edit and Archive to people it then refused. So an organization administrator who isn't the owner gets a read-only profile. Only a service administrator sees Approve, Change owner and Edit service areas. The Accept button on a terms page isn't shown to a service administrator. `DESIGN.md` has a table of who sees what.

**States, and why each exists**
- **`organization-list`:** default (vendor), administrator, signed-out, loading, refused. The three viewer states differ because R-3.21 changes the columns. Signed-out also covers public sector staff, who see the same screen. Refused is there because the surface observes a refusal that must look different from an empty list.
- **`organization-create`:** default, invalid, ready, not-found. The surface says the submit button stays disabled until the form is valid. So each field is checked when the person leaves it, and a list of problems sits just before the disabled button, explaining why it's unavailable.
- **`organization-edit`:** 22 states across its five tabs:
  - Organization tab: default, org-admin, editing, invalid, archive-confirm.
  - Team tab: team, team-administrator, invite-open, invite-refused, invite-invalid-type, invite-unregistered, admin-rights-confirm, remove-member-confirm, change-owner.
  - Qualification tabs: swu-qualification, swu-qualified, twu-qualification, twu-administrator, service-areas-editing.
  - Also changelog, not-found and loading.

  Each one either follows one criterion's example or shows a dialog.
- **Both terms pages:** default, accepted, administrator.
- **Both memberships pages:** default, empty, loading, accept-confirm, decline-confirm, leave-confirm, section-unavailable. When someone arrives from the invitation email (R-3.35), the accept or decline dialog is already open.

**Components.** Most of the catalogue is built from these design-system components: `TextField` (read-only for view mode), `Button`, `ButtonGroup`, `Link`, `InlineAlert`, `Modal` with `AlertDialog` or `Dialog`, `Heading`, `Text`, and `Checkbox`/`CheckboxGroup`/`Select`. I only used components and props that the other domains' stories already compile with; the packages aren't installed here, so I couldn't check further. `DESIGN.md` lists the project's own components separately. Four are reused from the other domains unchanged (status badge, data table, tab navigation, card section). Two are new:
- **Pagination:** I found no design-system component for it. If the installed version has one, it should replace mine.
- **Requirement list:** a plain list of qualification requirements, each marked Met or Not met in words.

**Test IDs.** Some IDs are shared with other pages: `field-error`, `not-found-page`, `profile-tab-*`, `organization-create-link`, `organization-pending-badge` and `organization-swu-qualified-mark`. One element serves two names: `organization-submit-button` is both `create_organization` and `submit_disabled_until_valid`. Where an action opens a dialog, the ID is on the button that opens it, and the stories carry extra IDs for the dialog's own buttons.

**Gaps (all in `DESIGN.md`)**
1. No criterion says who is refused the organization list. R-3.1 makes it public, and the refusal in R-3.20 has no screen of its own.
2. No criterion says what an empty organization list shows, so it has no empty state.
3. R-3.2 says registration is refused but not what the refused person sees. I reused the "page not found" screen.
4. R-3.22's example submits an invalid form and has the field reported, but the surface says the submit is disabled until the form is valid. The design reports each field as the person leaves it instead.
5. R-3.22 doesn't say what a valid website or phone number looks like.
6. Much of the wording is mine because no criterion gives it: the empty messages, the not-qualified notices, the invitation messages and the dialog text.
7. Nothing says what happens when some invitations in one batch are refused and others aren't.
8. The text of the statement confirmed before giving administrator rights isn't in the spec (it's a placeholder). Nothing says whether withdrawing rights should ask first; it acts at once.
9. R-3.33 names only two changelog entries. "Ownership Transferred" is a placeholder.
10. Several refusal messages can never appear on a screen, because the control that would trigger them isn't shown. These are R-3.9, R-3.11, R-3.12, R-3.18 and R-3.27's second acceptance.
11. Actions that go through a dialog take two steps, but the surface names only one. The opportunities domain has the same gap.
12. It isn't stated whether an organization administrator, not just the owner, may accept program terms. Nor is it stated who is refused the terms pages.
13. The logo isn't in the list stories: the token set has no image-size token, so a token needs adding. Nothing says the list shows service areas, so it doesn't.
14. The spec doesn't include the capability list, the Team With Us service-area names or the terms text. The stories use placeholders marked as such.
15. The web address the invitation email opens isn't specified.
16. Nothing says what a person sees when an immediate change or a save fails for a reason other than validation.

## Fix turn

I fixed the `landmark-unique` failure on the default stories of `organization-user-memberships` and `organization-user-memberships-self`. The scan now needs to run again to confirm it clears.

**Journal addition:** Both stories had two landmarks with the same role and the same name. The "Organizations you own" section is labelled by its heading. The scrollable table wrapper inside it is also a region, and it is labelled by the table's caption, which read the same "Organizations you own". I changed that caption in both files to "Owned organizations, with team size and Sprint With Us qualification", so each region now has its own name. Nothing else changed: no test IDs, structure, other stories, `DESIGN.md` or `screens.yaml`. The empty-state stories had no inner table region, so they had no clash and were left alone. The affiliated table's caption was already different from its section heading.