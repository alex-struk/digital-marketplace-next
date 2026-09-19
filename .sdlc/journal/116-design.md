---
stage: "design"
title: "design users"
at: "2026-09-15T14:28:44.613Z"
cost: 3.9304075000000003
turns: 97
session: "f3ce3bd7-ebd1-47f8-b441-25854355d8d2"
---

I designed the 14 users-domain pages and bound all 126 of their test IDs to markup in the catalogue. Two things were not checked: I couldn't confirm the design-system components and token names against the design system itself (web access was denied), and no automated or manual accessibility testing was done.

**What I started from.** The workspace already held 56 users-domain stories and matching `design/screens.yaml` entries, apparently from an earlier attempt at this stage. That attempt had left every surface `test_id` as `null` and never written a section in `design/DESIGN.md`. I read every story against the accepted criteria rather than trusting it. The stories held up, so I kept them and fixed the one gap I found. The existing `screens.yaml` entries already matched the catalogue file for file, so I left that file unchanged.

**Screens and states.**
- **Sign-in and choose-account pages:** `default` only. A failed sign-in lands on the notice page, so neither page has a failure state of its own.
- **Profile-completion page:** `default` (agreement box unticked, completion unavailable), `terms-accepted`, `invalid` and `save-failed`.
- **Sign-out page:** `default`, `loading` and `failed`, because R-4.17 promises either a success or a failure message.
- **Notice page:** the deactivated-own-account notice, the sign-in-failed notice, and not-found for any other notice name.
- **User list:** `default`, `loading`, `export-open` (nothing ticked, Export unavailable), `export-ready`, and `not-found` for anyone but an administrator.
- **Profile by account identifier:** eleven states. The main split is who is looking and at what state of account: an administrator viewing an active account, the owner viewing their own (`own`, `editing`, `invalid`), the refused attempt to make a vendor an administrator, and deactivate and reactivate confirmations. Deactivated-by-administrator and deactivated-by-owner are separate states because R-4.19 offers reactivation only on the first.
- **`/users/me` profile:** separate states for a vendor, a public sector employee and an administrator, since R-4.34 gives each different sections and controls. It also has `loading`, `editing`, `invalid`, `save-failed`, `deactivate-confirm` and `sign-in-required`.
- **Capabilities, notifications and legal sections:** a `default` state, the section's own confirmation dialog where it has one, and a `section-unavailable` state. That last state exists because asking for a section the profile doesn't offer shows the profile section instead. The notifications section on `/users/me` has no such state, since every kind of account offers notifications.

**The one change to a story.** No story for the by-identifier profile page showed the read-only permissions label, even though the surface lists it as an observation on that page. I added it to that page's editing state, a public sector employee on their own profile, so every ID on that page appears in one of its own stories.

**Test IDs.**
- **Where they come from.** Every `test_id` on the fourteen pages is now the `data-testid` the stories render, and none is `null`. I only replaced `null` values, and only on this domain's entries; I added and renamed nothing.
- **Shared IDs.** An element that is both an action and an observation carries one ID; for example, the terms checkbox serves both "accept terms" and "terms checkbox". Repeated elements share one ID, and a test tells the copies apart by accessible name. Fields keep the same ID on every page they appear on.
- **One deliberate edge.** On the profile-completion page, the job title field is bound to `job-title-field` but never rendered. That page admits only vendors (R-4.23), and vendors are never asked for a job title (R-4.28), so the only use of that binding is to observe that the field is absent.

**Components.**
- **Most used:** `TextField` (read-only details and edit forms alike), `Checkbox`/`CheckboxGroup`, `Button`, `InlineAlert` (error summary, save failures, the terms-changed warning, signed-out success), `Modal` with `AlertDialog` for every confirmation, `Heading`, `Text` and `Link`.
- **Also used:** `ProgressCircle` for loading and `FileTrigger` for the profile-picture chooser.
- **Not from the design system:** three project-specific adaptations are labelled as such in `DESIGN.md`. They are the profile section navigation (a nav of links, with no tabs component), a text status badge, and a native table for the user list.
- **Tokens:** layout and border values use only design tokens, and no colour value is written anywhere.

**What `DESIGN.md` covers.** I appended a users section and left the shared template untouched. It sets out form behaviour, confirmation dialogs, loading and not-found behaviour, which sections each kind of profile offers, the accessibility obligations and the test-ID conventions. One design call worth review: "Complete profile" and "Export" are disabled until their boxes are ticked, because the criteria and the surface require it. A disabled button can't take focus, so the reason is also given as visible text placed before the button.

**Gaps**, each recorded in `DESIGN.md` for the spec rather than filled:
- **No-match search on the user list.** No criterion says what a search that matches nobody shows, so no empty state is designed.
- **Refused user list.** R-4.21 says the list is refused but not what the person sees. The design's missing-page follows the superseded R-4.15 and the profile rule in R-4.25, not R-4.21 itself.
- **Failed immediate saves.** Nothing says what a person sees when a capability, the notice choice, a terms agreement, or a reactivation or deactivation fails to save. The only refusal with wording is making a vendor an administrator.
- **Already-inactive deactivation.** R-4.31's refusal message has no control on any designed screen that could trigger it.
- **"Before continuing" after a terms change.** R-4.16 implies vendors are stopped until they agree, but no page in the surface carries that prompt.
- **Public sector employees at profile completion.** R-4.23's open question about admitting them is still unanswered.
- **Missing content.** The capability list, the privacy policy text and the terms page addresses are not in the spec; the stories use marked placeholders.
- **Picture rules.** Accepted image types and limits belong to the files domain.
- **No next step after signing out.** R-4.17 says nothing about it; the story offers a plain "Sign in again" link with no test ID.
- **Unverified APIs.** Some component props and the token names still need checking against the installed packages before a build relies on them.

Nothing was pushed or merged.