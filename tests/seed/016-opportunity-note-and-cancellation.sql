-- Two Code With Us opportunities: one whose history already carries a private note with a
-- file attached, and one already cancelled.
--
-- 1. The note (R-1.33). The service accepts a note on an opportunity's history and no screen
--    offers a way to add one, so the criterion's question — who may read the note — has no
--    starting point a test can build through the pages. A note is a row in
--    "cwuOpportunityStatuses" carrying the event NOTE_ADDED and no status, plus one row per
--    attached file in "cwuOpportunityNoteAttachments"; that is exactly what the service
--    writes when it accepts one (src/back-end/lib/db/opportunity/code-with-us.ts,
--    addCWUOpportunityNote). Who the service then shows the history to is what the
--    criterion is about, and the seed does not decide it.
--
--    The opportunity is PUBLISHED with a deadline in 2030, so anybody may read the
--    opportunity itself and the hook that closes lapsed opportunities leaves it alone: a
--    reader who is not shown the history is answered with the opportunity and no history,
--    not refused outright.
--
-- 2. The cancellation (R-1.20). Cancelled is final; a request to move a cancelled
--    opportunity anywhere is refused. Cancelling one through the screens first would make
--    every such test depend on the cancel action working, so one is seeded already
--    cancelled — the condition, with the refusal left to the service.
--
-- Identifiers follow 009-code-with-us-stages.sql: 00000000-0000-4000-aNNN-KKKKKKKKKKKK, NNN
-- the opportunity's number, K 1 for the opportunity, 2 its version, 1000 upward its status
-- and history rows. The attached file is 00000000-0000-4000-8000-000000000903, beside the
-- two in 012-files.sql.

INSERT INTO "cwuOpportunities" ("id", "createdAt", "createdBy")
VALUES
  ('00000000-0000-4000-a039-000000000001', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-a040-000000000001', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102');

INSERT INTO "cwuOpportunityVersions"
  ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
   "remoteDesc", "location", "reward", "skills", "description", "proposalDeadline",
   "assignmentDate", "startDate", "completionDate", "submissionInfo",
   "acceptanceCriteria", "evaluationCriteria")
VALUES
  ('00000000-0000-4000-a039-000000000002', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-a039-000000000001',
   'Seeded Code With Us opportunity with a private note',
   'A published opportunity whose history carries a private note.',
   TRUE, 'This work may be done from anywhere in the province.', 'Victoria', 5000,
   '{"Backend Development"}',
   'The full description of the seeded opportunity with a private note.',
   TIMESTAMPTZ '2030-06-01 23:59:00+00', TIMESTAMPTZ '2030-06-15 00:00:00+00',
   TIMESTAMPTZ '2030-07-01 00:00:00+00', TIMESTAMPTZ '2030-09-01 00:00:00+00',
   'Submit a link to a public repository.',
   'The work is accepted when the seeded acceptance criteria are met.',
   'Proposals are evaluated against the seeded evaluation criteria.'),

  ('00000000-0000-4000-a040-000000000002', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-a040-000000000001',
   'Seeded cancelled Code With Us opportunity',
   'A published opportunity that has since been cancelled.',
   TRUE, 'This work may be done from anywhere in the province.', 'Victoria', 5000,
   '{"Frontend Development"}',
   'The full description of the seeded cancelled opportunity.',
   TIMESTAMPTZ '2030-06-01 23:59:00+00', TIMESTAMPTZ '2030-06-15 00:00:00+00',
   TIMESTAMPTZ '2030-07-01 00:00:00+00', TIMESTAMPTZ '2030-09-01 00:00:00+00',
   'Submit a link to a public repository.',
   'The work is accepted when the seeded acceptance criteria are met.',
   'Proposals are evaluated against the seeded evaluation criteria.');

-- The note row carries an event and no status, so the opportunity's status stays the most
-- recent row that has one (PUBLISHED). Its author is the opportunity's author.
INSERT INTO "cwuOpportunityStatuses"
  ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
VALUES
  ('00000000-0000-4000-a039-000000001001', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-a039-000000000001',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-a039-000000001002', TIMESTAMPTZ '2026-01-05 18:00:00+00',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-a039-000000000001',
   'PUBLISHED', NULL, NULL),
  ('00000000-0000-4000-a039-000000001003', TIMESTAMPTZ '2026-01-06 18:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-a039-000000000001',
   NULL, 'NOTE_ADDED', 'Seeded private note: placeholder text for the history visibility check.'),

  ('00000000-0000-4000-a040-000000001001', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-a040-000000000001',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-a040-000000001002', TIMESTAMPTZ '2026-01-05 18:00:00+00',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-a040-000000000001',
   'PUBLISHED', NULL, NULL),
  ('00000000-0000-4000-a040-000000001003', TIMESTAMPTZ '2026-01-07 18:00:00+00',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-a040-000000000001',
   'CANCELED', NULL, 'Seeded cancellation.');

INSERT INTO "fileBlobs" ("hash", "blob")
VALUES ('seed-content-opportunity-note-attachment',
        convert_to('A file attached to a seeded private note on an opportunity.', 'UTF8'));

INSERT INTO "files" ("id", "name", "createdAt", "createdBy", "fileBlob")
VALUES
  ('00000000-0000-4000-8000-000000000903', 'opportunity-note-attachment.txt',
   TIMESTAMPTZ '2026-01-06 17:30:00+00', '00000000-0000-4000-8000-000000000102',
   'seed-content-opportunity-note-attachment');

INSERT INTO "cwuOpportunityNoteAttachments" ("event", "file")
VALUES ('00000000-0000-4000-a039-000000001003', '00000000-0000-4000-8000-000000000903');
