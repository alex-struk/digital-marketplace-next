---
stage: "design"
title: "design users"
at: "2026-09-15T07:41:50.604Z"
cost: 6.2906315
turns: 110
session: "a6be3bf4-de18-42be-9129-7602b340c611"
---

I designed all 14 users-domain pages. Every file this stage owns is written, and every `test_id` on these pages is filled in. Nothing has been compiled or rendered: this workspace has no Storybook and no installed packages, so the stories are unchecked beyond reading the component typings.

## What was written

- **`design/screens.yaml`**: a new file, since no other domain had written one yet. It declares 54 states across the 14 pages.
- **`design/catalogue/`**: 54 stories, one per declared state, with no extra files.
- **`spec/contract/surface.yaml`**: every `test_id` on the users pages is filled in and none are left `null`. All 72 distinct IDs appear as `data-testid` in at least one story.
- **`design/DESIGN.md`**: I added a "Domain: users" section after the existing content. The file was still the unfilled template (placeholder title, empty token lists), and I left that text and its header untouched.

I checked the catalogue and `DESIGN.md` for hex, `rgb`/`hsl` and named colours and found none. Every spacing, border and radius value is a token.

## Package evidence

I found an installed copy of `@bcgov/design-system-react-components` 0.7.0 elsewhere on the machine and read its typings and bundle, so every prop used is real. That package pins design tokens 3.2.0; the current tokens package is 4.0.0. Every token name I used exists in both. I also confirmed that `Button`, `Checkbox`, `TextField`, `Link`, `Dialog`, `Modal`, `Heading` and `Text` carry `data-testid` through to the markup. `Tag` does not.

## States, and why

- **Sign-in and choose-account type:** only `default`. No criterion describes anything else they show.
- **Profile completion:** `default` (completion disabled), `terms-accepted`, `invalid` and `save-failed`, because R-4.3 turns on the control becoming available.
- **Sign-out:** `loading`, `default` and `failed`, following R-4.17.
- **Notice:** the own-deactivation notice as `default`, the sign-in failure, and `not-found` for any other notice name.
- **Users list:** `default`, `loading`, `export-open` (nothing ticked, export disabled), `export-ready` and `not-found` for anyone but an administrator.
- **Profile by identifier:** eleven states, mainly the administrator's view of someone else:
  - the refused attempt to make a vendor an administrator;
  - confirming deactivation and reactivation;
  - an account deactivated by an administrator (with the reactivate control) and one deactivated by its owner (without it);
  - the owner's own view, editing and invalid.
- **Profile at `/users/me`:** separate states for a vendor, a public sector employee and an administrator, because the sections and controls differ by kind. Also `sign-in-required`: a note on the sign-in screen explaining the redirect. That note is my design choice, not a criterion.
- **Capabilities, notifications and legal tabs:** each has `section-unavailable` wherever R-4.34 says the profile section is shown instead. Legal adds `terms-updated` and `accept-terms-confirm`; notifications adds `unsubscribe-confirm`.
- **Deliberately not states:**
  - Redirects (R-4.22, R-4.23), since the person sees the destination screen.
  - Loading on the tab pages, since the profile's own loading state covers it.

## Test ID decisions

- The profile form's IDs (`name-field`, `email-field`, `job-title-field`, `idp-username-field`, `change-avatar`, `field-error`) are shared between profile completion and the profile, because they are the same fields.
- `job-title-field` is never shown on the completion page: only vendors reach it (R-4.23), and vendors are never asked for a job title (R-4.28). A test there should expect it to be absent.
- `field-error` sits on each entry of the error summary. Each invalid field also shows its message beneath it.
- `profile-permissions-label` only appears in the `/users/me` stories.
- `notification-unsubscribe-landing` belongs to the notifications domain but is the same screen. I recommend it reuse `unsubscribe-modal` and its two button IDs.

## Components leaned on most

`Heading`, `Text`, `TextField`, `Checkbox`/`CheckboxGroup`, `Button`, `Link`, `InlineAlert`, `Modal` with `AlertDialog`, and `ProgressCircle`. `FileTrigger` comes from React Aria, which the BC package already depends on, because BC offers no file-upload component.

Five pieces are my own compositions from BC components and tokens, and `DESIGN.md` labels them as not official, each with its reason:
- **Choice card:** `Callout` can't set its title's heading level.
- **Status badge:** `Tag` must sit inside an interactive grid and doesn't carry a test ID.
- **Profile section navigation:** a list of links, because each section has its own address and so isn't a true tab set.
- **Native users table:** BC has no table component.
- **Capability disclosure:** in `Accordion` the checkbox can't sit inside the trigger, and no test ID can reach the trigger.

## Gaps for the spec

Each is recorded under its screen in `DESIGN.md`.

- **Users list:**
  - Nothing says what shows when a search matches nobody, so I designed no state for it.
  - The order of account types within a status isn't stated.
  - Nothing covers closing the export dialog after the file is made, an export failure, or paging.
- **Profile:**
  - R-4.12 shows the administrator box on a vendor's profile only for the service to refuse it. That invites an action that always fails, the same fault R-4.10 was superseded for.
  - Nothing says whether the administrator box appears on an inactive account.
  - Nothing says whether the profile shows which administrator deactivated an account.
  - Nothing covers a failed deactivation or reactivation, a failed capability save, or a failed notification save.
- **Notifications:**
  - Nothing says whether unticking the box by hand also asks for confirmation (R-4.29 asks only when arriving from the unsubscribe link).
  - Nothing says what an account with no email address sees.
- **Sign-in and sign-up:**
  - No criterion describes the sign-up page as different from sign-in.
  - The identity providers and the card wording aren't named.
  - Nothing says what an already signed-in visitor sees at `/sign-in`.
- **Profile completion:**
  - R-4.23's open question on whether public sector employees should see the page is unresolved. I followed the criterion and never show it to them.
  - Accepted picture types and sizes aren't stated.
- **Content the spec doesn't carry:** the list of capabilities, the privacy policy text, and the addresses of the terms, privacy and program-terms pages. The stories use marked placeholders.
- **Missing tokens:** there is none for a readable content width, a breakpoint or an avatar size. So forms aren't width-limited, the cards always stack, and no picture is drawn.

## Not done

- No rendering, accessibility or contrast check has been run on the stories.
- The target size of the small capability "Show description" button is unmeasured.
- I didn't confirm that `InlineAlert` passes a test ID through to its outer element, so the stories wrap it in an element that carries the ID instead.