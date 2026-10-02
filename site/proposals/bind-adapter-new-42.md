| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T10:45:25.941Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't bind any of the three members.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I couldn't bind any of the three members. The running build doesn't offer an organization team screen or a vendor proposals view to anyone. I added what this pass checked to the reason text in the adapter and in `bindings.yaml`; nothing else in either file changed. The shell refused to run the type check and the YAML parse without approval, so neither file was machine-checked after the edit. Both edits only add plain prose: one inside an existing message string in `index.ts`, the other inside existing double-quoted values in `bindings.yaml`.

**What I did to look.** I signed in through the identity provider's form, first as the vendor who owns the seeded qualified organization (and who wrote the seeded proposals), then as the administrator. The password was typed only as the variable name.

**R-6.17 (`organization-edit.add_team_members`): still unbound.**
- As the owning vendor and as the administrator, every organization address answers "Page not found": `/organizations`, `/organizations/create`, `/organizations/:orgId`, and `/organizations/:orgId/edit` (with and without `?tab=team`). I tried this for the seeded qualified organization (…0301) and for …0304.
- The owner's profile Organizations tab, at both `/users/:userId?tab=organizations` and `/users/me?tab=organizations`, says organizations "will be listed here once organizations can be registered on the Digital Marketplace".
- The back end has no such feature either: `/api/ownedOrganizations` and `/api/organizations` answer 404 ("Cannot GET").

**R-1.35 and R-1.36 (`proposal-vendor-dashboard.show_my_proposals`): still unbound.**
- As the owning vendor, `/dashboard` (also tried as `/dashboard?tab=myProposals`) shows only the heading "Dashboard" and "You are signed in as Blake Placeholder.", with no tab, link or button on the page. The header offers only Dashboard, My profile and Sign out.
- `/proposals` answers "Page not found", and `/api/proposals/code-with-us` answers 404.
- The page of the seeded awarded Code With Us opportunity, whose winning proposal this vendor wrote, offers no proposal link and no other control.
- That proposal's own screen and its edit screen, under `/opportunities/code-with-us/:opportunityId/proposals/:proposalId`, both answer "Page not found".

The adapter code already searches the live page for these controls and only throws `unbound:` when it finds none. If a later build adds the organization team screen or a "My Proposals" control, it will bind with no change to the code.

**Routes that don't resolve.** Every organization route and every proposal route in `surface.yaml` answers "Page not found" on this build, for the owning vendor and for the administrator alike. That covers `/proposals`, `/organizations`, `/organizations/create`, `/organizations/:orgId/edit` and the Code With Us proposal screens. `/dashboard` resolves but offers a vendor nothing beyond the sign-in sentence.

Nothing outside `tests/adapters/new/` was touched.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-42 adapter bind every surface action and observation on `new`, and nothing else? Ruling: return. The adapter itself has no fault. Its only change adds evidence to the existing unbound reasons in index.ts and bindings.yaml. It adds no assertion or logic, nothing under tests/acceptance changed, and the runner's typecheck passed. Its reasons are real: on this build every organization route and every proposal route answers 'Page not found', and the vendor dashboard offers no control. The return is because the tests go past their criteria. R-6.17 says a deactivated account receives no notification of any kind, including notices about opportunities it was watching. Its test drives the organization edit screen's add_team_members to send an invitation, and it leaves the watched-opportunity notice unasserted, saying blind copies cannot be read. The surface does read them: caughtMessage.copiedRecipients is bound on `new` and the R-1.35 test uses it. opportunityCwuEdit edit_details and add_addendum are also bound. So the test needs an organization team capability its criterion never mentions, and it leaves out the clause the criterion names. R-1.35 and R-1.36 need a published opportunity with submitted proposals as the starting condition. Both tests check that condition through the vendor's own 'My Proposals' dashboard listing, which neither criterion asks for. The ruling would change to approve once regenerated tests for these three criteria no longer call proposal-vendor-dashboard.show_my_proposals or organization-edit.add_team_members, and the adapter's remaining unbound reasons still hold against the build.

**Conditions:**
- test-overreaches R-6.17: the test sends an organization team-membership invitation (adding the deactivated account's email as a team member of an organization) as its example of a notification. The criterion never mentions organizations or team invitations. The notice it does name, about an opportunity the deactivated account was watching, is left unasserted on the grounds that blind-copied recipients cannot be read, but the caught-message surface does expose blind-copied recipients. The test should check that a deactivated account which watches a published opportunity is not among the recipients, visible or blind-copied, when that opportunity is changed or given an addendum, and that an active watcher is.
- test-overreaches R-1.35: to confirm its starting condition, the test requires the proposing vendor to see their submitted proposal in a 'My Proposals' listing on their own dashboard. The criterion's starting condition is only that the opportunity has submitted proposals. It does not ask that a vendor can list or view their own proposals.
- test-overreaches R-1.36: to confirm its starting condition, the test requires the proposing vendor to see their submitted proposal in a 'My Proposals' listing on their own dashboard. The criterion's starting condition is only that the opportunity has submitted proposals. It does not ask that a vendor can list or view their own proposals.

### Runner-owned typecheck evidence

Proposal revision: `0d322e1441e8691d98820be709d4f9af7a79b820`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
