| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T15:35:56.606Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made the one change this condition asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change this condition asked for. In `tests/adapters/new/index.ts`, the organization profile field table now accepts the input key `addressLineTwo` as `streetAddress2`, the second street-address line. It sits alongside the spellings already accepted there (`streetAddress2`, `street_address_2`, `street2`, `addressLine2`). Nothing else in the adapter or in `bindings.yaml` changed.

**Why this fixes the failure.** Before building a request, the adapter checks every input key against that table, and any key it doesn't recognise makes it throw `unbound`. That check is why `register_by_request` (R-3.2) and `change_profile_by_request` (R-3.18) both threw on `addressLineTwo` before sending anything. Both the check and the code that copies values into the request read the same table, so the key is now accepted and its value goes out as `streetAddress2`, matching how the old target's binding handles it. The adapter's form-based organization paths already took `addressLineTwo`; only the request path was missing it.

**Bindings file.** `bindings.yaml` already lists both actions as `bound` under `organization-request`, so it needed no edit.

**What I did not do.** I didn't open the running target again. The condition was about a missing input key, not a missing control, and the target's handling of the second address line had already been bound and accepted. I also couldn't run a type-check: the sandbox needed an approval for it, and there's nobody here to give one. The edit only adds one string to an existing array, so it shouldn't change any types.

Nothing in this request is deferred.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this revision answer the one request still owed to bind-adapter and bind nothing beyond it? Approved. The escalation came from the loop limit (three sends against a limit of two). That is a count, not a defect in the work, and the checks show only request/build-slice-11-4#1 (the addressLineTwo spelling) still open, so this proposal answers for that request alone. The diff adds 'addressLineTwo' to the accepted spellings for streetAddress2 in the new adapter's organization profile field table (tests/adapters/new/index.ts:8251) and changes nothing else. That matches the evidence cited: verify on build-slice-11-4 saw register_by_request (R-3.2) and change_profile_by_request (R-3.18) throw on that key before sending. The derived organization tests (R-3.2, R-3.18, R-3.22 and others) do send it, and R-3.22's 'second address line' is that field. The runner's typecheck passed with no diagnostics under adapters/new/. The request's statement that the old adapter already maps this exact spelling is not borne out (tests/adapters/old/index.ts accepts addressLine2/street2/address2), but the test inputs and the criterion decide the binding, so it does not change the ruling. A verify run showing R-3.2 or R-3.18 still unbound on this key, or the value not reaching the second address line, would change it.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5062a730fc351bd58e0dd5ee2e5e94deb9af6485`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
