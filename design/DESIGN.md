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

---

## Domain: opportunities

These screens cover the home page, the staff dashboard, the public opportunity list, choosing a
program, and, for each of the three programs, the create form, the public view, the manage page
(`…/edit`, with its tabs) and the administrator's complete report. They also cover `/status`, the
address that closes opportunities past their deadline. Every state named in `design/screens.yaml`
has a story at `design/catalogue/<page>.<state>.stories.tsx`, and the story is what a build copies.

The three programs share one design. The Code With Us, Sprint With Us and Team With Us versions of
a page have the same layout, components and test IDs. They differ only in the sections their
criteria require: reward and skills (Code With Us), phases, team questions, four scoring weights
and a panel (Sprint With Us), and resources, resource questions, three weights and a panel (Team
With Us). A reader who knows one program's page therefore knows all three.

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1, unless the entry says otherwise. The props
used were checked against that version's type declarations, and the catalogue compiles against
them (see note 24).

| Component | Used for |
| --- | --- |
| `Heading` | One H1 per screen, then H2 per section and H3 inside a section. Levels follow the outline. |
| `Text` | Body copy. `size="small" color="secondary"` is used for the program line above an H1, the opportunity ID, captions and group ordering notes. `color="danger"` is used only for the group-level errors (phases, weights), which also appear in the error summary. |
| `Button` | Every command. `primary` is used once per view for the next step (Submit for review, Publish, Finalize consensus scores, Start team scenario, Save changes, Add addendum, Add note). `secondary` is used for Edit, Save draft and "Add a …" repeaters. `secondary` with `danger` is used for Delete and Cancel opportunity. `tertiary size="small"` is used to remove one repeated item. |
| `ButtonGroup` | The manage page's action bar (`ariaLabel="Opportunity actions"`), and each form's submit row. |
| `Link` | Navigation: opportunity titles, manage-page tabs, and the dashboard's rows. `isButton` is used where navigation should look like a command (Browse opportunities, Sign in, Create an opportunity, the program choices, Start a proposal, Manage this opportunity). |
| `TextField` | Title, location, and the list's `type="search"` box. |
| `TextArea` | Teaser, remote-work description, description, question and guideline, the addendum, the private note, and the cancellation note. `maxLength` is always the limit the criterion states. |
| `NumberField` | Reward and budgets (`formatOptions` currency CAD, narrow symbol, no decimals), scores, word limits, weights and allocations. **No `minValue`/`maxValue`.** The limits are stated in the description and checked on submit, so a field never silently changes what somebody typed, and the rejection the criteria describe can be shown. |
| `DatePicker` | The proposal deadline, assignment, start and completion dates, and each phase's dates. |
| `Select` | Program and status filters. Skills use `selectionMode="multiple"`. Also the service area and each panel member. |
| `RadioGroup` + `Radio` | "Is remote work acceptable?" (Yes / No), which R-1.11 requires an answer to. |
| `Checkbox` | Watch, the remote-only filter, and a panel member's Evaluator and Chair marks. |
| `Form` | Always `validationBehavior="aria"`, as in the users domain. |
| `InlineAlert` | The error summary (`danger`), "This opportunity is incomplete" (R-1.21), and refused stage changes (R-1.41, R-1.42). Each is wrapped in a `div` that carries the test ID, because `InlineAlert` does not pass `data-*` through. |
| `Modal` + `AlertDialog` | Publish (`confirmation`), and Cancel opportunity and Delete (`destructive`). |
| `ProgressCircle` | Indeterminate loading, inside `role="status"` next to visible text, as in the users domain. |
| `FileTrigger` (from `react-aria-components`) | Opens the file chooser behind the "Add attachment" `Button`. The file rules and the attachment list belong to the files domain (`file-attachment-control`). |

**Watch is a `Checkbox`, not a `ToggleButton`.** The design system has a `ToggleButton`, but its
selected state is conveyed by styling. A checkbox shows its state with a tick as well as colour
(P1), and it matches the users domain's other immediate-save controls. On the list, each checkbox
has a visible label of "Watch" and `aria-label="Watch <title>"`, so the accessible name begins with
the visible text (WCAG 2.5.3). On the view page the label is "Watch this opportunity".

### This project's own components (not design-system components)

These are built from standard HTML and styled only with tokens. None of them is a design-system
component, and none may be presented as one.

- **Status badge.** It is the users domain's badge, reused unchanged: a `<span>` with a
  `--surface-color-border-medium` border and a `--layout-border-radius-circular` radius. It always
  carries the status in words (for example "Draft" or "Team questions: consensus") and sits after a
  visible "Status:" label or in a Status column. The design system's `Tag` is an interactive grid
  item inside `TagGroup`, which is the wrong role for a static status.
- **Key facts list.** A `<dl>` whose items are `div`s holding a `dt` (bold, via
  `--typography-font-weights-bold`) and a `dd`. The items flex-wrap with `--layout-margin-large`
  gaps, so they reflow at 320 pixels without a breakpoint. The design system has no
  description-list component.
- **Opportunity card.** An `<article>` in a `<li>`, labelled by its H3 title link, with a
  `--surface-color-border-default` border and a `--layout-border-radius-medium` radius. It is used on
  the opportunity list. The design system's `Callout` is an emphasis box with its own title
  markup, not a list item, so it does not fit.
- **Card section.** A `<section aria-labelledby>` with the same border and radius. It is used for
  the program cards and to group each part of a long form. This is the same treatment the users
  domain gives its sign-in cards.
- **Repeated-item group.** A `<fieldset>` and `<legend>` ("Question 1", "Resource 1", "Implementation
  phase", "Panel member 2"), with a token border and the legend set in `--typography-bold-body`. The
  design system has no fieldset component, and a legend is what names the group to assistive
  technology.
- **Data table.** It is the users domain's table, reused: a native `<table>` with a `<caption>`
  and `scope="col"` headers, inside a focusable `role="region"` that scrolls horizontally at narrow
  widths. It is used for the dashboard and the History tab.
- **Manage-page tabs.** It is the users domain's section navigation, reused: a `<nav
  aria-label="Opportunity sections">` of `Link`s, with `aria-current="page"` on the current tab.
  Each tab has its own address (`?tab=…`), as the surface requires, so these are links and not a
  tabs widget.

### How a screen is laid out

The layout is the users domain's: a single-column grid with `--layout-margin-large` between regions
and `--layout-padding-large` around the page. Action rows and filter rows flex-wrap. No value is
typed anywhere. The only tokens used are `--layout-margin-{none,xsmall,small,medium,large}`,
`--layout-padding-{none,small,large}`, `--layout-border-width-small`,
`--layout-border-radius-{medium,circular}`, `--surface-color-border-{default,medium}`,
`--typography-font-weights-bold`, `--typography-bold-body` and `--typography-regular-display`
(the home page's figures, which the token set describes as extra-large body text, not a heading).

The regions of each kind of page come in this order:

- **View** (`opportunity-*-view`). The program name as small text, then the H1 (the opportunity's
  own title), the teaser, the key facts, the opportunity ID, the actions (Watch, Start a proposal or
  Manage this opportunity), and then H2 sections: Successful proponent (when awarded), Description,
  the program's own section (Skills, Phases or Resources), Key dates and Addenda.
- **Manage** (`opportunity-*-edit`). "Manage a … opportunity" as small text, then the H1 (the
  opportunity's title), the status and ID row, the action bar, the tabs, any page alert, and the
  current tab's H2 section. The action bar and tabs are the same on every tab, including the tabs
  other domains design (the evaluation panel, instructions, evaluation and consensus).
- **Create** (`opportunity-*-create`). The H1, one sentence on what "required" means, the error
  summary when there is one, the form sections in card sections, and the submit row.
- **Document title.** It is always the surface title ("Code With Us opportunity", "Manage a Team
  With Us opportunity"). On client-side navigation, focus goes to the H1. On view, manage and report
  pages the H1 is the opportunity's title, because that is what a person is looking for. The
  surface title appears as the small line above it.

### Forms and validation

These rules apply to the three create forms and to the Opportunity tab in edit mode.

- **Drafts are never checked** (R-1.9). "Save draft" saves whatever is there. Blank dates become
  fourteen days from today, and that is done by the service, not the form. Every form says so in
  one sentence at the top: "Required fields are needed to submit for review or publish."
- **Required marking.** `isRequired` is set on each field that R-1.10 to R-1.18 require for
  submission or publication. Optional fields say "(optional)" in the label. The remote-work
  description becomes required, and says so in its description, when "Yes" is chosen.
- **The limits are stated before input.** Each field's description gives its rule in plain words
  ("Up to 200 characters.", "Between $1 and $70,000.", "Between 1 and 100.", "Lower than the
  maximum score."). Text limits are enforced as the person types, through `maxLength`. Number
  limits are checked only on submit.
- **When validation runs.** On Submit for review, Publish, or Save changes, and never on each
  keystroke.
- **An invalid field** gets `isInvalid` and an `errorMessage` directly under it, and keeps the value
  the person entered. The message says what to do ("Enter a reward between $1 and $70,000").
- **Group-level errors** belong to a group, not a field: "A prototype phase must follow an
  inception phase." (R-1.16) and "The scoring weights must total 100%." (R-1.15, `score-weight-error`).
  Each appears as a `Text color="danger"` paragraph with an `id`, placed directly after the group.
  The weight fields point at it with `aria-describedby`. The live total ("Total: 90%") sits in a
  `role="status"` region, so the sum is heard as it changes.
- **The error summary** follows the users domain's pattern. A `danger` `InlineAlert` titled "This
  opportunity has N problems" (or "Your changes have N problems" when editing) sits in a
  `tabIndex={-1}` wrapper that receives focus. It holds one `Link` per problem to the field or
  group `id`, and every list item carries `data-testid="field-error"`.
- **"Incomplete" is different from invalid** (R-1.21). Submitting an existing draft for review from
  the manage page checks completeness only, and the person is told the opportunity is incomplete,
  not which field is missing. It is a `danger` `InlineAlert` with `role="alert"`, titled "This
  opportunity is incomplete", with the text "It could not be submitted for review. Edit the
  opportunity, complete and save the form, and then submit it again."
- **Who is offered which submit.** A public sector employee is offered Save draft and Submit for
  review. An administrator is offered Save draft and Publish (R-1.22, R-1.48). Publish is never
  rendered for anyone else, so the refusal R-1.48 describes is the service's safeguard, not
  something the screen shows.
- **Repeating items** (phases, questions, resources, panel members) are fieldsets with a numbered
  legend. Each has its own tertiary "Remove …" button, and there is one secondary "Add a …" button
  after the last of them. A question's position is its order in the list (R-1.17). It is never
  typed.
- **The evaluation panel on create** is a container (`evaluation-panel-editor`) holding one fieldset
  per member: a `Select` of public sector employees, and Evaluator and Chair checkboxes. Its
  detailed rules and messages are the evaluation domain's (`evaluation-panel-swu` / `-twu`). Once
  the opportunity exists, the panel is changed on its Evaluation panel tab and is not part of the
  Opportunity tab's form.

### Confirmation dialogs

Publishing, cancelling and deleting change what everyone else sees and cannot be undone, so each
one asks first. The dialog is a `Modal` holding an `AlertDialog`. Its title is a question, its body
says who will be told, and its buttons name the action. Focus moves in, stays in, returns to the
opening button when the dialog closes, and Escape dismisses it.

| Action | Variant | Confirm button (test ID) | Other |
| --- | --- | --- | --- |
| Publish | `confirmation` | "Publish opportunity" (`opportunity-publish-confirm`) | Cancel (`opportunity-dialog-cancel`) |
| Cancel opportunity | `destructive` | "Cancel opportunity" (`opportunity-cancel-confirm`) | Keep opportunity (`opportunity-dialog-cancel`); optional "Note" `TextArea`, up to 1,000 characters (R-1.28) |
| Delete | `destructive` | "Delete opportunity" (`opportunity-delete-confirm`) | Cancel (`opportunity-dialog-cancel`) |

The addendum and the private note do not ask first. The screen states each one's consequence in a
sentence before its button: an addendum cannot be removed and notifies watchers, proponents and
the author (R-1.32, R-1.35), and a note is private (R-1.33). Submit for review does not ask
either. See gap 10 for what this means for the surface.

### Immediate saves: Watch

Watch saves as soon as it is ticked or cleared. A sentence before it says what watching does, and
the outcome is announced in a `role="status"` region after it. Watch is offered only to a
signed-in person who did not create the opportunity. It is not rendered on their own opportunity,
so the refusal in R-1.5's note ("You cannot subscribe to your own opportunity.") is never
triggered from the screen, and a checkbox cannot send a duplicate.

### Loading, empty, refused, not found

- **Loading.** This follows the users domain's pattern. The H1 renders at once, and below it a
  `role="status"` row holds a `ProgressCircle` and matching text. On the home page, only the
  figures wait.
- **Not found and refused.** All of these show the users domain's shared missing page (H1 "Page not
  found", `data-testid="not-found-page"`), which never says "not allowed": a draft or an
  opportunity under review opened by a vendor or a visitor (R-1.2, which says "not found"), a
  vendor or visitor on a create page (R-1.7), anyone but an administrator on a complete report
  (R-1.40), and anyone without access on a manage page. R-1.2 states the wording. The other three
  only say "refused" (gap 6).
- **Empty.** Only the dashboard has a designed empty state (`empty`), because the surface observes
  one. Its wording is the design's own (gap 3). A list group with nothing in it, and a search that
  matches nothing, are not designed (gap 4).
- **Reporting withheld** (R-1.30 note). On a draft or an opportunity under review, the Summary tab
  shows "Views, watchers and proposals are counted once the opportunity is published." in place of
  the three counts.

### Who is offered what on the manage page

The action bar shows only what the person may do in the opportunity's current state (R-1.20,
R-1.22, R-1.28, R-1.53, R-1.56, R-5.14):

| State | Author (not an administrator) | Administrator |
| --- | --- | --- |
| Draft | Edit, Submit for review, Delete | Edit, Publish, Delete |
| Under review | nothing (see gap 16) | Edit, Publish, Delete |
| Published, any evaluation stage, processing | nothing: editing after publication is administrator-only | Edit, Cancel opportunity |
| Team questions or resource questions consensus | Finalize consensus scores | Edit, Finalize consensus scores, Cancel opportunity |
| Code challenge (Sprint With Us) | Start team scenario | Edit, Start team scenario, Cancel opportunity |
| Awarded, cancelled | nothing | nothing |

The tabs follow the stage:

| Stage | Tabs |
| --- | --- |
| Draft | Summary, Opportunity, History, and for Sprint With Us and Team With Us, Evaluation panel |
| Under review, published | The same, plus Addenda (an addendum needs a non-draft, R-1.32) |
| From closing onward | All the tabs for the program: Proposals (R-1.31), and Team questions, Code challenge, Team scenario (Sprint With Us) or Resource questions, Challenge (Team With Us), and Consensus. The evaluation domain adds Instructions and Evaluation for evaluators (R-5.34). |

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). This domain adds the following to the users domain's list, which
applies here too.

- **Status is words.** The status badge always carries the state's name. The Watch state has a tick
  as well as colour. Group errors are text, and each one is also in the error summary.
- **Long forms are navigable.** Each form part is a labelled section with a heading, so it can be
  reached from a screen reader's heading list, and each repeated item is a fieldset with a legend.
- **Controls with the same visible text are told apart.** On the list, Watch has an `aria-label`
  naming the opportunity. Remove buttons name their item ("Remove question 1"). Panel members'
  `Select`s sit inside numbered legends.
- **Announcements.** Loading, the live weight total, and immediate saves use `role="status"`.
  Refusals and the error summary use `role="alert"`, and focus moves to the summary.
- **Tables and tabs.** Tables have a caption and column headers, and their scroll region is
  focusable. The current tab has `aria-current="page"`.
- **Checks still required.** Keyboard-only use of the long forms, of `Select` with multiple
  selection and of `DatePicker`, screen-reader checks of the dialogs and the error summary, and
  400% zoom have not been done. They are required before the build is accepted.

### Test IDs

The rules are the users domain's: one ID per kind of element; an action and an observation on the
same element share its ID; the same element keeps its ID on every page. The IDs shared across
this domain's pages are:

- `opportunity-status`, `opportunity-proposal-deadline`, `opportunity-watch-toggle`: on the
  dashboard, the list and the views.
- `opportunity-identifier`, `opportunity-created-by`, `opportunity-last-changed-by`: on the views and
  the manage pages.
- `opportunity-save-draft`, `opportunity-submit-for-review`, `opportunity-publish`, `field-error`:
  on the create pages and the manage pages. `field-error` is the users domain's ID, reused.
- `opportunity-tab-*`: on every manage page.
- `not-found-page`: the users domain's ID, reused.

The following bindings are not obvious from their names:

- `own_opportunities_only` and `all_opportunities_for_administrator` are both bound to
  `dashboard-opportunity-row`. A test tells them apart by which rows it finds, in the `default`
  and `administrator` stories.
- `set_evaluation_panel` is bound to `evaluation-panel-editor`, the container for the panel
  controls. The controls inside it are the evaluation domain's to name.
- `edit_evaluation_panel` is bound to the Evaluation panel tab link
  (`opportunity-tab-evaluation-panel`), the same element as `evaluation_panel_tab`. Following it
  opens the panel editor, which the evaluation domain designs.
- `run_pending_transitions` is bound to `service-status-page`, the wrapper of the page `/status`
  returns. Requesting the address is the action, and the wrapper shows the request landed.
- `add_attachment` is `attachment-add-button`. It is used wherever this domain places the
  attachment trigger (the create forms, the Opportunity tab and the history note).

**Other domains should reuse these IDs for the same controls:**
`finalize-consensus-button` for the evaluation domain's `finalize_consensus_scores` (it is one
control, in the shared action bar, gap 13); `attachment-add-button` for the files domain's
`add_attachment` on `file-attachment-control`; and `opportunity-status` wherever an opportunity's
status is shown.

**Extra IDs, not named in the surface, that the stories carry for the adapter:** the dialog
buttons (`opportunity-publish-confirm`, `opportunity-cancel-confirm`, `opportunity-delete-confirm`,
`opportunity-dialog-cancel`), the dialogs themselves (`opportunity-*-dialog`), form fields
(`opportunity-title-field` and the like), `opportunity-save-changes`, `opportunity-cancel-edit`,
`addendum-text-field`, `note-text-field`, `opportunity-cancel-note-field`,
`opportunity-incomplete-message` and `advance-refused-message`.

### Per-screen notes

**home** — `default`, `loading`. The page has the H1, a sentence on what the service is, Browse
opportunities, Sign in and Sign up, the two awarded figures in a key-facts list, and links to the
three programs' learn-more pages. `home-page` wraps the whole page, so a test can confirm it
renders for a visitor who has not signed in. `loading` exists because the figures come from the
service while everything else is static. The figures are illustrative (gap 1).

**opportunity-dashboard** — `default` (a public sector employee's own opportunities),
`administrator` (every opportunity, with a Created by column, R-1.3), `empty`, `loading`. Each row's
title is `open_opportunity` and leads to the manage page. The evaluation domain's "Evaluations"
navigation for panel members (R-5.19, `evaluation-panel-dashboard`) sits between the H1 and the
table, and that domain designs it.

**opportunity-list** — `default` (a signed-in vendor: Open and Closed, with Watch), `staff`
(adds the Unpublished group of the person's own drafts and opportunities under review, and no
Watch on their own), `signed-out` (no Watch), `loading`. Groups and their order follow R-1.38 and
its note, and each group states its order under its heading. The filters apply as they change and
announce the count through `role="status"` (R-1.39). The notifications domain's new-opportunity
control (`notification-optin-opportunity-list`) belongs at the end of the filter row, and that
domain designs it.

**opportunity-program-select** — `default`, `not-found`. There are three card sections, each with
the program's maximum budget (`program-max-budget`: up to $70,000, R-1.12; up to $5,000,000, R-1.13;
no upper limit, R-1.13) and a Create link. A sentence above the cards says the program cannot be
changed later (R-1.8).

**opportunity-cwu-create / -swu-create / -twu-create** — `default` (public sector employee),
`administrator` (Publish in place of Submit for review), `invalid`, `publish-confirm`, `not-found`.
The invalid stories show each program's own rules. Code With Us shows missing fields, the remote
description, a reward over the limit and no skills. Sprint With Us shows a budget over the limit,
an inception phase without a prototype phase, a minimum score that is not below the maximum, and
weights totalling 90%. Team With Us shows a missing title, an allocation of 120% and weights
totalling 90%.

**opportunity-cwu-view / -swu-view / -twu-view** — `default` (signed-in vendor, open: Watch and
Start a proposal), `signed-out` (nothing to act on), `author` (Created by and Last changed by
shown, R-1.29; no Watch; a link to manage), `awarded` (the successful proponent's name only,
R-1.27), `not-found` (R-1.2), `loading`. Start a proposal is offered only to a vendor while the
opportunity is open (R-2.1, R-2.15). The published date is the first publication (R-1.23). Opening
the page counts as a view (R-1.6), which has no visible effect. The files domain places the
attachment list in the Description section.

**opportunity-cwu-edit / -swu-edit / -twu-edit** — `default` (an administrator after closing:
Summary with reporting counts), `draft` (the author: Submit for review, Delete, no counts),
`under-review` (an administrator: Publish, Delete), `editing` (the Opportunity tab as a form, with
a sentence that saving notifies watchers, proponents and the author, R-1.4, R-1.35), `incomplete`
(R-1.21), `addenda-tab`, `history-tab` (the history, newest first; Code With Us and Sprint With Us
add the private note form, R-1.33, and Team With Us has none), `publish-confirm`, `cancel-confirm`,
`delete-confirm`, `not-found`, `loading`.

Sprint With Us and Team With Us also have `consensus` (Finalize consensus scores offered, R-1.50,
R-5.14) and `consensus-refused`. The Sprint With Us refusal is "Not all consensuses have been
submitted." The Team With Us refusal is "You must have at least one proponent that can be screened
into the Challenge.", naming the stage that follows, as R-5.10 requires. Sprint With Us also has
`code-challenge` (Start team scenario) and `team-scenario-refused` (R-1.42). An invalid edit is
presented exactly as in the create page's `invalid` story, so it has no story of its own.

**opportunity-cwu-complete / -swu-complete / -twu-complete** — `default`, `not-found`, `loading`.
The report is one `<article>` (`opportunity-full-report`) with the opportunity, its addenda, its
history and every proposal in order. There are no tabs and nothing to expand, so it reads, and
prints, as one continuous document (R-1.40).

**scheduled-transition-trigger** — `default`. The page has an H1 "Service status" and one sentence
saying the service is up. A request to it also runs the closing hook (R-1.1). The page shows
nothing about what closed, because the criterion does not say it should.

### Gaps

These are work for the spec. None of them was filled with invented behaviour. Where the design
had to show something, the story marks it as illustrative or placeholder.

1. **The home page's figures.** No criterion defines "total awarded opportunity count" or "value":
   which programs count, whether the value is the reward, the budget or the winning price, and how
   it is rounded. The surface names them, so they are placed, with illustrative numbers.
2. **The home page when signed in.** No criterion says whether Sign in and Sign up are still
   offered to a signed-in person.
3. **The dashboard.** Its row order, its columns, and the wording of its empty message are not
   stated. That an administrator's dashboard lists every opportunity comes from the surface's
   `all_opportunities_for_administrator` and R-1.3, which is about listing, not the dashboard.
4. **Empty list groups and searches that match nothing** (R-1.38, R-1.39). Neither criterion says
   what these show. Also, R-1.39's note records a status filter with no Processing or Cancelled
   option. The design carries that set as recorded, but whether the rebuild should keep the
   omission, and whether vendors should be offered Draft and Under review at all, needs a ruling.
5. **The program cards.** The descriptions are placeholder copy. The Team With Us "no upper limit"
   repeats R-1.13, whose note asks for a human ruling.
6. **What a refusal looks like.** R-1.7 (create), R-1.40 (report) and R-1.22 say "refused" without
   saying what is shown. The design reuses the missing page, following R-1.2 and the users domain.
   Whether a visitor who has not signed in should be sent to sign in instead is not stated.
7. **An administrator's submit choices on create.** R-1.48 says who may create as published. It does
   not say whether an administrator should also be offered Submit for review. The design offers
   Publish in its place.
8. **Completion date.** Whether it is required outside a draft is not stated (R-1.9, R-1.14). It is
   marked "(optional)". The Sprint With Us phase dates' ordering rules are not stated either.
9. **Dates for a closed opportunity.** R-1.14's note says an edit after the deadline is measured
   against the past deadline. The deadline description "It cannot be before today" is wrong in
   that case, and the right wording is not stated.
10. **A confirmation is two steps; the surface names one.** `publish`, `cancel_opportunity` and
    `delete_opportunity` each open a confirmation. The adapter binding the action has to press the
    documented `*-confirm` button as well. Either the surface gains `confirm_*` entries (as the
    evaluation surface has for its dialogs), or the contract accepts the two-step binding.
11. **Watch failures.** No criterion states what a person sees when watching or unwatching fails.
12. **What a signed-out visitor is offered on a view.** Nothing is designed. Whether to offer "Sign
    in to propose" is not stated (R-2.1).
13. **One finalize control, two names.** `opportunity-*-edit.finalize_question_consensuses` and
    `evaluation-consensus-list-*.finalize_consensus_scores` are the same action on the same page.
    This design puts it in the shared action bar as `finalize-consensus-button`. The evaluation
    domain should bind to it rather than add a second control. R-1.41 says the refusal "reason is
    named", but only R-5.4 and R-5.10 give wording, and the design uses theirs.
14. **Tab contents with no owner.** The surface names the Proposals, Team questions, Code
    challenge, Team scenario, Resource questions and Challenge tabs as observations, but gives no
    page for what is on them. They are not designed here. The proposals domain's scoring criteria
    (R-2.26 to R-2.33) probably belong on them. When each stage tab appears is also inferred: the
    Proposals tab only from R-1.31, and the others by extension.
15. **R-1.42 and R-1.21 wording.** Only a paraphrase is given ("a message saying all proponents
    must be scored first"; "saying the opportunity is incomplete and asking the author to complete
    and save the form"). The stories' sentences follow those paraphrases.
16. **Deletion under review** (R-1.53's open question). The design offers Delete to the author only
    on a draft, and to an administrator on a draft or an opportunity under review, as the accepted
    statement says. If the ruling lets authors delete under review, the Under review row of the
    table above changes. Whether an author may still edit an opportunity under review is not
    stated either (R-1.56 covers only published ones), so the design offers the author nothing
    there.
17. **Private notes on Team With Us** (R-1.33's note). The design follows the criterion, so there
    is no note on Team With Us. If that is ruled a gap to close, the Team With Us History tab takes
    the same note form as the other two programs.
18. **A proponent's contact details and score on an awarded opportunity** (R-1.27). They are shown
    to those permitted, but the surface has no observation for them and no criterion says where
    they go. The design puts them under "Successful proponent" for permitted viewers. There is no
    story, because no state of the surface separates them.
19. **Cancelled opportunities.** No criterion says what a cancelled opportunity's page shows beyond
    its status, so there is no `cancelled` state. Historical "suspended" records (R-1.51) are mapped
    before the rebuild reads them, so nothing displays that state.
20. **Content the spec does not carry.** The skills list, the five Team With Us service areas'
    names, the program descriptions and all record text in the stories are placeholders, marked as
    such.
21. **Formatted text.** The description is "formatted text" in the old service, and the files
    domain's `file-embedded-image` inserts images into it. The design system has no rich-text
    editor. The stories use a `TextArea`. The editor, and whether it is this project's own
    component, is a decision for the content and files domains, and when made it belongs in the
    own-components list above.
22. **The service level agreement link** (R-7.18) appears on the program cards and the three forms,
    but its address is the content domain's to settle. It is not placed in these stories.
23. **Whether `/status` returns a page.** The surface treats it as a page, and this design gives it a
    minimal one. If the build returns plain text, the adapter reads the response body instead and
    the two IDs have nothing to bind to.
24. **The catalogue is compiled and scanned.** The pipeline typechecks and builds the catalogue
    and runs axe over every story, and writes the result to `design/report.json`. The component
    names and props follow the type declarations of `@bcgov/design-system-react-components`
    0.8.1, and the token names follow `@bcgov/design-tokens` 5.0.0's `variables.css`. The home
    page's stories are titled `opportunities/home-page/default` and
    `opportunities/home-page/loading`. This is not a gap in the criteria; it is kept here so the
    numbering of the gaps below does not change.
25. **Dates in the stories are empty.** A `DatePicker` value needs `@internationalized/date`, which
    the catalogue's `package.json` does not declare, and this stage does not own that file. So the
    date pickers render empty, even in the `editing` stories. A build sets them from the record.

---

## Domain: organizations

These screens cover the public organization list, registering an organization, the organization's
management page (`/organizations/:orgId/edit`, with five tabs), the two program-terms pages, and a
vendor's own organizations, which is a section of their profile reached two ways: by account
identifier (`organization-user-memberships`) and as the signed-in person
(`organization-user-memberships-self`). The two memberships pages render the same design and differ
only in their addresses. Every state named in `design/screens.yaml` has a story at
`design/catalogue/<page>.<state>.stories.tsx`, and the story is what a build copies.

One decision shapes most of the domain: **a control is offered only to the people the service
lets use it.** The criteria say, again and again, who may do what (R-3.3, R-3.9, R-3.12, R-3.13,
R-3.18, R-3.27, R-3.28), and R-3.18 exists because the old service showed controls to people it then
refused. So the screens decide what to render from the viewer's role, and the service's refusals
remain as safeguards that the screen does not trigger. The tables under "Who is offered what" below
are the rule a build follows.

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1, unless the entry says otherwise. Only
components and props that the users and opportunities catalogues already compile with are used.

| Component | Used for |
| --- | --- |
| `Heading` | One H1 per screen. On the management page the H1 is the organization's legal name, with the surface title ("Edit Organization") as small text above it, as the opportunities domain does for its manage pages. On the terms pages the H1 is the surface title and the organization's name is the small line. H2 per tab or section, H3 inside. |
| `Text` | Body copy. `size="small" color="secondary"` for the organization ID, table captions, the reason a submit is unavailable, and the line above an H1. |
| `Button` | Every command. `primary` once per view for the main action (Edit organization, Save changes, Add team members, Accept terms and conditions, the dialog confirmations). `secondary` for Cancel, Change owner, Edit service areas. `secondary` with `danger` for Archive organization. `tertiary size="small"` for the per-row commands in tables (Accept, Decline, Leave, Approve, Remove, Give or Remove administrator rights), with `danger` on the ones that end something. |
| `ButtonGroup` | Form submit rows, the team toolbar, dialog button rows, and the terms page's Accept and Cancel. |
| `Link` | Navigation: organization names, the management tabs, the profile section links, and the links to the terms pages. `isButton` for "Create organization" and "My organizations", which navigate but read as commands. |
| `TextField` | Every organization profile field. Read-only details are `TextField` with `isReadOnly`, as in the users domain, so the label and value are exposed the same way in view and edit. `type="url"`, `type="email"` and `type="tel"` where they apply. |
| `Checkbox`, `CheckboxGroup` | The service-area editor, and the statement that must be confirmed before administrator rights are given. |
| `Select` | The new owner in the Change owner dialog. |
| `Form` | Always `validationBehavior="aria"`. |
| `InlineAlert` | The not-qualified notices (`info`), the unregistered-invitee warning (`warning`), invitation refusals and the list refusal (`danger`, `role="alert"`), and the list of problems before an unavailable submit button (`danger`). Each carrying a test ID is wrapped in a `div` that holds it. |
| `Modal` + `AlertDialog` | Yes/no decisions: archive (`destructive`), give administrator rights (`confirmation`), remove a member (`destructive`), join an organization (`confirmation`), decline an invitation and leave an organization (`destructive`). |
| `Modal` + `Dialog` | The two small forms: Add team members and Change owner. |
| `ProgressCircle` | Indeterminate loading, inside `role="status"` next to visible text. |
| `FileTrigger` (from `react-aria-components`) | Opens the logo chooser behind a `Button`, as the users domain does for the profile picture. The file rules are the files domain's. |

**Row commands are buttons, not switches.** The design system's `Switch` and `ToggleButton` save a
state as soon as they change. Giving administrator rights must first ask for a statement to be
confirmed (R-3.12's note), so it is a `Button` that opens a dialog, and its text names the change
("Give administrator rights", "Remove administrator rights"). That also makes the state readable in
words in the Membership column rather than from a control's appearance.

### This project's own components (not design-system components)

These are built from standard HTML and styled only with tokens. None of them is a design-system
component, and none may be presented as one. The first four are the users and opportunities
domains' own components, reused unchanged.

- **Status badge.** A `<span>` with a `--surface-color-border-medium` border and a
  `--layout-border-radius-circular` radius, always carrying its meaning in words. Here it shows
  Owner, Administrator, Member and Pending in team and membership tables, the "Sprint With Us
  qualified" and "Team With Us qualified" badges beside the organization's name, and Met or Not
  met on each qualification requirement.
- **Data table.** A native `<table>` with a `<caption>` and `scope="col"` headers, inside a
  focusable `role="region"` that scrolls horizontally at narrow widths. Used for the organization
  list, the team, the changelog, and the owned and affiliated organizations.
- **Section navigation.** A `<nav>` of `Link`s with `aria-current="page"` on the current one. The
  management page's tabs are `<nav aria-label="Organization sections">`, one address per tab
  (`?tab=organization`, `team`, `swu-qualification`, `twu-qualification`, `changelog`). The memberships
  pages carry the users domain's `<nav aria-label="Profile sections">` with Organizations current.
- **Card section.** A `<section aria-labelledby>` with a `--surface-color-border-default` border and
  a `--layout-border-radius-medium` radius. Used to group the create form's three parts and to set
  off the terms text.
- **Pagination.** New in this domain. A `<nav aria-label="Pages of organizations">` holding a list:
  "Page N of M" as text, a `Link` per page number (`aria-label="Page N"`, `aria-current="page"` on
  the current one), and "Previous page" / "Next page" `Link`s where there is such a page. Links,
  not buttons, because each page has its own address (`/organizations?page=N`). No component in
  the design system as this catalogue uses it paginates a list; if the installed version has one,
  it replaces this.
- **Requirement list.** New in this domain. A `<ul>` with an `aria-label` naming the program, one
  `<li>` per qualification requirement, each beginning with a Met / Not met status badge and then
  the requirement in words. The design system has no checklist component, and a list is what a
  screen reader announces as "list, three items".

The tokens used are the ones the two earlier domains list, and no others:
`--layout-margin-{none,small,medium,large}`, `--layout-padding-{none,small,large}`,
`--layout-border-width-small`, `--layout-border-radius-{medium,circular}` and
`--surface-color-border-{default,medium}`. No colour, size or radius value is written anywhere.

### How a screen is laid out

The users domain's layout: a single-column grid with `--layout-margin-large` between regions and
`--layout-padding-large` around the page. Action rows flex-wrap. The regions come in this order:

- **Organization list.** The H1; the vendor's "Create organization" and "My organizations"; the
  table; the pagination.
- **Management page.** "Edit Organization" as small text; the H1 (the legal name); a row with the
  qualified badges and the organization ID; the tabs; any page alert; the current tab's H2 section.
  The Organization tab ends with a separate "Archive this organization" section where Archive is
  offered.
- **Create.** The H1, one sentence saying the registrant becomes the owner and how optional fields
  are marked, the three card sections (Organization details, Address, Contact), the reason or list
  of problems, and the submit row.
- **Memberships.** The H1 ("My Organizations"), the profile section navigation, then "Organizations
  you own" (Create organization, then its table or its empty message) and "Organizations you belong
  to" (its table or its empty message).
- **Terms.** The organization's name as small text, the H1, the accepted date when there is one, the
  terms text in a card section, then what accepting means and the buttons.
- **Document title and focus.** The document title is the surface title. On client-side navigation,
  focus goes to the H1.

### Forms and validation

These rules apply to the registration form (`organization-create`) and the Organization tab in
edit mode (`organization-edit`, `editing` and `invalid`). They are the same form.

- **Fields** (R-3.22). Required, each 1–100 characters: legal name, street address, city,
  province or state, postal or ZIP code, country, contact name. Required, in a valid email format
  and of any length: contact email address. Optional: website, address line 2 (up to 100), contact
  title (up to 100), contact phone number, and the logo. An optional field left empty is never an
  error; one that is filled in must be in a valid format.
- **Required marking.** `isRequired` on the component; optional fields say "(optional)" in the
  label; one sentence above the form says so. Text limits are enforced as the person types through
  `maxLength`, and the limit is stated in the legal name's description.
- **Submit is unavailable until the form is valid.** The surface observes
  `submit_disabled_until_valid`, so "Create organization" and, for the same form, "Save changes" are
  `isDisabled` until every required field is filled and every filled field is valid. A disabled
  React Aria button cannot take focus, so the reason is **visible text placed before the button**
  and also referenced by `aria-describedby`: "Fill in every required field to create the
  organization" while nothing is wrong yet, and, once something is, a `danger` `InlineAlert` titled
  "Fix N fields to create the organization" (or "…to save your changes") listing one `Link` per
  problem to the field's `id`. Each item carries `data-testid="field-error"`. This list does not
  take `role="alert"` or move focus, because it updates as the person works.
- **When a field is checked.** When the person leaves it, and never on each keystroke. An invalid
  field gets `isInvalid` and an `errorMessage` directly under it that says what to do ("Enter the
  organization's legal name"; "Enter an email address in a valid format, like name@example.com";
  "Enter the full website address, like https://example.com, or leave it blank"). The value typed
  is kept.
- **The contact phone number** (R-3.19) is saved with every other field. On the edit form its
  description says "Clear this field to remove the number", because clearing it removes the stored
  number.
- **Creating** makes the vendor the owner and opens the new organization's management page
  (R-3.23), whose `organization-identifier` the test reads.
- **Cancel** on create returns to the organization list; on edit it returns to the read-only
  Organization tab with nothing saved.

### Confirmation dialogs and immediate changes

| Action | Where | Kind | Confirm (test ID) | Other |
| --- | --- | --- | --- | --- |
| Archive organization | Organization tab | `AlertDialog` `destructive` | "Archive organization" (`organization-archive-confirm`) | Cancel (`organization-dialog-cancel`). The body says what archiving does (R-3.6); when a service administrator archives an organization they do not own, it adds that the owner will be emailed (R-3.24). |
| Add team members | Team tab | `Dialog` | "Send invitations" (`organization-invite-submit`) | One `TextField` per address (`organization-invite-email-field`), "Add another email address" (`organization-invite-add-email`), Cancel. |
| Give administrator rights | Team tab row | `AlertDialog` `confirmation` | "Give administrator rights" (`organization-admin-rights-confirm`), disabled until the statement checkbox (`organization-admin-terms-checkbox`) is ticked, with the reason in visible text | Cancel. |
| Remove a member | Team tab row | `AlertDialog` `destructive` | "Remove from team" (`organization-member-remove-confirm`) | Cancel. On a pending row the same dialog is worded as withdrawing the invitation. |
| Change owner | Team tab | `Dialog` | "Change owner" (`organization-change-owner-confirm`) | `Select` "New owner" (`organization-new-owner-field`) listing active members only; Cancel. |
| Accept an invitation | Memberships | `AlertDialog` `confirmation` (`membership-accept-dialog`) | "Join organization" (`membership-confirm-button`) | Cancel (`membership-dialog-cancel`). |
| Decline an invitation | Memberships | `AlertDialog` `destructive` (`membership-decline-dialog`) | "Decline invitation" (`membership-confirm-button`) | Cancel. |
| Leave an organization | Memberships | `AlertDialog` `destructive` (`membership-leave-dialog`) | "Leave organization" (`membership-confirm-button`) | Cancel. |

Every dialog's title is a question naming the organization or person, its body says what will
happen and who will be emailed, focus moves in and stays in, Escape dismisses it, and focus returns
to the control that opened it. Nothing changes until the confirm button is pressed.

**R-3.35.** The accept and decline choices in an invitation email both open the person's own
organizations page with the matching dialog already open, exactly as in the `accept-confirm` and
`decline-confirm` stories. Arriving by the email and pressing Accept or Decline on the page give the
same dialog.

**Three changes act at once, without a dialog:** withdrawing administrator rights, a service
administrator approving a pending invitation on the invitee's behalf, and saving service areas. Each
is reversible, and none has a criterion asking for confirmation. The outcome is announced in a
`role="status"` region after the table or form.

### Loading, empty, refused, not found

- **Loading.** The users domain's pattern. The H1 renders at once (on the management page, the
  surface title stands in until the name arrives), and a `role="status"` row holds a
  `ProgressCircle` and matching text. Stories: `organization-list.loading`,
  `organization-edit.loading`, and both memberships pages' `loading`.
- **Not found.** The shared missing page (H1 "Page not found", `data-testid="not-found-page"`),
  which never says "not allowed". It is shown on the management page to an ordinary member, public
  sector staff, and anyone else who neither owns nor administers the organization and is not a
  service administrator (R-3.3, whose note says "not found"), and for an archived or unknown
  organization. It is also shown on the create page to anyone but a signed-in vendor who has
  accepted the terms (R-3.2; see gap 3).
- **Refused list.** `organization-list.refused` shows a `danger` `InlineAlert` in place of the
  table, so a refusal can never be read as an empty list (see gap 1).
- **Empty.** The memberships pages have an `empty` state, because the surface observes both empty
  messages. Each section says so in a sentence instead of showing a table with no rows. The
  organization list has no empty state (gap 2).
- **Section not offered.** A memberships page asked for by anyone whose profile does not offer the
  Organizations section shows the profile section instead, as R-4.34 says: an administrator looking
  at somebody else's account, and a public sector employee looking at their own. These are the
  `section-unavailable` states, built exactly as the users domain's.

### Who is offered what

**Organization list** (R-3.1, R-3.2, R-3.3, R-3.21):

| Viewer | Columns | Name is a link | Create organization, My organizations |
| --- | --- | --- | --- |
| Visitor not signed in; public sector staff | Organization only | no | no |
| Vendor | Organization, Owner, Team size, Sprint With Us qualified, Team With Us qualified; the last four are filled only on rows the vendor owns or administers, and are empty cells elsewhere | only on rows they own or administer | yes |
| Service administrator | All five, filled on every row | every row | no |

The caption tells a vendor why some cells are empty. The list is ordered by legal name, holds
fifty organizations a page, and never lists an archived organization.

**Management page**:

| Control | Owner | Organization administrator | Service administrator |
| --- | --- | --- | --- |
| Edit organization, Archive organization (R-3.18) | yes | no: the profile is read-only, with a sentence saying only the owner can change it | yes |
| Add team members (R-3.7) | yes | yes | yes |
| Give / remove administrator rights (R-3.12) | on active members other than the owner and themselves | the same | the same |
| Remove (R-3.10, R-3.11) | on every row but the owner's | the same, and not their own row | on every row but the owner's |
| Approve a pending member (R-3.9) | no | no | yes |
| Change owner (R-3.13) | no | no | yes, when there is at least one member besides the owner |
| Edit service areas (R-3.28) | no: the approved areas are listed as text | no | yes |
| Links to the terms pages | "Read and accept …" | "Read and accept …" | "Read …" |

**Terms pages** (R-3.27): Accept is offered to the organization's owner and administrators while
the terms are unaccepted. A service administrator reads the terms with no Accept, and a sentence
says only the organization's own people can accept them. Once accepted, the page states when, and
Accept is not offered again.

**Memberships pages**: Accept and Decline on a pending invitation, Leave on an active membership
(not on an organization the person owns, whose last owner cannot leave, R-3.11). The organization
name is a link only where the person owns or administers it (R-3.3); an ordinary member sees it as
text.

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). The users domain's list applies here too; this domain adds:

- **Status is words.** Every badge (Owner, Pending, qualified, Met, Not met) and every qualification
  mark ("Yes" / "No") is text. No state is carried by colour or an icon alone.
- **Row commands name their row.** Visible text stays short ("Remove", "Accept", "Leave"); the
  `aria-label` begins with that visible text and names the person or organization ("Remove Test
  Vendor Four", "Accept the invitation from Tidewater Analytics Inc."), satisfying 2.5.3.
- **Disabled submit buttons explain themselves** in visible text before the button, referenced by
  `aria-describedby`, because a disabled button cannot be focused to discover why.
- **Tables** have a caption and column headers, and their scroll region can be reached by keyboard.
  An empty cell on the list (a column a vendor may not see for that row) is explained by the
  caption.
- **Pagination** marks the current page with `aria-current="page"`, and number-only links carry
  `aria-label="Page N"`.
- **Announcements.** Loading and immediate changes use `role="status"`. Refusals and the
  unregistered-invitee warning use `role="alert"`.
- **Checks still required.** Keyboard-only use of the team table's row commands and of the dialogs,
  screen-reader checks of the requirement lists and of the dialog opened on arrival from an email,
  and 400% zoom of the team table have not been done. They are required before the build is
  accepted.

### Test IDs

The users domain's rules apply: one ID per kind of element, an action and an observation on the
same element share its ID, and the same element keeps its ID on every page. In this domain:

- **Shared across pages.** `organization-create-link` (the list and both memberships pages);
  `organization-swu-qualified-mark` (the list and the memberships pages; `organization-twu-qualified-mark`
  is on the list only); `organization-pending-badge` (the team table and the memberships pages);
  `field-error` and `not-found-page` (the users domain's, reused); `profile-tab-*` (the users
  domain's, on the memberships pages).
- **The same element serves two names.** `organization-submit-button` is both `create_organization`
  and `submit_disabled_until_valid`.
- **Actions bound to the control that starts them.** `add_team_members`, `change_owner`,
  `archive_organization`, `remove_team_member`, `toggle_member_admin_status` (when giving rights),
  and `approve_invitation`, `reject_invitation`, `leave_organization` on the memberships pages each
  open a dialog. The action is bound to the opening control, as the opportunities domain binds
  `publish`. The adapter completes it with the extra IDs in the table above (gap 11).
- **`accept_org_admin_terms`** is the statement checkbox inside the administrator-rights dialog,
  `organization-admin-terms-checkbox`.
- **`accept_confirmation` and `decline_confirmation`** are the dialogs themselves,
  `membership-accept-dialog` and `membership-decline-dialog`.
- **`refused_when_not_permitted`** is the wrapper of the refusal alert, `organization-list-refused`.
- **`invalid_membership_type_error`** is the wrapper of that refusal's alert on the Team tab,
  `organization-invalid-membership-type-error`.
- **`team_capabilities`** is the Team capabilities section; each capability in it is
  `organization-team-capability`.

**Extra IDs, not named in the surface, that the stories carry for the adapter:** every profile
field (`organization-legal-name-field`, `organization-website-field`,
`organization-street-address-field`, `organization-address-line-2-field`, `organization-city-field`,
`organization-region-field`, `organization-mail-code-field`, `organization-country-field`,
`organization-contact-name-field`, `organization-contact-title-field`,
`organization-contact-email-field`, `organization-contact-phone-field`); `organization-list-row`,
`organization-list-team-size`; the dialogs (`organization-archive-dialog`,
`organization-invite-dialog`, `organization-admin-rights-dialog`, `organization-member-remove-dialog`,
`organization-change-owner-dialog`, `membership-leave-dialog`) and their buttons (listed above);
`organization-invite-refused`, `organization-invite-unregistered`; `organization-service-area` (an
approved area shown as text); `organization-cancel-service-areas-button`;
`organization-swu-terms-accepted-on` (the acceptance date on the qualification tab).

### Per-screen notes

**organization-list** — `default` (a vendor, owning one listed organization and administering
another), `administrator`, `signed-out` (which is also what public sector staff see, since R-3.21
gives them the same columns and they cannot create), `loading`, `refused`.

**organization-create** — `default` (blank, Create unavailable with the reason), `invalid` (the
legal name left blank and a contact email of "not-an-email", R-3.22's own example), `ready` (every
required field valid, every optional field empty, Create available), `not-found`.

**organization-edit** — the Organization tab: `default` (the owner, both qualified badges showing,
Edit and Archive offered), `org-admin` (read-only, no Edit, no Archive, R-3.18), `editing`,
`invalid`, `archive-confirm` (a service administrator, so the owner-email sentence shows). The Team
tab: `team` (the owner's view: a pending invitee who does not count, R-3.7, R-3.34),
`team-administrator` (Approve and Change owner), `invite-open`, `invite-refused` (R-3.8's two
refusals), `invite-invalid-type` (R-3.17), `invite-unregistered` (R-3.30), `admin-rights-confirm`,
`remove-member-confirm`, `change-owner` (the pending invitee is not a choice, R-3.13). The
qualification tabs: `swu-qualification` (R-3.25's example: two requirements met, terms unmet, not
qualified), `swu-qualified` (all met, the badge showing, the acceptance date, R-3.27),
`twu-qualification` (R-3.26's example, as the owner sees it, with no editing control, R-3.28),
`twu-administrator` (Edit service areas offered), `service-areas-editing` (R-3.28's example: one of
two kept, one cleared, a third ticked). And `changelog` (R-3.33's two entries, "Admin Rights Removed"
above "Admin Rights Given"), `not-found`, `loading`. A fully qualified Team With Us tab is the
`swu-qualified` story's pattern applied to the Team With Us requirements; it has no story of its own
because no criterion turns on it.

**organization-swu-terms / organization-twu-terms** — `default` (Accept offered), `accepted` (the
date, no Accept), `administrator` (no Accept).

**organization-user-memberships / organization-user-memberships-self** — `default`, `empty`,
`loading`, `accept-confirm`, `decline-confirm`, `leave-confirm`, `section-unavailable`. The owned
table shows each organization's team size (active members only) and its Sprint With Us
qualification. The affiliated table shows the membership (Member, Administrator, or the Pending
badge) and the row's commands. An archived organization is in neither table (R-3.6, R-3.15).

### Gaps

These are work for the spec. None was filled with invented behaviour; where the design had to show
something, the story says it is the design's own wording or a placeholder.

1. **Who is refused the organization list, and when.** R-3.1 says anyone may browse the list, and
   no criterion refuses it. The surface's `refused_when_not_permitted`, with its comment about
   telling a refusal from an empty list, reads like R-3.20 (the organizations one may act for are
   refused to non-vendors, where the old service returned an empty list), but that request has no
   screen of its own in the surface. The design shows a refusal distinctly (`refused`), with
   wording taken from R-3.20. Which request produces it on this page needs a ruling.
2. **An empty organization list.** R-3.1 does not say what an empty list shows, so no state is
   designed. R-3.1's note (a page past the last returns the first) is not reachable from the
   screen, because pagination offers only pages that exist.
3. **What a refused registration looks like.** R-3.2 says a request from anyone but a vendor who
   has accepted the terms is refused, not what is shown. The design reuses the missing page, as the
   opportunities domain does for its create pages. Whether a visitor who is not signed in should
   be sent to sign in, and what a vendor who has not accepted the terms is shown, are not stated.
4. **Submitting an invalid form versus a submit that is unavailable.** R-3.22's example submits an
   invalid form and has the field reported, while the surface observes the submit button disabled
   until the form is valid. The design reports each field when the person leaves it and lists the
   problems before the unavailable button, so the field is reported before any submission. A
   submission the service rejects anyway (for example, from outside the screen) has no wording.
5. **Formats of the website and the phone number.** R-3.22 says each is "rejected if given in an
   invalid format", and does not say what a valid one is. The website's description asks for a
   full address; the phone number has no description, because there is nothing true to say yet.
6. **Wording of messages the surface observes but no criterion words:** the two empty messages on
   the memberships pages, the not-qualified notices, the refusal on the list, the invitation
   refusals (R-3.8 and R-3.17 are paraphrased), the unregistered-invitee warning (R-3.30 is
   paraphrased), and the dialog texts. All are the design's own.
7. **Several invitations at once.** R-3.7 invites two addresses at once but does not say what
   happens when some are refused and others are not. The design reports each refused address by
   name and leaves the others sent.
8. **The administrator-rights statement.** R-3.12's note says a statement about what the rights
   allow must be confirmed first; its text is not in the spec, so the story shows a placeholder. The
   criteria do not say whether withdrawing rights asks first; the design withdraws at once.
9. **The changelog's wording for a transfer of ownership.** R-3.33 gives "Admin Rights Given" and
   "Admin Rights Removed" only. "Ownership Transferred" in the story is a placeholder.
10. **Refusals the screen never triggers.** Because controls are offered only to those allowed to
    use them, these criteria's messages have no screen: removing the sole owner (R-3.11, "sole
    owner"), changing one's own or the owner's rights (R-3.12), accepting on another's behalf
    (R-3.9), accepting terms twice (R-3.27, "already accepted"), and a profile change or archive by
    an organization administrator (R-3.18). If a test must see them on a screen, the surface needs
    observations for them and the spec needs their wording.
11. **Actions completed in a dialog.** As in the opportunities domain's gap 10, the surface names
    one action where the screen needs two steps (open, then confirm). Either the surface gains
    `confirm_*` entries, or the contract accepts the extra IDs listed above.
12. **Who may accept program terms, and who may open the terms pages.** R-3.27's note says a
    service administrator is not offered Accept and that acceptance is "in practice an act of the
    organization's own people". Whether an organization administrator (not only the owner) may
    accept is not stated; the design offers it to both. Who is refused the terms pages, and what
    they see, is not stated, so no refused state is designed.
13. **The list's other fields.** R-3.21 says every viewer sees an organization's logo, active state
    and service areas. The list shows only non-archived organizations, so the active state adds
    nothing, and no criterion says the list shows service areas, so it does not. The logo is not in
    the stories: an image beside the name needs a size, and the token set used here has no size
    token for an image. That is a finding for the tokens, not a value to type.
14. **Content the spec does not carry:** the service's list of capabilities (which "every
    capability" in R-3.25 depends on), the Team With Us service-area names, and the program terms
    text. The stories use placeholders and say so.
15. **The address an invitation email opens** (R-3.35). The surface says both choices land on the
    memberships page with the decision prepared; how the address names the invitation and the
    choice is not specified, and is the build's to decide within the existing route.
16. **Failures of immediate changes.** No criterion says what a person sees when withdrawing
    rights, approving an invitation or saving service areas fails, or when a create or save fails
    for a reason other than validation.

---

## Domain: notifications

Most of this domain has no screen. Turning notifications off for an environment (R-6.1), failed
delivery (R-6.2), the test marker (R-6.3), the single sender (R-6.4), the plain-text form (R-6.5),
batching and hidden recipients (R-6.8, R-6.15), silence for deactivated accounts (R-6.17), new
accounts starting with notices off (R-6.20) and skipping recipients with no address (R-6.28) all
happen in the sending machinery, and nothing here designs them. What this domain puts on a screen is
small. It covers four places, and three of them are parts of pages other domains own:

- **notification-unsubscribe-landing.** This is the users domain's own notification settings
  (`user-profile-self-notifications`), reached from an email's Unsubscribe offer, and it arrives with
  the question already asked.
- **notification-optin-opportunity-list.** This is one control on the opportunities domain's list
  of opportunities.
- **notification-terms-broadcast.** This is one section on the content domain's management page for
  the terms and conditions page.
- **notification-email-reference.** This is the one page the domain owns outright: the
  administrator's preview of every email.

Every state named in `design/screens.yaml` has a story at
`design/catalogue/<page>.<state>.stories.tsx`, and the story is what a build copies. Where a story
shows another domain's part of the page, that part is trimmed or shown as a placeholder frame, and
the other domain's own design governs it.

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1, unless the entry says otherwise. Only
components and props that the earlier domains' catalogues already compile with are used. No new
design-system component is introduced.

| Component | Used for |
| --- | --- |
| `Heading` | One H1 per screen. H2 for the opt-in section, the terms broadcast section, and each event group on the reference page. H3 for each message within a group. |
| `Text` | Body copy. It also carries the control's current state on the list, the scope sentence on the settings page, the placeholder frame, and `size="small" color="secondary"` for the line above an H1 and each email's footer link. |
| `Button` | "Email me about new opportunities" and "Stop emailing me about new opportunities" (`secondary`). "Notify vendors of updated terms" (`secondary`, because the page's primary action is the content domain's). The dialog confirmations are `primary` and Cancel is `secondary`. |
| `Checkbox` | The new-opportunities checkbox on the settings page. This is the users domain's control, reused unchanged. |
| `Link` | The profile section links, the reference page's contents, and the links inside each sample email. |
| `Modal` + `AlertDialog` | The unsubscribe question (`warning`, the users domain's dialog with the same test IDs) and the terms-broadcast question (`warning`). |
| `InlineAlert` | The terms broadcast's outcome: `success` with `role="status"`, or `danger` with `role="alert"`. It is also used for the sign-in prompt (`info`, the users domain's `sign-in-required`). Each alert that carries a test ID is wrapped in a `div` that holds the ID. |
| `ProgressCircle` | Indeterminate loading, inside a `role="status"` container, next to visible text. |
| `Select`, `TextField`, `Checkbox` | These appear only as the opportunities domain's filter row, reproduced around the opt-in control. |

**The opt-in is a `Button` whose text changes, not a checkbox or `ToggleButton`.** R-6.21 says
"the control changes to offer the opposite choice", so the control names the choice it offers
("Email me about new opportunities" or "Stop emailing me about new opportunities"). The current
state is a separate sentence in words before it ("You are not emailed when new opportunities are
posted."). `ToggleButton` was rejected because it shows its pressed state through styling, which
the opportunities domain already ruled out for Watch.

### This project's own components (not design-system components)

These are built from standard HTML and styled only with tokens. None is a design-system component.

- **Card section.** This is the earlier domains' `<section aria-labelledby>` with a
  `--surface-color-border-default` border and a `--layout-border-radius-medium` radius, reused. It
  holds the opt-in control on the list, and the placeholder frame for the content domain's part of
  the terms page.
- **Key facts list.** This is the opportunities domain's `<dl>`, reused. Each sample message's
  Subject and "Who receives it and why" is a `dt` in `--typography-font-weights-bold` followed by
  its `dd`.
- **Email preview frame.** This one is new in this domain. It is a `<div role="group"
  aria-label="Email body: <subject>">` with a `--surface-color-border-medium` border and a
  `--layout-border-radius-medium` radius, and it holds one sample message as its recipient would
  see it. The design system has nothing for showing a document inside a page. The message's own
  title is set in bold text, not as a heading, so the page's outline stays page → event → message.
  The emails' own formatting belongs to the sending machinery. A build renders the message's body
  markup into this frame. It does not use an `iframe`, because an unlabelled or untitled frame
  would break the outline and the scan.

No token beyond those the earlier domains list is used:
`--layout-margin-{none,small,medium,large}`, `--layout-padding-{none,small,large}`,
`--layout-border-width-small`, `--layout-border-radius-{medium,circular}`,
`--surface-color-border-{default,medium}`, and `--typography-font-weights-bold`.

### How each screen is laid out

- **Unsubscribe landing.** This is the users domain's notifications section, unchanged: the H1
  "Notifications", the profile section navigation, the sentence naming the address, the checkbox,
  and the `role="status"` region. It adds one sentence stating the choice's scope ("This setting
  covers only emails announcing newly published opportunities…"). R-6.16 means a reader who arrives
  from any other kind of email must not be led to think this choice stops it. On arrival, the
  unsubscribe `AlertDialog` is already open. It names the account that is signed in ("You are
  signed in as …"), and that account's address in a `span` of its own, because R-6.7 says it acts
  on whoever is signed in, not whoever the email was sent to. The document title is the surface
  title, "Unsubscribe", while the question is open. After that, it is the settings page's own
  title.
- **Opt-in on the list.** A card section follows the opportunities domain's filter form and comes
  before the first group of opportunities. It holds an H2 "New opportunity emails", the state
  sentence, the button, and a `role="status"` region. It sits outside the `role="search"` form,
  because it is not a filter. It appears once, before whichever group is first. That matches R-6.21's
  note, which says it sits where the reader looks first. **There is no breakpoint and no media query
  on it.** It flex-wraps and is present at every width, including 320 CSS pixels (R-6.27).
- **Terms broadcast.** The content domain's page comes first: the small line "Manage a page", the H1
  "Terms and conditions", and the page's own content and controls. Then comes a section with the H2
  "Notify vendors of updated terms". It holds two sentences on what the action does and whom it
  reaches, then the button. The outcome alert appears at the top of that section, directly under
  its H2. The section is rendered only on the page whose slug is `terms-and-conditions`, and only
  for an administrator (R-6.23). It is offered while the page is being viewed, not while its edit
  form is open (gap 11).
- **Email reference.** The H1 "Email Notification Reference", then one sentence saying that the
  samples are invented. A `<nav>` titled "Events that send email" lists in-page links to every
  event. Then there is one section per event, whose H2 is the event ("A Code With Us opportunity is
  submitted for review"). Inside it is one `<article>` per message, whose H3 names the recipient
  ("To the opportunity's author"). Each article holds the key facts (Subject, and "Who receives it
  and why" **only where a summary is written**; otherwise the row is left out rather than shown
  empty, R-6.13) and the email preview frame. Every message the service can send is listed
  (R-6.19). Nothing is collapsed behind a disclosure, so a find-in-page reaches every subject.

### Forms, decisions and immediate saves

This domain has no form with fields to validate. It has one immediate save and two confirmed
decisions.

- **The opt-in saves at once** (R-6.21, with no confirmation in either direction, as its note
  records). Focus stays on the button. Its text changes, and the `role="status"` region announces
  the outcome ("Saved. You will be emailed when the next opportunity is posted."), because a
  focused button's changed name is not reliably announced. The state sentence changes with it.
  While the request is in flight the button is not pressed again. A failure is not designed (gap
  7).
- **Unsubscribing asks first.** This is the users domain's dialog. Its title is "Stop emails about
  new opportunities?", and its buttons are "Keep receiving them" and "Unsubscribe". Unsubscribe
  clears the checkbox, closes the dialog, returns focus to the checkbox, and announces the outcome
  in the status region (`unsubscribed`). "Keep receiving them" or Escape closes the dialog and
  changes nothing, which leaves the ordinary settings page (`user-profile-self-notifications`,
  `default`).
- **Notifying vendors asks first** (R-6.23: "chooses to notify vendors and confirms"). The dialog is
  an `AlertDialog` with the `warning` variant. Its title is "Notify vendors that the terms have
  changed?". The body says that every acceptance is withdrawn, that active vendors are emailed, and
  that a withdrawn acceptance cannot be restored. The buttons are "Notify vendors" and "Cancel".
  Focus moves in and stays in, Escape dismisses it, and focus returns to the opening button.
- **The success message says only what the service knows** (R-6.24). It is reported at once, and
  titled "Vendors have been notified". Its body says that the acceptances have been withdrawn, that
  the emails are being sent now, and that this page will not report whether each one arrives
  (R-6.2). The criterion describes the administrator being told at once, and the design keeps that.
  It does not let the message claim that delivery happened.

### Loading, empty, refused, signed out

- **Loading.** This follows the users domain's pattern. The unsubscribe landing asks nothing until
  the signed-in account has arrived, because the question must name that account's address
  (`loading`). The reference page renders its H1 at once, while the samples are composed.
- **Signed out.** The unsubscribe landing sends a visitor who is not signed in to the users
  domain's sign-in screen. Its `sign-in-required` alert is worded for this arrival: the visitor is
  returned to their settings with the question asked, and the change applies to the account they
  sign in with (R-6.7). On the list, a visitor who is not signed in is not shown the opt-in at all.
  Nothing replaces it (`signed-out`).
- **Refused.** Anybody but an administrator who asks for the reference page is given the shared
  missing page (`not-found-page`), as every earlier domain does for its refusals. The terms
  broadcast is never rendered for anyone but an administrator, so its refusal has no screen.
- **Empty.** Nothing in this domain can be empty. The reference page always has every message.

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). The users domain's list applies here too. This domain adds:

- **State in words.** The opt-in's state is a sentence, and the button names the choice it
  offers, so neither depends on colour or a pressed style.
- **Nothing hidden by width** (R-6.27, and WCAG 1.4.10). The opt-in reflows at 320 pixels and
  400% zoom and is never removed at a breakpoint.
- **Announcements.** The opt-in, unsubscribing and a successful broadcast are announced through
  `role="status"`. A failed broadcast uses `role="alert"`. Loading uses `role="status"`.
- **The reference page is navigable at length.** It has a contents `nav` with in-page links, an H2
  per event, and an H3 per message, so a screen reader's heading list is the catalogue. Each preview
  frame is a named group ("Email body: <subject>"). The link text inside the samples ("Unsubscribe",
  "Manage your notification settings") repeats across messages, and that is acceptable only because
  each link sits inside a named group. A build that drops the group label must add the subject to
  each link's accessible name.
- **Dialogs** follow the alert-dialog pattern that the earlier domains describe.
- **Checks still required.** The scan checks rendered stories, not conformance. A screen-reader check
  of the unsubscribe dialog opening on arrival, a keyboard check of the reference page's in-page
  links, and a 320-pixel check of the opt-in on a real list must be done before the build is
  accepted.

### Test IDs

The users domain's rules apply: one ID per kind of element, an action and an observation on the
same element share its ID, and the same element keeps its ID on every page.

| Page | Surface name | Test ID |
| --- | --- | --- |
| notification-unsubscribe-landing | `confirm_unsubscribe` | `unsubscribe-confirm-button` (the users domain's, reused) |
| | `cancel_unsubscribe` | `unsubscribe-cancel-button` (reused) |
| | `unsubscribe_confirmation` | `unsubscribe-modal` (reused) |
| | `confirmation_names_signed_in_address` | `unsubscribe-confirmation-address`, the `span` inside the dialog holding the address |
| | `resolves_to_signed_in_person` | `notifications-email-address` (reused), the sentence naming whose settings these are |
| | `sign_in_required` | `sign-in-required` (the users domain's, reused) |
| notification-optin-opportunity-list | `toggle_new_opportunity_notifications` | `notification-optin-toggle` |
| | `notification_control` | `notification-optin-control`, the section |
| | `notification_control_state` | `notification-optin-state`, the state sentence |
| | `notification_control_hidden_on_narrow_screen` | `notification-optin-control`: see gap 1 |
| notification-terms-broadcast | `notify_vendors_of_updated_terms`, `notify_vendors_control` | `notify-vendors-button` |
| | `confirm_notify_vendors` | `notify-vendors-confirm-button` |
| | `cancel_notify_vendors` | `notify-vendors-cancel-button` |
| | `notify_vendors_confirmation` | `notify-vendors-dialog` |
| | `notify_vendors_success` | `notify-vendors-success` |
| | `notify_vendors_failure` | `notify-vendors-failure` |
| notification-email-reference | `open_reference` | `email-reference-page`, the page wrapper (opening the address is the action, as with the opportunities domain's `/status`) |
| | `message_group_title` | `email-reference-group-title`, a `span` inside each event's H2 |
| | `message_subject` | `email-reference-subject` |
| | `message_summary` | `email-reference-summary`, present only where a summary is written |
| | `message_body` | `email-reference-body`, the preview frame |
| | `refused_for_non_administrator` | `not-found-page` (reused) |

The group title's ID is on a `span` inside the `Heading`, because no earlier story shows that
`Heading` passes a `data-*` attribute through.

### Per-screen notes

**notification-unsubscribe-landing** has four states. `default` is the dialog open on arrival,
naming the signed-in address. `loading` is the account not yet arrived, with no question asked.
`unsubscribed` means the dialog was confirmed: the checkbox is cleared and the outcome is announced.
`sign-in-required` is a visitor who is not signed in. There is no `cancelled` state, because
cancelling leaves the users domain's settings page exactly as its `default` story shows. The users
domain's `user-profile-self-notifications.unsubscribe-confirm` story shows the same dialog without
the profile navigation. The two should match, and this design's version is the whole page.

**notification-optin-opportunity-list** has three states. `default` is a signed-in vendor with
emails off. `subscribed` is just after turning them on, with the opposite choice offered and the
outcome announced. `signed-out` has no control. A public sector employee sees the same control. The
list's other states (`staff`, `loading`) are the opportunities domain's, and the control sits in
the same place in them. The opportunities domain's per-screen note says the control goes at "the
end of the filter row". This design places it after the filter form instead, for the reason given
under layout.

**notification-terms-broadcast** has four states. `default` is an administrator viewing the terms
page, with the section offered. `notify-confirm` is the question. `notified` is the success
message. `notify-failed` is the failure message, with the button still offered.

**notification-email-reference** has three states: `default`, `loading` and `not-found`. The
`default` story shows five events as a pattern. They include a message sent to hidden batches
(R-6.8), a pair from one event with and without a summary, and an evaluation-panel message of the
kind the old page omitted (R-6.14, R-6.19). They also include the not-awarded message, which leads
with the title and the winner (R-6.25), and the changed-terms message naming all three programs
(R-6.18). Only the new-opportunity announcement ends with Unsubscribe. Every other sample ends
with "Manage your notification settings" (R-6.16).

### Gaps

These are work for the spec. None was filled with invented behaviour. Where a story had to show
words that no criterion gives, the story or this list says so.

1. **An observation named for a superseded criterion.** `notification_control_hidden_on_narrow_screen`
   is R-6.22's wording, and R-6.27 replaced it: the control must be shown at every width. The
   observation is bound to the control itself (`notification-optin-control`), so a test can find
   it at a narrow width and assert that it is **visible**. The name says the opposite of the
   accepted rule. The contract stage should rename it (for example `notification_control_on_narrow_screen`).
   This stage may not rename it.
2. **R-6.6 and R-6.16 disagree.** R-6.6 (accepted, v2) says every message ends with an Unsubscribe
   offer. R-6.16 says a message the preference does not govern must not offer to unsubscribe. R-6.6's
   own note leans on R-6.10, which is superseded. The reference page's samples follow R-6.16, the
   later authored rule. R-6.6 should be narrowed to the messages the preference governs.
3. **Which messages the preference governs.** R-6.16 implies that some messages are outside the
   choice but does not list them. The only list, "the announcement of newly published
   opportunities and nothing else", is in R-6.10, which is superseded. The settings page's scope
   sentence and the samples' footers follow R-6.10's scope. If the ruling on R-6.10 widens the
   choice, both change.
4. **The wording after an immediate save.** No criterion words what a person is told after
   unsubscribing or after using the opt-in. The announcements in the stories are the design's own.
5. **Unsubscribing when already unsubscribed.** No criterion says what the landing shows to a
   person whose new-opportunity emails are already off: the same question, which would change
   nothing, or a statement that they are already unsubscribed. No state is designed for it.
6. **The opt-in for a visitor who is not signed in.** R-6.21 offers it to a signed-in person. It is
   not stated whether a visitor should be invited to sign in to get these emails. Nothing is shown.
7. **The opt-in failing to save.** It is not stated what a person sees, or whether the button's
   text reverts.
8. **What a failed broadcast means.** `notify_vendors_failure` is observed, but no criterion says
   what can fail, what the administrator is told, or whether some acceptances may already be
   withdrawn when it does. R-6.24 says the withdrawal completes before the response. The alert names
   no cause and makes no claim about the acceptances.
9. **The content of every message.** R-6.19 requires every message the service can send on the
   reference page. The spec gives neither that list nor the subject, summary or body of any
   message: "nothing outside the code describes the content of any individual message". The count
   of sixty-two comes from the old service. The stories' subjects, summaries and bodies are
   placeholders. The events are taken from the criteria. The service's logo (R-6.3), which heads
   every message, is not in the preview frame, because the token set has no size for an image.
10. **What a refused reference page looks like.** R-6.13 says only "refused". The shared missing
    page is used, as every earlier domain does.
11. **When the broadcast is offered.** R-6.23 says an administrator "viewing" the terms page. It
    does not say whether the section is offered while the page's edit form is open, whether it
    should require that the terms were changed since the last announcement, or whether a second
    announcement may follow the first. The design offers it in the page's view mode, every time.
12. **The test marker on the reference page.** R-6.3 marks every message sent from a test
    environment. It does not say whether the subjects previewed on the reference page carry the
    marker. The samples show none.
13. **Loading states are the design's own.** No criterion describes a delay on the landing or the
    reference page. They exist because both depend on data that arrives after the page.
