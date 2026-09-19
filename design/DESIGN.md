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
