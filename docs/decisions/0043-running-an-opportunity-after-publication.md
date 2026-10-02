# 0043 · Running an opportunity after publication

- Status: accepted for the build (slice 9)
- Date: 2026-10-02
- Amends: 0029 (`cancel`, `addAddendum` and `addNote` were answered "not available"; `addenda`
  was always empty), 0034 (the counters were read by anyone), 0035 (the interim Sprint With Us and
  Team With Us manage page)

## Decision

**What is kept.** Migration `20261002000001_addenda_and_note_attachments` creates, where absent,
the old application's `cwuOpportunityAddenda`, `swuOpportunityAddenda` and `twuOpportunityAddenda`
(id, opportunity, description, createdAt, createdBy; each goes with its opportunity) and
`cwuOpportunityNoteAttachments` and `swuOpportunityNoteAttachments` (event, file: the history row
recording a note, and a stored file it carries). Team With Us has no note table, as it has no
notes (R-1.33). Prisma was pulled again from the migrated schema. Nothing removes an addendum but
its opportunity going (R-1.32).

**One way of running an opportunity, in all three programs.** `OpportunityRunningService`
(`app/backend/src/opportunities/opportunity-running.service.ts`) does cancelling, addenda, notes,
the reporting figures and who is told, for whichever program, over one store
(`OpportunityRecordsStore`) that keeps each program's tables in a fixed map. The rules it applies
are in `app/backend/src/rules/opportunities.ts`, shared with the screens.

**What `PUT /api/opportunities/<program>/<id>` takes**, besides slice 7's changes for Code With Us:

- `cancel`, with the optional note as `value` (a string, or `{ "note": … }`), up to 1,000
  characters. Only an administrator (401 otherwise, `Only an administrator may cancel an
  opportunity.`). The program's path decides from where (R-1.20): published, an evaluation stage
  or processing; from a draft, under review, awarded or cancelled it is refused 400 in the path's
  words (`An opportunity that is cancelled cannot be made cancelled.`) and nothing changes. The
  change is a `CANCELED` history row carrying the note.
- `addAddendum`, with the words as `value` (a string, or `{ "description": … }`), 1 to 5,000
  characters. The author or an administrator, on anything that is no longer a draft, cancelled and
  awarded included (401 otherwise). It writes the addendum and an `ADDENDUM_ADDED` history row.
- `addNote` (Code With Us and Sprint With Us; the contract offers Team With Us no such tag), with
  `{ "note": …, "attachments": [<file id or file record>, …] }`, 1 to 1,000 characters, from the
  author or an administrator at any point (401 otherwise). Every file must be one the person may
  read (R-8.22). It writes a `NOTE_ADDED` history row with the note, and the files against it.
  A file carried by a note is readable through it by the opportunity's author and administrators
  (`NoteAttachmentReadPath`), and by nobody else.
- Any other tag on Sprint With Us or Team With Us is answered 400 "not yet available": editing
  those programs and moving them through their evaluation stages are slice 10's and later.

**What the answer carries.** Reading one opportunity of any program now answers with `addenda`
(oldest first: `id`, `createdAt`, `createdBy` `{ id, name }`, `description`) to anyone who may read
it. For the author and administrators it also carries `history` — every change of state and
event, newest first, each with `attachments` (file records) — and, once the opportunity has been
published, `reporting`: `{ "numViews", "numWatchers", "numProposals" }` (R-1.30). The counts are
withheld from everyone while it is a draft or under review (R-1.30's note). A proposal counts as
submitted unless it is a draft or withdrawn. The Code With Us list still answers without addenda
and with the stored history, to keep it to one query.

**The counters are read by public sector staff and administrators only.** `GET /api/counters`
now refuses a vendor or a visitor 401 in decision record 0010's shape, as
`spec/contract/surface.yaml` (opportunity-counters) and its story say, and as R-1.30 ("nobody
else can") requires. 0034 had chosen to let anyone read them, and named this as the choice that
could have gone the other way. Adding a view (`PUT`) is still anybody's.

**Who is told** (R-1.35, R-1.36), after the answer, in batches of blind copies as every message to
many is (R-6.8, R-6.15), and never offering to unsubscribe (R-6.16):

- An addendum, or an administrator's edit of a Code With Us opportunity, tells its watchers, the
  authors of its submitted proposals and its author, each address once, in one batched message —
  unless the opportunity is a draft or cancelled, when nobody is told.
- Cancelling tells its watchers and proponents in one batched message, and its author separately
  that the cancellation was actioned; the author is left out of the first.
- Every list of recipients takes only active accounts, so a deactivated account is told nothing
  (R-6.17). Deactivating an account does not touch its watches, so reactivating it finds them
  where they were.
- The notice telling a person their account has been deactivated (R-4.9, R-4.30) is the one
  message that goes to the account once it has stopped being active. How it is sent, and how the
  mailer keeps every other message from such an account, is decision record 0044's (which
  replaces this record's earlier choice of delivering that notice before answering).

**The screens.** The Code With Us manage page offers an administrator "Cancel opportunity" in the
action bar wherever the path permits it, behind the catalogue's `cancel-confirm` dialog with its
optional note; the Addenda tab lists the addenda (each under "Addendum of <day>", with who added
it) and, to the author and administrators, the form that adds one, with the sentence saying it is
permanent and who will be emailed; the History tab lists each note's files against it, but offers
no form for adding a note, because R-1.33 (v2) says no screen of the application does — the
service's `addNote` stays, and the client never sends it; the Summary tab shows the three
reporting figures. The public page lists the addenda without who added them. As 0032 has it for
the opportunity form, the addendum and cancellation text
areas carry no `maxLength`: each states its limit, and an over-long entry is refused naming it
rather than silently cut. The pieces are in `app/frontend/src/screens/opportunity-running.tsx`,
free of any one program.

**The interim Sprint With Us and Team With Us manage page** (0035) gains the same: Cancel
opportunity for an administrator, Summary with the figures, Addenda once it is not a draft, and
History, with no note form on either program. Its program-specific tabs are still slice 10's.

## What this does not decide

- The Proposals tab (R-1.31) and the full report (R-1.40) are other slices'.
- The administrator's message reference page (R-6.13, R-6.19, slice 21) must show the three new
  messages: `<program>-opportunity-updated`, `-cancelled` and `-cancelled-author`, in
  `app/backend/src/mail/notifications/running-opportunity.ts`.

## What would reverse it

A recovered rule that counts are readable by anyone, or that a note's files are readable more
widely than the history they sit in; a ruling that a cancelled opportunity may not take an
addendum (R-1.32 says any opportunity that is no longer a draft may).
