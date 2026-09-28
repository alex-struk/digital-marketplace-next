| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-28T04:06:53.292Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** Waiting on the oracle; I'll be notified when it finishes or fails.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Waiting on the oracle; I'll be notified when it finishes or fails.

## Fix turn

I fixed the five handles under `new_opportunity_notices` in `tests/seed/manifest.yaml` that failed the check. Each was a bare list, map or number, and the check needs a handle to be a string or an object with an `id`.

- **`receive_the_announcement`** is now an object with an `id` of `seed-notices-receive-the-announcement`. Its 19 user handles moved unchanged under `members`.
- **`do_not_receive`** is now an object with an `id` of `seed-notices-do-not-receive`. Its four users and the reason each one misses the announcement moved unchanged under `members`.
- **`selected`, `with_an_address` and `batches`** are now objects with `id`s of `seed-notices-selected`, `seed-notices-with-an-address` and `seed-notices-batches`. Their values (140, 139 and 3) moved under `count`.

These handles describe groups of accounts, not single database rows, so their `id`s are descriptive labels rather than UUIDs. They follow the same pattern as the existing `subscribers.group` handle, whose `id` is `seed-subscriber-*`.

Nothing else in the manifest, the seed SQL or the rest of the contract changed. I wasn't allowed to run a YAML parser here, so I checked the edited block by reading it back; the indentation and nesting look right, but the manifest check hasn't been re-run.

**Journal addition:** Five handles under `new_opportunity_notices` in `tests/seed/manifest.yaml` failed the manifest check, which requires every handle to be a string or an object with an `id`. I made each one an object with a descriptive `id` (`seed-notices-receive-the-announcement`, `seed-notices-do-not-receive`, `seed-notices-selected`, `seed-notices-with-an-address` and `seed-notices-batches`). The existing contents moved underneath unchanged: the recipient list and the not-reached accounts with their reasons under `members`, and the figures 140, 139 and 3 under `count`. These handles name groups of accounts rather than single rows, so the ids are labels, as with `subscribers.group`. Nothing else in the manifest, the seed SQL or the contract changed. A parser could not be run in this session, so the edit was checked by reading it back, not by re-running the check.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: is this the contract the tests will act through? Ruling: approve. The contract adds a setup for each of two criteria that could not be tested before. R-6.1 needs a service started with notifications switched off, which the oracle now does when SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 is set; the contract says that instance serves R-6.1 alone and is never shared with the suite. R-6.24 needs messages to still be on their way when success is reported, which a pass-through mail proxy now provides by answering every reply three seconds late, under the application's five-second greeting timeout, so a slow server never turns into a refusing one. With no delay set the proxy passes everything through unchanged, and notifications default to on, so no other criterion is measured differently. The seed manifest fix changes only the shape of five handles, not their contents, and now names the nineteen accounts outside the subscriber group that are due the announcement. No criterion conditions: R-6.1 and R-6.24 are already confirmed and their wording is unchanged. The four owed instructions from derive-tests-opportunities-stale-4 stay open: #1 to #3 ask for test changes this proposal does not make, and #4 is moot in substance because the seed now names the nineteen accounts, but withdrawing it belongs to the next derive-tests ruling on R-1.34, which should also have the test assert them. Before the next stage runs, tests/generated/surface.d.ts and tests/generated/seed.ts must be regenerated with sdlc, because the generated check fails against the new contract, and the manifest check has not been re-run on the edited handles. What would change the ruling: either check still failing after regeneration, or the three-second delay proving able to trip the greeting timeout.

**Conditions:**
none
