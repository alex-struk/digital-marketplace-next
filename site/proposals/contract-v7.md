| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-25T12:40:53.347Z |
| holder | agent:product-owner |

# Is this the contract the tests will act through?

**Recommendation.** This run took up one request from the G3 ruling on derive-tests-content-stale-5.

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

## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is whether contract-v7 lets the R-7.27 test check what the criterion's 'then' asks for: the two administrators on the changed-by-another-administrator page are named, and each name links to that person's profile. It does, and the recovered facts it relies on hold up against the sources. tests/seed/001-users.sql:28 and :34 insert 'Robin Placeholder' (…0101) and 'Morgan Placeholder' (…0106), so the manifest's new name fields only expose values that are already in the seed. tests/seed/013-content-pages.sql:17-18 shows page …0503 was created by …0101, and lines 25-30 show version 1 by …0101 and version 2 by …0106. That makes Robin the publisher and Morgan the last editor. sources/old/src/front-end/typescript/lib/pages/content/edit.tsx:427-454 shows Published By and Updated By each linking to the userProfile route with that person's id, and falling back to a default name with no link when no person is recorded. The new published_by_link and updated_by_link observations and their comment describe exactly that, with no implementation detail beyond the route the criterion already implies. The change is limited to what the G3 revision request named. Two notes, neither a reason to return. First, the 'generated' check fails because tests/generated/seed.ts and surface.d.ts are derived from the contract and are now out of date. They must be regenerated with sdlc before derive-tests acts on this revision, but that is mechanical and raises no question about the contract. Second, the oracle was not brought up, so the names and links have not been seen through the running application. The seed and source above leave no other reading, so that is a confirmation still to do, not missing evidence. I also accept the account of the five blocked tests (R-6.1, R-6.24, R-7.28, R-5.34, R-7.29): this request supplies nothing any of them lacked, and staying owed by contract is the honest state. The tier is STANDARD and there is one plausible reading, so nothing needs escalating. The ruling would change if the running oracle showed different names or link targets on page …0503, or if the regenerated seed.ts did not carry the two name fields. derive-tests-content-stale-5#2 (removing the HTTP status code from the R-7.16 test) is asked of derive-tests and is not settled here, so it stays open.

**Conditions:**
none
