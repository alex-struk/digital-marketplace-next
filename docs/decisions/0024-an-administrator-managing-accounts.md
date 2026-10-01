# 0024 · An administrator managing accounts: refusals, the export's shape, and the messages

- Status: accepted for the build (slice 4)
- Date: 2026-09-30

## Decision

**Who is refused, and how.** `GET /api/users` and `GET /api/contact-list` answer an
administrator alone. Anyone else — a public sector employee who is not one, a vendor, a visitor —
is refused **401** with the one refusal shape (`{ "errors": [...] }`, decision record 0010) and no
account in it (R-4.21, R-4.32). 401 is what the contract names for the contact list, and what
R-4.25 already answers for somebody else's account, so the three read the same. For the contact
list, who is asking is settled before the lists are read, so a refusal says nothing about how the
request was made. The `/users` screen asks only when the viewer is an administrator; anyone else
is shown the missing page, as design/DESIGN.md's gap 2 has it.

The administrator's changes — `PUT /api/users/{id}` with `reactivateUser` or
`updateAdminPermissions`, and `DELETE /api/users/{id}` on somebody else's account — are refused
**403** to anyone else, as a change to somebody else's account already was in slice 3. A refusal
about the account itself is **400**, in words a person can read: "Vendors cannot be granted
administrator permissions." (R-4.12), "This account is already inactive." (R-4.31), and, for a
reactivation of an account its owner deactivated, that its owner reactivates it by signing in
again (R-4.19). The profile shows the service's reason as the alert's title.

**Administrator rights** change the account's kind between `GOV` and `ADMIN` at once. The person
still signs in with the same government identity, which is looked up among both kinds, so they
are an administrator from their next request. A vendor is refused whichever way the box is
pressed. An administrator may withdraw their own rights through the service, as R-4.12's note
says the old one allowed; the profile offers no box on one's own profile.

**Deactivation by an administrator** marks the account `INACTIVE_ADMIN` with the date and the
administrator; the administrator's own session goes on. An administrator deactivating their own
account through the service is accepted and treated as deactivating one's own (`INACTIVE_USER`,
session ended), because R-4.31 says the service accepts it and only the interface withholds the
control. That asymmetry is kept on purpose (plan.md, R-4.31 against R-5.9).

**Reactivation by an administrator** makes the account active and keeps the record of when it
was deactivated, as signing in again keeps it (0023). The person is sent the message saying an
administrator reactivated it (R-4.20); the message saying they reactivated it themselves is sent
only from sign-in.

**The messages** for an administrator's deactivation and reactivation name whom to write to with
questions. That address is the new setting `CONTACT_EMAIL`, defaulting to the invented
`digitalmarketplace@example.test`; no real address is written anywhere.

**The contact list** is `text/csv`, offered as an attachment named `dm-contacts-YYYY-MM-DD.csv`.
`userTypes` takes `GOV` and `VENDOR`, and `fields` takes `firstName`, `lastName`, `email` and
`organizationName`, comma-separated, in any case and order; the columns always follow that order.
Headings are "Account Type", "First Name", "Last Name", "Email" and "Organization Name"; the kind
column appears only when both kinds were chosen, and reads "Public Sector Employee",
"Administrator" or "Vendor". A name is split at its first space. A person's organizations — active
organizations, current memberships only — are joined with "; " into one field. The specification
fixes none of these spellings; they are the rebuild's.

The contract's validator would refuse a literal comma in those two parameters unless written
`%2C`. The old service took them as written, and observables.yaml writes the address that way, so
the boundary is told to allow it for those two parameters alone (`withContactListsAsWritten`).

**The first administrator** (R-4.13) has no route in the service. The seed writes one into the
data, and `app/README.md` documents the manual route for an installation without one.

## What would reverse it

- A ruling that a refused list or export is to be answered 403, or 404 so as not to reveal the
  address exists.
- A ruling naming the old export's exact headings, labels or separator.
