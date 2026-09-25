-- More accounts and organizations, for criteria the first seven files could not start.
--
-- Three more qualified organizations, each with its own owner. One criterion describes
-- six proponents on one Sprint With Us opportunity, five of whom clear every minimum
-- score, and its Team With Us half five; the first six files seed three qualified
-- organizations, so three more are added here. A proposal belongs to an organization, and
-- one organization answers an opportunity once, so six proponents need six
-- organizations. Their owners are reachable at /auth/createsessionvendor/14, /15 and /16.
--
-- One vendor kept apart for a criterion that deactivates its own account and then signs in
-- again. Using any other persona's account for that would leave it deactivated for the
-- rest of a test.
--
-- One hundred and twenty accounts that have asked for new-opportunity notices, because one
-- criterion describes exactly that many people and the three batches of at most fifty the
-- announcement is split into. Together with the other seeded accounts that have asked,
-- publishing an opportunity reaches between 101 and 150 people, which is three batches.
-- They are vendors with no organization and no sign-in persona; nothing addresses them one
-- by one, so the manifest names them as a group.

INSERT INTO "users"
  ("id", "createdAt", "updatedAt", "type", "status", "name", "email", "jobTitle",
   "idpUsername", "idpId", "capabilities", "notificationsOn", "acceptedTermsAt",
   "lastAcceptedTermsAt", "deactivatedOn", "deactivatedBy")
VALUES
  -- test-vendor-13: deactivates their own account and signs in again (R-4.5).
  ('00000000-0000-4000-8000-000000000213', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Micah Placeholder', 'vendor.returning@example.test', 'Developer',
   'test-vendor-13', 'test-vendor-13', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  ('00000000-0000-4000-8000-000000000214', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Nico Placeholder', 'proponent.four@example.test', 'Managing Director',
   'test-vendor-14', 'test-vendor-14',
   '{"Agile Coaching","Backend Development","Delivery Management"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  ('00000000-0000-4000-8000-000000000215', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Oakley Placeholder', 'proponent.five@example.test', 'Managing Director',
   'test-vendor-15', 'test-vendor-15',
   '{"Agile Coaching","Backend Development","Delivery Management"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  ('00000000-0000-4000-8000-000000000216', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Parker Placeholder', 'proponent.six@example.test', 'Managing Director',
   'test-vendor-16', 'test-vendor-16',
   '{"Agile Coaching","Backend Development","Delivery Management"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL);

INSERT INTO "organizations"
  ("id", "createdAt", "updatedAt", "legalName", "logoImageFile", "websiteUrl",
   "streetAddress1", "streetAddress2", "city", "region", "mailCode", "country",
   "contactName", "contactTitle", "contactEmail", "contactPhone",
   "active", "deactivatedOn", "deactivatedBy", "acceptedSWUTerms", "acceptedTWUTerms")
VALUES
  ('00000000-0000-4000-8000-000000000307', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Quiet Meadow Works Ltd.', NULL, 'https://quiet-meadow.example.test',
   '700 Placeholder Way', NULL, 'Nelson', 'BC', 'V0V0V7', 'Canada',
   'Nico Placeholder', 'Managing Director', 'proponent.four@example.test', '250-555-0107',
   TRUE, NULL, NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00'),

  ('00000000-0000-4000-8000-000000000308', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Red Alder Studio Ltd.', NULL, 'https://red-alder.example.test',
   '800 Placeholder Way', NULL, 'Penticton', 'BC', 'V0V0V8', 'Canada',
   'Oakley Placeholder', 'Managing Director', 'proponent.five@example.test', '250-555-0108',
   TRUE, NULL, NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00'),

  ('00000000-0000-4000-8000-000000000309', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'Stony Ridge Digital Ltd.', NULL, 'https://stony-ridge.example.test',
   '900 Placeholder Way', NULL, 'Terrace', 'BC', 'V0V0V9', 'Canada',
   'Parker Placeholder', 'Managing Director', 'proponent.six@example.test', '250-555-0109',
   TRUE, NULL, NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00');

INSERT INTO "affiliations"
  ("id", "user", "organization", "createdAt", "updatedAt", "membershipType", "membershipStatus")
VALUES
  ('00000000-0000-4000-8000-000000000410', '00000000-0000-4000-8000-000000000214', '00000000-0000-4000-8000-000000000307',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),
  ('00000000-0000-4000-8000-000000000411', '00000000-0000-4000-8000-000000000215', '00000000-0000-4000-8000-000000000308',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE'),
  ('00000000-0000-4000-8000-000000000412', '00000000-0000-4000-8000-000000000216', '00000000-0000-4000-8000-000000000309',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'OWNER', 'ACTIVE');

INSERT INTO "twuOrganizationServiceAreas" ("serviceArea", "organization")
SELECT sa."id", o.id
FROM "serviceAreas" sa
CROSS JOIN (VALUES
  ('00000000-0000-4000-8000-000000000307'::uuid),
  ('00000000-0000-4000-8000-000000000308'::uuid),
  ('00000000-0000-4000-8000-000000000309'::uuid)
) AS o(id)
WHERE sa."serviceArea" = 'FULL_STACK_DEVELOPER';

-- The one hundred and twenty. Identifiers 00000000-0000-4000-8001-000000000001 to ...120.
INSERT INTO "users"
  ("id", "createdAt", "updatedAt", "type", "status", "name", "email", "jobTitle",
   "idpUsername", "idpId", "capabilities", "notificationsOn", "acceptedTermsAt",
   "lastAcceptedTermsAt", "deactivatedOn", "deactivatedBy")
SELECT
  ('00000000-0000-4000-8001-' || lpad(i::text, 12, '0'))::uuid,
  TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
  'VENDOR', 'ACTIVE',
  'Subscriber Placeholder ' || lpad(i::text, 3, '0'),
  'subscriber.' || lpad(i::text, 3, '0') || '@example.test',
  'Developer',
  'seed-subscriber-' || lpad(i::text, 3, '0'),
  'seed-subscriber-' || lpad(i::text, 3, '0'),
  '{}',
  TIMESTAMPTZ '2026-01-05 17:00:00+00',
  TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL
FROM generate_series(1, 120) AS i;
