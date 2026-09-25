-- What a freshly migrated installation carries in its ordinary tables, restored when it
-- is missing.
--
-- Why this file exists. The application's migrations do more than create tables: they put
-- rows into three of them. The service areas a Team With Us resource is chosen from, the
-- twenty-two pages the service needs for itself (its terms, its guides, the scope pages
-- and evaluation instructions other screens embed), and one account the evaluation-panel
-- migration creates for itself. Between tests the harness puts the database back to the
-- seed by emptying every table except the migration bookkeeping and then applying these
-- files again (`sdlc oracle reseed`, run before every test). Emptying every table empties
-- these three as well, and nothing re-runs the migrations. Without this file every test
-- after the first starts from an installation with no service areas and no service pages:
-- the seeded Team With Us opportunity then answers "Database error." because its
-- resource names a service area that no longer exists, organizations lose their Team With
-- Us qualification, and every page the service embeds or links to is not found.
--
-- What is restored is exactly what the migrations write, taken from:
--   src/migrations/tasks/20230315112325_service-areas-table.ts
--   src/migrations/tasks/20230419130229_service-area-modifications.ts
--   src/migrations/tasks/20250521094818_add_service_designer_service_area.ts
--   src/migrations/tasks/20201202094826_admin-content-stubs.ts
--   src/migrations/tasks/20221130162144_twu-admin-content-stub.ts
--   src/migrations/tasks/20230213120034_twu-opportunity-scope.ts
--   src/migrations/tasks/20230321113754_add-twu-proposals.ts
--   src/migrations/tasks/20240607173220_admin-evaluation-content-stubs.ts
--   src/migrations/tasks/20240527213854_add-evaluation-committee-panel-tables.ts
-- Every row is written only when it is absent, so on a database the migrations have just
-- filled this file changes nothing, and after the harness has emptied it this file puts
-- back the same rows. The one difference is the identifier of each service page, which
-- the migrations generate at random; tests address those pages by their address (slug),
-- which is fixed, and tests/seed/manifest.yaml names them that way.

-- Service areas, with the identifiers the migrations give them. The table numbers its rows
-- itself, and a later migration renames rows 1 to 3 by number, so the numbers are part of
-- what the installation carries.
INSERT INTO "serviceAreas" ("id", "serviceArea", "name")
SELECT v.id, v.area, v.name
FROM (VALUES
  (1, 'FULL_STACK_DEVELOPER', 'Full Stack Developer'),
  (2, 'DATA_PROFESSIONAL', 'Data Professional'),
  (3, 'AGILE_COACH', 'Agile Coach'),
  (4, 'DEVOPS_SPECIALIST', 'DevOps Specialist'),
  (5, 'SERVICE_DESIGNER', 'Service Designer')
) AS v(id, area, name)
WHERE NOT EXISTS (SELECT 1 FROM "serviceAreas" s WHERE s."serviceArea" = v.area);

SELECT setval(pg_get_serial_sequence('"serviceAreas"', 'id'),
              (SELECT max("id") FROM "serviceAreas"));

-- The pages the service needs, each fixed at its address, titled by that address and
-- holding the placeholder body the migrations give it. No person is recorded as having
-- written them, which is what the managing screen reads as "System".
INSERT INTO "content" ("id", "createdAt", "createdBy", "slug", "fixed")
SELECT ('00000000-0000-4000-8000-0000000005' || lpad(v.n::text, 2, '0'))::uuid,
       now(), NULL, v.slug, TRUE
FROM (VALUES
  (51, 'about'),
  (52, 'accessibility'),
  (53, 'code-with-us-opportunity-guide'),
  (54, 'code-with-us-proposal-guide'),
  (55, 'code-with-us-terms-and-conditions'),
  (56, 'copyright'),
  (57, 'disclaimer'),
  (58, 'markdown-guide'),
  (59, 'privacy'),
  (60, 'sprint-with-us-opportunity-guide'),
  (61, 'sprint-with-us-opportunity-scope'),
  (62, 'sprint-with-us-proposal-evaluation'),
  (63, 'sprint-with-us-proposal-guide'),
  (64, 'sprint-with-us-terms-and-conditions'),
  (65, 'terms-and-conditions'),
  (66, 'team-with-us-opportunity-guide'),
  (67, 'team-with-us-proposal-guide'),
  (68, 'team-with-us-opportunity-scope'),
  (69, 'team-with-us-proposal-evaluation'),
  (70, 'team-with-us-terms-and-conditions'),
  (71, 'sprint-with-us-evaluation-instructions'),
  (72, 'team-with-us-evaluation-instructions')
) AS v(n, slug)
WHERE NOT EXISTS (SELECT 1 FROM "content" c WHERE c."slug" = v.slug);

INSERT INTO "contentVersions" ("id", "contentId", "title", "body", "createdAt", "createdBy")
SELECT 1, c."id", c."slug", 'Initial version', c."createdAt", NULL
FROM "content" c
WHERE c."fixed"
  AND NOT EXISTS (SELECT 1 FROM "contentVersions" cv WHERE cv."contentId" = c."id");

-- The account the evaluation-panel migration creates to stand in as evaluator on
-- opportunities that existed before panels did. It is the application's own record, not
-- a person, and it is restored as the migration writes it.
INSERT INTO "users" ("id", "createdAt", "updatedAt", "type", "status", "name", "email",
                     "idpUsername", "idpId")
SELECT '00000000-0000-4000-8000-000000000100', now(), now(), 'GOV', 'ACTIVE',
       'MIGRATION_USER', 'migration_user@gov.bc.ca', 'migration_user', 'migration_user'
WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."idpId" = 'migration_user');
