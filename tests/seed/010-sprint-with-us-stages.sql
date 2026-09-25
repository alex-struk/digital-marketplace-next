-- Sprint With Us opportunities standing at each stage of evaluation, one per criterion
-- that moves one on.
--
-- Why these exist. 006-swu-evaluation.sql seeds one lapsed Sprint With Us opportunity,
-- which the application closes into individual question evaluation. Every criterion about
-- a later stage — consensus, the code challenge, the team scenario, processing, an award —
-- would have to walk that one record through every stage before it, and the first test to
-- do so leaves nothing for the next. So the later stages are seeded here, each at the
-- point its criterion's given-clause starts from.
--
-- What is seeded is the condition, not the outcome. An opportunity at the consensus stage
-- carries the individual evaluations every evaluator submitted, because those are what
-- put it there; whether the chair's consensus is submitted is the given of the criterion
-- it serves. An opportunity at the team scenario stage carries its question and challenge
-- scores and one proponent already scored on the scenario, so that scoring the other is
-- the last human-entered score and the price score the application then works out is its
-- own. Nothing here writes a total or a rank — those are derived on every read — and no
-- score-entry events are written into a proposal's history.
--
-- Two opportunities are lapsed rather than moved on (22 and 23): their panels are
-- arranged so that an evaluator, a chair who does not evaluate, and an owner who is not on
-- the panel can each be acted as, which the panel in 006 cannot offer.
--
-- The panel. Unless an opportunity says otherwise it is the one 006 explains: the
-- government account (test-gov, 00000000-0000-4000-8000-000000000102) as an evaluator and
-- the administrator (test-admin, ...101) as chair and evaluator, the only two public
-- sector accounts a sign-in route reaches.
--
-- Every opportunity has four team questions scored out of five; the fourth carries a
-- minimum score of three, which is what screening turns on.
--
-- Identifiers follow 009: 00000000-0000-4000-aNNN-KKKKKKKKKKKK, K being 1 the opportunity,
-- 2 its version, 3 its phase, 100+p proposal p, 300+p proposal p's phase, 1000 upward
-- status rows.

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

-- One evaluator's or the chair's scores for one proposal, and the status they stand at.
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

CREATE OR REPLACE FUNCTION pg_temp.seed_swu_opportunity(n int, title text, owner uuid,
    stage text, evaluators uuid[], chair uuid) RETURNS void AS $$
DECLARE
  chain text[] := ARRAY['DRAFT', 'PUBLISHED', 'EVAL_QUESTIONS_INDIVIDUAL',
                        'EVAL_QUESTIONS_CONSENSUS', 'EVAL_CC', 'EVAL_SCENARIO',
                        'PROCESSING', 'AWARDED'];
  ages interval[] := ARRAY[INTERVAL '60 days', INTERVAL '59 days', INTERVAL '29 days',
                           INTERVAL '26 days', INTERVAL '22 days', INTERVAL '17 days',
                           INTERVAL '11 days', INTERVAL '5 days'];
  admin uuid := '00000000-0000-4000-8000-000000000101';
  last int := array_position(chain, stage);
  by_user uuid;
  note text;
  i int := 0;
  member uuid;
BEGIN
  INSERT INTO "swuOpportunities" ("id", "createdAt", "createdBy")
  VALUES (pg_temp.sid(n, 1), now() - INTERVAL '60 days', owner);

  INSERT INTO "swuOpportunityVersions"
    ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
     "remoteDesc", "location", "totalMaxBudget", "minTeamMembers", "mandatorySkills",
     "optionalSkills", "description", "proposalDeadline", "assignmentDate",
     "questionsWeight", "codeChallengeWeight", "scenarioWeight", "priceWeight")
  VALUES
    (pg_temp.sid(n, 2), now() - INTERVAL '60 days', owner, pg_temp.sid(n, 1),
     title, 'A Sprint With Us opportunity whose proposal deadline has passed.',
     TRUE, 'This work may be done from anywhere in the province.', 'Victoria',
     500000, 1, '{"Backend Development","Delivery Management"}', '{"Frontend Development"}',
     'The full description of ' || lower(title) || '.',
     now() - INTERVAL '30 days', now() - INTERVAL '20 days',
     25, 40, 15, 20);

  INSERT INTO "swuOpportunityPhases"
    ("id", "opportunityVersion", "phase", "startDate", "completionDate", "maxBudget",
     "createdAt", "createdBy")
  VALUES
    (pg_temp.sid(n, 3), pg_temp.sid(n, 2), 'IMPLEMENTATION', now() - INTERVAL '10 days',
     now() + INTERVAL '120 days', 500000, now() - INTERVAL '60 days', owner);

  INSERT INTO "swuPhaseCapabilities" ("phase", "capability", "fullTime", "createdAt", "createdBy")
  VALUES
    (pg_temp.sid(n, 3), 'Backend Development', TRUE, now() - INTERVAL '60 days', owner),
    (pg_temp.sid(n, 3), 'Delivery Management', FALSE, now() - INTERVAL '60 days', owner);

  INSERT INTO "swuTeamQuestions"
    ("opportunityVersion", "question", "guideline", "score", "wordLimit", "order",
     "createdAt", "createdBy", "minimumScore")
  SELECT pg_temp.sid(n, 2), 'Seeded team question ' || q || '.', 'Answer in your own words.',
         5, 300, q - 1, now() - INTERVAL '60 days', owner,
         CASE WHEN q = 4 THEN 3 ELSE NULL END
  FROM generate_series(1, 4) AS q;

  FOREACH member IN ARRAY evaluators LOOP
    INSERT INTO "swuEvaluationPanelMembers" ("opportunityVersion", "user", "chair", "evaluator", "order")
    VALUES (pg_temp.sid(n, 2), member, member = chair, TRUE, i);
    i := i + 1;
  END LOOP;
  IF NOT chair = ANY (evaluators) THEN
    INSERT INTO "swuEvaluationPanelMembers" ("opportunityVersion", "user", "chair", "evaluator", "order")
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
    PERFORM pg_temp.put_status('swuOpportunityStatuses', 'opportunity',
      pg_temp.sid(n, 1000 + s), pg_temp.sid(n, 1), chain[s], by_user, now() - ages[s], NULL);
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- A proposal and everything it carries.
--   final       the state it is left in; the rows before it are the ordinary path there
--   cost        its bid, as the cost of its one phase
--   scores      the four question scores every evaluator gave it, and the chair agreed
--   individual  the status the evaluators' individual evaluations stand at, or NULL for none
--   consensus   the status the chair's consensus stands at, or NULL for none yet
CREATE OR REPLACE FUNCTION pg_temp.seed_swu_proposal(n int, p int, vendor uuid, org uuid,
    owner uuid, final text, cost int, scores int[], individual text, consensus text,
    evaluators uuid[], chair uuid, challenge float, scenario float, price float)
    RETURNS void AS $$
DECLARE
  path text[] := ARRAY['DRAFT', 'SUBMITTED', 'UNDER_REVIEW_QUESTIONS',
                       'UNDER_REVIEW_CODE_CHALLENGE', 'EVALUATED_CODE_CHALLENGE',
                       'UNDER_REVIEW_TEAM_SCENARIO', 'EVALUATED_TEAM_SCENARIO'];
  ages interval[] := ARRAY[INTERVAL '50 days', INTERVAL '40 days', INTERVAL '29 days',
                           INTERVAL '22 days', INTERVAL '20 days', INTERVAL '17 days',
                           INTERVAL '13 days', INTERVAL '5 days'];
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

  INSERT INTO "swuProposals"
    ("id", "createdAt", "createdBy", "updatedAt", "updatedBy", "challengeScore",
     "scenarioScore", "priceScore", "opportunity", "organization", "anonymousProponentName")
  VALUES
    (pg_temp.sid(n, 100 + p), now() - INTERVAL '50 days', vendor, now() - INTERVAL '40 days',
     vendor, challenge, scenario, price, pg_temp.sid(n, 1), org,
     CASE WHEN array_length(chain, 1) > 2 THEN 'Proponent ' || p ELSE '' END);

  FOR s IN 1..array_length(chain, 1) LOOP
    by_user := CASE
                 WHEN chain[s] IN ('DRAFT', 'SUBMITTED') THEN vendor
                 WHEN chain[s] IN ('UNDER_REVIEW_QUESTIONS', 'UNDER_REVIEW_CODE_CHALLENGE') THEN NULL
                 WHEN chain[s] IN ('AWARDED', 'NOT_AWARDED') THEN admin
                 ELSE owner END;
    PERFORM pg_temp.put_status('swuProposalStatuses', 'proposal',
      pg_temp.sid(n, 1000 + p * 10 + s), pg_temp.sid(n, 100 + p), chain[s], by_user,
      now() - ages[s], NULL);
  END LOOP;

  INSERT INTO "swuProposalPhases" ("id", "proposal", "phase", "proposedCost")
  VALUES (pg_temp.sid(n, 300 + p), pg_temp.sid(n, 100 + p), 'IMPLEMENTATION', cost);

  INSERT INTO "swuProposalTeamMembers" ("member", "phase", "scrumMaster")
  VALUES (vendor, pg_temp.sid(n, 300 + p), TRUE);

  INSERT INTO "swuProposalReferences" ("proposal", "order", "name", "company", "phone", "email")
  SELECT pg_temp.sid(n, 100 + p), r - 1, 'Reference ' || r || ' Placeholder',
         'Placeholder Ministry', '250-555-03' || lpad((n % 10 * 10 + p)::text, 2, '0'),
         'reference.' || n || '.' || p || '.' || r || '@example.test'
  FROM generate_series(1, 3) AS r;

  INSERT INTO "swuTeamQuestionResponses" ("proposal", "order", "response")
  SELECT pg_temp.sid(n, 100 + p), q - 1,
         'Proponent ' || p || '''s answer to question ' || q || '.'
  FROM generate_series(1, 4) AS q;

  IF individual IS NOT NULL THEN
    FOREACH member IN ARRAY evaluators LOOP
      PERFORM pg_temp.put_evaluation('swuTeamQuestionResponseEvaluator', pg_temp.sid(n, 100 + p),
        member, scores, individual, now() - INTERVAL '27 days');
    END LOOP;
  END IF;
  IF consensus IS NOT NULL THEN
    PERFORM pg_temp.put_evaluation('swuTeamQuestionResponseChair', pg_temp.sid(n, 100 + p),
      chair, scores, consensus, now() - INTERVAL '24 days');
  END IF;
END
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  staff uuid := '00000000-0000-4000-8000-000000000102';
  staff2 uuid := '00000000-0000-4000-8000-000000000103';
  admin uuid := '00000000-0000-4000-8000-000000000101';
  panel uuid[] := ARRAY['00000000-0000-4000-8000-000000000102',
                        '00000000-0000-4000-8000-000000000101']::uuid[];
  v uuid[] := ARRAY['00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000211',
                    '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000214',
                    '00000000-0000-4000-8000-000000000215', '00000000-0000-4000-8000-000000000216']::uuid[];
  o uuid[] := ARRAY['00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000305',
                    '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000307',
                    '00000000-0000-4000-8000-000000000308', '00000000-0000-4000-8000-000000000309']::uuid[];
  top int[] := ARRAY[5, 5, 5, 5];
  good int[] := ARRAY[4, 4, 4, 4];
  low int[] := ARRAY[3, 3, 3, 3];
  below int[] := ARRAY[5, 5, 5, 2];
BEGIN
  -- 11. At consensus, the chair's consensus submitted for two proponents and not begun for
  --     the third. Asking to move on is refused; so is changing the panel. Nothing here
  --     moves, so the criteria sharing it cannot disturb each other (R-1.41, R-1.43, R-1.50).
  PERFORM pg_temp.seed_swu_opportunity(11, 'Seeded Sprint With Us opportunity at consensus with one consensus outstanding', staff, 'EVAL_QUESTIONS_CONSENSUS', panel, admin);
  PERFORM pg_temp.seed_swu_proposal(11, 1, v[1], o[1], staff, 'UNDER_REVIEW_QUESTIONS', 420000, top, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(11, 2, v[2], o[2], staff, 'UNDER_REVIEW_QUESTIONS', 460000, good, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(11, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 380000, low, 'SUBMITTED', NULL, panel, admin, NULL, NULL, NULL);

  -- 12. At consensus, every consensus submitted, and every proponent below the fourth
  --     question's minimum. Asking to move on is refused (R-1.41).
  PERFORM pg_temp.seed_swu_opportunity(12, 'Seeded Sprint With Us opportunity at consensus with nobody screenable', staff, 'EVAL_QUESTIONS_CONSENSUS', panel, admin);
  PERFORM pg_temp.seed_swu_proposal(12, 1, v[1], o[1], staff, 'UNDER_REVIEW_QUESTIONS', 420000, ARRAY[5, 5, 5, 2], 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(12, 2, v[2], o[2], staff, 'UNDER_REVIEW_QUESTIONS', 460000, ARRAY[4, 4, 4, 1], 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(12, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 380000, ARRAY[3, 3, 3, 0], 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);

  -- 13. At consensus with six proponents, every consensus submitted. Question totals out of
  --     twenty: 20, 18, 16, 14, 12, and 17 for the sixth, which is below the fourth
  --     question's minimum. Finalising leaves the sixth behind, ranks the other five and
  --     carries the top four to the code challenge (R-2.29).
  PERFORM pg_temp.seed_swu_opportunity(13, 'Seeded Sprint With Us opportunity at consensus with six proponents', staff, 'EVAL_QUESTIONS_CONSENSUS', panel, admin);
  PERFORM pg_temp.seed_swu_proposal(13, 1, v[1], o[1], staff, 'UNDER_REVIEW_QUESTIONS', 420000, top, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(13, 2, v[2], o[2], staff, 'UNDER_REVIEW_QUESTIONS', 440000, ARRAY[5, 5, 4, 4], 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(13, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 460000, good, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(13, 4, v[4], o[4], staff, 'UNDER_REVIEW_QUESTIONS', 400000, ARRAY[4, 4, 3, 3], 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(13, 5, v[5], o[5], staff, 'UNDER_REVIEW_QUESTIONS', 380000, low, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(13, 6, v[6], o[6], staff, 'UNDER_REVIEW_QUESTIONS', 360000, below, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);

  -- 14. At the code challenge: the first proponent scored, the second screened in and not
  --     yet scored or disqualified, the third left behind at the questions. Asking to move
  --     to the team scenario is refused (R-1.42).
  PERFORM pg_temp.seed_swu_opportunity(14, 'Seeded Sprint With Us opportunity at the code challenge', staff, 'EVAL_CC', panel, admin);
  PERFORM pg_temp.seed_swu_proposal(14, 1, v[1], o[1], staff, 'EVALUATED_CODE_CHALLENGE', 420000, top, 'SUBMITTED', 'SUBMITTED', panel, admin, 80, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(14, 2, v[2], o[2], staff, 'UNDER_REVIEW_CODE_CHALLENGE', 460000, good, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(14, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 380000, below, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);

  -- 15, 16 and 17. At the team scenario, identical, one for each criterion that enters the
  --     last scenario score (R-2.30, R-2.31, R-1.25). Two proponents in contention bidding
  --     100,000 and 200,000; the lower bid is already scored on the scenario, and entering
  --     the higher bid's scenario score is the last human-entered score. The third was left
  --     behind at the questions and is not in contention.
  FOR n IN 15..17 LOOP
    PERFORM pg_temp.seed_swu_opportunity(n, 'Seeded Sprint With Us opportunity at the team scenario (' || n || ')', staff, 'EVAL_SCENARIO', panel, admin);
    PERFORM pg_temp.seed_swu_proposal(n, 1, v[1], o[1], staff, 'EVALUATED_TEAM_SCENARIO', 100000, top, 'SUBMITTED', 'SUBMITTED', panel, admin, 80, 70, 100);
    PERFORM pg_temp.seed_swu_proposal(n, 2, v[2], o[2], staff, 'UNDER_REVIEW_TEAM_SCENARIO', 200000, good, 'SUBMITTED', 'SUBMITTED', panel, admin, 75, NULL, NULL);
    PERFORM pg_temp.seed_swu_proposal(n, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 380000, below, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  END LOOP;

  -- 18 and 19. In processing, identical, one for each criterion that makes the award
  --     (R-2.32, R-1.26). Two proponents fully evaluated, neither awarded; the third was
  --     left behind at the questions and is still in contention for "not awarded".
  FOR n IN 18..19 LOOP
    PERFORM pg_temp.seed_swu_opportunity(n, 'Seeded Sprint With Us opportunity in processing (' || n || ')', staff, 'PROCESSING', panel, admin);
    PERFORM pg_temp.seed_swu_proposal(n, 1, v[1], o[1], staff, 'EVALUATED_TEAM_SCENARIO', 100000, top, 'SUBMITTED', 'SUBMITTED', panel, admin, 80, 70, 100);
    PERFORM pg_temp.seed_swu_proposal(n, 2, v[2], o[2], staff, 'EVALUATED_TEAM_SCENARIO', 200000, good, 'SUBMITTED', 'SUBMITTED', panel, admin, 75, 85, 50);
    PERFORM pg_temp.seed_swu_proposal(n, 3, v[3], o[3], staff, 'UNDER_REVIEW_QUESTIONS', 380000, below, 'SUBMITTED', 'SUBMITTED', panel, admin, NULL, NULL, NULL);
  END LOOP;

  -- 20. Awarded to Northern Pines over Silver Creek, both fully evaluated (R-1.27, R-1.40).
  PERFORM pg_temp.seed_swu_opportunity(20, 'Seeded awarded Sprint With Us opportunity', staff, 'AWARDED', panel, admin);
  PERFORM pg_temp.seed_swu_proposal(20, 1, v[1], o[1], staff, 'AWARDED', 100000, top, 'SUBMITTED', 'SUBMITTED', panel, admin, 80, 70, 100);
  PERFORM pg_temp.seed_swu_proposal(20, 2, v[2], o[2], staff, 'NOT_AWARDED', 200000, good, 'SUBMITTED', 'SUBMITTED', panel, admin, 75, 85, 50);

  -- 21. At the code challenge, belonging to the second member of staff, with the
  --     administrator and that member as its panel. The government account has no
  --     connection to it at all, so it is the public sector employee a criterion says may
  --     not read the individual evaluations once the question stages are past (R-5.11).
  PERFORM pg_temp.seed_swu_opportunity(21, 'Seeded Sprint With Us opportunity of another staff member at the code challenge', staff2, 'EVAL_CC',
    ARRAY[admin, staff2]::uuid[], admin);
  PERFORM pg_temp.seed_swu_proposal(21, 1, v[1], o[1], staff2, 'UNDER_REVIEW_CODE_CHALLENGE', 420000, top, 'SUBMITTED', 'SUBMITTED', ARRAY[admin, staff2]::uuid[], admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(21, 2, v[2], o[2], staff2, 'UNDER_REVIEW_CODE_CHALLENGE', 460000, good, 'SUBMITTED', 'SUBMITTED', ARRAY[admin, staff2]::uuid[], admin, NULL, NULL, NULL);

  -- 22. Lapsed, with the government account as a chair who does not evaluate and the
  --     administrator as the only evaluator, belonging to the second member of staff. The
  --     application closes it into individual evaluation (R-5.21).
  PERFORM pg_temp.seed_swu_opportunity(22, 'Seeded lapsed Sprint With Us opportunity with a chair who does not evaluate', staff2, 'PUBLISHED',
    ARRAY[admin]::uuid[], staff);
  PERFORM pg_temp.seed_swu_proposal(22, 1, v[1], o[1], staff2, 'SUBMITTED', 420000, NULL, NULL, NULL, ARRAY[admin]::uuid[], staff, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(22, 2, v[2], o[2], staff2, 'SUBMITTED', 460000, NULL, NULL, NULL, ARRAY[admin]::uuid[], staff, NULL, NULL, NULL);

  -- 23. Lapsed, belonging to the government account, whose panel is the administrator as
  --     chair and evaluator and the second member of staff as evaluator. The owner is not
  --     on the panel (R-5.21).
  PERFORM pg_temp.seed_swu_opportunity(23, 'Seeded lapsed Sprint With Us opportunity whose owner is not on the panel', staff, 'PUBLISHED',
    ARRAY[admin, staff2]::uuid[], admin);
  PERFORM pg_temp.seed_swu_proposal(23, 1, v[1], o[1], staff, 'SUBMITTED', 420000, NULL, NULL, NULL, ARRAY[admin, staff2]::uuid[], admin, NULL, NULL, NULL);
  PERFORM pg_temp.seed_swu_proposal(23, 2, v[2], o[2], staff, 'SUBMITTED', 460000, NULL, NULL, NULL, ARRAY[admin, staff2]::uuid[], admin, NULL, NULL, NULL);
END
$$;
