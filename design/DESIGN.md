---
version: 0.1.0
name: "{{PROJECT_NAME}}"
description: "{{SERVICE_PURPOSE}}"
sources: []
tokens:
  colour: []
  type: []
  space: []
  radius: []
components: []
---

<!-- Structure adapted from bcgov/crow v0.6.0's DESIGN.template.md. -->

# Design — {{PROJECT_NAME}}

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

# Domain: users

Written at the design gate for the users domain. It covers the fourteen pages
`spec/contract/surface.yaml` gives this domain: sign-in, sign-up, profile completion,
sign-out, the notice screen, the administrator's list of users, and the profile with its
capabilities, notifications and legal sections, each profile page reached both by account
identifier and through `/users/me`. The behaviour comes from `spec/domains/users.md`, and every
design decision below names the criterion it serves. Where no criterion settles what a screen
does, this document says so under that screen and in **Users — gaps and findings** at the end,
and the catalogue does not invent it.

The catalogue is `design/catalogue/<page>.<state>.stories.tsx`, one story per page per state
declared in `design/screens.yaml`. The stories are built from
`design/catalogue/users.shared.tsx`, which composes the screens from
`@bcgov/design-system-react-components`, `@bcgov/design-tokens` and `@bcgov/bc-sans`. That file
is a module, not a story, so it declares no state.

## Users — principles

1. **The design system first, then a native element built from tokens, never a new
   component.** Where the B.C. Design System has a released component, the screen uses it.
   Where it has none (a data table, section navigation, a static status label, a file input),
   the screen uses the native HTML element styled only with tokens, and the gap is recorded
   below. Nothing in the catalogue presents itself as a design-system component when it is not
   one.
2. **Every value is a token.** No colour, spacing, type size, weight or radius is written out
   anywhere in the catalogue. Where no token existed for a need, the design went without the
   value rather than typing it (see the gaps on content width, breakpoints and avatar size).
3. **The words carry the meaning.** Status, account type, whether someone is an administrator,
   a disabled control's reason and every error are stated in text. Colour and weight only
   reinforce them (P1).
4. **A refusal the criteria describe as a missing page looks exactly like a missing page.**
   R-4.25 is designed so the viewer cannot tell a refused profile from an address that does
   not exist.

## Users — components

| Need | Component | Source | Used on |
| --- | --- | --- | --- |
| Page frame | `Header` (with `skipLinks`), `Footer` | design system | every page |
| Primary, secondary, tertiary and destructive actions | `Button` (`variant` primary / secondary / tertiary / link; `danger` for deactivation) | design system | profile, list, dialogs |
| A group of actions | `ButtonGroup` | design system | every form and dialog |
| Navigation to another address | `Link` | design system | account choices, table names, terms, error-summary entries, "Back to home" |
| Text entry, including read-only values | `TextField` (`label`, `description`, `isRequired`, `isReadOnly`, `isInvalid`, `errorMessage`, `type`) | design system | profile, completion, search |
| A single yes/no choice | `Checkbox` | design system | administrator box, capabilities, notifications, terms agreement, export choices |
| A labelled set of choices | `CheckboxGroup` (`label`, `description`, `value`) | design system | export dialog, completion notifications |
| A submitted form | `Form` (`validationBehavior="aria"`) | design system | profile edit, completion |
| Page-level and in-section messages | `InlineAlert` (`variant` info / warning / danger) | design system | error summary, save failure, refusal, terms updated, deactivated-by-owner, sign-in required |
| A confirmation or a small task over the page | `Modal` + `Dialog` (`role="alertdialog"` for confirmations) | design system | activation change, unsubscribe, accept updated terms, export |
| Account-kind choice | native `section` with a token border, an `h2` and a `Link` | native + tokens | sign-in, sign-up |
| Profile section navigation | native `nav` > `ul` > `a` with `aria-current="page"` | native + tokens | profile pages |
| Status (Active / Inactive) | native `span` with support-surface and support-border tokens | native + tokens | list, profile |
| List of users | native `table` with `caption` and `th scope="col"`, horizontally scrollable when narrow | native + tokens | user list |
| Profile picture | native `input type="file"` with a persistent `label` and description; initials placeholder hidden from assistive technology | native + tokens | profile edit, completion |
| Loading | native `p role="status"` | native + tokens | list, profile |
| Account summary (type, status, account ID) | native `dl` | native + tokens | profile |

**Why `Modal` + `Dialog` rather than `AlertDialog`.** `AlertDialog` renders its buttons in a
slot outside its children. The surface names each dialog as one observation
(`activation_modal`, `unsubscribe_modal`, `accept_updated_terms_modal`, `export_modal`) whose
actions a test finds inside it. A plain `Dialog` with one wrapper holding the heading, text and
buttons gives that single scope. Confirmation dialogs still carry `role="alertdialog"`, so they
are announced the way `AlertDialog` would announce them.

**Why section links rather than an ARIA tab list.** Each profile section is its own address
(`?tab=capabilities`), reachable directly and through the back button, so the sections are
links in a `nav` landmark labelled "Profile sections". The current one carries
`aria-current="page"` and is shown in bold with an active-border underline, not by colour
alone. An ARIA `tablist` would promise arrow-key behaviour and in-page panels that these
addresses do not have. The design system has no released tabs component in any case.

## Users — layout

- One `h1` per page. On a profile it is the person's name, `h2` is the section ("Profile",
  "Capabilities"…) and `h3` marks sub-sections ("Permissions", "Account status", "Privacy
  Policy"…). Dialog headings are `h2`.
- `main#main-content` holds the page, reached by the header's skip link. Vertical spacing
  between blocks is `layoutMarginLarge`, and between the fields of a form `layoutMarginMedium`.
  The page padding is `layoutPaddingXlarge` on the block axis and `layoutPaddingLarge` on the
  inline axis.
- Everything is one column. No breakpoint token and no content-width token are published, so
  the two account-choice cards stack at every width instead of sitting side by side above a
  guessed breakpoint. Rows that can wrap (the list toolbar, the account summary, the section
  links) use `flex-wrap`, so they reflow at 320 CSS pixels and 400% zoom without horizontal
  scroll. The user table is the one legitimate two-dimensional exception, and it scrolls inside
  its own container.
- Typography: BC Sans (`typographyFontFamiliesBcSans`), body `typographyFontSizeBody`, headings
  `typographyFontSizeH1` / `H2` / `H3` in `typographyFontWeightsBold`, secondary text in
  `typographyColorSecondary`, small labels in `typographyFontSizeSmallBody`.

## Users — forms and validation

These rules apply to the profile form (`user-profile`, `user-profile-self`) and the completion
form (`user-sign-up-complete`).

- **Labels are always visible** and never placeholders. Required fields use `isRequired`, which
  marks them in text and programmatically. The one optional field that is ever asked for says so
  in its label ("Job title (optional)", "Profile picture (optional)").
- **Limits are stated before input**, as field descriptions: "Up to 100 characters." for name
  and job title (R-4.27).
- **The sign-in username is a read-only `TextField`** with the description "The username you
  sign in with. It cannot be changed." (R-4.27 note). It is labelled after the identity it
  belongs to: "GitHub username" for a vendor, "IDIR username" for a public sector employee.
- **Validation runs on submit, not on every keystroke.** A failed submission:
  1. keeps every value the person entered;
  2. puts an error summary at the top of the form: a danger `InlineAlert` headed "There is a
     problem with this form", with one `li` per invalid field linking to that field's `id`
     (`#profile-name`, `#profile-email`). The build moves focus to the summary container
     (`tabIndex=-1`) when it appears;
  3. marks each invalid field `isInvalid`, with the same message as its `errorMessage`, so the
     field describes its own error when the person reaches it.
- **Messages name the field and the fix**: "Enter your name, up to 100 characters." and "Enter
  an email address in the format name@example.com." The email address is stored in lower case
  (R-4.27). The build lower-cases it on save and does not report upper case as an error.
- **A valid form the service still refuses** (a duplicate email address, R-4.6) shows a danger
  `InlineAlert` with `role="alert"`, "Your changes were not saved", and keeps the entries. The
  message is deliberately generic, because the criterion records that a duplicate email is
  indistinguishable from any other fault.
- **A control that must stay unavailable until a condition is met** (Complete profile until the
  terms are agreed, R-4.3; Export until a type and a field are chosen, R-4.32) is `isDisabled`,
  and a plain sentence stating the condition sits directly above it and is its
  `aria-describedby`. The sentence disappears once the condition is met. The requirement is
  never hidden behind a disabled button with no reason.
- **Controls that save as they change** (the administrator box, R-4.12; each capability, R-4.8;
  the new-opportunities box, R-4.29) sit beside a sentence saying the change takes effect
  immediately. Each section has an empty `role="status"` region the build fills with a short
  confirmation after a save.
- **Editing withdraws the account-status controls.** While the profile is in edit mode the
  deactivation control is not shown, so Save and Cancel are the only actions in the form.

## Users — service states

- **Loading.** Only the list and the profile fetch data before anything can be shown. Both show
  their heading and a `role="status"` sentence ("Loading users…", "Loading profile…"). The list
  also shows its toolbar at once. The profile shows the generic "User Profile" heading, because
  the person's name, and whether the viewer may see the account at all, are unknown until it
  loads. No spinner is designed, because the design system publishes none. The tab pages share
  the profile's loading state and declare none of their own.
- **Empty.** No users screen has a designed empty state, because no criterion says what one
  shows (gaps U-7, U-8). The capability list is the service's fixed list, so it is never empty.
  Holding no capabilities is a valid selection, not an empty screen (R-4.8).
- **Refused.** A profile the viewer may not read is the ordinary missing page (R-4.25). A
  section the profile does not offer silently shows the profile section (R-4.33, R-4.34). Its
  story is the `not-offered` state of each tab page. An administrator's refused grant of
  administrator rights is announced beside the box (R-4.12). A refused sign-in, for any reason,
  is the `authFailure` notice (R-4.1, R-4.4, R-4.6).
- **Confirmation.** Deactivation, reactivation, unsubscribing and agreeing to updated terms are
  confirmed in a dialog before anything changes. Focus starts on Cancel. Escape cancels. Focus
  returns to the control that opened the dialog. The destructive confirm button uses the
  `danger` treatment and repeats the action's name ("Deactivate account"), never "OK".
- **Success.** Sign-out states its outcome as `role="status"` text (R-4.17). Deactivating one's
  own account ends on the `deactivatedOwnAccount` notice (R-4.9). Other saves confirm in the
  section's status region, without moving focus.

## Users — accessibility obligations

The constitution requires WCAG 2.1 AA (P1, J5). This design is written to 2.2 AA, which
includes it.

| Obligation | How the design meets it |
| --- | --- |
| 1.3.1 Info and relationships | Real headings in order, `nav`/`main` landmarks, `dl` for the account summary, `table` with `caption` and `th scope="col"`, `CheckboxGroup` labels for grouped choices, `aria-describedby` for every requirement sentence and field description. |
| 1.4.1 Use of colour | Status is the word "Active" or "Inactive". Administrator is "Yes" or "No". The current section is bold, has an underline border and carries `aria-current`. Every error is text. |
| 1.4.3 / 1.4.11 Contrast | Only semantic tokens (`typographyColor*`, `surfaceColor*`, `supportSurfaceColor*`, `supportBorderColor*`), whose published pairings meet contrast. Status labels pair primary text with a support surface and a support border. |
| 1.4.10 Reflow | Single-column layout. Wrapping rows. Only the user table scrolls horizontally, inside its own container. |
| 2.1.1 Keyboard, 2.4.3 Focus order | Only native or design-system interactive elements. No positive `tabindex`. Dialogs trap focus while open, start on Cancel and return focus to their trigger. |
| 2.4.1 Bypass blocks | Header skip link to `#main-content`. |
| 2.4.2 Page titled | The document title is the surface `title` of the page (for profiles, the person's name followed by it). The build sets it on every route change. |
| 2.4.4 / 2.5.3 Link purpose, label in name | Links and buttons say what they do: "Sign in using GitHub", "Deactivate account", "Read the Digital Marketplace Terms & Conditions". Repeated "Show description" buttons carry the capability name in visually hidden text. |
| 2.5.8 Target size | Design-system controls at their documented sizes. Nothing smaller is introduced. |
| 3.3.1 / 3.3.3 Error identification and suggestion | Error summary plus inline field errors, each naming the field and the fix. |
| 3.3.2 Labels or instructions | Persistent labels, limits stated before input, the reason for every unavailable control stated beside it. |
| 3.3.4 Error prevention (legal) | Agreeing to terms is an explicit tick (completion) or an explicit confirmation (updated terms). Deactivation and unsubscribing are confirmed. |
| 4.1.3 Status messages | Loading, save confirmations and sign-out success use `role="status"`. A refused administrator grant, a failed save and a failed sign-out use `role="alert"`. |
| Decorative content | The initials placeholder is `aria-hidden`, because the person's name is already the heading. |

## Users — test identifiers

**Form.** Every identifier is `<family>__<name>`. `<name>` is the action or observation exactly
as the surface spells it. `<family>` is the page id with `-self` removed, because
`user-profile-self` and `user-profile` are one screen reached two ways and render the same
element. `user-profile-self-legal` and `user-profile-legal` therefore both bind
`user-profile-legal__open_app_terms`. Each story passes its page's identifiers in literally, and
an identifier renders only in the states where the element it names exists.

**Placement.**
- An action's identifier sits on the interactive element itself (`Button`, `Link`, `Checkbox`,
  `TextField`, the native file input), which the design-system components forward to the DOM.
- An observation's identifier sits on the element that shows it, or on a native wrapper when the
  design-system component draws the thing observed (`InlineAlert`, dialog content).
- **When an action and an observation name the same control** (`accept_app_terms` /
  `terms_checkbox`, `toggle_admin_permission` / `admin_checkbox`,
  `toggle_new_opportunity_notifications` / `new_opportunities_checkbox`, `toggle_capability` /
  `capability_checked`, `open_app_terms` / `app_terms_link`), the action's identifier goes on the
  control and the observation's on its immediate wrapper. The observed value (checked, the link's
  destination) is read from the control inside that wrapper.
- An identifier that repeats per row (`user_row`, `status_badge`, `open_user_profile`,
  `capability_row`, `toggle_capability`, `toggle_export_field`…) is the same on every row, and a
  test narrows by the row's visible text.
- **"Disabled until" observations** (`complete_disabled_until_terms_accepted`,
  `export_disabled_until_selection`) sit on the requirement sentence, which is present exactly
  while the control is unavailable. The control's `isDisabled` state is the corroboration.

**Constitution J3.** J3 forbids CSS or DOM selectors in acceptance tests and asks for roles,
labels and visible text. A `data-testid` is a DOM attribute. Every identifier below is therefore
paired with the role and accessible name of the element it sits on, so an adapter can bind
either way. Whether test identifiers are acceptable under J3 is not for this gate to rule (gap
U-16).

## Users — screens

### user-sign-in — `/sign-in`

Criteria: R-4.1, R-4.22. **States:** `default` only. A refused sign-in is a different page
(`user-notice`), and nothing else about this screen varies.

An `h1` "Sign In", one line of instruction, then two account-choice cards in a single column.
**Vendor** (for finding opportunities and submitting proposals) links to "Sign in using
GitHub". **Public Sector Employee** (for publishing and managing opportunities) links to "Sign
in using IDIR". Each choice starts an identity-provider round trip, so it is a `Link`, not a
button. Below, "Don't have an account? Sign up" links to `/sign-up`.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| sign_in_as_vendor | `user-sign-in__sign_in_as_vendor` | `Link` · link "Sign in using GitHub" |
| sign_in_as_public_sector_employee | `user-sign-in__sign_in_as_public_sector_employee` | `Link` · link "Sign in using IDIR" |
| go_to_sign_up | `user-sign-in__go_to_sign_up` | `Link` · link "Sign up" |
| vendor_card | `user-sign-in__vendor_card` | `section` · region "Vendor" |
| public_sector_card | `user-sign-in__public_sector_card` | `section` · region "Public Sector Employee" |

### user-sign-up-choose-account — `/sign-up`

Criteria: R-4.1. **States:** `default` only.

The same two cards under `h1` "Choose Account Type", with a sentence explaining that an account
is created the first time a person signs in. The links read "Sign up using GitHub" and "Sign up
using IDIR" and lead to the same identity-provider round trip as sign-in.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| sign_up_as_vendor | `user-sign-up-choose-account__sign_up_as_vendor` | `Link` · link "Sign up using GitHub" |
| sign_up_as_public_sector_employee | `user-sign-up-choose-account__sign_up_as_public_sector_employee` | `Link` · link "Sign up using IDIR" |
| vendor_card | `user-sign-up-choose-account__vendor_card` | `section` · region "Vendor" |
| public_sector_card | `user-sign-up-choose-account__public_sector_card` | `section` · region "Public Sector Employee" |

### user-sign-up-complete — `/sign-up/complete`

Criteria: R-4.3, R-4.22, R-4.23, R-4.24, R-4.27, R-4.28. **States:**
- `default`: the agreement box is clear, Complete profile is unavailable, and the reason is
  stated.
- `terms-accepted`: the box is ticked and completion is available. This state differs because
  the requirement sentence is gone and the control is enabled, which is exactly what R-4.3
  observes.
- `invalid`: submitted with the name cleared and a malformed email address.

Only a vendor who has not yet agreed to the terms reaches this form (R-4.23). Anyone else is
redirected before it renders, so the redirect has no state here. The form contains: the picture
(optional); the GitHub username, read-only; Name and Email address, required and prefilled from
the identity provider; a "Notifications" group with "Notify me by email when a new opportunity
is published", clear by default (R-4.24); a "Terms and conditions" sub-section that links to the
Digital Marketplace Terms & Conditions and the Privacy Policy *before* the agreement box (links
never sit inside a checkbox label); the agreement box; and the Complete profile button. No job
title is asked for, because the person is always a vendor (R-4.28).

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| change_avatar | `user-sign-up-complete__change_avatar` | native file input · "Profile picture (optional)" |
| accept_app_terms | `user-sign-up-complete__accept_app_terms` | `Checkbox` · checkbox "I have read and agree to the Digital Marketplace Terms & Conditions and the Privacy Policy" |
| toggle_new_opportunity_notifications | `user-sign-up-complete__toggle_new_opportunity_notifications` | `Checkbox` · checkbox "Notify me by email when a new opportunity is published" |
| complete_profile | `user-sign-up-complete__complete_profile` | `Button` · button "Complete profile" |
| idp_username_readonly | `user-sign-up-complete__idp_username_readonly` | `TextField` · read-only textbox "GitHub username" |
| name_field | `user-sign-up-complete__name_field` | `TextField` · textbox "Name" |
| email_field | `user-sign-up-complete__email_field` | `TextField` · textbox "Email address" |
| job_title_field | **left `null`** | not rendered: see gap U-5 |
| terms_checkbox | `user-sign-up-complete__terms_checkbox` | wrapper of the agreement checkbox |
| complete_disabled_until_terms_accepted | `user-sign-up-complete__complete_disabled_until_terms_accepted` | requirement sentence, the button's description; present only in `default` |
| field_error | `user-sign-up-complete__field_error` | error-summary entry, one per invalid field; `invalid` only |

### user-sign-out — `/sign-out`

Criteria: R-4.17. **States:** `default` (signed out) and `failed`.

`default` shows `h1` "Signed Out" with the status sentence "You have successfully signed out.
Thank you for using the Digital Marketplace." `failed` shows `h1` "Sign Out Failed" and a danger
`InlineAlert` ("You have not been signed out"), because a heading reading "Signed Out" over a
failure would contradict it. The document title stays the surface title in both.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| signed_out_message | `user-sign-out__signed_out_message` | `p role="status"`; `default` only |
| sign_out_failed_message | `user-sign-out__sign_out_failed_message` | `div role="alert"` around the alert; `failed` only |

### user-notice — `/notice/:noticeId`

Criteria: R-4.1, R-4.4, R-4.5, R-4.6, R-4.9. **States:**
- `default` is `authFailure`: `h1` "Sign In Failed", "Something went wrong and you could not be
  signed in. Please try again." The notice deliberately does not say why, because a deactivated
  account, an unrecognised identity and a duplicate email address all land here and the criteria
  do not distinguish them.
- `deactivated-own-account`: `h1` "Account Deactivated", confirming the deactivation and saying
  the person can reactivate by signing in again (R-4.5, R-4.9).
- `not-found`: any other `:noticeId`, the ordinary missing page.

Both notices end with "Back to home", a link inside a `ButtonGroup`.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| back_to_home | `user-notice__back_to_home` | `Link` · link "Back to home" |
| deactivated_own_account_notice | `user-notice__deactivated_own_account_notice` | notice paragraph; `deactivated-own-account` only |
| sign_in_failed_notice | `user-notice__sign_in_failed_notice` | notice paragraph; `default` only |

### user-list — `/users`

Criteria: R-4.14, R-4.21, R-4.32. **States:**
- `default`: the list.
- `loading`.
- `export-open`: the export dialog with nothing chosen.
- `export-ready`: one account type and one field chosen, so Export is available.

Typing in the search is not a separate state, because the narrowed list is the same table with
fewer rows.

`h1` "Digital Marketplace Users". A toolbar holds "Search by name", a search `TextField`
described as "Matches any words in a person's name.", which filters as the person types (R-4.14,
name only), and a secondary "Export contact list" button. The table has the columns Status,
Account type, Name (a link to the profile) and Administrator ("Yes" or "No"). It is sorted by
status (active first), then account type, then name, and the caption says so.

The export dialog ("Export contact list") offers "Account types": Public sector employees or
Vendors, described as "Administrators are included with public sector employees." It offers
"Fields": First name, Last name, Email address or Organization name. Below them is the
requirement sentence while nothing adequate is chosen, then Cancel and Export. Export downloads a
spreadsheet file of active accounts only (R-4.32).

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| search_by_name | `user-list__search_by_name` | `TextField` · searchbox "Search by name" |
| open_export_contact_list | `user-list__open_export_contact_list` | `Button` · button "Export contact list" |
| toggle_export_user_type | `user-list__toggle_export_user_type` | `Checkbox` · "Public sector employees", "Vendors" |
| toggle_export_field | `user-list__toggle_export_field` | `Checkbox` · "First name", "Last name", "Email address", "Organization name" |
| export_contact_list | `user-list__export_contact_list` | `Button` · button "Export" |
| cancel_export | `user-list__cancel_export` | `Button` · button "Cancel" |
| open_user_profile | `user-list__open_user_profile` | `Link` · link named for the person |
| user_row | `user-list__user_row` | `tr` · row |
| status_badge | `user-list__status_badge` | status label · "Active" / "Inactive" |
| account_type | `user-list__account_type` | cell text · "Administrator" / "Public Sector Employee" / "Vendor" |
| admin_check | `user-list__admin_check` | "Yes" in the Administrator column; present only for an administrator |
| export_modal | `user-list__export_modal` | dialog content · dialog "Export contact list" |
| export_disabled_until_selection | `user-list__export_disabled_until_selection` | requirement sentence, Export's description; `export-open` only |

### user-profile — `/users/:userId`, and user-profile-self — `/users/me`

Criteria: R-4.9, R-4.12, R-4.18, R-4.19, R-4.20, R-4.25, R-4.26, R-4.27, R-4.28, R-4.30, R-4.31,
R-4.34. It is one screen. `/users/me` resolves to the signed-in person and differs only in its
addresses and in what an own-profile viewer can be offered.

**Anatomy.**
1. `h1` with the person's name.
2. The account summary (`dl`): Account type; Status, shown only to an administrator (R-4.34);
   and Account ID, the identifier the address holds.
3. Section links. For one's own profile these are Profile, Capabilities, Organizations,
   Notifications and Legal for a vendor, or Profile and Notifications for a public sector
   employee or administrator. An administrator viewing somebody else gets none, because they see
   only the profile section (R-4.34).
4. The **Profile** section:
   - picture; sign-in username (read-only); Name; Email address; Job title for a public sector
     employee only (R-4.28). All are read-only `TextField`s in view mode.
   - "Edit profile" appears only on one's own profile (R-4.18). Edit mode turns the same fields
     into the editable form with Save changes and Cancel.
   - **Permissions** (R-4.12): an administrator viewing somebody else gets the "Administrator"
     checkbox, applied at once. A public sector employee or administrator on their own profile
     gets a read-only label. A vendor's own profile has no such block.
   - **Account status** (view mode only), one of:
     - one's own profile, non-administrator: "Deactivate account" (R-4.9);
     - an administrator viewing an active account: "Deactivate account" (R-4.30);
     - an account an administrator deactivated: the date, and "Reactivate account" (R-4.19);
     - an account its owner deactivated: an info `InlineAlert` saying only the owner can
       reactivate it by signing in again, with no control (R-4.19);
     - an administrator's own profile: nothing (R-4.31).

**States: user-profile.**
- `default`: an administrator viewing an active public sector employee.
- `own-profile`: a vendor on their own profile by identifier, showing all five section links.
- `editing`: a public sector employee editing, so the job title and permissions label appear.
- `invalid`.
- `admin-permission-refused`: the refusal on a vendor's account, R-4.12.
- `deactivated-by-administrator`.
- `deactivated-by-owner`.
- `confirm-deactivate`.
- `confirm-reactivate`.
- `not-found`: R-4.25.
- `loading`.

The two deactivated states are genuinely different screens, because one offers a control and the
other replaces it with a statement. That is the whole of R-4.19.

**States: user-profile-self.**
- `default`: a vendor.
- `public-sector`: two sections, a job title, the permissions label.
- `administrator`: status shown, no deactivation control.
- `editing`: a vendor, with no job title field.
- `invalid`.
- `save-failed`: R-4.6.
- `confirm-deactivate`.
- `sign-in-required`.
- `loading`.

`sign-in-required` is the sign-in page with an info alert "Sign in to see your profile — You
will be returned to your profile after you sign in." (R-4.26 note, R-4.22). `save-failed` is
catalogued on the self page only, and the by-identifier page shows the same alert in the same
place.

**Dialogs.** Each has a heading, a sentence and Cancel plus a confirm button:
- deactivating one's own account: "Deactivate your account?", saying they will be signed out and
  told by email how to come back;
- deactivating another's: "Deactivate this account?", naming the person and the email they will
  receive;
- reactivating: "Reactivate this account?", naming the person and saying an administrator's
  reactivation is what they will be told (R-4.20).

| Name | Identifier | Element · role / accessible name | Rendered in |
| --- | --- | --- | --- |
| edit_profile | `user-profile__edit_profile` | `Button` · "Edit profile" | own profile, view mode |
| save_changes | `user-profile__save_changes` | `Button` · "Save changes" | edit mode |
| cancel_editing | `user-profile__cancel_editing` | `Button` · "Cancel" | edit mode |
| change_avatar | `user-profile__change_avatar` | file input · "Profile picture (optional)" | edit mode |
| toggle_admin_permission | `user-profile__toggle_admin_permission` | `Checkbox` · "Administrator" | administrator viewing another (not on self) |
| deactivate_account | `user-profile__deactivate_account` | `Button` · "Deactivate account" | active account, not an administrator's own |
| reactivate_account | `user-profile__reactivate_account` | `Button` · "Reactivate account" | deactivated by an administrator (not on self) |
| confirm_activation_change | `user-profile__confirm_activation_change` | `Button` · "Deactivate account" / "Reactivate account" in the dialog | confirm states |
| cancel_activation_change | `user-profile__cancel_activation_change` | `Button` · "Cancel" in the dialog | confirm states |
| user_identifier | `user-profile__user_identifier` | Account ID value | every loaded state |
| profile_tab, capabilities_tab, organizations_tab, notifications_tab, legal_tab | `user-profile__profile_tab` … `user-profile__legal_tab` | section links · "Profile", "Capabilities", "Organizations", "Notifications", "Legal" | own profile (vendor: all five; others: profile and notifications) |
| status_badge | `user-profile__status_badge` | status label · "Active" / "Inactive" | administrator viewer |
| account_type | `user-profile__account_type` | Account type value | every loaded state |
| permissions_label | `user-profile__permissions_label` | read-only permissions text | own profile of a public sector employee or administrator (the self page has no such observation) |
| admin_checkbox | `user-profile__admin_checkbox` | wrapper of the Administrator checkbox | administrator viewing another |
| idp_username_readonly | `user-profile__idp_username_readonly` | read-only `TextField` · "GitHub username" / "IDIR username" | every loaded state |
| name_field | `user-profile__name_field` | `TextField` · "Name" | every loaded state |
| email_field | `user-profile__email_field` | `TextField` · "Email address" | every loaded state |
| job_title_field | `user-profile__job_title_field` | `TextField` · "Job title" / "Job title (optional)" | public sector employee or administrator |
| field_error | `user-profile__field_error` | error-summary entry | `invalid` |
| activation_modal | `user-profile__activation_modal` | dialog content · alertdialog | confirm states |
| not_found_page | `user-profile__not_found_page` | missing-page content · heading "Page Not Found" | `not-found` (user-profile only) |
| sign_in_required | `user-profile__sign_in_required` | wrapper of the sign-in-required alert | `sign-in-required` (self only) |

### user-profile-capabilities / user-profile-self-capabilities — `?tab=capabilities`

Criteria: R-4.8, R-4.34. **States:**
- `default`: two capabilities held, all descriptions collapsed.
- `description-expanded`.
- `not-offered`. On the by-identifier page this is an administrator viewing a vendor. On the
  self page it is a public sector employee. Either way the profile section is shown, so the
  administrator is offered no capability control (R-4.8).

Section "Capabilities" says "Tick each capability you have. Each change is saved as soon as you
make it. You may leave every box clear." It is followed by one row per capability in the
service's list. Each row has the capability's checkbox, a link-style button "Show description"
(with "of <capability>" visually hidden, and `aria-expanded` and `aria-controls` pointing at the
description), and the description paragraph, which is `hidden` until expanded.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| toggle_capability | `user-profile-capabilities__toggle_capability` | `Checkbox` · named for the capability |
| expand_capability_description | `user-profile-capabilities__expand_capability_description` | `Button` · "Show description of <capability>" / "Hide description of <capability>" |
| capability_row | `user-profile-capabilities__capability_row` | `li` |
| capability_checked | `user-profile-capabilities__capability_checked` | wrapper of the capability's checkbox |
| capability_description | `user-profile-capabilities__capability_description` | description paragraph (in the DOM but `hidden` until expanded) |

### user-profile-notifications / user-profile-self-notifications — `?tab=notifications`

Criteria: R-4.29, R-4.34. **States:**
- `default`: notices on.
- `confirm-unsubscribe`.
- `not-offered`, by-identifier page only: an administrator viewing somebody else sees their
  profile section. Every kind of account has this section on its own profile, so the self page
  has no `not-offered` state.

"Notifications are sent to **<address>**. If this address is not correct, change it in the
Profile section." Then the checkbox "Notify me by email when a new opportunity is published".
Clearing the box opens "Stop new opportunity notifications?", which names the address. The
setting behind it stays on until the person confirms (R-4.29). The same dialog is what the
notifications domain's `notification-unsubscribe-landing` opens on arrival. That page is theirs,
and it reuses this component.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| toggle_new_opportunity_notifications | `user-profile-notifications__toggle_new_opportunity_notifications` | `Checkbox` · "Notify me by email when a new opportunity is published" |
| confirm_unsubscribe | `user-profile-notifications__confirm_unsubscribe` | `Button` · "Stop notifications" |
| cancel_unsubscribe | `user-profile-notifications__cancel_unsubscribe` | `Button` · "Cancel" |
| new_opportunities_checkbox | `user-profile-notifications__new_opportunities_checkbox` | wrapper of the checkbox |
| notification_email_address | `user-profile-notifications__notification_email_address` | the address in bold |
| unsubscribe_modal | `user-profile-notifications__unsubscribe_modal` | dialog content · alertdialog "Stop new opportunity notifications?" |

### user-profile-legal / user-profile-self-legal — `?tab=legal`

Criteria: R-4.16, R-4.33, R-4.34. **States:**
- `default`: the current terms agreed.
- `terms-updated`: after an administrator's announcement.
- `confirm-accept-terms`.
- `not-offered`. On the by-identifier page this is an administrator viewing a vendor. On the
  self page it is a public sector employee. Nobody but the vendor is shown the section, and
  nobody may agree on another's behalf (R-4.16 note).

Section "Policies, Terms & Agreements". In `terms-updated`, a warning `InlineAlert` comes first.
Then three sub-sections:
- **Privacy Policy**: the policy text, stating that it was agreed when the account was created.
- **Digital Marketplace Terms & Conditions**: a link to read them and "You agreed … on <date> at
  <time>." In `terms-updated` the sentence reads "You last agreed … You have not yet agreed to
  the updated terms.", followed by the primary button "Review and agree to the updated terms".
- **Program Terms & Conditions**: links for Code With Us, Sprint With Us and Team With Us.

The confirmation dialog links to the updated terms (opening in a new tab, as its name says) and
offers Cancel and "Agree to the updated terms". Agreeing records a fresh date and time.

| Name | Identifier | Element · role / accessible name |
| --- | --- | --- |
| open_app_terms | `user-profile-legal__open_app_terms` | `Link` · "Read the Digital Marketplace Terms & Conditions" |
| accept_updated_terms | `user-profile-legal__accept_updated_terms` | `Button` · "Review and agree to the updated terms"; `terms-updated` and `confirm-accept-terms` |
| confirm_accept_updated_terms | `user-profile-legal__confirm_accept_updated_terms` | `Button` · "Agree to the updated terms" |
| privacy_policy | `user-profile-legal__privacy_policy` | `section` · region "Privacy Policy" |
| app_terms_link | `user-profile-legal__app_terms_link` | paragraph wrapping the terms link |
| accepted_on_notice | `user-profile-legal__accepted_on_notice` | the agreed-on sentence |
| terms_updated_warning | `user-profile-legal__terms_updated_warning` | wrapper of the warning alert |
| program_terms_links | `user-profile-legal__program_terms_links` | `ul` of the three program links |
| accept_updated_terms_modal | `user-profile-legal__accept_updated_terms_modal` | dialog content · alertdialog "Agree to the updated terms and conditions?" |

## Users — gaps and findings

Each item is either work for the spec or a check the build must make. None was filled in
silently.

- **U-1: the design-system APIs and token names were not verified in this workspace.** No
  `@bcgov/*` package is installed here and the published sources could not be fetched, so the
  catalogue was written from the documented API and has not been compiled. Before building,
  confirm each of the following against the installed release:
  - the component props relied upon: `Button` `variant="link"`, `size`, `danger`; `Header`
    `skipLinks`; `InlineAlert` accepting children; `TextField` `description` / `errorMessage` /
    `isInvalid` / `isReadOnly` / `isRequired`; `CheckboxGroup` `value` / `description`; `Form`
    `validationBehavior`; `Modal` `isOpen` / `isDismissable`; `Dialog` `role`; and that
    `data-testid` is forwarded to the DOM by `Button`, `Link`, `Checkbox` and `TextField`;
  - the token exports used, from `@bcgov/design-tokens/js`: `layoutPadding*`, `layoutMargin*`,
    `layoutBorderWidthSmall` / `Large`, `layoutBorderRadiusSmall` / `Medium` / `Large`,
    `typographyFontSizeH1` / `H2` / `H3` / `Body` / `SmallBody`, `typographyFontWeightsBold` /
    `Regular`, `typographyFontFamiliesBcSans`, `typographyColorPrimary` / `Secondary` / `Link`,
    `surfaceColorBackgroundWhite` / `LightGray`, `surfaceColorBorderDefault` / `Active`,
    `supportSurfaceColorSuccess` / `Danger`, and `supportBorderColorSuccess` / `Danger`.

  A name that differs is a rename, not a licence to type the value.
- **U-2: there is no released component** for a data table, section navigation, a static status
  label, a file input, a loading indicator or a card. Native elements with tokens stand in, as
  listed under components.
- **U-3: no breakpoint or content-width token exists.** Account choices stack in one column at
  every width, and body text has no maximum line length. No avatar-size token exists either, so
  the initials placeholder is sized by padding tokens.
- **U-4: identity-provider names are provisional copy.** The criteria say "government identity"
  and "code-hosting identity". The screens say IDIR and GitHub, which content needs to confirm.
- **U-5: `user-sign-up-complete` `job_title_field` cannot render and is left `null`.** The page
  admits only vendors (R-4.23), and a vendor is never asked for a job title (R-4.28). It becomes
  reachable only if R-4.23's open question is answered by admitting public sector employees, in
  which case the field is the same `TextField` as on the profile and takes
  `user-sign-up-complete__job_title_field`.
- **U-6: R-4.12 offers the administrator box on a vendor's profile, and the service always
  refuses it.** This is the same shape as the defect R-4.10 recorded and R-4.19 corrected for
  reactivation. The design follows the accepted criterion (`admin-permission-refused`). Whether
  the box should simply not be offered on a vendor's account is a decision for the spec.
- **U-7: what a non-administrator sees at `/users` is not stated.** R-4.21 settles the service's
  refusal. R-4.15, which said the interface shows a missing page, is superseded without its
  interface half being restated. No refused state is designed.
- **U-8: the empty user list and a search matching nobody are unstated.** No criterion says what
  either shows, so no empty state is designed.
- **U-9: the capability list and its descriptions are not in the spec.** R-4.8 says "the
  service's own list". The nine names and descriptions in the catalogue are illustrative. What
  happens when saving a capability or the notification choice fails is also unstated.
- **U-10: the notifications section for an account with no email address is unstated.** R-4.1
  allows such accounts, and the `vendor-without-email` persona exists, but no criterion says what
  "Notifications are sent to …" becomes, or whether the box is offered at all.
- **U-11: the profile picture has no stated limits.** No criterion gives accepted file types or
  size, what a failed upload shows, or whether a picture can be removed.
- **U-12: the addresses of the legal documents are unnamed.** No criterion or surface entry names
  where the app terms, privacy policy and program terms live. The catalogue links
  `/content/terms-and-conditions`, whose edit route the surface does list, and illustrative
  slugs for the rest. The privacy policy text is placeholder content.
- **U-13: surface titles against honest headings.** `user-sign-out` is titled "Signed Out" and
  `user-notice` "Notice". The failed sign-out and each notice use a heading that says what
  happened, and the surface title is kept as the document title. If the contract means `title`
  to be the visible `h1`, this needs ruling.
- **U-14: the Account ID is shown visibly.** The surface requires `user_identifier` on every
  profile, and no criterion places it, so it is shown as "Account ID" in the summary. It is a
  system identifier, not personal information.
- **U-15: the sign-in-required explanation is an addition.** R-4.26 says only that the visitor
  is sent to sign in and returned. The info alert explaining why is design, not behaviour, and
  can be dropped without affecting any criterion.
- **U-16: test identifiers against J3.** `data-testid` is a DOM attribute and J3 forbids DOM
  selectors in acceptance tests. Every identifier is paired above with the role and accessible
  name it sits on, so an adapter can honour J3. Whether identifiers may be used at all needs a
  ruling.
- **U-17: agreeing to updated terms is a confirmation, not a tick box.** R-4.16 says "offers a
  way to review and agree". Whether re-agreement needs a tick box like sign-up (R-4.3) is not
  stated.
- **U-18: a refused profile completion is unstated.** No criterion says what the completion page
  shows when saving is refused (for example, a duplicate email address at that step).
- **U-19: `users.shared.tsx` is a module, not a story.** It lives in `design/catalogue/` beside
  the stories. If the catalogue check treats every file there as needing a declared state, it
  will flag this one, and the module should move.
