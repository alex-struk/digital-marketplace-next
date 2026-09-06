# Constitution — digital-marketplace-next

> Amend by proposal. Platform articles stay; a project exception is recorded
> under J6, never by deleting platform text.

**Service:** Administers British Columbia's Code With Us, Sprint With Us and Team With Us procurement programs, letting public sector staff publish procurement opportunities and letting vendors submit proposals against them.
**Last reviewed:** 2026-09-06

## Platform articles (do not remove)

### P1 — Accessibility
All user-facing interfaces SHALL meet WCAG 2.1 Level AA. Prefer components that encode accessible behaviour. No colour-only status, unlabelled icon buttons, or missing form labels.
Source: convention
Policy citation still to be found.

### P2 — Design system
New BC Gov services SHOULD use `@bcgov/design-system-react-components`, `@bcgov/design-tokens` and `@bcgov/bc-sans`, and agents SHOULD consult the design system's own agent instructions before generating UI.
Source: convention
Policy citation still to be found.

### P3 — Privacy
No personal information MAY enter a system, log, model prompt or third-party API until a Privacy Impact Assessment appropriate to the classification is complete and recorded. Lower environments use synthetic or anonymised data. No secrets or tokens in the repository.
Source: https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/privacy/privacy-impact-assessments

### P4 — Deploy target
Production and lower environments SHALL target OpenShift on the BC Gov Private Cloud PaaS unless a decision record documents an exception.
Source: convention

### P5 — Spec as source of truth
Intent lives in versioned git under `spec/`. Chat is not the system of record. Decisions MUST be reconstructable from git artifacts.
Source: convention

### P6 — Human checkpoints
Humans own spec sign-off (G1), plan approval (G2) and review-and-ship (G3), directly or through a persona agent bound by policy with escalation and sampling. Agents MUST NOT self-merge.
Source: convention

### P7 — Test integrity
Acceptance tests derive from the spec in a workspace that cannot see implementation. The session that writes production code does not solely write the acceptance proof for it.
Source: convention

### P8 — Approved tools
Agents MAY use only the MCP servers, model routes and skill packs listed in `.sdlc/config.yaml` and its lockfile.
Source: convention

## Project articles

### J1 — Service purpose
The service administers British Columbia's Code With Us, Sprint With Us and Team With Us procurement programs. It lets public sector employees create and publish procurement opportunities, and lets vendors submit proposals against those opportunities.

### J2 — In scope / out of scope
- In: rebuilding the application on the pipeline's stack, and running it in sandbox environments for development and testing.
- Out: production operation of the service, environment operations and infrastructure, and the old application repository, which is read only as a reference and otherwise left untouched.

### J3 — Forbidden patterns
- No test-only entrances (routes, flags, or endpoints reachable only from tests) in application code.
- No reference to a production namespace in any workflow, configuration, or deployment target.
- No personal data in fixtures or seed data; use synthetic data only.
- No CSS or DOM selectors in acceptance tests; interact through accessible roles, labels, and visible text instead.

### J4 — Domain language
| Term | Meaning |
| --- | --- |
| opportunity | A procurement posting published by a public sector employee under one of the three programs. |
| proposal | A vendor's submission responding to an opportunity. |
| proponent | The individual or organisation submitting a proposal. |
| organisation | A registered vendor entity that can submit proposals and have team members act on its behalf. |
| affiliation | The relationship linking a user to an organisation, recording that the user acts for it. |
| evaluation stage | A step in reviewing submitted proposals, moving a proposal toward an award decision. |
| award | The decision that selects the winning proposal for an opportunity. |
| the three programs | Code With Us, Sprint With Us, and Team With Us — the three procurement programs the service administers, each with its own opportunity and proposal types. |

### J5 — Non-functional baselines
- Authentication: Keycloak using OpenID Connect, as in the current application.
- Data: the existing PostgreSQL schema is kept.
- Accessibility: WCAG 2.1 Level AA.

### J6 — Recorded exceptions
| Platform article | Exception | Decision record |
| --- | --- | --- |

### J7 — Development notes
To run the old application locally as the behavioural oracle: start its PostgreSQL database with `docker-compose up db` from the old repository's root, run its back-end with `npm run back-end:watch`, run its front-end with `npx vite dev`, and apply database migrations with `npm run migrations:latest`. Once migrations finish, the application is reachable at the local URL printed by the back-end process.

## Amendment
Platform articles change by a proposal held at G-POL. Project articles change by an ordinary proposal at G2.
