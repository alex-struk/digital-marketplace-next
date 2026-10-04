# Plan — digital-marketplace-next

How the rebuilt Digital Marketplace is to be built: what the application is, where it runs, what
happens to the data it inherits, and why the slices in `plan/tasks.md` come in the order they do.
It answers to `constitution.md`; the last section says how.

Inputs: the 248 accepted, non-superseded criteria in `spec/criteria-index.json` (the domain files
under `spec/domains/` carry their full text), the pages and actions in `spec/contract/surface.yaml`,
the HTTP contract and observables beside it, and the design in `design/DESIGN.md`,
`design/screens.yaml` and `design/catalogue/`.

## The shape of the application

The project's `.sdlc/config.yaml` sets `stack: openshift-ts`. The plan is built on that profile
(`.claude/skills/stack-openshift-ts/SKILL.md`, on `bcgov/quickstart-openshift`) and departs from
it in two places only. Decision record 0001 names both and gives the reasons.

```
browser ──► OpenShift Route ──► frontend (web server + React/Vite/TanStack Router SPA)
   │                              ├─ /auth/sign-in, /auth/callback  SPA screens; PKCE with Keycloak (0004)
   │                              ├─ every page route in surface.yaml
   │                              └─ /api/*, /status, /admin/*  ──► backend (NestJS, Node.js)
   │                                                                 ├─ deadline hook in front of /api and /status (0005)
   │                                                                 ├─ bearer-token check against the realm's keys
   │                                                                 ├──► PostgreSQL via Prisma (kept schema — 0002)
   │                                                                 └──► SMTP (mail catcher in sandboxes)
   └──────────────► Keycloak (sandbox realm; PKCE, public client, no secret in the browser)

init container on the backend: knex migrate:latest over app/migrations  (departure 1 — 0001)
```

- **`app/frontend`** — the React single-page app, with Vite and TanStack Router. Every screen is
  built from its story in `design/catalogue/`, using `@bcgov/design-system-react-components`, the
  design tokens and BC Sans. Routing follows `surface.yaml` exactly, including `/users/me` and the
  `?tab=` sections as typed search parameters. Screens expose the accessible names, roles and
  visible text the acceptance suite reaches them by. The test IDs listed in the surface are attached
  as well, so the design gate's bindings hold. The API client is generated from
  `spec/contract/openapi.yaml`, not written by hand. Sign-in is PKCE with a public Keycloak client.
- **`app/backend`** — the NestJS service. It keeps the recovered contract (0003), so the acceptance
  suite and the observables act on the rebuild exactly as they act on the oracle. It drops the three
  test-only session routes. It validates every request and response against the contract at one
  boundary layer. It checks the bearer token on every `/api` route, then authorizes by the account
  kind and status recorded in `users` (departure 2 in 0001). It reads and writes through Prisma,
  using a schema introspected from the kept database. Mail goes out over SMTP after the action it
  follows has committed, and never blocks or fails that action. Logs are one JSON object per line
  and carry no personal data.
- **`app/backend/src/rules/`** — the validation and permission rules, as plain TypeScript with no
  framework imports. The frontend imports this directory by a path alias. Many accepted criteria
  correct places where the old browser and the old service disagreed about who may do what. One
  function that both sides call is how the rebuild stops that class of defect coming back. The
  rules sit inside `app/backend` so the profile's layout holds (0001).
- **`app/migrations`** — the old application's Knex migration history, carried over unchanged,
  plus the rebuild's own migrations: the reconstructed baseline (0007), 0012's restores of the old
  tables the seed writes to, and the six 0002 lists — three that change data or a constraint, and
  three that restore old opportunity attachment tables the baseline lacks.
- **`app/compose`** — PostgreSQL, a sandbox Keycloak realm with the persona accounts, and Mailpit,
  for a builder's machine only.

## What runs where

| Where | What | Owned by |
| --- | --- | --- |
| OpenShift sandbox `-dev` namespace | the frontend and backend Deployments, Services and one Route, with migrations as the backend's init container; built and deployed on every merge by the pinned `bcgov/quickstart-openshift-helpers` workflows | this project |
| OpenShift sandbox `-test` namespace | the same images, promoted; the acceptance suite runs here | this project |
| Both namespaces | PostgreSQL, the Keycloak realm with synthetic personas, an SMTP mail catcher | the platform/pipeline, by configuration and secrets (J2 puts environment operations out of scope) |
| A developer's machine | the app against `app/compose/` (PostgreSQL, sandbox Keycloak realm, Mailpit), and the old application as behavioural oracle (J7) | each builder |

Nothing is deployed to, or configured for, a production namespace, and no workflow defines a route
to one (J2, J3, the profile). The upload working directory is an `emptyDir` volume on the backend
because the root filesystem is read-only (0006).

## The data it inherits

The PostgreSQL schema is kept (J5, decision record 0002): no table or column the old application
did not have is added, and none is dropped or renamed. Restoring the old application's own tables
where the reconstructed baseline lacks them is within J5 by tech-lead ruling (see "Tables restored"
below). The old migration history is continued rather than restarted, by Knex from
`app/migrations/`, so a database the old application left behind upgrades in place. Prisma reads
the result and never migrates it, so no bookkeeping table of its own is added (0001, departure 1).
The rebuild does not write to the kept `sessions` table, because sign-in is PKCE (0004). The
table and its rows stay.

**Survives unchanged.** Every table and every row: users and their sessions, organizations and
affiliations with their event history, the opportunities, versions, addenda, notes and status
histories of all three programs, proposals with their teams, answers, scores and histories,
evaluation panels, individual evaluations and consensuses, pages and their versions, files with
their bytes and read-access grants, subscriptions, counters, and the service-area approvals.

**Changes, and each change is a named migration.**

1. Opportunities stored as "suspended" are mapped to **cancelled** with a system history entry,
   and the status constraints are narrowed so the state cannot be stored again (R-1.51). The
   choice of cancelled is an assumption — see "For ruling" below. **The constraint narrowing is a
   schema change and is escalated to the tech lead** (0002). If the tech lead rules against it, the
   data mapping stays and R-1.51's "cannot be stored" is enforced in code alone.
2. The service level agreement page is created as a page the service needs (R-7.18).
3. A *fresh* installation is seeded with the pages the service needs: the twenty-two R-7.12's note
   enumerates, minus the seven nothing in the rebuild links to (the ruling recorded against
   D-content-27, which that ruling made obsolete), plus the service level agreement page from item
   2 — **sixteen** pages, listed one by one in decision record 0007. Rows an existing installation
   already holds are left alone. Sixteen is the number R-7.12 is asserted against: not the
   twenty-two of its then-clause, which describes the old installation before both rulings, and not
   the nineteen the acceptance suite's seed manifest currently carries, which matches neither. 0007
   says why sixteen, which sixteen, and what would reverse it.

**Changes in behaviour over the same data, done in code.** Team With Us processing may now go to
awarded (R-1.49); panels must have exactly one chair and every member a role (R-1.55, R-5.9,
R-5.37); new accounts start with new-opportunity notices off (R-6.20); an opportunity attachment
records no read access on the file itself and is read through what it hangs on (R-8.19, R-8.20,
R-8.25); a deactivated account is sent nothing but keeps its watches (R-6.17).

**Tables restored where the reconstructed baseline lacks them.** The old application kept
attachments on all three programs' opportunities, but the kept schema as reconstructed (0007)
carries no attachment table for Sprint With Us or Team With Us opportunities. Slice 7 restored the
Code With Us one, `cwuOpportunityAttachments`, where absent (0029). Slice 15 restores the other
two the same way as `swuOpportunityAttachments` and `twuOpportunityAttachments`, each with
columns `opportunityVersion` and `file` (0055). Those two names are the rebuild's own under 0007's
rule for names the seed does not fix, and are reconciled if the old repository becomes available.
A database the old application left behind already holds the tables and is not changed. The tech
lead has ruled that restoring the old application's own tables, only where the baseline lacks
them, is within J5. All three restores are rows in 0002's migration table.

**Seed data for sandboxes** is synthetic only (P3, J3): the persona accounts named in
`spec/contract/personas.yaml`, the first administrator written directly into the data as R-4.13
requires (0004), and the fixed records the acceptance suite's seed manifest names.

## Why the slices are in this order

The first six slices settle every choice the rest depend on, and each is still worth having alone.

- **Slice 1** is the walking skeleton. The frontend and backend are deployed to the sandbox by the
  pinned quickstart workflows. The Knex init container carries the kept schema's history forward,
  and Prisma reads the result. The contract-validation boundary and the generated client are in
  place. Formatted text renders safely, and the footer and public page view work. After it, the
  profile's scaffold, the two departures, the deploy path and the content renderer are fixed, and a
  visitor can read the service's own pages.
- **Slices 2–4** settle identity: PKCE sign-in with Keycloak, bearer-token checks, the account kinds
  held in the service's own data, and the mail path
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

- **R-1.8, R-1.19, R-1.20, R-1.48, R-6.15 and R-6.2** were placed in Slice 7, which builds the
  program choice, the full state model and permitted-transition table for all three programs, the
  create-time publication check, the blind-copy batching and the publish action whose notice may
  fail silently. A G3 ruling on the build of Slice 7 found each unbound there, because its test
  walks a screen Slice 7 does not serve. All of that is still built in Slice 7; only where each is
  answered for moves. R-1.8 and R-1.48 go through `/opportunities/sprint-with-us/create` and the
  Sprint With Us view, so they sit in Slice 10, which builds both. R-1.19 was first placed in
  Slice 10 as well, but a G3 ruling on the build of Slice 10 found its example "an opportunity
  moves on to a program-specific evaluation stage" unreachable there: a lapsed Sprint With Us
  opportunity only leaves Published when the deadline hook runs, and that hook is delivered in
  Slice 16. R-1.19 therefore sits in Slice 16, whose closure (Slices 15 back through 7) holds the
  Sprint With Us and Team With Us screens, the cancel action of Slice 9 that its third example
  ("an opportunity finally reaches cancelled") uses, and the hook itself. Bringing the hook
  forward into Slice 10 was rejected: its other duties (proposals to review, anonymous proponent
  names, notices to the author or panel) need proposals, which do not exist until Slices 14 and
  15, so the hook would arrive half-built. The state values are still built and enforced in the
  store from Slice 7, so for nine slices that rule is in force but answered for by no slice.
  Slice 10 keeps its dependency on Slice 9: it no longer needs the cancel action, but its closure
  through Slice 9 also carries the opportunity list (Slice 8) that R-1.39 needs. R-6.15's test checks two notices: the
  first, to the panel, is reachable once panels exist in Slice 10, but the second, to the
  opportunity's owner, is reached by walking Team With Us individual evaluation (Slice 17) and the
  chair's consensus submission (Slice 18). It therefore sits in Slice 18, whose closure (Slices
  17 back through 7) holds every screen it walks. The blind-copy batching it answers for is still
  built in Slice 7 and used by every multi-recipient notice from then on, so for eleven slices a
  rule is in force that no slice yet answers for — a gap the Slice 7 build condition already
  names. R-5.16 was first placed in Slice 10, which builds the panel tab and the window in which
  the panel may change. A G3 ruling on the build of Slice 10 found its test unbound there: both
  its starting state (questions being evaluated individually) and its refused second change
  (once the opportunity has moved to consensus) are only reached through the individual
  evaluation screens, `evaluation-individual-create-swu` among them, which Slice 17 delivers
  together with the automatic move to consensus. R-5.16 therefore sits in Slice 17, whose
  closure (Slices 16 back through 7) holds the panel tab, the deadline hook that puts an
  opportunity into individual evaluation and the screens that move it on. Naming a seeded
  opportunity already at consensus as Slice 10's starting state was considered and rejected:
  it would answer only the second clause, the first still needs an opportunity in individual
  evaluation that nothing before Slice 16 can produce, and a seed standing in for stages no
  slice has built would test the rule against data the service could not itself have made. The
  window is still built and enforced from Slice 10, so for seven slices it is in force but
  answered for by no slice. R-1.20 needs a cancel action, so it sits in Slice 9, which
  builds cancellation (closure: Slices 8, 7). Its "out of an awarded opportunity" example is only
  reachable once Slice 16 awards; the cancelled-is-final and skip-a-stage refusals are walkable in
  Slice 9, and the awarded half is exercised again when Slice 16 lands. R-6.2's test reaches
  `/organizations/:orgId/edit` as well as publishing an opportunity, so it sits in Slice 14 with
  R-6.3 to R-6.5, the first slice whose closure holds both Slice 7 and Slice 11 — Slice 11 alone
  would not, for the reason given below. The fit is uneasy in the same way as for R-6.3 to R-6.5:
  a rule about all three programs is answered for by the Sprint With Us slice, a service-wide
  mail rule by the Code With Us proposal slice, and the blind-copy rule by the consensus slice,
  only because those are where their tests first can run.
- **R-1.9, R-1.53, R-1.56 and R-8.22** were also placed in Slice 7, which builds draft saving with
  defaulted dates, the delete permission rule, the edit-after-publication rule and the attachment
  control. A second G3 ruling on the build of Slice 7 found each unbound there, for the same reason
  as the item above: their tests open screens Slice 7 does not serve. R-1.9, R-1.53 and R-1.56 open
  `/opportunities/sprint-with-us/create`, so they sit in Slice 10 beside R-1.8 and R-1.48, whose
  closure (Slices 9, 8, 7) holds the Code With Us screens as well. R-8.22 opens
  `/opportunities/code-with-us/:opportunityId/proposals/create`, so it sits in Slice 14, which builds
  that screen and depends on Slice 8 and so on Slice 7's opportunity attachment control. All four
  are still built in Slice 7; only where each is answered for moves, and no slice's dependencies
  change. The fit is uneasy in the same way: a rule about all three programs is answered for by the
  Sprint With Us slice, and a rule about attaching to opportunities and proposals by the proposal
  slice, because that is where their tests first can run.
- **R-1.35 and R-1.36 (Slice 14)** say that changing or adding an addendum, and cancelling, notify
  the opportunity's watchers, everyone who has submitted a proposal to it, and its author. Slice 9
  builds addenda, cancellation and both notices, and the criteria were first placed there. A G3
  ruling on the build of Slice 9 found both unbound, because each test sets up its given by
  submitting a Code With Us proposal on
  `/opportunities/code-with-us/:opportunityId/proposals/create` (proposal-cwu-create), which only
  Slice 14 serves; in Slice 9 a signed-in person sent there lands on `/dashboard`. Both now sit in
  Slice 14, and Slice 14 now depends on Slice 9 as well as Slices 8 and 11, so its closure holds
  the addendum tab, the cancel action and the proposal screen. Build order does not change, because
  Slice 9 is already earlier. Slice 14 is chosen over a later slice because it is the first where a
  proposer exists to be notified. The fit is uneasy in the same way as the items above: a rule
  about running an opportunity is answered for by the proposal slice, only because that is where
  its test first can run, and until Slice 14 lands the proposer half of both notices is built but
  shown to nobody.
- **R-1.39 (Slice 10)** says the opportunity list can be narrowed by program, by state, to
  remote-friendly opportunities, and by free text. That is the list Slice 8 builds, and Slice 8
  still builds every one of those filters. A G3 ruling on the build of Slice 8 found it unbound
  there, because its test saves a Sprint With Us opportunity draft on
  `/opportunities/sprint-with-us/create` — a screen only Slice 10 serves. It therefore sits in
  Slice 10, whose closure (Slices 9, 8, 7) holds both that screen and the list; no slice's
  dependencies change. This is the most uneasy placement in the plan: the criterion's text and its
  test disagree about what it is about, and a filter rule is answered for by the Sprint With Us
  creation slice only because its test creates a draft to find. Either the test needs re-pointing
  at the list or the criterion needs a second ID for the draft it relies on; it is listed under
  "For ruling" below.
- **R-8.19 and R-8.25** were placed in Slice 7, which builds the opportunity attachment control
  and the file store's read-through-what-it-hangs-on rule. A G3 ruling on the build of Slice 7
  found every Code With Us case of both tests passing there and the rest unbound, because R-8.19's
  test ("for all three programs alike") also attaches files on `/opportunities/sprint-with-us/create`
  and `/opportunities/team-with-us/create` (Slice 10) and R-8.25's attaches one to a Code With Us
  proposal (Slice 14). Both now sit in Slice 15, the first slice whose dependency closure (Slices
  14, 13, 10 and back through 7) holds all three screens. Slice 14 builds the last of them in build
  order but does not depend on Slice 10, and placing them there would have meant adding that
  dependency and holding the Code With Us proposal slice back for Sprint With Us creation; Slice 15
  needs no dependency change. Both rules are still built in Slice 7, and the proposal half of
  R-8.25 in Slice 14. The fit is uneasy in the same way as the items above: a file
  rule is answered for by the Sprint With Us and Team With Us proposal slice, only because that is
  where its test first can run. A later G3 ruling on the build of Slice 14 showed that the Sprint
  With Us and Team With Us halves of R-8.19 had nothing to run against even in Slice 15: Slice 10
  draws the attachment control on those programs' forms but disabled ("Files cannot be attached to
  a Sprint With Us opportunity in this version of the service"), because the kept schema as
  reconstructed lacks their attachment tables (0036, 0045), and 0045 left that work to Slice 15
  without Slice 15's deliverables saying so. Slice 15 now names it: it enables the control on both
  programs' opportunity forms, restores the two attachment tables and adds their read paths
  (decision record 0055).
- **R-8.20 (Slice 15)** — one read rule for files attached to opportunities and proposals in all
  three programs — was placed in Slice 14 with the Code With Us proposal attachments. The same G3
  ruling on the build of Slice 14 found its Sprint With Us and Team With Us cases unbound there:
  they attach files to those programs' opportunities, which neither Slice 14 nor anything before it
  can do. It now sits in Slice 15, which builds those attachments (see the item above) and whose
  closure (Slices 14, 13, 10 and back through 7) holds the Code With Us opportunity and proposal
  attachments as well. Assigning it to Slice 10, which builds the forms, was not taken: Slice 10
  is already built and approved, and reopening it for attachment tables would hold nothing back
  that Slice 15 does not already wait for. The Code With Us half of the rule is still built in
  Slices 7 and 14.
- **R-1.31, R-2.7, R-2.9, R-2.11, R-2.24 and R-2.25 (Slice 15)** were placed in Slice 14, which
  builds the Code With Us proposal and every rule here for that program. Each speaks of all three
  programs, and a G3 ruling on the build of Slice 14 found the Sprint With Us and Team With Us
  cases of their tests unbound there, because they open `proposal-swu-create`,
  `proposal-twu-create` and the Proposals tab of `opportunity-swu-edit`, which Slice 15 builds.
  Each sits whole in Slice 15, whose closure holds Slice 14 and so the Code With Us cases too;
  splitting each into a Code With Us criterion and a criterion for the other two would need new
  criterion IDs, which are the spec's to author. Slice 15 therefore also builds the Proposals tab
  on the Sprint With Us and Team With Us manage pages, which 0045 left to a later slice. One risk
  is worth naming: R-1.31's and R-2.25's second clause reads the list once the opportunity has
  closed, and a Sprint With Us or Team With Us opportunity only closes when Slice 16's deadline
  hook runs. The ruling found only the screens unbound, not the closure, and the Code With Us
  cases were not returned, so the plan takes the screens as what was missing; if verification of
  Slice 15 finds the closed half unreachable, both criteria move on to Slice 16, as R-1.19 did, and
  nothing else changes. The fit is uneasy in the same way as the items above: rules built for Code
  With Us in Slice 14 are answered for where their tests can first run in every program.
- **R-1.1 (Slice 16)** is one sentence about three programs. Its Code With Us half is demonstrated
  in the same slice as the rest of Code With Us evaluation; its Sprint With Us and Team With Us
  half (the evaluators being told) is why Slice 16 waits for Slice 15.
- **R-1.24 and R-2.5 (Slice 17)** say that closing a Sprint With Us or Team With Us opportunity
  moves each submitted proposal to the first review stage and names it "Proponent 1", "Proponent
  2" and so on. The deadline hook that does both is built in Slice 16, and the criteria were first
  placed there. A G3 ruling on the build of Slice 16 found both unbound, because their tests read
  the names on the individual evaluation section of the manage page
  (`evaluation-individual-list-swu`, `evaluation-individual-list-twu`), which Slice 17 delivers.
  They therefore sit in Slice 17, as R-5.16 does for the same reason; the hook stays built in
  Slice 16, so for one slice the naming is in force but answered for by no slice.
- **R-2.35 (Slice 19)** says every state change and every score entered against a proposal is
  recorded in its history. Slice 16 builds proposal history with the Code With Us proposal view,
  and the criterion was first placed there. A G3 ruling on the build of Slice 16 found it unbound,
  because its test enters a code challenge score on the Sprint With Us proposal view
  (`proposal-swu-view.score_code_challenge`), and code challenge scoring is Slice 19's. It
  therefore sits in Slice 19, the first slice that offers that score; the history is still built
  in Slice 16 and written by every stage from then on, so for three slices it is in force but
  answered for by no slice.
- **R-1.25 (Slice 19)** is generic — "every proposal in contention scored at its program's final
  stage" — but for Code With Us the equivalent is R-2.27, which Slice 16 delivers. R-1.25 sits
  where the last program's final stage exists.
- **R-7.12 (Slice 5)** is about seeded data, and the migration that writes that data lands in Slice
  1, where R-7.18's links have to resolve. The criterion is nonetheless placed in Slice 5, because
  its given is an administrator looking at the list of pages and Slice 1 builds no such list: in
  Slice 1 its then-clause could not be reached at all. Only the assertion moves; the seeding does
  not. The count it is asserted against is sixteen, as "The data it inherits" item 3 and decision
  record 0007 settle — the criterion's own "twenty-two pages are listed" was recovered from the old
  installation, and two later rulings changed that set in opposite directions. The rebuild answers
  to the criterion's statement, a full set of the pages the service needs, each a placeholder
  titled by its own address; it cannot also show twenty-two of them.
- **R-7.17 (Slice 10)** has two clauses: a page's body renders as formatted text with embedded
  markup never executed, and the same body renders identically on the page's own address and
  wherever another screen embeds it. Slice 1 builds the renderer and the public page view, so it
  can show the first clause — but it builds no screen that embeds another page's body (its
  learn-more screens carry their own prose), so the second clause has nothing to be read against
  there. The first screen that embeds a page body is the Sprint With Us opportunity screen, which
  arrives with R-7.29 in Slice 10; the program terms screens (Slice 13) and the evaluation
  instructions (Slice 17) follow. The whole criterion therefore sits in Slice 10, the one place
  both clauses can be read together, while Slice 1 keeps the renderer under its own unit tests as
  part of its definition of done. The G3 ruling's other option — splitting the criterion so Slice 1
  answers for the rendering and Slice 10 for the sameness — needs a second criterion ID, which is
  the spec's to author and not the plan's to invent; it is listed under "For ruling" below, and if
  it is authored the rendering half returns to Slice 1 with nothing else changing.
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
- **R-6.1 (Slice 2) and R-6.3 (Slice 14)** turn on environment configuration. Every sandbox is a
  test environment, so the "not a test environment" half of R-6.3 is never observable in scope.
- **R-4.6, R-4.22, R-4.27, R-4.28 and R-6.2 to R-6.5** were first placed in Slice 2, which builds
  what they describe: account creation, the post-sign-in redirect, the profile-completion form and
  the mail path. Verification of the build of slices 2–8 found each one failing or unbound there,
  because its test reaches the behaviour through a screen a later slice delivers. Each now sits with
  that screen, while the machinery stays in Slice 2. R-4.6, R-4.27 and R-4.28 moved to Slice 3,
  which delivers profile editing and `/users/:userId`. R-4.22 moved to Slice 8, where the dashboard
  a returning person lands on, with its own-opportunities table, first exists. R-6.2 moved to Slice
  7, because its given is publishing an opportunity through the Code With Us create screen, and
  later to Slice 14 (see the first item above). R-6.3 to
  R-6.5 speak of "any message", and the ruling named no single screen for them. The screens it named
  for the group were profile editing, Code With Us creation, organization editing and the dashboard.
  These three are placed in Slice 14. What guarantees the four screens exist before they are verified
  is the dependency graph, not the order the slices happen to be listed in: Slice 14 depends on Slice
  8 (the dashboard), which depends on Slice 7 (Code With Us creation), which depends on Slice 3
  (profile editing), and it depends directly on Slice 11 (organization editing). An earlier placement
  in Slice 11 relied on a linear build order the depends-on lines did not enforce — Slice 11 depends
  only on Slice 3 and could be built and verified before Slices 7 and 8 — and was returned for it.
  Slice 14 was chosen over adding Slice 8 to Slice 11's dependencies so that organizations are not
  held back behind opportunities for the sake of three mail rules. The fit is uneasy: a
  service-wide mail rule is answered for by the Code With Us proposal slice only because that is
  the first slice whose dependency closure holds every screen its tests may send from. If the builder
  finds the tests going through only one earlier screen, moving them to that screen's slice changes
  nothing else.
- **R-4.23** was placed in Slice 2, which builds the profile-completion page and its redirect. The
  build of Slice 2 showed the redirect working (the terms checkbox absent for both people) while the
  test still failed, because it confirms arrival by reading the dashboard itself — the public sector
  employee's opportunities table or its empty message, and the vendor's proposals table or its empty
  message. Those are delivered in Slice 8 (staff dashboard) and Slice 14 (vendor dashboard). R-4.23
  now sits in Slice 14, the first slice whose dependency closure holds both (Slice 14 depends on
  Slice 8). Building empty dashboards into Slice 2 instead was rejected: it would pull the
  opportunities and proposals listings forward ahead of the data they list, and R-4.22 was already
  moved to Slice 8 for the same reason. The redirect is still built in Slice 2; only where it is
  answered for moves. The fit is uneasy in the same way as R-6.3 to R-6.5: a sign-up rule is
  verified by the Code With Us proposal slice only because that is where the vendor's dashboard
  first exists.
- **R-6.20 and R-6.28** were also placed in Slice 2, beside the account creation and mail path
  they describe, and verification of the build of slices 2–12 found both unbound there. R-6.20's
  test publishes a Code With Us opportunity through `/opportunities/code-with-us/create` (Slice 7)
  to show a new account is sent no announcement, so it sits in Slice 8, whose dependency closure
  (Slices 7, 3, 2, 1) holds that screen, and which carries the new-opportunity notice control
  (R-6.21) that R-6.20's "until they ask" is shown against.
  R-6.28's test signs in as an administrator, reads each vendor's profile at `/users/:userId`
  (Slice 3), then sends the announce-changed-terms broadcast to active vendors (Slice 6) and checks
  that every vendor with an address received it. It therefore sits in Slice 6, beside the
  changed-terms broadcast it exercises; Slice 6's closure (Slices 5, 3, 2, 1) holds both screens.
  An earlier revision put it in Slice 8 against the new-opportunity announcement to subscribers,
  which its test never uses, and Slice 8's closure does not include Slice 6, so it was returned.
  The skip-no-address behaviour itself is still built in Slice 2's mail path. The fit is uneasy for
  R-6.28 in the same way as for R-6.3 to R-6.5: it is a service-wide mail rule answered for where
  its test first can run.
- **R-2.15 (Slice 14)** records a missing guard — Sprint With Us and Team With Us creation does not
  refuse a submission after the deadline — as accepted behaviour. It is placed with the Code With Us
  guard it contrasts with; the builder must not "fix" the other two programs without a new
  criterion.
- **R-2.37 and R-2.38 (Slice 20)** cover all three programs; the Code With Us export could have
  shipped in Slice 16, but the anonymity rule needs the Sprint With Us and Team With Us challenge
  stage (Slice 19) to be shown, so the whole export family is built once, there.
- **R-6.13 and R-6.19 (Slice 21)** can only be true once every message exists, which makes this the
  one slice whose size is set by all the others.
- **R-8.17, R-6.6, R-6.16 and R-4.33** were placed in Slice 3, beside the file store, the
  notification settings and the vendor's legal section they describe. Verification of the build of
  Slice 3 found each unbound there, because its test acts through a screen Slice 3 does not serve.
  Each now sits with that screen, while what it describes is still built in Slice 3. R-8.17's test
  uses the attachment control on an opportunity's management screen, so it sits in Slice 7, which
  builds that control; the size limit itself is enforced by the file store from Slice 3. R-6.6's test
  reads the email notification reference at `/admin/email-notification-reference`, so it sits in
  Slice 21. R-6.16's test signs in as the organization's owner, opens `/organizations/:orgId/edit`,
  adds a team member by email and reads the invitation to join the organization, so it sits in
  Slice 12, which builds both the team tab and that invitation — a message the notification
  preference does not govern. R-4.33's test starts at
  `/content/terms-and-conditions/edit`, the managing screen of the terms page, so it sits in Slice 6
  with the changed-terms announcement and re-acceptance on the same legal section; Slice 6's closure
  (Slices 5, 3, 2, 1) holds both that screen and the vendor's profile. Moving R-6.6 to Slice 21 also
  made plain that Slice 21's dependencies did not reach every slice that sends a message: Slices 4
  (account notices), 6 (the changed-terms broadcast) and 9 (addendum and cancellation notices) were
  outside its closure, though its own description already claimed every message built in slices 2
  to 19. They are now named in its depends-on line; no other slice's position changes. The fit is
  uneasy for R-6.6 and R-4.33 in the same way as for R-6.3 to R-6.5: a rule about every message, or
  about one profile section, is answered for where its test first can run.
- **R-8.13, R-8.21, R-8.28 and R-8.30** were placed in Slice 3, beside the image route they
  describe. Each covers both a profile picture and an organization logo, and the acceptance suite
  exercises the logo half on `/organizations/:orgId/edit` (and, for R-8.28, on the public
  organization list). The verification of the build of Slices 3–4 found those logo halves unbound
  or failing, because Slice 3 builds neither screen, while the profile-picture halves of R-8.13 and
  R-8.28 passed. All four now sit whole in Slice 11, which builds the organization list and the
  management page's profile tab with its logo. Slice 11 depends on Slice 3, so the picture halves
  can still be shown there. The image checks and resizing are still built in Slice 3, and the logo
  is only a second caller of the same route. Making Slice 11 a prerequisite of Slice 3 was rejected,
  because it would hold profile editing back behind organizations. Splitting each criterion into a
  picture half and a logo half would need new criterion IDs, which are the spec's to author. The fit
  is uneasy in the same way as for R-8.17: the behaviour is built in one slice and answered for in a
  later one where every half of its test can run.
- **R-3.6, R-3.15 and R-3.23** were placed in Slice 11, which builds registration, archiving and
  the list of organizations a vendor may act for. Verification of the build of Slice 11 found their
  tests unbound there: each sets up or reads members through the organization's team members tab
  (adding team members, the owner's badge), and Slice 11 shows that tab only as "This section is not
  available yet." All three now sit in Slice 12, which builds the team tab and depends on Slice 11,
  so its closure holds both the behaviour and the screen the tests go through. The behaviour itself
  is still built in Slice 11, and Slice 14, which uses the organizations a vendor may act for as
  proponents, still depends only on what Slice 11 builds. Adding the team tab to Slice 11 was the
  other way offered and was not taken, because it would fold most of Slice 12 into Slice 11 and
  leave Slice 12 little of its own to show. The fit is uneasy in the same way as for R-8.17: a rule
  about registration and archiving is answered for where its test first can run.

## Accepted criteria that pull against each other

These are all accepted and none supersedes another, so each is planned as written; the builder of
the named slice should raise them rather than silently pick a reading.

- **R-6.6 vs R-6.16 (slices 21 and 12).** R-6.6 says every message ends with an offer labelled
  Unsubscribe; R-6.16 says a message the preference does not govern must not offer to unsubscribe.
  They were together in Slice 3 so one builder could reconcile them; their tests now place them
  apart, so the reconciliation is made once, in the shared message footer Slice 3 builds, and Slice
  12's builder must not change it for R-6.16 without knowing Slice 21 reads it for R-6.6. The plan's
  reading is that R-6.16, authored later to replace R-6.10, narrows R-6.6 to the new-opportunity
  announcement — which means R-6.6's test, if it expects the offer on every sample in the reference,
  will meet the organization invitation and others without it, and should be raised rather than satisfied.
- **R-5.11 vs R-5.28 (Slice 17).** R-5.11 opens individual evaluations to the administrator and the
  owner "at every stage"; R-5.28 says no one but the evaluator reads them before consensus, and an
  administrator off the panel only after the question stages. Both are in Slice 17. They cannot
  both hold for an administrator during individual evaluation.
- **R-8.25 vs R-8.20 (both Slice 15).** R-8.25 names only Code With Us and Sprint With Us
  attachments; R-8.20 requires one rule for all three programs. The plan applies R-8.25's rule to
  Team With Us too.
- **R-4.31 (Slice 4) against the direction of R-5.9 (Slice 10).** R-4.31 keeps a rule on the interface alone (an
  administrator's own deactivation control); R-5.9 exists to move a similar interface-only rule into
  the service. The shared rules package would make R-4.31's asymmetry deliberate work, not a
  default, so the Slice 4 builder must preserve it on purpose.

## For ruling

Things the plan had to assume, and things it needs a ruling on before building starts. Each is
cheap to reverse now and expensive to reverse later.

1. **Two departures from the openshift-ts profile** (0001). (a) Knex runs the schema migrations,
   to continue the old history without adding a Prisma bookkeeping table to the kept schema.
   (b) Administrator rights and account kind are read from the `users` table, not from token
   claims, because accepted criteria make them something an administrator changes inside the
   service. Every other profile requirement is adopted as written.
2. **Escalation to the tech lead: R-1.51's constraint narrowing** (0002). The migration narrows
   the opportunity status check constraints so that "suspended" cannot be stored. That is a schema
   change, and it is routed to the tech lead, not settled here.
3. **Dependencies for the tech lead's ruling.** The pipeline's dependency register is not in this
   workspace, so this plan cannot tell which of the following it already holds. The profile names
   NestJS, Prisma, React, Vite, TanStack Router, Vitest and Playwright. Constitution P2 names the
   three `@bcgov` design-system packages. Everything else the plan relies on is listed here so a
   person can rule on it, not so it slips in:

   | Dependency | Used for | Why this one |
   | --- | --- | --- |
   | `knex` (with `pg`) | running `app/migrations` only | departure 1 in 0001; the old history is a Knex history |
   | `react-aria-components` 1.17.0 | the catalogue's non-design-system widgets | already pinned by `design/package.json` and scanned with axe |
   | `keycloak-js` *(proposed)* | PKCE sign-in in the single-page app | Keycloak's own browser adapter; `oidc-client-ts` would do as well |
   | `jose` *(proposed)* | checking bearer tokens against the realm's keys in the backend | small and has no dependencies; `passport-jwt` is the NestJS-idiomatic alternative |
   | `express-openapi-validator` *(proposed)* | validating requests and responses against `openapi.yaml` at the boundary | works on NestJS's default Express adapter and reads the contract directly |
   | `openapi-typescript` + `openapi-fetch` *(proposed)* | the frontend's API client, generated from the contract | produces types only plus a thin fetch wrapper |
   | `nodemailer` *(proposed)* | sending mail over SMTP | the standard Node SMTP client |
   | `sharp` *(proposed)* | checking image types and resizing profile pictures and logos (R-8 criteria) | fast, and runs without a writable root filesystem |
   | a Markdown renderer and an HTML sanitizer, e.g. `markdown-it` + `dompurify` *(proposed)* | formatted text that never runs markup (R-7.17) | the builder of Slice 1 should match the old application's renderer, so pages keep their meaning |
   | the frontend container's web server (the quickstart's Caddy image) | serving the single-page app and forwarding the API | comes with the quickstart scaffold |

   A package marked *proposed* is the plan's first choice. The builder may substitute an
   equivalent only with the same ruling.
4. **Bearer tokens instead of a cookie session** (0003, 0004). The contract's `/auth/callback`
   "establishes a session". Under PKCE it ends with tokens in the browser, and `/api` is called
   with a bearer token. Screens behave the same. An acceptance step that calls `/api` directly must
   present a token from the sandbox realm. Whoever writes the acceptance harness should know this
   before writing API-level steps.
5. **The suspended mapping** (0002). R-1.51 says historical "suspended" records are mapped to a
   defined state; the plan picks cancelled.
6. **Sandbox infrastructure** (0006). The plan assumes the platform provides PostgreSQL, a Keycloak
   realm seeded with the persona usernames, and an SMTP catcher in each sandbox namespace, since J2
   puts building them out of scope.
7. **Historical public grants on draft attachments.** The old service marked Sprint With Us and
   Team With Us opportunity attachments readable by anyone at upload (the defect R-8.19 replaces).
   Those grants are rows in the kept data. The plan leaves them in place because no criterion says
   to remove them, but they keep old draft attachments readable by anyone; whether to revoke them
   is a data-protection question for a person, not a planning default.
8. **The owed terms-page criterion.** The ruling recorded against D-content-26 says a criterion is
   owed for a program's qualification terms being acceptable with nothing shown in their place. No
   such criterion is accepted yet, so nothing in Slice 13 plans for it.
9. **How many pages a fresh installation carries** (0007). The plan has chosen sixteen and
   enumerated them, so no builder has to choose. Two things follow that are not the plan's to do.
   R-7.12's then-clause still says twenty-two, and no installation of the rebuild will ever show
   that number; whether the clause is re-authored against the seeded set is the spec's call, and
   until it is, the criterion is read by its statement and its enumerated set rather than by its
   count. And the acceptance suite's seed manifest carries nineteen, which is neither the old
   twenty-two nor the rebuilt sixteen; it needs reconciling to sixteen by whoever owns it, and the
   plan is not moved to meet it (P7).
10. **Splitting R-7.17.** The criterion asks for two things — safe rendering, and the same body
    rendering the same way wherever it appears — that are demonstrable in different slices. The
    plan places the whole of it in Slice 10, where both can be read. If the spec would rather split
    it, a second criterion covering the rendering clause alone belongs to Slice 1, which builds the
    renderer; nothing else in the slice list moves.
11. **R-1.39's test and its text.** The criterion is about narrowing the opportunity list; its test
    saves a Sprint With Us draft on `/opportunities/sprint-with-us/create`. The plan follows the
    G3 ruling and places it in Slice 10, where the test can run, while Slice 8 builds the filters.
    If the test is re-pointed at the list using a Code With Us opportunity, R-1.39 returns to
    Slice 8 and nothing else moves.

## Coverage check

`plan/check-coverage.mjs` checks that every accepted criterion in `spec/criteria-index.json` with
no `supersededBy` appears in exactly one slice's `criteria:` line in `plan/tasks.md`. It also
reports any placed ID that is unknown or not accepted. Run it with
`node plan/check-coverage.mjs .` from the workspace root. It exits non-zero on any failure.

**Result for this revision: not run.** On 2026-10-03 the planning session tried
`node plan/check-coverage.mjs .` and an equivalent inline script. The session's permission guard
refused both because they needed an approval nobody was there to give. No output exists to attach,
and whoever next holds a shell should run it and record what it prints here. The evidence this
revision relies on instead is a hand count of every `criteria:` line in `plan/tasks.md`: **248
IDs placed** across 21 slices. Slice by slice, 1–21 hold 6, 6, 24, 10, 18, 7, 16, 9, 6, 20, 13,
19, 4, 18, 17, 15, 15, 13, 6, 3 and 3, so **Slice 14 holds 18 and Slice 15 holds 17**. This
revision moves no criterion. It changes only decision records 0002 and 0055 and this plan's
account of the migrations.

Earlier revisions could not run it either. In its place, the placements were checked by hand against the index, domain by domain. This revision moved
two IDs and no others: R-7.12 from Slice 1 to Slice 5, and R-7.17 from Slice 1 to Slice 10. Both
stay in the content domain, and both land in slices the table below already lists, so every count in
it is unchanged. A later revision moved R-8.19 and R-8.25 from Slice 7 to Slice 15; the files row
now lists Slice 15, and no count changes. The latest revision moved R-1.39 from Slice 8 to Slice
10; Slice 8 still answers for other opportunities criteria, so the opportunities row is unchanged.
The most recent revision moved R-1.35 and R-1.36 from Slice 9 to Slice 14 and added Slice 9 to
Slice 14's dependencies; Slice 9 still answers for other opportunities criteria and Slice 14 was
already in the opportunities row, so no row changes. The revision after that moved R-3.6, R-3.15
and R-3.23 from Slice 11 to Slice 12; both slices were already in the organizations row, so no row
changes. This revision moved R-1.31, R-2.7, R-2.9, R-2.11, R-2.24, R-2.25 and R-8.20 from Slice 14
to Slice 15. Slice 14 still answers for other opportunities (R-1.35, R-1.36), proposals and files
(R-8.22, R-8.31) criteria, and Slice 15 was already in the proposals and files rows; the
opportunities row gains Slice 15 and no count changes.

| Domain | Accepted, not superseded | Placed | Slices |
| --- | --- | --- | --- |
| content (R-7) | 26 | 26 | 1, 5, 6, 10 |
| evaluation (R-5) | 30 | 30 | 10, 16, 17, 18 |
| files (R-8) | 24 | 24 | 3, 5, 7, 14, 15 |
| notifications (R-6) | 21 | 21 | 2, 3, 6, 7, 8, 9, 16, 21 |
| opportunities (R-1) | 50 | 50 | 7, 8, 9, 10, 14, 15, 16, 18, 19, 20 |
| organizations (R-3) | 31 | 31 | 11, 12, 13 |
| proposals (R-2) | 36 | 36 | 14, 15, 16, 18, 19, 20 |
| users (R-4) | 30 | 30 | 2, 3, 4, 6 |
| **total** | **248** | **248** | 21 slices; no ID placed twice, none missing, none superseded |

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
catcher, and no secret or token is committed. Connection strings and SMTP settings arrive as
OpenShift secrets. The Keycloak client is public under PKCE, so the frontend holds no client
secret at all (0004). Logs are structured, one JSON object per line, as the profile requires, and
carry no personal data: no message bodies, recipient addresses or token contents (R-6.28, the
successor to R-6.26, only asks that failures reach the operational log). The contact-list export
(R-4.32) and the user list (R-4.21) are administrator-only. If the service is ever pointed at a
real database, a Privacy Impact Assessment is required first, and that is outside J2's scope.
Item 7 under "For ruling" is flagged because it concerns what the kept data discloses.

**P4 — Deploy target.** OpenShift on the BC Gov Private Cloud PaaS, sandbox namespaces only. The
deploy uses the profile's pinned `bcgov/quickstart-openshift-helpers` workflows (0006). No
exception is needed, so J6 stays empty.

**P5 — Spec as source of truth.** This plan, the slice list and the decision records are versioned
files. Every slice names its criteria by permanent ID; every assumption the plan makes is written
down under "For ruling" or in a decision record rather than left in conversation. Where a criterion
and a later ruling on the same domain disagree about a number — R-7.12's twenty-two seeded pages
against the ruling that dropped seven and R-7.18 that added one — the plan does not average them or
leave the builder to guess: it states the number it builds, enumerates it (0007), and routes the
wording of the criterion back to the spec, which is the only place it can be changed.

**P6 — Human checkpoints.** This plan is a proposal for G2; it approves nothing itself. Each slice
ends in review at G3. No agent merges its own work.

**P7 — Test integrity.** The plan does not depend on, and was not cut around, any acceptance test.
The slice builders write unit and integration tests for their own code; the acceptance proof comes
from the separate suite derived from the spec, run against the `-test` namespace. The contract is
kept (0003) precisely so that suite needs no knowledge of the implementation. Where the suite and
the plan already disagree — its seed manifest carries nineteen seeded pages, the plan builds
sixteen — the plan is settled from the criteria and the rulings on them, and the manifest is what
moves. Criteria are placed in the slice whose screens can actually reach their given and then
clauses (R-7.12 and R-7.17 were moved for that reason in this revision), so that no clause is
recorded as untestable merely because it was planned into a slice that builds no screen for it.

**P8 — Approved tools.** The plan introduces no MCP server, model route or skill pack. It uses only
the stack profile and the skill packs already installed in this workspace's `.claude/skills/`
(`stack-openshift-ts`, `github-actions`, `openshift-deployment`, `crow-bcgov-ux`). Application libraries are not tools
under P8, but any that is not in the pipeline's dependency register is listed under "For ruling"
item 3 for the tech lead, rather than taken as approved.

**J1 — Service purpose.** The slices deliver exactly the three programs' opportunity and proposal
life cycles plus the accounts, organizations, content and files they need; nothing outside that.

**J2 — Scope.** The plan rebuilds the application on the pipeline's stack — the openshift-ts
profile — and records its two departures from it in 0001. It runs the application in sandboxes.
It builds no
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

**J5 — Non-functional baselines.** Authentication is Keycloak over OpenID Connect, by PKCE from
the single-page app (0004). The existing PostgreSQL schema is kept. Beyond the reconstructed baseline (0007)
and 0012's restores of the old tables the seed writes to, the only migrations are the six named in
0002, all run by Knex so that no migration tool adds its own table. Three change data or a
constraint: the suspended-to-cancelled mapping with its constraint narrowing (R-1.51), the service
level agreement page (R-7.18), and the fresh installation's page set (R-7.12). The narrowing is
escalated to the tech lead as a schema change. The other three restore the old application's own
opportunity attachment tables, created only where the reconstructed baseline lacks them:
`cwuOpportunityAttachments` (Slice 7, 0029), and `swuOpportunityAttachments` and
`twuOpportunityAttachments` (Slice 15, 0055, named there with their columns). No table or column
the old application did not have is added. The tech lead has ruled that restoring the old
application's own tables where the baseline lacks them keeps the schema J5 keeps, and does not
loosen the article.
Accessibility is WCAG 2.1 AA, as under P1.

**J6 — Recorded exceptions.** None needed and none requested. J6 records exceptions to platform
articles. The two departures in 0001 are from the stack profile, not from any platform article,
so they are recorded there and listed for ruling above.

**J7 — Development notes.** Builders run the old application locally as the behavioural oracle
when a criterion's meaning is unclear, and the plan relies on that for the tensions listed above.
