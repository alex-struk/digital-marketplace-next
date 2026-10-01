# 0027 · Announcing changed terms

- Status: accepted for the build (slice 6)
- Date: 2026-09-30

## Decision

**The address.** `POST /api/emailNotifications` with `{ "tag": "updateTerms" }`, the one action
the contract gives it (`app/backend/src/notifications/`). The boundary refuses any other tag.

**Who may.** An administrator only. Anybody else is refused with **400**, a signed-in public
sector employee or vendor and a visitor alike. The refusal comes in the one shape every refusal
takes: `{ "errors": ["Only an administrator may announce changed terms."] }`. The contract
names 400 for "the requester is not an administrator" and lists no other refusal, so this
address keeps to the contract. It does not borrow the 401 that the page requests answer with
(0025).

**What it does, and in what order.** First it withdraws every vendor's standing acceptance
(`users.acceptedTermsAt` is set to null). That covers deactivated vendors too. The
`lastAcceptedTermsAt` column is left alone (R-4.16). As soon as that update is committed it
answers `200 { "tag": "updateTerms", "withdrawn": <count> }`, with nothing else awaited in
between. Only after the answer does it read the active vendors and hand their messages to
`Mailer.sendEach` (R-6.24). If the active vendors cannot be read, that is logged, and the
withdrawal and the answer stand. Each active vendor gets a message of their own,
addressed to them and sent one after another. Because each message has one recipient, nobody
sees anybody else's address and there is nothing to blind-copy. A vendor with no address is
skipped. A vendor the mail server refuses or cannot be reached for is logged and passed over,
and the rest still go (R-6.28). Nothing reports how delivery went (R-6.2).

**The message** (`mail/notifications/terms-updated.ts`). The subject is "The Digital Marketplace
terms and conditions have changed". The message names all three programs: "Code With Us,
Sprint With Us or Team With Us" (R-6.18). Its action, "Read and accept the new terms", links to
`/users/me?tab=legal`. A visitor who follows it is asked to sign in and then brought back. The
new-opportunity choice does not govern this message, so it ends with "Manage your notification
settings" and makes no unsubscribe offer (0022, R-6.16).

**Where it is offered.** The action appears only on the managing screen of the page whose
address is `terms-and-conditions`. The rule is `carriesTermsAnnouncement` in
`rules/content.ts`. That screen is already for administrators only (R-7.13). The service never
lets that page's address change (R-7.25).

**Agreeing again.** This uses the existing `PUT /api/users/{id}` with the tag `acceptTerms`, for
one's own account only. It is refused for anybody else's account, an administrator's included.
Agreeing again when an acceptance already stands is allowed. The legal section shows the warning
whenever a vendor has no standing acceptance. If the vendor has agreed before, the warning says
the terms have changed and gives the date they last agreed. If they never have, it asks them to
agree.

**A vendor who is signed in when the terms change.** The app reads the signed-in account once,
when it starts, and screens are drawn from that copy. An announcement changes the account without
the vendor doing anything, so the legal section asks the service again (`GET /api/users/{id}`)
each time it is opened and holds the answer (`refreshHeldAccount` in `auth/session.ts`). Without
that, a vendor signed in before the announcement was still told "You agreed to the terms and
conditions on …" until the page was reloaded, as if their acceptance stood. The answer is dropped
if the account held has changed while it was on its way, so a fresh agreement saved in the
meantime is never overwritten by the older read. If the service cannot be asked, the copy already
held is kept.

## What would reverse it

- A ruling that a non-administrator should be refused with 401, as page requests are. Then
  `TermsAnnouncement.announce` would throw `UnauthorizedException`.
- A ruling that the announcement should go out as one batch of blind copies rather than one
  message per vendor. Then the `sendEach` call would become a single `send` with `bcc` set.
