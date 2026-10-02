# 0044 · A deactivated account is kept out of the mail at delivery

- Status: accepted for the build (slice 9, revision)
- Date: 2026-10-02
- Amends: 0043 (the notice of deactivation was delivered before the deactivation was answered)

## Decision

R-6.17 says a deactivated account receives no notification of any kind. Filtering each list of
recipients when it is drawn up (0043) is kept, and two things are added and one taken away.

**The mailer has the last word.** `Mailer` is given a `RecipientStanding`
(`app/backend/src/mail/prisma-recipient-standing.ts`) and, as each message goes, takes out every
address that is held only by accounts that are not active — whichever way they were deactivated,
whatever the message, and however long ago its recipients were chosen. An address held by an
active account of another kind stays; an address no account holds (the contact address) is
untouched. The only messages exempt are the two telling a person their own account has been
deactivated (`deactivated-own-account`, `deactivated-by-administrator`: R-4.9, R-4.30), listed in
`TOLD_OF_DEACTIVATION`. When the accounts cannot be read the message is not sent and the log says
so (R-6.2): the service does not guess in favour of sending.

**Who is told about an opportunity is settled at the moment of the change.** Cancelling, adding
an addendum and an administrator's edit look their watchers, proponents and author up before the
change is answered, not after it; only the sending follows the answer. An account deactivated or
reactivated a moment after the change is told according to how it stood when the change was made,
and a deactivation that lands between the lookup and the sending is caught by the mailer.

**The notice of deactivation goes after the answer again**, as it did when R-4.9 was first
approved (slice 3). Delivering it before answering (0043) held the deactivation — and the end of
the person's session, which follows it — on the mail server for up to five seconds, which R-4.9's
"ends their session at once" does not allow, and it did not stop the failure R-6.17 was returned
for. `Mailer.sendBeforeAnswering` is removed.

## What would reverse it

A ruling that some message other than the notice of deactivation must still reach a deactivated
account, which would join `TOLD_OF_DEACTIVATION`; or a service run as several instances with its
accounts somewhere the mailer cannot read.
