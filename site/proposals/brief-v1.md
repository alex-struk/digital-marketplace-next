| Field | Value |
| --- | --- |
| gate | G0 |
| opened | 2026-09-06T20:05:24.878Z |
| holder | agent:product-owner |

# Is this brief the tech lead's intent for the rebuild?

**Recommendation.** Yes: adopt the brief as the input to the intent stage.



## Ruling

**Verdict:** approve
**By:** agent:product-owner

The brief names its user groups (public sector staff publishing opportunities; vendors registering organisations, affiliating members and submitting proposals), states its constraints explicitly (existing PostgreSQL schema kept, Keycloak retained, WCAG 2.1 AA, BC Design System, no personal data in fixtures, old application's tests not consulted when writing the spec), and lists its open questions rather than answering them by guesswork (which recovered behaviours are bugs rather than intent; which program variants differ only by configuration). Scope matches J2 — sandbox only, nothing to the live service, old repo read-only. None of the three refusal grounds apply: no unlisted assumption presented as fact, no criteria yet marked inferred or open, no contradiction with J2. Tier is STANDARD and no producing stage reported low confidence, so escalation is not warranted. Two defects are real but do not block the intent: 'measurable parity' names no metric or threshold, and the layout check fails on a missing spec/domains directory that this proposal did not cause.

**Conditions:**
- Define what 'measurable parity' measures and the threshold that counts as met, against the oracle configured in .sdlc/config.yaml, before G1 spec sign-off.
- Resolve the failing layout check (missing spec/domains vs domains held as headings in spec/spec.md) before the spec stage writes its first criterion.
- Treat the brief's description of the old system (custom Elm-style front-end, Express, Knex, PostgreSQL, Keycloak, OpenShift) as a claim the archaeology stage confirms against the pinned commit b0f0c99, not as established fact.
