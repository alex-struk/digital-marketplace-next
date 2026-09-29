---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added what all eight owed criteria were missing to the contract, and checked each addition against the running oracle, either by a live request or by reading the old code where a screen was involved…"
opened: 2026-09-29T02:36:05.581Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added what all eight owed criteria were missing to the contract, and checked each addition against the running oracle, either by a live request or by reading the old code where a screen was involved…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added what all eight owed criteria were missing to the contract, and checked each addition against the running oracle, either by a live request or by reading the old code where a screen was involved. The oracle started with the existing override unchanged. It is down again.

## What this run added

The contract was already mature, so this run was about the eight owed items. Two things drove the choices:
- **Screen or request.** Where the old screens really do show what a criterion needs, I added it to the page. Where the old screen shows only a general notice, or never sends the request at all, I added a request surface (a page entry that stands for a direct call to the old application's own API).
- **Placement.** New page entries carry `test_id: null`, because test IDs are filled in at the design gate. `openapi.yaml` already covered every route used below, and `observables.yaml` needed nothing.

**Pages changed or added in `spec/contract/surface.yaml`:**
- **proposal-swu-edit and proposal-twu-edit** gain `choose_organization` and the team-member controls. They also gain `field_error` and `organization` observations. The old edit form keeps the organization choice open while editing a submitted proposal. When the service refuses the save, the form puts the service's own wording against the organization field: "Organization cannot be changed once the proposal has been submitted". I confirmed this from the form code, not live.
- **proposal-swu-view and proposal-twu-view** gain a `rank` observation. The administrator and the opportunity's owner see it while the opportunity is still being evaluated. Live on the seeded team-scenario opportunity (swuTeamScenarioLastToScoreB): the fully evaluated proposal was ranked 1st, and the one still waiting for its scenario score had no rank. So did the one left behind at the questions.
- **proposal-team-request** now allows the organization to be left out. Live, the service answered "An organization must be specified before submitting." Its `refusal_by_field` now also locates messages against a single question answer, by the question order it was sent for. The word-limit wording is "Response must be between 1 and N words long."
- **organization-edit** gains `change_logo`, `current_logo` and `logo_refused_error`. On the oracle the screen's message for a refused logo is its own general one: "Please select a different logo image." The criterion only needs the refusal, so that is enough.
- **New: proposal-evaluation-request** sends a stage score straight to the service. The service checks the proposal before the opportunity. Only a proposal already carried into the team scenario, on an opportunity still at the code challenge, gets "The opportunity is not in the correct stage of evaluation to perform that action." Any other proposal gets the general permission message. I seeded exactly that starting point and confirmed both answers live.
- **New: affiliation-approval-request**, plus a `membership_identifier` observation on affiliation-invitation-request. Live:
  - The owner accepting on the invited person's behalf was refused with the permission message.
  - The invited person accepting got 200 (success).
  - A second acceptance was refused with "Membership is not pending."
- **New: user-account-self-request** (`/api/sessions/current`) and **user-account-request** (`/api/users/:userId`). Both return `new_opportunity_notices_since`. The profile screens show only whether notices are on; the account record holds the time they were turned on. Live, turning notices on recorded that time.

**Personas:** I added **vendor-completing-profile**. It signs in through the session route `/auth/createsessionvendor/17` on the oracle, and as `test-vendor-17` on the new target's sandbox identity provider. The existing first-time-vendor persona cannot sign in on the oracle, so R-4.24 had no starting point there. This seeded account has never accepted the terms, so the old app sends it to `/sign-up/complete`, which is exactly the criterion's starting point. The other personas are unchanged.

**Seed:**
- `010-sprint-with-us-stages.sql` gains opportunity 30, a Sprint With Us opportunity at the code challenge. Its first proposal is already screened into the team scenario; its second is not. The manifest handles are `opportunities.swuCodeChallengeWithScenarioScreenedIn`, `proposals.swuScreenedIntoScenarioEarly` and `proposals.swuScreenedIntoCodeChallenge`.
- New `015-profile-completion.sql` adds `users.vendorCompletingProfile`: notices unset and terms never accepted. With notices off it is outside the new-opportunity announcement, so the seeded mailing counts do not change.

## Oracle

The first `oracle up` did nothing: copies from an earlier stage were still running, so my new seed rows were never loaded. I took it down and brought it up fresh. The migration ran (78 migrations), all 16 seed files loaded, four copies started, and `users.vendorCompletingProfile` was readable through the application. No override change was needed, and I ran `oracle down` at the end.

## What I could not do

The sandbox only allowed the oracle commands, so I could not run a YAML parser over the edited files. I read the changed sections back for indentation instead. The seed SQL was proven by the oracle loading it.

## Hand-offs

re-address missing-test/R-2.22 to derive-tests: proposal-swu-edit and proposal-twu-edit now declare choose_organization, add_phase_team_member/set_scrum_master (swu) and add_team_member_for_resource (twu), and field_error, which holds the service's "Organization cannot be changed once the proposal has been submitted" against organization, plus an organization observation
re-address missing-test/R-2.31 to derive-tests: rank observation on proposal-swu-view and proposal-twu-view, readable by the administrator during evaluation; starting point seed.opportunities.swuTeamScenarioLastToScoreB (twuChallengeLastToScore for Team With Us)
re-address missing-test/R-2.21 to derive-tests: proposal-team-request.refusal_by_field now locates each message against the opportunity-question answer it concerns, by question order, with wording versus numbering distinguished
re-address missing-test/R-2.28 to derive-tests: new proposal-evaluation-request (score_team_scenario_by_request, refusal_messages, refusal_status) and seed.proposals.swuScreenedIntoScenarioEarly on seed.opportunities.swuCodeChallengeWithScenarioScreenedIn, which yields the stage message as the administrator
re-address missing-test/R-4.24 to derive-tests: new persona vendor-completing-profile (seed users.vendorCompletingProfile, reaches /sign-up/complete on the oracle) and user-account-self-request.new_opportunity_notices_since (user-account-request for an administrator reading another account)
re-address missing-test/R-8.30 to derive-tests: organization-edit now declares change_logo, current_logo and logo_refused_error
re-address missing-test/R-2.16 to derive-tests: proposal-team-request (sprint-with-us) now accepts a submission with the organization left out, and refusal_messages reads "An organization must be specified before submitting."
re-address missing-test/R-3.9 to derive-tests: new affiliation-approval-request (accept_membership_by_request, refusal_messages, refusal_status, membership_status), addressed by seed.affiliations.pendingInvitation or by membership_identifier, now on affiliation-invitation-request

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this contract gives the tests a way to observe each of the eight owed criteria (R-2.22, R-2.31, R-2.21, R-2.28, R-4.24, R-8.30, R-2.16, R-3.9) without adding anything the criteria did not say. I approve. Each addition is the smallest thing its owed condition asked for, and each claims only behaviour the old application was seen to have. Six were confirmed by live requests to the old application, and the organization-change message was confirmed from the form code; the proposal says which is which. Where the old screens show a real field-level message, the addition goes on the screen: the organization choice, the field error and the organization on both edit pages, the rank on both view pages, and the logo controls on organization-edit. Where the screen only shows a general notice, or never sends the request at all, the addition is a request surface that reads the service's own answer: proposal-evaluation-request, affiliation-approval-request, and the two account-record requests. That split is right, and it keeps screen behaviour apart from service behaviour. The R-2.28 page also records that the service checks the proposal before the opportunity. That is a caveat about the old application, not an assumption: without it a blind test would expect the stage message on a proposal that gets the general permission message. The new seed, opportunity 30 with one proposal already screened into the team scenario, is the one state that produces the stage message. I checked that its code-challenge score of 80 sits in the right argument of the seed function, and the oracle loaded the file. The vendor-completing-profile persona fixes a real gap: the first-time-vendor persona cannot sign in on the old application, so R-4.24 had no starting point there. The new persona's sandbox username follows the existing test-vendor numbering. Leaving the account's notices unset keeps it out of the new-opportunity mailing, so the seeded mailing counts are unchanged, and the manifest now says so. The eight criteria themselves are untouched: all stay confirmed and accepted, so there is nothing to confirm, edit or spike, and there are no condition lines. The one gap is that the YAML was checked by reading it back, not by running a parser over it, so derive-tests or a later check may still hit an indentation error. I would return this if a request surface turned out to assert a message the service does not give, if the rank observation contradicted R-2.31's 'only once fully evaluated', or if the new seed changed an existing count. None of these showed up.

**Conditions:**
none
