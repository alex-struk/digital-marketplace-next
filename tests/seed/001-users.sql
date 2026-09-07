-- Accounts the acceptance suite signs in as, and the ones it needs to exist without
-- ever signing in as them.
--
-- Every value here is invented. Names are placeholders rather than people, and every
-- address is on example.test, which is reserved and can never be delivered to.
--
-- The oracle's sign-in routes look an account up by its identity-provider id:
--   /auth/createsessionadmin      -> the ADMIN account whose idpId is 'test-admin'
--   /auth/createsessiongov        -> the GOV account whose idpId is 'test-gov'
--   /auth/createsessionvendor/:n  -> the VENDOR account whose idpId is 'test-vendor-<n>'
-- The three accounts named gov-second, gov-panel-evaluator and gov-panel-chair have no
-- route that reaches them. They exist because criteria need a second and third public
-- sector person to be present — owning an opportunity, sitting on a panel — and on the
-- oracle those people can be observed but not acted as.
--
-- (type, idpId), (type, idpUsername) and (type, email) are each unique, so every account
-- of a given kind carries a distinct address; the account with no address at all is
-- deliberate and does not collide with anything.

INSERT INTO "users"
  ("id", "createdAt", "updatedAt", "type", "status", "name", "email", "jobTitle",
   "idpUsername", "idpId", "capabilities", "notificationsOn", "acceptedTermsAt",
   "lastAcceptedTermsAt", "deactivatedOn", "deactivatedBy")
VALUES
  -- Public sector -----------------------------------------------------------------
  ('00000000-0000-4000-8000-000000000101', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'ADMIN', 'ACTIVE', 'Robin Placeholder', 'admin.one@example.test', 'Service Owner',
   'test-admin', 'test-admin', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL, NULL, NULL),

  ('00000000-0000-4000-8000-000000000102', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'GOV', 'ACTIVE', 'Casey Placeholder', 'staff.one@example.test', 'Program Analyst',
   'test-gov', 'test-gov', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL, NULL, NULL),

  ('00000000-0000-4000-8000-000000000103', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'GOV', 'ACTIVE', 'Devon Placeholder', 'staff.two@example.test', 'Program Analyst',
   'gov-second', 'gov-second', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL, NULL, NULL),

  ('00000000-0000-4000-8000-000000000104', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'GOV', 'ACTIVE', 'Emery Placeholder', 'panel.evaluator@example.test', 'Delivery Lead',
   'gov-panel-evaluator', 'gov-panel-evaluator', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL, NULL, NULL),

  ('00000000-0000-4000-8000-000000000105', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'GOV', 'ACTIVE', 'Emerson Placeholder', 'panel.chair@example.test', 'Director',
   'gov-panel-chair', 'gov-panel-chair', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL, NULL, NULL),

  -- Vendors -----------------------------------------------------------------------
  -- test-vendor-1: an ordinary vendor with no organization of its own beyond the
  -- unqualified one it owns.
  ('00000000-0000-4000-8000-000000000201', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Alex Placeholder', 'vendor.one@example.test', 'Founder',
   'test-vendor-1', 'test-vendor-1', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- test-vendor-2, -3 and -4 are the owner, the organization administrator and the
  -- ordinary member of the qualified organization. Between the three of them they hold
  -- all nine capabilities, which is one of the two things Sprint With Us qualification
  -- turns on.
  ('00000000-0000-4000-8000-000000000202', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Blake Placeholder', 'org.owner@example.test', 'Managing Director',
   'test-vendor-2', 'test-vendor-2',
   '{"Agile Coaching","Backend Development","Delivery Management"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  ('00000000-0000-4000-8000-000000000203', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Charlie Placeholder', 'org.admin@example.test', 'Principal Engineer',
   'test-vendor-3', 'test-vendor-3',
   '{"DevOps Engineering","Frontend Development","Security Engineering"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  ('00000000-0000-4000-8000-000000000204', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Dana Placeholder', 'org.member@example.test', 'Designer',
   'test-vendor-4', 'test-vendor-4',
   '{"Technical Architecture","User Experience Design","User Research"}',
   TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- test-vendor-5: deactivated by an administrator before any test runs. The oracle's
  -- vendor sign-in route does not check status, so a session can still be minted for
  -- this account there; the refusal itself belongs to the identity provider.
  ('00000000-0000-4000-8000-000000000205', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-06 17:00:00+00',
   'VENDOR', 'INACTIVE_ADMIN', 'Ellis Placeholder', 'vendor.deactivated@example.test', 'Consultant',
   'test-vendor-5', 'test-vendor-5', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-06 17:00:00+00', '00000000-0000-4000-8000-000000000101'),

  -- test-vendor-6: uploads files and holds no other grounds to read them back.
  ('00000000-0000-4000-8000-000000000206', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Finley Placeholder', 'file.owner@example.test', 'Developer',
   'test-vendor-6', 'test-vendor-6', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- test-vendor-7: no email address at all, because the identity provider supplied none.
  ('00000000-0000-4000-8000-000000000207', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Gray Placeholder', NULL, 'Developer',
   'test-vendor-7', 'test-vendor-7', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- test-vendor-8: new-opportunity notices already turned off.
  ('00000000-0000-4000-8000-000000000208', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Harper Placeholder', 'vendor.notices.off@example.test', 'Developer',
   'test-vendor-8', 'test-vendor-8', '{}', NULL,
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- test-vendor-9: holds an outstanding invitation, added in 002-organizations.sql.
  ('00000000-0000-4000-8000-000000000209', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Indigo Placeholder', 'vendor.invited@example.test', 'Developer',
   'test-vendor-9', 'test-vendor-9', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- test-vendor-10: has agreed to the terms at some point but its agreement to the
  -- current terms has been withdrawn, which is the state an administrator's terms
  -- announcement leaves every vendor in.
  ('00000000-0000-4000-8000-000000000210', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Jules Placeholder', 'vendor.terms.reset@example.test', 'Developer',
   'test-vendor-10', 'test-vendor-10', '{}', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   NULL, TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL);
