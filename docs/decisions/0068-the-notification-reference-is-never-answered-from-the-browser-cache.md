# 0068 · The notification reference is never answered from the browser's cache

- Status: accepted for the build (slice 21, revision)
- Date: 2026-10-04

## Context

`/admin/email-notification-reference` is both a page and the service's address for the samples
(decision record 0067). The web server answers a browser's page request there with the
single-page app's `index.html`, served as a static file with `Last-Modified` and `ETag` and no
`Cache-Control`. A browser may keep such an answer as fresh by heuristic, and nothing told it
the answer depends on `Accept`. When the screen then asked the same address for the samples, the
browser could hand back the cached HTML. That HTML does not parse as the samples, so the screen
showed "The sample emails could not be loaded", and reloading did not help: the reload refreshed
the cached page, which the next request reused again.

## Decision

Close it from both sides.

- The screen asks for the samples with `cache: "no-store"`
  (`frontend/src/api/notifications.ts`), so its request never reads from or writes to the cache.
- The web server (`frontend/Caddyfile`) sends `Vary: Accept` on every answer under `/admin`, and
  `Cache-Control: no-store` on the page there.
- The service answers the samples with `Cache-Control: no-store`
  (`backend/src/notifications/email-reference.controller.ts`), so going back to the page does not
  show the JSON.

`/status` shares an address with its page in the same way (decision record 0060). It was not
part of this revision and is left as it was.
