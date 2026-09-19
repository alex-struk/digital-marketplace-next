| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-09-19T09:43:01.659Z |
| holder | agent:architect |

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I cut the build into 21 vertical slices.

I cut the build into 21 vertical slices. All 248 accepted, non-superseded criteria are placed, each in exactly one slice. I wrote `plan/plan.md` with its constitution check, `plan/tasks.md`, and six decision records under `docs/decisions/`.

**How I checked the count.** The spec's generated table says 286 criteria are accepted. 38 of those carry a `supersededBy` pointer, which leaves 248. I couldn't run a script here (running Python needed approval), so I counted by domain by hand. I then pulled every ID out of `tasks.md`: none repeats, none is missing, and no superseded ID appears. Someone should still run the real check.

**The slices, in order:**
1. **Visitors can read the service's own pages.** This is the first working version, deployed end to end.
2. **Sign in, finish signing up, sign out.** Also builds the email path every later notice uses.
3. **A person's own profile.** Also builds the whole file store, first used for the profile picture.
4. **Administrators manage people's accounts.**
5. **Administrators write and manage pages.**
6. **Announcing changed terms**, and vendors accepting them again.
7. **Staff draft, submit and publish a Code With Us opportunity.** This slice holds the state model for all three programs.
8. **Finding opportunities**, watching them, and the new-opportunity notice control on the list.
9. **Running an opportunity after publication:** addenda, notes, cancellation and reporting.
10. **Sprint With Us and Team With Us opportunities**, with their evaluation panels.
11. **Registering an organization.**
12. **Building its team.**
13. **Qualifying for Sprint With Us and Team With Us.**
14. **Code With Us proposals.**
15. **Sprint With Us and Team With Us proposals.**
16. **Closing at the deadline in all three programs**, plus Code With Us scoring and award.
17. **Individual evaluation** by panel members.
18. **Consensus and finalising** the questions stage.
19. **Challenge stages and award** for Sprint With Us and Team With Us.
20. **Proposal exports** and the full report of a completed opportunity.
21. **The page previewing every email**, which can only be finished once every message exists.

**Criteria that were hard to place:**
- **Needed before they can be shown:**
  - R-1.19 and R-1.20 define every state and permitted move for all three programs. They sit in slice 7, but most of those states are only reached in slices 16–19.
  - R-1.1 covers closing in all three programs, which is why closing waits until slice 16, after slice 15.
  - R-1.25 sits in slice 19, where the last program's final stage exists.
  - R-7.18 sits in slice 1, although four of the five links to that page arrive in slices 7 and 10.
- **Absences:** R-4.13 (no way to create the first administrator inside the service) and R-7.23 (nothing shows old page versions) sit with what they constrain.
- **Platform fact recorded as a criterion:** R-8.16, where uploads are written on the server.
- **A missing check kept as accepted behaviour:** R-2.15 lets Sprint With Us and Team With Us proposals be created after the deadline. The builder must not quietly "fix" it.

**Accepted criteria that contradict each other.** Each pair sits in one slice so one builder deals with it:
- R-6.6 says every email offers "Unsubscribe"; R-6.16 says emails the preference doesn't govern must not.
- R-5.11 lets an administrator read individual evaluations at every stage; R-5.28 says only the evaluator can before consensus.
- R-8.25 names only two programs; R-8.20 requires one rule for all three.

**Constitution rules that shaped the plan:**
- **J3** (no test-only entrances): the three test-only sign-in routes in the recovered API contract are not built, and tests sign in through the sandbox Keycloak instead.
- **J5**: the database schema is kept, and the migration history is continued so an old database upgrades in place.
- **P4 and J2**: sandbox OpenShift only, and the database, Keycloak and mail server are provided by the platform.
- **P1 and P2**: screens are built from the design catalogue on the BC design system.
- **P3**: synthetic data only.
- **P7**: the API contract is kept so the separate acceptance suite works unchanged.

**Decision records:**
- **0001:** one TypeScript service serves the API and a React app, with rules shared between browser and server.
- **0002:** the schema is kept; the only data changes are three named migrations.
- **0003:** the recovered HTTP contract is kept, minus the test-only routes.
- **0004:** every session comes from Keycloak; the first administrator comes from seed data.
- **0005:** deadline closing runs on the next request, not on a scheduler, as R-1.1 requires.
- **0006:** OpenShift sandbox deployment only.

**Assumptions that need a ruling:**
- **The stack.** There is no `.sdlc/config.yaml` in this workspace, so I couldn't read "the pipeline's stack". I assumed Node 22, TypeScript, Fastify, Knex and React 18 with Vite, matching the design catalogue and the old application.
- **Old "suspended" opportunities.** R-1.51 says they must be mapped to a defined state; I chose "cancelled".
- **Sandbox infrastructure.** I assumed the platform provides PostgreSQL, a Keycloak realm seeded with the test usernames, and a mail catcher.
- **Old public grants on draft attachments.** The old service made Sprint With Us and Team With Us draft attachments readable by anyone. Those grants survive in the kept data. I left them in place because no criterion says to remove them, but whether to revoke them is a privacy question for a person.
- **A missing criterion.** The ruling on D-content-26 says one is owed: a program's terms can currently be accepted with nothing shown. No such criterion is accepted yet, so nothing is planned for it.

## Ruling

**Verdict:** return
**By:** agent:architect

Question: is this the right cut of the work, and does each slice stand on its own? Ruling: return. The 21-slice cut, the constitution check and the handling of J3 are sound, but the plan's stack rests on a false premise. The proposal says no .sdlc/config.yaml exists, yet it does and sets stack: openshift-ts, whose profile (stacks/openshift-ts/SKILL.md) requires NestJS/Prisma, React/Vite/TanStack Router, the app/frontend, app/backend and app/migrations layout, PKCE sign-in from the SPA, and pinned quickstart-openshift-helpers deploy workflows. Decision record 0001 picks Fastify/Knex, an app/server/web/shared layout and a server-side sign-in flow without acknowledging the profile, so it is not a valid decision record for the departure, and Fastify and Knex are absent from the dependency register. What would change the ruling: a revision that adopts the profile, or rewrites 0001 as an explicit exception that justifies each departure against it (Knex, to continue the old migration history, is the one plausible case).

**Conditions:**
- Align plan.md, tasks.md and decision record 0001 with the openshift-ts stack profile in .sdlc/config.yaml, or record each departure (framework, ORM/migration tool, repository layout, sign-in flow, deploy workflow) as an explicit exception with its reason.
- Remove the 'no config.yaml present' assumption from plan.md and 0001.
- Any dependency not in the pipeline's dependency register that remains in the plan must be listed for the tech lead's ruling.
- On resubmission, route to the tech lead: the R-1.51 status check constraint narrowing is a schema change and triggers escalation.
- Run a script to confirm that every accepted, non-superseded criterion appears exactly once in tasks.md, and attach its output.
