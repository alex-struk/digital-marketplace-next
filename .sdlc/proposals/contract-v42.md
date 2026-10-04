---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added one thing to the contract this run: a `set_hourly_rate` action on the `proposal-twu-edit` page."
opened: 2026-10-04T06:54:10.124Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added one thing to the contract this run: a `set_hourly_rate` action on the `proposal-twu-edit` page.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added one thing to the contract this run: a `set_hourly_rate` action on the `proposal-twu-edit` page. That was the only item owed. I also brought the oracle up, confirmed it worked and took it down again.

**The owed item (missing-test/R-2.10).** R-2.10 says a Team With Us proposal is refused when its hourly rates, at each resource's target allocation across the contract period, add up to more than the opportunity's maximum budget. It also says that check runs when a proposal is created and when it is edited. The existing test covers creation. It could not cover editing, because the "Manage a Team With Us proposal" page offered no way to change an hourly rate.

I checked the old application before adding one. Its edit tab (`sources/old/src/front-end/typescript/lib/pages/proposal/team-with-us/edit/tab/proposal.tsx`) renders the same shared form (`lib/components/form.tsx`) as the create page. That form has the team's hourly-rate fields, and it unlocks once the person starts editing. So the control really exists on the edit screen.

`set_hourly_rate` takes the same input as the create page's action: the resource, named by its service area, and the rate. It is available once `start_editing` has opened the form, and nothing is sent until `save_changes` or `save_changes_and_submit`. A refusal is read through the page's existing `field_error` and `submission_refusal` observations. The comment beside it also tells the test writer how to get a proposal to edit:
- Create one within budget on `proposal-twu-create`, with `save_draft` or `submit_proposal`.
- It lands on the edit page, where `proposal_identifier` returns its id.
- The opportunity itself comes from `opportunity-twu-create`, as the existing R-2.10 test already does.

The old application is known not to run this check on either path (that was R-2.8, which R-2.10 replaced). So an edit-path test should fail against the oracle and pass only against the rebuild, and that is the expected result.

I did not run any YAML check on the new entry, because the permission layer refused both commands. The entry copies the indentation and shape of its neighbours.

**The rest of the contract.** Earlier runs of this stage had already built all of it, and I left it unchanged:
- `spec/contract/surface.yaml`: every page the criteria need, each with its domain.
- `spec/contract/personas.yaml`: the old application signs people in through its development-only session routes (`/auth/createsessionadmin`, `/auth/createsessiongov`, `/auth/createsessionvendor/:id`). The rebuild uses a sandbox identity provider.
- `spec/contract/openapi.yaml`: recovered from the old application's own API description files under `src/back-end/docs/`, as its header comment records.
- `spec/contract/observables.yaml`: mail is read through mailpit at `${SDLC_MAIL_API}`. It also defines two start-up configurations, one for R-6.1 (notifications switched off) and one for R-7.29 (one service page missing).
- `tests/seed/`: 18 SQL files, from `000-installation` to `017-absent-service-page`, plus `manifest.yaml`. They create the users, organizations, opportunities at each evaluation stage, proposals, stored files and content pages, all with placeholder names and example.test addresses.
- `.sdlc/oracle/compose.yml`: the override for the old application's Compose file.

**Oracle.** It started on the first attempt and I changed nothing in the override. All 78 migrations ran, and the oracle came up at http://localhost:4300 with mail at http://localhost:8025, as four copies. To check the seed, I read the seeded opportunity `opportunities.closedTeamWithUs` (id `00000000-0000-4000-8000-000000000801`) through the application's own API. It came back with its seeded title and budget. The application had also moved it from PUBLISHED to EVAL_QUESTIONS_INDIVIDUAL because its deadline has passed, which shows it is acting on the seeded data. I then ran `oracle down`, and no containers were left running.

**Environment note.** The permission layer here refuses commands that expand variables, so `node $SDLC_BIN` could not run. I called the CLI by its literal path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`.

**Nothing went unrecovered this run.**

re-address missing-test/R-2.10 to derive-tests: added the set_hourly_rate action to proposal-twu-edit (spec/contract/surface.yaml), taking the resource by service area and the rate as proposal-twu-create's does, available after start_editing and sent by save_changes or save_changes_and_submit; the refusal is read through the page's existing field_error and submission_refusal, and proposal_identifier returns the id of a proposal saved from proposal-twu-create.
