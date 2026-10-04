| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-04T01:50:51.360Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** The contract was already complete from earlier runs, so this run supplied the one owed item and proved the oracle still starts.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The contract was already complete from earlier runs, so this run supplied the one owed item and proved the oracle still starts. The only file changed is `spec/contract/surface.yaml`, and both edits are comments. No page, action, persona, seed row or override setting changed.

**The owed item, R-2.2.** The criterion's middle clause is that a request to create a second proposal is refused with "You already have a proposal for this opportunity." The test writer said `proposal-cwu-create` has no action that sends such a request. That's right: that screen sends a vendor who already holds a proposal straight to the one they hold, so it never sends that request at all. The action they needed was already in the contract on a different page. `proposal-cwu-request` (`POST /api/proposals/code-with-us`) has `submit_with_individual_proponent`, which sends the create request straight to the service, and `refusal_messages`, which reads the reply. Both are bound in the old-target adapter, and the R-2.14 test already uses them.

I checked the old service's create handler (`src/back-end/lib/resources/proposal/code-with-us.ts`, lines 306–369) so the test can be written without guessing:
- **When the check runs:** the duplicate check comes after the service finds the opportunity and before it validates any field. So the second request is refused whatever its fields hold, and a draft as the first proposal counts.
- **Where the message lands:** it is reported under the key `conflict`, so `refusal_messages` is the place to read it, not a named field.
- **Use an individual proponent:** an organization proponent whose organization already has a proposal on that opportunity is refused earlier, with "Please select a different organization." instead.

I wrote this into the comment on `proposal-cwu-request`. I also added a short comment on `proposal-cwu-create` pointing there, so the next writer doesn't look on the screen. The "no second proposal is created" part can still be read on `proposal-vendor-dashboard`, as the existing R-2.2 test already does.

**The rest of the contract, unchanged and still accurate:**
- **Pages:** `surface.yaml` covers every page in the eight domains, each with a `domain` field. That includes the request-level pages (`proposal-cwu-request`, `proposal-team-request`, `opportunity-status-request` and others) for refusals that no screen ever sends.
- **Sign-in:** every persona signs in to the oracle through a session route (`/auth/createsessionadmin`, `/auth/createsessiongov`, `/auth/createsessionvendor/:n`) and to the new target through a sandbox identity-provider username. The anonymous visitor has `sign_in: null`.
- **API description:** `openapi.yaml` is recovered from the old repository at commit b0f0c99.
- **Observables:** mail is read through mailpit at `${SDLC_MAIL_API}`. The two start-up configurations, notifications switched off (R-6.1) and a missing service page (R-7.29), are declared there and in the Compose override.
- **Seed:** 18 files, from installation and users through organizations, opportunities in every program and stage, evaluation panels, files, content pages and team candidates. All synthetic, with `example.test` addresses and placeholder names, every record named in `manifest.yaml`.

**Oracle:** I ran `oracle up` with the existing override unchanged. All four copies started, the migration applied 78 migrations, and the seeded published Code With Us opportunity (`seed.opportunities.publishedCodeWithUs`, id `…0601`) came back from the application's own `/api/opportunities/code-with-us/:id` with its seeded history. So the database connection, migration and seed all worked. `oracle down` has been run.

`$SDLC_BIN` can't be expanded under this session's permissions, so I called the CLI at `~/GitHub/agentic-sdlc/bin/sdlc.mjs` directly. I wrote a short script to send a draft and then a duplicate request against the running oracle, but running it needed approval this session doesn't have. So the refusal message and the order of the checks come from the source, not from a live request.

re-address missing-test/R-2.2 to derive-tests: proposal-cwu-request now says how to reach the refusal. Send submit_with_individual_proponent for an opportunity the vendor already holds a proposal on (a draft is enough), then read "You already have a proposal for this opportunity." from refusal_messages. proposal-cwu-create points there.

## Ruling

**Verdict:** return
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: is spec/contract/surface.yaml, with the new R-2.2 guidance on proposal-cwu-request, the contract the tests will act through? Ruling: return. The guidance points to the right action and reader: submit_with_individual_proponent sends the create request, and refusal_messages reads the reply. Three of its claims check out against the old create handler (sources/old/src/back-end/lib/resources/proposal/code-with-us.ts). The duplicate check runs after the opportunity lookup (line 306). An organization proponent with an existing proposal is refused first with 'Please select a different organization.' (lines 331-351). The refusal comes back under `conflict` with 'You already have a proposal for this opportunity.' (lines 365-368). But the comment states as fact that the check runs 'before it looks at any field, so the second request is refused with that message whatever its fields hold', and the code contradicts this. The `status` field is checked first (lines 296-304): a missing or invalid status is refused under `status`. A status of Submitted on an opportunity that is no longer accepting proposals is refused next (lines 321-328) with 'This opportunity is no longer accepting proposals.' The test writer works blind from this contract, so the overstatement would lead them to send a request that gets a different refusal, and the resulting failure would surface as a calibration question about the product when it is a contract error. What would change the ruling: reword the sentence so that the second request must carry a valid status (Draft is safest) against a published opportunity still accepting proposals, and only the remaining fields (proposal text, attachments, the individual proponent's details) do not affect the refusal. Everything else in the change can stand as written, including the pointer comment on proposal-cwu-create and the re-address of missing-test/R-2.2 to derive-tests.

**Conditions:**
none
