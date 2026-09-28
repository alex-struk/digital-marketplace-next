-- People a proposal's team may name who are not active members of the organization the
-- proposal is for.
--
-- A proposal's team must be drawn from the active members of its organization, and the
-- proposal screens offer nobody else, so a test puts these people to the service through
-- proposal-team-request. Northern Pines (the organization qualified for both programs)
-- gains a person whose invitation is still unanswered and a person whose membership has
-- ended; a third person belongs to no organization at all. A membership ends as INACTIVE,
-- which is what the application writes when a member leaves or is removed.
--
-- These are conditions, not outcomes: no proposal names any of them. Each account has
-- new-opportunity notices off, so the count of people an announcement reaches is the one
-- the manifest gives, and none has a sign-in route. Every name is a placeholder.

INSERT INTO "users"
  ("id", "createdAt", "updatedAt", "type", "status", "name", "email", "jobTitle",
   "idpUsername", "idpId", "capabilities", "notificationsOn", "acceptedTermsAt",
   "lastAcceptedTermsAt", "deactivatedOn", "deactivatedBy")
VALUES
  -- Invited to Northern Pines and has not answered.
  ('00000000-0000-4000-8000-000000000217', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Quinn Placeholder', 'team.pending@example.test', 'Developer',
   'seed-team-pending', 'seed-team-pending', '{"Backend Development"}', NULL,
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- Was a member of Northern Pines; the membership has ended.
  ('00000000-0000-4000-8000-000000000218', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Rowan Placeholder', 'team.former@example.test', 'Developer',
   'seed-team-former', 'seed-team-former', '{"Backend Development"}', NULL,
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL),

  -- A member of no organization.
  ('00000000-0000-4000-8000-000000000219', TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   'VENDOR', 'ACTIVE', 'Sage Placeholder', 'team.outsider@example.test', 'Developer',
   'seed-team-outsider', 'seed-team-outsider', '{"Backend Development"}', NULL,
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', NULL, NULL);

INSERT INTO "affiliations"
  ("id", "user", "organization", "createdAt", "updatedAt", "membershipType", "membershipStatus")
VALUES
  ('00000000-0000-4000-8000-000000000413', '00000000-0000-4000-8000-000000000217', '00000000-0000-4000-8000-000000000301',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-05 17:00:00+00', 'MEMBER', 'PENDING'),
  ('00000000-0000-4000-8000-000000000414', '00000000-0000-4000-8000-000000000218', '00000000-0000-4000-8000-000000000301',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', TIMESTAMPTZ '2026-01-06 17:00:00+00', 'MEMBER', 'INACTIVE');
