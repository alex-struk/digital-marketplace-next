| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T12:39:34.739Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 9 (An opportunity's author and administrators can run it after publication) do what its criteria say?

**Recommendation.** I changed when the deactivation email is sent, which is my best explanation for the R-6.17 failure.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed when the deactivation email is sent, which is my best explanation for the R-6.17 failure. I couldn't confirm it: the ruling describes the failure but not the steps that led to it, and I couldn't run the full stack here because starting it needed approval that never came. So it is unproven until the acceptance suite runs again.

**What I found.** Every list of people the service emails about a running opportunity already takes only active accounts. That holds for watchers, proposers and the author, on addenda, edits and cancellation, in all three programs. So a watcher who is already deactivated when the addendum or cancellation happens is never addressed, and a code path that ignores deactivation isn't the cause.

The one message that does go to an account as it is deactivated is the deactivation notice itself. Two existing criteria require it: R-4.9 when people deactivate their own account, and R-4.30 when an administrator does it. Like every other message, it was handed to the mailer only after the request had been answered. That means it could reach the mail catcher after the deactivation reply had already gone back. A check that gathers mail arriving after the deactivation, such as the one in the ruling, would then find the watcher among the recipients. I think that is what happened.

**What I changed.**
- **New mailer method:** `sendBeforeAnswering` in `app/backend/src/mail/mailer.ts` delivers a message before the reply goes back. It waits at most five seconds for the mail server and never throws, so a refused or hung delivery only goes to the log and the deactivation still succeeds, as R-6.2 requires.
- **Deactivation notices:** both of them, in `app/backend/src/users/accounts.service.ts`, now go out this way. By the time a deactivation is answered, its notice has been delivered, and nothing later goes to that account.
- **Unchanged:** every other message still goes out after the reply, and deactivating an account still leaves its watches in place, so reactivating it brings them back.

**Tests.** `npm --prefix app run check` passes: typecheck plus all three packages' unit tests. I first had to install dependencies with `npm ci`, because the workspace had none and `tsc` wasn't found.
- `app/backend/tests/mail.test.ts` has three new tests for `sendBeforeAnswering`: the message has reached the mail server when it returns, a refused delivery doesn't throw, and a mail server that never answers is waited on only up to the limit.
- `app/backend/tests/running-opportunities-end-to-end.test.ts`: the existing R-6.17 test now checks that the deactivation notice has already been caught the moment the deactivation is answered, instead of waiting for it to turn up.
- `app/backend/tests/accounts-service.test.ts`: the stand-in mailer gained the new method.

**Records.** I added a paragraph to `docs/decisions/0043-running-an-opportunity-after-publication.md` explaining why this notice, unlike all the others, is sent before the reply.

**Not done or not checked.**
- If the acceptance test instead counts mail from before the deactivation request is sent, then the required deactivation notice itself would fail it. In that case R-6.17 would conflict with R-4.9 and R-4.30, which is for the spec stage to settle, not this one.
- The other slice-9 criteria were not named in the ruling, and I left them as they were.
- I didn't touch anything outside `app/` and `docs/decisions/`.

_Ruled: return by runner:verify_
