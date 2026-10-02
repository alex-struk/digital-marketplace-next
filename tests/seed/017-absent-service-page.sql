-- One page the service needs, taken out when the database was started saying so.
--
-- A page the service needs cannot be removed through any screen or request, and
-- 000-installation.sql puts every one of them back on each reset, so the state in which a
-- screen goes to embed such a page and finds nothing can only be set up here. The database
-- carries a setting, sdlc.absent_page, holding the address of the page to leave out. It is
-- empty unless the oracle was started in the configuration that names it
-- (spec/contract/observables.yaml, configurations.service_page_absent), so under the
-- default this file matches no row and changes nothing.
--
-- Only the page is removed. What a screen that embeds it then shows is the application's.

DELETE FROM "contentVersions"
WHERE "contentId" IN (
  SELECT "id" FROM "content"
  WHERE "slug" = NULLIF(current_setting('sdlc.absent_page', true), '')
);

DELETE FROM "content"
WHERE "slug" = NULLIF(current_setting('sdlc.absent_page', true), '');
