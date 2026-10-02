| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T13:39:06.760Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 9 (An opportunity's author and administrators can run it after publication) do what its criteria say?

**Recommendation.** Running the sandbox (`docker compose`) needed an approval nobody was here to give, so I never ran the acceptance flow.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've changed what the ruling named, but I couldn't reproduce either failure. Running the sandbox (`docker compose`) needed an approval nobody was here to give, so I never ran the acceptance flow. The fix is my best reading of what went wrong, from the code and the record of the earlier attempt. `npm --prefix app run check` passes: migrations 16 tests, backend 456, frontend 290.

**R-4.9 (deactivating your own account ends your session at once).** This passed at slice 3. The last slice 9 attempt then changed one thing on this path: the account's deactivation notice was delivered *before* the deactivation was answered, waiting up to five seconds on the mail server. That held up both the answer and the end of the session, which comes after it, and "at once" doesn't allow that. I've put it back the way slice 3 had it: the account is deactivated, the session ends, the answer goes back, and the notice is sent afterwards. The blocking method (`Mailer.sendBeforeAnswering`) and its tests are gone.

**R-6.17 (a deactivated account is sent nothing).** Every list of recipients already left out inactive accounts, and the blocking change above didn't fix the failure, so the leak is probably a matter of timing rather than a missing filter. I closed it in two places:

- **The mailer now checks as it sends.** Before each message goes, it looks the addresses up and drops any held only by inactive accounts (`app/backend/src/mail/prisma-recipient-standing.ts`). That covers every kind of message and however long ago its recipients were chosen. The only exceptions are the two notices telling a person their own account has been deactivated, which R-4.9 and R-4.30 require. An address that an active account also holds is kept. If the accounts can't be read, the message isn't sent and only the log records it.
- **Recipients are fixed at the moment of the change.** Cancelling, adding an addendum and an administrator's edit now look up watchers, proposers and the author before the change is answered; only the sending happens afterwards. Someone deactivated or reactivated a moment later is treated as they were at the time of the change. The watch rows themselves are never touched, so reactivating an account finds its watches where they were.

**Tests.** New unit tests cover the mailer's check:
- a deactivated address is dropped from a batch while the others still get it;
- a message whose only recipient is deactivated isn't sent;
- the two deactivation notices still arrive;
- a failed lookup sends nothing.

The end-to-end R-6.17 test now waits for the deactivation notice, sent after the answer, instead of expecting it to be there already. That test runs against a real Postgres, so it also exercises the new account lookup.

**Records.** Decision record 0044 sets this out. I trimmed 0043's paragraph about sending the notice before answering and pointed it to 0044. The rest of slice 9 (addenda, notes, cancellation, reporting figures, history) is unchanged.

**What I couldn't settle.** If R-6.17's test counts the deactivation notice itself when it lands after the test's own starting point, no build can pass it alongside R-4.9 and R-4.30, which both require that email. I couldn't tell whether that's the case without the test or a running sandbox. If R-6.17 comes back failing the same way, that conflict between the criteria needs a ruling outside this stage. Nothing outside `app/` and `docs/decisions/` was changed. I ran `npm ci` to get the checks going and removed `app/node_modules` afterwards.

The next slice will find the mailer now needs the database service, because it reads account status as it sends. Any new message that must still reach a deactivated account has to be added to `TOLD_OF_DEACTIVATION` in `app/backend/src/mail/mailer.ts`.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 9 do what its criteria say, given that runner:verify escalated after three failed builds because the failures may not be the application's? Ruling: return. The verify result rules out approval (R-6.17 failed), and each failure belongs to a stage that can be named, so this is not a pipeline matter to escalate. R-6.17's three cases all failed at the same check (line 113), and the cause is in the test: arrangeGiven deactivates the watcher through confirmActivationChange, the test calls mail.clear() at once, and everyRecipient then counts every message to the deactivated address. The account-deactivated notice that R-4.30 requires must go out after the answer, because R-4.9 ends the session at once, so it can land after the clear and is counted as a leak. That is the conflict the builder named and could not confirm. The test asks for something R-6.17 never did, and no build can pass it alongside R-4.9 and R-4.30. R-1.20's test likewise requires a Publish or Submit for review control to be offered on a cancelled opportunity, but the criterion asks only that such a request is refused and the state stays as it was, which a screen meets by not offering the control. R-1.35 and R-1.36 never ran because their tests submit proposals through proposal-cwu-create, a screen this build serves to nobody: slice 9 claims criteria whose tests depend on a later slice. R-1.33 v2 says no screen offers a way to add a private note, yet the build renders NoteForm on the History tab of opportunity-cwu-edit.tsx:334 and opportunity-other-manage.tsx:206. That part is the build's to fix, while the surface and the seed that keep R-1.33 untestable belong upstream. The mailer's delivery-time check, which drops addresses held only by deactivated accounts, together with recipients chosen before the answer, is a sound reading of R-6.17, and R-1.28, R-1.30 and R-1.32 passed. What would change the ruling: a regenerated R-6.17 test that waits for the deactivation notice before clearing and still finds the deactivated watcher reached, which would make R-6.17 the application's fault again; or, once the conditions below are met and the regenerated tests bind and pass, approval.

**Conditions:**
- test-overreaches R-6.17: the test calls mail.clear() straight after confirmActivationChange and then counts every message to the deactivated address, so the account-deactivated notice that R-4.30 requires, which must be sent after the answer because R-4.9 ends the session at once, can arrive after the clear and be counted as a leak. The test must wait until that notice has been caught before clearing, or leave that one message out, and then assert that nothing about the opportunity reaches the deactivated account.
- test-overreaches R-1.20: both tests cancel an opportunity and then require a Publish or Submit for review control to be offered on it, through opportunityCwuEdit.publish() and submitForReview(). The criterion asks only that a request for a change that is not permitted is refused and the state is unchanged, which a screen meets by not offering the control at all. The test should make the request without depending on the screen offering the control, for example through the service, and then check that the state is unchanged.
- addressed-to plan: slice 9 claims R-1.35 and R-1.36, but their tests arrange the given by submitting a Code With Us proposal through proposal-cwu-create, a screen the slice 9 build serves to nobody (signed-in people are sent to /dashboard), so verify found both unbound. Move R-1.35 and R-1.36 into, or after, the slice that builds the Code With Us proposal screen.
- addressed-to design: R-1.33 v2 says no screen of the application offers a way to add a private note, yet the opportunity-cwu-edit and opportunity-swu-edit surfaces still declare add_note. Verify found R-1.33 not testable because a test acting through that control would contradict the criterion. Remove add_note from both surfaces.
- addressed-to contract: R-1.33 can only be checked against a note already on an opportunity's history and who may read it, and verify found no seeded opportunity carrying one. Add a seeded Code With Us opportunity whose history holds a private note with an attached file, so that its visibility to the author and administrators only can be asserted without a screen.
- Remove the private-note form, NoteForm, from the History tab of app/frontend/src/screens/opportunity-cwu-edit.tsx (line 334) and app/frontend/src/screens/opportunity-other-manage.tsx (line 206), along with the addNote action they wire up, because R-1.33 v2 says no screen offers a way to add a note. Keep the service's addNote and the history's display of notes and their files, and update app/README.md, which describes adding a note on the History tab.
