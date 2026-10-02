| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T16:22:51.899Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the two new request pages to the "old" adapter.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the two new request pages to the "old" adapter. All 11 members are bound in `tests/adapters/old/index.ts` and named in `tests/adapters/old/bindings.yaml`, spelled as `surface.yaml` spells them. None are unbound. The bindings from the earlier contract are unchanged.

I could not typecheck. Running `tsc` on the test project needed an approval this session couldn't give, so the code has only been read over by hand. I checked that every helper it uses is defined in the file.

**How I learned the target.** Both pages are requests to the service's own interface, not screens. I signed in as the administrator, as a vendor, and signed out, and sent requests from the browser to `/api/opportunities/<program>/<id>` against seeded records. Both routes resolve on the old target.

- **Reading:** the administrator, and a request with no session, are answered with a `history` list for the seeded opportunity with a private note. It is newest first, and each entry has a kind, a note, who made it, when, and attached files with names and identifiers. A signed-in vendor gets the opportunity with no `history` key at all.
- **Adding a note:** the service takes `{ tag: "addNote", value: { note, attachments: [ids] } }`.
  - A 1,001-character note is refused with 400 and "Status Note must be between 0 and 1000 characters long."
  - An unknown attachment is refused with 400 and "Invalid identifier provided."
  - A vendor is refused with 401 and the general permission message.
- **Changing status:** there is no "set status" operation, so the adapter maps each status to its own operation: under review to submit for review, published to publish, cancelled to cancel, and the three evaluation stages to their start operations.
  - Publishing the awarded Code With Us, awarded Sprint With Us and cancelled seeds was each refused 401 with the general permission message.
  - Asking Code With Us to start a code challenge, an operation that program doesn't have, was refused 400 with a body naming only `parseFailure` and no message text.

**What the adapter does on each page.**
- **History page:** opening it records the opportunity and clears any earlier answer. Adding a note sends the note text and the attachments, turning seed file handles into identifiers; it throws `unbound:` if the input has no note text.
- **Status page:** the action throws `unbound:` for a status no operation leads to. A cancellation sends its reason, or "Cancelled by request." if the test gave none.
- **Reading the opportunity:** whether history is shown, the history entries (one per line, fields separated by " | ") and the stored status are all read fresh from the service each time. That way, reading them doesn't replace the answer to the change just made, which the "accepted", refusal-status and refusal-message readers still need.
- **Refusals:** if the service won't show the opportunity at all (401, 403 or 404), that counts as reaching it and seeing nothing, so the readers return empty rather than unbound. Refusal messages come back in the service's order. A refusal with no message text, like the `parseFailure` one, reads as the name the service gave it.

**I changed a seeded record by mistake.** One probe sent the note as a bare string instead of an object, and the old service accepted it. That added an empty note, made by the administrator, to the top of the history of the seeded opportunity with a private note. Its history now holds four entries instead of the three the seed manifest describes. There is no request that removes a note, so it is still there. If the seed isn't reloaded before calibration, a test that expects the seeded note to be the newest entry will see this extra one first. All my other probes either changed nothing or were refused.

I made no changes outside `tests/adapters/old/`, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every action and observation on opportunity-history-request and opportunity-status-request, and nothing else? Approved. All 11 members in spec/contract/surface.yaml are bound in tests/adapters/old/index.ts and named in bindings.yaml with surface.yaml's spelling, and none is unbound. The runner's own typecheck of the proposal revision reports no diagnostics under adapters/old/; the one failure is in adapters/new/, which this proposal does not answer for. Every helper the new code calls (seededId, nothing, accountAnswer, send, given, fileIdFor, lastRefusal, answer, accepted) is defined in the file. The bindings send requests and read answers and decide nothing: STATUS_TAGS is the status-to-operation table that surface.yaml itself gives; treating a 401/403/404 read as 'shown nothing' is what history_shown is defined to report for a reader the service will not show it to; history kinds pass the service's own value through, and that value is NOTE_ADDED, the word the contract names; a refusal with no message text reads as the service's own tag. Nothing under tests/acceptance or any protected path changed. One outside effect is not a fault in the code: a test request added a blank administrator note to the seed opportunity cwuWithPrivateNote on the running oracle, and the seed must be reloaded before calibration or a test expecting the seeded note to be newest will see the extra entry first. No acceptance test calls these pages yet; R-1.20 stays on its existing missing-test entry, owed by derive-tests. build-slice-9-3#6 is work for build on the application and this proposal does not settle it, so it stays open. What would change this ruling: typecheck errors under adapters/old/, or a calibration showing a binding reads something other than what its observation names.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `3dcb9382ff8633ed37a3957de313e22d4bab464a`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
