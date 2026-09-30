| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T23:09:41.065Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I could not compile the adapter: TypeScript isn't installed in this workspace, and I wasn't allowed to install it or run `node --check`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've re-walked the screens the ruling named, signed in as each relevant persona, and replaced their stale reasons in `tests/adapters/new/bindings.yaml` and `tests/adapters/new/index.ts`. I could not compile the adapter: TypeScript isn't installed in this workspace, and I wasn't allowed to install it or run `node --check`. The edits were checked by reading only.

**Signing in works.** The provider's form accepted the sandbox password for every persona I tried. The running build shows a signed-in person only three things:
- `/dashboard`, which reads "Dashboard" over "You are signed in as <name>." and nothing else;
- their own profile, at `/users/me` or at their own `/users/<id>`;
- `/sign-up/complete`, and only to a vendor who hasn't completed a profile yet.

Everything else I opened while signed in as the administrator or a vendor answered "Page not found". That includes the create, edit and view pages for opportunities, proposals and organizations, the content-management and evaluation pages, `/users`, and another account's `/users/:userId` (even for the administrator). It also includes `/opportunities`, `/organizations` and `/proposals`, which earlier binding sessions saw working while signed out. `/admin/email-notification-reference` answers 404 "Cannot GET". So no page's route in `surface.yaml` failed to resolve for a reason specific to this revision; the build simply serves very little behind a session.

**What the ruling asked about:**
- **`/dashboard` (both dashboard pages, including `my_proposals_table` for R-4.23):** a vendor who wrote a seeded proposal sees the same bare greeting as everyone else. The readings (tables, status, empty-list messages) are now bound: they reach the dashboard and correctly return empty. The actions (`create_opportunity`, `open_opportunity`, `show_my_proposals`, `show_org_proposals`) are unbound because there is nothing to press. After the send-on to `/sign-up/complete`, the vendor-dashboard readings also return empty; the vendor-dashboard actions report unbound.
- **`/users/:userId` (including `status_badge` for R-6.28):** it opens only for the signed-in person's own identifier. There it shows "Account type", "Status: Active", "Account ID", read-only name and email boxes, and a Permissions section for public sector staff. It has no edit, save, picture, deactivate, reactivate or administrator controls. A test in which the administrator reads another person's status gets "Page not found", reported as unbound.
- **Own profile status (R-4.1 read `''`):** every account that reached `/users/me` showed "Status: Active", including a first-time public sector employee. A first-time vendor, and the vendor still to complete a profile, are sent from `/users/me` (and from `/dashboard`) to "Complete Your Profile". The adapter used to read that form and return `''`. It now throws a plain error saying the person was sent there — a real result, not unbound — and waits for the "Status:" line before reading.
- **Profile-completion form (R-4.3 read `''`):** the form appears for a first-time vendor, with name and email filled in from the identity provider. A first-time public sector employee is sent straight to `/dashboard` and never sees it, so readings for that persona return `''` by design. That looks like target behaviour, not an adapter fault. I also made `signIn` wait until the page stops redirecting after the identity provider hands back, since a reading taken too early could land on the wrong page.

**Other account pages, found along the way:**
- **Profile sections are links, not tabs.** The adapter now follows them. The Capabilities and Organizations links just redraw the Profile section, so the capabilities and organization-membership pages (own and by id) stay unbound, with that as the reason.
- **Notifications and Legal sections are now bound**, both at `/users/me` and at one's own `/users/<id>`.
- **The "Email me when new opportunities are posted" box does nothing** when pressed: no change, no dialog, nothing sent to the service. The toggle now says so at once instead of appearing to succeed. The unsubscribe confirm and cancel actions are unbound, and so is the unsubscribe landing page, which shows no dialog.
- **The vendor whose terms were reset gets no warning and no accept control**, so `accept_updated_terms` and its confirmation are unbound.
- **A deactivated vendor's sign-in ends on `/notice/authFailure`.**

**Wording for everything else:** the other stale reasons that said the password couldn't be used now say what I actually saw signed in, which is "Page not found" for all of them.

**Not done:**
- I did not re-send the service-request pages while signed in. A comment in the adapter now says so.
- I did not re-walk the signed-out bindings that were accepted earlier, even though `/opportunities` now answers "Page not found" to signed-in people.

**Side effect on the target:** signing in as the first-time vendor and first-time public sector employee created their accounts on the running target. Those two personas are no longer "first-time" there until the seed is reloaded.

Nothing outside `tests/adapters/new/` was changed. No password or environment value appears in either file.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the adapter for the new app bind every action and reading, and nothing else? Approved. This revision does what the G3 ruling on build-slice-2-12 asked. It signs in as each persona and walks the screens that ruling named. The dashboard readings, including the vendor proposals table R-4.23 reads, are bound and return empty on a dashboard that shows only a greeting. The profile status that R-6.28 and R-4.1 read and the profile-completion form R-4.3 reads are bound. Another account's /users/:userId answers 'Page not found' even to the administrator, so it stays unbound with that reason. Every reason that said the sandbox password could not be used has been replaced; a search of tests/adapters/new on the branch finds none left. The remaining unbound reasons name what the running build actually shows (Page not found, profile section links that redraw the Profile section, a notifications box that does nothing, no control to accept updated terms), which meets the standard for a real reason. The adapter stays an adapter: it has no expect calls and nothing under tests/acceptance changed. The profile readings raise a plain error when the person is sent to /sign-up/complete, and the notifications toggle fails when pressing the box changes nothing. Both report that the page never arrived or the press had no effect; neither judges an outcome. The runner's typecheck on this revision passed with no errors in adapters/new, which covers the author's inability to compile. This proposal does not settle build-slice-2-12#3, which is owed by build; it stays open. R-6.28 reaching another person's profile is already filed with plan. What would change this ruling: a re-walk of the screens signed out, or of the service requests while signed in, showing a bound member that no longer reaches its target.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cfd18b22a5f25d735c3fafe5dcf510e181b5e33e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
