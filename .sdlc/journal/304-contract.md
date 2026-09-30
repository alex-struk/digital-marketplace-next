---
stage: "contract"
title: "contract"
at: "2026-09-30T07:01:39.336Z"
cost: 0.7881910000000001
turns: 28
session: "28afaef8-079a-46f8-9c81-38e9f4a83f5c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I added the one observation the owed Sprint With Us / Team With Us question criterion needed. The oracle started with the existing override, served a seeded record through its own API, and has been taken down again.

**What was owed.** The criterion "evaluation questions on Sprint With Us and Team With Us opportunities" says a question's position "is never entered by the person". The test writer had no way to see which fields a question form offers, so that clause could not be tested. I added an observation called `evaluation_question_fields` to `spec/contract/surface.yaml` on four pages: `opportunity-swu-create`, `opportunity-twu-create`, `opportunity-swu-edit` (team questions tab) and `opportunity-twu-edit` (resource questions tab). For the question at a given place in the list (the first is 1), it returns the fields offered for entry, in the criteria's words. There are five: `question`, `guideline`, `response_word_limit`, `maximum_score` and `minimum_score`. No position or order field is offered. I added it to the edit pages because people can also add and change questions there, and the same clause applies.

The old application's code shows this directly. In `src/front-end/typescript/lib/pages/opportunity/sprint-with-us/lib/components/team-questions.tsx`, the question state holds just those five fields (lines 24–28). The `order` value sent to the server is the question's index in the list, computed at lines 276–287 and not taken from any input. The Team With Us file `resource-questions.tsx` has the same structure (lines 24–28 and 278–289). Its `test_id` is `null`, as for other observations whose markup the design gate has not yet fixed.

**Everything else is unchanged.** Nothing was deleted from any page, persona, API operation, observable or seed file. The contract already covered every page the criteria need; this run touched only the four observations above. Sign-in is unchanged:
- **The old application (oracle):** personas sign in through the session routes, e.g. `/auth/createsessionadmin`, `/auth/createsessiongov` and `/auth/createsessionvendor/<n>`.
- **The new target:** personas use the sandbox identity provider usernames.
- **The anonymous visitor:** keeps `sign_in: null`.

The seed is still files 000 to 015 plus `tests/seed/manifest.yaml`. It holds:
- synthetic users for each persona, with `example.test` addresses and placeholder names;
- organizations and content pages;
- Code With Us, Sprint With Us and Team With Us opportunities, including closed ones and one standing at each evaluation stage;
- proposals and evaluation records, files, and team candidates.

**Oracle.** Running the pipeline CLI through `$SDLC_BIN` was refused because this session's permissions block shell variable expansion. I ran the same CLI at its literal path instead, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`. `oracle up` started four copies on the first attempt with `.sdlc/oracle/compose.yml` untouched; the app was at `http://localhost:4300` and the mail catcher's API at `http://localhost:8025`. I then:
- signed in at `/auth/createsessionadmin`, which answered with a 302 redirect and a session cookie;
- requested `/api/users/00000000-0000-4000-8000-000000000102` and got back the seeded `users.staffOne` record: "Casey Placeholder", `staff.one@example.test`, sign-in name `test-gov`. That shows the migration ran, the seed loaded, and the record is readable through the application itself.

`oracle down` completed.

**Not done or not checked.** I could not re-parse `surface.yaml` with a YAML tool, because the permission layer refused the parse commands. The four edits copy the indentation and shape of the entries around them, so I expect it parses, but it has not been machine-checked in this run. I also could not show the final diff for the same reason.

re-address missing-test/R-1.17 to derive-tests: added the observation `evaluation_question_fields` on opportunity-swu-create, opportunity-twu-create, opportunity-swu-edit and opportunity-twu-edit. It reports the five fields a question offers (question, guideline, response_word_limit, maximum_score, minimum_score) and that no position or order field is offered.