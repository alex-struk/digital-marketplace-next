---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "Both criteria now have a test file in the notifications domain, and neither has an entry in `not-testable.yaml`."
opened: 2026-09-15T02:14:46.757Z
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** Both criteria now have a test file in the notifications domain, and neither has an entry in `not-testable.yaml`.

Both criteria now have a test file in the notifications domain, and neither has an entry in `not-testable.yaml`. Both files already existed from the last approved derivation, so I rewrote them to the current spec sha instead of starting from nothing. The R-6.28 test only checks part of its criterion, and two parts could not be tested. I couldn't run either test or the typecheck, because this workspace has no installed dependencies. What I did check is that neither file contains anything the separation check refuses.

**R-6.23: announcing changed terms.** This is one test, since the criterion has one given/when/then:
- **Setup:** it signs in as the administrator. It sorts every vendor in the seed into active or deactivated by comparing their profile status badge with the administrator's own. It notes which vendors held a standing acceptance before the announcement, meaning an acceptance notice on their legal settings and no changed-terms warning.
- **Checks on the starting state:** both the active and the deactivated group must contain someone with a standing acceptance. At least one active vendor must have an email address.
- **Action:** it opens the terms broadcast page, chooses to notify vendors and confirms.
- **What it checks:** every vendor who held an acceptance now shows the changed-terms warning, deactivated vendors included. Each active vendor with an address gets a new message whose subject or opening text mentions the terms.

A vendor who already had the warning before the run is left out of the withdrawal check, because the warning couldn't be credited to this announcement. The criterion also says the message offers a link to read and accept the new terms, and the test doesn't check that. The mail fixture returns only a message's subject, a short snippet, the To field and an ID, so a body can't be read. I also rewrote the old comment that justified reading active status from the surface. It pointed to another test leaving an account deactivated, which the per-test reseed has since made out of date. The real reason is that a run without a reset command inherits whatever earlier tests left behind.

**R-6.28: skipping unaddressable recipients.** This criterion makes three claims, and only one can be seen from outside the service. That one is the only test:
- **Tested: "a broadcast to many people always continues past a recipient it cannot address."** The broadcast is the changed-terms announcement.
  - The test first requires the seed's vendor with no email address to show as active.
  - It then requires more than one active vendor with an address.
  - After the broadcast, every active vendor with an address must receive a new message. Any who were missed are listed together.
  - One limit is stated in the file: the send order can't be seen. So this is only evidence while at least one reachable vendor comes after the one without an address. With several reachable vendors, a run that stopped at that recipient would almost certainly miss someone.
- **Not tested: that the service skips such a recipient rather than composing a message addressed to nobody.** This is unobservable, not blocked. A message with no recipient can't arrive in the mail catcher either way, and no page shows the difference. The only trace would be the service's operational log, which a test is not allowed to use. No addition to the contract would change that.
- **Not tested: that a broadcast continues past a recipient it can address but cannot reach.** This is blocked. Every seeded address is one the catcher accepts, and nothing in `surface`, the seed or `mail` makes one delivery fail while others succeed. It would be unblocked by a starting state with one failing delivery. That could be an address the catcher is configured to refuse (Mailpit can restrict which recipients it accepts), named in `observables.yaml` and given to a seeded active vendor.

The rules don't allow a `not-testable.yaml` entry beside a test file. So these two gaps live only in the comments at the top of `R-6.28.spec.ts` and in this entry. Whoever rules on this proposal should decide whether that partial coverage is acceptable.

**What the contract lacks:**
- **A `mail` accessor for one message's body** (the HTML or plain text, which `observables.yaml` already calls `html_body` and `plain_text_body`). R-6.23 needs it to confirm the link to accept the new terms. It is the same gap already recorded for R-6.12, R-6.16 and R-6.18.
- **A way to make one delivery fail**, such as a catcher-refused address given to a seeded vendor. R-6.28 needs it for its "cannot reach" claim.
- **A view of the order a broadcast sends in**, or a seeded state that puts the unaddressable recipient before others. Without it, R-6.28's "continues past" check relies on reachable vendors coming after that recipient, which the test can't confirm.
