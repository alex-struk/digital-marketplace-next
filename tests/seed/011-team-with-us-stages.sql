-- Team With Us opportunities standing at later stages of evaluation.
--
-- The same reasoning as 010-sprint-with-us-stages.sql, for the other program with an
-- evaluation panel. Three are seeded: one at the questions consensus with five proponents,
-- because a criterion describes the Team With Us cut at the end of the questions as
-- carrying the top three forward, and two at the challenge with the last score still to
-- enter, because criteria turn on what follows that score and one of them changes the
-- opportunity for good. The panel is the
-- one 006 and 007 explain: the government account as an evaluator and the administrator
-- as chair and evaluator.
--
-- Every opportunity has one full-stack developer resource at full allocation and four
-- resource questions scored out of five, the fourth carrying a minimum score of three.
--
-- Identifiers follow 009: 00000000-0000-4000-aNNN-KKKKKKKKKKKK, K being 1 the opportunity,
-- 2 its version, 4 its resource, 100+p proposal p, 1000 upward status rows.

CREATE OR REPLACE FUNCTION pg_temp.sid(n int, k int) RETURNS uuid AS $$
  SELECT ('00000000-0000-4000-a' || lpad(n::text, 3, '0') || '-' || lpad(k::text, 12, '0'))::uuid
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION pg_temp.put_status(tbl text, parent_col text, row_id uuid,
    parent uuid, status text, by_user uuid, at timestamptz, note text) RETURNS void AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO %I ("id", "createdAt", "createdBy", %I, "status", "event", "note") '
    'VALUES (%L, %L, %L, %L, %L, NULL, %L)',
    tbl, parent_col, row_id, at, by_user, parent, status, note);
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.put_evaluation(prefix text, proposal uuid, member uuid,
    scores int[], status text, at timestamptz) RETURNS void AS $$
BEGIN
  FOR q IN 0..3 LOOP
    EXECUTE format(
      'INSERT INTO %I ("proposal", "questionOrder", "evaluationPanelMember", "createdAt", '
      '"updatedAt", "score", "notes") VALUES (%L, %L, %L, %L, %L, %L, %L)',
      prefix || 'Evaluations', proposal, q, member, at, at, scores[q + 1],
      'Seeded note on question ' || (q + 1) || '.');
  END LOOP;
  EXECUTE format(
    'INSERT INTO %I ("proposal", "evaluationPanelMember", "status", "note", "createdAt") '
    'VALUES (%L, %L, %L, NULL, %L)',
    prefix || 'EvaluationStatuses', proposal, member, status, at);
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.seed_twu_opportunity(n int, title text, owner uuid,
    stage text, evaluators uuid[], chair uuid) RETURNS void AS $$
DECLARE
  chain text[] := ARRAY['DRAFT', 'PUBLISHED', 'EVAL_QUESTIONS_INDIVIDUAL',
                        'EVAL_QUESTIONS_CONSENSUS', 'EVAL_C', 'PROCESSING', 'AWARDED'];
  ages interval[] := ARRAY[INTERVAL '60 days', INTERVAL '59 days', INTERVAL '29 days',
                           INTERVAL '26 days', INTERVAL '22 days', INTERVAL '11 days',
                           INTERVAL '5 days'];
  admin uuid := '00000000-0000-4000-8000-000000000101';
  last int := array_position(chain, stage);
  by_user uuid;
  i int := 0;
  member uuid;
BEGIN
  INSERT INTO "twuOpportunities" ("id", "createdAt", "createdBy")
  VALUES (pg_temp.sid(n, 1), now() - INTERVAL '60 days', owner);

  INSERT INTO "twuOpportunityVersions"
    ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
     "remoteDesc", "location", "maxBudget", "description", "proposalDeadline",
     "assignmentDate", "startDate", "completionDate",
     "questionsWeight", "challengeWeight", "priceWeight")
  VALUES
    (pg_temp.sid(n, 2), now() - INTERVAL '60 days', owner, pg_temp.sid(n, 1),
     title, 'A Team With Us opportunity whose proposal deadline has passed.',
     TRUE, 'This work may be done from anywhere in the province.', 'Victoria',
     300000, 'The full description of ' || lower(title) || '.',
     now() - INTERVAL '30 days', now() - INTERVAL '20 days',
     now() - INTERVAL '10 days', now() + INTERVAL '120 days',
     30, 40, 30);

  INSERT INTO "twuResources"
    ("id", "serviceArea", "opportunityVersion", "targetAllocation", "mandatorySkills",
     "optionalSkills", "order")
  VALUES
    (pg_temp.sid(n, 4),
     (SELECT "id" FROM "serviceAreas" WHERE "serviceArea" = 'FULL_STACK_DEVELOPER'),
     pg_temp.sid(n, 2), 100, '{"Backend Development","Frontend Development"}',
     '{"Delivery Management"}', 0);

  INSERT INTO "twuResourceQuestions"
    ("opportunityVersion", "question", "guideline", "score", "wordLimit", "order",
     "createdAt", "createdBy", "minimumScore")
  SELECT pg_temp.sid(n, 2), 'Seeded resource question ' || q || '.', 'Answer in your own words.',
         5, 300, q - 1, now() - INTERVAL '60 days', owner,
         CASE WHEN q = 4 THEN 3 ELSE NULL END
  FROM generate_series(1, 4) AS q;

  FOREACH member IN ARRAY evaluators LOOP
    INSERT INTO "twuEvaluationPanelMembers" ("opportunityVersion", "user", "chair", "evaluator", "order")
    VALUES (pg_temp.sid(n, 2), member, member = chair, TRUE, i);
    i := i + 1;
  END LOOP;
  IF NOT chair = ANY (evaluators) THEN
    INSERT INTO "twuEvaluationPanelMembers" ("opportunityVersion", "user", "chair", "evaluator", "order")
    VALUES (pg_temp.sid(n, 2), chair, TRUE, FALSE, i);
  END IF;

  FOR s IN 1..last LOOP
    by_user := CASE chain[s]
                 WHEN 'DRAFT' THEN owner
                 WHEN 'PUBLISHED' THEN admin
                 WHEN 'EVAL_QUESTIONS_INDIVIDUAL' THEN NULL
                 WHEN 'EVAL_QUESTIONS_CONSENSUS' THEN NULL
                 WHEN 'PROCESSING' THEN NULL
                 WHEN 'AWARDED' THEN admin
                 ELSE owner END;
    PERFORM pg_temp.put_status('twuOpportunityStatuses', 'opportunity',
      pg_temp.sid(n, 1000 + s), pg_temp.sid(n, 1), chain[s], by_user, now() - ages[s], NULL);
  END LOOP;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.seed_twu_proposal(n int, p int, vendor uuid, org uuid,
    owner uuid, final text, rate int, scores int[], evaluators uuid[], chair uuid,
    challenge float, price float) RETURNS void AS $$
DECLARE
  path text[] := ARRAY['DRAFT', 'SUBMITTED', 'UNDER_REVIEW_QUESTIONS',
                       'UNDER_REVIEW_CHALLENGE', 'EVALUATED_CHALLENGE'];
  ages interval[] := ARRAY[INTERVAL '50 days', INTERVAL '40 days', INTERVAL '29 days',
                           INTERVAL '22 days', INTERVAL '13 days', INTERVAL '5 days'];
  admin uuid := '00000000-0000-4000-8000-000000000101';
  chain text[];
  by_user uuid;
  member uuid;
BEGIN
  IF final IN ('AWARDED', 'NOT_AWARDED') THEN
    chain := path || final;
  ELSE
    chain := path[1:array_position(path, final)];
  END IF;

  INSERT INTO "twuProposals"
    ("id", "createdAt", "createdBy", "updatedAt", "updatedBy", "challengeScore",
     "priceScore", "opportunity", "organization", "anonymousProponentName")
  VALUES
    (pg_temp.sid(n, 100 + p), now() - INTERVAL '50 days', vendor, now() - INTERVAL '40 days',
     vendor, challenge, price, pg_temp.sid(n, 1), org,
     CASE WHEN array_length(chain, 1) > 2 THEN 'Proponent ' || p ELSE '' END);

  FOR s IN 1..array_length(chain, 1) LOOP
    by_user := CASE
                 WHEN chain[s] IN ('DRAFT', 'SUBMITTED') THEN vendor
                 WHEN chain[s] IN ('UNDER_REVIEW_QUESTIONS', 'UNDER_REVIEW_CHALLENGE') THEN NULL
                 WHEN chain[s] IN ('AWARDED', 'NOT_AWARDED') THEN admin
                 ELSE owner END;
    PERFORM pg_temp.put_status('twuProposalStatuses', 'proposal',
      pg_temp.sid(n, 1000 + p * 10 + s), pg_temp.sid(n, 100 + p), chain[s], by_user,
      now() - ages[s], NULL);
  END LOOP;

  INSERT INTO "twuProposalMember" ("member", "proposal", "hourlyRate", "resource")
  VALUES (vendor, pg_temp.sid(n, 100 + p), rate, pg_temp.sid(n, 4));

  INSERT INTO "twuResourceQuestionResponses" ("proposal", "order", "response")
  SELECT pg_temp.sid(n, 100 + p), q - 1,
         'Proponent ' || p || '''s answer to question ' || q || '.'
  FROM generate_series(1, 4) AS q;

  IF scores IS NOT NULL THEN
    FOREACH member IN ARRAY evaluators LOOP
      PERFORM pg_temp.put_evaluation('twuResourceQuestionResponseEvaluator', pg_temp.sid(n, 100 + p),
        member, scores, 'SUBMITTED', now() - INTERVAL '27 days');
    END LOOP;
    PERFORM pg_temp.put_evaluation('twuResourceQuestionResponseChair', pg_temp.sid(n, 100 + p),
      chair, scores, 'SUBMITTED', now() - INTERVAL '24 days');
  END IF;
END
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  staff uuid := '00000000-0000-4000-8000-000000000102';
  admin uuid := '00000000-0000-4000-8000-000000000101';
  panel uuid[] := ARRAY['00000000-0000-4000-8000-000000000102',
                        '00000000-0000-4000-8000-000000000101']::uuid[];
  v uuid[] := ARRAY['00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000211',
                    '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000214',
                    '00000000-0000-4000-8000-000000000215']::uuid[];
  o uuid[] := ARRAY['00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000305',
                    '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000307',
                    '00000000-0000-4000-8000-000000000308']::uuid[];
BEGIN
  -- 31. At consensus with five proponents, every consensus submitted. Question totals out
  --     of twenty: 20, 18, 16, 14, and 17 for the fifth, which is below the fourth
  --     question's minimum. Finalising leaves the fifth behind and carries the top three
  --     of the other four to the challenge (R-2.29).
  PERFORM pg_temp.seed_twu_opportunity(31, 'Seeded Team With Us opportunity at consensus with five proponents', staff, 'EVAL_QUESTIONS_CONSENSUS', panel, admin);
  PERFORM pg_temp.seed_twu_proposal(31, 1, v[1], o[1], staff, 'UNDER_REVIEW_QUESTIONS', 120, ARRAY[5, 5, 5, 5], panel, admin, NULL, NULL);
  PERFORM pg_temp.seed_twu_proposal(31, 2, v[2], o[2], staff, 'UNDER_REVIEW_QUESTIONS', 135, ARRAY[5, 5, 4, 4], panel, admin, NULL, NULL);
  PERFORM pg_temp.seed_twu_proposal(31, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 110, ARRAY[4, 4, 4, 4], panel, admin, NULL, NULL);
  PERFORM pg_temp.seed_twu_proposal(31, 4, v[4], o[4], staff, 'UNDER_REVIEW_QUESTIONS', 125, ARRAY[4, 4, 3, 3], panel, admin, NULL, NULL);
  PERFORM pg_temp.seed_twu_proposal(31, 5, v[5], o[5], staff, 'UNDER_REVIEW_QUESTIONS', 100, ARRAY[5, 5, 5, 2], panel, admin, NULL, NULL);

  -- 32. At the challenge, one proponent scored and the other the last left to score
  --     (R-1.25). Scoring the second is what moves a Team With Us opportunity to
  --     processing. It is seeded one step short of processing because the old
  --     application's database refuses that state for this program: the Team With Us
  --     evaluation migration (20250506164908) rebuilt the opportunity status constraint
  --     from a list with no PROCESSING in it, undoing the migration that had added it
  --     (20250404161957). A row seeded in processing is refused, and so is the automatic
  --     move the application attempts after the last challenge score — which is itself
  --     what a test entering that score observes on the oracle.
  PERFORM pg_temp.seed_twu_opportunity(32, 'Seeded Team With Us opportunity at the challenge', staff, 'EVAL_C', panel, admin);
  PERFORM pg_temp.seed_twu_proposal(32, 1, v[1], o[1], staff, 'EVALUATED_CHALLENGE', 110, ARRAY[5, 5, 5, 5], panel, admin, 80, 100);
  PERFORM pg_temp.seed_twu_proposal(32, 2, v[2], o[2], staff, 'UNDER_REVIEW_CHALLENGE', 135, ARRAY[4, 4, 4, 4], panel, admin, NULL, NULL);

  -- 33. The same starting point as 32, held apart for R-1.49 alone. R-1.49 scores the last
  --     proponent and then awards, which leaves its opportunity changed for good; the seed
  --     is loaded once per run, so R-1.25 keeps 32 to itself and never finds 33 already
  --     scored or awarded, whichever order the tests run in.
  PERFORM pg_temp.seed_twu_opportunity(33, 'Seeded second Team With Us opportunity at its challenge', staff, 'EVAL_C', panel, admin);
  PERFORM pg_temp.seed_twu_proposal(33, 1, v[1], o[1], staff, 'EVALUATED_CHALLENGE', 110, ARRAY[5, 5, 5, 5], panel, admin, 80, 100);
  PERFORM pg_temp.seed_twu_proposal(33, 2, v[2], o[2], staff, 'UNDER_REVIEW_CHALLENGE', 135, ARRAY[4, 4, 4, 4], panel, admin, NULL, NULL);
END
$$;
