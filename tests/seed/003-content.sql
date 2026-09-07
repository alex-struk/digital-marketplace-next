-- One ordinary page, carrying three versions.
--
-- The nineteen pages the service needs for itself — about, privacy, accessibility,
-- copyright, disclaimer, the terms, the program guides, the evaluation instructions and
-- the rest — are created by the application's own migrations with placeholder text, so
-- they are already present and nothing here creates them. What the migrations do not
-- leave behind is a page an administrator made rather than the service, or a page with
-- a history behind it. This is that page.

INSERT INTO "content" ("id", "createdAt", "createdBy", "slug", "fixed")
VALUES
  ('00000000-0000-4000-8000-000000000501', TIMESTAMPTZ '2026-01-05 17:00:00+00',
   '00000000-0000-4000-8000-000000000101', 'about-us', FALSE);

INSERT INTO "contentVersions" ("id", "contentId", "title", "body", "createdAt", "createdBy")
VALUES
  (1, '00000000-0000-4000-8000-000000000501', 'About us',
   'The first version of this page.',
   TIMESTAMPTZ '2026-01-05 17:00:00+00', '00000000-0000-4000-8000-000000000101'),
  (2, '00000000-0000-4000-8000-000000000501', 'About us',
   'The second version of this page.',
   TIMESTAMPTZ '2026-01-06 17:00:00+00', '00000000-0000-4000-8000-000000000101'),
  (3, '00000000-0000-4000-8000-000000000501', 'About us',
   'The third and current version of this page, with a **formatted** word in it.',
   TIMESTAMPTZ '2026-01-07 17:00:00+00', '00000000-0000-4000-8000-000000000101');
