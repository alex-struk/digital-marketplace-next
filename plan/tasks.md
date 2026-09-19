# Tasks — digital-marketplace-next

Twenty-one vertical slices, in build order. Each one is built, deployed to the sandbox and shown
working before the next begins. Every accepted, non-superseded criterion in
`spec/criteria-index.json` (248 of them) appears in exactly one slice. Why the slices fall in this
order, and which criteria sit awkwardly where they are, is in `plan/plan.md`. The build follows
the openshift-ts stack profile with the two departures recorded in `docs/decisions/0001`.
`plan/check-coverage.mjs` checks the placement.

### Slice 1 · A visitor can read the service's own pages
- criteria: R-7.1, R-7.2, R-7.3, R-7.4, R-7.12, R-7.17, R-7.18, R-7.19
- delivers: the walking skeleton — the openshift-ts scaffold (`app/frontend` React/Vite/TanStack Router, `app/backend` NestJS/Prisma, `app/migrations`, `app/compose`) deployed to the OpenShift sandbox by the pinned `bcgov/quickstart-openshift-helpers` workflows, the Knex init container continuing the kept schema's migration history with Prisma introspecting the result, contract validation at the backend boundary and the generated frontend client, one origin through the frontend's forwarding of `/api`, `/status` and `/admin`, `/status`, the site header and footer with its five page links, the home page shell, the three learn-more screens with their service level agreement link, the public page view at `/content/:slug` with formatted-text rendering that never executes markup, the not-found screen, and the seeded set of pages a fresh installation needs (including the service level agreement page)
- depends on: nothing

### Slice 2 · A person can sign in, finish signing up and sign out
- criteria: R-4.1, R-4.2, R-4.3, R-4.6, R-4.17, R-4.22, R-4.23, R-4.24, R-4.27, R-4.28, R-6.1, R-6.2, R-6.3, R-6.4, R-6.5, R-6.20, R-6.28
- delivers: sign-in and sign-up screens, OpenID Connect sign-in with PKCE from the single-page app through the sandbox Keycloak realm (public client, no secret in the browser), bearer-token checks on every `/api` route with authorization by the account kind and status held in `users`, `/api/sessions/current` creating the account on first sign-in by identity kind, the profile-completion screen with terms agreement and the new-opportunity notice choice, the return to the page sign-in began from, sign-out from the service and the identity provider, and the mail path every later slice uses — one configured sender, formatted and plain-text forms, test marking, the environment switch, fire-and-forget delivery that never fails the action, and skipping recipients with no address — shown first by the welcome message
- depends on: Slice 1

### Slice 3 · A person can keep their own profile, picture and notification choice
- criteria: R-4.5, R-4.8, R-4.9, R-4.18, R-4.25, R-4.26, R-4.29, R-4.33, R-4.34, R-6.6, R-6.7, R-6.16, R-8.1, R-8.2, R-8.5, R-8.6, R-8.7, R-8.10, R-8.11, R-8.12, R-8.13, R-8.16, R-8.17, R-8.18, R-8.21, R-8.23, R-8.24, R-8.28, R-8.30
- delivers: the profile at `/users/:userId` and `/users/me` with the sections each kind of account is offered (profile, capabilities, organizations placeholder, notifications, legal), editing one's own details, the profile-picture picker, vendor capabilities, the notifications section and the unsubscribe landing every message links to, self-deactivation with its notice and reactivation on next sign-in; and underneath the picture, the whole file store — upload at `/api/files` and `/api/avatars`, content-deduplicated storage in the database, read-access rules, description and download, size and name limits, image type checks and resizing, the upload working directory on the backend's `emptyDir` volume, downloads fetched by the single-page app with the bearer token, and correct refusals for malformed uploads
- depends on: Slice 2

### Slice 4 · An administrator can manage people's accounts
- criteria: R-4.4, R-4.12, R-4.13, R-4.14, R-4.19, R-4.20, R-4.21, R-4.30, R-4.31, R-4.32
- delivers: the user list at `/users` with search, the contact-list export, an administrator's view of someone else's profile with deactivate, reactivate and administrator-rights controls, the messages each sends, the sign-in refusal and notice for an account an administrator deactivated, and the seeded first administrator
- depends on: Slice 3

### Slice 5 · An administrator can write and manage the service's pages
- criteria: R-7.5, R-7.6, R-7.7, R-7.8, R-7.9, R-7.10, R-7.16, R-7.20, R-7.21, R-7.22, R-7.23, R-7.24, R-7.25, R-7.26, R-7.27, R-7.28, R-8.29
- delivers: the content area — page list, create, edit, rename, publish with kept versions, remove, protection of the pages the service needs, authorship shown to administrators, the formatted-text editor with its guidance link and embedded image upload, and one permission-refusal shape for every page request
- depends on: Slice 3

### Slice 6 · An administrator can announce changed terms, and vendors accept them again
- criteria: R-4.16, R-6.18, R-6.23, R-6.24, R-7.13
- delivers: the announce-changed-terms action on the terms and conditions page's managing screen only, withdrawal of every vendor's standing acceptance, the broadcast to active vendors naming all three programs, and the terms-updated warning and re-acceptance on the vendor's legal section
- depends on: Slice 5

### Slice 7 · Staff can draft, submit and publish a Code With Us opportunity
- criteria: R-1.4, R-1.7, R-1.8, R-1.9, R-1.10, R-1.11, R-1.12, R-1.14, R-1.19, R-1.20, R-1.21, R-1.22, R-1.23, R-1.29, R-1.34, R-1.37, R-1.48, R-1.51, R-1.53, R-1.56, R-6.8, R-6.15, R-8.19, R-8.22, R-8.25, R-8.27
- delivers: the program chooser, the Code With Us create form and manage page with its summary, opportunity and history tabs, the public Code With Us view, versioned saves, the full opportunity state model and its permitted-transition table for all three programs (with "suspended" mapped away in data), draft/submit-for-review/publish/delete with their permission rules, the attachment control, and the submitted-for-review and published notices — the first messages to many recipients, batched and blind-copied
- depends on: Slice 3

### Slice 8 · Anyone can find opportunities and follow the ones they care about
- criteria: R-1.2, R-1.3, R-1.5, R-1.6, R-1.38, R-1.39, R-6.21, R-6.27
- delivers: the opportunity list at `/opportunities` grouped into unpublished, open and closed with filters and search, visibility by role on list and view, view counting, watching and unwatching, the new-opportunity notice control on the list at every width, the staff and administrator dashboard, and the home page's browse entry
- depends on: Slice 7

### Slice 9 · An opportunity's author and administrators can run it after publication
- criteria: R-1.28, R-1.30, R-1.32, R-1.33, R-1.35, R-1.36, R-6.17
- delivers: the addenda tab, private notes with files on the history tab, cancellation, the reporting figures (views, watchers, proposals) and full history for the author and administrators, and the notices to watchers, proposers and the author when an addendum is added or an opportunity is cancelled — with no message of any kind to a deactivated account
- depends on: Slice 8

### Slice 10 · Staff can create Sprint With Us and Team With Us opportunities with an evaluation panel
- criteria: R-1.13, R-1.15, R-1.16, R-1.17, R-1.18, R-1.43, R-1.55, R-5.1, R-5.9, R-5.16, R-5.17, R-5.18, R-5.37, R-7.29
- delivers: the Sprint With Us and Team With Us create forms, manage pages and public views — budgets, phases, capabilities, resources and service areas, evaluation questions, evaluation weights — the evaluation panel tab with its membership, chair and role rules and the window in which it may change, notices to newly added panel members, and the embedded scope content that stays empty rather than breaking the view when its page is missing
- depends on: Slice 7

### Slice 11 · A vendor can register and look after an organization
- criteria: R-3.1, R-3.2, R-3.3, R-3.6, R-3.15, R-3.18, R-3.19, R-3.20, R-3.21, R-3.22, R-3.23, R-3.24
- delivers: the public organization list with role-dependent columns, registering an organization with its logo, the organization management page's profile tab with edit and archive offered only to the owner and administrators, the owner's archive notice, and the list of organizations a vendor may act for
- depends on: Slice 3

### Slice 12 · An organization can build its team
- criteria: R-3.7, R-3.8, R-3.9, R-3.10, R-3.11, R-3.12, R-3.13, R-3.14, R-3.17, R-3.30, R-3.31, R-3.32, R-3.33, R-3.34, R-3.35
- delivers: the team tab — inviting by email (including the invitation to register for an unknown address), pending and active memberships, accept and decline from the invitation message landing on the person's organizations section, leaving and removal, organization administrator rights, ownership transfer, the changelog tab, the team capability summary, and the messages each step sends
- depends on: Slice 11

### Slice 13 · An organization can qualify for Sprint With Us and Team With Us
- criteria: R-3.25, R-3.26, R-3.27, R-3.28
- delivers: the two qualification tabs with their requirement checklists, the program terms pages and their one-time acceptance, the administrator's service-area approvals, and the qualified marks on the organization list and the person's organizations section
- depends on: Slice 12

### Slice 14 · A vendor can propose on a Code With Us opportunity
- criteria: R-1.31, R-2.1, R-2.2, R-2.3, R-2.4, R-2.7, R-2.9, R-2.11, R-2.12, R-2.13, R-2.14, R-2.15, R-2.23, R-2.24, R-2.25, R-8.20, R-8.31
- delivers: the Code With Us proposal create and manage pages, individual or organization proponent, attachments, draft and submit with terms acceptance, one proposal per vendor and per organization, deadline guard, withdraw and resubmit, delete of drafts, proposal history, the vendor dashboard with own and organization proposals, staff seeing no proposal until the opportunity has closed, and one read rule for files attached to opportunities and proposals, withdrawn when the attachment goes
- depends on: Slice 8, Slice 11

### Slice 15 · A vendor can propose on Sprint With Us and Team With Us opportunities
- criteria: R-2.10, R-2.16, R-2.17, R-2.18, R-2.19, R-2.20, R-2.21, R-2.22
- delivers: the Sprint With Us and Team With Us proposal create and manage pages — organization choice checked for qualification at submission, phase teams and scrum masters, capability coverage, budgets, team members against resources with hourly rates, the Team With Us budget ceiling on create and edit, answers to evaluation questions within their word limits, and the organization locked once submitted
- depends on: Slice 10, Slice 13, Slice 14

### Slice 16 · Opportunities close at their deadline, and a Code With Us one is scored and awarded
- criteria: R-1.1, R-1.24, R-1.26, R-1.27, R-2.5, R-2.26, R-2.27, R-2.32, R-2.33, R-2.34, R-2.35, R-2.36, R-5.20, R-6.25
- delivers: the deadline hook in front of `/api` and `/status` that closes opportunities in all three programs (proposals to review, anonymous proponent names, notices to the author or the evaluation panel), the Code With Us proposal view for staff with scoring, disqualification with reason, automatic move to processing, award, the successful proponent on the public view, the vendor's own score and rank after the decision, proposal history of states and scores, and the submit, award, decision and withdrawal notices
- depends on: Slice 15

### Slice 17 · Panel evaluators score proponents individually
- criteria: R-5.3, R-5.11, R-5.19, R-5.21, R-5.22, R-5.23, R-5.24, R-5.25, R-5.26, R-5.27, R-5.28, R-5.34, R-5.35, R-5.36
- delivers: the dashboard's evaluations tab listing opportunities a person sits on the panel for, the instructions and individual evaluation tabs for evaluators, the per-proponent evaluation screens worked through in anonymous order, draft and whole-set submission with completeness checks, the automatic move to consensus with its notice to the chair and owner, and who may read an individual evaluation at each stage — for Sprint With Us and Team With Us alike
- depends on: Slice 16

### Slice 18 · The chair agrees a consensus and the questions stage is finalised
- criteria: R-1.41, R-1.50, R-2.29, R-5.10, R-5.12, R-5.13, R-5.14, R-5.29, R-5.30, R-5.31, R-5.32, R-5.33
- delivers: the consensus tab and per-proponent consensus screens for the chair, reopening and resubmitting until finalised, the explanation shown to an owner who is not on the panel, the single finalise action offered to the owner and administrators with its refusals naming the right next stage, screening in the top proponents that met every minimum, and the submitted and finalised notices
- depends on: Slice 17

### Slice 19 · Sprint With Us and Team With Us proposals go through their challenge stages to an award
- criteria: R-1.25, R-1.42, R-1.49, R-2.28, R-2.30, R-2.31
- delivers: the code challenge and team scenario tabs for Sprint With Us and the challenge tab for Team With Us, stage-by-stage scoring with wrong-stage refusals, screening in and out, the guard on starting the team scenario, price scores and weighted totals with ranking, the automatic move to processing, and award out of processing for all three programs alike
- depends on: Slice 18

### Slice 20 · Staff can take away proposals and administrators can read an opportunity's full report
- criteria: R-1.40, R-2.37, R-2.38
- delivers: the printable copy of one proposal for anyone entitled to read it (anonymous to staff until the challenge stage), the all-proposals export for staff with the choice to name proponents, and the administrator-only completed-opportunity report, for all three programs
- depends on: Slice 19

### Slice 21 · An administrator can preview every message the service sends
- criteria: R-6.13, R-6.19
- delivers: the email notification reference at `/admin/email-notification-reference`, showing a sample, subject and summary of every message built in slices 2 to 19, refused to anyone but an administrator
- depends on: Slice 19
