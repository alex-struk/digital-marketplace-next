| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-03T15:17:23.397Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** The contract now says what a registration sent by someone who isn't signed in gets back.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've supplied what missing-test/R-3.2 needed, and I'm handing it to the test writer (derive-tests). The contract now says what a registration sent by someone who isn't signed in gets back. The oracle (the old application, run as the comparison target) started cleanly with no changes to its setup, and it's back down.

**What the owed item needed.** The organization-request page described registering by direct request (`register_by_request`) only for signed-in people. Nothing said whether it could be sent with no session or what the answer would be, so no test could reach the clause "a request from anyone else is refused" for a visitor who isn't signed in.

**What I added.**
- **`spec/contract/surface.yaml`, organization-request page:** a "Registering signed out" paragraph and one line on the action itself. A test acts as `anonymous-visitor`, which has no sign-in (`sign_in: null`), so the request carries no session cookie. The old service refuses it the same way it refuses public sector staff: status 401, the message "You do not have permission to perform this action." filed under `permissions`, no organization identifier, and nothing created.
- **Where that comes from in the old code:**
  - `createOrganization` in `src/back-end/lib/permissions.ts` requires a vendor, which is false without a session.
  - The handler in `src/back-end/lib/resources/organization.ts` also checks that someone is signed in.
  - `wrapRespond` in `src/back-end/lib/server/index.ts` turns any `permissions` refusal into 401.
- **Two cautions for the test writer, also on the page:**
  - The registration sent must be complete and valid, or the answer is field errors instead of a permissions refusal.
  - The stored-state readings need a signed-in reader. Signed out, "nothing was created" is shown by the empty organization identifier, or by signing in as the administrator afterwards and checking the organization list.
- **`spec/contract/personas.yaml`:** the anonymous visitor's `can` list now includes sending an organization registration by request and being refused.

**What I didn't change.** All the existing pages, the other personas, `openapi.yaml` (it already has `createOrganization`), `observables.yaml`, the `tests/seed/` files and manifest, and `.sdlc/oracle/compose.yml`. None of them needed anything for this item. No page was removed.

**Proving the oracle.** `oracle up` started four copies, ran all 78 migrations, loaded the seed and started the app.
- Reading organizations through the app (`/api/organizations?page=1&pageSize=50`) returns the seeded ones, including the manifest's `seed.organizations.qualified` ("Northern Pines Digital Ltd."). Without the paging parameters that call answers 400, so I added them.
- A complete registration sent with no session came back 401 with exactly the stated body, and no organization appeared in the list afterwards.
- `oracle down` ran and the containers are gone.

**Two notes for whoever runs this next:**
- I couldn't use the `$SDLC_BIN` variable in this session, so I called the CLI directly at `~/GitHub/agentic-sdlc/bin/sdlc.mjs`.
- A Python YAML parse check needed approval and didn't run. The edits are comment lines and one plain list entry with no colons or quotes, so I expect them to parse, but that wasn't checked by a tool.

re-address missing-test/R-3.2 to derive-tests: organization-request now says `register_by_request` may be sent as persona.anonymous-visitor (no session) and is refused with status 401, the "You do not have permission to perform this action." message filed under `permissions`, and an empty `organization_identifier`. I confirmed this against the running oracle, and anonymous-visitor's `can` list now names it.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the organization-request page now gives derive-tests what it needs to test the R-3.2 clause 'a request from anyone else is refused' for someone who isn't signed in. I approve. The new paragraph in surface.yaml says the request can be sent as persona.anonymous-visitor with no session, and that the old service answers 401 with 'You do not have permission to perform this action.' filed under permissions, an empty organization_identifier, and no organization created. The old code supports this. createOrganization in sources/old/src/back-end/lib/permissions.ts:195 requires isVendor(session) and accepted terms, which is false without a session. wrapRespond in sources/old/src/back-end/lib/server/index.ts:731 returns 401 for any permissions refusal. The worker also says the running oracle (the old application) gave exactly that answer and created no organization. The two cautions on the page are correct and save the test writer from a false failure: the registration sent must be complete and valid, or the answer is field errors; and stored-state readings come back empty when signed out, so 'nothing created' has to be shown by the empty identifier or by signing in as administrator afterwards. The personas.yaml entry is a plain list item and personas.ts is regenerated to match. The YAML parse was not checked by a tool, but the only non-comment change is that one plain list entry. This proposal does not settle build-slice-11-3#1 or #2, which are build work on the rebuilt app. missing-test/R-3.2 stays open until derive-tests writes the test and it runs. All three are left open. I would return this if the oracle had answered something other than 401 with that body, or if the page showed the session check happening after field validation, because then a valid registration would be needed for a different reason than the page gives.

**Conditions:**
none
