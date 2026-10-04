# The application

The rebuilt Digital Marketplace. Three workspaces and the things that run them on one
machine.

| Where | What |
| --- | --- |
| `frontend/` | the React single-page app (Vite, TanStack Router), every screen built from its story in `design/catalogue/`, and the web server in front of it that makes one origin |
| `backend/` | the NestJS service: the recovered contract at `spec/contract/openapi.yaml`, validated at one boundary, over the kept schema through Prisma |
| `backend/src/rules/` | the validation and permission rules, as plain TypeScript with no framework in them. Both sides call these; the frontend imports the directory as `@rules` |
| `migrations/` | the kept schema's Knex history, and the seed |
| `compose/` | PostgreSQL, a sandbox identity provider, a mail catcher behind a delay proxy, for a builder's machine only |

## Checking it

```sh
npm --prefix app run check      # typechecks and runs the unit tests of every workspace
```

Nothing in `check` needs a database, a container or a network. The tests that exercise the
schema run PostgreSQL in process (PGlite), so the migration history and the acceptance
suite's own seed files are really applied.

## Running it

```sh
SDLC_SANDBOX_PASSWORD=... docker compose -f app/compose/compose.yaml up --build
```

The application answers on <http://localhost:4300>. The identity provider is on :8080 and
the mail catcher on :8025. Each of those three host ports can be moved, so that several copies
run side by side as separate compose projects: set `SDLC_APP_PORT`, `SDLC_IDP_PORT` and
`SDLC_MAIL_PORT`, and every address that names one follows (decision record 0045). Unset, they
are the ports above. Every account `tests/seed/manifest.yaml` names signs in at the
identity provider with its `idp_id` as username and that password; the password is read from
the environment and is written into no file here. So do the first-time identities
`spec/contract/personas.yaml` names, which have no account until they sign in.

Signing in begins and ends at the service: `/auth/sign-in` sends the browser to the identity
provider, and `/auth/callback` makes the account on a first sign-in, then redirects to the landing
page with the tokens (decision record 0015). The web server in front of the app forwards `/auth`
there, as it does `/api`. The callback also sets an `HttpOnly` session cookie, so a request to
`/api` from the same browser that carries no bearer token is still answered for the person who
signed in, until they sign out (decision record 0017).

The browser keeps only the tokens, in local storage, and they count only while its `dm-signed-in`
cookie is there too, so a browser whose cookies are cleared is signed out (decision record
0020). The account is read from `GET /api/sessions/current` on every
visit, with or without tokens, so the screens show whoever the service's own session names. A
question that goes unanswered — the page was left while it was on its way — changes nothing the
browser holds: only the service's own answer signs a browser out or refuses it (decision record
0038). An unanswered question is asked again before the visit is drawn as anybody's, and a token
the service refuses is dropped and the question asked once more on the session cookie alone
(decision record 0039). Signing out is one request, `DELETE /api/sessions/current`, which ends both the service's
session and the identity provider's. The `/sign-out` page makes that request once it is drawn,
and it says how signing out went once the service has answered (decision record 0018).

Every message the service sends is marked as a test and comes from
`Digital Marketplace <donotreply@example.test>` (decision record 0013). Start with
`SDLC_ORACLE_DISABLE_NOTIFICATIONS=1` in the environment to switch all mail off (R-6.1).

The service sends its mail through a delay proxy (Toxiproxy, `mail-hold`) to the catcher, and
:8025 is a small reverse proxy (Caddy, `mail-front`) in front of both: the catcher's own
interface and API at the root, including its fault injection, and the proxy's control API under
`/hold` — `GET /hold/proxies/smtp/toxics` reads it, `POST` there adds a toxic, `DELETE
/hold/proxies/smtp/toxics/hold` removes it, `POST /hold/reset` clears them all. With no toxic in
force mail passes unchanged (decision record 0028, for R-6.24).

Uploads (`POST /api/files`, `POST /api/avatars`) are read by their handler rather than by the
boundary validator, written to the working directory `FILE_UPLOADS_DIR` (a tmpfs in compose, the
backend's `emptyDir` volume in a sandbox) and removed once answered; the bytes are kept in the
database, once per distinct content (decision record 0021). A service that cannot make that
directory does not start.

## The service's own pages

Anybody reads a page at `/content/<address>`. An administrator manages them from "Content" in
the navigation menu: the list at `/content`, a new page at `/content/create`, and each page's
managing screen at `/content/<address>/edit`. Everybody else is shown the not-found screen
there, and every page request they make is refused 401 in one shape (decision record 0025).
A page the service needs can be re-worded but neither moved nor removed. An image inserted
into a body is stored readable by anyone and referred to as `@file/<identifier>`, which the
renderer turns into the file's address only when the text is shown.

## Changed terms

The managing screen of `/content/terms-and-conditions` is the only one that offers "Notify vendors
of updated terms". When an administrator confirms it, the screen calls `POST /api/emailNotifications`
(`updateTerms`). That withdraws every vendor's standing acceptance, answers, and then emails each
active vendor, one message each. A vendor sees the warning on their own legal section
(`/users/me?tab=legal`) and agrees again from there (decision record 0027).

## Code With Us opportunities

Public sector staff and administrators start at `/opportunities/create`, choose a program, and
write a Code With Us opportunity at `/opportunities/code-with-us/create`. A draft saves whatever it
holds; a staff member submits it for review, and only an administrator publishes, from a draft or
from review. The dashboard at `/dashboard` lists a staff member's own opportunities, and every
opportunity to an administrator, each linking to where it is managed. Each one is
managed at `/opportunities/code-with-us/<id>/edit` (summary, the opportunity in its form, history)
and read by anyone at `/opportunities/code-with-us/<id>` once published. Every save is a new
version. The states and permitted changes of all three programs, and who may do what, are in
`backend/src/rules/opportunities.ts`; the service's answers and refusals are decision record 0029.
Submitting for review emails every administrator, publishing emails everyone with new-opportunity
notices on, each in batches of `MAILER_BATCH_SIZE` (50) blind copies, and both confirm to the
author.

## Finding and following opportunities

Anybody browses at `/opportunities` ("Browse opportunities" on the home page). The list reads all
three programs and shows what the service lets the person read — published opportunities, and to
staff their own unpublished ones and to administrators every one — grouped into unpublished, open
and closed, narrowed by program, state, remote work and words in the title or location. The rules
for that are `backend/src/rules/opportunity-list.ts`, shared by the screen and the service.

A signed-in person watches an opportunity they did not create from its card or its page
(`/api/subscribers/<program>`), and turns the new-opportunity emails on or off from the control at
the top of the list, which saves at once. Opening a Code With Us opportunity's page counts a view
(`PUT /api/counters/opportunity.code-with-us.<id>.views`); counts are read at
`GET /api/counters?counters=<name>`, by public sector staff and administrators only (decision
record 0043). The home page's awarded figures come from `/api/metrics`.
Decision record 0034 has the answers; a refused watch is filed under the reason the contract
names — `conflict` for a second watch, `opportunity` for one's own, `notFound`, `permissions` —
rather than under `errors` (decision record 0037).

## Running an opportunity after publication

On the manage page an administrator cancels a published opportunity, or one at an evaluation stage
or in processing, with an optional note; the author or an administrator adds an addendum on the
Addenda tab once it is no longer a draft; the History tab shows every entry, private notes and
their files included, to them alone, but no screen offers a way to add a note (R-1.33); the Summary
tab reports views, watchers and submitted proposals to them once it is published. The service
takes these as `cancel`, `addAddendum` and `addNote` on `PUT /api/opportunities/<program>/<id>` in
all three programs (the client sends only the first two), and answers with `addenda`,
`history` and `reporting` as R-1.30 allows. An addendum or an administrator's edit emails the
watchers, proponents and author once each, a cancellation emails the watchers and proponents and
the author separately, and no message goes to a deactivated account. The logic is
`backend/src/opportunities/opportunity-running.service.ts`, the rules
`backend/src/rules/opportunities.ts`, the screens' pieces `frontend/src/screens/opportunity-running.tsx`
(decision record 0043).

## Screens and dates

Every screen sits in one page container, put round all of them by the root layout, and is spaced
by the `Stack` in `frontend/src/app/page-layout.tsx`, both as `design/catalogue/layout.tsx`
defines them. A day is shown as the day it was in Pacific time, as every deadline is (decision
record 0037).

The opportunity list and the screens for staff alone are drawn whole once they know whom they are
for and have what they show; their loading state appears only if that takes more than a second
(`useLoadingShown` in `frontend/src/app/loading.tsx`). The list is asked for beside the session
question, and a program, or a page of prose, the service faulted on is asked for again (decision
record 0039).

## Sprint With Us and Team With Us opportunities

Staff create one at `/opportunities/sprint-with-us/create` or `/opportunities/team-with-us/create`:
as a draft, which is kept whatever it holds, or under review, or — by an administrator only —
published. Anything that is not a draft is checked in full: budget, dates, Sprint With Us's skills
and phases or Team With Us's resources, the team or resource questions, the scoring weights totalling
100%, and an evaluation panel of at least two public sector employees with exactly one chair. The
rules are `backend/src/rules/other-program-content.ts`, shared by the form and the service, and each
refusal names its field as Code With Us's do.

Each is managed at `/opportunities/<program>/<id>/edit` (Summary, Opportunity, Addenda, History and
Evaluation panel) and read by anyone at `/opportunities/<program>/<id>` once published. The public
page embeds a page of the service's own prose — `/content/sprint-with-us-opportunity-scope` or
`/content/team-with-us-terms-and-conditions` — through the same renderer that page's own address
uses; if it cannot be read, that section is simply empty. The panel is changed on its own tab
(`editEvaluationPanel` on `PUT /api/opportunities/<program>/<id>`) until the consensus stage begins;
each change is a new version, and once the opportunity has left draft the people newly added are
emailed. Only an administrator, the author and the panel's own members are told who is on it. The
names staff choose panel members from come on their own session (`GET /api/sessions/current`,
`panelCandidates`), since the list of everyone stays an administrator's (decision record 0045).

## Code With Us proposals

A vendor who has accepted the terms at some point starts one from "Start a proposal" on a published
opportunity's page, at `/opportunities/code-with-us/<id>/proposals/create`, as an individual or for
an organization they own or administer. A draft keeps whatever it holds, though its attachments are
checked; Submit proposal checks the form, asks for the Code With Us and the service's terms, records
the service's on the account, and submits. Each proposal is managed at
`/opportunities/code-with-us/<id>/proposals/<proposalId>/edit` (Proposal and History tabs): a draft
is edited, submitted or deleted, a submitted one edited or withdrawn, a withdrawn one put back while
the opportunity still takes proposals. One vendor and one organization have one proposal per
opportunity. A vendor's `/dashboard` lists the proposals they wrote and, for an owner or
administrator, their organizations'. Staff see none until the opportunity has closed — its deadline
passed — and never a draft. A file attached to a proposal is readable by whoever may read the
proposal, by one rule for every program (`mayReadProposal` in `backend/src/rules/proposals.ts`);
`FileStore.detached()` names the files no record refers to any longer. The service is
`backend/src/proposals/`, the screens `frontend/src/screens/proposal-cwu-*.tsx` and
`vendor-dashboard.tsx`; the answers and refusals are decision record 0055.

## Sprint With Us and Team With Us proposals

A vendor starts one from "Start a proposal" on a published opportunity's page, at
`/opportunities/<program>/<id>/proposals/create`, for an organization they own or administer. Its
qualification is said as soon as it is chosen and checked again at submission. Sprint With Us asks
for a team for each of the opportunity's phases, one scrum master in each, a cost per phase and an
answer to each team question, and says as the team is named what each phase still lacks and whether
a cost is over its budget; Team With Us asks for people against the opportunity's resources at an
hourly rate, and says what the rates come to over the contract against the maximum budget, a
ceiling the service also holds every save to. Each is managed at
`/opportunities/<program>/<id>/proposals/<proposalId>/edit`; once submitted its organization stays
until it is withdrawn. The vendor's `/dashboard` lists all three programs' proposals together, and
both programs' manage pages have a Proposals tab, withheld until the opportunity closes. The
service is `backend/src/proposals/team-proposals.service.ts`, the rules
`backend/src/rules/team-proposals.ts`, the screens `frontend/src/screens/proposal-team-*.tsx`; the
answers, refusals and readings are decision record 0058.

Files attach to these programs' opportunities as they do to Code With Us's, and to Sprint With Us
proposals as to the other two programs'. A file on an opportunity or a proposal is read through what
it hangs on, by one rule for every program (`OpportunityAttachmentReadPath`,
`ProposalAttachmentReadPath`).

## Closing, scoring and awarding

There is no scheduler. A hook in front of every request under `/api` and `/status`
(`backend/src/closing/`) closes each published opportunity whose deadline has passed, in all three
programs: Code With Us to `EVALUATION`, the other two to `EVAL_QUESTIONS_INDIVIDUAL`, every submitted
proposal to review, Sprint With Us and Team With Us proposals named "Proponent 1", "Proponent 2" and
so on. The author of a Code With Us opportunity, or the evaluators on the other programs' panels, are
then emailed. Each program's run starts at most once per `DEADLINE_HOOK_INTERVAL_MS` (a minute when
unset, `0` in compose), and the request waits for it, so requesting `/status` and then reading shows
the closure. A browser opening `/status` gets the "Service status" screen, which asks the service's
`/status` in turn.

Once a Code With Us opportunity has closed, its author and administrators open each proposal from
the Proposals tab at `/opportunities/code-with-us/<id>/proposals/<proposalId>`, and there enter its
one score out of 100, disqualify it with a reason, or award it once it is evaluated. The last score
in contention moves the opportunity to processing by itself; an award marks the rest not awarded,
awards the opportunity, names the winner on its public page (contact details and score only to its
author and administrators), and emails the winner and each proponent passed over. Submitting and
withdrawing a proposal in any program is confirmed by email, and a withdrawal also tells the
administrators. A vendor sees their score and rank once their proposal is awarded or not awarded.
The rules are `backend/src/rules/proposal-evaluation.ts`, the page's actions
`frontend/src/screens/proposal-evaluation-actions.tsx`; decision record 0060 has the answers and
refusals. Sprint With Us and Team With Us proposals are awarded and disqualified the same way from
their own read-only pages, and once decided the vendor's manage page shows a Scoresheet tab with
each stage's score, the weighted total and the rank, read from what the evaluation stored.

## Individual evaluation

When a Sprint With Us or Team With Us opportunity closes, each evaluator on its panel scores every
proponent on their own. A public sector employee's `/dashboard` lists the opportunities whose panel
they sit on, drafts included, under "Evaluations". The list of opportunities carries each one's
panel to whoever may see it. A row opens the manage page. There an evaluator is offered the program's
instructions (`?tab=instructions`, the page `<program>-evaluation-instructions`) and their own list
(`?tab=evaluation`). The chair, the owner and administrators are offered Consensus once the
opportunity has closed. Nobody else is offered any of these, and asking for one by address shows the
missing page.

The list shows the proponents by anonymous name, in that order. They are read from the opportunity
itself (`proponents`, given only to the panel). Each proponent is scored at
`/opportunities/<program>/<id>/proposals/<proposalId>/<team-questions|resource-questions>/evaluations/create`,
and the evaluator's own evaluation is at `.../evaluations/<their id>/edit`. Each question gets one
score and one comment. Every save keeps what was entered, and the form lists what would stop it being
submitted. The whole set is submitted from the list (`submitIndividualQuestionEvaluations` on the
opportunity), only once every proponent's evaluation is complete. When the last evaluator submits,
the opportunity moves to consensus by itself, and the chair and the owner are emailed. Who may read
whose evaluation, and at which stage, is `mayReadIndividualEvaluation` in
`backend/src/rules/individual-evaluation.ts`. The service is `backend/src/evaluations/` and the
screens are `frontend/src/screens/evaluation-*.tsx`. Decision record 0062 has the answers and
refusals.

The consensus is the chair's. On the Consensus tab the chair opens each proponent at
`.../consensus/create` (or `.../consensus/<the chair>/edit` once started) and records one agreed
score and comment per question, with every evaluator's own beside their name. The chair submits the
set from the tab (`submitConsensusQuestionEvaluations`), with a confirmation, once every proponent
has a complete consensus; the owner and every administrator are emailed. A submitted consensus can
still be changed, and submitted again, until it is finalized. The rest of the panel reads the list
and the evaluators' scores from the consensus stage; an owner off the panel is told why the agreed
scores are not shown yet. Finalizing is the one way out of the stage: "Finalize consensus scores" in
the action bar, offered to the owner and administrators (`finalizeQuestionConsensuses`). It is
refused, with the reason, until every proponent under review has a submitted consensus and one met
every minimum; otherwise it writes each proponent's agreed scores on its history, screens in the
best four (Sprint With Us) or three (Team With Us) that met every minimum, moves the opportunity to
the code challenge or the challenge, and emails the chair and the owner. The rules are
`backend/src/rules/consensus.ts`; decision record 0063 has the answers and refusals.

Staff notices to a small named group — the panel at closing, the chair and owner, the
administrators — go as every other multi-recipient notice does: the group as blind copies, the
service's own address the only visible recipient (`blindCopiedToStaff`, R-6.15, decision record 0063).

## Organizations

Anybody browses at `/organizations`: every organization not archived, by legal name, fifty to a
page, each with its logo. Vendors and administrators are offered the owner, team size and
qualification columns, filled where the service tells them — every row for an administrator, the
rows a vendor owns or administers. A vendor who has accepted the terms registers one at
`/organizations/create` and becomes its owner. Each is managed at `/organizations/<id>/edit` by an
administrator and by its owner and organization administrators; only the owner and an
administrator are offered Edit and Archive. An administrator archiving somebody's organization
emails its owner. `/api/ownedOrganizations` answers a signed-in vendor with the organizations they
own or administer and refuses everybody else. The rules are `backend/src/rules/organizations.ts`;
the answers and refusals are decision record 0047.

The Team members tab (`?tab=team`) lists everyone whose membership stands, read from
`GET /api/affiliations?organization=<id>` by an administrator and the owner and organization
administrators only. From it they invite people by email (`POST /api/affiliations`, always as an
ordinary member), remove people, and give or withdraw administrator rights; an administrator alone
approves a pending invitee and changes the owner. An address nobody registered uses is emailed an
invitation to sign up and makes no membership. The invited person is emailed a way to accept and a
way to decline, both landing on `/users/me?tab=organizations&invitation=<id>&answer=accept|decline`
with the matching confirmation open; that section also offers Accept, Decline and Leave. Every
grant or withdrawal of rights and every transfer of ownership is kept in `affiliationEvents` and
shown on the Changelog tab (`?tab=changelog`), read from the organization's own record. The
service is `backend/src/organizations/team.service.ts`, the rules the team section of
`backend/src/rules/organizations.ts`, the screens `frontend/src/screens/organization-team.tsx`;
the answers and refusals are decision record 0050. The qualification tabs and the program terms
pages arrive in slice 13.

## The first administrator

The service offers no way to make the first administrator (R-4.13). An administrator is made
only by another administrator, who ticks Administrator on a public sector employee's profile;
a vendor can never be one (R-4.12). Where no administrator exists, the one route is to change
the stored account kind directly, outside the service:

1. Have the person sign in once with their government identity, so that the service makes a
   public sector employee account for them.
2. With a connection to the database, change that account's kind:

   ```sql
   UPDATE "users" SET "type" = 'ADMIN', "updatedAt" = now()
   WHERE "type" = 'GOV' AND "idpUsername" = '<their sign-in username>';
   ```

3. They are an administrator from their next request; they need not sign in again.

The sandbox needs none of this: the seed writes the first administrator straight into the data
(`users.administratorOne` in `tests/seed/manifest.yaml`, signing in as `test-admin`).

## Resetting the data

The schema is brought up to date by the `migrate` service before the service starts. To put
the data back to the state `tests/seed/manifest.yaml` describes — wiping whatever is there
first, so running it twice leaves the same data:

```sh
SDLC_SANDBOX_PASSWORD=... docker compose -f app/compose/compose.yaml up seed
```

`seed` is asked for by name and so does not run with the rest of the application; it drops
the schema, which is only ever a thing to do to a sandbox.

On a builder's machine without containers:

```sh
npm --prefix app/backend run build && npm --prefix app/backend start   # :3001
npm --prefix app/frontend run dev                                      # :4300, forwards /api
```

## Two things to know before changing it

- **The contract comes first.** `spec/contract/openapi.yaml` is the API surface. The
  frontend's client is generated from it (`npm run generate:api --workspace frontend`, which
  writes `frontend/src/api/contract.d.ts`); the backend validates every request against it in
  one place. Neither side writes an address the contract does not carry.
- **Knex owns the schema; Prisma only reads it.** `prisma/schema.prisma` is introspected
  (`npm run db:pull --workspace backend`) from a migrated database, never authored ahead of
  one. Decision records 0001, 0002 and 0007 are why.
