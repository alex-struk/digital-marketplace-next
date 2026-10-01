| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T03:00:07.852Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound the user list for the "new" target.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rebound the user list for the "new" target. All 13 members of the `user-list` page are now marked bound in the adapter and the bindings file. So R-4.14 (the account rows) and R-4.32 (the contact-list export) can be tested again rather than reported unbound. I couldn't compile or run the suite here (see the end), so the adapter is untested apart from the browser checks described below.

**What I found.** The earlier reason was that the administrator gets "Page not found" at /users. That isn't what the target does now. I signed in as the administrator through the identity provider's form and followed the header's "Users" link. /users opens "Digital Marketplace Users": a "Search by name" box, an "Export contact list" button, and one table of all 147 accounts on a single page, with no pager. The columns are Status, Account type, Name and Administrator. Each name links to `/users/<id>`, and the last column reads "Yes" or "No".

Opening /users directly works too, including straight after the sign-in callback, and nothing flashes "Page not found" while it loads. "Page not found" is what a public sector employee is shown there. Signed out, the visitor is sent to `/sign-in?redirectOnSuccess=/users`. So the earlier report most likely came from a session that wasn't the administrator's, or from an earlier build. I can't tell which.

The export dialog has "Account types (required)" with "Public sector employees" and "Vendors", and "Fields (required)" with "First name", "Last name", "Email address" and "Organization name". Every box starts unticked, which is the opposite of the old target. "Export" stays disabled until one type and one field are ticked. Pressing it downloads `dm-contacts-<date>.csv` from `/api/contact-list` and closes the dialog.

**How it's bound.** Everything is found by role, label, visible text or link address:
- **Reading rows:** the whole table is read in one pass. It waits for the first cell, or for the "n of m people shown" line, which only appears while a search is active.
- **Row formats:** each account comes back as "Status | Account type | Name". The administrator column comes back as "Name: Yes/No". Both follow the old target's adapter.
- **Ticking boxes:** the way the criteria name a type or field ("public sector employee", "vendor", "email address") is matched to the dialog's own label. A state the test gives is set; otherwise the box is toggled.
- **Exporting:** `export_contact_list` first ticks whatever types and fields the input lists and unticks the rest of each group. A key that isn't a type or field throws `unbound:`, and a disabled "Export" throws at once, quoting what the dialog says.
- **Opening a profile:** `open_user_profile` finds the account by the seeded identifier in the name link's address, falling back to the visible name.

I checked each of these in the browser: the rows, column mapping and the two administrators (Morgan and Robin Placeholder); search narrowing to one row and to none; the dialog's disabled-then-enabled "Export"; Cancel closing it; the CSV download; and a seeded identifier opening the right profile.

**Two decisions a reviewer may want to question:**
- **Non-administrators:** when /users shows its refusal, the four readers that take their answers from the table (rows, status, account type, administrator) return empty. My reasoning is that the address was reached and nothing is listed to that visitor. Actions there throw `unbound:`, explaining that the list belongs to the administrator.
- **Retry:** because the original report saw "Page not found" for the administrator, `open()` looks once more (after a short wait and a reload) before it believes that answer.

I also corrected the adapter's header comment, which said /users answers "Page not found" to everyone.

**What I couldn't do.** The workspace has no `node_modules`, and installing the pinned toolchain needed approval this session doesn't have, so I could neither compile the adapter nor run the suite. Its types were checked only by reading the code against `strict` mode. I changed nothing outside `tests/adapters/new/`. Every route in surface.yaml that this rebind touches resolves on the target.

## Fix turn

I fixed the eight compile errors in `tests/adapters/new/index.ts`, but I couldn't confirm the fix with the compiler. Running `tsc` from this session needs an approval nobody was here to give, so I checked by hand that every call now reaches a helper that takes the arguments it passes.

**Journal addition:** All eight errors came from one name clash. Inside `create`, a two-argument helper `boxWanted(input, keys)` serves the sign-up, notification and capability checkboxes. A second, one-argument `function boxWanted(input)` was written later for the user-list export dialog. Because that second one was a function declaration, TypeScript reported a duplicate name at lines 3297 and 3713. The single-argument version also became the one the other call sites resolved to, which caused the six "Expected 1 arguments, but got 2" errors at lines 3317, 3321, 3326, 3327, 4064 and 4214. I renamed the export-dialog version to `exportBoxWanted` and pointed its two calls at it: `toggle_export_user_type` (line 3770) and `toggle_export_field` (line 3775). Every remaining `boxWanted` call passes the two arguments that helper expects, and the new name appears nowhere else in the workspace. Nothing else changed: no behaviour, no binding, and not `bindings.yaml`. The `user-list` entries named in the calibration findings (R-4.14, R-4.32) keep the status and reasons from the earlier run, because this run was limited to fixing the compile errors.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Does the new-target adapter bind every user-list action and observation, and nothing else? Approve. The diff touches only tests/adapters/new (bindings.yaml and index.ts) and leaves tests/acceptance unchanged. All 13 user-list members move from unbound to bound, backed by a walk of /users signed in as the administrator: a search box, an 'Export contact list' dialog, and one table of Status, Account type, Name and Administrator. That replaces the stale reason that the administrator was shown 'Page not found'. The bindings only navigate and find things by role, label, text or link address. Readers return what the page shows. The only throws are an 'Export' button that cannot be pressed and an input key the dialog does not offer, so no binding decides whether a test passes. Read against the R-4.14 and R-4.32 tests, every call they make is bound, and the names they pass ('public sector employee', 'vendor', 'email address', search text) reach the dialog's labels and the search box. The runner's own typecheck of this revision passed with no diagnostics under adapters/new, which covers the author's inability to compile. The fix-turn rename to exportBoxWanted removes the duplicate helper without changing behaviour. The two choices the author flagged, empty readers for a non-administrator and one reload before trusting 'Page not found', are reasonable and decide no outcome. The egress failures are in other slices' files that this proposal does not touch. The ruling would change to a return if a run showed /users still refused to the administrator, or a dialog label the adapter's mapping does not reach.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `6f03af4c2bbe5dd716792faedd90df76a6f0842b`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
