# Plan — digital-marketplace-next

How the rebuilt Digital Marketplace is to be built: what the application is, where it runs, what
happens to the data it inherits, and why the slices in `plan/tasks.md` come in the order they do.
It answers to `constitution.md`; the last section says how.

Inputs: the 248 accepted, non-superseded criteria in `spec/criteria-index.json` (the domain files
under `spec/domains/` carry their full text), the pages and actions in `spec/contract/surface.yaml`,
the HTTP contract and observables beside it, and the design in `design/DESIGN.md`,
`design/screens.yaml` and `design/catalogue/`.

## The shape of the application

One service, one image, one origin (decision record 0001).

```
browser ──► OpenShift Route ──► app (Node.js 22, TypeScript, Fastify)
                                 ├─ /api/*      resource routes, per spec/contract/openapi.yaml
                                 │               (deadline hook runs in front of these — 0005)
                                 ├─ /status     service status (deadline hook runs here too)
                                 ├─ /auth/*     OIDC sign-in, callback, sign-out  ──► Keycloak
                                 ├─ /admin/*    email notification reference
                                 └─ everything else ─► React 18 single-page application
                                 │
                                 ├──► PostgreSQL (existing schema, kept — 0002)
                                 └──► SMTP (mail catcher in sandboxes)
```

- **`app/web`** — the React single-page application. Every screen is built from its story in
  `design/catalogue/` using `@bcgov/design-system-react-components`, the design tokens and BC Sans.
  Routing follows `surface.yaml` exactly, including `/users/me` and the `?tab=` sections. Screens
  expose the accessible names, roles and visible text the acceptance suite reaches them by; the
  test IDs listed in the surface are attached as well so the design gate's bindings hold.
- **`app/server`** — the HTTP service. It keeps the recovered contract (0003) so the acceptance
  suite and the observables act on the rebuild exactly as on the oracle, and it drops the three
  test-only session routes. Authentication is Keycloak over OpenID Connect with server-side
  sessions (0004). Mail goes out over SMTP after the action it follows has committed, never
  blocking or failing that action.
- **`app/shared`** — validation and permission rules, imported by both sides. A large share of the
  accepted criteria correct places where the old browser and the old service disagreed about who
  may do what; putting each rule in one function both sides call is how the rebuild stops that
  class of defect coming back.

## What runs where

| Where | What | Owned by |
| --- | --- | --- |
| OpenShift sandbox `-dev` namespace | the app Deployment, Service and Route; built on every merge | this project |
| OpenShift sandbox `-test` namespace | the same image, promoted; the acceptance suite runs here | this project |
| Both namespaces | PostgreSQL, the Keycloak realm with synthetic personas, an SMTP mail catcher | the platform/pipeline, by configuration and secrets (J2 puts environment operations out of scope) |
| A developer's machine | the app against a local PostgreSQL and Keycloak, and the old application as behavioural oracle (J7) | each builder |

Nothing is deployed to, or configured for, a production namespace (J2, J3). The upload working
directory is an `emptyDir` volume because the root filesystem is read-only (0006).

## The data it inherits

The PostgreSQL schema is kept (J5, decision record 0002): no table or column is added, dropped or
renamed, and the old migration history is continued rather than restarted, so a database the old
application left behind upgrades in place.

**Survives unchanged.** Every table and every row: users and their sessions, organizations and
affiliations with their event history, the opportunities, versions, addenda, notes and status
histories of all three programs, proposals with their teams, answers, scores and histories,
evaluation panels, individual evaluations and consensuses, pages and their versions, files with
their bytes and read-access grants, subscriptions, counters, and the service-area approvals.

**Changes, and each change is a named migration.**

1. Opportunities stored as "suspended" are mapped to **cancelled** with a system history entry,
   and the status constraints are narrowed so the state cannot be stored again (R-1.51). The
   choice of cancelled is an assumption — see "For ruling" below.
2. The service level agreement page is created as a page the service needs (R-7.18).
3. A *fresh* installation is seeded with the needed pages minus the seven nothing links to; rows an
   existing installation already holds are left alone (R-7.12, and the note recorded against
   D-content-27).

**Changes in behaviour over the same data, done in code.** Team With Us processing may now go to
awarded (R-1.49); panels must have exactly one chair and every member a role (R-1.55, R-5.9,
R-5.37); new accounts start with new-opportunity notices off (R-6.20); an opportunity attachment
records no read access on the file itself and is read through what it hangs on (R-8.19, R-8.20,
R-8.25); a deactivated account is sent nothing but keeps its watches (R-6.17).

**Seed data for sandboxes** is synthetic only (P3, J3): the persona accounts named in
`spec/contract/personas.yaml`, the first administrator written directly into the data as R-4.13
requires (0004), and the fixed records the acceptance suite's seed manifest names.

## Why the slices are in this order

The first six slices settle every choice the rest depend on, and each is still worth having alone.

- **Slice 1** is the walking skeleton: the one service deployed to the sandbox, reading the kept
  schema, rendering formatted text safely, with the footer and the public page view. After it,
  the stack, the deploy path, the migration approach and the content renderer are fixed, and a
  visitor can read the service's own pages.
- **Slices 2–4** settle identity: Keycloak sign-in, the account kinds, sessions, and the mail path
  (first used by the welcome message, so every later notice lands on a path already proven).
  Slice 3 builds the whole file store under the smallest visible use of it, a profile picture, so
  that attachments, logos and embedded images in later slices are only new callers.
- **Slices 5–6** finish the administrator's content tools and the changed-terms broadcast, which
  vendors' proposal submissions later depend on (R-2.3 checks the current terms).

The rest follow the procurement itself, and each slice's dependency is the one before it in that
flow:

- **Slices 7–10** are opportunities. Code With Us comes first because it is the simplest program
  and carries every generic rule — versions, the state model for all three programs, permissions,
  the attachment control, the first broadcasts. Finding and following opportunities comes next,
  because a list needs something published to show. Running a published opportunity follows,
  because its notices go to watchers. Sprint With Us and Team With Us, with their panels, come
  last in this group because they add only program-specific content to machinery already in place.
- **Slices 11–13** are organizations — registration, team, qualification — which Sprint With Us
  and Team With Us proposals cannot exist without. They are placed after opportunities rather than
  before because the Code With Us proposal can name an organization but does not need a qualified
  one, and opportunities are the larger, riskier domain to settle early.
- **Slices 14–15** are proposals: Code With Us first, then the two programs that need a qualified
  organization and a panel.
- **Slice 16** is closure. It comes only once proposals exist in all three programs, because the
  deadline hook closes all three at once and a closure slice that could not close two of them
  would have to be reopened. It also carries the whole Code With Us evaluation and award, so after
  it one program runs end to end.
- **Slices 17–19** are the Sprint With Us and Team With Us evaluation: individual scoring, then
  consensus, then the challenge stages and award. The two programs share one implementation
  parameterised by what the questions are called, how many proponents go forward and what the
  next stage is named (R-5.36), so they are built together rather than as two passes.
- **Slices 20–21** are read-only surfaces over everything before them: exports and the full report
  need every stage to exist to show it, and the notification reference must show every message the
  service can send (R-6.19), which is only true once the last message exists.

## Criteria that sit awkwardly where they are

Every criterion is placed; these are placed with a reservation, and each reservation is worth a
reader's attention.

- **R-1.19 and R-1.20 (Slice 7)** define the full state model and the permitted-transition table
  for all three programs, but most of the states they name are only reachable in slices 16–19. They
  sit in Slice 7 because the model has to exist, whole, from the first saved opportunity; the later
  stages are shown working in the slices that reach them.
- **R-1.1 (Slice 16)** is one sentence about three programs. Its Code With Us half is demonstrated
  in the same slice as the rest of Code With Us evaluation; its Sprint With Us and Team With Us
  half (the evaluators being told) is why Slice 16 waits for Slice 15.
- **R-1.25 (Slice 19)** is generic — "every proposal in contention scored at its program's final
  stage" — but for Code With Us the equivalent is R-2.27, which Slice 16 delivers. R-1.25 sits
  where the last program's final stage exists.
- **R-7.18 (Slice 1)** names five places that link to the service level agreement page; only the
  learn-more screens exist in Slice 1. The page is seeded there, and the program cards and the three
  forms in slices 7 and 10 link to an address already known to resolve.
- **R-4.13 (Slice 4)** is a statement that something is absent — no way inside the service to
  create the first administrator. Nothing is built for it; Slice 4 carries it because that is where
  an administrator first acts, and the seeded first administrator is how a sandbox satisfies it.
- **R-7.23 (Slice 5)** is likewise an absence: nothing shows, compares or restores an old version.
  It sits with the version-keeping it constrains.
- **R-8.16 (Slice 3)** describes where an upload is written on the service's own machine. It is an
  implementation fact recovered as a criterion; on OpenShift it becomes a named `emptyDir` volume
  (0006), which is a platform concern more than a user-visible behaviour.
- **R-6.3 and R-6.1 (Slice 2)** turn on environment configuration. Every sandbox is a test
  environment, so the "not a test environment" half of R-6.3 is never observable in scope.
- **R-2.15 (Slice 14)** records a missing guard — Sprint With Us and Team With Us creation does not
  refuse a submission after the deadline — as accepted behaviour. It is placed with the Code With Us
  guard it contrasts with; the builder must not "fix" the other two programs without a new
  criterion.
- **R-2.37 and R-2.38 (Slice 20)** cover all three programs; the Code With Us export could have
  shipped in Slice 16, but the anonymity rule needs the Sprint With Us and Team With Us challenge
  stage (Slice 19) to be shown, so the whole export family is built once, there.
- **R-6.13 and R-6.19 (Slice 21)** can only be true once every message exists, which makes this the
  one slice whose size is set by all the others.

## Accepted criteria that pull against each other

These are all accepted and none supersedes another, so each is planned as written; the builder of
the named slice should raise them rather than silently pick a reading.

- **R-6.6 vs R-6.16 (Slice 3).** R-6.6 says every message ends with an offer labelled
  Unsubscribe; R-6.16 says a message the preference does not govern must not offer to unsubscribe.
  Both are in Slice 3 so one builder reconciles them. The plan's reading is that R-6.16, authored
  later to replace R-6.10, narrows R-6.6 to the new-opportunity announcement.
- **R-5.11 vs R-5.28 (Slice 17).** R-5.11 opens individual evaluations to the administrator and the
  owner "at every stage"; R-5.28 says no one but the evaluator reads them before consensus, and an
  administrator off the panel only after the question stages. Both are in Slice 17. They cannot
  both hold for an administrator during individual evaluation.
- **R-8.25 vs R-8.20 (slices 7 and 14).** R-8.25 names only Code With Us and Sprint With Us
  attachments; R-8.20 requires one rule for all three programs. The plan applies R-8.25's rule to
  Team With Us too.
- **R-4.31 (Slice 4) against the direction of R-5.9 (Slice 10).** R-4.31 keeps a rule on the interface alone (an
  administrator's own deactivation control); R-5.9 exists to move a similar interface-only rule into
  the service. The shared rules package would make R-4.31's asymmetry deliberate work, not a
  default, so the Slice 4 builder must preserve it on purpose.

## For ruling

Things the plan had to assume. Each is small to reverse now and expensive later.

1. **The stack** (0001). No `.sdlc/config.yaml` is present in this workspace, so "the pipeline's
   stack" (J2) could not be read. The plan assumes Node.js 22 LTS, TypeScript, Fastify, Knex, React
   18 with Vite, matching the design catalogue and the old application.
2. **The suspended mapping** (0002). R-1.51 says historical "suspended" records are mapped to a
   defined state; the plan picks cancelled.
3. **Sandbox infrastructure** (0006). The plan assumes the platform provides PostgreSQL, a Keycloak
   realm seeded with the persona usernames, and an SMTP catcher in each sandbox namespace, since J2
   puts building them out of scope.
4. **Historical public grants on draft attachments.** The old service marked Sprint With Us and
   Team With Us opportunity attachments readable by anyone at upload (the defect R-8.19 replaces).
   Those grants are rows in the kept data. The plan leaves them in place because no criterion says
   to remove them, but they keep old draft attachments readable by anyone; whether to revoke them
   is a data-protection question for a person, not a planning default.
5. **The owed terms-page criterion.** The ruling recorded against D-content-26 says a criterion is
   owed for a program's qualification terms being acceptable with nothing shown in their place. No
   such criterion is accepted yet, so nothing in Slice 13 plans for it.

## Constitution check

**P1 — Accessibility (WCAG 2.1 AA).** Every screen is built from its catalogue story, and the
catalogue was built on the BC design system's accessible components and scanned with axe
(`design/report.json`). Each slice's definition of done includes an axe pass over its screens in
every state `design/screens.yaml` names, keyboard operation of every action, and the per-domain
accessibility obligations in `design/DESIGN.md` (status as text, not colour; labelled icon buttons;
every field labelled; reflow at 320 CSS pixels). R-6.27 (the notice control offered at every width)
is itself an accessibility correction and sits in Slice 8.

**P2 — Design system.** The front end uses `@bcgov/design-system-react-components`,
`@bcgov/design-tokens` and `@bcgov/bc-sans` at the versions the catalogue pinned (0001). The
project's own components the design names (profile section navigation, status badges, tables, the
formatted-text editor) are the only additions, and remain labelled as not part of the design system.

**P3 — Privacy.** No personal information enters any environment in scope: sandbox data is the
synthetic persona and seed set only, the Keycloak realm holds synthetic accounts, mail goes to a
catcher, and no secret or token is committed — connection strings, OIDC client secrets and SMTP
settings arrive as OpenShift secrets. The service logs no message bodies or recipient addresses
(R-6.26's successor, R-6.28, only asks that failures reach the operational log). The contact-list
export (R-4.32) and the user list (R-4.21) are administrator-only. If the service is ever pointed
at a real database, a Privacy Impact Assessment is required first; that is outside J2's scope.
Item 4 under "For ruling" is flagged because it concerns what the kept data discloses.

**P4 — Deploy target.** OpenShift on the BC Gov Private Cloud PaaS, sandbox namespaces only (0006).
No exception is needed, so J6 stays empty.

**P5 — Spec as source of truth.** This plan, the slice list and the decision records are versioned
files. Every slice names its criteria by permanent ID; every assumption the plan makes is written
down under "For ruling" or in a decision record rather than left in conversation.

**P6 — Human checkpoints.** This plan is a proposal for G2; it approves nothing itself. Each slice
ends in review at G3. No agent merges its own work.

**P7 — Test integrity.** The plan does not depend on, and was not cut around, any acceptance test.
The slice builders write unit and integration tests for their own code; the acceptance proof comes
from the separate suite derived from the spec, run against the `-test` namespace. The contract is
kept (0003) precisely so that suite needs no knowledge of the implementation.

**P8 — Approved tools.** The plan introduces no MCP server, model route or skill pack. Build-time
libraries are named in 0001 and are ordinary application dependencies.

**J1 — Service purpose.** The slices deliver exactly the three programs' opportunity and proposal
life cycles plus the accounts, organizations, content and files they need; nothing outside that.

**J2 — Scope.** The plan rebuilds the application and runs it in sandboxes. It builds no
production configuration, operates no environment infrastructure (it consumes what the platform
provides), and treats the old application as read-only reference and oracle.

**J3 — Forbidden patterns.** No test-only entrances: the three `/auth/createsession*` routes in the
recovered contract are not built, and the only lever tests get over time — `/status` — is a real
route the service needs (0003, 0004, 0005). No production namespace appears anywhere (0006). Seed
data is synthetic. Screens expose accessible roles, labels and visible text so the acceptance suite
never needs a CSS or DOM selector.

**J4 — Domain language.** Slice titles and deliverables use the constitution's terms —
opportunity, proposal, proponent, organisation, affiliation, evaluation stage, award, the three
programs — and code names follow them.

**J5 — Non-functional baselines.** Keycloak over OpenID Connect (0004); the existing PostgreSQL
schema kept, with the only migrations being the three named in 0002; WCAG 2.1 AA as under P1.

**J6 — Recorded exceptions.** None needed; none requested.

**J7 — Development notes.** Builders run the old application locally as the behavioural oracle
when a criterion's meaning is unclear, and the plan relies on that for the tensions listed above.
