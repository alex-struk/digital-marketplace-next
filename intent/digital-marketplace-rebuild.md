# Intent: Digital Marketplace rebuild
Status: draft

## Problem
The Digital Marketplace administers three procurement programs for the BC Public
Service — Code With Us, Sprint With Us and Team With Us. It is built as a
full-stack system on a custom, in-house front-end framework rather than on a
mainstream one, and the specification it was built to is not held anywhere
separate from the running application: the only statement of what the service
does is the system itself.

Two things follow, and they are the stated reason for this work. First, it is
unproven that an agentic pipeline can recover a specification from an existing
system and rebuild the system to that specification with measurable parity.
Second, there is no modern code base that the product owners could choose to put
in place of the existing one.

The brief does not say who is currently harmed by the existing application, or
what it costs them — see the first open question below.

## Proposed outcome
A rebuilt application that keeps the existing behaviour and the existing database
schema, reaching **measurable parity** with the existing system.

The brief states parity as the outcome but does not define the measure, the
threshold, or who judges it. That gap is recorded as an open question rather
than filled with a metric; until it is answered this outcome is not yet
checkable.

Two conditions on the outcome are stated and are testable as written:

- The rebuild runs only in sandbox environments. Nothing ships to the live
  service — true or false at any moment.
- The result is a code base that could later replace the existing one if the
  product owners choose to. Whether they so choose is outside this intent.

## Affected users and systems

**People, by role**

| Role | What they do in the service |
| --- | --- |
| Public sector staff | Create and publish procurement opportunities. |
| Public sector staff, evaluating | Evaluate proposals through defined stages and award the opportunity. |
| Vendors | Register organisations, affiliate team members, and submit proposals. |
| Product owners | Decide whether the rebuilt code base later replaces the existing one. |

**Systems**

| System | Relationship to this work |
| --- | --- |
| The existing Digital Marketplace application | The system the specification is recovered from and the parity is measured against. Built as a full-stack TypeScript system on a custom Elm-style front-end framework, with Express and Knex over PostgreSQL. |
| The PostgreSQL database schema | Kept by the rebuild. Shared subject matter between the existing system and the new one. |
| Keycloak | Provides sign-in. Kept. |
| OpenShift | Where the existing application is deployed. |
| Sandbox environments | The only environments the rebuild runs in. |
| The live service | Explicitly out of reach: nothing ships to it. |
| The agentic pipeline | Performs the specification recovery and the rebuild, and is itself one of the two things under test. |

**Programs affected**: Code With Us, Sprint With Us and Team With Us. The brief
does not say whether all three must be rebuilt, or in what order.

## Constraints

Stated in the brief, in its own terms:

- The existing database schema is kept **unless a criterion requires a change**.
- Sign-in stays Keycloak.
- Accessibility to WCAG 2.1 AA.
- The BC Design System for the user interface.
- No personal data in fixtures.
- The old application's own tests are not consulted when writing the
  specification.
- The rebuild runs only in sandbox environments; nothing ships to the live
  service.
- Behaviour is kept — the rebuild is on a different stack, not a different
  service.

The brief names the target as "a modern, opinionated stack" without naming it.
Recorded as stated; not resolved here.

## Evidence
The stakeholder brief at `intent/brief.md` is the sole source for this intent. No
criterion IDs (@R-xx.y) exist yet — the specification is what the pipeline is
meant to recover, so the evidence trail runs the other way for now: this intent
precedes the criteria rather than citing them.

Observations taken from the brief and used above:

- The service administers three procurement programs for the BC Public Service.
- The flow of work is: staff create and publish opportunities → vendors register
  organisations, affiliate team members and submit proposals → staff evaluate
  proposals through defined stages and award the opportunity.
- The existing system is a full-stack TypeScript application on a custom
  Elm-style front-end framework, Express and Knex over PostgreSQL, with Keycloak
  sign-in, deployed on OpenShift.
- The purpose is twofold: prove the pipeline can recover a specification and
  rebuild to it with measurable parity, and produce a modern code base that could
  later replace the old one if the product owners choose to.
- The brief names two questions it expects the pipeline to surface rather than
  answer; they are carried below as open questions rather than treated as
  settled.

## Open questions
- [ ] Which recovered behaviours are bugs rather than intent? (Named in the brief
      as a question for the pipeline to surface rather than answer.)
- [ ] Which of the three programs' variants differ only by configuration? (Named
      in the brief as a question for the pipeline to surface rather than answer.)
- [ ] How is "measurable parity" measured — what is compared, by what method, and
      what threshold counts as parity reached rather than approached?
- [ ] Who judges whether parity has been reached, and at what point is that
      judgement made?
- [ ] What is wrong with the existing application today — who is currently stuck,
      and what does it cost them? The brief gives the rebuild's purpose but names
      no user or operator pain.
- [ ] Must all three programs be rebuilt to reach the outcome, or is a subset
      sufficient? If a subset, which, and in what order?
- [ ] Does "keeping its behaviour" cover the whole of the existing application,
      or is any part of it out of scope for the rebuild?
- [ ] What is the "modern, opinionated stack"? Has it already been chosen, and by
      whom, or is choosing it part of the work?
- [ ] Who rules that "a criterion requires a change" to the database schema, and
      how is such a change recorded?
- [ ] Where does data in the sandbox environments come from, given that fixtures
      may hold no personal data?
- [ ] Which identity provider instance and realm do the sandbox environments sign
      in against, given that sign-in stays Keycloak?
- [ ] Where do the sandbox environments run? The brief states the deploy target of
      the existing application but not of the rebuild.
- [ ] Is there a date, milestone or event by which the rebuild must reach parity?
- [ ] If the old application's tests may not be consulted when writing the
      specification, may they be consulted at any later stage — and does the same
      restriction apply to its source code and its documentation?
- [ ] What would make the product owners choose to put the rebuilt code base in
      place of the existing one — what do they need to see?
