---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "Of the 30 users criteria, 25 now have a test file and 5 are recorded in `tests/acceptance/not-testable.yaml` (4 blocked, 1 unobservable)."
opened: 2026-09-14T02:05:13.899Z
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** Of the 30 users criteria, 25 now have a test file and 5 are recorded in `tests/acceptance/not-testable.yaml` (4 blocked, 1 unobservable).

Of the 30 users criteria, 25 now have a test file and 5 are recorded in `tests/acceptance/not-testable.yaml` (4 blocked, 1 unobservable). Nothing has been run or type-checked: there is no TypeScript compiler in the workspace, and running the YAML parser needed approval I didn't have. I checked instead that no user test contains a pattern the separation check refuses, re-read the YAML by eye, and confirmed no criterion has both a test file and an entry.

**Why every file was rewritten.** The workspace held tests from the last approved derivation, and they no longer match the contract. Profile pages are now split in two: `userProfile` and its capabilities, notifications and legal pages require a `userId`, while the new `userProfileSelf` family takes no identifier. Many old tests opened `userProfile` with no parameter or with a `user` key. They now use the `userProfileSelf` pages for a person's own account and pass `seed.users.<handle>.id` otherwise. Every file carries the new header date. Where the new surface offered something better, I used it:
- `userProfileSelf.signInRequired` confirms the session has ended in R-4.4, R-4.9 and R-4.17.
- The unsubscribe landing page's `resolvesToSignedInPerson` and `confirmationNamesSignedInAddress` now do that job in R-4.29.
- One snag in R-4.12: the permissions label and administrator box exist only on `userProfile`, so the employee opens their own account by its seed id.

**Criteria where only part is tested** (the comment at the top of each file says which part):
- **R-4.6:** only the edit collision; a first sign-in with a duplicate address can't be produced.
- **R-4.17:** the identity provider's session isn't observable, and nothing makes a sign-out fail.
- **R-4.18, R-4.19, R-4.31:** the service-side refusals the criteria describe, plus R-4.31's "already inactive" refusal, have no action that sends the request another way.
- **R-4.22:** a first-time person, and returning to the page sign-in started from, are out of reach.
- **R-4.30, R-4.9:** the recorded date and the deactivating administrator are shown by no observation.
- **R-4.32:** the exported file's contents are returned by no observation.
- **R-4.3, R-4.16:** the older "last accepted any terms" date is not shown separately.
- **Email wording:** R-4.5, R-4.9 and R-4.30 check only that a message arrived, not what it says.

**Weak assertions.** Some checks look for a word in the profile section's text ("Edit", "Deactivate", "Reactivate", "signing in"), because no observation reports those controls directly. R-4.18, R-4.19, R-4.30 and R-4.31 depend on this, and R-4.9 has one such check. These carry over from the approved derivation, but they are brittle.

**Not testable.** I rewrote the five existing users entries so each starts with its classification and says what would unblock it:
- **R-4.1, blocked:** no persona signs in for the first time. It needs sandbox identities with no seeded account (government, code-hosting, and one of neither kind), plus a way to reset them before each run.
- **R-4.2, blocked:** it needs the same first-time personas, one without an email address. It also needs a mail accessor that lists every message; `observables.yaml` names `read_messages`, but the mail fixture can only search by recipient.
- **R-4.13, unobservable:** the claim is that no way to create an administrator exists anywhere, and no addition to the contract could show that.
- **R-4.20, blocked:** the two reactivation messages differ only in wording. It needs a mail accessor for one message's body (`read_one_message`, returning `Text` or `HTML`). I considered the snippet the search returns and rejected it, because the mail catcher cuts it at a length of its own.
- **R-4.21, blocked:** it needs `user-list.refused_for_non_administrator`, reported to both a non-administrator employee and a signed-out visitor, or a `refusals` entry for the user-list request in `observables.yaml`.

**Missing from the contract, by name:**
1. A first-time identity for each account kind.
2. Mail accessors for listing all messages and for reading one message's body, which would also make the email-wording halves above testable.
3. `user-list.refused_for_non_administrator`.
4. An observation of an account's deactivation date and who deactivated it.
5. An observation of the exported contact-list document.
6. Observations of the profile's edit, deactivate and reactivate controls, to replace the word checks.
7. An action that requests deactivation or reactivation, or submits a profile change, other than through the control on screen.
8. A way to begin sign-in from a given page.
