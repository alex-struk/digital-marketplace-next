-- Two more vendors and the qualified organizations they own.
--
-- The evaluation criteria describe an opportunity with three proponents against it — a
-- consensus recorded for two of three, a proponent scored second of three, a ranking that
-- needs more than a winner. Three proponents means three organizations, and a proposal
-- belongs to an organization that met the program's qualification test at the time it was
-- submitted, so all three are qualified for Sprint With Us and for Team With Us. The
-- first of the three is Northern Pines, seeded in 002-organizations.sql; these are the
-- other two.
--
-- Both vendors are reachable by a sign-in route: /auth/createsessionvendor/:n looks an
-- account up by the identity-provider id "test-vendor-<n>", whatever n is, so
-- /auth/createsessionvendor/11 and /12 reach these two. That matters for the criteria
-- about one proponent not being shown another's proposal, which need two proponents a
-- test can act as.
--
-- Each organization's people between them hold the capabilities the seeded Sprint With Us
-- opportunity's implementation phase asks for, which is what its qualification turns on
-- alongside the accepted terms.

INSERT INTO "users"
  ("id", "createdAt", "updatedAt", "type", "status", "name", "email", "jobTitle",
   "idpUsername", "idpId", "capabilities", "notificationsOn", "acceptedTermsAt",
   "lastAcceptedTermsAt", "deactivatedOn", "deactivatedBy")
VALUES
  ('00000000-0000-4000-8000-000000000211', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Kai Placeholder', 'proponent.two@example.test', 'Managing Director',
   'test-vendor-11', 'test-vendor-11',
   '{"Agile Coaching","Backend Development","Delivery Management","Frontend Development"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  ('00000000-0000-4000-8000-000000000212', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Larkin Placeholder', 'proponent.three@example.test', 'Managing Director',
   'test-vendor-12', 'test-vendor-12',
   '{"Agile Coaching","Backend Development","Delivery Management","Technical Architecture"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL);

INSERT INTO "organizations"
  ("id", "createdAt", "updatedAt", "legalName", "logoImageFile", "websiteUrl",
   "streetAddress1", "streetAddress2", "city", "region", "mailCode", "country",
   "contactName", "contactTitle", "contactEmail", "contactPhone",
   "active", "deactivatedOn", "deactivatedBy", "acceptedSWUTerms", "acceptedTWUTerms")
VALUES
  ('00000000-0000-4000-8000-000000000305', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Silver Creek Software Ltd.', NULL, 'https://silver-creek.example.test',
   '500 Placeholder Way', NULL, 'Vernon', 'BC', 'V0V0V4', 'Canada',
   'Kai Placeholder', 'Managing Director', 'proponent.two@example.test', '250-555-0105',
   TRUE, NULL, NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00'),

  ('00000000-0000-4000-8000-000000000306', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Broken Compass Delivery Ltd.', NULL, 'https://broken-compass.example.test',
   '600 Placeholder Way', NULL, 'Cranbrook', 'BC', 'V0V0V5', 'Canada',
   'Larkin Placeholder', 'Managing Director', 'proponent.three@example.test', '250-555-0106',
   TRUE, NULL, NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00');

INSERT INTO "affiliations"
  ("id", "user", "organization", "createdAt", "updatedAt", "membershipType", "membershipStatus")
VALUES
  ('00000000-0000-4000-8000-000000000408', '00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000305',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),
  ('00000000-0000-4000-8000-000000000409', '00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000306',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE');

-- The service areas each is approved for, selected by name because the numbering of the
-- service-area rows is a migration detail.
INSERT INTO "twuOrganizationServiceAreas" ("serviceArea", "organization")
SELECT "id", '00000000-0000-4000-8000-000000000305'
FROM "serviceAreas"
WHERE "serviceArea" IN ('FULL_STACK_DEVELOPER');

INSERT INTO "twuOrganizationServiceAreas" ("serviceArea", "organization")
SELECT "id", '00000000-0000-4000-8000-000000000306'
FROM "serviceAreas"
WHERE "serviceArea" IN ('FULL_STACK_DEVELOPER');
