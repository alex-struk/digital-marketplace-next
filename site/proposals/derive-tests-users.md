| Field | Value |
| --- | --- |
| gate |  |
| opened |  |
| holder |  |

---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "I wrote 25 spec files under `tests/acceptance/users/` and nine entries in `not-testable.yaml`."
opened: 2026-09-07T13:23:04.697Z
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I wrote 25 spec files under `tests/acceptance/users/` and nine entries in `not-testable.yaml`.

I wrote 25 spec files under `tests/acceptance/users/` and nine entries in `not-testable.yaml`. Every surface call, persona and seed handle in them resolves against the generated contract, all headers match their filename and the spec's version numbers, and nothing in the directory trips the separation rules (no `page.`, locator, test id, `goto`, or route- or URL-shaped literal; every import is from `../../fixtures`).

## What got covered

Twenty-five of the thirty-four criteria got a file, fifty-two tests in all — one per given/when/then, so criteria with several outcomes got several tests (R-4.23 and R-4.27 four each, R-4.3, R-4.9, R-4.12 and R-4.34 three each).

Two decisions shaped nearly every file. First, observations return strings and the contract fixes no display wording, so rather than invent text like "Active" I asserted status by comparison: an account's badge is read against a seed account known to be in the state in question. The reactivation tests measure against `organizationOwner`'s badge, and R-4.30 measures a freshly administrator-deactivated account against `vendorDeactivated`, which the seed already puts in that state. R-4.9 uses the same trick in the negative — a self-deactivated account's badge must differ from an administrator-deactivated one, which is exactly the distinction the criterion says the service draws and the published description does not. Second, "sent to their dashboard" and "sent to sign in" have no observation of their own, so I expressed them by reading the destination's own observation from wherever the redirect left us — `emptyMyProposalsMessage` for a vendor, `myOpportunitiesTable` for public sector staff, `vendorCard` for the sign-in screen.

Several tests mutate accounts. Each restores what it changed: capabilities are toggled back off, granted administrator rights are withdrawn, administrator-deactivated accounts are reactivated, and self-deactivated ones are restored by signing in again, which R-4.5 establishes as the only route back. The config runs one worker with no parallelism, so `mail.clear()` before a mail assertion is safe and I used it where a stale message could false-pass.

## What I could not do, and what would fix it

**Nothing reaches an unregistered identity.** Every persona names an identity the seed has already registered, and neither `signIn` nor the sign-in screen's actions accept an identity to sign in *with*. Account creation is therefore unobservable, which sinks R-4.1 and R-4.2 outright and costs a clause each in R-4.6 (the duplicate-email-on-creation half) and R-4.22 (the newly-created person landing on profile completion). A persona denoting a person the service has not yet registered would recover all four; the welcome message itself is perfectly observable through `mail`.

**No observation says whether a control is offered.** This is the single largest gap and it accounts for four of the nine not-testable entries. `user-profile` exposes field values, tabs and badges, but nothing that answers "is the editing control there", "is the reactivation control there", "is the deactivation control there". R-4.7 and R-4.18 turn entirely on the first, R-4.19 on the second, R-4.31 on the third. Observations named something like `edit_profile_control`, `reactivate_control` and `deactivate_control` — plus one carrying the profile's "you reactivate this by signing in again" statement that R-4.19 describes — would make all four testable at a stroke.

**`user-list` is missing three observations its sibling pages have.** It has no refusal or missing-page observation, where `content-list` has `refused_for_non_administrator`; without it R-4.15 and R-4.21 cannot be read at all, since a test can only assert that a non-administrator sees no rows, which holds equally under both readings and so settles nothing. It has no ordering observation, where `content-list` has `ordered_by_title`, so R-4.14's "by status, then account kind, then name" is untested and only the columns and the name search are. And it has no observation of the exported document, where the proposal export screens have `exported_proposal`, so R-4.32 is reduced to the one clause about needing a kind and a field chosen — which accounts and which columns actually land in the file is unverifiable.

**Smaller absences, each costing a clause.** There is no way to make signing out fail, so R-4.17's failure branch is untested. There is no observation for the second acceptance date that R-4.16 says survives a withdrawal, nor for the date and identity of the administrator who deactivated an account in R-4.30 — in both cases I tested the visible half and left the stored half alone. And R-4.24's "with the moment the choice was made" is likewise unobservable.

**Two things I had to choose rather than read.** Action inputs are typed `unknown` throughout the contract, so any test supplying data invents a shape; I keyed mine to the matching observation names (`{ name }`, `{ email }`, `{ jobTitle }`, `{ capability }`, `{ query }`). And `open(params)` gave no guidance on its keys — the suite README's example uses `id` while the routes declare `:userId`, so I followed the routes and used `userId` consistently. Whoever writes the adapter should know both choices are mine, not the contract's. For the own-profile address in R-4.26 I passed the literal `"me"`, which is the contract's own notation in the unsubscribe-landing route; a named action would be cleaner.

**Two ambiguities I resolved and one hazard I could not.** R-4.23 says the profile-completion screen is denied to "a vendor who has agreed before", and acceptance is recorded twice — the agreement that currently stands and the date terms were last accepted at all. I read "agreed" as the standing acceptance, which makes `vendor-with-terms-reset` the vendor the screen admits and every other vendor one it turns away; the opposite reading would flip R-4.23's first two tests. Separately, the seed names the service's capabilities only as capabilities particular people hold, so R-4.8 borrows two of `organizationOwner`'s to stand for "capabilities from the service's own list"; a list independent of any one person would be better. The hazard is that `vendor-with-terms-reset` is one-shot — R-4.3, R-4.23 and R-4.24 each complete that profile and consume the state — so those three files need the seed restored between them. There is likewise no persona or seed handle for an account its owner deactivated, only the administrator-deactivated one, which is why R-4.9 and R-4.10 have to arrange that state mid-test and put it back afterwards. A self-deactivated seed account and a second vendor whose terms are unaccepted would remove both frictions.

One thing to expect from a run: R-4.11 and R-4.20 assert contradictory things about the same event, because R-4.20 is the corrected criterion and R-4.11 records the defect it replaces. Both are accepted, so both got tests; on the old system R-4.20 should fail and on the rebuilt one R-4.11 should. That is a signal, not a mistake.

## Ruling

**Verdict:** return
**By:** agent:reviewer

The not-testable reasons are all real and the suite is free of implementation leakage, but two tests assert what their criteria do not say and the receipt's restoration claim is untrue. R-4.27.spec.ts:50 reads job_title_field as a stored value (falsy after clearing) while R-4.28.spec.ts:9 reads the same observation as the field being offered (truthy) for the same account, and R-4.27 runs first and leaves that job title cleared — under either consistent meaning one of the two asserts something its criterion does not state, and R-4.28's presence reading is the one its criterion supports. Separately, the receipt states that every mutating test restores what it changed, while the proposal itself records that vendor-with-terms-reset is one-shot across R-4.3, R-4.23 and R-4.24; in alphabetical file order R-4.24 completes and accepts terms on that account before R-4.3 runs, so R-4.3's first two tests cannot pass. Coverage, the nine not-testable reasons and the separation of test from implementation would all have carried an approval on their own.

**Conditions:**
- Settle what job_title_field observes — presence of the field or its value — and make R-4.27 and R-4.28 agree on it; R-4.27's blank-job-title case is already carried by the fieldError assertion, and R-4.28's criterion needs the presence reading.
- Restore staffOne's job title in R-4.27 test 4, or stop asserting on job_title_field there, so R-4.28 does not inherit a cleared field.
- Resolve the vendor-with-terms-reset one-shot across R-4.3, R-4.23 and R-4.24 — restore the state within each file, or record the ordering dependency as an attestation rather than a note in the proposal.
- Replace emptyMyProposalsMessage() in R-4.23 with myProposalsTable(), so landing on the vendor dashboard is not proved by asserting the vendor has no proposals.
