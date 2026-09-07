-- Organizations, their teams, and the qualification state each one starts in.
--
-- Four organizations, chosen so that the states the criteria's given-clauses name are
-- all present before any test runs: one qualified for both programs, one qualified for
-- neither, one archived, and one carrying an outstanding invitation. Every name is
-- invented and belongs to no real company.

INSERT INTO "organizations"
  ("id", "createdAt", "updatedAt", "legalName", "logoImageFile", "websiteUrl",
   "streetAddress1", "streetAddress2", "city", "region", "mailCode", "country",
   "contactName", "contactTitle", "contactEmail", "contactPhone",
   "active", "deactivatedOn", "deactivatedBy", "acceptedSWUTerms", "acceptedTWUTerms")
VALUES
  -- Qualified for Sprint With Us (two members holding every capability, terms accepted)
  -- and for Team With Us (service areas recorded below, terms accepted).
  ('00000000-0000-4000-8000-000000000301', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Northern Pines Digital Ltd.', NULL, 'https://northern-pines.example.test',
   '100 Placeholder Way', NULL, 'Victoria', 'BC', 'V0V0V0', 'Canada',
   'Blake Placeholder', 'Managing Director', 'org.owner@example.test', '250-555-0101',
   TRUE, NULL, NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00'),

  -- Qualified for neither program: one member, no terms accepted, no service areas.
  ('00000000-0000-4000-8000-000000000302', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Cedar Hollow Systems Inc.', NULL, 'https://cedar-hollow.example.test',
   '200 Placeholder Way', NULL, 'Nanaimo', 'BC', 'V0V0V1', 'Canada',
   'Alex Placeholder', 'Founder', 'vendor.one@example.test', '250-555-0102',
   TRUE, NULL, NULL, NULL, NULL),

  -- Archived by its own owner. Should not appear in the public list of organizations.
  ('00000000-0000-4000-8000-000000000303', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-06 17:00:00+00',
   'Harbour Lantern Consulting Ltd.', NULL, NULL,
   '300 Placeholder Way', NULL, 'Kelowna', 'BC', 'V0V0V2', 'Canada',
   'Blake Placeholder', 'Managing Director', 'org.owner@example.test', '250-555-0103',
   FALSE, TIMESTAMPTZ '2026-01-06 17:00:00+00', '00000000-0000-4000-8000-000000000202', NULL, NULL),

  -- Carries one outstanding invitation, so the accept, decline and pending-member rules
  -- have somewhere to start.
  ('00000000-0000-4000-8000-000000000304', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Salt Marsh Labs Ltd.', NULL, NULL,
   '400 Placeholder Way', NULL, 'Prince George', 'BC', 'V0V0V3', 'Canada',
   'Blake Placeholder', 'Managing Director', 'org.owner@example.test', '250-555-0104',
   TRUE, NULL, NULL, NULL, NULL);

INSERT INTO "affiliations"
  ("id", "user", "organization", "createdAt", "updatedAt", "membershipType", "membershipStatus")
VALUES
  -- Northern Pines: owner, organization administrator, ordinary member.
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000301',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000301',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'ADMIN', 'ACTIVE'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000301',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'MEMBER', 'ACTIVE'),

  -- Cedar Hollow: an owner and nobody else.
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000302',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),

  -- Harbour Lantern: owned by the same vendor that owns Northern Pines, so one vendor's
  -- list of organizations covers an active one and an archived one.
  ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000303',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),

  -- Salt Marsh: an owner, and one person invited who has not answered.
  ('00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000304',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),
  ('00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000209', '00000000-0000-4000-8000-000000000304',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'MEMBER', 'PENDING');

-- The service areas Northern Pines is approved for. Selected by name rather than by row
-- number, because the numbering of the service-area rows is a migration detail.
INSERT INTO "twuOrganizationServiceAreas" ("serviceArea", "organization")
SELECT "id", '00000000-0000-4000-8000-000000000301'
FROM "serviceAreas"
WHERE "serviceArea" IN ('FULL_STACK_DEVELOPER', 'AGILE_COACH');
