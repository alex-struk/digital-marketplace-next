# 0055 · Attachments on Sprint With Us and Team With Us opportunities are built in Slice 15

- Status: proposed (plan revision after the G3 ruling on the build of Slice 14)
- Date: 2026-10-03
- Amends: the line in 0045 "Attaching files to these programs' opportunities … is slice 15's",
  by making it a named deliverable of Slice 15 instead of a remark Slice 15 never carried

## Context

The old application let staff attach files to opportunities in all three programs, and three
accepted criteria depend on it: R-8.19 (an opportunity attachment is uploaded with no read access
recorded on the file, for all three programs alike), R-8.20 (one read rule for files on
opportunities and proposals in all three programs) and R-8.25 (a file is read through what it is
attached to). Slice 7 built attachments for Code With Us and restored that program's attachment
table where the reconstructed baseline lacked it (0029). Slice 10 drew the attachment control on
the Sprint With Us and Team With Us forms but disabled it, saying files cannot be attached to these
programs in this version of the service, because the baseline has no table to keep them in (0036,
0045). 0045 left the work to Slice 15, but Slice 15's deliverables never said so. A G3 ruling on
the build of Slice 14 found R-8.20's Sprint With Us and Team With Us cases unbound for that reason.

## Decision

Slice 15 builds attachments on Sprint With Us and Team With Us opportunities, and R-8.20 is
answered for there, beside R-8.19 and R-8.25.

- **Store.** One Knex migration restores the old application's opportunity attachment table for
  each of the two programs, created only where absent, as 0029 did for
  `cwuOpportunityAttachments` (version, file). The tables and columns are these:

  | Table | Column | Holds |
  | --- | --- | --- |
  | `swuOpportunityAttachments` | `opportunityVersion` | the identifier of a Sprint With Us opportunity version row in the kept baseline, not null, a foreign key to it, deleted with it |
  | | `file` | the identifier of a row in `files`, not null, a foreign key to it |
  | `twuOpportunityAttachments` | `opportunityVersion` | the identifier of a Team With Us opportunity version row in the kept baseline, not null, a foreign key to it, deleted with it |
  | | `file` | the identifier of a row in `files`, not null, a foreign key to it |

  Each table's primary key is the pair (`opportunityVersion`, `file`). A version's rows are the
  files it was saved with, and the current version's rows are the opportunity's attachments.
  The version table each foreign key points at is the one the baseline in `app/migrations/`
  already holds for that program. The builder reads its name there and does not invent one.
  These names are the rebuild's own under 0007's rule for names the seed does not fix: the old
  repository is not in this workspace and no seed record names these tables. If the old
  repository becomes available and spells them differently, a rename migration reconciles them
  and 0007 records it. A database the old application left behind already has the tables and is
  not changed.
- **Service.** `POST` and the `edit` change on `/api/opportunities/{sprint-with-us,team-with-us}`
  take `attachments` (by identifier or file record) the way Code With Us does, refusing a file the
  person may not read (R-8.22). Each version carries the files it was saved with.
- **Read paths.** One read path for each program sits beside `CwuAttachmentReadPath` in the file
  store's `FILE_READ_PATHS` (0021): readable by anyone once the opportunity is publicly visible,
  and by its creator and administrators before then. Team With Us follows R-8.25's rule too,
  because R-8.20 asks for one rule (see "Accepted criteria that pull against each other" in
  `plan/plan.md`). Uploads record no read access on the file (R-8.19).
- **Screens.** The attachment control on both programs' create pages and Opportunity tabs is
  enabled, and the disabled state and its sentence are removed. The public views list the
  attachments as the Code With Us view does.

Slice 10 is not reopened. It is built and approved, and Slice 15 already depends on it.

## What would reverse it

A ruling that the rebuild carries no attachments for these two programs. That would need R-8.19's
and R-8.20's "all three programs" re-authored by the spec. Or a tech-lead ruling that restoring the
tables is a schema change J5 forbids. Then R-8.20's Sprint With Us and Team With Us cases could not
be met, and the criterion would go back to the spec rather than to another slice. The tech lead
has since ruled the other way: restoring the old application's own tables where the baseline lacks
them keeps the schema J5 keeps (recorded in 0002).
