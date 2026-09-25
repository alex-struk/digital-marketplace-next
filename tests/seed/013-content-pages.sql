-- Three more pages an administrator made.
--
-- 1. A page whose body carries raw markup beside ordinary formatting marks. Criteria turn
--    on whether markup embedded in a body is executed, shown as literal text, or taken
--    out, and the one page in 003-content.sql carries formatting marks only. Whether the
--    markup takes effect is what the application decides when it renders the page; the
--    body here is only what an administrator typed.
-- 2. A page one administrator published and the second administrator later changed, so
--    that the managing screen has two different people to name as its publisher and its
--    last editor. The second administrator cannot be signed in as on the oracle, so the
--    change cannot be made by a test there.
-- 3. A page whose body carries markup that would run as script if it took effect: an
--    inline script and an image whose failure handler runs script, each raising a dialog
--    that says "script-probe", beside an emphasis tag. Whether any of it runs is what the
--    published-page screen's body_script_ran and body_element_names report. As with the
--    first, the body is only what was typed; running it or not is the application's.

INSERT INTO "content" ("id", "createdAt", "createdBy", "slug", "fixed")
VALUES
  ('00000000-0000-4000-8000-000000000502', TIMESTAMPTZ '2026-01-08 17:00:00+00',
   '00000000-0000-4000-8000-000000000101', 'raw-markup-sample', FALSE),
  ('00000000-0000-4000-8000-000000000503', TIMESTAMPTZ '2026-01-09 17:00:00+00',
   '00000000-0000-4000-8000-000000000101', 'changed-by-another-administrator', FALSE),
  ('00000000-0000-4000-8000-000000000504', TIMESTAMPTZ '2026-01-11 17:00:00+00',
   '00000000-0000-4000-8000-000000000101', 'script-probe-sample', FALSE);

INSERT INTO "contentVersions" ("id", "contentId", "title", "body", "createdAt", "createdBy")
VALUES
  (1, '00000000-0000-4000-8000-000000000502', 'Raw markup sample',
   'Formatting marks make **these words bold**. Raw markup tries to make <strong>these words bold</strong> and <em>these words emphasised</em>.',
   TIMESTAMPTZ '2026-01-08 17:00:00+00', '00000000-0000-4000-8000-000000000101'),
  (1, '00000000-0000-4000-8000-000000000503', 'Changed by another administrator',
   'The wording the first administrator published.',
   TIMESTAMPTZ '2026-01-09 17:00:00+00', '00000000-0000-4000-8000-000000000101'),
  (2, '00000000-0000-4000-8000-000000000503', 'Changed by another administrator',
   'The wording the second administrator replaced it with.',
   TIMESTAMPTZ '2026-01-10 17:00:00+00', '00000000-0000-4000-8000-000000000106'),
  (1, '00000000-0000-4000-8000-000000000504', 'Script probe sample',
   'This body carries markup that would run as script. <script>alert("script-probe")</script> <img src="/no-such-image.png" onerror="alert(''script-probe'')"> <em>These words are in an emphasis tag.</em>',
   TIMESTAMPTZ '2026-01-11 17:00:00+00', '00000000-0000-4000-8000-000000000101');
