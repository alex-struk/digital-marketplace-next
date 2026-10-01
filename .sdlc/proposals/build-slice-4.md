---
gate: G3
question: "Does slice 4 (An administrator can manage people's accounts) do what its criteria say?"
recommendation: "I built slice 4."
opened: 2026-10-01T02:47:29.222Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 4 (An administrator can manage people's accounts) do what its criteria say?

**Recommendation.** I built slice 4.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built slice 4. All ten of its criteria (R-4.4, R-4.12, R-4.13, R-4.14, R-4.19, R-4.20, R-4.21, R-4.30, R-4.31, R-4.32) now have code behind them. `npm --prefix app run check` passes: typechecks plus 15 migration, 275 backend and 146 frontend tests. I did not bring the compose stack up or click through the screens. Docker on this machine is shared with unrelated services and no sandbox password was set. What I did run is the real service over PGlite, with the migrations and every seed file applied, and both production builds.

**How each criterion is reached**
- **List of users (R-4.14):** `/users` shows Status, Account type, Name (linking to the profile) and Administrator. Active accounts come first, then by account type, then by name. Typing in "Search by name" keeps only people whose name contains every typed word, in any order. A "Users" link in the header appears for administrators only.
- **Who may see the list (R-4.21):** `GET /api/users` answers administrators only. Everyone else, visitors included, gets 401 in the usual refusal shape with no account data. The `/users` screen shows anyone else the missing page without asking the service.
- **Contact-list export (R-4.32):** an "Export contact list" dialog has Export disabled until at least one account type and one field are ticked. It fetches `GET /api/contact-list` with the person's token and saves the CSV. The file lists active accounts only, puts administrators in with public sector employees and labels them "Administrator", and fills each vendor's organization from active organizations and current memberships. The account-type column appears only when both types are chosen. Anyone but an administrator gets 401.
- **Administrator rights (R-4.12):** the Administrator box on someone else's profile saves as soon as it is ticked or unticked, switching the account between public sector employee and administrator. For a vendor the service refuses with "Vendors cannot be granted administrator permissions."; the screen shows that and unticks the box.
- **Deactivating someone (R-4.30):** after a confirmation dialog, the account is marked as deactivated by an administrator, with the date and which administrator did it. The person is emailed that an administrator removed their access, with an address to write to.
- **Already inactive, and an administrator's own account (R-4.31):** a second deactivation is refused with "This account is already inactive." An administrator's own profile still offers no deactivate control, but the service accepts the request. The plan asks for that difference between screen and service to be kept on purpose, so I kept it.
- **Reactivating (R-4.19, R-4.20):** Reactivate appears only on an account an administrator deactivated, with the date. An account its owner deactivated instead shows a note that the person comes back by signing in again, and the service refuses a reactivation request for it. Reactivating sends the "an administrator has reactivated your account" message; the "you reactivated it yourself" message still goes out only when the person signs in again.
- **Sign-in refusal (R-4.4):** this already worked from slice 2. I checked it again end to end: a deactivated account is refused, and is let back in once an administrator reactivates it.
- **First administrator (R-4.13):** this criterion says something is absent, so the service has no route for it. The seed writes the first administrator into the data, and `app/README.md` now describes the manual database change for an installation that has none.

**Unit tests**
- `tests/administering-rules.test.ts` covers the shared rules: who may list, ordering, search, administrator rights, when reactivation is allowed, reading the export request, splitting names, and the CSV itself.
- `tests/accounts-service.test.ts` gained a section on the administrator's powers.
- `tests/administering-accounts-end-to-end.test.ts` runs the real service over the seeded database. It covers refusals and their status, the CSV contents, granting and withdrawing rights, a vendor's refusal, both messages arriving at the mail catcher, and sign-in being refused and then restored.
- On the frontend, `tests/administering.test.tsx` covers the list, search, header link, the export dialog's disabled state and the request it sends, every profile control, and accessibility checks on both screens.

**Choices the specification leaves open** (recorded in `docs/decisions/0024`)
- **Status codes:** I chose 401 for the refused list and export, matching what the contract names for the export and what R-4.25 already uses. A non-administrator attempting an administrator's change gets 403.
- **Export file details:** the headings, labels, the "; " between organization names, and the file name `dm-contacts-YYYY-MM-DD.csv` are this build's own spelling.
- **Commas in the export address:** the request validator was refusing a literal comma in the export's two lists, such as `?userTypes=GOV,VENDOR`. That is the form `observables.yaml` writes, so I let those two parameters through as written.
- **Contact address in the emails:** this is a new setting, `CONTACT_EMAIL`. It defaults to the invented `digitalmarketplace@example.test` and is set in compose.

**Other changes to existing behaviour**
- Removing the disabled "not available yet" placeholders from slice 3's profile meant updating one wording assertion in `profile.test.tsx`.
- The note for an owner-deactivated account now follows the `deactivated-by-owner` story, as an info alert with the date.

Nothing in the specification, plan, design or seed needed changing, and I touched none of it. The next slice will find two things still missing:
- The organizations section of a profile is still a placeholder.
- Organization names in the export come from seeded data only, since no screen yet creates organizations (slices 11 and 12).

I removed the installed dependencies and build output before finishing, so `app/` holds only source.
