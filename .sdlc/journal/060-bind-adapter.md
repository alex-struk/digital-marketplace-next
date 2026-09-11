---
stage: "bind-adapter"
title: "bind-adapter: post-checks failed"
at: "2026-09-11T03:36:41.337Z"
cost: 70.71473250000001
turns: 501
session: "abe9186e-f334-40ea-a850-2d7d5b7cdad1"
---

I walked the running application and wrote the adapter. Two files exist under my territory: `tests/adapters/old/index.ts` and `tests/adapters/old/bindings.yaml`.

**What the target is.** The address in the environment serves the B.C. Digital Marketplace. I explored it signed out and then as an administrator, as public sector staff, and as six separate vendor accounts, minting each session through the routes the personas name. Sign-in in the adapter does exactly that: it navigates to `baseURL + persona.signIn["session-route"].route`. The one persona whose entry is unavailable, the second public sector staff member, throws `unbound: signIn.public-sector-staff-other` with the reason the contract gives, so criteria needing that persona calibrate as unbound rather than failing. Signing in as the anonymous visitor signs the browser out instead of throwing, since being signed out is that persona's whole state.

**Four habits of the application shaped every binding.** Its buttons are almost all anchors with no `href`, so they carry neither a button nor a link role and have to be found by exact visible text; a disabled one is recognised by having been dropped from the tab order. The top navigation is rendered twice, once for wide screens and once for narrow, so every lookup is filtered to what is actually visible. Destructive and state-changing actions live in an Actions menu in that navigation and usually raise a confirmation dialog, which the adapter steps through. Validation messages are rendered outside any paragraph while help and note text sits inside one, so error observations read the visible lines that look like messages and subtract the page's standing prose. I verified that split on a rejected reward, an invalid slug, a bad scoring weight and a blank evaluation panel slot.

**Two routes in the contract do not resolve as written.** `/sign-up/complete` never shows the profile-completion form on this target: it redirects to the dashboard when signed in and to the sign-in page when signed out, and no available sign-in route mints an account with an unfinished profile. All eleven of that page's members are therefore unbound. `/opportunities/:program/:opportunityId/edit?tab=attachments` is not a tab either; the edit page offers only summary, opportunity, addenda, history and proposals, and an unknown tab silently falls back to the summary. Attachments are a step inside the Opportunity tab's form, so the attachment control page opens the form and walks to that step instead.

**What I marked unbound, and why.** Beyond the sign-up page: adding a note on the Code With Us and Sprint With Us management pages, because the History tab shows only the list of entries and offers no control anywhere on the page, checked on a published opportunity as both its owner and an administrator, on a draft, and on a Sprint With Us opportunity built for the purpose. Paging the organizations list, because no pager is rendered at all. Four observations are conveyed only by unlabelled icons with no text, no accessible name and no state in the accessibility tree: the administrator mark in the user list, whether a capability is held, and which image types the two picker controls accept. Finally, three members of the profile notifications tab, because turning the notice off there takes effect at once with no confirmation; the confirmation belongs to the unsubscribe landing page, where it is bound.

**What I could not reach, and what that means for the bindings.** No Sprint With Us or Team With Us opportunity exists on this target, and building one to a published, closed, evaluated state needs proposals from qualified organizations and deadlines in the past. So I never saw the two non-CWU public opportunity pages, any proposal page past a Code With Us draft, any scored proposal, or any individual or consensus evaluation sheet. Those members are bound against the patterns I confirmed elsewhere in the application rather than against the pages themselves: the navigation buttons, the Actions menu, the sidebar tabs, the dialogs, the labelled form fields and the message reader. Where a control's wording was a judgement call I gave the binding several candidate labels, and every one of them throws a named `unbound:` error at run time if none is present, so a later stage sees precisely which label was wrong rather than a silent pass.

**Housekeeping.** To learn the shapes of the Sprint With Us and Team With Us forms and the proposal management page I created two draft Sprint With Us opportunities and one draft Code With Us proposal, and deleted all three; the opportunity list and the seeded data are back as I found them. Two orphaned file rows remain from probing the stored-file address, one named `adapter-probe.txt`; the application offers no way to remove a file and nothing links to them.

**What I could not verify.** The workspace has no installed dependencies, so I could not run `npm run typecheck` over the adapter. I checked the surface interfaces member by member and the parameter shapes by hand instead. I did verify the bindings file mechanically against the contract: 79 pages and 680 names, each spelled as `surface.yaml` spells it, none missing, none repeated, none invented.

tests/adapters/old/index.ts:110: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:147: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:154: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:174: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:175: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:662: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:1633: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:1637: adapters must not define a test(): contains test(
tests/adapters/old/index.ts:2412: adapters must not define a test(): contains test(