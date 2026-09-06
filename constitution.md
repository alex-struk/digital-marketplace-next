# Constitution — digital-marketplace-next

> Amend by proposal. Platform articles stay; a project exception is recorded
> under J6, never by deleting platform text.

**Service:** {{SERVICE_PURPOSE}}
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
{{SERVICE_PURPOSE}}

### J2 — In scope / out of scope
- In: {{IN_SCOPE}}
- Out: {{OUT_SCOPE}}

### J3 — Forbidden patterns
{{FORBIDDEN_PATTERNS}}

### J4 — Domain language
| Term | Meaning |
| --- | --- |
| {{TERM}} | {{MEANING}} |

### J5 — Non-functional baselines
{{BASELINES}}

### J6 — Recorded exceptions
| Platform article | Exception | Decision record |
| --- | --- | --- |

### J7 — Development notes
{{DEV_NOTES}}

## Amendment
Platform articles change by a proposal held at G-POL. Project articles change by an ordinary proposal at G2.
