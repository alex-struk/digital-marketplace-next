---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I rewrote the user-list reader in `tests/adapters/old/index.ts` so that one read of the list now takes well under a second instead of never finishing inside the test's 5-second poll."
opened: 2026-09-29T16:15:59.239Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I rewrote the user-list reader in `tests/adapters/old/index.ts` so that one read of the list now takes well under a second instead of never finishing inside the test's 5-second poll.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the user-list reader in `tests/adapters/old/index.ts` so that one read of the list now takes well under a second instead of never finishing inside the test's 5-second poll. I couldn't typecheck or run the adapter through Playwright because this session needed approval for those commands. I did time the new logic in the browser against the running target, and it read every row in about 0.6 s.

**What was wrong.** Calibration's finding for R-4.14 was about the one function that reads the list, `userTableRows`. Four observations on `user-list` use it: `user_row`, `status_badge`, `account_type` and `admin_check`. Each call did three slow things:
- waited up to 10 s for a status badge to appear;
- scrolled the list with the mouse wheel 400 px at a time, pausing 200 ms after each turn;
- kept going until four turns in a row found nothing new.

With about 147 rows, one read took longer than 5 s, so no call ever returned inside the test's poll.

**What I found on the running target.** I signed in as an administrator through the session route and opened `/users`. Only the table body scrolls: it is about 550 px tall and holds about 7,350 px of rows. The page only draws the rows currently in view, as the old comment said.

**The fix.** The whole read now happens in one pass inside the page:
- It finds the part of the table that scrolls, returns it to the top, then moves it down 80% of its height at a time.
- After each move it waits two animation frames for the new rows to be drawn, then collects them.
- It stops when it reaches the bottom, when a move doesn't scroll any further, or after 3.5 s as a safety limit.
- The wait for the first badge is now 3 s instead of 10 s, so reading a legitimately empty list still returns within the poll.

How rows are recognised and read is unchanged: status, account type, name, and the administrator tick read from the shape of the icon. So are the de-duplication and the output of the four observations.

**Checks.** On the target, the new pass read 147 rows in about 0.6 s, taking 16 steps. A deliberately slower scroll (150 px steps, 120 ms pauses) found the same 147 rows, so the larger steps don't skip any.

`bindings.yaml` didn't need changing: all four observations were already `bound`, and nothing else in the adapter was touched. Every route I opened resolved on the target. I changed nothing outside `tests/adapters/old/`.
