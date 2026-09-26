-- Code With Us opportunities past their proposal deadline, one per criterion that moves
-- one on.
--
-- Why these exist. An opportunity closes when its proposal deadline passes, and the form
-- refuses a deadline that has already gone by, so no test can reach a closed Code With Us
-- opportunity through the pages. The first six files seed none. And a criterion that
-- scores, disqualifies or awards takes the opportunity it acts on with it: a second
-- criterion given the same record finds it already moved. So each criterion that moves an
-- opportunity is given one of its own, named in tests/seed/manifest.yaml for that
-- criterion.
--
-- What is seeded is the condition, not the outcome. Six of the eight are PUBLISHED with a
-- deadline thirty days ago and carry proposals that are SUBMITTED, WITHDRAWN before the
-- deadline, or still DRAFT; the application's own hook (in front of /status and every
-- route under /api, throttled to two seconds on the oracle) closes each one, moving it to
-- EVALUATION and its submitted proposals to UNDER_REVIEW. Two are further on, because the
-- criteria given them start further on: one in PROCESSING with its proposals already
-- scored, which is where an award is made, and one already AWARDED, which is what the
-- criteria about showing an awarded opportunity and its full report are about. Neither
-- carries the score-entry events a scoring would have written into a proposal's history.
--
-- Identifiers. Every record here is 00000000-0000-4000-aNNN-KKKKKKKKKKKK, NNN being the
-- opportunity's number below and K what the record is: 1 the opportunity, 2 its version,
-- 100+p proposal p, and 1000 upward the status rows. The manifest carries each one a test
-- uses.

CREATE OR REPLACE FUNCTION pg_temp.sid(n int, k int) RETURNS uuid AS $$
  SELECT ('00000000-0000-4000-a' || lpad(n::text, 3, '0') || '-' || lpad(k::text, 12, '0'))::uuid
$$ LANGUAGE sql IMMUTABLE;

-- A status or history row. Written through a formatted statement so that the status is
-- given as a literal, whatever column type the migrations left it with.
CREATE OR REPLACE FUNCTION pg_temp.put_status(tbl text, parent_col text, row_id uuid,
    parent uuid, status text, by_user uuid, at timestamptz, note text) RETURNS void AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO %I ("id", "createdAt", "createdBy", %I, "status", "event", "note") '
    'VALUES (%L, %L, %L, %L, %L, NULL, %L)',
    tbl, parent_col, row_id, at, by_user, parent, status, note);
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.seed_cwu_opportunity(n int, title text, owner uuid,
    stage text) RETURNS void AS $$
DECLARE
  chain text[] := ARRAY['DRAFT', 'PUBLISHED', 'EVALUATION', 'PROCESSING', 'AWARDED'];
  ages interval[] := ARRAY[INTERVAL '60 days', INTERVAL '59 days', INTERVAL '29 days',
                           INTERVAL '15 days', INTERVAL '10 days'];
  admin uuid := '00000000-0000-4000-8000-000000000101';
  last int := array_position(chain, stage);
  by_user uuid;
  note text;
BEGIN
  INSERT INTO "cwuOpportunities" ("id", "createdAt", "createdBy")
  VALUES (pg_temp.sid(n, 1), now() - INTERVAL '60 days', owner);

  INSERT INTO "cwuOpportunityVersions"
    ("id", "createdAt", "createdBy", "opportunity", "title", "teaser", "remoteOk",
     "remoteDesc", "location", "reward", "skills", "description", "proposalDeadline",
     "assignmentDate", "startDate", "completionDate", "submissionInfo",
     "acceptanceCriteria", "evaluationCriteria")
  VALUES
    (pg_temp.sid(n, 2), now() - INTERVAL '60 days', owner, pg_temp.sid(n, 1),
     title, 'A Code With Us opportunity whose proposal deadline has passed.',
     TRUE, 'This work may be done from anywhere in the province.', 'Victoria', 5000,
     '{"Backend Development","Frontend Development"}',
     'The full description of ' || lower(title) || '.',
     now() - INTERVAL '30 days', now() - INTERVAL '20 days',
     now() - INTERVAL '10 days', now() + INTERVAL '90 days',
     'Submit a link to a public repository.',
     'The work is accepted when the seeded acceptance criteria are met.',
     'Proposals are evaluated against the seeded evaluation criteria.');

  FOR i IN 1..last LOOP
    by_user := CASE chain[i]
                 WHEN 'DRAFT' THEN owner
                 WHEN 'PUBLISHED' THEN admin
                 WHEN 'AWARDED' THEN admin
                 ELSE NULL END;
    note := CASE chain[i] WHEN 'EVALUATION' THEN 'This opportunity has closed.' ELSE NULL END;
    PERFORM pg_temp.put_status('cwuOpportunityStatuses', 'opportunity',
      pg_temp.sid(n, 1000 + i), pg_temp.sid(n, 1), chain[i], by_user,
      now() - ages[i], note);
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- A proposal from an organization. final is the state it is left in; the rows before it
-- are the path an ordinary proposal takes there.
CREATE OR REPLACE FUNCTION pg_temp.seed_cwu_proposal(n int, p int, vendor uuid, org uuid,
    owner uuid, final text, score float) RETURNS void AS $$
DECLARE
  chain text[];
  ages interval[];
  admin uuid := '00000000-0000-4000-8000-000000000101';
  by_user uuid;
BEGIN
  IF final = 'WITHDRAWN' THEN
    chain := ARRAY['DRAFT', 'SUBMITTED', 'WITHDRAWN'];
    ages := ARRAY[INTERVAL '50 days', INTERVAL '40 days', INTERVAL '35 days'];
  ELSE
    chain := (ARRAY['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EVALUATED'])
             [1:coalesce(array_position(ARRAY['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EVALUATED'], final), 4)];
    ages := ARRAY[INTERVAL '50 days', INTERVAL '40 days', INTERVAL '29 days', INTERVAL '20 days'];
    IF final IN ('AWARDED', 'NOT_AWARDED') THEN
      chain := chain || final;
      ages := ages || INTERVAL '10 days';
    END IF;
  END IF;

  INSERT INTO "cwuProposals"
    ("id", "createdAt", "createdBy", "updatedAt", "updatedBy", "proposalText",
     "additionalComments", "proponentIndividual", "proponentOrganization", "score",
     "opportunity")
  VALUES
    (pg_temp.sid(n, 100 + p), now() - INTERVAL '50 days', vendor,
     now() - INTERVAL '40 days', vendor,
     'The seeded proposal text of proponent ' || p || '.', '', NULL, org, score,
     pg_temp.sid(n, 1));

  FOR i IN 1..array_length(chain, 1) LOOP
    by_user := CASE chain[i]
                 WHEN 'DRAFT' THEN vendor
                 WHEN 'SUBMITTED' THEN vendor
                 WHEN 'WITHDRAWN' THEN vendor
                 WHEN 'EVALUATED' THEN owner
                 WHEN 'AWARDED' THEN admin
                 WHEN 'NOT_AWARDED' THEN admin
                 ELSE NULL END;
    PERFORM pg_temp.put_status('cwuProposalStatuses', 'proposal',
      pg_temp.sid(n, 1000 + p * 10 + i), pg_temp.sid(n, 100 + p), chain[i], by_user,
      now() - ages[i], NULL);
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- The people. The owner of every opportunity here is the government account a sign-in
-- route reaches (test-gov), so the opportunity's author can be acted as.
--   staff   00000000-0000-4000-8000-000000000102
--   vendors 202 (Northern Pines, 301), 211 (Silver Creek, 305), 212 (Broken Compass, 306)
DO $$
DECLARE
  staff uuid := '00000000-0000-4000-8000-000000000102';
  v1 uuid := '00000000-0000-4000-8000-000000000202';
  v2 uuid := '00000000-0000-4000-8000-000000000211';
  v3 uuid := '00000000-0000-4000-8000-000000000212';
  o1 uuid := '00000000-0000-4000-8000-000000000301';
  o2 uuid := '00000000-0000-4000-8000-000000000305';
  o3 uuid := '00000000-0000-4000-8000-000000000306';
BEGIN
  -- 1. Past its deadline with a draft still unsubmitted, and no other proposal (R-2.15).
  PERFORM pg_temp.seed_cwu_opportunity(1, 'Seeded lapsed Code With Us opportunity with a draft', staff, 'PUBLISHED');
  PERFORM pg_temp.seed_cwu_proposal(1, 1, v1, o1, staff, 'DRAFT', NULL);

  -- 2. One submitted proposal waiting to be scored (R-2.26).
  PERFORM pg_temp.seed_cwu_opportunity(2, 'Seeded lapsed Code With Us opportunity for scoring', staff, 'PUBLISHED');
  PERFORM pg_temp.seed_cwu_proposal(2, 1, v1, o1, staff, 'SUBMITTED', NULL);

  -- 3. Three submitted proposals; one is to be disqualified and the other two scored
  --    (R-2.27).
  PERFORM pg_temp.seed_cwu_opportunity(3, 'Seeded lapsed Code With Us opportunity with three proposals', staff, 'PUBLISHED');
  PERFORM pg_temp.seed_cwu_proposal(3, 1, v1, o1, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(3, 2, v2, o2, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(3, 3, v3, o3, staff, 'SUBMITTED', NULL);

  -- 4. Two submitted proposals, both to be scored at the program's only evaluation stage
  --    (R-1.25).
  PERFORM pg_temp.seed_cwu_opportunity(4, 'Seeded lapsed Code With Us opportunity at its final stage', staff, 'PUBLISHED');
  PERFORM pg_temp.seed_cwu_proposal(4, 1, v1, o1, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(4, 2, v2, o2, staff, 'SUBMITTED', NULL);

  -- 5. Two submitted and one withdrawn before the deadline: one to be scored, one to be
  --    disqualified, and the withdrawn one to be seen to keep its state through an award
  --    (R-2.33).
  PERFORM pg_temp.seed_cwu_opportunity(5, 'Seeded lapsed Code With Us opportunity for an award', staff, 'PUBLISHED');
  PERFORM pg_temp.seed_cwu_proposal(5, 1, v1, o1, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(5, 2, v2, o2, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(5, 3, v3, o3, staff, 'WITHDRAWN', NULL);

  -- 6. Three submitted proposals from three vendors, for the decision messages an award
  --    sends to the two not chosen (R-6.25).
  PERFORM pg_temp.seed_cwu_opportunity(6, 'Seeded lapsed Code With Us opportunity for award notices', staff, 'PUBLISHED');
  PERFORM pg_temp.seed_cwu_proposal(6, 1, v1, o1, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(6, 2, v2, o2, staff, 'SUBMITTED', NULL);
  PERFORM pg_temp.seed_cwu_proposal(6, 3, v3, o3, staff, 'SUBMITTED', NULL);

  -- 7. In processing, both proposals scored and neither awarded (R-1.26).
  PERFORM pg_temp.seed_cwu_opportunity(7, 'Seeded Code With Us opportunity in processing', staff, 'PROCESSING');
  PERFORM pg_temp.seed_cwu_proposal(7, 1, v1, o1, staff, 'EVALUATED', 82);
  PERFORM pg_temp.seed_cwu_proposal(7, 2, v2, o2, staff, 'EVALUATED', 74);

  -- 8. Awarded to Northern Pines over Silver Creek (R-1.27, R-1.40).
  PERFORM pg_temp.seed_cwu_opportunity(8, 'Seeded awarded Code With Us opportunity', staff, 'AWARDED');
  PERFORM pg_temp.seed_cwu_proposal(8, 1, v1, o1, staff, 'AWARDED', 91);
  PERFORM pg_temp.seed_cwu_proposal(8, 2, v2, o2, staff, 'NOT_AWARDED', 77);
END
$$;
