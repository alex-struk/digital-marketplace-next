| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T19:23:03.370Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rewrote `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml` from scratch.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml` from scratch. This time the signed-in screens were actually walked: sign-in through the sandbox identity provider works for every persona I tried. The main finding is that the running build is much narrower than the old adapter assumed. The old file described a full marketplace, and most of it no longer exists on this target, so I didn't patch it; I replaced it.

I couldn't type-check the file, because the shell wouldn't run `tsc` or `node` here. I compared each implemented page by hand against its interface in `surface.d.ts`, and ran the adapter's locators against the live target to confirm they read what I expected. The bindings file names 108 pages and 988 members, the same counts as `surface.yaml`.

**What the target is (build-slice-2-10 at localhost:4300)**
- **Screens that exist:** `/`, `/sign-in`, `/sign-up`, `/sign-up/complete`, `/sign-out`, `/notice/deactivatedOwnAccount` and `/notice/authFailure`, `/content/:slug`, `/learn-more/:program`, and `/status` (plain "OK").
- **Dashboard:** `/dashboard` shows only "Dashboard" and "You are signed in as …", whoever signs in.
- **Profile:** one's own profile at `/users/me` or `/users/<own id>`, with Profile, Notifications and Legal tabs. The Capabilities and Organizations links just show the profile details again.
- **Routes that don't resolve for anyone, the administrator and the organization owner included:**
  - everything under `/opportunities` (all create, view, edit, complete, proposal, export and evaluation screens)
  - `/proposals`, `/organizations`, `/organizations/create`, `/organizations/:orgId/edit` and both terms pages
  - `/users` and another person's `/users/:id`
  - `/content`, `/content/create`, `/content/:slug/edit`
  
  These all show "Page not found". `/admin/email-notification-reference` gets a JSON 404 from the service itself.
- **API:** only three requests have handlers: `GET /api/sessions/current`, `GET /api/content/:slug` and `PUT /api/users/:id`. Everything else answers 404 "Cannot …", including file storage, organizations, affiliations, proposals and evaluations.
- **Mail catcher:** it answers, but `/hold/proxies/smtp/toxics` returns 404, so the mail-delay page is unbound.

**What's bound**
- **Sign-in / sign-out:** `signIn` fills the identity provider's own form, with the password read from `SDLC_SANDBOX_PASSWORD` at run time. `signOut` has to visit `/sign-out` *and* clear the page's stored tokens *and* clear cookies: the session lives in a `dm-session` cookie plus a `digital-marketplace.tokens` entry in browser storage.
- **Public screens:** home, footer, the service-level-agreement link, published pages (title, body, dates, address, element names, whether script ran), sign-in and sign-up cards, the sign-out message and notices.
- **Complete-profile form:** walked as the first-time vendor, the first-time vendor without an email, and the vendor mid-profile. Refusals are read from the "Your profile has N problems" alert.
- **Profile, notifications and legal readings.**
- **Dashboard readings:** they read empty, since the page loads and simply has nothing on it.
- **Requests:** reading a page by address, one's own account record, and the mail catcher's messages and fault switch.

**What's unbound, and why**
- **Everything on the missing routes and API handlers above.** Where a contract member is a refusal ("refused for non-administrator" and the like) on a route even the administrator can't open, I left it unbound. Reading "Page not found" there as a refusal would pass tests on a page that doesn't exist.
- **Profile editing and account status:** the profile is read-only boxes. There is no edit, save, picture, administrator box, deactivate or reactivate control.
- **Notification toggle:** the "Email me when new opportunities are posted" box is read-only (`aria-readonly`), and no unsubscribe dialog appears, even with `&unsubscribe` in the address.
- **Agreeing to updated terms:** the vendor with reset terms sees "You last agreed … on January 5, 2026" and no control to agree again.
- **Profile picture on the complete-profile form:** "Choose a profile picture" is drawn, but pressing it by mouse or keyboard opens no file chooser. That looks like a defect in the target, not a gap in the adapter.

**The three criteria named in the operator's reason**
- **R-6.20:** the checkbox reading is bound; the vendor with notices off sees it unchecked. Toggling is unbound because the box is read-only.
- **R-6.28:** the administrator can open only their own profile. Anyone else's is "Page not found", which `not_found_page` reads; every other member on another person's profile reports unbound.
- **R-4.23:** the complete-profile form is bound for the vendor mid-profile. The terms-reset vendor and public-sector staff are sent straight to `/dashboard`, and the members report unbound saying where they were sent. First-time public-sector employees skip the form entirely.

While walking the target I changed some data. The first-time vendor and first-time public-sector sign-ins created accounts, and the first-time vendor's profile was completed. I turned the notices-off vendor's notices on and back off by request. The harness reseeds before each test. I did not touch `rebind.yaml` or anything outside `tests/adapters/new/`.

## Fix turn

I fixed both compile errors in `tests/adapters/new/index.ts` and changed nothing else. I couldn't run the type check myself because the session refused permission to run `tsc`, so neither fix has been confirmed by a compile. I checked the helper signatures by reading them instead.

For the error at line 1327, the `readPageByRequest` member of the content-request page took an `input` parameter with no type. I declared it as `input?: unknown`, the same way the other members in the file take their input. The helpers it feeds into (`given`, `textOf`, `record`) all accept `unknown`.

For the error at line 1585, the page-not-found helper `notHere` has its own `params` argument, a map from each route parameter to the seed groups it is looked up in. The `open()` function it builds also named its argument `params`, which hid the outer one. So the `params[name]` lookup was reading the caller's optional values instead of the seed-group map. I renamed the inner argument to `openParams`, so the lookup now uses the seed-group map as intended and the caller's values still go through `supplied`. What each page opens and what it binds is otherwise unchanged. `bindings.yaml` did not change.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on the new target, and nothing else? Mostly yes. The diff touches only tests/adapters/new, the runner's typecheck of adapters/new passes with no diagnostics, the bindings locate and read without asserting, and the unbound reasons for missing routes are grounded in what was walked. One binding is wrong in a way that rules out a criterion this proposal names. In tests/adapters/new/index.ts every reading on the profile-completion page (user-sign-up-complete), termsCheckbox included, goes through onSignUpForm(), which throws 'unbound' whenever the browser is not on /sign-up/complete, whether it went to /dashboard or to /sign-in?redirectOnSuccess. R-4.23 requires exactly those redirects, for a vendor who agreed before, a non-vendor and a signed-out visitor, and three of the four tests in tests/acceptance/users/R-4.23.spec.ts (lines 32, 45 and 57) read termsCheckbox() after the redirect and expect it to be empty. As bound, those tests report the application as missing a surface even when it behaves correctly, so the unbound reason is not real. The adapter already does this correctly for userProfileSelf.signInRequired, which reads the redirect instead of refusing. Returned to fix that binding. The owed build-stage conditions (build-slice-2-5#1, build-slice-2-8#2) are not settled by an adapter change and stay open. I would approve once the form's readings return empty when the browser was redirected away and its actions stay unbound.

**Conditions:**
- tests/adapters/new/index.ts, user-sign-up-complete: when /sign-up/complete redirects the browser away (to /dashboard for an account that is not a vendor still to agree, or to /sign-in?redirectOnSuccess=... for a signed-out visitor), the form's readings (terms_checkbox, name_field, email_field, job_title_field, idp_username_readonly, complete_disabled_until_terms_accepted, field_error) must return empty rather than throw 'unbound', because the form not being shown is exactly what R-4.23 says those people should see. Keep the actions (accept_app_terms, toggle_new_opportunity_notifications, complete_profile, change_avatar) reporting unbound with where the browser was sent. Record the change against these members in tests/adapters/new/bindings.yaml.

### Runner-owned typecheck evidence

Proposal revision: `8d86c3081c42bafec338a0268ec3f3e6b056681b`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
