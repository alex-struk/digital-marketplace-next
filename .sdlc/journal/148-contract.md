---
stage: "contract"
title: "contract"
at: "2026-09-25T12:40:53.320Z"
cost: 0.7215117999999999
turns: 25
session: "ffd2d9c1-a776-4d94-96c9-a6bafd68d75c"
---

This run took up one request from the G3 ruling on derive-tests-content-stale-5. R-7.27 says the managing screen for the page "changed-by-another-administrator" names two administrators, each linked to their profile. The test writer could check neither the names nor the links. I changed only what the ruling named.

**The seed.** The names were already in the database: `tests/seed/001-users.sql` inserts "Robin Placeholder" for `users.administratorOne` and "Morgan Placeholder" for `users.administratorTwo`. The manifest never listed them, so a test could not know what text to expect. `tests/seed/manifest.yaml` now gives each handle a `name:` field with those values. I made no SQL change. I checked `013-content-pages.sql`: page …0503 has version 1 by the first administrator (…0101) and version 2 by the second (…0106). So on that page the "Published By" name should be the first administrator and the "Updated By" name the second.

**The link targets.** In the old application, `sources/old/src/front-end/typescript/lib/pages/content/edit.tsx` (lines 427–453) shows each name as a link to that person's profile, `/users/<id>`, opening in a new tab. A page with no recorded person shows a placeholder name with no link. The content-edit entry in `spec/contract/surface.yaml` now has two more observations, `published_by_link` and `updated_by_link`. A comment says they return the `user-profile` route with that person's id, or nothing when no person is recorded. On the seeded page they should give `/users/00000000-0000-4000-8000-000000000101` and `/users/00000000-0000-4000-8000-000000000106`. Nothing else in the contract changed. Pages, personas, sign-in methods, the other seed files, the openapi file, observables and the compose override are all as the last approved revision left them.

**The oracle was not started.** The session refused every command that uses `$SDLC_BIN`. I tried `node $SDLC_BIN oracle up`, the same with quotes, and `node "${SDLC_BIN}" oracle down`, and each was blocked as a variable expansion before it ran. Printing the variable's value needed an approval that never came. So nothing started, and nothing is left running. This change adds no rows, so the seed should load as the last approved run's did. But this run has not shown the names and links through the running application. Someone should run `oracle up` once before relying on it.

**The five missing tests.** This request does not supply what any of them lacked, so all five stay owed by contract. I wrote no re-address lines.
- **R-6.1** needs a second target started with notifications switched off.
- **R-6.24** needs a mail catcher that can be made to hold delivery.
- **R-7.28** needs a second administrator sign-in. The oracle has one fixed admin route, so that persona is unavailable there.
- **R-5.34** needs a sign-in for a second, unrelated public sector person. It also needs a panel whose chair is neither the owner nor an administrator.
- **R-7.29** could only be reached by a seed that removes a page the service needs. The service itself refuses that removal, so it would be seeding the outcome rather than the conditions, and it is outside what this request named.