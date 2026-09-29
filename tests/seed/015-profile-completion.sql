-- A vendor who has an account and has not yet completed their profile (R-4.24).
--
-- The account has never agreed to the terms, so the application sends every screen this
-- person opens to /sign-up/complete, which is the profile-completion step. It has made no
-- choice about new-opportunity notices: "notificationsOn" is empty, as the application
-- leaves it for an account it has only just created. Ticking the notices box and
-- completing the profile is what records the moment, and that is the application's
-- doing, not this file's.
--
-- Reachable at /auth/createsessionvendor/17, which looks the account up by the
-- identity-provider id "test-vendor-17". It has no organization, and with notices off it
-- is not among the people a new-opportunity announcement reaches.

INSERT INTO "users"
  ("id", "createdAt", "updatedAt", "type", "status", "name", "email", "jobTitle",
   "idpUsername", "idpId", "capabilities", "notificationsOn", "acceptedTermsAt",
   "lastAcceptedTermsAt", "deactivatedOn", "deactivatedBy")
VALUES
  ('00000000-0000-4000-8000-000000000220', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Tatum Placeholder', 'vendor.completing@example.test', '',
   'test-vendor-17', 'test-vendor-17', '{}', NULL, NULL, NULL, NULL, NULL);
