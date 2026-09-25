-- Two stored files, each readable only by the person who uploaded it.
--
-- A stored file is two rows: its bytes in "fileBlobs", keyed by a content identifier, and
-- its record in "files", naming the bytes and who stored them. Both are in the database,
-- so a seeded file is one the application serves in full. Who may read it is a third set
-- of rows (public, by account kind, or by named account); neither file here has any, so
-- each is readable by its uploader and by nobody given rights through those rows.
--
-- The content identifier the application computes is a digest of the bytes. These two
-- carry invented identifiers instead, which the application stores and returns without
-- recomputing; the only difference is that uploading the same bytes again would not be
-- recognised as the same content.
--
-- 1. A file only its uploader may read, for the criteria about somebody else naming it
--    as an attachment (R-8.15, R-8.22). Uploaded by test-vendor-6, the file-uploader.
-- 2. A file attached to a Team With Us proposal, for the criterion about the opportunity's
--    owner asking for a proposal's attachment (R-8.9). Uploaded by the organization owner
--    who wrote the seeded Team With Us proposal it is attached to.

INSERT INTO "fileBlobs" ("hash", "blob")
VALUES
  ('seed-content-private-note', convert_to('A private note that only its uploader may read.', 'UTF8')),
  ('seed-content-twu-attachment', convert_to('An attachment to a seeded Team With Us proposal.', 'UTF8'));

INSERT INTO "files" ("id", "name", "createdAt", "createdBy", "fileBlob")
VALUES
  ('00000000-0000-4000-8000-000000000901', 'private-note.txt', TIMESTAMPTZ '2026-01-06 17:00:00+00',
   '00000000-0000-4000-8000-000000000206', 'seed-content-private-note'),
  ('00000000-0000-4000-8000-000000000902', 'team-with-us-proposal-attachment.txt', now() - INTERVAL '45 days',
   '00000000-0000-4000-8000-000000000202', 'seed-content-twu-attachment');

INSERT INTO "twuProposalAttachments" ("proposal", "file")
VALUES ('00000000-0000-4000-8000-000000000841', '00000000-0000-4000-8000-000000000902');
