---
gate: G3
question: "Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?"
recommendation: "I built all seven slice 6 criteria (R-4.16, R-4.33, R-6.18, R-6.23, R-6.24, R-6.28 and R-7.13)."
opened: 2026-10-01T04:56:39.419Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?

**Recommendation.** I built all seven slice 6 criteria (R-4.16, R-4.33, R-6.18, R-6.23, R-6.24, R-6.28 and R-7.13).

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built all seven slice 6 criteria (R-4.16, R-4.33, R-6.18, R-6.23, R-6.24, R-6.28 and R-7.13). `npm --prefix app run check` passes: every workspace typechecks and all 533 tests pass, 26 of them new. I did not bring the compose stack up; reasons are at the end.

**What was built**
- **Announcing changed terms (R-6.23, R-6.24, R-4.16).** The backend has a new handler for `POST /api/emailNotifications` with the action `updateTerms`, in `app/backend/src/notifications/`.
  - It first withdraws every vendor's standing acceptance, including deactivated vendors'. The date each vendor last accepted is kept.
  - It then reads the active vendors and answers. Only after the answer are the messages handed to the existing mailer, one per vendor. So the administrator is told it worked before any email goes out.
- **Who may announce.** Anyone who is not an administrator, signed in or not, is refused with 400. The contract names 400 for exactly that case, so I followed it rather than the 401 the page requests use. Decision record 0027 explains this and what would reverse it.
- **The message (R-6.18).** It names Code With Us, Sprint With Us and Team With Us together, links to `/users/me?tab=legal`, and does not offer to unsubscribe.
- **Recipients it can't address or reach (R-6.28).** The existing mailer already skipped a vendor with no address and carried on past one the mail server refused. This slice sends through that path, and tests show it working for this broadcast.
- **Where the action appears (R-7.13).** A new shared rule, `carriesTermsAnnouncement` in `rules/content.ts`, matches the page address `terms-and-conditions`. Only that page's managing screen shows the "Notify vendors of updated terms" section, built from the four notification-terms-broadcast stories. It asks first, then shows the success or failure message. The managing screen was already shown only to administrators.
- **The vendor's legal section (R-4.33, R-4.16).** Slice 3 had already built the section and shows it only on a vendor's own profile. I added:
  - a warning, shown whenever the vendor has no standing acceptance, giving the date they last agreed;
  - the "Review and agree to the updated terms" button and its confirmation dialog, which saves a fresh acceptance;
  - a failure message if that save is refused.

  A public sector employee who asks for the section gets their profile instead. An administrator viewing a vendor sees only the profile section. Agreeing on someone else's behalf is refused by the service, an administrator included.

**Tests**
- **Backend unit tests** use an in-memory store and the real mailer. They cover:
  - deactivated vendors losing their acceptance while the last-accepted date is kept;
  - one message per active vendor and none to deactivated vendors;
  - refusal for a visitor, a public sector employee and a vendor;
  - the answer coming before any message;
  - skipping a vendor with no address and carrying on past a refused one;
  - the message's wording, link and missing unsubscribe offer.
- **Backend end-to-end test.** It runs the real service against a database built from the migrations and the acceptance seed, through the contract check. It covers the 400 refusals, the withdrawal across every vendor, a fresh acceptance, and refusal of an acceptance made by an administrator.
- **Frontend tests** cover the rule, the section appearing only on the terms page and only for administrators, cancel/confirm/failure, the legal section for each kind of account, re-acceptance and its failure, and an accessibility scan of both screens.

**Not done, and for later slices**
- **Live stack not run.** This slice doesn't change `app/compose/compose.yaml`. The machine is shared with other running services, so I didn't start the stack on ports 4300 and 8080.
- **Blocking a vendor who hasn't re-accepted.** R-4.16 says vendors are asked to agree "before continuing". The only place built for that is the legal section, and the design records that gap itself. Actually refusing a proposal from such a vendor belongs to the proposal slices (14 and 15), which should check `acceptedTermsAt`.
- **Email preview page.** Slice 21's preview page should include this message, using `termsUpdated` from `mail/notifications/terms-updated.ts`.
- **Placeholder wording.** The privacy-policy text on the legal section is still the stand-in from slice 3; the spec doesn't supply the real text.

I changed nothing outside `app/` and `docs/decisions/`.
