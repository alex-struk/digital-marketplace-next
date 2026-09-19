---
version: 0.1.0
name: "digital-marketplace-next"
description: "Administers British Columbia's Code With Us, Sprint With Us and Team With Us procurement programs, letting public sector staff publish procurement opportunities and letting vendors submit proposals against them."
sources: []
tokens:
  colour: []
  type: []
  space: []
  radius: []
components: []
---

<!-- Structure adapted from bcgov/crow v0.6.0's DESIGN.template.md. -->

# Design — digital-marketplace-next

## Overview
What this service is, who uses it, and the one or two design decisions that shape everything else.

## Principles
The two or three rules a designer or agent should apply when a case isn't covered below.

## Typography
Type scale, families and weights, and where each is used.

## Colour
Palette, usage rules, and the contrast ratios each pairing must meet.

## Layout and responsive behaviour
Grid, breakpoints, and how layout reflows from mobile to desktop.

## Components
Each component this service uses, its states, and a link or reference to its source.

## Forms and validation
Field patterns, inline vs summary error presentation, and required-field marking.

## Decisions and service states
Empty, loading, error and success states, and how a decision (approve/deny/etc.) is presented.

## Motion
What animates, what doesn't, and the reduced-motion fallback.

## Known gaps
Anything this document doesn't yet cover.

---

## Domain: users

Screens for signing in, signing up, signing out, the two service notices, the administrator's list of
everyone registered, and a person's profile with its capabilities, notifications and legal sections.
The profile is reached two ways, by account identifier (`user-profile*`) and as the signed-in person
(`user-profile-self*`, the `/users/me` routes). Both render the same design. They are separate
entries because different criteria turn on them. Every state named in `design/screens.yaml` has a
story at `design/catalogue/<page>.<state>.stories.tsx`, and the story is what a build copies.

### Components this domain is built from

All from `@bcgov/design-system-react-components`, unless the entry says otherwise.

| Component | Used for |
| --- | --- |
| `Heading` | The one H1 per screen, set to the page title the surface names, and the H2 of each section. The levels follow the document outline, not visual size. |
| `Text` | Body copy, and secondary text such as the account identifier and field hints (`size="small" color="secondary"`). |
| `Button` | Every command. `primary` is used once per view for the main action. `secondary` is used for alternatives and Cancel. `secondary` with `danger` is used for Deactivate outside a dialog. `tertiary` with `size="small"` is used for the capability "Show description" disclosure. |
| `ButtonGroup` | Save and Cancel on profile forms, and Cancel and Export in the export dialog. |
| `Link` | Navigation, including the profile section links and the terms links. `isButton` is used where a link should look like a button (Back to home). |
| `TextField` | Every text input. Read-only profile details are also `TextField` with `isReadOnly`, so the label, value and read-only state are exposed the same way in view and edit. |
| `Checkbox`, `CheckboxGroup` | The terms agreement, the new-opportunity notice choice, capabilities, the Administrator permission, and the export choices. |
| `Form` | Always `validationBehavior="aria"`, so invalid fields are announced rather than blocked natively. |
| `InlineAlert` | The error summary (`danger`), save failures (`danger`), the terms-changed warning (`warning`), the "deactivated by owner" explanation (`info`), and signed-out success (`success`). |
| `Modal` + `AlertDialog` | Every confirmation: deactivate (`destructive`), reactivate and agree to terms (`confirmation`), unsubscribe (`warning`). |
| `Modal` + `Dialog` | The contact-list export, which is a small form rather than a yes/no decision. |
| `ProgressCircle` | Indeterminate loading, always inside a `role="status"` container, next to visible text. |
| `FileTrigger` (from `react-aria-components`) | Opens the profile-picture chooser behind a `Button`. The picker's own states belong to the files domain (`file-image-picker`). |

Three things are **project-specific adaptations**, not design-system components, and must not be
presented as official:

- **Profile section navigation.** No released tabs component was used. Each section has its own
  route (`?tab=…`), so the sections are a `<nav aria-label="Profile sections">` holding a list of
  `Link`s, with `aria-current="page"` on the section being shown. Only the sections that belong to
  the profile being viewed are listed (see "Which sections a profile offers" below).
- **Status badge.** A `<span>` with a token border (`--layout-border-width-small`,
  `--surface-color-border-medium`) and a circular radius (`--layout-border-radius-circular`). The
  status is always the word itself ("Active", "Inactive"), so it is never conveyed by colour alone.
- **User table.** A native `<table>` with a `<caption>` and `scope="col"` headers. It sits in a
  focusable `role="region"` labelled by the caption, which scrolls horizontally at narrow widths.
  This is the one legitimate two-dimensional reflow exception on these screens.

Layout uses only tokens: `--layout-margin-{none,small,medium,large}` for gaps,
`--layout-padding-{none,small,large}` for padding, `--layout-border-width-small`,
`--layout-border-radius-{medium,circular}`, and `--surface-color-border-{default,medium}`. No colour,
size or radius value is written anywhere in the catalogue.

### How a screen is laid out

A single-column grid, with `--layout-margin-large` between regions and `--layout-margin-medium`
inside a section. The regions come in this order: the H1; the profile section navigation, where
there is one; any page-level alert or error summary; then the content sections, each a
`<section aria-labelledby>` with its own H2. Action rows wrap (`flex-wrap`) instead of overflowing.
Cards on the sign-in and sign-up screens stack vertically at every width, so there is no breakpoint
to maintain. The layout must reflow at 320 CSS pixels and 400% zoom with nothing lost. The user
table is the only thing allowed to scroll horizontally.

### Forms and validation

These rules apply to the profile-completion form (`user-sign-up-complete`) and the profile edit form
(`user-profile`, `user-profile-self`).

- **Fields.** Name is required and 1–100 characters. Email address is required and must be in a
  valid format. Job title is optional and up to 100 characters, and is **shown and asked for only
  on a public sector employee's profile** (R-4.27, R-4.28). The profile picture is optional. The
  sign-in username is always a read-only `TextField` with the description "This cannot be changed."
- **Required marking.** Use `isRequired` on the component, which exposes the requirement in text
  and programmatically. Mark optional fields in their label ("Job title (optional)", "Profile
  picture (optional)").
- **When validation runs.** On submit, not on each keystroke. `maxLength` stops overlong input
  as it is typed.
- **An invalid field.** It gets `isInvalid` and a specific `errorMessage` directly under the field
  ("Enter your name"; "Enter an email address in a valid format, like name@example.com"). The value
  the person typed is kept.
- **The error summary.** When a submit fails validation, a `danger` `InlineAlert` appears above the
  form, titled "Your changes have N problems" (or "Your profile has N problems" on sign-up). It
  sits in a `tabIndex={-1}` wrapper, focus moves to it, and it lists one `Link` per problem to the
  field's `id`. Each list item carries `data-testid="field-error"`, so a test counts problems by
  counting that ID.
- **A save the service refuses.** If the fields were valid but the service refused the save, a
  `danger` `InlineAlert` with `role="alert"` says "Your changes could not be saved. Nothing you
  entered has been lost." It deliberately does not name a cause, because R-4.6 says a duplicate
  email address is indistinguishable from any other fault. The form stays open with the input kept.
- **Terms agreement on sign-up** (R-4.3). "Complete profile" is `isDisabled` until the agreement
  box is ticked. This is the one place a submit control is disabled, and it is disabled because the
  criterion and the surface (`complete_disabled_until_terms_accepted`) require it. A disabled
  React Aria button cannot take focus, so the reason is given as **visible text placed before the
  button** ("Agree to the terms and conditions and the privacy policy to complete your profile"),
  as well as through `aria-describedby`. The links to read the terms come before the box.
- **Controls that save immediately.** The capability checkboxes (R-4.8), the new-opportunity notice
  checkbox, and the Administrator checkbox (R-4.12) save as soon as they are changed, and each
  screen says so in text before the control. The outcome is announced through a `role="status"`
  region already on the page. Turning notices **off** from the notifications section asks first
  (see the confirmation dialogs below). A refusal is shown as a `danger` `InlineAlert` right after
  the control, linked to it by `aria-describedby`, and the control returns to its saved value
  (`user-profile.admin-refused`).
- **The export form** (R-4.32). "Export" is disabled until at least one account type and one field
  are ticked, which the surface also observes (`export_disabled_until_selection`). The reason is
  stated in visible text before the buttons. Both groups are `CheckboxGroup` with `isRequired`.

### Confirmation dialogs

Every consequential change asks first, in a `Modal` holding an `AlertDialog`: deactivating an
account, reactivating one, agreeing to updated terms, and stopping new-opportunity notices. The
dialog title is a question. The body says what will happen, in plain words, including who will be
emailed. The buttons are the specific action ("Deactivate account", "Reactivate account", "I agree",
"Unsubscribe") and Cancel. Destructive dialogs use `variant="destructive"` and a `danger` primary
button. Focus moves into the dialog and stays there, Escape dismisses it, and focus returns to the
control that opened it. Nothing changes until the action button is pressed.

### Loading, empty, refused, not found

- **Loading.** The H1 renders at once. Below it, a `role="status"` row holds an indeterminate
  `ProgressCircle` with an `aria-label` and the same words as visible text ("Loading profile…").
  Focus is not moved or trapped. Stories: `user-list.loading`, `user-profile.loading`,
  `user-profile-self.loading`, `user-sign-out.loading`.
- **Not found and refused.** A person who may not see a profile, anyone but an administrator
  opening the user list, and an unknown notice name all get the same page: H1 "Page not found", one
  sentence, and a primary "Back to home" link, with `data-testid="not-found-page"` on the page
  wrapper (R-4.25). It never says "not allowed", so the page does not reveal that the record exists.
- **A section the profile does not offer.** Asking for a section that does not belong to the
  profile being viewed shows the profile section instead, with the H1 "User Profile" and no error
  (R-4.34). These are the `section-unavailable` states.
- **Empty.** No screen in this domain is designed with an empty state, because no criterion says
  what one shows. See "Gaps" below.

### Which sections a profile offers (R-4.34, R-4.33)

| Who is looking at whose profile | Sections listed in the profile navigation |
| --- | --- |
| A vendor, their own | Profile, Capabilities, Organizations, Notifications, Legal |
| A public sector employee or administrator, their own | Profile, Notifications |
| An administrator, somebody else's | No navigation. The profile section only. |

What the profile section shows also depends on who is looking:

- **Status badge.** Shown only to an administrator.
- **Administrator checkbox.** Shown only to an administrator viewing somebody else's profile.
- **Read-only permissions label.** Shown to a public sector employee or administrator viewing their
  own profile.
- **Edit profile.** Offered only to the owner (R-4.18).
- **Deactivate.** Offered to the owner, except an administrator viewing their own profile (R-4.31),
  and to an administrator viewing an active account.
- **Reactivate.** Offered only on an account an administrator deactivated. An account its owner
  deactivated instead shows an `info` `InlineAlert` saying the person reactivates it by signing in
  again (R-4.19).

### Accessibility obligations

WCAG 2.1 AA applies (constitution P1 and J5), and the design aims at 2.2 AA where it costs nothing
more.

- **Structure.** One H1 per screen. Headings never skip a level. Sections are labelled by their
  headings.
- **Labels.** Every control has a persistent visible label. Placeholder text is never used as a
  label.
- **Status.** Status and validity are always carried by text as well as colour.
- **Link and button text.** It makes sense out of context. The capability disclosure reads "Show
  description of Backend development", and toggles `aria-expanded` with `aria-controls` pointing at
  the description.
- **Announcements.** Loading and immediate saves use `role="status"`. Refusals and failed submits
  use `role="alert"`.
- **Dialogs.** They follow the alert-dialog pattern described above.
- **Section navigation.** The current section is marked with `aria-current="page"` as well as its
  visual treatment.
- **The user table.** It has a caption and column headers, and its scroll region can be reached
  by keyboard.
- **Page titles.** On client-side navigation the document title is set to the surface title and
  focus goes to the H1.
- **Checks still required.** A clean automated scan does not show conformance. Keyboard-only use,
  screen-reader smoke tests of the dialogs and the error summary, and 400% zoom have not been done
  and are required before the build is accepted.

### Test IDs

Every `test_id` in `spec/contract/surface.yaml` for the pages above is the `data-testid` a story
puts in the markup. The rules:

- **One ID per kind of element.** An element that repeats reuses one ID: `user-list-row`,
  `capability-row`, `legal-program-terms-link`, `field-error`, `contact-list-user-type`,
  `contact-list-field`. A test tells the copies apart by their accessible name.
- **An action and an observation on the same element share its ID.** `sign-up-terms-checkbox` is
  both `accept_app_terms` and `terms_checkbox`. `sign-up-complete-button` is both `complete_profile`
  and `complete_disabled_until_terms_accepted`. `contact-list-export-button` is both
  `export_contact_list` and `export_disabled_until_selection`. `capability-checkbox` is both
  `toggle_capability` and `capability_checked`. `legal-app-terms-link` is both `open_app_terms` and
  `app_terms_link`. `profile-admin-checkbox` is both `toggle_admin_permission` and `admin_checkbox`.
- **The same field keeps the same ID on every page.** `idp-username-field`, `name-field`,
  `email-field`, `job-title-field`, `change-avatar`, `not-found-page`, and the `profile-tab-*` links
  are the same wherever they appear.
- **A build must make each ID land in the DOM.** Where a design-system component does not pass a
  `data-*` attribute through to its rendered element, wrap the component in a `div` carrying the ID,
  as the stories already do for the `InlineAlert`s.

### Per-screen notes

**user-sign-in** — `default`. Two cards, one per identity (vendor with a code-hosting account,
public sector employee with a government account), each with a secondary button, then a link to
sign up. Sign-in has no failure state of its own: a failed sign-in lands on `user-notice`
(`sign-in-failed`).

**user-sign-up-choose-account** — `default`. It has the same anatomy as sign-in, and explains that
the account is created on first sign-in and its kind follows the identity used (R-4.1).

**user-sign-up-complete** — `default` (box unticked, Complete disabled), `terms-accepted` (Complete
available), `invalid`, `save-failed`. The page admits only a vendor who has not yet agreed to the
terms (R-4.23), and a vendor is never asked for a job title (R-4.28). So the job title field is
never rendered here, and `job_title_field` is bound to `job-title-field` only so that a test can
observe that it is absent.

**user-sign-out** — `default` (success, with a "Sign in again" link), `loading` (the request is in
flight), `failed` (an alert saying the person may still be signed in, and to try again) (R-4.17).

**user-notice** — `default` is `/notice/deactivatedOwnAccount`: it confirms the deactivation and
says signing in again reactivates the account (R-4.9, R-4.5). `sign-in-failed` is
`/notice/authFailure`: a generic "Sign in failed, please try again", with Try again and Back to home
(R-4.4). It does not name a cause, which also covers R-4.1's unrecognised identity and R-4.6's
duplicate email address. `not-found` covers any other name.

**user-list** — `default`, `loading`, `export-open` (nothing chosen, Export disabled),
`export-ready`, `not-found` (anyone but an administrator, R-4.21). The table has four columns:
Status, Account type, Name (a link to the profile), and Administrator ("Yes"/"No"). It is ordered
by status, then account type, then name, and the caption says so (R-4.14). "Search by name" is a
`type="search"` `TextField` that narrows the list as the person types and matches name words in any
order. The export dialog states that only active accounts are exported, and that administrators are
included with public sector employees (R-4.32).

**user-profile** — `default` (an administrator viewing another person's active account: no
navigation, a status badge, read-only details, the Administrator checkbox, Deactivate), `loading`,
`not-found`, `own` (a vendor on their own profile by identifier), `editing` and `invalid` (the owner
editing, shown for a public sector employee so the job title field and permissions label appear),
`admin-refused` (an Administrator tick on a vendor refused with "Vendors cannot be granted
administrator permissions"), `deactivate-confirm`, `deactivated-by-admin` (Reactivate offered, with
the deactivation date), `reactivate-confirm`, and `deactivated-by-owner` (no Reactivate; it
explains that the person comes back by signing in).

**user-profile-capabilities** / **user-profile-self-capabilities** — `default` is a vendor's list
of capability checkboxes, each with a description disclosure. Choices save as they are made, and
unticking everything is allowed (R-4.8). `section-unavailable` is an administrator (or, on the self
page, a public sector employee) being shown the profile section instead.

**user-profile-notifications** / **user-profile-self-notifications** — `default` states the address
notices go to, links to correct it on the profile, and gives the new-opportunities checkbox.
`unsubscribe-confirm` is the question, naming that address, that is asked before notices stop,
both from the checkbox and on arrival from a message's unsubscribe link (R-4.29).
`user-profile-notifications` also has `section-unavailable`, for an administrator on someone
else's profile. The self page has no such state, because every kind of account offers notifications.

**user-profile-legal** / **user-profile-self-legal** — `default` shows the privacy policy text (with
the statement that it was agreed at account creation), a link to the terms and conditions with the
date and time agreed, and links to the three programs' terms (R-4.33). `terms-updated` adds a
`warning` `InlineAlert` whose button is "Review and agree to the updated terms", and reports when
terms were last agreed (R-4.16). `accept-terms-confirm` is the agreement dialog.
`section-unavailable` is anyone but the vendor themselves, who is shown the profile section
instead.

**user-profile-self** — `default` (a vendor), `public-sector` (job title, the Profile and
Notifications sections, the permissions label), `administrator` (status badge, no Administrator
checkbox, no Deactivate, R-4.31), `loading`, `editing` (a vendor, so no job title), `invalid`,
`save-failed`, `deactivate-confirm`, and `sign-in-required` (a visitor who is not signed in is shown
sign-in with a note that they will be returned to their profile, R-4.26).

### Gaps

These are work for the spec. None of them was filled with invented behaviour.

1. **A user-list search that matches nobody.** R-4.14 says how the list narrows but not what is
   shown when nothing matches. No empty state is designed.
2. **What a refused user list looks like.** R-4.21 says the list is refused to anyone but an
   administrator, but not what the interface shows. The design reuses the missing page. That
   follows the superseded R-4.15 and the profile rule in R-4.25; it is not a statement R-4.21 makes.
3. **Failures of immediate-save controls.** No criterion states what a person sees when a
   capability, the notice checkbox, a terms agreement, a reactivation or a deactivation fails to
   save. Only the refusal to make a vendor an administrator (R-4.12) has wording, and it is the only
   refusal state designed. The success wording for an immediate save is not specified either.
4. **An already-inactive deactivation** (R-4.31) is refused with a message, but no control on any
   designed screen can make that request. So the message has no screen, and none was designed.
5. **"Before continuing" after the terms change** (R-4.16). The criterion says vendors are asked to
   agree before continuing, but the only users-domain page that carries this is the legal section.
   Whether some other screen blocks or prompts a vendor who has not yet agreed is not stated, and
   the surface lists no such page.
6. **A public sector employee on the profile-completion page** (R-4.23 open note). It is undecided
   whether they should be admitted. The design follows the accepted statement, so they are
   redirected and no public-sector state exists. `job_title_field` on that page can therefore only
   be observed absent.
7. **Content the spec does not carry.** The service's list of capabilities with their descriptions,
   the privacy policy text, and the addresses of the terms pages. The stories use placeholders
   marked as such.
8. **Profile picture rules.** Accepted types, size limits and the rejection message are the files
   domain's (`file-image-picker`). This domain only places the "Choose a profile picture" trigger.
9. **Signed-out success versus a sign-in link.** R-4.17 does not say what the signed-out page
   offers next. The design offers "Sign in again" as a plain link, with no test ID because the
   surface names no action for it.
10. **The design system itself was not checked.** The component props used (`Text` `size`/`color`,
    `InlineAlert` `buttons`/`role`, the `AlertDialog` variants, `Link` `isButton`) and the token
    names listed above could not be checked against the live design-system repository in this run.
    A build must confirm them against the installed package versions. If a token is missing, it
    must be raised here rather than replaced by a typed value.
