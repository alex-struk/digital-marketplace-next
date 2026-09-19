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

---

## Domain: content

The service's own prose is held as pages: a title, a body of formatted text and a short address,
readable by anyone at `/content/<address>` and managed by an administrator. This domain designs six
surfaces: the footer's five links to those pages (`content-footer`), the service level agreement
link on the Code With Us learn-more screen (`content-service-level-agreement-link`), the
administrator's list of pages (`content-list`), creating a page (`content-create`), a page's
managing screen (`content-edit`), and the public page itself (`content-view`). Every state named in
`design/screens.yaml` has a story at `design/catalogue/<page>.<state>.stories.tsx`, and the story is
what a build copies.

Two decisions shape the domain:

- **There are two kinds of page, and the screen always says which.** An ordinary page can be
  renamed and deleted. A page the service needs (R-7.25) can only have its title and body changed.
  The list marks it, and its managing screen carries a warning, offers no Delete, and shows the
  address read-only. Nothing tries to be clever about it: the control that cannot be used is not
  rendered, and the warning says why.
- **Publishing is the only save, and it is public at once.** No page is ever a draft (R-7.1 note).
  So every publish, whether creating or changing a page, asks to be confirmed, and the confirmation
  says the words go public straight away.

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1, unless the entry says otherwise. `Footer`
and `FooterLinks` are new to the catalogue. Their props were checked against the type declarations
of the installed 0.8.1 package. Everything else is used exactly as the earlier domains use it.

| Component | Used for |
| --- | --- |
| `Footer` + `FooterLinks` | The site footer. `FooterLinks` is given the title "About this service" and the five page links. The `Footer`'s own default acknowledgement, logo, contact block and copyright are kept. |
| `Heading` | One H1 per screen. On the managing screen the H1 is the page's own title, with "Manage a page" as small text above it, as the opportunities and organizations domains do for their manage pages. On the public page the H1 is the page's title. |
| `Text` | Body copy. `size="small" color="secondary"` is used for the line above an H1, the address rule, the resulting public address, the table caption, and the public page's address line. |
| `Button` | Every command. `primary` is used for Edit page, Publish page, Publish changes and the dialog confirmations. `secondary` is used for Cancel. `secondary` with `danger` is used for Delete page, and `primary` with `danger` for its confirmation. `tertiary size="small"` is used for the formatting buttons in the body editor. |
| `ButtonGroup` | The managing screen's action row (`ariaLabel="Page actions"`), and each form's submit row. |
| `Link` | Titles and addresses in the list, the public address and the authors on the managing screen, the formatting-guide link, the footer links, and the service level agreement link. `isButton` is used for "Create page". |
| `TextField` | Title and address. In view mode on the managing screen they are `isReadOnly`, as in the users domain. The address of a page the service needs is `isReadOnly` in edit mode too. |
| `TextArea` | The body, in the body editor. It is also `isReadOnly` in view mode. **No `maxLength`** on the title or the body. R-7.20 requires a body that is too long to be marked with its reason, and a `maxLength` would silently cut it instead. |
| `Form` | Always `validationBehavior="aria"`. |
| `InlineAlert` | The needed-page warning (`warning`), published and removed confirmations (`success`, `role="status"`), the address-in-use refusal (`danger`, `role="alert"`), and the list of problems before an unavailable publish button (`danger`). Each alert that carries a test ID is wrapped in a `div` that holds it. |
| `Modal` + `AlertDialog` | Publish page and Publish changes (`confirmation`), Delete page (`destructive`). |
| `ProgressCircle` | Indeterminate loading, inside `role="status"` next to visible text. |
| `FileTrigger` (from `react-aria-components`) | "Insert image" in the body editor, with `acceptedFileTypes` set to JPEG and PNG. What happens after a file is chosen belongs to the files domain (`file-embedded-image`). |

### This project's own components (not design-system components)

These are built from standard HTML, or from `react-aria-components` (the library the design system
is itself built on), and styled only with tokens. None of them is a design-system component, and
none may be presented as one.

- **Body editor.** This is new in this domain. The design system has no rich-text or markdown
  editor, and the opportunities domain's gap 21 left this decision to the content domain. The
  editor is a composition, not a new widget: a `Toolbar` from `react-aria-components`, labelled
  "Formatting for Body", holding design-system `Button`s (Bold, Italic, Heading, Bulleted list,
  Numbered list, Link) and the "Insert image" `FileTrigger`. Below it is the design system's
  `TextArea`, and after that a `Link` to the formatting guide at `/content/markdown-guide`, which
  opens in a new tab so the form is not lost (R-7.26). `Toolbar` gives the arrow-key movement a
  toolbar is expected to have, and there is no design-system toolbar. Each formatting button wraps
  the selection in marked-up text, or inserts it at the cursor. The body is stored as marked-up
  text, exactly as typed. Other domains that edit formatted text (an opportunity's description)
  should reuse this editor rather than building a second one.
- **Formatted-text renderer.** This is new in this domain. It turns a page's stored body into
  headings, paragraphs, lists, links and images. **Raw markup in the body is escaped and shown as
  text, never executed**, and the same renderer is used on the page's own address and wherever
  another screen embeds a body (R-7.17). A build must not use a second renderer anywhere. Every link
  it renders carries `data-testid="content-body-link"`, and every image fits within the width of
  the text column. It is not a design-system component because the design system renders no
  document content.
- **Key facts list.** This is the opportunities domain's `<dl>`, reused. It holds the dates and
  authors on the managing screen, and the dates on the public page.
- **Data table.** This is the users domain's table, reused. It is used for the list of pages.
- **Status badge.** This is the users domain's badge, reused. It carries "Yes" in the list's
  "Needed by the service" column. An ordinary page shows plain "No", so the column reads in words
  either way.

No token beyond those the earlier domains list is used: `--layout-margin-{none,small,medium,large}`,
`--layout-padding-{small,large}`, `--layout-border-width-small`,
`--layout-border-radius-{medium,circular}`, `--surface-color-border-{default,medium}` and
`--typography-font-weights-bold`.

### How each screen is laid out

The users domain's layout applies: a single-column grid, with `--layout-margin-large` between
regions and `--layout-padding-large` around the page. Action rows wrap.

- **Footer.** It sits on every screen, after the main content, whatever the viewer's sign-in state
  (R-7.19). The five links appear in the order R-7.19 names them (About, Disclaimer, Privacy,
  Accessibility, Copyright), and each opens `/content/<address>`. The footer is identical signed in
  and signed out.
- **Service level agreement link.** It is an inline link in the sentence beside a program's cost,
  and its visible text is "service level agreement". Its target is `/content/service-level-agreement`,
  a page the service creates for itself (R-7.18). The same link, with the same test ID, belongs on
  the three program cards and the three opportunity forms (see gap 7).
- **List** (`content-list`). The H1 "Content Management" is followed, on the same row, by the
  primary "Create page" link. Then comes one sentence explaining "Needed by the service", then the
  table. The table has five columns: Title (a link to the managing screen), Public address (a link
  to the public page), Needed by the service, Created, and Last updated. Its caption says the rows
  are in order of title (R-7.5). After a page is removed, the success alert sits between the H1 row
  and the sentence.
- **Create** (`content-create`). The H1, then one sentence saying every field is required and the
  page is public as soon as it is published. Then Title; Address, with the address rule and the
  resulting public address under it; the body editor; the reason Publish is unavailable, or the
  list of problems; and then Cancel and Publish page.
- **Managing screen** (`content-edit`), view mode. "Manage a page" as small text, then the H1 (the
  page's title), then the key facts: Public address, Published, Published by, Last updated, Last
  updated by (R-7.27). After them come any alert, the needed-page warning, the action row (Edit
  page, and Delete page for an ordinary page), and then the section "Current wording", holding the
  title, address and body read-only. There is no history section of any kind (R-7.23). On the page
  at `terms-and-conditions`, the notifications domain's "Notify vendors of updated terms" section
  follows "Current wording" (R-7.13, `notification-terms-broadcast`).
- **Managing screen, edit mode.** The small line and the H1 stay. The needed-page warning stays, if
  there is one. Then comes the section "Edit the page": one sentence on what is required and that
  changes go public at once, then the same fields as create, then Cancel and Publish changes. The
  key facts and Delete page are not shown while editing, so the only way out is Cancel or Publish
  changes.
- **Public page** (`content-view`). An `<article>` labelled by its H1 (the page's title). Under the
  H1 are the key facts, Published and Last updated (R-7.1). Then comes the rendered body, and last a
  small line giving the page's address. No authorship is shown (R-7.27 note).
- **Document title and focus.** The document title is the page's own title on the public page, and
  the surface title everywhere else. On client-side navigation, focus goes to the H1.

### Forms and validation

These rules apply to the create form, and to the managing screen in edit mode. It is the same form.

- **Fields.** Title: required, 1–100 characters (R-7.20). Address: required on create and when
  editing an ordinary page. It must be lowercase letters and numbers in groups joined by single
  hyphens (R-7.21), and it must not be in use by another page (R-7.22). Body: required, 1–50,000
  characters, formatted text (R-7.20, R-7.26).
- **The address rule is stated before input** (R-7.21 note). It is a paragraph under the field
  (`content-slug-rule`), tied to it by `aria-describedby`, and reads "Use lowercase letters and
  numbers, in groups joined by single hyphens, like about-us. No capital letters, spaces or
  underscores, and no hyphen at the start or end." Under it, the **full public address** updates as
  the person types (`content-resulting-address`). While the address is invalid, that line says the
  public address will be shown once the address is valid.
- **Renaming says what it does** (R-7.24). When an ordinary page is edited, the address field's
  description says "Changing the address moves the page at once. Links to the old address will stop
  working." (see gap 8).
- **A page the service needs** has its address as a read-only field, with the description "The
  service needs this page at this address, so the address cannot be changed." (R-7.25).
- **When a field is checked.** When the person leaves it, and never on each keystroke. This follows
  the organizations domain's pattern, because the surface observes the publish button as
  unavailable until the form is valid. An invalid field gets `isInvalid` and an `errorMessage`
  directly under it that says what to do: "Enter a title"; "Use only lowercase letters and numbers
  joined by single hyphens, like hackathon-rules"; "The body is 50,012 characters long. Shorten it
  to 50,000 characters or fewer." The value the person typed is always kept.
- **Publish is unavailable until the form is valid** (`publish_disabled_until_valid`). Publish page
  and Publish changes are `isDisabled` while any field is empty or invalid. Because a disabled
  button cannot take focus, the reason is given as **visible text before the button**, and is also
  referenced by `aria-describedby`. While nothing is wrong yet, that text says "Fill in the title,
  address and body to publish the page." Once something is wrong, it is a `danger` `InlineAlert`
  titled "Fix N fields to publish the page" (or "…to publish your changes"), with one `Link` per
  problem to the field's `id`. Each item carries `data-testid="field-error"`. The list does not
  take `role="alert"` or move focus, because it updates as the person works. Once the form is
  valid, the text says the person will be asked to confirm.
- **An address already in use** (R-7.22) can only be known by the service, so it is reported after
  the person confirms. The confirmation closes and a `danger` `InlineAlert` with `role="alert"`
  appears at the top of the form, titled "This address is already in use". It names the address,
  says nothing was created or published, and links to the field. The alert's wrapper takes focus.
  The address field is marked "Another page already uses this address. Choose a different one."
  Everything typed is kept, and the existing page is untouched.
- **Inserting an image** (R-7.26). "Insert image" offers JPEG and PNG files. The uploaded image's
  reference is inserted into the body at the cursor. The uploading indicator and the failure
  message are the files domain's (`file-embedded-image`).
- **Cancel.** On create, it returns to the list. On edit, it returns to view mode with nothing
  saved. Neither asks first, because nothing has been published.
- **After publishing.** Creating opens the new page's managing screen, with a `success` alert
  "Page published" that gives its public address (R-7.7). Publishing changes returns to view mode
  with a `success` alert "Changes published", and the key facts show the new updated date and the
  person who made the change (R-7.8, R-7.27). Both alerts use `role="status"`.

### Confirmation dialogs

| Action | Variant | Title | Confirm (test ID) | Other |
| --- | --- | --- | --- | --- |
| Publish page | `confirmation` | "Publish this page?" | "Publish page" (`content-publish-confirm`) | Cancel (`content-dialog-cancel`). The body names the public address and says anyone can read it, signed in or not. |
| Publish changes | `confirmation` | "Publish your changes?" | "Publish changes" (`content-publish-changes-confirm`) | Cancel. The body says readers see the new wording at once, and that the replaced wording is kept on record but cannot be viewed or restored from the service (R-7.8, R-7.23). |
| Delete page | `destructive` | "Delete "<title>"?" | "Delete page" (`content-delete-confirm`, `danger`) | Cancel. The body says the page and every earlier version go permanently, the address stops answering, links to it will find the not-found page, and this cannot be undone (R-7.9). |

Focus moves into the dialog and stays there, Escape dismisses it, and focus returns to the control
that opened it. Nothing changes until the confirm button is pressed. After a deletion, the person is
taken to the list, where a `success` alert "Page removed" names the page and its old address
(R-7.9).

### Loading, empty, refused, not found

- **Loading.** This follows the users domain's pattern: a `role="status"` row holding a
  `ProgressCircle` and matching text. The list and the managing screen render their H1 at once (the
  managing screen uses the surface title "Manage a page" until the page's title arrives). The public
  page shows only the status row, because its H1 is the page's own title and nothing else stands
  in for it.
- **Not found and refused.** These all use the shared missing page (H1 "Page not found",
  `data-testid="not-found-page"`). It is shown on the public page for an address no page holds and
  for a malformed address, which look the same to a person (R-7.2, R-7.3). It is shown on the list,
  the create page and the managing screen to anyone but an administrator (R-7.6, which says
  "not-found"). And it is shown on the managing screen for an address no page holds. The navigation
  menu offers the content area only to an administrator (R-7.6). The menu is not this domain's
  surface, so it is stated here for whoever designs it.
- **Empty.** The list has no empty state. It can never be empty, because the pages the service needs
  cannot be removed (R-7.25) and a fresh installation creates them (R-7.12).
- **An embedded body that is missing** (R-7.29) belongs to the screens that embed it. Following that
  criterion, the embedding section is left empty and the rest of the screen works. Those screens are
  other domains'.

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). The users domain's list applies here too. This domain adds:

- **Formatted text is safe and structured.** The renderer outputs real headings, lists and links,
  never executes raw markup (R-7.17), and must not break the page's outline. A body's own headings
  start at H2 under the page's H1. An image written without alternative text is rendered with
  `alt=""`, and the formatting guide must tell authors to describe their images (see gap 11).
- **The footer is a `contentinfo` landmark**, provided by the design system's `Footer`. Its links
  are titled "About this service" through `FooterLinks`' `figcaption`.
- **Words, not colour.** "Needed by the service" reads "Yes" or "No". The needed-page warning is
  text. A read-only address is exposed as read-only, and its reason is its description.
- **Disabled publish buttons explain themselves** in visible text before the button, referenced by
  `aria-describedby`.
- **The formatting toolbar** is a labelled `toolbar` with arrow-key movement, and each button has a
  visible text label rather than an icon.
- **A link that opens a new tab says so** in its text ("How to format text (opens in a new tab)").
- **Dates** are `<time datetime>` elements.
- **Checks still required.** Keyboard use of the formatting toolbar and the image chooser, a
  screen-reader check of the address rule and the resulting-address line as the person types, and
  a check of a real body with headings, lists and images through the renderer have not been done.
  They are required before the build is accepted.

### Test IDs

The users domain's rules apply: one ID per kind of element, an action and an observation on the
same element share its ID, and the same element keeps its ID on every page. The IDs shared across
this domain's pages are:

- **The same field on create and edit.** `content-title-field`, `content-slug-field`,
  `content-body-field`, `content-body-image-button`, `content-slug-rule`,
  `content-resulting-address`, `content-cancel-button`, `content-duplicate-slug-error`.
- **The same fact on the managing screen and the public page.** `content-page-address`,
  `content-published-date`, `content-updated-date`.
- **Reused from the users domain.** `field-error` and `not-found-page`.

The following bindings are not obvious from their names:

- **The same element serves two names.** `content-publish-button` is both `publish_page` and
  `publish_disabled_until_valid`. `content-slug-field` is both `edit_slug` and
  `slug_locked_for_fixed_page`: on a page the service needs, it is read-only. `content-delete-button`
  is both `delete_page` and `delete_withheld_for_fixed_page`: on a page the service needs, it is
  absent (the `fixed` and `editing-fixed` stories). `service-level-agreement-link` is
  `follow_service_level_agreement_link`, `service_level_agreement_link` and `link_target_address`:
  the target is the link's `href`. On the list, `content-list-title-link` is both
  `open_page_for_editing` and `page_title`, and `content-list-address-link` is both
  `open_public_page` and `page_public_address`.
- **An outcome shown on the screen the person lands on.** `content-create.published_success` is
  `content-published-success`, which is on the managing screen the person is taken to
  (`content-edit.created`). `content-edit.deleted_success` is `content-deleted-success`, which is on
  the list the person is returned to (`content-list.deleted`). R-7.7 and R-7.9 say where the person
  goes. The adapter reads these after the navigation (see gap 3).
- **Page wrappers.** `content-page` is the public page's `<article>`. It is
  `readable_when_signed_out`, and it is also `answer_at_link_target` for the service level agreement
  link, because a page answering there is that article. When the page does not answer,
  `not-found-page` appears instead. `site-footer` wraps the footer, for `present_when_signed_out`.
- **Order.** `ordered_by_title` is `content-list-table`. A test reads the order of the
  `content-list-title-link`s inside it.
- **Links in a body.** `follow_body_link` is `content-body-link`, which the renderer puts on every
  link it renders.
- **Something that must be absent.** `version_history` is `content-version-history`, and **no story
  renders it, on purpose**. R-7.23 says nothing in the service shows an earlier version, and the
  surface's own comment says the observation exists to come back empty. A build must never render
  an element with this ID (see gap 1).
- **Other domains should bind to these.** The files domain's `file-embedded-image.upload_body_image`
  should be `content-body-image-button`, which is the same control. The opportunities domain should
  use `service-level-agreement-link` on the program cards and the three forms.

**Extra IDs, not named in the surface, that the stories carry for the adapter:**
`content-list-row` (one table row), `content-publish-changes-dialog` and `content-delete-dialog`
(the dialogs whose confirm buttons the surface names), and `content-dialog-cancel` (Cancel in every
dialog of this domain).

### Per-screen notes

**content-footer** — `default`. The footer as a visitor who is not signed in sees it, under a
placeholder home page. Signed-in viewers see the same footer, so there is no second state.

**content-service-level-agreement-link** — `default`. The link in the cost section of the Code With
Us learn-more screen. The rest of that screen is a placeholder frame, because no page in the
surface designs it. What the link leads to is `content-view.default`: a page that answers.

**content-list** — `default` (an administrator; the needed pages still titled by their address,
R-7.12; one ordinary page), `deleted` (returned here after removing a page, R-7.9), `loading`,
`not-found` (R-7.6).

**content-create** — `default` (blank; Publish page unavailable, with the reason), `invalid` (an
empty title and an address with capitals and an underscore, R-7.20, R-7.21), `ready` (valid; the
full public address shown; Publish page available), `publish-confirm`, `duplicate-slug` (confirmed
at "about", refused, R-7.22), `not-found`.

**content-edit** — `default` (an ordinary page two administrators have touched, each named and
linked, R-7.27), `fixed` ("about", never edited: the warning, no Delete, "System" as publisher and
last editor, "Initial version" as the body, R-7.12, R-7.25, R-7.27), `created` (just created,
R-7.7), `editing`, `editing-fixed` (address read-only, R-7.25), `invalid` (title cleared, body too
long, R-7.20), `duplicate-slug` (a rename to "about" refused, R-7.22), `publish-confirm`,
`changes-published` (R-7.8), `delete-confirm` (R-7.9), `loading`, `not-found`. The terms page's
broadcast section, and its states, are the notifications domain's.

**content-view** — `default` (the page at "privacy" read by a visitor who is not signed in,
R-7.1), `loading`, `not-found` (R-7.2, R-7.3).

### Gaps

These are work for the spec. None was filled with invented behaviour. Where a story had to show
words that no criterion gives, the story or this list says so.

1. **An observation that must be absent.** `content-edit.version_history` is bound to
   `content-version-history`, which appears in no story, because R-7.23 says there is no history to
   show. A test can only assert that it is absent. If the contract wants every bound ID to be
   present somewhere, this observation should become a statement about the page (for example,
   "only the current wording is offered") rather than a named element.
2. **How many pages a fresh installation has.** R-7.12 (accepted) says twenty-two pages, all needed
   by the service. D-content-27's ruling, although that row is obsolete, says the rebuild does not
   create the seven unlinked guides and scope page. R-7.18 adds the service level agreement page.
   On those rulings a fresh installation has sixteen pages, not twenty-two. The list's design does
   not depend on the count, but R-7.12's figure and list need restating.
3. **Outcomes the surface puts on the wrong page.** `content-create.published_success` and
   `content-edit.deleted_success` are shown on the screen the person is sent to (R-7.7, R-7.9), not
   on the page the surface lists them under. They are bound to IDs in `content-edit.created` and
   `content-list.deleted`. The surface could move them, or the adapter can read them after the
   navigation.
4. **Invalid submission against an unavailable button.** R-7.20 says a submission with an empty
   title or an overlong body is refused with the failing field named. The surface observes the
   publish button as disabled until the form is valid. The design marks each field when the person
   leaves it and keeps publishing unavailable, as the organizations domain does (its gap 4). A
   refusal of such a submission made outside the screen has no wording.
5. **Message wording.** Every message is the design's own: the needed-page warning, the
   address-in-use refusal, the success alerts, the dialog texts, the address rule's phrasing, and
   the "Needed by the service" column heading. R-7.21's note says the rule is stated on the form but
   does not give its words.
6. **The public page's address line.** The surface names `content-view.page_address`, but no
   criterion says the public page shows its own address. The design adds a small line at the end
   of the article ("Address of this page: /content/privacy") so the observation has something to
   bind to. If that is not wanted, the observation should be read from the browser's address
   instead, and the line removed.
7. **The learn-more screen and the other five service level agreement links.** The surface's route
   for this link is `/learn-more/code-with-us`, but no page in the surface designs the learn-more
   screens, and no criterion says what they contain. Only the link is designed. The program cards
   and the three opportunity forms also carry the link (R-7.18). The opportunities domain left its
   address to this domain (its gap 22): it is `/content/service-level-agreement`. What the service
   level agreement says is not in the spec. On a fresh installation it will read "Initial version",
   like every page the service creates (R-7.12's note warns that this leaves legal pages as
   placeholders).
8. **Warning of a rename.** R-7.24's note records that nothing warned the administrator that
   renaming breaks links. The design states it in the address field's description, because it is
   true (R-7.24) and costs nothing. It adds no behaviour: there is no extra confirmation and no
   redirect. This needs a ruling if the spec wants the old silence kept.
9. **Two administrators editing one page** (R-7.28). A submission carries no record of the version
   it was based on, so the screen cannot warn of an overwrite, and no `conflict` state is designed.
   The rarer collision that R-7.28 says is refused "with a service error" has no wording, and no
   criterion says what the administrator is shown. If the rebuild adds a version check, this screen
   needs a conflict state and the spec needs its wording.
10. **Failures not worded.** No criterion says what an administrator sees when publishing, deleting
    or loading the list fails for a reason other than validation or a clash of addresses.
11. **The editor's detail.** R-7.26 says "formatting shortcuts" but not which. The six in the
    toolbar are the design's choice. Which markup dialect is stored, whether there is a preview,
    and whether an image is inserted with alternative text are not stated. The formatting guide page
    is itself an editable page that reads "Initial version" until written (R-7.26 note), so authors
    are offered no real help on a fresh installation. It should include how to describe an image.
12. **Dates.** No criterion gives the date format or time zone for published, created and updated
    dates. The stories use "September 19, 2026" as illustration.
13. **The footer's other content.** R-7.19 covers only the five links. The design system `Footer`'s
    defaults (the land acknowledgement, the B.C. Government logo, the gov.bc.ca contact block and
    the copyright line) are kept, because nothing says to replace them. Whether the service wants
    its own contact details there is not stated.
14. **Content the spec does not carry.** Every page body in the stories is a placeholder, marked as
    such. The people named ("Test Administrator", "Test Administrator Two") are synthetic, in the
    users domain's style, and the page "hackathon-rules" is an invented ordinary page.

---

## Domain: files

A stored file is the same thing wherever it comes from: an attachment on an opportunity or a
proposal, a profile picture, an organization's logo, or an image placed in formatted text. It has a
name, an uploader, a date and a rule about who may read it. It is written once and never changed
(R-8.6). This domain owns no screen of its own. The surface gives it six entries, and they come in
two kinds:

- **Three service addresses** (`file-upload`, `file-description`, `file-download`). These answer
  with data or with the file itself, never with a page. Most of this domain's criteria are about
  them: who may upload, what is refused and how, and who may read.
- **Three shared controls** that sit on pages other domains own. `file-attachment-control` is the
  attachment list on the three opportunity forms, the Code With Us proposal form and the opportunity
  history note. `file-image-picker` is the profile picture on the profile screens and at sign-up,
  and the logo on the organization forms. `file-embedded-image` is "Insert image" in the content
  domain's body editor, wherever that editor appears.

Every state named in `design/screens.yaml` has a story at
`design/catalogue/<page>.<state>.stories.tsx`. For the three controls, the story is what a build
copies. The host page around each control is trimmed to a frame, and a line in the story says
whose design the trimmed part is. For the three addresses, the story is a **response reference**
(see below). A build does not render it.

Two decisions shape the domain:

- **Limits are stated before a file is chosen** (R-8.17). Every control that takes a file has a
  sentence next to its trigger that gives the accepted types and the 10 MB limit. The trigger
  points at that sentence with `aria-describedby`. A person should never find out about a limit
  only by breaking it.
- **Who can see a file is said where the file is added.** A profile picture, a logo and an
  inserted image are readable by anyone (R-8.28, R-8.29). An attachment is readable by whoever
  can read the thing it is attached to (R-8.20). Each control says this in one plain sentence,
  because the person adding the file cannot take it back: a file is never removed (R-8.26, R-8.31).

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1, unless the entry says otherwise. No
component is new to the catalogue. Every component and prop used here is one the earlier domains'
stories already compile with.

| Component | Used for |
| --- | --- |
| `Heading` | The host page's H1 (kept in each frame so the outline is real), the host section's H2, and the "Attachments" H3 in the opportunity form. On the three service addresses, the H1 is the surface title and there are H2s for "Request" and "Answer". |
| `Text` | Body copy. `size="small" color="secondary"` is used for the stated rule next to each file trigger, the resulting-name line under a renamed attachment, and the notes that mark a trimmed frame. |
| `Button` | "Add attachment" and the profile picture trigger are `secondary`. "Insert image" is `tertiary size="small"`, inside the content domain's toolbar. Remove is `secondary size="small"`, with an `aria-label` that begins with its visible text and names the file ("Remove Statement of work.pdf"). |
| `FileTrigger` (from `react-aria-components`) | Every file chooser. `acceptedFileTypes={["image/jpeg", "image/png"]}` is set on the image picker and on "Insert image". The attachment trigger accepts any type, because no criterion restricts an attachment's type (R-8.23 note). |
| `TextField` | An attachment's name. On a new attachment it is editable and optional (R-8.27). On a stored attachment it is `isReadOnly` with the description "Already stored, so its name cannot be changed.", as the users domain shows read-only details. |
| `Link` | Each attachment's download link. Its `href` is the file's own address, `/api/files/<id>?type=blob`, because every download in the interface is that request (R-8.10). |
| `InlineAlert` | `danger` with `role="alert"` for a file that is too large, a rejected picture, and an image that could not be inserted. Each is wrapped in a `div` that carries the test ID. |
| `ProgressCircle` | The uploading indicator for an inserted image, inside a `role="status"` row next to visible text. |
| `Form`, `ButtonGroup`, `TextArea`, `Toolbar` | Only as the host pages use them, in the trimmed frames. |

### This project's own components (not design-system components)

These are built from standard HTML and styled only with tokens. None of them is a design-system
component, and none may be presented as one.

- **Attachment list.** This is new in this domain. It is a `<ul>` with no bullets. Each `<li>` is a
  row with a `--surface-color-border-medium` border and a `--layout-border-radius-medium` radius. A
  stored row holds the read-only name, the download link and Remove. A new row holds a line giving
  the chosen file's name and size, the name field, the resulting-name line and Remove. The design
  system has no file list or file-upload component. `FileTrigger` only opens the chooser, and it
  shows nothing about what was chosen.
- **Picture preview.** This is new in this domain. It is a plain `<img>` with `max-width: 100%` and
  `height: auto`, so a picture is shown at the size it was stored, up to the width of the column. The
  design system has no image or avatar component. The **alternative text** says what the image is for
  ("Your current profile picture"), or, for an image in formatted text, whatever the author wrote.
- **Response reference.** This is new in this domain, and it exists only in the catalogue. It is a
  `<dl>` built as the opportunities domain's key facts list, stacked in one column. There are two of
  them under "Request" and "Answer" H2s. It sets out what a caller sends to one of the three service
  addresses and what comes back, so that each part of the answer the surface names has an element to
  carry its test ID. **A build does not render it.** The service answers these addresses with data
  or with the file. See "The three service addresses" below.
- **Status line.** This is the users domain's pattern, reused. It is a `role="status"` container
  holding visible text, used for "harbour.png is ready…" and "…was inserted at the cursor".

No token beyond those the earlier domains list is used: `--layout-margin-{none,xsmall,small,medium,large}`,
`--layout-padding-{none,small,large}`, `--layout-border-width-small`,
`--layout-border-radius-medium`, `--surface-color-border-{default,medium}` and
`--typography-font-weights-bold`. `max-width: 100%` and `height: auto` on the picture preview are
not spacing, type or radius values. They stop an image overflowing its column (see gap 11 on
display size).

### How each control is laid out

The users domain's layout applies: a single column, with `--layout-margin-large` between regions,
`--layout-margin-medium` inside a section, and action rows that wrap.

- **Attachment control** (`file-attachment-control`). This is the last card section of the
  Opportunity tab in edit mode, headed "Attachments" (H3), where the opportunities domain placed
  it. The order inside it is: one sentence saying who can read an attachment and that removing one
  withdraws that access once the form is saved (R-8.20, R-8.31); the attachment list, or "No
  attachments have been added."; the stated rule, "Any type of file, up to 10 MB each."; and then
  "Add attachment". On a create form it is the same control with no stored rows. On the opportunity's
  own page (`public-view`) the same list sits at the end of the Description section, under an
  "Attachments" H3, as plain download links with no names to edit and no Remove.
- **Image picker** (`file-image-picker`). This is a `role="group"` labelled "Profile picture
  (optional)", or "Logo (optional)" on the organization forms. It sits where the users and
  organizations domains put their trigger. The order inside it is: the stored picture, or "No
  profile picture has been added."; a status line after a new file is chosen; any rejection; the
  stated rule; and then the trigger. The rule reads "A JPEG or PNG image, up to 10 MB. A picture
  wider or taller than 500 pixels is made smaller to fit, keeping its proportions. Anyone can see
  your profile picture, including people who are not signed in." (R-8.13, R-8.17, R-8.28, R-8.30).
- **Inserted image** (`file-embedded-image`). The rule sits directly under the formatting toolbar:
  "Insert image takes a JPEG or PNG image, up to 10 MB. An inserted image is stored as soon as you
  choose it and anyone can see it." The uploading line, the success line and any failure appear
  between the rule and the body field, so each is next to the thing it is about.

### Forms and validation

- **When a file is uploaded.** An attachment and a profile picture or logo are uploaded when the
  host form is saved. That is why a new attachment can still be renamed and removed (R-8.27 note),
  and why Cancel discards a chosen picture. An inserted image is uploaded as soon as it is chosen,
  because its reference has to go into the text (R-8.29).
- **Renaming an attachment** (R-8.27). The name field is optional. Its description says that
  leaving it empty keeps the original name and that the ending is added if it is left off. Under it,
  the resulting-name line ("Will be saved as: Statement of work.pdf") updates as the person types,
  so the restored ending is visible before saving. It is tied to the field by `aria-describedby`.
  The field has no `maxLength`, so a long name is marked with its reason rather than silently cut.
- **A name that is too long** (R-8.23). Saving is refused, and the error is the field's own
  `errorMessage`, against that attachment and not the form as a whole (R-8.27 note): "The file name
  must be between 1 and 255 characters long. With its ending, this one is 264." Focus moves to the
  field. What was typed is kept.
- **A file that is too large** (R-8.17). The size is checked as soon as the file is chosen. The row
  shows a `danger` alert, "site-survey.pdf is too large to attach", which gives the file's size and
  the limit and says to remove it. The host form cannot be saved while the row is there. If the
  service refuses an oversized upload anyway, the same alert appears on the same row. On "Insert
  image" the same refusal names the file and says nothing was added to the body.
- **A rejected picture** (R-8.21, R-8.30). The chooser offers only JPEG and PNG files, but a person
  can still pick "all files". A picture whose name does not end in .jpg, .jpeg or .png is refused,
  and so is one whose content is not a JPEG or PNG. The refusal is a `danger` alert inside the
  picture group, titled "<name> cannot be used as a profile picture", and it says the stored picture
  has been kept. Its wrapper takes focus. The rest of the profile form keeps what was typed.
- **An inserted image's reference** (R-8.29). This is an internal marker carrying the file's
  identifier, never a web address. The stories show it as `![Describe this image](@file/<identifier>)`.
  The marker's exact spelling is the build's choice (see gap 9). "Describe this image" is selected
  when it is inserted, so that typing replaces it, and the success line asks for a description.

### The three service addresses

`file-upload`, `file-description` and `file-download` answer with data or with the file, so there is
nothing on them for a person to see. What the stories give instead is the response reference: the
request a caller sends, and the parts of the answer the surface names, each on an element carrying
its test ID. **The adapter reads the test IDs as names for those parts of the HTTP answer**, not as
elements it will find in a browser:

| Test ID | What it names in the answer |
| --- | --- |
| `file-upload-request` | The upload request itself. All six upload actions bind here, and each differs only in what it sends: a file and a name with a read-access statement, with no declared size, with no file part, with a kind of access the service does not know, or with read-access information that is not well-formed. |
| `file-upload-stored-id` | The identifier in the stored record that a successful upload returns (R-8.2). |
| `file-upload-refused-size`, `file-upload-size-limit` | The refusal of an oversized upload as the requester's error, and the limit named in its message (R-8.17). |
| `file-upload-refused-name` | The bad-request refusal of a name over 255 characters, whose message gives the permitted length (R-8.23). |
| `file-upload-refused-read-access` | The bad-request refusal of read-access information that is missing, unrecognised or not well-formed (R-8.18, R-8.24). |
| `file-upload-refused-signed-out` | The not-permitted refusal of an upload from a visitor who is not signed in (R-8.1). |
| `file-upload-service-fault` | A fault of the service. It is the one answer that R-8.17, R-8.18 and R-8.24 say a requester's mistake must never get. |
| `file-description-id`, `-name`, `-stored-date`, `-content-id` | The four parts of a file's description (R-8.11). `-content-id` is the fingerprint two identical uploads share (R-8.5). |
| `file-download-body`, `-content-type`, `-disposition`, `-filename` | The bytes, the content type worked out from the name, the instruction to save rather than display, and the name for saving (R-8.10). |
| `file-download-response`, `file-download-request` | A successful answer at all, with the request that got it. `readable_when_signed_out_if_public` binds to the response, because the default story's request is made signed out. |
| `file-refused` | Not authorized. It is shared by both addresses and by both of their refusals, because R-8.12 gives a missing file and a forbidden one the same answer for anyone but an administrator. |
| `file-not-found` | The administrator's "not found" for an identifier no file carries (R-8.12). |

The states are the distinct answers: for the upload, `default` (stored), `signed-out`, `too-large`,
`name-too-long`, `invalid-read-access`, `no-file` and `fault`; for the description and the download,
`default`, `refused` and `not-found`. Every refusal says what was stored, which is always nothing,
and that the working copy is gone (R-8.18). A refusal of the no-file kind is not written to the
error log (R-8.18).

### Loading, empty, refused, not found

- **Empty.** An opportunity with no attachments says "No attachments have been added." A profile
  with no picture says "No profile picture has been added." Both keep the stated rule and the
  trigger. An editor with no images is the ordinary editor.
- **Loading.** Only the inserted image has a loading state of its own (`uploading`), which
  `uploading_indicator` names. While it lasts, "Insert image" is disabled so a second upload cannot
  race the first, and the rest of the editor stays usable. The attachment and picture uploads
  happen inside the host form's save, so the host form's saving behaviour covers them.
- **Refused.** Refusals of an upload appear on the thing that was refused: the attachment's row,
  the picture group, or above the body field. They never appear as a page-level alert. A download
  link someone may not follow is never shown to them, because each list is shown only to people who
  can read the thing it hangs on (R-8.20). What a browser shows if a refused address is opened
  directly is gap 4.
- **Not found.** None of the controls has one. The host page's not-found state governs.

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). The users domain's list applies here too. This domain adds:

- **Rules before choice.** Each file trigger has `aria-describedby` pointing at its stated rule, so
  a screen reader hears the types and the limit before the chooser opens.
- **Named removals and downloads.** "Remove" carries an `aria-label` that begins with its visible
  word and adds the file's name, so the accessible name contains the visible label (WCAG 2.5.3).
  Download links name the file in their visible text.
- **Images.** A profile picture's `alt` says what it is. An inserted image carries placeholder
  alternative text, which is selected so that the author replaces it. The content domain's renderer
  shows an image written without alternative text with `alt=""` (its accessibility obligations).
- **Announcements.** Uploading, "ready" and "inserted" are `role="status"`. Every refusal is
  `role="alert"`. After a refused save, focus goes to the refused field or alert.
- **Words, not colour.** Every refusal names the file and the reason in text. A read-only name is
  exposed as read-only, and its description says why.
- **Reflow.** Attachment rows wrap. The preview never exceeds the column, so a 2000-pixel image
  causes no horizontal scroll at 320 pixels.
- **Checks still required.** Keyboard use of each chooser, a screen-reader pass of the
  resulting-name line as someone types, and the focus move after a refused save have not been done
  by hand. They are required before the build is accepted.

### Test IDs

The users domain's rules apply. One ID is used per kind of element. An action and an observation on
the same element share its ID. The same control keeps its ID on every page it appears on.

- **Reused from other domains, as they asked.** `attachment-add-button` (the opportunities
  domain's), `change-avatar` (the users domain's), `content-body-image-button` and
  `content-body-field` (the content domain's). The proposals domain's `add_attachment` on the Code
  With Us proposal forms should also be `attachment-add-button`, because it is this same control.
- **One element for several names.** `attachment-download-link` is both `download_attachment` and
  `attachment_address`: the address is its `href`. `attachment-remove-button` is
  `remove_new_attachment`, `remove_existing_attachment` and `remove_control_hidden_when_not_removable`.
  A test tells a new row from a stored one by its row (`attachment-new-row`,
  `attachment-existing-row`), and asserts the button is absent in `public-view`.
  `attachment-name-field` is both `rename_new_attachment` and `file_name_error`: the error is the
  field's own `errorMessage`, and the field is marked invalid. `profile-image` is `current_image`,
  `image_address` (its `src`), `image_readable_when_signed_out` (its `src`, fetched signed out) and
  `stored_image_width` and `stored_image_height` (its natural width and height, which are the stored
  image's, since it is shown from the stored file). `content-body-field` is both
  `image_inserted_into_text` (its value holds the marker) and `upload_failure_leaves_text_unchanged`
  (its value is as it was). `content-body-image` is both `image_rendered_in_published_text` and the
  editor's `image_address` (its `src`, once the renderer has resolved the marker).
- **Shared between two controls.** `image-file-rule` is `only_jpeg_and_png_offered` on both the
  picker and the inserted image. It is the stated rule, and the trigger's chooser carries the matching
  `acceptedFileTypes`.
- **For the content domain's renderer.** Every image it renders must carry
  `data-testid="content-body-image"`, as every link it renders carries `content-body-link`.

**Extra IDs, not named in the surface, that the stories carry for the adapter:**
`file-upload-stored` (the stored-record answer), `file-upload-refused-no-file`,
`file-description-answer` and `embedded-image-error` (the failure alert when an inserted image is
refused). `attachment-list` is bound to `attachment_list_on_public_view`, and the edit-mode list
carries the same ID.

### Per-screen notes

**file-upload** — `default` (stored), `signed-out` (R-8.1), `too-large` (R-8.17), `name-too-long`
(R-8.23), `invalid-read-access` (R-8.24, and R-8.18 for data that is not well-formed), `no-file`
(R-8.18), `fault`. These are response references, not screens.

**file-description** — `default` (R-8.5, R-8.11), `refused` (R-8.7, R-8.12), `not-found` (an
administrator, R-8.12). These are response references.

**file-download** — `default` (a public file read signed out, R-8.7, R-8.10), `refused`, `not-found`.
These are response references.

**file-attachment-control** — `default` (two stored attachments on the Opportunity tab in edit
mode), `empty`, `new-attachment` (renamed, with the ending shown restored, R-8.27), `invalid` (a
name over 255 characters, R-8.23), `too-large` (R-8.17), `public-view` (the opportunity's own page,
no Remove). The stories use a Code With Us opportunity. The Sprint With Us and Team With Us forms,
the proposal form and the history note use the same control, and since R-8.19 and R-8.20 there is
no program-specific difference in what it shows.

**file-image-picker** — `default` (a stored picture, shown at its stored size), `empty`, `chosen`
(a preview from the person's own device, not yet stored), `rejected` (R-8.30, R-8.21). The
organization logo uses the same design with "Logo" in place of "Profile picture", and the
organizations domain's trigger ID, `organization-logo-button`.

**file-embedded-image** — `default`, `uploading`, `inserted` (the marker in the text, R-8.29),
`failed` (too large, and the body unchanged), `published` (the reader's view of the same page, where
the marker has become the image). `published` is the content domain's public page, shown here
because two of this control's observations are only visible there.

### Gaps

These are work for the spec. None was filled with invented behaviour. Where a story had to show
words that no criterion gives, the story or this list says so.

1. **An upload that declares no size.** The surface names `upload_file_without_declaring_its_size`.
   R-8.3 said such an upload is refused, but R-8.17 replaces R-8.3 and says nothing about it. The
   action is bound, but there is no state for its answer, because no accepted criterion says what
   it should be.
2. **An upload with no usable name.** R-8.23 (accepted, v2) still says this "fails as the service
   fault described by R-8.4". R-8.4 has been superseded by R-8.18, which calls that kind of failure
   wrong but lists only a missing file part and malformed read-access information. Whether a
   missing name should be a bad request needs restating. No state was given to it.
3. **Not authorized or not found** (R-8.12, conflicting, left open for a ruling). The design follows
   the accepted wording: anyone but an administrator gets "not authorized" for a missing file, and
   an administrator gets "not found". If the ruling goes the other way, the `refused` and
   `not-found` states stay, and only who sees which changes.
4. **What a person sees when a refused address is opened in a browser.** A download link is only
   shown to people who may follow it. But a retained or shared link opened later, for example after
   an attachment is removed (R-8.31), gets the service's bare refusal. No criterion says whether a
   browser should be shown a page instead, so none was designed.
5. **When an existing attachment cannot be removed.** The surface observes
   `remove_control_hidden_when_not_removable`, but no criterion in any domain says when a stored
   attachment on an editable form is not removable. The design hides Remove only where nothing can
   be edited (`public-view`). If some opportunity statuses should lock attachments, the
   opportunities domain needs a criterion and this control needs a state.
6. **Status codes and wording.** The criteria say "not permitted", "bad request", "not authorized",
   "not found" and "the requester's error", but give no status numbers. R-8.17's oversized-upload
   refusal does not say which requester's-error status it is. Every message is the design's own,
   except R-8.23's "between 1 and 255 characters long" and R-8.24's "the information provided was
   invalid".
7. **Where the size is checked.** The design checks an attachment's size, and a picture's name
   ending, as soon as the file is chosen, and also shows the service's own refusal in the same place.
   No criterion requires the early check. It adds no rule, only an earlier warning of the service's.
8. **Other domains' stories disagree with this domain's rules.** The opportunities domain's editing
   stories say "The accepted file types and size limit are shown when you choose a file", which
   contradicts R-8.17 (stated before choosing). The users domain's profile stories use
   `acceptedFileTypes={["image/*"]}`, which offers types R-8.30 refuses. This domain cannot edit
   those stories. They should adopt this control's stated rule and `["image/jpeg", "image/png"]`.
9. **The marker's form, and the image's alternative text** (R-8.29). The criterion fixes that the
   stored text carries an internal marker and not an address, but not how it is spelled. The stories
   use `@file/<identifier>` as an illustration. No criterion says an inserted image gets alternative
   text. The design inserts a placeholder for the author to replace, which the content domain's gap
   11 also asks the formatting guide to explain.
10. **An inserted image stored but never used.** An image is stored the moment it is chosen and is
    readable by anyone (R-8.29). If the author then deletes the marker or cancels the edit, the
    image stays stored and public, and nothing refers to it. R-8.31 covers detached attachments, but
    not images placed in text. The editor's sentence says the image is stored at once. What should
    happen to it afterwards is unanswered.
11. **Display size of a picture.** No token gives an avatar or thumbnail size, so a picture is shown
    at its stored size, which is at most 500 pixels (R-8.13), and never wider than its column. A
    smaller display size would need a token, or a decision to accept a fixed value.
12. **Other ways a picture can fail.** R-8.21 says a readable image that cannot be resized is kept
    at its own size. That is not a failure, and the person is told nothing. Whether they should be
    told is not stated. What happens to an image over both 500-pixel limits at once is left open by
    R-8.13's note. The design states only the outcome the criterion fixes: made smaller to fit,
    keeping its proportions.
13. **Content the spec does not carry.** File names, sizes, identifiers, the fingerprint, dates and
    the page text in the stories are illustrative. The identifiers are synthetic.

---

## Domain: proposals

A proposal is a vendor's bid against one opportunity. This domain's screens fall into five kinds:

- **Create** (`proposal-*-create`). The vendor's form for a new proposal.
- **Manage** (`proposal-*-edit`). The vendor's own proposal: read it, edit it, submit, withdraw or
  delete it, read its history, and once there is a decision, its scores.
- **Evaluate** (`proposal-*-view`). What public sector staff and administrators see after the
  opportunity closes: the proposal, its stage tabs, score entry, award and disqualification.
- **Export** (`proposal-*-export-one`, `proposal-*-export-all`). A printable copy of one proposal,
  and, for staff only, every proposal of an opportunity in one document.
- **Vendor dashboard** (`proposal-vendor-dashboard`) and the `/proposals` address
  (`proposal-list-stub`).

Every state named in `design/screens.yaml` has a story at
`design/catalogue/<page>.<state>.stories.tsx`. The story is what a build copies. Where a story
shows a dialog or a refusal, the page behind it is trimmed to its header and action bar. A
visible `size="small" color="secondary"` line in the story says which story holds the rest. That
line is a catalogue note, and a build does not render it.

The three programs share one design, as they do in the opportunities domain. The Code With Us,
Sprint With Us and Team With Us versions of a page have the same layout, components and test IDs.
They differ only in the parts their criteria require:

- **Code With Us.** A proponent that is an individual or an organization (R-2.14), proposal text
  and comments (R-2.13), and one score (R-2.26).
- **Sprint With Us.** An organization, a team for each phase with at most one scrum master,
  capability coverage, phase and total cost (R-2.19), team questions (R-2.21) and references. The
  stages are team questions, code challenge and team scenario.
- **Team With Us.** An organization, team members named against resources with hourly rates
  (R-2.20), an estimated cost against the budget (R-2.10) and resource questions (R-2.21). The
  stages are resource questions and challenge.

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1, unless the entry says otherwise. No
component is new to the catalogue. Every component and prop used here is one the earlier domains'
stories already compile with.

| Component | Used for |
| --- | --- |
| `Heading` | One H1 per screen, H2 for each section or tab, and H3 inside a tab. Levels 1 to 3 only. Deeper structure uses table captions and ordered lists instead of a fourth level. On a manage page the H1 is the opportunity's title. On an evaluate page it is the proponent's name, as the reader is allowed to see it. |
| `Text` | Body copy. `size="small" color="secondary"` for the page-kind line above the H1, stated limits, word counts and captions. `color="danger"` only for group errors (scrum masters, capabilities, cost, service area, duplicate or pending member), and each of those is also in the error summary. |
| `Button` | Every command. `primary` is used once per view for the next step: Submit proposal, Save changes and submit, Enter score, Award, or the stage's score button. `secondary` is used for Edit, Save draft, Save changes, Add team member, Add a reference, Screen in and Screen out. `secondary` with `danger` is used for Withdraw, Delete and Disqualify. `tertiary` is used for Cancel, and `tertiary size="small"` to remove one repeated item. |
| `ButtonGroup` | The action bar (`ariaLabel="Proposal actions"`), each form's submit row, each stage tab's actions, and dialog buttons. |
| `Link` | Navigation: the tabs, the opportunity, the printable copy, links in error summaries, the dashboard's rows, the terms documents, and the attachment download links. |
| `TextField` | The Code With Us individual's name, email, phone and address, reference details, and stored attachment names (`isReadOnly`, as in the files domain). |
| `TextArea` | Proposal text and comments (`maxLength={10000}`), question responses, and the disqualification reason (`maxLength={5000}`). |
| `NumberField` | Phase cost (`formatOptions` currency CAD, no decimals), hourly rate (currency, two decimals), and each score. There is no `minValue` or `maxValue`, as in the opportunities domain. The limit is stated and checked on submit, so the refusals the criteria describe can be shown and nothing is silently changed. |
| `Select` | The organization, and the team member to add to a phase or resource. |
| `RadioGroup` + `Radio` | Code With Us "Who is submitting this proposal?" (An individual / An organization). |
| `Checkbox` | Scrum master (one per team member per phase), the two terms acceptances, and "Name proponents anonymously" on export-all. |
| `Form` | Always `validationBehavior="aria"`. |
| `InlineAlert` | Error summaries (`danger`), service refusals (`danger`, `role="alert"`), the wrong-stage refusal (`danger`) and the unqualified-organization notice (`warning`). Each is wrapped in a `div` that carries the test ID, because `InlineAlert` does not pass `data-*` through. |
| `Modal` + `Dialog` | The terms dialog and the score dialog. These are small forms, not yes/no decisions. |
| `Modal` + `AlertDialog` | Delete (`destructive`), Withdraw (`warning`), Award (`confirmation`) and Disqualify (`destructive`, with its reason field inside). |
| `ProgressCircle` | Indeterminate loading, inside `role="status"` next to visible text. |
| `FileTrigger` (from `react-aria-components`) | Behind "Add attachment". The attachment rows are the files domain's `file-attachment-control`, placed in the proposal form. |

### This project's own components (not design-system components)

These are all reused from earlier domains, unchanged, and none is new here. None of them is a
design-system component, and none may be presented as one.

- **Status badge.** The users domain's `<span>` with a token border and circular radius. It always
  carries the status in words ("Draft", "Under review: team questions", "Not awarded"). Team
  member membership ("Active", "Membership pending") uses the same badge.
- **Key facts list.** The opportunities domain's `<dl>` of `dt`/`dd` pairs that flex-wrap. It is
  used for the manage and evaluate headers, the Scores section, the Scoresheet and the export
  headers. The design system has no description-list component.
- **Card section.** A `<section aria-labelledby>` with the token border and radius, used for each
  part of a proposal form, the opportunity summary, and each proposal in export-all (an
  `<article>` there).
- **Repeated-item group.** A `<fieldset>` and `<legend>` for each phase team, resource, question
  and reference. A legend is what names the group to assistive technology, and the design system
  has none.
- **Data table.** The users domain's native `<table>` with a caption and `scope="col"` headers, in
  a focusable `role="region"` that scrolls horizontally at narrow widths. It is used for team
  tables, question responses, history, and the dashboard.
- **Section navigation (tabs).** The users domain's `<nav>` of `Link`s with `aria-current="page"`.
  On manage and evaluate pages each tab is an address (`?tab=…`). On the dashboard the two links
  are in-page links to the two sections (see gap 9).
- **Attachment list.** The files domain's control, placed in the proposal forms.

Layout uses only the tokens earlier domains list: `--layout-margin-{none,xsmall,small,medium,large}`,
`--layout-padding-{none,small,large}`, `--layout-border-width-small`,
`--layout-border-radius-{medium,circular}`, `--surface-color-border-{default,medium}`,
`--typography-font-weights-bold` and `--typography-bold-body`. No colour, size or radius value is
written anywhere in the catalogue.

### How a screen is laid out

The users domain's single column, with `--layout-margin-large` between regions and action rows
that wrap.

- **Create.** The H1 ("Create a … proposal"), then the opportunity summary card, which gives the
  opportunity, its reward or budget, and its deadline (`proposal-opportunity-summary`). Then one
  sentence on drafts, any error summary or refusal, the form's card sections in the order listed
  below, one sentence about the terms, and the submit row: Cancel, Save draft, Submit proposal.
  - Code With Us: Proponent, Proposal, Attachments.
  - Sprint With Us: Organization, Team (one fieldset per phase), Capabilities, Cost, Team
    questions, References, Attachments.
  - Team With Us: Organization, Team (one fieldset per resource), Cost, Resource questions,
    Attachments.
- **Manage.** "Manage a … proposal" as small text, then the H1 (the opportunity's title). Then
  the key facts: status, submitted time (not on a draft), proposal ID, opportunity ID, deadline.
  Then links to the opportunity and to the printable copy, the action bar (`proposal-actions`),
  the tabs, any page alert, and the current tab. While editing, the action bar gives way to the
  form's save row, and the Proposal tab becomes the create page's form, filled in.
- **Evaluate.** "… proposal" as small text, then the H1 (the proponent's name as this reader may
  see it: "Proponent 1" until the stage that reveals names, R-2.37). Then the key facts, a Scores
  section with every stage score, the printable-copy link, the action bar, the tabs, any
  refusal, and the current tab. A stage score not yet entered reads "Not yet scored". A
  calculated score not yet calculated (price, total) reads "Not yet calculated".
- **Export.** "Back to the proposal" and Print, then one `<article>` that is the whole document
  (`proposal-export-document`). There is nothing to expand and no tabs, so it reads and prints as
  one continuous page. Attachments are listed by name, not linked, because a printed link is
  useless.
- **Dashboard.** H1 "Dashboard", the section links, then "My proposals" and "My organizations'
  proposals", each with its own H2 and table or empty message.

### Forms and validation

- **Drafts are never checked, except attachments** (R-2.12). Save draft saves whatever is there.
  The one sentence at the top of every form says so: "A draft can be saved with any field blank.
  Every required field is needed to submit." An attachment refused on a draft save is shown on
  its row, as the files domain designs it.
- **Required marking.** `isRequired` is set on each field a criterion requires for submission.
  Optional fields say "(optional)" in the label.
- **Limits are stated before input.** Proposal text is "Between 1 and 10,000 characters." Comments
  are "Up to 10,000 characters." Each question response gives "Up to N words." with a live
  `role="status"` word count under it. A phase cost gives "Up to the phase's maximum budget of
  $…". An hourly rate gives "At least $1." A score gives "Between 0 and 100, with up to two
  decimal places." A reason gives "Between 1 and 5,000 characters."
- **When validation runs.** On Submit proposal, Save changes, Save changes and submit, Enter
  score and Disqualify proposal. Never on each keystroke. Live totals (cost, word count) update as
  the person types but do not mark anything invalid.
- **An invalid field** gets `isInvalid` and an `errorMessage` under it, keeps what was typed, and
  is listed in the error summary. The summary is a `danger` `InlineAlert` titled "This proposal
  has N problems" (or "Your changes have N problems" when editing), in a `tabIndex={-1}` wrapper
  that takes focus. Each item is a `Link` to the field or group, with `data-testid="field-error"`.
- **Group errors** belong to a group, not a field. Each is a `Text color="danger"` in a `div` with
  an `id`, placed at the end of its group and linked from the summary:
  - two scrum masters in a phase (R-2.19)
  - a capability no one covers (R-2.19, `proposal-capability-gap-error`)
  - a total over budget (R-2.19, `proposal-budget-exceeded-error`; R-2.10 on Team With Us)
  - a service area the organization lacks (R-2.17, `proposal-service-area-error`)
  - a person who is not an active member ("User is not an active member of the organization.",
    R-2.18)
  - a person named twice ("Please select unique team members.", R-2.18)
- **The service's own words are used verbatim** where a criterion quotes them: "You already have a
  proposal for this opportunity." (R-2.2), "This opportunity is no longer accepting proposals."
  (R-2.15), "Please select a different organization." (R-2.11), "An organization must be specified
  before submitting." (R-2.16), "The selected organization does not satisfy this opportunity's
  service areas." (R-2.17), the two R-2.18 messages, "Organization cannot be changed once the
  proposal has been submitted" (R-2.22), and "The opportunity is not in the correct stage of
  evaluation to perform that action." (R-2.28). Where no wording is given, the design writes an
  instruction ("Enter a postal code").
- **Only the phases the opportunity has.** A Sprint With Us form renders one team fieldset per
  phase the opportunity requires, and no way to add or remove a phase. So "a team for every
  required phase and no other" (R-2.19) cannot be broken from the form. The service's refusal is
  still shown at the Team section if it happens.
- **A pending team member is shown, not hidden** (R-2.18 note). They keep their row with a
  "Membership pending" badge (`proposal-pending-team-member`), so the vendor can see why
  submission is refused.
- **The organization is a choice among the vendor's own** (R-2.14, R-2.24). The `Select` lists the
  organizations the vendor owns or administers. Its description says it must be qualified
  (R-2.16, R-2.17). On a submitted proposal it says it cannot be changed until the proposal is
  withdrawn (R-2.22).
- **The terms are asked for on submit** (R-2.3). Submit proposal, and Save changes and submit,
  open the terms dialog (`proposal-terms-dialog`). It links both documents and holds two
  checkboxes: the program's terms and the Digital Marketplace terms. Its Submit proposal button
  (`proposal-submit-confirm`) is disabled, and described by "Tick both boxes to submit.", until
  both are ticked. Submitting records the acceptance. The service refuses a submission that
  reaches it without them.
- **Refusals the screen could not prevent.** The deadline having passed, a duplicate, an
  organization already named, lost qualification, a wrong stage: each is shown as a `danger`
  alert (`role="alert"`) or a field error, in the place the matching story shows. Focus moves to
  the alert.
- **An invalid edit looks like an invalid create.** The manage page's `editing` state shows the
  same form. Its invalid, over-budget and refused variants are exactly the create page's
  `invalid`, `over-budget` and `refused` stories, so they have no stories of their own.

### Dialogs

Each dialog is a `Modal` whose title is a question or an action, whose body says what happens and
who is told, and whose buttons name the action. Focus moves in, stays in, returns to the opening
button when the dialog closes, and Escape dismisses it.

| Action | Dialog | Confirm button (test ID) | Other |
| --- | --- | --- | --- |
| Submit proposal / Save changes and submit | `Dialog` (`proposal-terms-dialog`) | "Submit proposal" (`proposal-submit-confirm`), disabled until both terms are ticked | Cancel (`proposal-dialog-cancel`) |
| Delete | `AlertDialog destructive` (`proposal-delete-dialog`) | "Delete proposal" (`proposal-delete-confirm`) | Cancel |
| Withdraw | `AlertDialog warning` (`proposal-withdraw-dialog`) | "Withdraw proposal" (`proposal-withdraw-confirm`) | Keep proposal. The body gives the deadline until which it can go back in, and says the vendor and administrators are told (R-2.23, R-2.36). |
| Enter score (every stage) | `Dialog` (`proposal-score-dialog`) | "Enter score" (`proposal-score-confirm`); field `proposal-score-field` | Cancel |
| Award | `AlertDialog confirmation` (`proposal-award-dialog`) | "Award proposal" (`proposal-award-confirm`) | Cancel. The body says the others still in contention become not awarded, and who is sent which notice (R-2.33, R-2.36). |
| Disqualify | `AlertDialog destructive` (`proposal-disqualify-dialog`) | "Disqualify proposal" (`proposal-disqualify-confirm`); reason `proposal-disqualify-reason-field` | Cancel |

### Who is offered what

**Manage page (the vendor who wrote it, or who owns or administers its organization, R-2.24):**

| Proposal state | Action bar | Tabs |
| --- | --- | --- |
| Draft | Edit, Submit proposal, Delete (R-2.4) | Proposal, History |
| Submitted, under review, evaluated | Edit, Withdraw (R-2.23) | Proposal, History |
| Withdrawn | Edit, Submit proposal (R-2.23) | Proposal, History |
| Awarded, not awarded | Withdraw | Proposal, History; Sprint With Us and Team With Us add Scoresheet (R-2.32) |

Scores and rank appear only once the proposal is awarded or not awarded (R-2.32). Code With Us
shows them in a "Result" block at the top of the Proposal tab (`proposal-score`, `proposal-rank`).
Sprint With Us and Team With Us show them on the Scoresheet tab, with the anonymous name
evaluators saw (`proposal-anonymous-name`) and the total (`proposal-total-score`).

**Evaluate page (public sector staff and administrators, only after closing, R-2.25):**

| Stage | Action bar | Stage tab actions |
| --- | --- | --- |
| Code With Us, under review | Enter score, Disqualify | — |
| Code With Us, evaluated | Award, Disqualify | — |
| Sprint With Us, any review stage | Disqualify (R-2.34) | Code challenge tab: Enter code challenge score, Screen in to team scenario, Screen out from team scenario. Team scenario tab: Enter team scenario score. |
| Team With Us, any review stage | Disqualify | Resource questions tab: Enter resource question scores, Screen in to challenge, Screen out from challenge. Challenge tab: Enter challenge score. |
| Fully evaluated, or previously not awarded | Award, Disqualify (R-2.33 note) | as above |
| Awarded, disqualified, withdrawn | nothing | as above |

**The stage tabs' buttons are always present from closing onward**, and each tab says in one
sentence which stage the opportunity is at. A person who presses one at the wrong stage is told
"The opportunity is not in the correct stage of evaluation to perform that action." in an alert
above the tab (`proposal-wrong-stage-error`, R-2.28). The design keeps the button rather than
hiding it, for two reasons. R-2.28 describes the refusal as behaviour to keep. And a hidden button
would leave the criterion's "when" with nothing to act on. Gap 4 records this as a choice for
review.

### Loading, empty, refused, not found

- **Loading.** The H1 renders at once. Below it, a `role="status"` row holds a `ProgressCircle`
  and matching text.
- **Not found and refused.** These all show the users domain's shared missing page (H1 "Page not
  found", `not-found-page`), which never says "not allowed":
  - a create page for anyone but a vendor who has accepted the terms (R-2.1)
  - another vendor's proposal, or a deleted draft (R-2.4, R-2.24)
  - an evaluate page before closing, or for a draft (R-2.25)
  - export-all for a vendor (R-2.38)
  - any export the reader is not entitled to (R-2.37)
- **Empty.** Only the dashboard has designed empty states, one message per list
  (`dashboard-empty-my-proposals`, `dashboard-empty-org-proposals`). The wording is the design's
  own (gap 8). A vendor who owns no organization gets no organizations' heading at all
  (`no-organization`), because R-2.24 gives that heading only to owners.
- **Starting a second proposal** (R-2.2). The opportunity's "Start a proposal" takes a vendor who
  already holds one to that proposal's manage page. So the `refused` alert on create appears only
  if a second create reaches the service anyway.

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). The users and opportunities domains' lists apply here too. This
domain adds the following.

- **Status is words.** Every status, membership and capability-coverage value is written out
  ("Membership pending", "Security engineering: not covered"). Scores are numbers with their
  unit. Nothing is conveyed by colour alone.
- **Controls with the same visible text are told apart.** "Add team member", "Remove" and "Scrum
  master" repeat once per phase, resource or person. Each has an `aria-label` that begins with its
  visible text and names its target ("Add team member to the prototype phase", "Scrum master: Test
  Designer, implementation phase"), meeting WCAG 2.5.3.
- **Long forms are navigable.** Each form part is a labelled section with a heading. Each
  repeated item is a fieldset with a legend. The error summary links to every problem.
- **Announcements.** Word counts and live cost totals use `role="status"`. Refusals and error
  summaries use `role="alert"`, and focus moves to them. A disabled Submit proposal in the terms
  dialog is described by the sentence that says what enables it.
- **Anonymity is a real withholding, not a visual one.** Until the stage that reveals names, the
  organization's name is absent from the markup of the evaluate page and the staff export. It is
  not hidden with styling.
- **Region names are unique.** The Code With Us proposal body's section is "Proposal text", so
  that it does not share a landmark name with the Proposal tab.
- **Checks still required.** Keyboard use of the multi-part forms, screen-reader checks of the
  terms and score dialogs, and 400% zoom of the team tables have not been done. They are required
  before the build is accepted.

### Test IDs

The rules are the users domain's: one ID per kind of element; an action and an observation on the
same element share its ID; the same element keeps its ID on every page. So the three programs'
pages share IDs throughout.

- **Reused from other domains:** `field-error`, `not-found-page` (users); `opportunity-identifier`
  (opportunities); `attachment-add-button`, `attachment-remove-button` and
  `attachment-download-link` (files).
- **The manage and evaluate headers:** `proposal-status`, `proposal-identifier`,
  `proposal-submitted-at` and `proposal-actions` (the wrapper of the action bar, bound to
  `available_actions`).
- **Tabs:** `proposal-tab-proposal`, `proposal-tab-history`, `proposal-tab-scoresheet`,
  `proposal-tab-team-questions`, `proposal-tab-code-challenge`, `proposal-tab-team-scenario`,
  `proposal-tab-resource-questions` and `proposal-tab-challenge`.
- **Scores:** `proposal-score`, `proposal-rank`, `proposal-questions-score`,
  `proposal-challenge-score`, `proposal-scenario-score`, `proposal-price-score` and
  `proposal-total-score`.

The following bindings are not obvious from their names:

- `submit_proposal` is bound to `proposal-submit`, the button that opens the terms dialog.
  Completing a submission takes two more steps: ticking `proposal-accept-program-terms` and
  `proposal-accept-app-terms`, then pressing `proposal-submit-confirm`.
  `submit_disabled_until_terms_accepted` is bound to that confirm button, whose disabled state is
  the observation. The same two-step pattern applies to `withdraw_proposal`, `delete_proposal`,
  `award_proposal`, `disqualify_proposal` and every score action. Each opens a dialog whose confirm
  button is listed under "Dialogs" (gap 10).
- `proponent` (cwu-view) and `anonymous_proponent_name` (swu-export-one) are both bound to
  `proposal-proponent-name`. It is the one element that names the proponent as this reader may
  see it: an organization, an individual, or "Proponent 1". A test compares its text between the
  staff copy and the vendor's copy.
- `anonymous_proponent_name` on the manage pages is a different element,
  `proposal-anonymous-name`, on the Scoresheet. It tells the vendor which anonymous name
  evaluators saw.
- `choose_organization` is bound to the organization `Select` (`proposal-organization-field`), on
  both create pages and on the Code With Us create page's organization choice.
- `add_phase_team_member` and `add_team_member_for_resource` are both bound to
  `proposal-add-team-member`. There is one per phase or resource, told apart by accessible name.
  `set_scrum_master` is bound to `proposal-scrum-master`, one per person per phase.
  `answer_team_question` and `answer_resource_question` are both bound to
  `proposal-question-response-field`, one per question.
- `screen_in_to_team_scenario` and `screen_in_to_challenge` are both bound to
  `proposal-screen-in`, and the two screen-outs to `proposal-screen-out`. Each program has only
  one.
- `exported_proposal` is bound to `proposal-export-document` on all six export pages. On
  export-one it is the article. On export-all it is the container of every proposal, each of
  which is a `proposal-export-item`.
- `show_my_proposals` and `show_org_proposals` are bound to the two in-page section links. The
  dashboard's `proposal_status` is bound to the row's status badge, `proposal-status`, which is the
  same element kind as the manage page's.
- `placeholder_text` is bound to `proposal-list-placeholder` (gap 1).

**Extra IDs, not named in the surface, that the stories carry for the adapter:**

- Dialogs and their buttons: `proposal-dialog-cancel`, `proposal-*-dialog`, `proposal-*-confirm`,
  `proposal-score-field`, `proposal-disqualify-reason-field`.
- Form fields: `proposal-legal-name-field`, `proposal-email-field`, `proposal-text-field`,
  `proposal-comments-field`, and the like.
- Controls: `proposal-cancel-edit`, `proposal-export-link` on manage pages,
  `proposal-export-anonymous-toggle`, `proposal-export-item`.
- Messages: `proposal-refused-message`, `proposal-submit-refused-message`.
- Tables and rows: `proposal-history-table`, `dashboard-proposal-row`, `dashboard-proposal-link`.

**Other domains should reuse** `proposal-status` wherever a proposal's status is shown, for
example on the opportunities domain's Proposals tab. They should also reuse
`proposal-proponent-name` wherever a proponent is named.

### Per-screen notes

**proposal-cwu-create**: `default` (an individual, blank), `organization` (the organization
choice), `invalid` (R-2.13, R-2.14), `refused` (R-2.2; R-2.15 and R-2.11 appear in the same
places), `terms` (R-2.3), `not-found` (R-2.1). Only this program's create page has Cancel in the
surface. The other two carry the same button with the same ID, for consistency.

**proposal-swu-create**: `default`, `invalid` (six problems across R-2.18, R-2.19 and R-2.21,
including the pending member), `unqualified-organization` (R-2.16), `refused` (organization
already named, R-2.11), `terms`, `not-found`.

**proposal-twu-create**: `default`, `invalid` (service area, rate below $1, duplicate member,
empty response: R-2.17, R-2.18, R-2.20, R-2.21), `over-budget` (R-2.10), `unqualified-organization`
(R-2.17), `refused`, `terms`, `not-found`. Over budget is its own state because it is a computed
total, not a field, and its illustrative rates contradict the invalid story's rate below $1.

**proposal-cwu-edit / -swu-edit / -twu-edit**: `default` (submitted), `draft`, `editing`,
`terms`, `delete-confirm`, `withdraw-confirm`, `submit-refused`, `history-tab` (R-2.9, R-2.35),
`not-found`, `loading`. Code With Us adds `awarded` (score and rank, R-2.32). Sprint With Us and
Team With Us add `organization-locked` (R-2.22) and `scoresheet-tab`. A withdrawn proposal before
the deadline is the `submit-refused` page without its alert, so it has no state of its own. The
surface gives Code With Us `add_attachment` and `remove_attachment` on this page. The other two
programs' editing stories place the same control but the surface does not name it (gap 12).

**proposal-cwu-view**: `default`, `score-dialog`, `score-invalid`, `evaluated`, `award-confirm`,
`disqualify-dialog`, `disqualify-invalid`, `history-tab` (the score recorded as "87%", R-2.26),
`not-found`, `loading`.

**proposal-swu-view**: `default` (team questions, anonymous), `team-questions-tab` (consensus
scores, R-2.29), `code-challenge-tab` (names revealed, R-2.37), `score-dialog`,
`team-scenario-tab`, `wrong-stage` (R-2.28), `evaluated` (price, total and rank, R-2.30, R-2.31),
`award-confirm`, `disqualify-dialog`, `history-tab`, `not-found`, `loading`. The score dialog and
the disqualify reason are refused at the field exactly as in the Code With Us invalid stories.

**proposal-twu-view**: `default`, `resource-questions-tab`, `challenge-tab`, `score-dialog`,
`wrong-stage`, `evaluated`, `award-confirm`, `disqualify-dialog`, `history-tab`, `not-found`,
`loading`.

**proposal-*-export-one**: `default`, `not-found`, `loading`. Sprint With Us and Team With Us add
`anonymous`, the staff copy before the stage that reveals names (R-2.37).

**proposal-*-export-all**: `default`, `anonymous` (R-2.38), `not-found` (a vendor), `loading`.
Only submitted proposals are in the document (R-2.25).

**proposal-vendor-dashboard**: `default` (both lists), `no-organization`, `empty`, `loading`. Rows
lead to the manage page. The same `/dashboard` route is the opportunities domain's staff
dashboard and the evaluation domain's panel tab. Which one renders is decided by who is signed
in.

**proposal-list-stub**: `default` (see gap 1).

### Gaps

These are work for the spec. None of them was filled with invented behaviour. Where the design had
to show something, the story marks it as illustrative or placeholder.

1. **`/proposals` is in the surface but its criterion is obsolete.** D-proposals-37 is marked
   obsolete, and its note says the `proposal-list-stub` entry "is removed with it". But
   `spec/contract/surface.yaml` still carries the page with `placeholder_text`, and this stage may
   not remove it. The design gives the address the least it can: an H1, one sentence saying
   proposals are on the dashboard, and a link there. It does not reproduce the old "Proposal List"
   words. The contract should either drop the entry, as the note says, or a criterion should
   state what the address shows.
2. **The vendor's History tab has no surface entry.** R-2.9 gives vendors their proposal's history
   in all three programs, and the stories place a History tab on every manage page
   (`proposal-tab-history`). But the surface's `proposal-*-edit` entries have no `history_tab`, so
   a test of R-2.9 has nothing to bind to.
3. **History versus hidden scores.** R-2.35 puts every score entry in the history. R-2.9 lets the
   vendor read that history. R-2.32 hides scores from the vendor until award. No criterion says
   whether the vendor's history leaves out score entries, or their values, before then. The
   `history-tab` stories show a decided proposal, where all three agree. The undecided case is not
   designed.
4. **Stage buttons at the wrong stage.** R-2.28 describes a refusal, so the design keeps each
   stage's score button on its tab and lets the service refuse it (see "Who is offered what").
   Hiding the buttons until their stage would be the gentler design, but it would leave R-2.28
   with no way to be exercised from the screen. A ruling is needed on which to build.
5. **`score_resource_questions` has no criterion.** Only R-2.7's note says Team With Us "still has a
   scoreQuestions action". No criterion says how it relates to the evaluation panel's consensus
   (R-2.29), who uses it, or what it enters. The button is placed on the Resource questions tab
   and opens the score dialog with one field per question. That is the extent of the design.
6. **References have no criterion.** The surface names `add_reference` on the Sprint With Us create
   page, but no criterion says what a reference holds, how many are needed, or whether any are
   required. The fieldset's Name, Email address and Phone number fields are placeholders.
7. **Team With Us cost formula** (R-2.10). The criterion says rates are applied "at each resource's
   target allocation across the opportunity's contract period", but not the hours in a day or
   which days count. The estimated cost in the stories ($412,500, $918,750) is illustrative. R-2.30's
   note gives the bid used for price scoring as rate times allocation, which the stories show as
   "$220.00 an hour".
8. **Dashboard wording, columns and order** (R-2.24). No criterion gives the columns, the row
   order or the empty messages. The stories order rows by last update, and the messages are the
   design's own.
9. **`show_my_proposals` and `show_org_proposals`.** R-2.24 says only that the two lists are under
   separate headings. Nothing says they are switched between. The design shows both at once and
   makes the two actions in-page links that move focus to each list, which keeps the surface's
   names meaningful without inventing a toggle.
10. **A confirmation is two steps; the surface names one.** This is the same as the opportunities
    domain's gap 10: submit, withdraw, delete, award, disqualify and every score entry each open a
    dialog whose confirm button carries its own ID. Either the surface gains `confirm_*` entries,
    or the contract accepts the two-step binding recorded under "Test IDs".
11. **Choosing anonymity on export-all** (R-2.38). The criterion says staff "choose whether that
    document names the proponents", but the surface has no action for the choice. The design uses
    a checkbox (`proposal-export-anonymous-toggle`). The surface should gain an action, or the
    choice should be a query on the route, which only the contract stage can add.
12. **Attachments on Sprint With Us and Team With Us manage pages.** The surface names
    `add_attachment` and `remove_attachment` on `proposal-cwu-edit` only. The files domain's
    control appears on the other two programs' editing stories with the same IDs, but a test has
    no surface entry to reach them.
13. **Team With Us export-one has no `anonymous_proponent_name`.** R-2.37 covers both Sprint With Us
    and Team With Us, and both `anonymous` stories carry `proposal-proponent-name`. Only the Sprint
    With Us entry names the observation.
14. **What staff see of an anonymous proposal.** R-2.37 withholds the proponent's name, and the
    design withholds the organization. Team member names are still shown, and they can identify
    the proponent. Whether they should also be withheld is not stated.
15. **Where the vendor sees the anonymous name.** The surface puts `anonymous_proponent_name` on
    the manage pages, but no criterion says a vendor is told their anonymous name, or when. The
    design shows it only on the Scoresheet, after the decision.
16. **Withdrawing after award.** R-2.23 says "at any time", so Withdraw stays in the action bar on
    an awarded or not-awarded proposal. Whether withdrawing an awarded proposal is meant, and what
    it does to the award, is not stated.
17. **Program terms documents.** The terms dialog links `/content/<program>-terms-and-conditions`,
    the addresses the users domain's legal section already uses. Their content is the content
    domain's.
18. **Content the spec does not carry.** Every name, organization, capability, question, amount,
    score, rank, date and identifier in the stories is illustrative and synthetic.

---

## Domain: evaluation

Evaluation is how a closed Sprint With Us or Team With Us opportunity's questions are scored by a
panel. There are five kinds of screen:

- **Panel dashboard** (`evaluation-panel-dashboard`). The "Evaluations" section of `/dashboard`,
  listing the opportunities whose panel the signed-in person sits on (R-5.19).
- **Panel tab** (`evaluation-panel-*`). The owner's or an administrator's editor for the panel on
  the manage page (`?tab=evaluationPanel`, R-5.1, R-5.16, R-5.18).
- **Evaluator tabs** (`evaluation-instructions-*`, `evaluation-individual-list-*`). What an evaluator
  is offered on the manage page: the program's instructions, and their own list of proponents with
  the one submit action (R-5.25, R-5.34).
- **Consensus tab** (`evaluation-consensus-list-*`). The chair's list of agreed scores and their
  submit action, and the owner's and administrator's view of it, where finalizing happens
  (R-5.12 to R-5.14, R-5.31 to R-5.33).
- **Scoring forms** (`evaluation-individual-create-*`, `-edit-*`, `evaluation-consensus-create-*`,
  `-edit-*`). One proponent, one score and one comment per question (R-5.22, R-5.29).

Every state named in `design/screens.yaml` has a story at
`design/catalogue/<page>.<state>.stories.tsx`, and the story is what a build copies. As in the
proposals domain, where a story shows a dialog or a refusal the page behind it may be trimmed, and a
`size="small" color="secondary"` line says which story holds the rest. That line is a catalogue
note, and a build does not render it.

The two programs share one design, as R-5.36 says the evaluations do. The Sprint With Us and Team
With Us versions of a page have the same layout, components, states and test IDs. They differ only
in the words the criteria give them:

| | Sprint With Us | Team With Us |
| --- | --- | --- |
| The questions | team questions (`team-questions` in the address) | resource questions (`resource-questions`) |
| Status words | "Team questions: individual evaluation", "Team questions: consensus" | "Resource questions: …" |
| Carried forward | up to four (R-5.32) | up to three |
| The next stage | the code challenge; "Code Challenge" in the refusal (R-5.10) | the challenge; "Challenge" in the refusal |
| Duplicate refusal (R-5.3) | "You already have a team question evaluation for this proposal." | "…a resource question evaluation…" |

### Components this domain is built from

All from `@bcgov/design-system-react-components` 0.8.1. No component or prop is new to the catalogue:
every one used here already compiles in an earlier domain's stories.

| Component | Used for |
| --- | --- |
| `Heading` | One H1 per screen. On the tabs it is the opportunity's title, as the opportunities domain decided. On a scoring form it is the proponent's anonymous name ("Proponent 2"), because that is who is being scored. H2 is the tab's name, or each question on a read-only form. H3 only inside the instructions. |
| `Text` | Body copy. `size="small" color="secondary"` for the page-kind line above the H1, "Proponent 2 of 3", the question's worth and minimum, captions, and the label above a proponent's response. `color="danger"` only for the panel's group error (too few members), which is also in the error summary. |
| `Button` | Every command. `primary` once per view for the next step: Save evaluation panel, Submit scores for consensus, Submit final consensus scores, Save and go to next proponent, and the dialogs' confirm buttons. `secondary` for Save draft, Save changes, Save and go to previous proponent, and Add an evaluator. `tertiary size="small"` for Remove on a panel row. Finalize consensus scores is the opportunities domain's button in its action bar. |
| `ButtonGroup` | Each form's save row (`ariaLabel` "Evaluation panel actions", "Evaluation actions", "Consensus actions") and the opportunities domain's action bar. |
| `Link` | The manage-page tabs, the dashboard's section links and rows, "Start evaluation", "Continue evaluation", "View evaluation", "Start consensus", "Edit consensus", "Back to …", and every item in an error summary. |
| `Select` | Each panel member ("Public sector employee") and the panel's Chair. |
| `Checkbox` | "Chair" on each evaluator row. |
| `NumberField` | Each score. There is no `minValue` or `maxValue`, as in the opportunities and proposals domains: the range is stated in the description and checked by the form, so a score out of range is shown as refused, not silently changed. |
| `TextArea` | Each comment. |
| `Form` | Always `validationBehavior="aria"`. |
| `InlineAlert` | `danger` for error summaries and service refusals (with `role="alert"`); `info` for the five notices that explain a state: the panel is fixed, the scores are withheld, the evaluation is submitted and read-only, the consensus is submitted and still editable, and a panel member is not the chair. Each is wrapped in a `div` that carries the test ID, because `InlineAlert` does not pass `data-*` through. |
| `Modal` + `AlertDialog` | Submit the final consensus scores, and Finalize the consensus scores. Both `confirmation`: neither destroys anything, but finalizing cannot be undone and both notify people. |
| `ProgressCircle` | Indeterminate loading, inside `role="status"` next to visible text. |

### This project's own components (not design-system components)

All but one are reused unchanged from earlier domains. None is a design-system component, and
none may be presented as one.

- **Status badge.** The users domain's `<span>` with a token border and circular radius. Here it
  carries an evaluation's or a consensus's state in words: "Not started", "Draft: incomplete",
  "Draft: complete", "Submitted".
- **Data table.** The users domain's native `<table>` with a caption and `scope="col"` headers, in a
  focusable `role="region"` that scrolls sideways at narrow widths. Used for the dashboard's
  Evaluations list, the evaluator's list, the consensus list, the fixed panel, and each question's
  "Evaluators' scores" on the consensus forms.
- **Section navigation (tabs).** The users domain's `<nav>` of `Link`s with `aria-current="page"`,
  as the opportunities domain uses it for the manage page. On the dashboard the two links are
  in-page links to the two sections, as the proposals domain's dashboard does.
- **Repeated-item group.** A `<fieldset>` and `<legend>` for each evaluator on the panel and each
  question on a scoring form.
- **Key facts list.** The opportunities domain's `<dl>`, used on a submitted evaluation for "Your
  score" and "Your comment".
- **Response block (new).** A `div` with a `--layout-border-width-small` inline-start border in
  `--surface-color-border-medium` and `--layout-padding-small`, holding a small "Proponent 2's
  response" label and the response text, so the proponent's words are set apart from the question
  and from the evaluator's own fields. The design system's `Callout` is an emphasis box with its own
  title and icon, which would make every response look like a warning or a note; a quotation needs
  no emphasis.

The only tokens used are those earlier domains list: `--layout-margin-{none,xsmall,small,medium,large}`,
`--layout-padding-{none,small,large}`, `--layout-border-width-small`,
`--layout-border-radius-{medium,circular}`, `--surface-color-border-{default,medium}`,
`--typography-font-weights-bold` and `--typography-bold-body`. No colour, size or radius value is
written anywhere in the catalogue.

### How a screen is laid out

The users domain's single column, with `--layout-margin-large` between regions and rows that wrap.

- **Tabs** (panel, instructions, evaluation, consensus). The opportunities domain's manage page,
  unchanged: "Manage a … opportunity" as small text, the H1, status and ID, the action bar, the tabs,
  any page alert, and the tab's H2 section. Only the tab's section is this domain's.
- **Scoring forms.** The page kind as small text ("Evaluate a Sprint With Us proponent", "Agree a
  Team With Us consensus"), the H1 (the anonymous name), the opportunity's title with "Proponent 2
  of 3", the status badge on the edit pages, "Back to your evaluations" or "Back to the consensus",
  one sentence on how scores are entered and when they are checked, any error summary or refusal,
  then one fieldset per question and the save row. Each question fieldset holds, in order: the
  question, its worth and minimum score, the proponent's response, the evaluators' scores (consensus
  forms only), the score and the comment.
- **Dashboard.** H1 "Dashboard", Create an opportunity, the section links, "My opportunities" (the
  opportunities domain's section, unchanged), then "Evaluations" with a sentence, and the table or the
  empty message. The Evaluations section is shown to every public sector employee and administrator,
  so its empty message has somewhere to live.

**Who sees which tabs** (R-5.34). The manage page's tabs depend on the person as well as the stage:

| Person | Tabs this domain adds or relies on |
| --- | --- |
| Evaluator | Instructions, Evaluation. The chair, if also an evaluator, adds Consensus once the opportunity reaches consensus. |
| Chair who does not evaluate | Consensus, from the consensus stage. |
| Opportunity's owner, administrator | Evaluation panel (always), and Consensus from closing — the opportunities domain's tab list. |
| Anyone else | None of them. |

A row on the dashboard's Evaluations list opens the manage page without a tab. The page then opens
on the first tab the person is offered: Instructions for an evaluator, Consensus for a chair who does
not evaluate.

### Forms and validation

- **The panel** (R-5.1, R-5.9). One fieldset per evaluator ("Evaluator 1", "Evaluator 2"), each with a
  `Select` of public sector employees, a "Chair" checkbox, and Remove. "Add an evaluator" follows the
  last row. Then a separate "Chair" `Select`. The chair is one fact shown in two places: ticking
  Chair on a row sets the Chair field to that evaluator and clears any other row's tick; choosing a
  person in the Chair field ticks their row if they are an evaluator, or leaves every row unticked if
  they chair without evaluating (R-5.15's note). So a panel can never hold two chairs.
- **Checked on save.** Save evaluation panel checks, in this order: at least two members; nobody
  named twice; a chair chosen. Each failure is listed in the error summary, and the panel is not
  saved — "It is still the panel it was before", as R-5.1 requires. A duplicate is shown on the
  second row's `Select`. No chair is shown on the Chair field. Too few members is a group error after
  the rows, because no one field is wrong.
- **What the form cannot check.** The list offers only public sector employees, so a vendor can
  reach the panel only if the service is sent one, or an account changes between loading and
  saving. The service's refusal is shown on the member's row, naming them (the `refused` story). The
  same row slot carries R-5.37's refusal of a member who is neither evaluator nor chair, which this
  form cannot produce, because every row is an evaluator.
- **Scores and comments** (R-5.22). Each score's description states its range: "Between 0 and 5,
  with up to two decimal places." Each comment's says "At least one word, explaining the score."
  The form checks each field when the person leaves it and again on every save. The messages are:
  "Enter a score between 0 and 5 for question 1.", "Enter a score with no more than two decimal
  places for question 2.", "Enter a comment for question 2."
- **Saving never refuses a draft** (R-5.23). Save draft, Save changes and the two Save-and-go
  buttons always save what is on the screen, and move on where they say they will. When something is
  wrong, the error summary says "Your draft was saved as you entered it. Your scores cannot be
  submitted until these are fixed.", and the proponent's row on the list reads "Draft: incomplete".
  This keeps the form and the service in agreement. The alternative, refusing to save, is gap 8.
- **Submitting** (R-5.25, R-5.26). There is no submit on a scoring form. The evaluator submits the
  whole set from the Evaluation tab, and the button is disabled, described by the sentence before
  it, until every proponent reads "Draft: complete". The chair's "Submit final consensus scores"
  works the same way, one consensus per proponent (R-5.13, R-5.7's note).
- **The service's own words** are used where a criterion quotes them: R-5.3's duplicate refusal,
  R-5.25's incomplete refusal, R-5.4's "Not all consensuses have been submitted." (kept for R-5.13's
  case too), and R-5.10's corrected "screened into the Code Challenge" / "the Challenge". Everything
  else is the design's own wording (gap 6).
- **Anonymity** (R-5.35). Proponents are listed and headed by their anonymous names, in that order.
  The organization's name is absent from the markup of every evaluation screen, not hidden with
  styling, following the proposals domain.

### Dialogs

Only the two consensus actions ask first; the surface names a confirmation for both. Each dialog is
a `Modal` holding an `AlertDialog`: its title is a question, its body says what happens and who is
told, and its buttons name the action. Focus moves in, stays in, and returns to the opening button;
Escape dismisses.

| Action | Variant | Confirm button (test ID) | Other |
| --- | --- | --- | --- |
| Submit final consensus scores | `confirmation` (`evaluation-submit-consensus-dialog`) | "Submit consensus scores" (`evaluation-submit-consensus-confirm`) | Cancel (`evaluation-dialog-cancel`). The body says the owner and every administrator are told (R-5.31), and that a consensus can still be changed (R-5.30). |
| Finalize consensus scores | `confirmation` (`evaluation-finalize-dialog`) | "Finalize consensus scores" (`evaluation-finalize-confirm`) | Cancel (`evaluation-dialog-cancel`). The body says what finalizing does (R-5.32), that the chair and owner are told (R-5.33), and that it cannot be undone. |

"Submit scores for consensus" does not ask first, because the surface names no confirmation for
it. It cannot be undone either (R-5.24), so the sentence before the button says so (gap 15).

### Loading, empty, refused, not found

- **Loading.** The H1 renders at once, with a `role="status"` row holding a `ProgressCircle` and
  matching text below it.
- **Not found.** The users domain's shared missing page (`not-found-page`), which never says "not
  allowed". R-5.18 requires it for the panel tab. The design uses it too for the other tabs and the
  scoring forms, whenever the person is not someone the criteria let in (gap 5).
- **Refused, with a reason.** Where the person belongs on the page but may not do the thing, the
  page explains instead of disappearing: the owner who is not on the panel (`withheld`, R-5.12), and
  a panel member who is not the chair on the consensus form (`chair-only`, R-5.29). A panel member
  already knows the opportunity exists, so explaining leaks nothing.
- **Service refusals** — duplicates (R-5.3, R-5.29), an incomplete set (R-5.25), and the two
  finalize refusals — are `danger` alerts with `role="alert"`, in a `tabIndex={-1}` wrapper that
  takes focus. A duplicate offers a link to the evaluation or consensus that already exists.
- **Empty.** Only the dashboard's Evaluations list has a designed empty state. A list with no
  proponents is not designed (gap 14).

### Accessibility obligations

WCAG 2.1 AA applies (P1, J5). The users, opportunities and proposals domains' lists apply here too.
This domain adds the following.

- **Status is words.** Every evaluation and consensus state is written out. Scores are written "4 out
  of 5". A disabled submit button is described by the visible sentence before it, which says what
  enables it.
- **Controls with the same visible text are told apart** (WCAG 2.5.3). "Chair" and "Remove" repeat on
  every panel row, so each has an `aria-label` that begins with its visible text and names its row
  ("Chair: evaluator 2", "Remove evaluator 2"). The list links ("Continue evaluation: Proponent 2",
  "Edit consensus: Proponent 3") do the same. Each score and comment names its question in its
  label ("Score for question 1", "Agreed comment for question 2").
- **Long forms are navigable.** Each question is a fieldset with a legend, so a screen reader
  announces which question a field belongs to. The error summary links to every field it names.
- **The evaluators' scores are a table, not a layout.** Each question's table has a caption
  ("Evaluators' scores for question 1") and column headers, so a score is announced with its
  evaluator.
- **Announcements.** Loading uses `role="status"`. Refusals and error summaries use `role="alert"`,
  and focus moves to them.
- **Checks still required.** Keyboard use of the panel's two linked chair controls, screen-reader
  checks of the two dialogs, and 400% zoom of the consensus form's tables have not been done. They
  are required before the build is accepted.

### Test IDs

The rules are the users domain's: one ID per kind of element; an action and an observation on the
same element share its ID; the same element keeps its ID on every page. The two programs' pages share
every ID, as do the create and edit forms, and the individual and consensus forms.

- **Reused from other domains:** `not-found-page`, `field-error` (users); `opportunity-status`,
  `opportunity-identifier`, `opportunity-tab-*`, `dashboard-opportunity-link`,
  `finalize-consensus-button`, `advance-refused-message` (opportunities); `proposal-proponent-name`
  (proposals, which asked that every screen naming a proponent reuse it).
- **New tab IDs:** `opportunity-tab-instructions` and `opportunity-tab-evaluation`, following the
  opportunities domain's `opportunity-tab-*` pattern. That domain's tab lists should gain them.

The following bindings are not obvious from their names:

- `finalize_consensus_scores` is `finalize-consensus-button`, the opportunities domain's button in the
  shared action bar, as that domain's gap 13 asked. It is one control with two surface names.
  Pressing it opens `evaluation-finalize-dialog`, and `confirm_finalize_consensus` is the dialog's
  confirm.
- `not_all_consensuses_submitted_error` and `no_screenable_proponent_error` are
  `evaluation-not-all-submitted-error` and `evaluation-no-screenable-error`, each nested inside the
  opportunities domain's `advance-refused-message` wrapper. It is the same alert, and the inner ID
  says which refusal it is.
- `choose_panel_chair` and `chair_field` are both the Chair `Select`, `evaluation-panel-chair-field`.
  `mark_member_as_chair` is the per-row checkbox, `evaluation-panel-member-chair`, one per row, told
  apart by accessible name (gap 2).
- `panel_member_row` is `evaluation-panel-member-row`: the fieldset on the form, and the table row on
  the fixed panel.
- The four panel errors, `score_out_of_range_error` and `empty_notes_error` are carried by the links
  in the error summary (`evaluation-panel-*-error`, `evaluation-score-error`,
  `evaluation-notes-error`). Each is inside a `field-error` list item, so the users domain's pattern
  holds and each rule still has its own ID. There is one link per problem, so there may be more than
  one `evaluation-score-error`.
- `evaluations_tab` and `show_panel_opportunities` are both the "Evaluations" section link,
  `dashboard-show-evaluations`. `open_opportunity` is `dashboard-opportunity-link`, the same element
  kind as in the opportunities domain's table.
- `visible_to_evaluators_only` is the Instructions tab link, `opportunity-tab-instructions`. A test
  observes its presence for an evaluator and its absence for anyone else (and gets the missing page
  at the address itself).
- `own_evaluations_only` is the evaluator's table, `evaluation-individual-table`, whose caption says
  "Your evaluations". Its rows are one per proponent and carry only the reader's own status.
- `submit_disabled_until_complete` is the submit button, `evaluation-submit-for-consensus`, whose
  disabled state is the observation.
- `proponent_row` is `evaluation-proponent-row` on both the evaluation and the consensus lists.
- `anonymous_proponent_name` is `proposal-proponent-name` everywhere, including the H1 of each
  scoring form.
- `enter_question_score` and `enter_question_notes` are `evaluation-question-score-field` and
  `evaluation-question-notes-field`, one per question. The field's label names the question.
- `read_only_after_submitted`, `editable_after_submitted`, `chair_only`, `empty_for_owner_not_on_panel`
  and `panel_locked_after_consensus` are each the wrapper of the `info` notice that explains the
  state.

**Extra IDs, not named in the surface, that the stories carry for the adapter:**
`evaluation-panel-member-field` (each member's `Select`), `evaluation-consensus-table`,
`dashboard-panel-opportunity-row`, and `evaluation-save-previous` on the individual edit pages
(gap 10).

### Per-screen notes

**evaluation-panel-dashboard**: `default` (three panels, one a draft, with the reader's role on
each, R-5.19), `empty`, `loading`.

**evaluation-panel-swu / -twu**: `default` (the owner, published), `invalid` (a duplicate and no
chair), `too-few` (one member), `refused` (a member the service refused, R-5.1, R-5.37), `locked`
(consensus onward: the panel as a table, R-5.16), `not-found` (R-5.18), `loading`. Saving on a
published opportunity notifies only the people newly added (R-5.17). The introduction says so, and
nothing on the screen shows the notification.

**evaluation-instructions-swu / -twu**: `default`, `not-found`, `loading`. The body is the program's
evaluation instructions content page, rendered read-only (R-5.34 note).

**evaluation-individual-list-swu / -twu**: `default` (part-way: complete, incomplete, not started),
`ready` (all complete, submit offered), `submitted` (all read-only, R-5.24; the consensus stage begins
by itself when the last evaluator submits, R-5.27), `refused` (R-5.25's message), `not-found`,
`loading`.

**evaluation-consensus-list-swu / -twu**: the chair's `default`, `ready`, `submit-confirm` and
`submitted` (still editable, R-5.30); the administrator's `finalize-confirm`, `not-all-submitted`
(R-5.13) and `no-screenable` (R-5.10); the owner's `withheld` (R-5.12, with Finalize still offered,
R-5.14); `not-found`; `loading`. An administrator, and an owner who is on the panel but is not the
chair, see the list with its statuses and no links (gap 11).

**evaluation-individual-create-swu / -twu**: `default` (the second of three proponents), `invalid`,
`duplicate` (R-5.3), `not-found` (R-5.21), `loading`.

**evaluation-individual-edit-swu / -twu**: `default` (a draft), `invalid`, `submitted` (read-only, no
save controls, R-5.24), `not-found`, `loading`.

**evaluation-consensus-create-swu / -twu**: `default`, `invalid` (the same rules, R-5.29's note),
`duplicate`, `chair-only` (a non-chair panel member reads the evaluators' scores, R-5.28), `not-found`,
`loading`.

**evaluation-consensus-edit-swu / -twu**: `default` (a draft), `submitted` (still editable,
R-5.30), `invalid`, `not-found`, `loading`.

### Gaps

These are work for the spec. None of them was filled with invented behaviour. Where the design had to
show something, the story marks it as illustrative or says which gap it rests on.

1. **Does a chair who does not evaluate count toward the minimum of two?** R-5.1 asks for "at least
   two panel members"; R-5.15's note describes "two evaluators plus a separate chair". Whether one
   evaluator and a separate chair is a valid panel is not stated. The design's message says "two
   members", and the `too-few` story shows one person, where both readings agree.
2. **Two chair controls, one fact.** The surface names both `choose_panel_chair` and
   `mark_member_as_chair`. The design keeps both and ties them together (see "Forms and
   validation"). Also, the opportunities domain's create-page panel editor gives each member
   Evaluator and Chair checkboxes and no Chair field, which is a different arrangement for the same
   panel. The two should be one design. This domain's is the one the surface describes, so the
   create page's `evaluation-panel-editor` should take it, which only the opportunities domain can
   change.
3. **Who may read an individual evaluation contradicts itself.** R-5.11 (authored) opens it to the
   administrator, the owner and the panel "at every stage". R-5.28 closes it to everyone but its
   author before consensus, and to an administrator not on the panel until the question stages have
   passed, while its own note says "an administrator can read an individual evaluation at any stage".
   The `not-found` story for the edit pages does not choose. A ruling is needed before the build.
4. **Where panel members see the panel.** R-5.18 says each panel member sees the membership, but the
   only panel screen answers them "Not Found". No criterion says where they see it, so it is not
   placed.
5. **What a tab's address answers to someone not offered the tab.** R-5.34 says who is offered
   Instructions, Evaluation and Consensus, but not what happens when someone else opens the address.
   The design uses the missing page, following R-5.18. Falling back to the first tab they are offered
   would be the other reading.
6. **Wording the spec does not give.** The panel's messages (R-5.1 asks only for "a message naming
   the rule"), the evaluation status words, the empty dashboard message, the notices and the dialog
   text are the design's own.
7. **The owner may finalize without seeing what they finalize.** R-5.12 withholds the agreed scores
   from an owner not on the panel until the next stage. R-5.14 offers that owner the finalize action.
   Together they ask the owner to confirm scores they cannot read. Designed as the criteria say; a
   ruling on whether the owner should see the scores once they may finalize is needed.
8. **Saving a draft with an invalid entry** (R-5.23's note). The design saves as entered and lists
   the problems, so the form and the service agree. Refusing to save until the entry is valid is the
   other reading, and would need a different message.
9. **The duplicate consensus refusal has no wording** (R-5.29). The stories follow R-5.3's sentence:
   "You already have a team question consensus for this proposal."
10. **Previous proponent on the edit pages.** The surface names `save_and_go_to_previous_proponent` on
    the individual create pages only. R-5.35 is about moving through the proponents in either
    direction, so the individual edit pages carry the same button with the same ID. The consensus
    pages carry neither, as the surface names neither. What the first and last proponent's buttons do
    is not stated; the stories show a middle proponent.
11. **Reading the agreed scores.** R-5.28 lets an administrator read a consensus at any stage, but the
    only consensus page is the chair's edit form at the chair's address. The design gives the
    administrator and the owner the consensus list with statuses and no links. Where they read the
    scores themselves (perhaps the proposals domain's team-questions tab, R-2.29) needs placing.
12. **After finalizing.** R-5.30 lets the chair change a consensus "until it is finalised". What the
    chair's list and forms show afterwards is not stated, so there is no `finalized` state.
13. **What else an evaluator sees on the manage page.** R-5.34 names the evaluator's tabs, but not
    whether they also see Summary, Proposals or anything else, nor what a panel member sees on a
    draft they open from the dashboard (R-5.19) before there is anything to evaluate. The stories
    show the evaluator's two tabs only.
14. **An opportunity with no proponents to evaluate.** R-5.20 assumes submitted proposals. What the
    evaluation list shows with none is not stated, and it is not designed.
15. **"Submit scores for consensus" has no confirmation.** It cannot be undone (R-5.24), and the
    chair's comparable action has a confirmation in the surface, but this one does not. The design
    states the consequence before the button rather than adding a dialog the surface cannot bind.
16. **Instructions content.** The instructions are site content, one page per program (R-5.34's
    note). Their address and text are the content domain's; the stories' text is a placeholder.
17. **Content the spec does not carry.** Every name, question, response, score, comment, date and
    identifier in the stories is illustrative and synthetic, and none is the seed's.
