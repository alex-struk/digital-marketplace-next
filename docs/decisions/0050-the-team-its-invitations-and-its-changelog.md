# 0050 · An organization's team: invitations, memberships and the changelog (slice 12)

- Status: accepted for the build (slice 12)
- Date: 2026-10-03

## Context

Slice 12 builds the management page's Team members and Changelog tabs, the invitation messages,
and accepting, declining and leaving from the person's own organizations section (R-3.6–R-3.15,
R-3.17, R-3.23, R-3.30–R-3.35, R-6.16). The contract names `/api/affiliations` and
`/api/affiliations/{id}` with their methods and the three update tags, and nothing about answers,
refusals, the changelog or where the invitation's two choices land. These are the choices made.

## Decisions

**One route for both lists.** `GET /api/affiliations` answers the requester's own standing
memberships, as slice 11 built it; with `?organization=<id>` it answers that organization's team —
every membership that is active or pending, owner first — to a service administrator and the
owner and organization administrators, and refuses everyone else `401 { "permissions": [...] }`
(R-3.14). An ended membership (`INACTIVE`) is kept but never listed. This replaces 0047's
`400` for `?organization=`.

**A membership is answered as** `{ id, membershipType, membershipStatus, createdAt, user: { id,
name, capabilities }, organization: { id, legalName } }`. `id` is what `PUT` and `DELETE` take,
and what `affiliation-invitation-request` reads as the membership identifier.

**Inviting** (`POST`, `201` with the membership) is checked in this order, each refusal filed
under the field it concerns, as the old service answered validation:

| Check | Answer |
| --- | --- |
| requester is not an administrator, owner or organization administrator | `401 { permissions }` |
| `membershipType` is not `MEMBER` or `OWNER` (R-3.17) | `400 { membershipType: ["Invalid membership type: …"] }` — a type outside the contract's enum is refused by the boundary first, in the `errors` shape |
| the organization is archived | `400 { errors }` |
| the address is not an email address | `400 { userEmail }` |
| nobody registered uses the address (R-3.30) | an invitation to sign up is emailed, then `400 { inviteeNotRegistered }` |
| the account is not a vendor, is not active, or already has an active or pending membership there (R-3.8) | `400 { userEmail }` |

An address held by both a vendor account and a public sector one invites the vendor. The team
tab sends one request per address and always names `MEMBER`; it reports each refused address by
name, each unregistered one as a warning, and a membership-type refusal in its own alert, which
the screen cannot cause but shows if the request is altered on its way (design gap 7, R-3.17).

**Changes** (`PUT`, `200` with the membership):

- `approve` — the invited person, or a service administrator on their behalf (the
  team-administrator story); the owner is refused `401 { permissions: ["Only the invited person
  may accept this membership."] }`. A membership that is not pending is `400 { errors:
  ["Membership is not pending."] }` (R-3.9). The owner and the new member are each emailed (R-3.31).
- `updateAdminStatus` with `value` true or false — by an administrator or the owner or an
  organization administrator, on an active member who is neither the owner nor the requester;
  a requester who may not manage the team is `401`, the other refusals `400 { errors }` (R-3.12).
- `changeOwner` — a service administrator only (`401` otherwise), to an active member who is not
  already the owner (`400`). Every other owner becomes an ordinary member (R-3.13).

**Ending a membership** (`DELETE`, `200` with the membership, now `INACTIVE`): by the member
themselves, the owner or organization administrators, or a service administrator (R-3.10). The
only active owner is refused `400 { errors: ["This is the sole owner for the organization, and
cannot be removed."] }` (R-3.11). The same request is leaving, removing, withdrawing an invitation
and declining one; only the invited person ending their own pending membership is a decline, and
only a decline emails the owner (R-3.32).

**The changelog** is the kept `affiliationEvents` table (`ADMIN_STATUS_GRANTED`,
`ADMIN_STATUS_REVOKED`, `OWNER_STATUS_GRANTED`), written in the same transaction as the change it
records, and answered as `changelog` on the organization's full record — read by the same people
as the team — newest first, each entry with `event`, `createdAt`, `member` and `createdBy`. The
tab shows "Admin Rights Given", "Admin Rights Removed" and, for a transfer, "Ownership
Transferred" naming the new owner (design gap 9's placeholder, kept). Giving rights asks for the
statement to be confirmed first; withdrawing them happens at once (design gap 8). The statement's
words are the design's own, since the spec carries none.

**The invitation message** offers "Accept the invitation" and "Decline the invitation", linking to
`/users/me?tab=organizations&invitation=<membership id>&answer=accept` and `…&answer=decline`. The
address names the membership and the answer, never the reader. Arriving there opens the matching
confirmation once the person's memberships are read; nothing changes until they confirm (R-3.35).
A link naming a membership that is no longer pending says so instead. The message is not governed
by the notice choice, so it ends with the link to notification settings and no offer to
unsubscribe (R-6.16, decision record 0022). The other messages — the invitation to sign up, the
owner's "joined" and "rejected" notices and the member's "joined" notice — end the same way.

## What would reverse it

- The old application's own refusal wording or shapes, if recovered: the screens read any field's
  messages, so only the acceptance suite's request-level steps would change.
- A ruling on design gap 9 naming the transfer differently: the label is one entry in
  `AFFILIATION_EVENT_LABELS`.
