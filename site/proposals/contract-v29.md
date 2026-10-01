| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-01T13:49:26.673Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** I added the one thing the owed test needed: a way to read an opportunity's view count.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the one thing the owed test needed: a way to read an opportunity's view count. The oracle started cleanly with the existing override, and the new read works against it.

**What this run changed.** The contract was already complete from earlier runs: pages, personas, the API description, observables, sixteen seed files with their manifest, and the Compose override. This run owed one missing test, R-1.6 ("opening an opportunity's public page counts as a view"). The observables file already described a `counters` observable, but no surface page reached it, so a test had nothing to call. I added one page to `spec/contract/surface.yaml`:

- **`opportunity-counters`** (domain `opportunities`), route `/api/counters?counters=opportunity.:program.:opportunityId.views`, with no actions and two observations:
  - `view_count`: a whole number. A counter that has never been incremented is left out of the service's answer and reads as 0.
  - `refused_when_not_permitted`.

Both route parameters can be filled. `:program` comes from the fixed set the application defines. `:opportunityId` is a seed handle, such as `seed.opportunities.publishedCodeWithUs`, or the `opportunity_identifier` read off the page a newly published opportunity lands on. In `spec/contract/observables.yaml`, the `counters` entry now names the counter's form, says what the answer looks like, says who may read it, and points to the new page.

**Where the contract differs from the request.** The missing-test note asked for the count to be "readable signed out or by any persona". The old application does not allow that. `permissions.readManyCounters` (`src/back-end/lib/permissions.ts:1622`) allows only administrators and public sector staff, and I confirmed against the running oracle that a request with no session is refused. The page therefore tells the test to read the count as `persona.administrator`, open the public page as whoever the criterion names (signed out included), and read the count again as the administrator. The criterion is still fully testable this way.

The page also records two timing hazards:
- The public page asks for its view to be counted as it loads and does not wait for the answer (`view.tsx:98`). A test should re-read every 500 ms for up to five seconds before comparing.
- Every test that opens the same opportunity moves the same counter. A test checking for an increase of exactly one should either run alone against that opportunity or use one it published itself.

**Personas, seed and sign-in.** Nothing changed this run. The oracle signs in through session routes:
- `/auth/createsessionadmin` for the administrator
- `/auth/createsessiongov` for public sector staff
- `/auth/createsessionvendor/:n` for vendors

The new target signs in through sandbox identity-provider usernames. The anonymous visitor has `sign_in: null`. Seed files `000` to `015` hold the synthetic installation, users, organizations, content, opportunities at each stage, evaluations, files and profile records, all named in `tests/seed/manifest.yaml`. I did not seed a view count. The test reads the count before and after, so no prior count needs to be planted.

**Oracle.** I ran `oracle up` with the existing override unchanged, on the first attempt:
- All 78 migrations ran and the app container started on port 4300, with the mail API on 8025.
- Signed in as the administrator, I fetched the seeded opportunity `00000000-0000-4000-8000-000000000601` through the application's own API, and it came back with its seeded title.
- Reading its view counter returned `{}`. One increment made it 1. The same read with no session was refused with "You do not have permission to perform this action."

I ran `oracle down` afterwards and it completed. The sandbox here blocks shell variable expansion, so I ran the pipeline's command-line tool by its absolute path (`~/GitHub/agentic-sdlc/bin/sdlc.mjs`) rather than through `$SDLC_BIN`. For the same reason I could not run a YAML parser over the edited files. The two edits are small and indented the same way as the entries around them, and I read the surrounding text before making them.

**Not recovered.** Reading the count signed out, as the missing-test note hoped, is not possible against the old application. The page states this rather than hiding it.

re-address missing-test/R-1.6 to derive-tests: added surface page `opportunity-counters` (route `/api/counters?counters=opportunity.:program.:opportunityId.views`) with observation `view_count` (absent counter reads as 0; readable as persona.administrator or public-sector-staff, refused signed out), and linked it from `observables.counters.surface`; verified on the oracle that one increment of seed.opportunities.publishedCodeWithUs moves the count from absent to 1.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is opportunity-counters the contract the R-1.6 test will act through? Ruling: approve. Reason: R-1.6 says opening an opportunity's public page increases its recorded view count by one, for anyone, signed in or not; until now no surface page could read that count, so the owed test could not be written. The new page reads it, and its claims hold against the old source: readManyCounters (src/back-end/lib/permissions.ts:1622) allows only isAdmin or isGovernment; the counter name opportunity.<program>.<id>.views with program code-with-us, sprint-with-us or team-with-us matches src/shared/lib/resources/counter.ts:14-23; and all three public view pages call api.counters.update without waiting for the answer as they load (code-with-us/view.tsx:98, team-with-us/view.tsx:121, sprint-with-us/view.tsx:130), which is why the test has to re-read the count for a few seconds. Restricting who can read the count does not narrow R-1.6, which constrains who opens the page and not who reads the count, so reading it before and after as persona.administrator tests the criterion as written. The note that reading the count signed out is impossible is stated as a fact about the old application rather than hidden, and the interference note (shared counter; run alone or publish a fresh opportunity) is a property of the data a blind test author needs. What would change the ruling: evidence that the old application exposes view counts to vendors or anonymous visitors on some other route (the page would then need that route or a second observation), or the edited YAML failing to parse once checked with a parser.

**Conditions:**
none
