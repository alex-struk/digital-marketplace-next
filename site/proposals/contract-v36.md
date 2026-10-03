| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-03T00:04:35.281Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** **What this run was for.** The contract was already complete and approved from earlier runs.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

## Journal: contract stage, the missing observation for R-7.29

**What this run was for.** The contract was already complete and approved from earlier runs. This run owed one thing: missing-test/R-7.29. R-7.29 says that when the Sprint With Us scope page has been removed, the opportunity screen shows an empty scope section "with nothing said about why". The test writer could already open that screen on an instance with the page removed, and could already read the empty scope section. What they could not do was check that no notice anywhere else on the screen explains the gap.

**What I added.** One new observation, `page_messages`, on the page `opportunity-swu-view` in `spec/contract/surface.yaml`. It returns the text of every notice, alert, error or pop-up message the screen shows outside its own sections, one per line in the order shown, and is empty when there are none. Its `test_id` is left null for the design gate to fill.

An empty reading only means something if the screen would show no notice under normal conditions. The old application's screen (`sources/old/src/front-end/typescript/lib/pages/opportunity/sprint-with-us/view.tsx`, from line 849) raises its own notices in exactly four cases:
- the signed-in vendor has already submitted a proposal to the opportunity;
- the opportunity has been awarded;
- it is open for proposals and nobody is signed in;
- it is open for proposals and the vendor's organizations do not meet the Sprint With Us qualification.

So the observation's comment names a pair where none of those apply: the seeded closed, unawarded opportunity `opportunities.closedSprintWithUs`, opened by the `vendor` persona (`users.vendorOne`, who has no proposal on it). For that pair, `page_messages` is empty under default conditions. Any message it returns on an instance started in the existing `service_page_absent` configuration was caused by the missing page.

**What I did not change.** The `service_page_absent` configuration, its `select`/`tag`, and the seed file that removes the page (`tests/seed/017-absent-service-page.sql`) already existed and needed nothing. I edited no other page, persona, observable, seed file or `openapi.yaml`, and deleted nothing.

**Pages, sign-in and seed, unchanged from the approved contract.** `surface.yaml` covers every domain's pages. Each persona signs in on the oracle through a session route (for example `vendor` uses `/auth/createsessionvendor/1`, staff use `/auth/createsessiongov`, administrators use `/auth/createsessionadmin`). On the rebuilt target each persona signs in through the sandbox identity provider (for example `test-vendor-1`). `anonymous-visitor` has `sign_in: null`. The seed is files `000` to `017`, with every record named in `tests/seed/manifest.yaml`.

**The oracle started, and I changed nothing in the override.** I ran `oracle down` to clear leftovers, then `oracle up` with `.sdlc/oracle/compose.yml` as it stands. It worked on the first attempt: 78 migrations ran, the seed loaded, and four copies came up (app on port 4300, mail API on port 8025). Checked through the running application:
- `/status` answered 200;
- `GET /api/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701` returned "Seeded closed Sprint With Us opportunity";
- `GET /api/content/sprint-with-us-opportunity-scope` returned the scope page (present, as it should be by default);
- `/auth/createsessionvendor/1` created a session for the seeded vendor account `…0201`;
- that vendor's proposals on the opportunity came back as an empty list, which confirms the empty default described above.

I then ran `oracle down`, and no project containers remain.

**Tool limits.** The shell refused to expand `$SDLC_BIN`, so I ran the same CLI by its path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`, as earlier runs did. I did not start the separate copy in the `service_page_absent` configuration, so whether the screen actually raises a message when the page is missing has not been observed yet. The code suggests it raises none: when the page read fails, the screen simply skips setting the scope content (`view.tsx:202`). Checking that on the real instance is the test's job.

re-address missing-test/R-7.29 to derive-tests: added observation `page_messages` on `opportunity-swu-view` (spec/contract/surface.yaml) — the text of every notice, alert or error message shown outside the screen's sections, empty when none; for `opportunities.closedSprintWithUs` opened by persona `vendor` it is empty by default, so a test tagged `@service_page_absent` can read it as empty alongside `scope_section`.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does adding the page_messages reading to opportunity-swu-view give R-7.29's clause 'with nothing said about why' a reading a test can act through? Ruling: approve. Reason: the old application's getAlerts (view.tsx:849-914) raises notices in exactly the four cases the comment lists: the signed-in vendor already submitted a proposal, the opportunity was awarded, it is open for proposals and nobody is signed in, or it is open for proposals and the vendor is not Sprint With Us qualified. None applies to opportunities.closedSprintWithUs opened by the vendor persona, who has no proposal on it, so an empty reading under default conditions is a sound baseline. When the scope page fails to load, the screen only skips setting the scope content (view.tsx:202), which is consistent with the requirement. The change is purely additive: one surface entry with test_id left null for the design gate, plus the matching generated type. No criterion's wording or confidence changes, so there are no condition lines. What would change the ruling: evidence that the screen raises some other notice for this vendor and opportunity under defaults, or that the four-case list misreads getAlerts.

**Conditions:**
none
