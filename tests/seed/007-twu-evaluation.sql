-- A Team With Us opportunity whose proposal deadline has already passed, with an
-- evaluation panel and three submitted proposals against it.
--
-- The same reasoning as 006-swu-evaluation.sql, for the other program that has an
-- evaluation panel: the deadline cannot be put in the past through the form, so the
-- opportunity is written here already lapsed and the application is left to close it.
-- What is seeded is PUBLISHED with a deadline thirty days ago and three SUBMITTED
-- proposals; the move to EVAL_QUESTIONS_INDIVIDUAL, the move of each proposal to
-- UNDER_REVIEW_QUESTIONS and the anonymous proponent names are the application's work.
--
-- Several criteria describe one Sprint With Us and one Team With Us opportunity each
-- closing with proponents to evaluate at the same time, which is why both are here rather
-- than one standing in for both.

INSERT INTO "twuOpportunities" ("id", "createdAt", "createdBy")
VALUES
  ('00000000-0000-4000-8000-000000000801', now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102');

INSERT INTO "twuOpportunityVersions"
  ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
   "remoteDesc", "location", "maxBudget", "description", "proposalDeadline",
   "assignmentDate", "startDate", "completionDate",
   "questionsWeight", "challengeWeight", "priceWeight")
VALUES
  ('00000000-0000-4000-8000-000000000811', now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000801',
   'Seeded closed Team With Us opportunity',
   'A Team With Us opportunity whose deadline has passed and which has proponents to evaluate.',
   TRUE, 'This work may be done from anywhere in the province.', 'Victoria',
   300000,
   'The full description of the seeded closed Team With Us opportunity.',
   now() - INTERVAL '30 days', now() - INTERVAL '20 days',
   now() - INTERVAL '10 days', now() + INTERVAL '120 days',
   30, 40, 30);

-- One resource. Its service area is chosen by name, because the numbering of the
-- service-area rows is a migration detail, and all three proponent organizations are
-- approved for it.
INSERT INTO "twuResources"
  ("id", "serviceArea", "opportunityVersion", "targetAllocation", "mandatorySkills",
   "optionalSkills", "order")
VALUES
  ('00000000-0000-4000-8000-000000000821',
   (SELECT "id" FROM "serviceAreas" WHERE "serviceArea" = 'FULL_STACK_DEVELOPER'),
   '00000000-0000-4000-8000-000000000811', 100,
   '{"Backend Development","Frontend Development"}',
   '{"Delivery Management"}',
   0);

-- Four questions, the last carrying a minimum score, for the same reason as the Sprint
-- With Us opportunity's four.
INSERT INTO "twuResourceQuestions"
  ("opportunityVersion", "question", "guideline", "score", "wordLimit", "order",
   "createdAt", "createdBy", "minimumScore")
VALUES
  ('00000000-0000-4000-8000-000000000811', 'Seeded resource question one.',
   'Answer in your own words.', 5, 300, 0, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', NULL),
  ('00000000-0000-4000-8000-000000000811', 'Seeded resource question two.',
   'Answer in your own words.', 5, 300, 1, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', NULL),
  ('00000000-0000-4000-8000-000000000811', 'Seeded resource question three.',
   'Answer in your own words.', 5, 300, 2, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', NULL),
  ('00000000-0000-4000-8000-000000000811', 'Seeded resource question four.',
   'Answer in your own words.', 5, 300, 3, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', 3);

INSERT INTO "twuEvaluationPanelMembers"
  ("opportunityVersion", "user", "chair", "evaluator", "order")
VALUES
  ('00000000-0000-4000-8000-000000000811', '00000000-0000-4000-8000-000000000102',
   FALSE, TRUE, 0),
  ('00000000-0000-4000-8000-000000000811', '00000000-0000-4000-8000-000000000101',
   TRUE, TRUE, 1);

INSERT INTO "twuOpportunityStatuses"
  ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
VALUES
  ('00000000-0000-4000-8000-000000000831', now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000801',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000832', now() - INTERVAL '59 days',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000801',
   'PUBLISHED', NULL, NULL);

INSERT INTO "twuProposals"
  ("id", "createdAt", "createdBy", "updatedAt", "updatedBy", "challengeScore",
   "priceScore", "opportunity", "organization")
VALUES
  ('00000000-0000-4000-8000-000000000841', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000202', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000202', NULL, NULL,
   '00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000301'),
  ('00000000-0000-4000-8000-000000000842', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000211', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000211', NULL, NULL,
   '00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000305'),
  ('00000000-0000-4000-8000-000000000843', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000212', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000212', NULL, NULL,
   '00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000306');

INSERT INTO "twuProposalStatuses"
  ("id", "createdAt", "createdBy", "proposal", "status", "event", "note")
VALUES
  ('00000000-0000-4000-8000-000000000861', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000841',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000862', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000841',
   'SUBMITTED', NULL, NULL),
  ('00000000-0000-4000-8000-000000000863', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000842',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000864', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000842',
   'SUBMITTED', NULL, NULL),
  ('00000000-0000-4000-8000-000000000865', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000843',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000866', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000843',
   'SUBMITTED', NULL, NULL);

INSERT INTO "twuProposalMember" ("member", "proposal", "hourlyRate", "resource")
VALUES
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000841', 120,
   '00000000-0000-4000-8000-000000000821'),
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000842', 135,
   '00000000-0000-4000-8000-000000000821'),
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000843', 110,
   '00000000-0000-4000-8000-000000000821');

INSERT INTO "twuResourceQuestionResponses" ("proposal", "order", "response")
VALUES
  ('00000000-0000-4000-8000-000000000841', 0, 'The first proponent''s answer to question one.'),
  ('00000000-0000-4000-8000-000000000841', 1, 'The first proponent''s answer to question two.'),
  ('00000000-0000-4000-8000-000000000841', 2, 'The first proponent''s answer to question three.'),
  ('00000000-0000-4000-8000-000000000841', 3, 'The first proponent''s answer to question four.'),
  ('00000000-0000-4000-8000-000000000842', 0, 'The second proponent''s answer to question one.'),
  ('00000000-0000-4000-8000-000000000842', 1, 'The second proponent''s answer to question two.'),
  ('00000000-0000-4000-8000-000000000842', 2, 'The second proponent''s answer to question three.'),
  ('00000000-0000-4000-8000-000000000842', 3, 'The second proponent''s answer to question four.'),
  ('00000000-0000-4000-8000-000000000843', 0, 'The third proponent''s answer to question one.'),
  ('00000000-0000-4000-8000-000000000843', 1, 'The third proponent''s answer to question two.'),
  ('00000000-0000-4000-8000-000000000843', 2, 'The third proponent''s answer to question three.'),
  ('00000000-0000-4000-8000-000000000843', 3, 'The third proponent''s answer to question four.');
