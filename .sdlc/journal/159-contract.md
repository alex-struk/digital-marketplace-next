---
stage: "contract"
title: "contract"
at: "2026-09-28T02:25:52.585Z"
cost: 1.1632392
turns: 33
session: "bed270cd-f168-4a93-bb9d-23d57f2c4361"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

This run opens contract-v10. It fixes only the timing claims the ruler rejected at G1. The pages, personas, seed, API description and the rest of the observables are unchanged from the contract-v9 draft. The oracle started cleanly with the revised override and has been taken down again.

**What the old code shows.** Each of the three hook files (`code-with-us.ts`, and the Sprint With Us and Team With Us equivalents) wraps its closing work in a lodash `throttle` that fires on both the leading and trailing edge. The hook calls that throttled function and returns without awaiting the database work it starts. So the two-second setting spaces out when runs start, one throttle per program. Nothing makes one run wait for the previous one to finish, and nothing bounds how long a run takes. The closing work has already begun when the hook returns, but it can finish before or after the response is sent.

**What changed, in three places:**

- **`spec/contract/observables.yaml`, `scheduled_transitions`:**
  - The note now says the throttle limits starts, one throttle per program. It says in so many words that it does not serialize completions, so runs can overlap and a closure has no time limit.
  - The earlier 42-request burst that completed without the database connection pool filling up is described as evidence the throttle works as a mitigation, not as a guarantee.
  - Asynchronous work and response ordering now have a note of their own: the trigger's answer says nothing about whether the closure has happened.
  - A bounded polling procedure replaces "allowing a few seconds":
    1. Request the trigger.
    2. Read the opportunity's status every 500 ms.
    3. Trigger again whenever three seconds pass since the last trigger without a change.
    4. Stop when the expected closed status appears.
    5. After 30 seconds from the first trigger, fail the test. The failure reports the last status read, how many triggers were sent and what each answered. The test must not assert anything that depends on the closure.

    The 30 seconds is the test's own budget. It sits below the pool's 60-second timeout for handing out a connection, and the note says the application does not promise it.
- **`.sdlc/oracle/compose.yml`:** the comment on `UPDATE_HOOK_THROTTLE: "2000"` now makes the same distinctions. It calls two seconds a mitigation and points to the polling procedure. The setting itself is unchanged.
- **`spec/contract/surface.yaml`:** the comment on `scheduled-transition-trigger` no longer says "the closure follows within seconds". It points to the polling procedure instead.

The seed files' comments only state that the interval is two seconds, which is true, so I left them alone.

**Whether the oracle started.** `oracle up` ran all 78 migrations, and the app came up at `http://localhost:4300` with the mail API on 8025. Reading the seeded record `opportunities.cwuLapsedWithDraft` through `/api/opportunities/code-with-us/<id>` returned it as `PUBLISHED` with its past deadline, so the seed is visible through the application. I then requested `/status`, which answered 200, and read the record again: it showed `EVALUATION`, so the procedure ended at step 4. That is one run. It shows the procedure works on the oracle, not that closures are always that fast. `oracle down` completed.

Two tool limits applied. The shell refused variable expansion, so I ran the CLI by its resolved path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`, not through `$SDLC_BIN`. Running my own polling script needed approval, so I did the check with single HTTP requests.

**Carried unchanged from contract-v9:** 44 pages across the domains; sign-in via the session route for every signed-in persona, and `sign_in: null` for the anonymous visitor; the seed files `001`–`009` with `tests/seed/manifest.yaml`; `openapi.yaml`, recovered from the old application's routes; and email observed through mailpit at `${SDLC_MAIL_API}`.

**Obligations still owed by this stage.** I am writing no re-address line for either, because I supplied neither:

- **missing-test/R-6.1 (notifications switched off):** this needs a second target started with `DISABLE_NOTIFICATIONS=1`, or a harness variable that selects one. The service reads that setting once at start-up, and the oracle runs with notifications on so every other mail criterion can be tested. Nothing in the contract can reconfigure a running target. Supplying this needs the harness to host a second oracle configuration, which is not this stage's to add.
- **missing-test/R-6.24 (success reported before any message is sent):** this needs a way to hold or slow the mail catcher's acceptance of messages. The pinned mailpit version exposes no such control here, and the application reports no send progress. Any check made at the moment success appears would race the background sending. As the revised notes now say, the lack of ordering guarantees is itself a recovered property, so this criterion may need a ruling on whether "before" is observable at all.

## Fix turn

I fixed the one YAML error the check reported in `spec/contract/observables.yaml` and changed nothing else. I couldn't run a YAML parser to confirm the fix, because both attempts to run one needed approval. The next stage's YAML check is the real confirmation.

**The error:** line 222 starts the bounded polling procedure for deadline closures. It ended with "…this bounded procedure, and only this one:". YAML treats a colon at the end of a line as the start of a key, so the file would not parse. I replaced that colon with an em dash ("…and only this one —"). The wording of the procedure is otherwise the same: it still polls the status every 500 milliseconds, re-requests the trigger after three seconds without a change, and fails the test after thirty seconds instead of assuming the closure happened.

**Other checks:** I searched the file for the same pattern elsewhere, and for ` #`, which YAML would read as the start of a comment. Every other mid-line colon is either a real key or sits inside a `>-` folded block, where colons are allowed. No ` #` turned up.

**Journal addition:** This run fixed the one YAML parse error the automated check named in `spec/contract/observables.yaml`. The plain-text list item that introduces the bounded polling procedure ended its first line with a colon, which YAML reads as a key. That colon is now an em dash, and the wording of the procedure, the rest of the observables file, the compose commentary and every other contract file are unchanged. A search of the file found no other colon or comment marker that would be misread, but no parser was run on the file this run, so the next stage's YAML check is the confirmation. R-6.1 and R-6.24 are unchanged, and their missing-test obligations are still owed by this stage.