---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I derived tests for the twenty-eight accepted criteria of the notifications domain from the contract alone — `spec/`, the generated `surface.d.ts`, `personas.ts`, `seed.ts`, and the `mail` fixture."
opened: 2026-09-07T14:03:18.341Z
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I derived tests for the twenty-eight accepted criteria of the notifications domain from the contract alone — `spec/`, the generated `surface.d.ts`, `personas.ts`, `seed.ts`, and the `mail` fixture.

All twelve files are clean of implementation reaches, and `not-testable.yaml` carries the other sixteen. Dependencies aren't installed in this workspace (`tests/node_modules` is absent), so I could not run `npm run typecheck` or the suite itself; I hand-checked the types against the generated declarations instead.

---

## Journal

I derived tests for the twenty-eight accepted criteria of the notifications domain from the contract alone — `spec/`, the generated `surface.d.ts`, `personas.ts`, `seed.ts`, and the `mail` fixture. Twelve criteria got a spec file (fourteen `test()` cases in all: R-6.7 and R-6.17 each state two outcomes and so got two); sixteen got an entry in `not-testable.yaml`.

**What is covered.** The unsubscribe landing (R-6.6, R-6.7) is the best-served part of the surface: the contract carries a page for the settings screen *as reached from an offer in a message*, so the destination half of R-6.6 and the whole of R-6.7 test properly — a forwarded offer acting on whoever is signed in, the addressee's own choice left untouched, and sign-in required. The reference page (R-6.13), its twelve absences (R-6.14) and the authored replacement demanding completeness (R-6.19) test as mirror images of each other, keyed on two message families the spec says are wholly absent in both programs — the notices to an evaluation panel and the notices about a consensus. The changed-terms broadcast (R-6.23) tests end to end, including the withdrawal of a vendor's standing acceptance read back from their own legal tab. The list-page opt-in control tests both directions (R-6.21) and its narrow-screen absence (R-6.22). Two broadcast-robustness criteria (R-6.26, R-6.28) test the half that is observable: the run reports success and reaches the vendors after the one that holds no address.

**Where I wrote a partial test rather than nothing.** Four files cover a clause rather than the whole criterion, and each says so in a comment at the top: R-6.6 (the offer's destination, not the label at the foot of the body), R-6.10 (a message the preference does not govern still arrives, via a team request; the withheld announcement is not asserted), R-6.17 (a deactivated account gets no changed-terms message, and its watch survives deactivation — but not the watched-opportunity notice the criterion really turns on), and R-6.21/R-6.26/R-6.28 as noted. I judged a narrow true test better than an empty entry, but a reader ruling on this proposal should not read those four as full coverage.

**Why sixteen could not be reached.** Three gaps account for nearly all of them.

The first and largest is the mail fixture. `observables.yaml` names sender, copied recipients, HTML body, plain-text body and a read-one-message route as observable, but `Mail` returns only subject, snippet, visible recipient and id, and can only search by a recipient address. That single gap sinks R-6.3, R-6.4, R-6.5, R-6.8, R-6.9, R-6.12, R-6.15, R-6.16, R-6.18 and R-6.25, and it is what forced R-6.10, R-6.11 and R-6.17 into partial or no coverage: every batched notice — the new-opportunity announcement, the changed-opportunity notice, the panel notices — is addressed with blind copies, so a search by visible recipient finds nothing whether or not the message was sent, and absence proves nothing. Accessors for `from`, `bcc`, `Text`, `HTML`, one message by id, and the whole catcher would turn ten of those sixteen into real tests.

The second is that nothing configures the environment under test. R-6.1 (notifications switched off), R-6.2 (mail server unreachable) and half of R-6.3 (test-environment marking) all have a *given* that no page, action, observation or fixture can establish. R-6.3 has a second problem worth fixing regardless: the test marker prefixed to subjects is never named anywhere in the spec or the contract, so even with the environment set up there is no value to assert against.

The third is a set of specific, small additions I needed and did not find, named here so the contract can reach them:

- **A way to select one message on the reference page.** `message_subject`, `message_summary` and `message_body` are single strings over a page holding about fifty messages. An action such as `open_message` naming a message in the spec's own vocabulary would make R-6.12, R-6.16, R-6.18 and R-6.25 testable through the previews without needing mail bodies at all — and would put R-6.14 and R-6.19 on firmer ground than the page-wide containment they currently rest on.
- **An observation reporting the opt-in control as offered at a narrow width.** The only width-aware observation, `notification_control_hidden_on_narrow_screen`, is worded for the old service's defect. R-6.27 asserts the opposite and I could not express it, because negating a free-text observation is unreliable.
- **A persona or action for a first-time account.** Every persona signs in as an account the seed already holds, so R-6.20 — what a newly created account records before its holder asks for anything — has no subject.
- **An observation of send progress on the terms broadcast.** R-6.24's whole content is that success is reported *before* any message is sent; with only `notify_vendors_success` to read, the available check is a race against the background sending, not a test of it.
- **An observation of whether the signed-in person watches an opportunity.** For R-6.17 I had to prove watch retention through the owner's `reporting_watchers` count, signing in as an administrator to read it. A watch-state observation on the opportunity view would say directly what the criterion claims.

One last thing the next contract revision should settle: every observation is `Promise<string>` with no stated vocabulary for the many that read as yes/no predicates. I asserted them affirmatively (`toBeTruthy`) and avoided asserting their negation anywhere, because a wrong guess at "no" versus "false" versus rendered text would fail a correct implementation. That convention is why R-6.27 is an entry rather than a file.
