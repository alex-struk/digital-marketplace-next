| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-28T05:08:43.168Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** **What this run answers.** Contract-v12 was returned for two reasons:
- **The Cypress fix was never proven.** One environment setting had been added to the migration service in `.sdlc/oracle/compose.y…

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

## Journal: contract-v13

**What this run answers.** Contract-v12 was returned for two reasons:
- **The Cypress fix was never proven.** One environment setting had been added to the migration service in `.sdlc/oracle/compose.yml`, and nothing showed the oracle starts with it.
- **The generated test files did not match the contract.** The check on `tests/generated/surface.d.ts` and `tests/generated/seed.ts` failed.

I left the contract, the seed and the override as they were and settled both points.

**The oracle starts with the Cypress change.** The change sets `CYPRESS_INSTALL_BINARY=0` on the one-off `migrate` service. Cypress is only the old repository's end-to-end test tool, and its install step was stalling while it downloaded a browser. With the setting in place, `sdlc oracle up` finished in about three and a half minutes:
- Each copy's `yarn install` completed in 24–54 seconds, with no stall.
- The migration ran all 78 steps ("Batch 1 run: 78 migrations").
- All four copies of the application started, and the CLI reported `oracle up: http://localhost:4300 (mail API http://localhost:8025), 4 copies`.

`GET http://localhost:4300/` answered 200. To confirm the seed loaded, and not just that a page was served, I signed in through the admin test route `/auth/createsessionadmin` (it answered with a 302 redirect). I then fetched `GET /api/users/00000000-0000-4000-8000-000000000201`. It returned the seeded record the manifest calls `users.vendorOne` (vendor.one@example.test, idp id `test-vendor-1`). That shows the migration ran, the seed loaded, and the application reads the database. I then ran `sdlc oracle down`, which confirmed `oracle down: old`.

The override did not weaken anything to get there. Authentication, the migration and the mail path are unchanged; the setting only controls what gets downloaded. One caveat: the Dockerfile takes no build argument this setting could be passed through, so building the image from scratch still downloads the Cypress binary once. It is cached with the image afterwards, and it did not stall this run.

**The generated files.** Under decision 0066, the runner rebuilds `tests/generated/*` from the contract after my turn, and the proposal carries the result. This stage is not permitted to write those files. So the mismatch is fixed by this run finishing with a contract that loads, which the migration and seed load just showed it does. I could not run `sdlc checks` myself because the command needed approval in this session. The post-run check is the evidence that it passes.

**What the contract is.** It is the one approved as contract-v11 and already on `main`, plus the Cypress setting:
- **Pages:** `spec/contract/surface.yaml` covers all eight domains. It includes pages for the signed-in person's own profile with no id in the route, and mail-catcher pages for one message, all messages, refused delivery and slowed delivery.
- **Personas:** `spec/contract/personas.yaml` gives each persona two ways to sign in:
  - On the oracle, a session route: `/auth/createsessionadmin`, `/auth/createsessiongov`, or `/auth/createsessionvendor/N` for vendors 1–11.
  - On the new target, a sandbox identity-provider account named after the same `test-*` ids.
- **Seed:** fourteen files, `000-installation.sql` to `013-content-pages.sql`. They insert administrators, staff and panel members, vendors and organization members, the six evaluation proponents, 120 subscriber accounts, opportunities in every stage of all three programs (Code With Us, Sprint With Us, Team With Us), stored files and content pages. `tests/seed/manifest.yaml` names every record by a handle.

It is the one the tests should act through because it is what G1 approved as v11, and this run showed that a migrated, seeded copy of the old application answers through it.

**The three owed items were all supplied in contract-v11**, which is already on `main`. They are still listed as owed only because the test writer has not run since:
- **R-1.34 (who gets a new-opportunity notice).** The manifest's `new_opportunity_notices.receive_the_announcement` lists the nineteen accounts by handle. `do_not_receive` names the four that are excluded, each with its reason.
- **R-6.1 (notifications switched off).** `observables.yaml` `configurations.notifications_disabled` names the harness variable `SDLC_ORACLE_DISABLE_NOTIFICATIONS=1`. The override passes it to the application's own `DISABLE_NOTIFICATIONS` setting.
- **R-6.24 (success reported before any mail is sent).** A small proxy called `mail-hold` sits between the application and the mail catcher. A test can slow every reply by three seconds through `observables.yaml` `email.delivery_delay`, which is also the surface page `mail-delivery-delay`. That makes success observable while no message has arrived yet.

re-address missing-test/R-1.34 to derive-tests: the seed manifest's new_opportunity_notices.receive_the_announcement names each of the nineteen accounts outside the subscriber group by handle, and do_not_receive names the excluded ones with their reasons
re-address missing-test/R-6.1 to derive-tests: observables.yaml configurations.notifications_disabled, selected by SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 at oracle start and exported to the test process, against which opportunityCwuCreate.publish and the mail catcher can be read
re-address missing-test/R-6.24 to derive-tests: observables.yaml email.delivery_delay and the surface page mail-delivery-delay (slow_delivery, restore_delivery_speed, delivery_slowed) hold the catcher's replies back, so notifyVendorsSuccess can be read while caught-message-list.message_count is still zero

**Not done or not recovered in this run.** I did not run `sdlc checks` (it needed approval). The four owed `derive-tests-opportunities-stale-4` instructions are about test assertions, which the contract does not touch, so they stay open for the next ruling. Everything that earlier contract runs recorded as unrecoverable is unchanged.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: is contract-v13 the contract the tests will act through? Ruling: approve. Contract-v12 was returned because the Cypress fix was unproven and the generated test files did not match the contract; this run settles both. The journal shows the oracle starting with CYPRESS_INSTALL_BINARY=0 on the migrate service: every yarn install completed without stalling, all 78 migrations ran, four copies started, and a signed-in read of /api/users/00000000-0000-4000-8000-000000000201 returned the seeded users.vendorOne record, which shows the seed loaded and the application reads it, not merely that a page was served. The setting changes only what is downloaded; authentication, the migration and the mail path are untouched, and the comment states the first-build caveat plainly. tests/generated/seed.ts and surface.d.ts now carry the new_opportunity_notices handles and MailDeliveryDelayPage, consistent with the contract approved as v11, and the generated check passes. The contract content is unchanged from v11, so R-1.34, R-6.1 and R-6.24 are recorded as looked at and left as they stand. The four derive-tests-opportunities-stale-4 instructions are about test assertions, which this proposal does not touch; they stay open for the next derive-tests ruling. #4 is likely moot now that the seed names the nineteen accounts individually, but withdrawing it belongs to that ruling. What would change this: a failing sdlc checks run on this branch, or evidence that the oracle does not start from this compose file.

**Conditions:**
- contract R-1.34
- contract R-6.1
- contract R-6.24
