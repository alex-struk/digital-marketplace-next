-- A Sprint With Us opportunity whose proposal deadline has already passed, with an
-- evaluation panel and three submitted proposals against it.
--
-- Why this is seeded rather than built through the pages. The application closes a
-- published opportunity when its proposal deadline passes, and the form that creates one
-- refuses a deadline earlier than four in the afternoon on the day it is filled in. A
-- test acting through the pages therefore cannot reach a closed opportunity except by
-- running late in the day, which makes the clock decide whether the suite passes.
-- Everything behind a closure goes with it: individual scoring, consensus, screening,
-- ranking and an award. An interface will not create the past, so the past is written
-- here instead.
--
-- What is seeded is the condition, not the outcome. The opportunity is PUBLISHED and its
-- deadline is thirty days ago; the proposals are SUBMITTED. Nothing here is in an
-- evaluation state. The application's own hook — which runs in front of the resource
-- routes under /api and in front of /status, and which the oracle throttles to zero —
-- moves the opportunity to EVAL_QUESTIONS_INDIVIDUAL, moves each submitted proposal to
-- UNDER_REVIEW_QUESTIONS, and gives each proposal its anonymous name. The anonymous names
-- are deliberately left empty here: they are the application's work, and a test that
-- reads "Proponent 1" is reading what the application decided.
--
-- Dates are relative to when the seed is applied, because "already lapsed" has to stay
-- true however long after this file was written the seed runs.
--
-- The panel is two people, and that is an oracle limit rather than a choice. Consensus
-- begins only when every evaluator on the panel has submitted, so a panel member no
-- sign-in route reaches would stop the whole of consensus from being testable. The oracle
-- has exactly two public sector sign-ins, so the panel is the government account as an
-- evaluator and the administrator account as chair. The administrator is also an
-- evaluator, because a two-person panel whose chair does not score has one evaluator and
-- the criteria describe two. The criteria that turn on a chair who is not an evaluator,
-- or on two evaluators beside a separate chair, are unreachable on the oracle for the
-- same reason the second staff member is.

INSERT INTO "swuOpportunities" ("id", "createdAt", "createdBy")
VALUES
  ('00000000-0000-4000-8000-000000000701', now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102');

INSERT INTO "swuOpportunityVersions"
  ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
   "remoteDesc", "location", "totalMaxBudget", "minTeamMembers", "mandatorySkills",
   "optionalSkills", "description", "proposalDeadline", "assignmentDate",
   "questionsWeight", "codeChallengeWeight", "scenarioWeight", "priceWeight")
VALUES
  ('00000000-0000-4000-8000-000000000711', now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000701',
   'Seeded closed Sprint With Us opportunity',
   'A Sprint With Us opportunity whose deadline has passed and which has proponents to evaluate.',
   TRUE, 'This work may be done from anywhere in the province.', 'Victoria',
   500000, 1,
   '{"Backend Development","Delivery Management"}',
   '{"Frontend Development"}',
   'The full description of the seeded closed Sprint With Us opportunity.',
   now() - INTERVAL '30 days', now() - INTERVAL '20 days',
   25, 40, 15, 20);

-- One phase. Inception and prototype are optional; implementation is not, and the
-- notification the closing hook sends reads the implementation phase, so it is the phase
-- a seeded opportunity cannot do without.
INSERT INTO "swuOpportunityPhases"
  ("id", "opportunityVersion", "phase", "startDate", "completionDate", "maxBudget",
   "createdAt", "createdBy")
VALUES
  ('00000000-0000-4000-8000-000000000721', '00000000-0000-4000-8000-000000000711',
   'IMPLEMENTATION', now() - INTERVAL '10 days', now() + INTERVAL '120 days', 500000,
   now() - INTERVAL '60 days', '00000000-0000-4000-8000-000000000102');

INSERT INTO "swuPhaseCapabilities"
  ("phase", "capability", "fullTime", "createdAt", "createdBy")
VALUES
  ('00000000-0000-4000-8000-000000000721', 'Backend Development', TRUE,
   now() - INTERVAL '60 days', '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000721', 'Delivery Management', FALSE,
   now() - INTERVAL '60 days', '00000000-0000-4000-8000-000000000102');

-- Four questions, because several criteria describe an evaluator working through four
-- questions for each of three proponents. The last one carries a minimum score, which is
-- what the screening rule turns on.
INSERT INTO "swuTeamQuestions"
  ("opportunityVersion", "question", "guideline", "score", "wordLimit", "order",
   "createdAt", "createdBy", "minimumScore")
VALUES
  ('00000000-0000-4000-8000-000000000711', 'Seeded team question one.',
   'Answer in your own words.', 5, 300, 0, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', NULL),
  ('00000000-0000-4000-8000-000000000711', 'Seeded team question two.',
   'Answer in your own words.', 5, 300, 1, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', NULL),
  ('00000000-0000-4000-8000-000000000711', 'Seeded team question three.',
   'Answer in your own words.', 5, 300, 2, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', NULL),
  ('00000000-0000-4000-8000-000000000711', 'Seeded team question four.',
   'Answer in your own words.', 5, 300, 3, now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', 3);

INSERT INTO "swuEvaluationPanelMembers"
  ("opportunityVersion", "user", "chair", "evaluator", "order")
VALUES
  ('00000000-0000-4000-8000-000000000711', '00000000-0000-4000-8000-000000000102',
   FALSE, TRUE, 0),
  ('00000000-0000-4000-8000-000000000711', '00000000-0000-4000-8000-000000000101',
   TRUE, TRUE, 1);

-- The opportunity as it stands: created as a draft, then published. The deadline is in
-- the past, so the application's own hook takes it from here.
INSERT INTO "swuOpportunityStatuses"
  ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
VALUES
  ('00000000-0000-4000-8000-000000000731', now() - INTERVAL '60 days',
   '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000701',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000732', now() - INTERVAL '59 days',
   '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000701',
   'PUBLISHED', NULL, NULL);

-- Three proposals, one from each qualified organization, each submitted before the
-- deadline. anonymousProponentName is left at its default of the empty string: the
-- application writes it when it closes the opportunity.
INSERT INTO "swuProposals"
  ("id", "createdAt", "createdBy", "updatedAt", "updatedBy", "challengeScore",
   "scenarioScore", "priceScore", "opportunity", "organization")
VALUES
  ('00000000-0000-4000-8000-000000000741', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000202', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000202', NULL, NULL, NULL,
   '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000301'),
  ('00000000-0000-4000-8000-000000000742', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000211', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000211', NULL, NULL, NULL,
   '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000305'),
  ('00000000-0000-4000-8000-000000000743', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000212', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000212', NULL, NULL, NULL,
   '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000306');

INSERT INTO "swuProposalStatuses"
  ("id", "createdAt", "createdBy", "proposal", "status", "event", "note")
VALUES
  ('00000000-0000-4000-8000-000000000761', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000741',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000762', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000741',
   'SUBMITTED', NULL, NULL),
  ('00000000-0000-4000-8000-000000000763', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000742',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000764', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000742',
   'SUBMITTED', NULL, NULL),
  ('00000000-0000-4000-8000-000000000765', now() - INTERVAL '50 days',
   '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000743',
   'DRAFT', NULL, NULL),
  ('00000000-0000-4000-8000-000000000766', now() - INTERVAL '40 days',
   '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000743',
   'SUBMITTED', NULL, NULL);

INSERT INTO "swuProposalPhases" ("id", "proposal", "phase", "proposedCost")
VALUES
  ('00000000-0000-4000-8000-000000000751', '00000000-0000-4000-8000-000000000741',
   'IMPLEMENTATION', 420000),
  ('00000000-0000-4000-8000-000000000752', '00000000-0000-4000-8000-000000000742',
   'IMPLEMENTATION', 460000),
  ('00000000-0000-4000-8000-000000000753', '00000000-0000-4000-8000-000000000743',
   'IMPLEMENTATION', 380000);

INSERT INTO "swuProposalTeamMembers" ("member", "phase", "scrumMaster")
VALUES
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000751', TRUE),
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000752', TRUE),
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000753', TRUE);

INSERT INTO "swuProposalReferences" ("proposal", "order", "name", "company", "phone", "email")
VALUES
  ('00000000-0000-4000-8000-000000000741', 0, 'Reference One Placeholder', 'Placeholder Ministry', '250-555-0201', 'reference.one@example.test'),
  ('00000000-0000-4000-8000-000000000741', 1, 'Reference Two Placeholder', 'Placeholder Ministry', '250-555-0202', 'reference.two@example.test'),
  ('00000000-0000-4000-8000-000000000741', 2, 'Reference Three Placeholder', 'Placeholder Ministry', '250-555-0203', 'reference.three@example.test'),
  ('00000000-0000-4000-8000-000000000742', 0, 'Reference One Placeholder', 'Placeholder Ministry', '250-555-0204', 'reference.four@example.test'),
  ('00000000-0000-4000-8000-000000000742', 1, 'Reference Two Placeholder', 'Placeholder Ministry', '250-555-0205', 'reference.five@example.test'),
  ('00000000-0000-4000-8000-000000000742', 2, 'Reference Three Placeholder', 'Placeholder Ministry', '250-555-0206', 'reference.six@example.test'),
  ('00000000-0000-4000-8000-000000000743', 0, 'Reference One Placeholder', 'Placeholder Ministry', '250-555-0207', 'reference.seven@example.test'),
  ('00000000-0000-4000-8000-000000000743', 1, 'Reference Two Placeholder', 'Placeholder Ministry', '250-555-0208', 'reference.eight@example.test'),
  ('00000000-0000-4000-8000-000000000743', 2, 'Reference Three Placeholder', 'Placeholder Ministry', '250-555-0209', 'reference.nine@example.test');

-- One answer per question per proposal. No score is recorded against any of them: scoring
-- is what the evaluation criteria are about, and a scored response is the outcome rather
-- than the condition.
INSERT INTO "swuTeamQuestionResponses" ("proposal", "order", "response")
VALUES
  ('00000000-0000-4000-8000-000000000741', 0, 'The first proponent''s answer to question one.'),
  ('00000000-0000-4000-8000-000000000741', 1, 'The first proponent''s answer to question two.'),
  ('00000000-0000-4000-8000-000000000741', 2, 'The first proponent''s answer to question three.'),
  ('00000000-0000-4000-8000-000000000741', 3, 'The first proponent''s answer to question four.'),
  ('00000000-0000-4000-8000-000000000742', 0, 'The second proponent''s answer to question one.'),
  ('00000000-0000-4000-8000-000000000742', 1, 'The second proponent''s answer to question two.'),
  ('00000000-0000-4000-8000-000000000742', 2, 'The second proponent''s answer to question three.'),
  ('00000000-0000-4000-8000-000000000742', 3, 'The second proponent''s answer to question four.'),
  ('00000000-0000-4000-8000-000000000743', 0, 'The third proponent''s answer to question one.'),
  ('00000000-0000-4000-8000-000000000743', 1, 'The third proponent''s answer to question two.'),
  ('00000000-0000-4000-8000-000000000743', 2, 'The third proponent''s answer to question three.'),
  ('00000000-0000-4000-8000-000000000743', 3, 'The third proponent''s answer to question four.');
