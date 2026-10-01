---
gate: G3
question: "Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?"
recommendation: "I reworked slice 6 for R-6.23 but could not confirm the fix: I never got a run that reproduced the failure."
opened: 2026-10-01T05:49:11.242Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?

**Recommendation.** I reworked slice 6 for R-6.23 but could not confirm the fix: I never got a run that reproduced the failure.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I reworked slice 6 for R-6.23 but could not confirm the fix: I never got a run that reproduced the failure. The compose sandbox could not be started from this session, because every `docker compose` command needed an approval nobody was there to give. So I had to work from the code and the specification. The fix is to the one real defect I found that matches the ruling.

**Searching for the failure.** The ruling said vendors' acceptance was not withdrawn after an announcement. The server side holds up. `POST /api/emailNotifications` with `updateTerms` clears `acceptedTermsAt` for every account of type VENDOR, deactivated ones included, and keeps `lastAcceptedTermsAt`. It answers only after that update is committed. The service's own end-to-end test runs it against the real migration history with the acceptance suite's seed applied, and it passes. I also checked:
- the request validation, the cookie session and token handling, and the web server in front of the app;
- that nothing in the app records an acceptance on its own;
- the frontend dialog, which sends the request when confirmed and closes only once the service has answered.

None of them would leave an acceptance in place.

**The defect I found.** The vendor-facing screens show the vendor an account copied once, when the app starts, and never ask the service again. Picture a vendor already signed in when an administrator announces changed terms. Opening their legal section in that same page, even by switching tabs, still showed "You agreed to the terms and conditions on …" and no terms-updated warning, until they reloaded. On screen, their acceptance had not been withdrawn. The original service re-read the account whenever the profile opened. A test that signs vendors in first and then reads their legal section after the announcement would fail exactly as the ruling describes.

**The fix.** A new `refreshHeldAccount` in `app/frontend/src/auth/session.ts` asks the service for the signed-in account and holds the answer. The legal section (`LegalSection` in `user-profile.tsx`) calls it each time it is opened, through `GET /api/users/{id}`. Three guards:
- If anything changes the held account while the read is on its way, the answer is dropped. A fresh agreement saved meanwhile is never overwritten.
- An answer for a different account is ignored, and nothing is asked for a visitor.
- If the service cannot be reached, the copy already held stays.

I added this to decision record 0027.

**Tests.** New unit tests in `app/frontend/tests/changed-terms.test.tsx` cover:
- a vendor holding an old acceptance being shown the withdrawal on opening the legal section;
- the held copy staying when the service fails;
- the three guards above.

Two existing assertions now count only requests that change something, since opening the section now also reads. `npm --prefix app run check` passes: it typechecks every workspace, then runs 16 migration, 332 backend and 194 frontend tests.

**Built in earlier revisions and unchanged:**
- **R-6.23, R-7.13:** the announcement, offered only on the managing screen at `/content/terms-and-conditions/edit` and only to an administrator. Anyone else is refused with 400.
- **R-4.16:** acceptance withdrawn for every vendor, with the date they last agreed kept.
- **R-6.24:** the answer given before any message is sent.
- **R-6.18:** one message per active vendor naming all three programs.
- **R-6.28:** a vendor with no address is skipped, and one the mail server refuses is passed over.
- **R-4.33:** the legal section at `/users/me?tab=legal`, shown to vendors only, where they agree again.

**If R-6.23 still fails, two causes remain that this stage cannot fix:**
- **Deactivated vendor.** The test may check the seeded vendor an administrator deactivated by signing in as them. The test sign-in route on the original service ignores account status, but the sandbox identity provider correctly refuses that vendor (R-4.4). The service itself does withdraw their acceptance, and an administrator can read it at `GET /api/users/{id}`.
- **Parallel tests.** The suite may run tests in parallel against one database. Another test's vendor could then accept terms after the withdrawal.

Settling either needs the test or a running sandbox. The next stage will find nothing of slice 6 missing beyond this one uncertainty. Nothing outside `app/` and `docs/decisions/` was changed.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether slice 6 does what its criteria say, now that it has failed verify three times on R-6.23. I am returning it, with the fix addressed to bind-adapter rather than build. The only vendor that verify lists as not withdrawn, 00000000-0000-4000-8000-000000000220, is the seed's vendorCompletingProfile. The manifest marks it accepted_terms: never and the seed holds NULL acceptedTermsAt, so it never had an acceptance to withdraw. The test counts it as holding one because the new target's acceptedOnNotice binding matches /\bagreed to (the )?terms/i. That also matches the legal section's 'You have not agreed to the terms and conditions.' The old target's /you agreed to/i does not. termsUpdatedWarning also fails to recognise the never-agreed warning 'Agree to the terms and conditions'. The vendor is therefore classed as 'accepted and not warned' both before and after the announcement. This is a binding defect, and no build could fix it. The server-side withdrawal, which the build's own end-to-end test confirms against the migrations and seed, and the new refreshHeldAccount fix are consistent with the criterion. R-6.24 is unbound because the mail-delivery-delay observable expects a delay proxy's control API at the mail catcher's address, and the catcher answers 404. That is also a binding or sandbox matter, not the application's. The ruling would change if a rebound acceptedOnNotice rejects negated text and R-6.23 still fails for a vendor with a real acceptance: that would put the defect back in the application. It would also change if bind-adapter answers that the sandbox cannot host the delay proxy, which is a pipeline gap for the pipeline owner.

**Conditions:**
- addressed-to bind-adapter: the new target's userProfileSelfLegal.acceptedOnNotice (tests/adapters/new/index.ts ~5024) matches /\bagreed to (the )?terms/i. That matches the negative line 'You have not agreed to the terms and conditions.' shown to a vendor who never accepted. In the R-6.23 test this classed seed vendor 00000000-0000-4000-8000-000000000220 (vendorCompletingProfile, accepted_terms: never, NULL acceptedTermsAt) as holding a standing acceptance. Verify then reported that vendor as 'not withdrawn' after the announcement. Bind it to the affirmative acceptance only, as the old target's /you agreed to/i does, so that a negated or 'last agreed' line returns empty. Check that termsUpdatedWarning's reading stays consistent for a vendor who has never agreed.
- addressed-to bind-adapter: R-6.24 is unbound. The mail-delivery-delay.open binding calls GET /hold/proxies/smtp/toxics on the mail catcher at http://localhost:8025, which answers 404 because the delay proxy's control API (observables.yaml delivery_delay) is not served there. Bind it to wherever the delay proxy actually runs on the new target. If the sandbox has no such proxy, say so in the answer so it can be raised as a sandbox gap rather than left as an unbound criterion.
