-- Two Code With Us opportunities: one published, one somebody else's draft.
--
-- Scope note. Only the Code With Us program is seeded, and only these two states. Every
-- other opportunity a test needs — a Sprint With Us or Team With Us opportunity, an
-- opportunity at an evaluation stage, one carrying proposals — is built by the test
-- itself through the pages, because those shapes span half a dozen tables apiece
-- (versions, phases, resources, questions, panels, statuses) and a hand-written row set
-- would be a guess about the application's internals rather than a recovered fact. The
-- two below are seeded because almost every criterion in three domains starts from "a
-- published opportunity exists", and because no test can create the second one at all:
-- it belongs to a member of public sector staff the oracle has no way to sign in as.
--
-- The proposal deadline is far in the future on purpose. The application closes a
-- published opportunity whose deadline has passed as a side effect of the next request
-- it serves, so a seeded opportunity with a near deadline would change state before a
-- test could look at it.

INSERT INTO "cwuOpportunities" ("id", "createdAt", "createdBy")
VALUES
  ('00000000-0000-4000-8000-000000000601', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000602', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000103');

INSERT INTO "cwuOpportunityVersions"
  ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
   "remoteDesc", "location", "reward", "skills", "description", "proposalDeadline",
   "assignmentDate", "startDate", "completionDate", "submissionInfo",
   "acceptanceCriteria", "evaluationCriteria")
VALUES
  ('00000000-0000-4000-8000-000000000611', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000601',
   'Seeded published Code With Us opportunity',
   'A published opportunity that exists before any test runs.',
   TRUE, 'This work may be done from anywhere in the province.', 'Victoria', 5000,
   '{"Backend Development","Frontend Development"}',
   'The full description of the seeded published opportunity.',
   TIMESTAMPTZ '2030-06-01 23:59:00+00', TIMESTAMPTZ '2030-06-15 00:00:00+00',
   TIMESTAMPTZ '2030-07-01 00:00:00+00', TIMESTAMPTZ '2030-09-01 00:00:00+00',
   'Submit a link to a public repository.',
   'The work is accepted when the seeded acceptance criteria are met.',
   'Proposals are evaluated against the seeded evaluation criteria.'),

  ('00000000-0000-4000-8000-000000000612', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000602',
   'Seeded draft Code With Us opportunity of another staff member',
   'A draft belonging to a second member of public sector staff.',
   FALSE, '', 'Kamloops', 12000,
   '{"Delivery Management"}',
   'The full description of the seeded draft opportunity.',
   TIMESTAMPTZ '2030-08-01 23:59:00+00', TIMESTAMPTZ '2030-08-15 00:00:00+00',
   TIMESTAMPTZ '2030-09-01 00:00:00+00', NULL,
   'Submit a link to a public repository.',
   'The work is accepted when the seeded acceptance criteria are met.',
   'Proposals are evaluated against the seeded evaluation criteria.');

-- An opportunity's state is the most recent row here, so the published one carries the
-- draft it was created as and the publication that followed.
INSERT INTO "cwuOpportunityStatuses"
  ("id", "createdAt", "createdBy", "opportunity", "status", "note", "event")
VALUES
  ('00000000-0000-4000-8000-000000000621', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000601',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000622', TIMESTAMPTZ '2026-01-05 18:00:00+00',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000601',
   'PUBLISHED', NULL, NULL),
  ('00000000-0000-4000-8000-000000000623', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000602',
   'DRAFT', NULL, NULL);
