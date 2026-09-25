---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "Two of the seven owed criteria can now be tested (R-5.9 and R-6.2); the other five stay owed, each for a reason no contract file can fix."
opened: 2026-09-25T11:32:17.314Z
---

# Is this the contract the tests will act through?

**Recommendation.** Two of the seven owed criteria can now be tested (R-5.9 and R-6.2); the other five stay owed, each for a reason no contract file can fix.

I've finished this run's part of the contract. Two of the seven owed criteria can now be tested (R-5.9 and R-6.2); the other five stay owed, each for a reason no contract file can fix.

**What I added**

- **R-5.9 (the service must refuse an evaluation panel with no chair).** The request-level panel page, `evaluation-panel-request` in `spec/contract/surface.yaml`, gains an action `submit_panel_with_no_chair`: two public sector members, both evaluators, neither marked chair, sent straight to the service. It also gains an observation `missing_chair_error`, the service's refusal. It is read next to the existing `panel_as_stored`. The page comment now says where `:opportunityId` comes from: an opportunity the test has just created, or a seeded one still before its deadline. R-5.9 is a new rule the rebuild must follow. The old application accepts a chairless panel (criterion R-5.2 records that defect), so on the oracle this test is expected to diverge.
- **R-6.2 (an action still succeeds when its message cannot be delivered).** This one needed a mail server that refuses delivery. The mail catcher, mailpit, has a built-in fault switch it calls "chaos": while it is on, its mail server rejects each message at the start of the attempt.
  - I turned the switch on in `.sdlc/oracle/compose.yml` (`MP_ENABLE_CHAOS: "true"`). Nothing is refused until a test asks for it.
  - I added a surface page served by the catcher, `mail-delivery-fault`, with actions `refuse_delivery` and `restore_delivery` and an observation `delivery_refused`.
  - I added an `email.delivery_fault` block to `spec/contract/observables.yaml` naming the calls on `${SDLC_MAIL_API}/api/v1/chaos`.

  Nothing about the application changes. The old mailer logs a failed send, carries on and never retries, so to the application a refusing server is the same as an unreachable one. A test that turns the fault on must turn it off when it ends, pass or fail. Putting the data back to the seed does not reset the catcher, so a forgotten fault would leave every later test on that copy with an empty inbox. The page and the observables entry both say this.

Personas, the seed, the manifest and `openapi.yaml` are unchanged. The earlier contract already covers every page, persona and seeded record, and nothing this run needed a new record.

**The oracle**

- My first `oracle up` reported success but changed nothing: an earlier stage had left all four copies running, and the command reused them.
- I took it down and brought it up again. The 78 migrations ran on a fresh database and the seed loaded. The application served the seeded opportunity `00000000-0000-4000-a022-000000000001` with its seeded title. Every copy's catcher accepted the fault switch.
- End-to-end check, signed in as the organization owner:
  - With delivery refused, I sent an invitation to join the organization. The application logged "451 Chaos sender error" and the catcher stayed empty.
  - After I restored delivery, later invitations arrived. The refused one never did, so nothing was retried.
  - The later message landed a moment after the response, so the notes tell tests to wait for it rather than read once. (The 400 on those invitations is the application's normal answer for an invitee who isn't registered yet.)
- I made no changes to get it running. `oracle down` was run at the end and no containers are left.

**Still owed, and why**

- **R-6.1 (nothing is sent when notifications are switched off).** The application reads that switch once at start-up. Testing it needs a second copy started with notifications off, and a port for it that the harness sets. The harness sets only the three port variables it already has, so a test has no way to reach such a copy. This needs support in the harness, not the contract.
- **R-6.24 (success is reported before any message goes out).** This needs a way to hold delivery so success can be read while nothing has arrived yet. Mailpit's fault switch only refuses at once; it cannot delay. Without a hold, checking the catcher when success appears is a race against the sending.
- **R-7.28 (two administrators editing the same page) and R-5.34 (four different people opening one opportunity being evaluated).** I re-read the old sign-in routes (`src/back-end/lib/routers/auth.ts`, lines 192–370). Each finds its account by both account type and a fixed identity-provider id. So only one administrator and one government account can ever be signed in as, and seeding more accounts cannot change that. The personas `administrator-other` and `public-sector-staff-other` are marked unavailable on the oracle for exactly this reason.
- **R-7.29 (an embedded page that has been removed leaves its section empty).** Only one opportunity screen embeds a page body, the Sprint With Us scope page. Deleting that page in the seed would break R-7.12, which needs all twenty-two service pages present, and every test shares one seed. A seed that could differ per test would unblock it.

re-address missing-test/R-5.9 to derive-tests: evaluation-panel-request now carries submit_panel_with_no_chair and missing_chair_error, read alongside the existing panel_as_stored
re-address missing-test/R-6.2 to derive-tests: mail-delivery-fault (refuse_delivery, restore_delivery, delivery_refused), backed by observables email.delivery_fault and the catcher's fault switch enabled in .sdlc/oracle/compose.yml; checked on the running oracle — a refused message is logged and never retried

## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is whether this contract lets tests reach R-5.9 and R-6.2, and whether the five criteria still owed are owed for honest reasons. Approve. R-5.9: evaluation-panel-request gains submit_panel_with_no_chair and missing_chair_error, read next to panel_as_stored. That is enough to test the rebuild's obligation, and the proposal says plainly that the old application will diverge because it accepts a chairless panel, the defect R-5.2 records. R-6.2: the catcher's fault switch (mailpit chaos, 451 at 100% probability) stands in for the criterion's given of an unreachable mail server. I checked this against sources/old/src/back-end/lib/mailer/transport.ts: send() logs the error, resolves and never retries, so the application treats a refused message and an unreachable server the same way. The switch is on in compose but refuses nothing until a test asks, and the surface page and the observables entry both say the fault must be lifted when the test ends and that the later message must be waited for. The oracle was checked end to end and left down. The five still owed each rest on something outside the contract: a second copy started with notifications off (R-6.1), a way to hold delivery (R-6.24), sign-in routes that find their account by account type and a fixed identity-provider id, so there is only one administrator and one government account (R-7.28, R-5.34), and one seed shared by every test, which conflicts with R-7.12 (R-7.29). The failing generated check, tests/generated/surface.d.ts, is the expected lag of a surface change: the typings must be regenerated from this contract before derive-tests writes R-5.9 and R-6.2. It is not a defect in the contract. What would change this ruling: evidence that the old mailer retries or records a refused send differently from an unreachable server, or a test that could leave the fault on across tests despite the stated obligation.

**Conditions:**
none
