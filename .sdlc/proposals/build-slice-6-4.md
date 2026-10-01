---
gate: G3
question: "Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?"
recommendation: "I made no change to the application on this revision."
opened: 2026-10-01T06:03:54.607Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?

**Recommendation.** I made no change to the application on this revision.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no change to the application on this revision. The ruling found nothing wrong with the application for slice 6. Both of its conditions are addressed to the bind-adapter stage, and it told this stage to leave them alone. I changed nothing under `app/` or `docs/decisions/`.

**What the ruling found.** Verify failed R-6.23 three times, and each time it listed one vendor as "not withdrawn". That vendor, 00000000-0000-4000-8000-000000000220, is the seed's vendorCompletingProfile: it has never accepted the terms and has no stored acceptance date, so there was nothing to withdraw. The test still counted it as holding an acceptance. The test's pattern for an accepted vendor also matches the legal section's "You have not agreed to the terms and conditions." That is a fault in the test's binding, not in the application.

I thought about rewording that sentence so the pattern would stop matching it, and decided against it. The sentence is correct as it stands, and rewording it would only hide the binding fault from the stage that has to fix it. The other open criterion, R-6.24, isn't bound to the application at all: the test looks for a mail-delay proxy's control interface at the mail catcher's address, and nothing serves it there. That too belongs to bind-adapter, or is a sandbox gap if no such proxy exists.

**State of what was already built.** I re-ran `npm --prefix app run check`. The workspace had no installed dependencies, so I ran `npm ci` first. After that the check passed for every package: 16, 332 and 194 tests, all passing, and the typechecks passed too. The error lines in its output come from tests that deliberately exercise failure paths: a vendor list that can't be read, and a mail refusal. They are not failures.

The slice already covers all seven criteria (R-4.16, R-4.33, R-6.18, R-6.23, R-6.24, R-6.28, R-7.13):
- the action to announce changed terms, on the terms and conditions page's managing screen
- withdrawal of every vendor's standing acceptance
- the broadcast to active vendors naming all three programs, which skips a vendor with no address and carries on past one it can't reach
- the vendor's legal section, with its terms-updated warning and re-acceptance

How it was built is recorded in `docs/decisions/0027-announcing-changed-terms.md`.

**Not done here.**
- **R-6.23:** the accepted-vendor pattern needs rebinding so it ignores negative wording, and the never-agreed warning needs checking.
- **R-6.24:** the mail-delay check needs binding to wherever the delay proxy actually runs.

Both are filed with the stage that owns them. If R-6.23 still fails after the rebinding for a vendor who really had accepted, the fault comes back to the application.
